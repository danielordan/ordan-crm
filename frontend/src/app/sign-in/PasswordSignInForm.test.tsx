import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signInWithPassword } from '@/lib/auth-actions';
import { PasswordSignInForm } from './PasswordSignInForm';

vi.mock('@/lib/auth-actions', () => ({ signInWithPassword: vi.fn() }));

describe('PasswordSignInForm', () => {
  it('shows the error above the fields, marks them and keeps the username', async () => {
    vi.mocked(signInWithPassword).mockResolvedValue({
      username: 'nosuchuser',
      error: 'Wrong username or password.',
    });
    render(<PasswordSignInForm callbackUrl="/clients" />);

    await userEvent.type(screen.getByLabelText('Username'), 'nosuchuser');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong username or password.');
    expect(screen.getByLabelText('Username')).toHaveValue('nosuchuser');
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });
});
