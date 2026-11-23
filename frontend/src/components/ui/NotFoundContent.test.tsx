import { render, screen } from '@testing-library/react';
import { NotFoundContent } from './NotFoundContent';

describe('NotFoundContent', () => {
  it('shows the 404 text and a way back to Clients', () => {
    render(<NotFoundContent />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(
      screen.getByText("The page you're looking for doesn't exist or may have been deleted."),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Clients' })).toHaveAttribute(
      'href',
      '/clients',
    );
  });
});
