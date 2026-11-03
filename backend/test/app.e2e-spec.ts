import type { INestApplication } from '@nestjs/common';
import type { Pool } from 'pg';
import { Test } from '@nestjs/testing';
import { getOptionsToken } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/app-setup';
import { createTestDatabase, dropTestDatabase } from './db';

// Set in test/setup-env.ts
const KEY = process.env.BACKEND_API_KEY as string;

async function createApp(rateLimit?: {
  ttl: number;
  limit: number;
}): Promise<INestApplication<App>> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (rateLimit) {
    builder = builder.overrideProvider(getOptionsToken()).useValue([rateLimit]);
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>({ bufferLogs: true });
  configureApp(app);
  await app.init();
  return app;
}

let pool: Pool | undefined;

beforeAll(async () => {
  pool = await createTestDatabase();
});

afterAll(async () => {
  await dropTestDatabase(pool);
});

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 without an API key', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
  });

  it('GET /api/v1/clients without an API key returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/clients').expect(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/users/google-sign-in without an API key returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users/google-sign-in')
      .send({ googleId: '1', email: 'a@b.com' })
      .expect(401);
  });

  it('GET /api/v1/clients with a wrong API key returns 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/clients').set('X-API-Key', 'wrong').expect(401);
  });

  it('GET /api/v1/clients with the correct API key returns 200', async () => {
    await request(app.getHttpServer()).get('/api/v1/clients').set('X-API-Key', KEY).expect(200);
  });

  it('the ping endpoint from Milestone 1 is removed', async () => {
    await request(app.getHttpServer()).get('/api/v1/ping').set('X-API-Key', KEY).expect(404);
  });

  it('unknown routes return 404 in the standard error format', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/does-not-exist')
      .set('X-API-Key', KEY)
      .expect(404);
    expect(res.body).toMatchObject({ error: 'NOT_FOUND' });
    expect(typeof res.body.requestId).toBe('string');
  });

  it('/health is not served under /api/v1', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').set('X-API-Key', KEY).expect(404);
  });

  it('generates a request ID and echoes a provided one', async () => {
    const generated = await request(app.getHttpServer()).get('/health');
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    const echoed = await request(app.getHttpServer()).get('/health').set('X-Request-Id', 'abc-123');
    expect(echoed.headers['x-request-id']).toBe('abc-123');
  });

  it('does not expose the x-powered-by header', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('Rate limiting (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp({ ttl: 60_000, limit: 2 });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 429 after the limit is exceeded', async () => {
    const server = app.getHttpServer();
    await request(server).get('/api/v1/clients').set('X-API-Key', KEY).expect(200);
    await request(server).get('/api/v1/clients').set('X-API-Key', KEY).expect(200);
    const res = await request(server).get('/api/v1/clients').set('X-API-Key', KEY).expect(429);
    expect(res.body.error).toBe('TOO_MANY_REQUESTS');
  });

  it('does not rate limit /health', async () => {
    const server = app.getHttpServer();
    for (let i = 0; i < 4; i++) await request(server).get('/health').expect(200);
  });
});
