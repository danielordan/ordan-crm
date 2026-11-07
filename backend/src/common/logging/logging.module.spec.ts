import type { IncomingMessage } from 'node:http';
import { resolveUserId } from './logging.module';

const request = (headers: object) => ({ headers }) as unknown as IncomingMessage;

describe('resolveUserId', () => {
  it('takes a valid user ID from X-User-Id, in lowercase', () => {
    expect(resolveUserId(request({ 'x-user-id': '811953F5-F9DC-4754-86F0-1ADB7102A44A' }))).toEqual(
      { userId: '811953f5-f9dc-4754-86f0-1adb7102a44a' },
    );
  });

  it.each([{}, { 'x-user-id': '' }, { 'x-user-id': 'dana' }, { 'x-user-id': ['a', 'b'] }])(
    'ignores %p',
    (headers) => {
      expect(resolveUserId(request(headers))).toEqual({});
    },
  );
});
