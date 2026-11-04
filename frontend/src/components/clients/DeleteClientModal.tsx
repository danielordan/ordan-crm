'use client';

import { Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface DeleteClientModalProps {
  open: boolean;
  deleting: boolean;
  failed: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Delete confirmation (DESIGN 1.4). It cannot be closed while the delete is running.
export function DeleteClientModal({
  open,
  deleting,
  failed,
  onClose,
  onConfirm,
}: DeleteClientModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!deleting) onClose();
      }}
      title="Delete Client"
      icon={
        <span className="flex size-12 items-center justify-center rounded-full bg-error-light">
          <Trash2 aria-hidden="true" className="size-5 text-error" />
        </span>
      }
      footer={
        <>
          <Button variant="secondary" className="flex-1" disabled={deleting} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1" disabled={deleting} onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    >
      <p>Are you sure you want to delete this client?</p>
      <p className="mt-1 text-text-secondary">This action cannot be undone.</p>
      {failed ? (
        <Alert variant="error" className="mt-4 text-left">
          Something went wrong. Please try again.
        </Alert>
      ) : null}
    </Modal>
  );
}
