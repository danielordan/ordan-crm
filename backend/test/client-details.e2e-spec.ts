import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/app-setup';
import type { SeedClient } from '../src/seed/seed-data';
import { createTestDatabase, dropTestDatabase, insertClients, testClient } from './db';

const KEY = process.env.BACKEND_API_KEY as string;
const UNKNOWN_ID = '99999999-0000-4000-8000-000000000000';

describe('/api/v1/clients/:id (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool | undefined;

  const url = (id: string) => `/api/v1/clients/${id}`;
  const get = (id: string) => request(app.getHttpServer()).get(url(id)).set('X-API-Key', KEY);
  const patch = (id: string, body: object) =>
    request(app.getHttpServer()).patch(url(id)).set('X-API-Key', KEY).send(body);
  const remove = (id: string) => request(app.getHttpServer()).delete(url(id)).set('X-API-Key', KEY);

  beforeAll(async () => {
    pool = await createTestDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<INestApplication<App>>({ bufferLogs: true });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await dropTestDatabase(pool);
  });

  const seed = async (...clients: SeedClient[]) => {
    await insertClients(pool!, clients);
    return clients;
  };

  // A client missing incoterms, with its status consistent
  const failedClient = (fields: Partial<SeedClient> = {}) =>
    testClient({
      incoterms: null,
      processingStatus: 'Failed',
      errorDetails: 'Missing required fields: Incoterms.',
      ...fields,
    });

  describe('GET', () => {
    it('returns every field, without the internal columns', async () => {
      const [client] = await seed(
        testClient({
          companyName: 'Acme',
          address: '1 Port Rd',
          phone: '03-555',
          email: 'a@acme.com',
          dateAdded: new Date('2026-07-20T11:32:00.000Z'),
        }),
      );
      const res = await get(client.id).expect(200);
      expect(res.body).toEqual({
        id: client.id,
        companyName: 'Acme',
        address: '1 Port Rd',
        phone: '03-555',
        email: 'a@acme.com',
        originPort: 'Shanghai',
        originCountry: 'China',
        destinationPort: 'Haifa',
        incoterms: 'FOB',
        shipmentType: 'FCL',
        dateAdded: '2026-07-20T11:32:00.000Z',
        processingStatus: 'Success',
        errorDetails: null,
      });
    });

    it('returns 400 for an invalid id and 404 for an unknown client', async () => {
      await get('not-a-uuid').expect(400);
      const res = await get(UNKNOWN_ID).expect(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });

    it('returns 401 without the API key', async () => {
      await request(app.getHttpServer()).get(url(UNKNOWN_ID)).expect(401);
    });
  });

  describe('PATCH: status', () => {
    it('becomes Success and clears error details when required fields are completed', async () => {
      const [client] = await seed(failedClient());
      const res = await patch(client.id, { incoterms: 'CIF' }).expect(200);
      expect(res.body).toMatchObject({
        incoterms: 'CIF',
        processingStatus: 'Success',
        errorDetails: null,
      });
    });

    it('becomes Failed and lists the missing fields when required fields are removed', async () => {
      const [client] = await seed(testClient());
      const res = await patch(client.id, { email: '', shipmentType: null }).expect(200);
      expect(res.body).toMatchObject({
        email: null,
        shipmentType: null,
        processingStatus: 'Failed',
        errorDetails: 'Missing required fields: Email, Shipment Type.',
      });
    });

    it('stays Success when address and phone are emptied', async () => {
      const [client] = await seed(testClient({ address: 'Somewhere', phone: '123' }));
      const res = await patch(client.id, { address: '', phone: '  ' }).expect(200);
      expect(res.body).toMatchObject({ address: null, phone: null, processingStatus: 'Success' });
    });
  });

  describe('PATCH: email and phone format', () => {
    it.each([
      [{ email: 'abc' }, 'email'],
      [{ email: 'name@gmail.co' }, 'email'],
      [{ email: 'na..me@company.com' }, 'email'],
      [{ phone: 'abc' }, 'phone'],
      [{ email: 'abc', phone: '12' }, 'email, phone'],
    ])('rejects %j without saving anything', async (body, fields) => {
      const [client] = await seed(testClient({ address: 'Old' }));
      const res = await patch(client.id, { ...body, address: 'New' }).expect(400);
      expect(res.body.message).toBe(`Invalid value for: ${fields}.`);
      expect((await get(client.id)).body).toMatchObject({
        address: 'Old',
        email: client.email,
        phone: client.phone,
      });
    });

    it('accepts valid values and allows emptying them', async () => {
      const [client] = await seed(testClient());
      await patch(client.id, { email: 'a@acme.com', phone: '+972 3 555 1234' }).expect(200);
      const res = await patch(client.id, { email: '', phone: '' }).expect(200);
      expect(res.body).toMatchObject({ email: null, phone: null });
    });

    it('does not block other edits because of an old value in another format', async () => {
      const [client] = await seed(testClient({ email: 'see document', phone: 'ask office' }));
      const res = await patch(client.id, {
        email: 'see document',
        phone: 'ask office',
        address: 'New',
      }).expect(200);
      expect(res.body.address).toBe('New');
    });
  });

  describe('PATCH: stored values', () => {
    it('saves values exactly as entered and keeps the rest of the client', async () => {
      const [client] = await seed(testClient({ address: 'Old address' }));
      const res = await patch(client.id, { companyName: '  ACME  Ltd ' }).expect(200);
      expect(res.body.companyName).toBe('  ACME  Ltd ');
      expect(res.body.address).toBe('Old address');
      expect((await get(client.id).expect(200)).body.companyName).toBe('  ACME  Ltd ');
    });

    it('updates the normalized columns, so search finds the new values', async () => {
      const [client] = await seed(testClient());
      await patch(client.id, {
        companyName: '  ACME  Ltd ',
        email: ' Sales@ACME.com ',
        phone: '+972 3 555 9999',
      }).expect(200);

      const { rows } = await pool!.query(
        `SELECT company_name_normalized, email_normalized, phone_digits
         FROM clients WHERE id = $1`,
        [client.id],
      );
      expect(rows[0]).toEqual({
        company_name_normalized: 'acme ltd',
        email_normalized: 'sales@acme.com',
        phone_digits: '97235559999',
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/clients')
        .query({ search: '03-555-9999' })
        .set('X-API-Key', KEY)
        .expect(200);
      expect((res.body.items as { id: string }[]).map((c) => c.id)).toEqual([client.id]);
    });

    it('does not change Date Added', async () => {
      const dateAdded = new Date('2026-01-02T03:04:05.000Z');
      const [client] = await seed(testClient({ dateAdded }));
      const res = await patch(client.id, { address: 'New' }).expect(200);
      expect(res.body.dateAdded).toBe(dateAdded.toISOString());
    });

    it('returns 400 for invalid bodies without saving', async () => {
      const [client] = await seed(testClient());
      await patch(client.id, { shipmentType: 'AIR' }).expect(400);
      await patch(client.id, {}).expect(400);
      await patch(client.id, { processingStatus: 'Success' }).expect(400);
      expect((await get(client.id)).body.shipmentType).toBe('FCL');
    });

    it('returns 400 for an invalid id and 404 for an unknown client', async () => {
      await patch('not-a-uuid', { address: 'x' }).expect(400);
      await patch(UNKNOWN_ID, { address: 'x' }).expect(404);
    });
  });

  describe('PATCH: duplicates', () => {
    const expectBlocked = async (id: string, body: object) => {
      const before = (await get(id)).body as object;
      const res = await patch(id, body).expect(409);
      expect(res.body.error).toBe('DUPLICATE_CLIENT');
      expect((await get(id)).body).toEqual(before);
    };

    it('blocks the same company name and email, ignoring case and extra spaces', async () => {
      const [client] = await seed(
        testClient(),
        testClient({ companyName: 'Acme Ltd', email: 'a@acme.com' }),
      );
      await expectBlocked(client.id, { companyName: ' ACME   ltd ', email: 'A@acme.com ' });
    });

    it('blocks the same company name when the edited client has no email', async () => {
      const [client] = await seed(
        testClient({ email: null, companyName: 'Editable' }),
        testClient({ companyName: 'Acme Ltd' }),
      );
      await expectBlocked(client.id, { companyName: 'Acme Ltd' });
    });

    it('blocks the same email when the edited client has no company name', async () => {
      const [client] = await seed(
        testClient({ companyName: null, email: 'editable@x.com' }),
        testClient({ email: 'a@acme.com' }),
      );
      await expectBlocked(client.id, { email: 'a@acme.com' });
    });

    it('allows the same company name with a different email', async () => {
      const [client] = await seed(
        testClient({ companyName: 'Editable', email: 'mine@x.com' }),
        testClient({ companyName: 'Acme Ltd', email: 'a@acme.com' }),
      );
      await patch(client.id, { companyName: 'Acme Ltd' }).expect(200);
    });

    it('does not treat a client as a duplicate of itself', async () => {
      const [client] = await seed(testClient({ companyName: 'Acme Ltd', email: 'a@acme.com' }));
      await patch(client.id, { companyName: 'ACME LTD', email: 'A@ACME.COM' }).expect(200);
    });

    it('skips the duplicate check when company name and email are both empty', async () => {
      const [client] = await seed(testClient(), testClient({ companyName: null, email: null }));
      await patch(client.id, { companyName: null, email: null }).expect(200);
    });

    it('allows edits of other fields on a client that already resembles another', async () => {
      // Valid by the creation rules: the second client's name + email pair is unique
      const [client] = await seed(
        testClient({ companyName: 'Acme Ltd', email: null }),
        testClient({ companyName: 'Acme Ltd', email: 'a@acme.com' }),
      );
      await patch(client.id, { phone: '03-555-1234' }).expect(200);
    });
  });

  describe('DELETE', () => {
    it('deletes the client and only that client', async () => {
      const [client, other] = await seed(testClient(), testClient());
      const res = await remove(client.id).expect(204);
      expect(res.text).toBe('');
      await get(client.id).expect(404);
      await get(other.id).expect(200);
    });

    it('returns 404 when deleting again, and 400 for an invalid id', async () => {
      const [client] = await seed(testClient());
      await remove(client.id).expect(204);
      await remove(client.id).expect(404);
      await remove('not-a-uuid').expect(400);
    });
  });
});
