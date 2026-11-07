import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { LoggerModule } from 'nestjs-pino';
import type { Env } from '../config/env.schema';

const REQUEST_ID_HEADER = 'x-request-id';
const VALID_REQUEST_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function resolveRequestId(req: IncomingMessage, res: ServerResponse): string {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id =
    typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader('X-Request-Id', id);
  return id;
}

// The signed-in user's internal ID, sent by the Next.js server (ARCHITECTURE 18, ADR-38).
// Only a UUID is accepted; anything else is ignored. The header is trusted because only a
// caller with the API key reaches the backend.
const USER_ID_HEADER = 'x-user-id';
const VALID_USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveUserId(req: IncomingMessage): { userId?: string } {
  const incoming = req.headers[USER_ID_HEADER];
  return typeof incoming === 'string' && VALID_USER_ID.test(incoming)
    ? { userId: incoming.toLowerCase() }
    : {};
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const isProduction = config.get('NODE_ENV', { infer: true }) === 'production';
        return {
          pinoHttp: {
            level: config.get('LOG_LEVEL', { infer: true }),
            genReqId: resolveRequestId,
            // Every log line of a request carries the user who made it
            customProps: resolveUserId,
            redact: {
              paths: [
                'req.headers["x-api-key"]',
                'req.headers.authorization',
                'req.headers.cookie',
              ],
              censor: '[REDACTED]',
            },
            serializers: {
              req: (req: { id: unknown; method: unknown; url: unknown }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
            },
            // Readable logs locally; plain JSON everywhere else
            transport: isProduction
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
          },
        };
      },
    }),
  ],
})
export class LoggingModule {}
