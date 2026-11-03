import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';

const pathname = vi.hoisted(() => ({ value: '/clients' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }));
vi.mock('@/lib/auth-actions', () => ({ signOutToSignIn: vi.fn() }));

describe('Sidebar', () => {
  it('shows the system name and both navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Ordan Cargo')).toBeInTheDocument();
    expect(screen.getByText('Future Clients')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('href', '/clients');
    expect(screen.getByRole('link', { name: 'Upload PDF' })).toHaveAttribute('href', '/upload');
  });

  it.each([
    ['/clients', 'Clients'],
    ['/clients/abc123', 'Clients'],
    ['/upload', 'Upload PDF'],
  ])('marks the active item for %s', (path, activeLabel) => {
    pathname.value = path;
    render(<Sidebar />);
    for (const link of screen.getAllByRole('link')) {
      if (link.textContent === activeLabel) expect(link).toHaveAttribute('aria-current', 'page');
      else expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('shows a Sign out button', () => {
    render(<Sidebar />);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
