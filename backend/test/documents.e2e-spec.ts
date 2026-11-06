import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import type { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DuplicateDetectionService } from '../src/clients/duplicate-detection.service';
import { configureApp } from '../src/common/app-setup';
import { ShipmentDataExtractor } from '../src/extraction/ai-extraction.service';
import { ExtractionError } from '../src/extraction/extraction.errors';
import type { ExtractedData } from '../src/extraction/extraction.schema';
import { DocumentTextExtractor } from '../src/extraction/pdf-text.service';
import { createTestDatabase, dropTestDatabase } from './db';

const KEY = process.env.BACKEND_API_KEY as string;
const DOCUMENT_TEXT = 'SECRET-DOCUMENT-TEXT';
const PDF = Buffer.from('%PDF-1.7 synthetic test file');
const MAX_UPLOAD_BYTES = 4194304;

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

describe('POST /api/v1/documents/process (e2e)', () => {
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
    await pool.query('TRUNCATE clients');
    jest.restoreAllMocks();
    textExtractor.extract.mockReset().mockResolvedValue(DOCUMENT_TEXT);
    dataExtractor.extract.mockReset().mockResolvedValue(complete);
  });

  const upload = (file: Buffer = PDF, contentType = 'application/pdf') =>
    request(app.getHttpServer())
      .post('/api/v1/documents/process')
      .set('X-API-Key', KEY)
      .attach('file', file, { filename: 'hbl.pdf', contentType });

  const uploadExtracting = (fields: Partial<ExtractedData>) => {
    dataExtractor.extract.mockResolvedValueOnce({ ...complete, ...fields });
    return upload().expect(200);
  };

  const rows = async () =>
    (await pool.query('SELECT * FROM clients')).rows as Record<string, unknown>[];

  describe('new clients', () => {
    it('saves a complete document as Success, with all nine fields', async () => {
      const res = await upload().expect(200);
      const [row] = await rows();
      expect(res.body).toEqual({
        result: 'created',
        processingStatus: 'Success',
        clientId: row.id,
      });
      expect(row).toMatchObject({
        company_name: 'Acme Trading Ltd',
        company_name_normalized: 'acme trading ltd',
        address: '1 Port Rd, Haifa',
        phone: '+972 3 555 1234',
        phone_digits: '97235551234',
        email: 'info@acme.com',
        email_normalized: 'info@acme.com',
        origin_port: 'Shanghai',
        origin_country: 'China',
        destination_port: 'Haifa',
        incoterms: 'FOB',
        shipment_type: 'FCL',
        processing_status: 'Success',
        error_details: null,
      });
    });

    it('saves the Failed status and lists every missing required field', async () => {
      const res = await uploadExtracting({ email: null, incoterms: null, shipmentType: null });
      const [row] = await rows();
      expect(res.body).toEqual({
        result: 'created',
        processingStatus: 'Failed',
        clientId: row.id,
        errorDetails: 'Missing required fields: Email, Incoterms, Shipment Type.',
      });
      expect(row).toMatchObject({
        email: null,
        incoterms: null,
        shipment_type: null,
        processing_status: 'Failed',
        error_details: 'Missing required fields: Email, Incoterms, Shipment Type.',
      });
    });

    it('allows a missing Address and Phone in a Success', async () => {
      const res = await uploadExtracting({ address: null, phone: null });
      expect(res.body).toMatchObject({ processingStatus: 'Success' });
      const [row] = await rows();
      expect(row).toMatchObject({ address: null, phone: null, phone_digits: null });
    });

    it('stores a TO ORDER consignee with a missing company name', async () => {
      const res = await uploadExtracting({ companyName: 'TO THE ORDER OF ABC BANK' });
      expect(res.body).toMatchObject({ processingStatus: 'Failed' });
      const [row] = await rows();
      expect(row).toMatchObject({
        company_name: null,
        error_details: 'Missing required fields: Company Name.',
      });
    });

    it('stores the email exactly as it appears, without checking its format', async () => {
      await uploadExtracting({ email: 'Sales AT acme' });
      const [row] = await rows();
      expect(row).toMatchObject({ email: 'Sales AT acme', processing_status: 'Success' });
    });
  });

  describe('duplicates', () => {
    const first = { companyName: 'Acme Ltd', email: 'a@acme.com' };

    it.each([
      ['company name + email', first, { companyName: ' ACME   ltd ', email: 'A@ACME.COM' }],
      [
        'company name only',
        { companyName: 'Acme Ltd', email: null },
        { companyName: 'acme ltd', email: null },
      ],
      [
        'email only',
        { companyName: null, email: 'a@acme.com' },
        { companyName: null, email: 'A@acme.com' },
      ],
    ])('finds a duplicate by %s and changes nothing', async (_name, existing, repeated) => {
      await uploadExtracting(existing);
      const before = await rows();

      const res = await uploadExtracting({ ...repeated, originPort: 'Ningbo', incoterms: 'CIF' });

      expect(res.body).toEqual({ result: 'duplicate' });
      expect(await rows()).toEqual(before);
    });

    it('treats the same company name with another email as a new client', async () => {
      await uploadExtracting(first);
      const res = await uploadExtracting({ ...first, email: 'other@acme.com' });
      expect(res.body).toMatchObject({ result: 'created' });
      expect(await rows()).toHaveLength(2);
    });

    it('creates a new record each time when there is no company name and no email', async () => {
      const blank = { companyName: null, email: null };
      await uploadExtracting(blank);
      const res = await uploadExtracting(blank);
      expect(res.body).toMatchObject({ result: 'created', processingStatus: 'Failed' });
      expect(await rows()).toHaveLength(2);
    });

    it('treats losing a race on the unique index as a duplicate, not a 500', async () => {
      await uploadExtracting(first);
      jest.spyOn(app.get(DuplicateDetectionService), 'findDuplicate').mockResolvedValueOnce(null);

      const res = await uploadExtracting(first);

      expect(res.body).toEqual({ result: 'duplicate' });
      expect(await rows()).toHaveLength(1);
    });
  });

  describe('extraction failures', () => {
    it.each([
      ['a PDF without text', 'text', 'PDF_PARSE_ERROR'],
      ['an AI error', 'data', 'AI_API_ERROR'],
      ['an AI timeout', 'data', 'AI_TIMEOUT'],
      ['invalid AI output', 'data', 'AI_SCHEMA_ERROR'],
    ] as const)('creates no record on %s', async (_name, step, category) => {
      const extractor = step === 'text' ? textExtractor : dataExtractor;
      extractor.extract.mockRejectedValueOnce(new ExtractionError(category));

      const res = await upload().expect(200);

      expect(res.body).toEqual({ result: 'extraction_failed' });
      expect(await rows()).toHaveLength(0);
    });

    it('creates no record when the AI finds nothing at all', async () => {
      const res = await uploadExtracting({
        companyName: null,
        address: ' ',
        phone: null,
        email: null,
        originPort: null,
        originCountry: null,
        destinationPort: null,
        incoterms: null,
        shipmentType: null,
      });
      expect(res.body).toEqual({ result: 'extraction_failed' });
      expect(await rows()).toHaveLength(0);
    });
  });

  describe('invalid requests', () => {
    it('returns 401 without the API key', async () => {
      await request(app.getHttpServer()).post('/api/v1/documents/process').expect(401);
    });

    it('returns 400 when the file is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/documents/process')
        .set('X-API-Key', KEY)
        .expect(400);
    });

    it('returns 400 for a wrong type and for a file renamed to PDF', async () => {
      await upload(PDF, 'text/plain').expect(400);
      await upload(Buffer.from('PK not a pdf')).expect(400);
      expect(textExtractor.extract).not.toHaveBeenCalled();
    });

    it('returns 400 for more than one file', async () => {
      await upload()
        .attach('file', PDF, { filename: 'second.pdf', contentType: 'application/pdf' })
        .expect(400);
      expect(textExtractor.extract).not.toHaveBeenCalled();
    });

    it('accepts a file of exactly 4 MB and returns 413 above it', async () => {
      const exact = Buffer.concat([PDF, Buffer.alloc(MAX_UPLOAD_BYTES - PDF.length)]);
      await upload(exact).expect(200);
      await upload(Buffer.concat([exact, Buffer.alloc(1)])).expect(413);
    });

    it('returns 500 without details on an unexpected error', async () => {
      textExtractor.extract.mockRejectedValueOnce(new Error('internal secret detail'));
      const res = await upload().expect(500);
      expect(JSON.stringify(res.body)).not.toContain('internal secret detail');
    });
  });

  describe('logs', () => {
    function captureLogs() {
      const entries: unknown[] = [];
      for (const level of ['info', 'warn', 'error', 'debug'] as const) {
        jest.spyOn(PinoLogger.prototype, level).mockImplementation((...args: unknown[]) => {
          entries.push(args[0]);
        });
      }
      return entries;
    }

    it('records the events and outcome, without the document or the extracted values', async () => {
      const entries = captureLogs();
      await upload().expect(200);

      expect(entries).toEqual(
        expect.arrayContaining([
          { event: 'document_received' },
          { event: 'pdf_text_extracted' },
          { event: 'ai_extraction_completed' },
          expect.objectContaining({ event: 'client_created' }),
          { event: 'processing_outcome', outcome: 'AUTO_SUCCESS' },
        ]),
      );
      const logged = JSON.stringify(entries);
      for (const secret of [DOCUMENT_TEXT, complete.email, complete.companyName, 'hbl.pdf']) {
        expect(logged).not.toContain(secret);
      }
    });

    it.each([
      ['MANUAL_REVIEW', () => uploadExtracting({ incoterms: null })],
      [
        'EXTRACTION_FAILED',
        () => {
          textExtractor.extract.mockRejectedValueOnce(new ExtractionError('PDF_PARSE_ERROR'));
          return upload().expect(200);
        },
      ],
      [
        'TECHNICAL_FAILURE',
        () => {
          textExtractor.extract.mockRejectedValueOnce(new Error('boom'));
          return upload().expect(500);
        },
      ],
    ])('records the outcome %s', async (outcome, act) => {
      const entries = captureLogs();
      await act();
      expect(entries).toContainEqual({ event: 'processing_outcome', outcome });
    });

    it('records the outcome DUPLICATE_SKIPPED', async () => {
      await upload().expect(200);
      const entries = captureLogs();
      await upload().expect(200);
      expect(entries).toContainEqual({ event: 'processing_outcome', outcome: 'DUPLICATE_SKIPPED' });
    });
  });
});
