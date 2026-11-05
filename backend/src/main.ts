import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './common/app-setup';
import type { Env } from './common/config/env.schema';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app);
  const config = app.get(ConfigService<Env, true>);
  // Vercel provides PORT. Locally it is ignored: it may be meant for another app, like the frontend.
  const apiPort: number = config.get('API_PORT', { infer: true });
  const isProduction = config.get('NODE_ENV', { infer: true }) === 'production';
  const port = (isProduction && config.get('PORT', { infer: true })) || apiPort;
  await app.listen(port);
}

void bootstrap();
