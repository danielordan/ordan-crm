import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { phoneToDigits } from '../common/text/normalize';
import { DATABASE_POOL } from '../database/database.constants';
import type { ClientListRow } from './client.types';
import { PAGE_SIZE, type ListClientsQuery } from './dto/list-clients.query';

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
      `company_name ILIKE ${text} ESCAPE '\\'`,
      `email ILIKE ${text} ESCAPE '\\'`,
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

@Injectable()
export class ClientsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async list(query: ListClientsQuery): Promise<ClientListRow[]> {
    const { text, values } = buildListQuery(query);
    const { rows } = await this.pool.query<ClientListRow>(text, values);
    return rows;
  }
}
