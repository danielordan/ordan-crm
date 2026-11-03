import { checkBasicAuth } from './basic-auth';

const PASSWORD = 'correct-horse';
const header = (credentials: string) => `Basic ${btoa(credentials)}`;

describe('checkBasicAuth', () => {
  it('rejects a request without credentials', () => {
    expect(checkBasicAuth(null, PASSWORD)).toBe('unauthorized');
  });

  it('rejects a wrong password', () => {
    expect(checkBasicAuth(header('user:wrong'), PASSWORD)).toBe('unauthorized');
  });

  it('accepts the correct password with any username', () => {
    expect(checkBasicAuth(header('anyone:correct-horse'), PASSWORD)).toBe('ok');
    expect(checkBasicAuth(header(':correct-horse'), PASSWORD)).toBe('ok');
  });

  it('accepts passwords that contain a colon', () => {
    expect(checkBasicAuth(header('u:a:b'), 'a:b')).toBe('ok');
  });

  it('rejects malformed headers', () => {
    expect(checkBasicAuth('Basic', PASSWORD)).toBe('unauthorized');
    expect(checkBasicAuth('Basic !!!not-base64', PASSWORD)).toBe('unauthorized');
    expect(checkBasicAuth(header('no-separator'), PASSWORD)).toBe('unauthorized');
    expect(checkBasicAuth(`Bearer ${btoa('u:correct-horse')}`, PASSWORD)).toBe('unauthorized');
  });

  it('fails closed when no site password is configured', () => {
    expect(checkBasicAuth(header('u:anything'), undefined)).toBe('not_configured');
    expect(checkBasicAuth(header('u:'), '')).toBe('not_configured');
  });
});
