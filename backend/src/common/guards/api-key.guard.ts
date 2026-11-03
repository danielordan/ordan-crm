import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { Env } from '../config/env.schema';
import { IS_PUBLIC_KEY } from './public.decorator';

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

export function apiKeyMatches(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  // Hash both values so different lengths can be compared in constant time
  return timingSafeEqual(sha256(provided), sha256(expected));
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService<Env, true>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-api-key');
    if (!apiKeyMatches(provided, this.config.get('BACKEND_API_KEY', { infer: true }))) {
      throw new UnauthorizedException('Invalid or missing API key.');
    }
    return true;
  }
}
