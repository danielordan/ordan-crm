import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';

// Shared by main.ts and the e2e tests so both run the same configuration
export function configureApp(app: INestApplication): void {
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  (app as NestExpressApplication).disable('x-powered-by');
  app.enableShutdownHooks();
  // CORS stays disabled: the browser never calls the backend directly
}
