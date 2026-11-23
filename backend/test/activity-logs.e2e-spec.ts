import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/app-setup';
import { ShipmentDataExtractor } from '../src/extraction/ai-extraction.service';
import { ExtractionError } from '../src/extraction/extraction.errors';
import type { ExtractedData } from '../src/extraction/extraction.schema';
import { DocumentTextExtractor } from '../src/extraction/pdf-text.service';
import { createTestDatabase, dropTestDatabase, insertClients, testClient } from './db';

const KEY = process.env.BACKEND_API_KEY as string;
const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PASSWORD = 'Ordan#Cargo26';
const USERNAME = 'log-tester';
const DOCUMENT_TEXT = 'SECRET-DOCUMENT-TEXT';
const PDF = Buffer.from('%PDF-1.7 synthetic test file');

const complete: ExtractedData = {
  companyName: 'Acme Trading Ltd',
  address: '1 Port Rd, Haifa',
  phone: '+972 3 555 1234',
  email: 'info@acme.com',
  originPort: 'Shanghai',
  originCountry: 'China',
  destinationPort: 'Haifa',
  incoterms: 'FOB',
  shipmentType: 'FCL',
};

interface LogRow {
  user_id: string | null;
  action: string;
  client_id: string | null;
  result: string;
  details: Record<string, unknown> | null;
  request_id: string | null;
  created_at: Date;
}

