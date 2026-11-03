import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/app-setup';
import { createTestDatabase, dropTestDatabase, insertClients, testClient } from './db';

const KEY = process.env.BACKEND_API_KEY as string;

describe('GET /api/v1/clients (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool | undefined;

  const list = (query: Record<string, string> = {}) =>
    request(app.getHttpServer()).get('/api/v1/clients').query(query).set('X-API-Key', KEY);

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

  describe('paging and sorting', () => {
    // 30 clients, one minute apart: Company 1 is the oldest
    const clients = Array.from({ length: 30 }, (_, i) =>
      testClient({
        companyName: `Paging ${String(i + 1).padStart(2, '0')}`,
        dateAdded: new Date(Date.UTC(2026, 5, 1, 8, i)),
      }),
    );

    beforeAll(async () => {
      await insertClients(pool!, clients);
    });

    it('returns 25 newest first by default, with hasNextPage', async () => {
      const res = await list().expect(200);
      expect(res.body).toMatchObject({ page: 1, limit: 25, hasNextPage: true });
      expect(res.body.items).toHaveLength(25);
      expect(res.body.items[0].companyName).toBe('Paging 30');
      expect(res.body.items[24].companyName).toBe('Paging 06');
    });

    it('returns the last page without hasNextPage', async () => {
      const res = await list({ page: '2' }).expect(200);
      expect(res.body.hasNextPage).toBe(false);
      const items = res.body.items as { companyName: string }[];
      expect(items.map((c) => c.companyName)).toEqual([
        'Paging 05',
        'Paging 04',
        'Paging 03',
        'Paging 02',
        'Paging 01',
      ]);
    });

    it('returns an empty page past the end', async () => {
      const res = await list({ page: '5' }).expect(200);
      expect(res.body).toMatchObject({ items: [], page: 5, hasNextPage: false });
    });

    it('sorts oldest first with sortOrder=asc', async () => {
      const res = await list({ sortOrder: 'asc' }).expect(200);
      expect(res.body.items[0].companyName).toBe('Paging 01');
    });

    it('returns only the table fields, with an ISO date', async () => {
      const res = await list().expect(200);
      expect(Object.keys(res.body.items[0]).sort()).toEqual([
        'companyName',
        'dateAdded',
        'email',
        'id',
        'phone',
        'processingStatus',
      ]);
      expect(res.body.items[0].dateAdded).toBe('2026-06-01T08:29:00.000Z');
    });
  });

  describe('search and filter', () => {
    beforeAll(async () => {
      await insertClients(pool!, [
        testClient({
          companyName: 'Blue Ocean Imports',
          email: 'info@blueocean.co.il',
          phone: '+972 3 555 1234',
        }),
        testClient({
          companyName: 'Galil Trading',
          email: 'sales@galil.com',
          phone: '03-777-0000',
        }),
        testClient({
          companyName: '50% Off_Store',
          email: 'deals@store.com',
          processingStatus: 'Failed',
          errorDetails: 'Missing required fields: Incoterms.',
          incoterms: null,
        }),
        testClient({
          companyName: null,
          email: null,
          phone: null,
          address: null,
          processingStatus: 'Failed',
          errorDetails: 'Missing required fields: Company Name, Email.',
        }),
      ]);
    });

    const names = async (query: Record<string, string>) => {
      const res = await list(query).expect(200);
      return (res.body.items as { companyName: string | null }[]).map((c) => c.companyName).sort();
    };

    it('searches company name case-insensitively', async () => {
      expect(await names({ search: 'blue OCEAN' })).toEqual(['Blue Ocean Imports']);
    });

    it('searches email', async () => {
      expect(await names({ search: 'GALIL.com' })).toEqual(['Galil Trading']);
    });

    it('searches phone by digits, including the Israeli local form', async () => {
      expect(await names({ search: '03-555' })).toEqual(['Blue Ocean Imports']);
      expect(await names({ search: '972 3 555' })).toEqual(['Blue Ocean Imports']);
      expect(await names({ search: '037770' })).toEqual(['Galil Trading']);
    });

    it('matches special characters literally', async () => {
      expect(await names({ search: '50%' })).toEqual(['50% Off_Store']);
      expect(await names({ search: '%' })).toEqual(['50% Off_Store']);
      expect(await names({ search: 'f_s' })).toEqual(['50% Off_Store']);
      expect(await names({ search: "o'reilly\\(" })).toEqual([]);
      expect(await names({ search: '.*' })).toEqual([]);
    });

    it('filters by processing status', async () => {
      expect(await names({ processingStatus: 'Success' })).toEqual([
        'Blue Ocean Imports',
        'Galil Trading',
      ]);
      expect((await names({ processingStatus: 'Failed' })).length).toBe(2);
      expect(await names({ processingStatus: 'Failed', search: 'store' })).toEqual([
        '50% Off_Store',
      ]);
    });

    it('returns missing values as null', async () => {
      const res = await list({ processingStatus: 'Failed' }).expect(200);
      const items = res.body.items as { companyName: string | null }[];
      const empty = items.find((c) => c.companyName === null);
      expect(empty).toMatchObject({ companyName: null, email: null, phone: null });
    });
  });

  it.each<Record<string, string>>([
    { page: '0' },
    { page: 'abc' },
    { limit: '100' },
    { sortOrder: 'x' },
    { processingStatus: 'Pending' },
  ])('returns 400 for invalid parameters %p', async (query) => {
    const res = await list(query).expect(400);
    expect(res.body.error).toBe('BAD_REQUEST');
  });

  it('returns 400 for a repeated parameter', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/clients?page=1&page=2')
      .set('X-API-Key', KEY)
      .expect(400);
  });
});
