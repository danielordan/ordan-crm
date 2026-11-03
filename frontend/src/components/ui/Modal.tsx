'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

// Built on the native <dialog> element: focus trapping, Escape and top layer come for free
export function Modal({ open, onClose, title, icon, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        // Escape key: let the parent decide, so `open` stays the source of truth
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Clicks on the backdrop land on the dialog element itself
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-full max-w-md rounded-card bg-surface p-0 shadow-card backdrop:bg-navy/50"
    >
      <div className="relative flex flex-col items-center gap-3 px-8 pt-8 pb-6 text-center">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer rounded-control p-1 text-text-secondary hover:bg-background hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
        {icon ? <div className="flex items-center justify-center">{icon}</div> : null}
        <h2 id={titleId} className="text-h3 text-text-primary">
          {title}
        </h2>
        {children ? <div className="text-body text-text-primary">{children}</div> : null}
      </div>
      {footer ? <div className="flex justify-center gap-3 px-8 pb-8">{footer}</div> : null}
    </dialog>
  );
}
