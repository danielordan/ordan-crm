import { render, screen } from '@testing-library/react';
import SignUpPage from './page';

vi.mock('@/lib/auth-actions', () => ({ signUpWithPassword: vi.fn() }));

describe('Sign Up page', () => {
  it('shows the create account form and a link back to Sign In', () => {
    render(<SignUpPage />);
    expect(screen.getByRole('heading', { name: /Ordan Cargo\s*Future Clients/ })).toBeVisible();
    expect(screen.getByLabelText('Username')).toBeVisible();
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in');
  });
});
