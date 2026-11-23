import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { IncomingMessage } from 'node:http';
import { resolveUserId } from './logging/logging.module';

// Who made the request and its request ID, for the activity log (ARCHITECTURE 18, ADR-45)
export interface Actor {
  userId: string | null;
  requestId: string | null;
}

export const NO_ACTOR: Actor = { userId: null, requestId: null };

export function actorFromRequest(req: IncomingMessage & { id?: unknown }): Actor {
  return {
    userId: resolveUserId(req).userId ?? null,
    requestId: typeof req.id === 'string' ? req.id : null,
  };
}

export const RequestActor = createParamDecorator((_data: unknown, ctx: ExecutionContext): Actor =>
  actorFromRequest(ctx.switchToHttp().getRequest()),
);
