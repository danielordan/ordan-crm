import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.constants';
import type { GoogleSignInDto } from './dto/google-sign-in.dto';

export interface UserRecord {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
}

export interface PasswordUserRecord extends UserRecord {
  passwordHash: string;
}

const USER_COLUMNS = 'id, email, name, username';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  // Atomic upsert by Google ID: concurrent first sign-ins cannot create duplicates
  async upsertByGoogleId({ googleId, email, name }: GoogleSignInDto): Promise<UserRecord> {
    const { rows } = await this.pool.query<UserRecord>(
      `INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3)
       ON CONFLICT (google_id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
       RETURNING ${USER_COLUMNS}`,
      [googleId, email, name],
    );
    return rows[0];
  }

  // Returns null when the username is taken; the unique index decides, so it is race-safe
  async createWithPassword(username: string, passwordHash: string): Promise<UserRecord | null> {
    const { rows } = await this.pool.query<UserRecord>(
      `INSERT INTO users (username, password_hash) VALUES ($1, $2)
       ON CONFLICT (username) WHERE username IS NOT NULL DO NOTHING
       RETURNING ${USER_COLUMNS}`,
      [username, passwordHash],
    );
    return rows[0] ?? null;
  }

  async findByUsername(username: string): Promise<PasswordUserRecord | null> {
    const { rows } = await this.pool.query<PasswordUserRecord>(
      `SELECT ${USER_COLUMNS}, password_hash AS "passwordHash" FROM users WHERE username = $1`,
      [username],
    );
    return rows[0] ?? null;
  }
}