describe('activity_logs (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool;
  const textExtractor = { extract: jest.fn<Promise<string>, [Buffer]>() };
  const dataExtractor = { extract: jest.fn<Promise<ExtractedData>, [string]>() };

  beforeAll(async () => {
    pool = await createTestDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DocumentTextExtractor)
      .useValue(textExtractor)
      .overrideProvider(ShipmentDataExtractor)
      .useValue(dataExtractor)
      .compile();
    app = moduleRef.createNestApplication<INestApplication<App>>({ bufferLogs: true });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await dropTestDatabase(pool);
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE activity_logs, clients');
    textExtractor.extract.mockReset().mockResolvedValue(DOCUMENT_TEXT);
    dataExtractor.extract.mockReset().mockResolvedValue(complete);
  });

  const api = () => request(app.getHttpServer());
  const post = (path: string, body: object) =>
    api().post(`/api/v1/${path}`).set('X-API-Key', KEY).send(body);
  const upload = () =>
    api()
      .post('/api/v1/documents/process')
      .set('X-API-Key', KEY)
      .set('X-User-Id', ACTOR_ID)
      .set('X-Request-Id', 'req-upload')
      .attach('file', PDF, { filename: 'hbl.pdf', contentType: 'application/pdf' });

  const logs = async () =>
    (await pool.query<LogRow>('SELECT * FROM activity_logs ORDER BY created_at')).rows;

  describe('users', () => {
    let userId: string;

    beforeAll(async () => {
      await pool.query('TRUNCATE users');
    });

    it('records registration with the new user', async () => {
      const res = await post('users/register', { username: USERNAME, password: PASSWORD }).expect(
        201,
      );
      userId = res.body.id;
      const [row] = await logs();
      expect(row).toMatchObject({
        user_id: userId,
        action: 'user_registered',
        client_id: null,
        result: 'success',
        details: { method: 'password' },
        request_id: expect.any(String),
      });
      expect(row.created_at).toBeInstanceOf(Date);
    });

    it('records a password sign-in', async () => {
      await post('users/password-sign-in', { username: USERNAME, password: PASSWORD }).expect(200);
      expect(await logs()).toEqual([
        expect.objectContaining({
          user_id: userId,
          action: 'user_signed_in',
          result: 'success',
          details: { method: 'password' },
        }),
      ]);
    });

    it('records a failed sign-in, with the account owner only when the username exists', async () => {
      await post('users/password-sign-in', { username: USERNAME, password: 'Wrong#Pass99' }).expect(
        401,
      );
      await post('users/password-sign-in', { username: 'nobody', password: PASSWORD }).expect(401);
      expect(await logs()).toEqual([
        expect.objectContaining({
          user_id: userId,
          action: 'password_sign_in_failed',
          result: 'failure',
        }),
        expect.objectContaining({
          user_id: null,
          action: 'password_sign_in_failed',
          result: 'failure',
        }),
      ]);
    });

    it('records a Google sign-in', async () => {
      const res = await post('users/google-sign-in', {
        googleId: 'g-log',
        email: 'dana@example.com',
        name: 'Dana',
      }).expect(200);
      expect(await logs()).toEqual([
        expect.objectContaining({
          user_id: res.body.id,
          action: 'user_signed_in',
          details: { method: 'google' },
        }),
      ]);
    });
  });

  describe('uploads', () => {
    it('records a created Success client', async () => {
      const res = await upload().expect(200);
      expect(await logs()).toEqual([
        expect.objectContaining({
          user_id: ACTOR_ID,
          action: 'client_created',
          client_id: res.body.clientId,
          result: 'success',
          details: { outcome: 'AUTO_SUCCESS', processingStatus: 'Success' },
          request_id: 'req-upload',
        }),
      ]);
    });

    it('records a created Failed client as manual review', async () => {
      dataExtractor.extract.mockResolvedValueOnce({ ...complete, email: null });
      const res = await upload().expect(200);
      expect(await logs()).toEqual([
        expect.objectContaining({
          action: 'client_created',
          client_id: res.body.clientId,
          details: { outcome: 'MANUAL_REVIEW', processingStatus: 'Failed' },
        }),
      ]);
    });

    it('records a duplicate with the existing client', async () => {
      const first = await upload().expect(200);
      await pool.query('TRUNCATE activity_logs');
      await upload().expect(200);
      expect(await logs()).toEqual([
        expect.objectContaining({
          user_id: ACTOR_ID,
          action: 'duplicate_detected',
          client_id: first.body.clientId,
          result: 'success',
          details: { outcome: 'DUPLICATE_SKIPPED' },
        }),
      ]);
    });

    it('records an extraction failure with its reason', async () => {
      dataExtractor.extract.mockRejectedValueOnce(new ExtractionError('AI_TIMEOUT'));
      await upload().expect(200);
      expect(await logs()).toEqual([
        expect.objectContaining({
          action: 'extraction_failed',
          client_id: null,
          result: 'failure',
          details: { outcome: 'EXTRACTION_FAILED', reason: 'AI_TIMEOUT' },
        }),
      ]);
    });

    it('records a technical failure', async () => {
      dataExtractor.extract.mockRejectedValueOnce(new Error('unexpected'));
      await upload().expect(500);
      expect(await logs()).toEqual([
        expect.objectContaining({
          action: 'processing_failed',
          result: 'failure',
          details: { outcome: 'TECHNICAL_FAILURE' },
        }),
      ]);
    });
  });

  describe('edit and delete', () => {
    const client = testClient({ companyName: 'Blue Ocean Ltd', email: 'old@blue.com' });

    beforeEach(async () => {
      await insertClients(pool, [client]);
    });

    it('records an edit with the changed field names only', async () => {
      await api()
        .patch(`/api/v1/clients/${client.id}`)
        .set('X-API-Key', KEY)
        .set('X-User-Id', ACTOR_ID)
        .send({ email: 'new@blue.com', phone: '+972 4 555 0000' })
        .expect(200);
      const [row] = await logs();
      expect(row).toMatchObject({
        user_id: ACTOR_ID,
        action: 'client_updated',
        client_id: client.id,
        result: 'success',
        details: {
          changedFields: expect.arrayContaining(['email', 'phone']),
          processingStatus: 'Success',
        },
      });
      expect(row.details?.changedFields).toHaveLength(2);
      expect(JSON.stringify(row)).not.toContain('new@blue.com');
    });

    it('records a deletion with the company name', async () => {
      await api()
        .delete(`/api/v1/clients/${client.id}`)
        .set('X-API-Key', KEY)
        .set('X-User-Id', ACTOR_ID)
        .expect(204);
      expect(await logs()).toEqual([
        expect.objectContaining({
          user_id: ACTOR_ID,
          action: 'client_deleted',
          client_id: client.id,
          result: 'success',
          details: { companyName: 'Blue Ocean Ltd' },
        }),
      ]);
    });

    it('records no user when the X-User-Id header is missing or invalid', async () => {
      await api()
        .delete(`/api/v1/clients/${client.id}`)
        .set('X-API-Key', KEY)
        .set('X-User-Id', 'not-a-uuid')
        .expect(204);
      expect((await logs())[0].user_id).toBeNull();
    });
  });

  it('never stores passwords, usernames or document text', async () => {
    await pool.query('TRUNCATE users');
    await post('users/register', { username: 'secret-user', password: PASSWORD }).expect(201);
    await post('users/password-sign-in', { username: 'secret-user', password: PASSWORD });
    await post('users/password-sign-in', { username: 'secret-user', password: 'Other#Pass99' });
    await upload().expect(200);
    const text = JSON.stringify(await logs());
    for (const secret of [
      PASSWORD,
      'Other#Pass99',
      'secret-user',
      DOCUMENT_TEXT,
      'info@acme.com',
    ]) {
      expect(text).not.toContain(secret);
    }
  });

  // Must run last in this file: it removes the table from the temporary schema
  it('lets every action succeed when the log table cannot be written', async () => {
    await pool.query('DROP TABLE activity_logs');
    const client = testClient();
    await insertClients(pool, [client]);

    await post('users/register', { username: 'no-log-user', password: PASSWORD }).expect(201);
    await post('users/password-sign-in', { username: 'no-log-user', password: PASSWORD }).expect(
      200,
    );
    await post('users/password-sign-in', { username: 'no-log-user', password: 'x' }).expect(401);
    await upload().expect(200);
    await api()
      .patch(`/api/v1/clients/${client.id}`)
      .set('X-API-Key', KEY)
      .send({ address: 'Haifa' })
      .expect(200);
    await api().delete(`/api/v1/clients/${client.id}`).set('X-API-Key', KEY).expect(204);
  });
});
