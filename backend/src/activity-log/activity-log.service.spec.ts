import type { PinoLogger } from 'nestjs-pino';
import type { Pool } from 'pg';
import { ActivityLogService } from './activity-log.service';

function setup(query: jest.Mock) {
  const logger = { setContext: jest.fn(), error: jest.fn() };
  const service = new ActivityLogService(
    logger as unknown as PinoLogger,
    { query } as unknown as Pool,
  );
  return { service, logger };
}

const actor = { userId: '11111111-1111-4111-8111-111111111111', requestId: 'req-1' };

describe('ActivityLogService', () => {
  it('inserts one row with parameterized values', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const { service } = setup(query);
    await service.record({
      action: 'client_updated',
      result: 'success',
      actor,
      clientId: '22222222-2222-4222-8222-222222222222',
      details: { changedFields: ['email'] },
    });
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO activity_logs');
    expect(values).toEqual([
      actor.userId,
      'client_updated',
      '22222222-2222-4222-8222-222222222222',
      'success',
      '{"changedFields":["email"]}',
      'req-1',
    ]);
  });

  it('uses an explicit userId over the actor, including null', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const { service } = setup(query);
    await service.record({
      action: 'password_sign_in_failed',
      result: 'failure',
      actor,
      userId: null,
    });
    expect((query.mock.calls[0] as [string, unknown[]])[1][0]).toBeNull();
  });

  it('never throws when the write fails, and reports it in the regular logs', async () => {
    const query = jest.fn().mockRejectedValue(Object.assign(new Error('boom'), { code: '42P01' }));
    const { service, logger } = setup(query);
    await expect(
      service.record({ action: 'client_deleted', result: 'success', actor }),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      { event: 'activity_log_write_failed', action: 'client_deleted', code: '42P01' },
      'activity_log_write_failed',
    );
  });
});
