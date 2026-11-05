import { Global, Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool } from 'pg';
import type { Env } from '../common/config/env.schema';
import { DATABASE_POOL } from './database.constants';
import { createPool } from './pool';

// Many Vercel Function instances can run at once, so each one keeps few connections (ARCHITECTURE 15.2)
export const PRODUCTION_POOL_MAX = 2;

@Injectable()
class DatabaseShutdown implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      // The pool connects lazily, so the app starts even when the database is unreachable
      useFactory: (config: ConfigService<Env, true>) =>
        createPool({
          connectionString: config.get('DATABASE_URL', { infer: true }),
          schema: config.get('DATABASE_SCHEMA', { infer: true }),
          max:
            config.get('NODE_ENV', { infer: true }) === 'production'
              ? PRODUCTION_POOL_MAX
              : undefined,
        }),
    },
    DatabaseShutdown,
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
