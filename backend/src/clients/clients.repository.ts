import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { phoneToDigits } from '../common/text/normalize';
import { DATABASE_POOL } from '../database/database.constants';
import type { ClientListRow, ClientRow, ClientWrite, DuplicateKeys } from './client.types';
import { PAGE_SIZE, type ListClientsQuery } from './dto/list-clients.query';

const POSTGRES_UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === POSTGRES_UNIQUE_VIOLATION;
}

export interface SqlQuery {
  text: string;
  values: unknown[];
}

// Escapes LIKE wildcards so user input is always matched literally
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// Only text that looks like a phone number is matched against phones, so "acme2024@x.com"
// does not match every phone containing "2024"
const PHONE_LIKE = /^[\d\s+\-().]+$/;

// Digit patterns to match against phone_digits. A local Israeli number (0…) also matches the
// same number in international form (972…), so "03-555" finds "+972 3 555…" (ARCHITECTURE ADR-21).
export function phoneSearchPatterns(search: string): string[] {
  if (!PHONE_LIKE.test(search)) return [];
  const digits = phoneToDigits(search);
  if (!digits) return [];
  return digits.startsWith('0') && digits.length > 1 ? [digits, `972${digits.slice(1)}`] : [digits];
}

// Text columns matched by the search box (PRD 4.5, ADR-40). Phone is matched by digits below.
const SEARCHABLE_COLUMNS = [
  'company_name',
  'email',
  'address',
  'origin_port',
  'origin_country',
  'destination_port',
  'incoterms',
  'shipment_type',
];

// Builds the list query. All user values are bind parameters; the sort direction comes from a
// fixed enum. Fetches one extra row to know whether a next page exists (ARCHITECTURE 13).
export function buildListQuery(query: ListClientsQuery): SqlQuery {
  const values: unknown[] = [];
  const param = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };
  const conditions: string[] = [];

  if (query.search) {
    const text = param(`%${escapeLike(query.search)}%`);
    const matches = [
      ...SEARCHABLE_COLUMNS.map((column) => `${column} ILIKE ${text} ESCAPE '\\'`),
      ...phoneSearchPatterns(query.search).map(
        (digits) => `phone_digits LIKE ${param(`%${digits}%`)}`,
      ),
    ];
    conditions.push(`(${matches.join(' OR ')})`);
  }
  if (query.processingStatus) {
    conditions.push(`processing_status = ${param(query.processingStatus)}`);
  }

  const direction = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = param(PAGE_SIZE + 1);
  const offset = param((query.page - 1) * PAGE_SIZE);

  return {
    text: `SELECT id, company_name, email, phone, date_added, processing_status
           FROM clients ${where}
           ORDER BY date_added ${direction}, id ${direction}
           LIMIT ${limit} OFFSET ${offset}`,
    values,
  };
}

// Picks the duplicate rule by which values exist (ARCHITECTURE 9.3). Call with at least one key.
export function buildDuplicateQuery(keys: DuplicateKeys, excludeId?: string): SqlQuery {
  const values: unknown[] = [];
  const conditions: string[] = [];
  const add = (column: string, value: unknown, operator = '=') => {
    values.push(value);
    conditions.push(`${column} ${operator} $${values.length}`);
  };

  if (keys.companyName) add('company_name_normalized', keys.companyName);
  if (keys.email) add('email_normalized', keys.email);
  if (excludeId) add('id', excludeId, '<>');

  return { text: `SELECT id FROM clients WHERE ${conditions.join(' AND ')} LIMIT 1`, values };
}

const CLIENT_COLUMNS = `id, company_name, company_name_normalized, address, phone, email,
  email_normalized, origin_port, origin_country, destination_port, incoterms, shipment_type,
  date_added, processing_status, error_details`;

@Injectable()
export class ClientsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async list(query: ListClientsQuery): Promise<ClientListRow[]> {
    const { text, values } = buildListQuery(query);
    const { rows } = await this.pool.query<ClientListRow>(text, values);
    return rows;
  }

  async findById(id: string): Promise<ClientRow | null> {
    const { rows } = await this.pool.query<ClientRow>(
      `SELECT ${CLIENT_COLUMNS} FROM clients WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findDuplicateId(keys: DuplicateKeys, excludeId?: string): Promise<string | null> {
    const { text, values } = buildDuplicateQuery(keys, excludeId);
    const { rows } = await this.pool.query<{ id: string }>(text, values);
    return rows[0]?.id ?? null;
  }

  // Returns the new client's ID
  async create(client: ClientWrite): Promise<string> {
    const { rows } = await this.pool.query<{ id: string }>(
      `INSERT INTO clients (
         company_name, company_name_normalized, address, phone, phone_digits, email,
         email_normalized, origin_port, origin_country, destination_port, incoterms,
         shipment_type, processing_status, error_details
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        client.companyName,
        client.companyNameNormalized,
        client.address,
        client.phone,
        client.phoneDigits,
        client.email,
        client.emailNormalized,
        client.originPort,
        client.originCountry,
        client.destinationPort,
        client.incoterms,
        client.shipmentType,
        client.processingStatus,
        client.errorDetails,
      ],
    );
    return rows[0].id;
  }

  // Returns null when the client no longer exists
  async update(id: string, client: ClientWrite): Promise<ClientRow | null> {
    const { rows } = await this.pool.query<ClientRow>(
      `UPDATE clients SET
         company_name = $2,
         company_name_normalized = $3,
         address = $4,
         phone = $5,
         phone_digits = $6,
         email = $7,
         email_normalized = $8,
         origin_port = $9,
         origin_country = $10,
         destination_port = $11,
         incoterms = $12,
         shipment_type = $13,
         processing_status = $14,
         error_details = $15
       WHERE id = $1
       RETURNING ${CLIENT_COLUMNS}`,
      [
        id,
        client.companyName,
        client.companyNameNormalized,
        client.address,
        client.phone,
        client.phoneDigits,
        client.email,
        client.emailNormalized,
        client.originPort,
        client.originCountry,
        client.destinationPort,
        client.incoterms,
        client.shipmentType,
        client.processingStatus,
        client.errorDetails,
      ],
    );
    return rows[0] ?? null;
  }

  // Returns whether a client was deleted
  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM clients WHERE id = $1', [id]);
    return rowCount === 1;
  }
}
