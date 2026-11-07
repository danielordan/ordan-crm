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
    expect(first.body).toEqual({
      id: expect.any(String),
      email: 'dana@example.com',
      name: 'Dana',
      username: null,
    });

    const again = await signIn({ googleId: 'g-1', email: 'dana@new.com', name: null }).expect(200);
    expect(again.body).toEqual({
      id: first.body.id,
      email: 'dana@new.com',
      name: null,
      username: null,
    });

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
});

describe('Username + password users (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool | undefined;

  const post = (path: string, body: object) =>
    request(app.getHttpServer()).post(`/api/v1/users/${path}`).set('X-API-Key', KEY).send(body);

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

  it('registers a user and stores only a password hash', async () => {
    const res = await post('register', { username: 'Dana', password: 'secret123' }).expect(201);
    expect(res.body).toEqual({ id: expect.any(String), email: null, name: null, username: 'dana' });

    const { rows } = await pool!.query('SELECT * FROM users WHERE username = $1', ['dana']);
    expect(rows).toHaveLength(1);
    expect(rows[0].password_hash).toMatch(/^scrypt\$/);
    expect(rows[0].password_hash).not.toContain('secret123');
    expect(rows[0].google_id).toBeNull();
  });

  it('rejects a username that is already taken, in any case', async () => {
    await post('register', { username: 'eli', password: 'secret123' }).expect(201);
    const res = await post('register', { username: 'ELI', password: 'other-pass' }).expect(409);
    expect(res.body.error).toBe('USERNAME_TAKEN');
  });

  it.each([
    { username: 'ab', password: 'secret123' },
    { username: 'dana k', password: 'secret123' },
    { username: 'valid_name', password: 'short' },
  ])('returns 400 for registration %p', async (body) => {
    expect((await post('register', body).expect(400)).body.error).toBe('BAD_REQUEST');
  });

  it('signs in with the right password, case-insensitive username', async () => {
    await post('register', { username: 'noa', password: 'secret123' }).expect(201);
    const res = await post('password-sign-in', { username: 'NOA', password: 'secret123' }).expect(
      200,
    );
    expect(res.body).toEqual({ id: expect.any(String), email: null, name: null, username: 'noa' });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it.each([
    { username: 'noa', password: 'wrong-pass' },
    { username: 'nobody', password: 'secret123' },
  ])('returns 401 for wrong credentials %p', async (body) => {
    const res = await post('password-sign-in', body).expect(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('does not let a Google user sign in with a password', async () => {
    await post('google-sign-in', { googleId: 'g-9', email: 'g@example.com' }).expect(200);
    await post('password-sign-in', { username: 'g@example.com', password: 'x' }).expect(401);
  });
});
