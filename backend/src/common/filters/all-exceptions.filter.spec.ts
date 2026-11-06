import { ArgumentsHost, ConflictException, NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { AllExceptionsFilter } from './all-exceptions.filter';

function run(exception: unknown) {
  const res = { statusCode: 0, body: undefined as unknown };
  const response = {
    status(code: number) {
      res.statusCode = code;
      return this;
    },
    json(body: unknown) {
      res.body = body;
    },
  };
  const host = {
    switchToHttp: () => ({ getRequest: () => ({ id: 'req-1' }), getResponse: () => response }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter({
    error: jest.fn(),
    setContext: jest.fn(),
  } as unknown as PinoLogger).catch(exception, host);
  return res;
}

describe('AllExceptionsFilter', () => {
  it('maps HttpException to its status and a derived code', () => {
    const res = run(new NotFoundException('Client not found.'));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: 'NOT_FOUND',
      message: 'Client not found.',
      requestId: 'req-1',
    });
  });

  it('keeps an explicit application error code', () => {
    const res = run(new ConflictException({ error: 'DUPLICATE_CLIENT', message: 'Duplicate.' }));
    expect(res.statusCode).toBe(409);
    expect(res.body).toMatchObject({ error: 'DUPLICATE_CLIENT' });
  });

  it('hides details of unexpected errors', () => {
    const res = run(new Error('connection string mongodb://secret leaked'));
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: 'INTERNAL_ERROR',
      message: 'Something went wrong.',
      requestId: 'req-1',
    });
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});
