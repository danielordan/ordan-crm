import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/app-setup';
import { createTestDatabase, dropTestDatabase } from './db';

const KEY = process.env.BACKEND_API_KEY as string;

describe('POST /api/v1/users/google-sign-in (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool | undefined;

  const signIn = (body: object) =>
    request(app.getHttpServer())
      .post('/api/v1/users/google-sign-in')
      .set('X-API-Key', KEY)
      .send(body);

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

  it('creates the user on first sign-in and updates it on the next, without duplicates', async () => {
    const first = await signIn({ googleId: 'g-1', email: 'dana@example.com', name: 'Dana' }).expect(
      200,
    );
    expect(first.body).toEqual({ id: expect.any(String), email: 'dana@example.com', name: 'Dana' });

    const again = await signIn({ googleId: 'g-1', email: 'dana@new.com', name: null }).expect(200);
    expect(again.body).toEqual({ id: first.body.id, email: 'dana@new.com', name: null });

    const { rows } = await pool!.query('SELECT * FROM users WHERE google_id = $1', ['g-1']);
    expect(rows).toHaveLength(1);
    expect(rows[0].date_added).toBeInstanceOf(Date);
  });

  it('handles concurrent first sign-ins without duplicates', async () => {
    const body = { googleId: 'g-2', email: 'eli@example.com', name: 'Eli' };
    const results = await Promise.all([signIn(body), signIn(body), signIn(body)]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    const { rows } = await pool!.query('SELECT id FROM users WHERE google_id = $1', ['g-2']);
    expect(rows).toHaveLength(1);
  });

  it.each([{ email: 'a@b.com' }, { googleId: 'g-3' }, { googleId: '', email: 'a@b.com' }])(
    'returns 400 for %p',
    async (body) => {
      const res = await signIn(body).expect(400);
      expect(res.body.error).toBe('BAD_REQUEST');
    },
  );

  it('stores no password column', async () => {
    const { rows } = await pool!.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'users'`,
    );
    expect(rows.map((r) => r.column_name).sort()).toEqual([
      'date_added',
      'email',
      'google_id',
      'id',
      'name',
    ]);
  });
});
