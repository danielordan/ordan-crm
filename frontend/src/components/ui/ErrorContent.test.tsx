import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorContent } from './ErrorContent';

describe('ErrorContent', () => {
  it('shows the message, retries and links back to Clients', async () => {
    const onRetry = vi.fn();
    render(<ErrorContent onRetry={onRetry} />);
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Clients' })).toHaveAttribute(
      'href',
      '/clients',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
