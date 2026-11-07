import { render, screen } from '@testing-library/react';
import SignInPage from './page';

vi.mock('@/lib/auth-actions', () => ({
  signInWithGoogle: vi.fn(),
  signInWithPassword: vi.fn(),
}));

const renderPage = async (params: Record<string, string> = {}) =>
  render(await SignInPage({ searchParams: Promise.resolve(params) }));

describe('Sign In page', () => {
  it('shows the system name, the password form and the Google button', async () => {
    await renderPage();
    expect(screen.getByRole('heading', { name: /Ordan Cargo\s*Future Clients/ })).toBeVisible();
    expect(screen.getByLabelText('Username')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/sign-up',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps a safe callback URL for the password form', async () => {
    const { container } = await renderPage({ callbackUrl: '/upload' });
    expect(container.querySelector('input[name="callbackUrl"]')).toHaveValue('/upload');
  });

  it('shows an error when sign-in failed', async () => {
    await renderPage({ error: 'AccessDenied' });
    expect(screen.getByRole('alert')).toHaveTextContent('Sign in failed. Please try again.');
  });
});
