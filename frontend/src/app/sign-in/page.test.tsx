import { render, screen } from '@testing-library/react';
import SignInPage from './page';

vi.mock('@/lib/auth-actions', () => ({ signInWithGoogle: vi.fn() }));

const renderPage = async (params: Record<string, string> = {}) =>
  render(await SignInPage({ searchParams: Promise.resolve(params) }));

describe('Sign In page', () => {
  it('shows the system name and the Google button', async () => {
    await renderPage();
    expect(screen.getByRole('heading', { name: /Ordan Cargo\s*Future Clients/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error when sign-in failed', async () => {
    await renderPage({ error: 'AccessDenied' });
    expect(screen.getByRole('alert')).toHaveTextContent('Sign in failed. Please try again.');
  });
});
