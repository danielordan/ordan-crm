import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  error: string;
  message: string;
  requestId?: string;
}

const GENERIC_MESSAGE = 'Something went wrong.';

function codeFromStatus(status: number): string {
  const name = HttpStatus[status] as string | undefined;
  return name ?? 'ERROR';
}

function safeMessage(response: string | object, fallback: string): string {
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.filter((m) => typeof m === 'string').join('; ');
  return fallback;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request & { id?: unknown }>();
    const response = http.getResponse<Response>();
    const requestId = typeof request.id === 'string' ? request.id : undefined;

    let status: number;
    let body: ErrorBody;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();
      const customCode = typeof raw === 'object' ? (raw as { error?: unknown }).error : undefined;
      // Keep explicit application codes such as DUPLICATE_CLIENT; otherwise derive from status
      const code =
        typeof customCode === 'string' && /^[A-Z_]+$/.test(customCode)
          ? customCode
          : codeFromStatus(status);
      body = {
        error: code,
        message: status >= 500 ? GENERIC_MESSAGE : safeMessage(raw, exception.message),
        requestId,
      };
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = { error: 'INTERNAL_ERROR', message: GENERIC_MESSAGE, requestId };
    }

    if (status >= 500) {
      // Full details go to the log only, never to the client
      this.logger.error(
        { err: exception, requestId },
        exception instanceof Error ? exception.message : 'Unhandled exception',
      );
    }

    response.status(status).json(body);
  }
}
