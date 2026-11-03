import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Env } from '../config/env.schema';
import { ApiKeyGuard, apiKeyMatches } from './api-key.guard';

const KEY = 'test-api-key-1234567890';

function contextWith(headers: Record<string, string>): ExecutionContext {
  const request = { header: (name: string) => headers[name.toLowerCase()] };
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function makeGuard(isPublic = false): ApiKeyGuard {
  const reflector = { getAllAndOverride: () => isPublic } as unknown as Reflector;
  const config = { get: () => KEY } as unknown as ConfigService<Env, true>;
  return new ApiKeyGuard(reflector, config);
}

describe('apiKeyMatches', () => {
  it('accepts the exact key', () => expect(apiKeyMatches(KEY, KEY)).toBe(true));
  it('rejects a missing key', () => expect(apiKeyMatches(undefined, KEY)).toBe(false));
  it('rejects a wrong key', () => expect(apiKeyMatches('wrong', KEY)).toBe(false));
  it('rejects a key with a different length', () =>
    expect(apiKeyMatches(`${KEY}x`, KEY)).toBe(false));
});

describe('ApiKeyGuard', () => {
  it('allows a request with the correct key', () => {
    expect(makeGuard().canActivate(contextWith({ 'x-api-key': KEY }))).toBe(true);
  });

  it('rejects a request without a key', () => {
    expect(() => makeGuard().canActivate(contextWith({}))).toThrow(UnauthorizedException);
  });

  it('rejects a request with a wrong key', () => {
    expect(() => makeGuard().canActivate(contextWith({ 'x-api-key': 'nope' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('allows public routes without a key', () => {
    expect(makeGuard(true).canActivate(contextWith({}))).toBe(true);
  });
});
