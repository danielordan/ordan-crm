import type { Pool } from 'pg';
import type { SeedClient } from './seed-data';

const COLUMNS = [
  'id',
  'company_name',
  'company_name_normalized',
  'address',
  'phone',
  'phone_digits',
  'email',
  'email_normalized',
  'origin_port',
  'origin_country',
  'destination_port',
  'incoterms',
  'shipment_type',
  'date_added',
  'processing_status',
  'error_details',
];

function toRow(client: SeedClient): unknown[] {
  return [
    client.id,
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
    client.dateAdded,
    client.processingStatus,
    client.errorDetails,
  ];
}

// Replaces the seed rows (by their fixed IDs) in one transaction; other rows are untouched
export async function insertSeedClients(pool: Pool, clients: SeedClient[]): Promise<void> {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    await db.query('DELETE FROM clients WHERE id = ANY($1::uuid[])', [clients.map((c) => c.id)]);
    for (const client of clients) {
      const placeholders = COLUMNS.map((_, i) => `$${i + 1}`).join(', ');
      await db.query(
        `INSERT INTO clients (${COLUMNS.join(', ')}) VALUES (${placeholders})`,
        toRow(client),
      );
    }
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
}
