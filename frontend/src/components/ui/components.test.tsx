import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from './Alert';
import { Button } from './Button';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';

// jsdom does not implement <dialog> methods
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
});

describe('StatusBadge', () => {
  it.each(['Success', 'Failed'] as const)('shows the %s text', (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });
});

describe('Button', () => {
  it('calls onClick when enabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Alert', () => {
  it('renders the message and the action', () => {
    render(
      <Alert variant="error" action={<Button>Try Again</Button>}>
        Something went wrong. Please try again.
      </Alert>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('uses role="status" for non-error messages', () => {
    render(<Alert variant="success">Client added successfully.</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Client added successfully.');
  });
});

describe('Modal', () => {
  function renderModal(onClose = vi.fn()) {
    render(
      <Modal open onClose={onClose} title="Delete Client">
        Are you sure you want to delete this client?
      </Modal>,
    );
    return onClose;
  }

  it('shows the title and content when open', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: 'Delete Client' })).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this client?')).toBeInTheDocument();
  });

  it('calls onClose from the Close button', async () => {
    const onClose = renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape', () => {
    const onClose = renderModal();
    screen.getByRole('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
