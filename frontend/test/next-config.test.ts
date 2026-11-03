import nextConfig from '../next.config';

describe('next.config redirects', () => {
  it('redirects / to /clients', async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toContainEqual({ source: '/', destination: '/clients', permanent: false });
  });
});
