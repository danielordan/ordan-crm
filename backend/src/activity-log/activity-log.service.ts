import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Pool } from 'pg';
import type { Actor } from '../common/request-actor';
import { DATABASE_POOL } from '../database/database.constants';

export type ActivityAction =
  | 'user_registered'
  | 'user_signed_in'
  | 'password_sign_in_failed'
  | 'client_created'
  | 'duplicate_detected'
  | 'extraction_failed'
  | 'processing_failed'
  | 'client_updated'
  | 'client_deleted';

export interface ActivityEntry {
  action: ActivityAction;
  result: 'success' | 'failure';
  actor: Actor;
  // Overrides actor.userId, e.g. the user who just signed in
  userId?: string | null;
  clientId?: string | null;
  // Short facts only: never passwords, usernames, emails, document text or field values
  details?: Record<string, unknown>;
}

// Writes one row per action to activity_logs (ARCHITECTURE 11.8, ADR-45).
// Never throws: a failed write is reported in the regular logs and the action goes on.
@Injectable()
export class ActivityLogService {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {
    this.logger.setContext(ActivityLogService.name);
  }

  // Awaited by callers, so the row is written before Vercel may stop the function
  async record(entry: ActivityEntry): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO activity_logs (user_id, action, client_id, result, details, request_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          entry.userId !== undefined ? entry.userId : entry.actor.userId,
          entry.action,
          entry.clientId ?? null,
          entry.result,
          entry.details ? JSON.stringify(entry.details) : null,
          entry.actor.requestId,
        ],
      );
    } catch (error) {
      const code = (error as { code?: unknown } | null)?.code;
      this.logger.error(
        {
          event: 'activity_log_write_failed',
          action: entry.action,
          code: typeof code === 'string' ? code : undefined,
        },
        'activity_log_write_failed',
      );
    }
  }
}
