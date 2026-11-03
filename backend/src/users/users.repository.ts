import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.constants';
import type { GoogleSignInDto } from './dto/google-sign-in.dto';

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
}

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  // Atomic upsert by Google ID: concurrent first sign-ins cannot create duplicates
  async upsertByGoogleId({ googleId, email, name }: GoogleSignInDto): Promise<UserRecord> {
    const { rows } = await this.pool.query<UserRecord>(
      `INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3)
       ON CONFLICT (google_id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
       RETURNING id, email, name`,
      [googleId, email, name],
    );
    return rows[0];
  }
}
