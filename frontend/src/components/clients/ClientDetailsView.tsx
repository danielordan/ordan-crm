'use client';

import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  CONSIGNEE_FIELDS,
  SHIPMENT_FIELDS,
  toFormValues,
  toUpdateBody,
  type Client,
  type ClientField,
  type ClientFormValues,
} from '@/lib/client-details';
import {
  ClientNotFoundError,
  deleteClient,
  DuplicateClientError,
  fetchClient,
  SessionExpiredError,
  updateClient,
} from '@/lib/clients-api';
import { validateContactFields, type FieldErrors } from '@/lib/contact-validation';
import { formatDetailsDate } from '@/lib/format';
import { ClientFieldsCard, DetailRow } from './ClientFieldsCard';
import { DeleteClientModal } from './DeleteClientModal';

const GENERIC_ERROR = 'Something went wrong. Please try again.';
const DUPLICATE_ERROR = 'A client with this company name and email already exists.';

type LoadState = 'loading' | 'ready' | 'failed' | 'not-found';

function BackLink() {
  return (
    <Link
      href="/clients"
      className="inline-flex h-10 w-fit items-center gap-2 rounded-control border border-border bg-surface px-4 text-body font-medium text-navy transition-colors hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-accent"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Back to Clients
    </Link>
  );
}

function LoadingCards() {
  return (
    <div aria-busy="true" aria-label="Loading client" className="flex flex-col gap-6">
      {[4, 5, 2].map((rows) => (
        <Card key={rows} className="flex flex-col gap-4">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="h-4 w-2/3 animate-pulse rounded bg-border" />
          ))}
        </Card>
      ))}
    </div>
  );
}

// Client Details screen (PRD 4.6, DESIGN 1.3): view, edit and delete one client
export function ClientDetailsView({ id }: { id: string }) {
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [client, setClient] = useState<Client | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const [form, setForm] = useState<ClientFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  // Handled the same way wherever they happen. Returns false for other errors.
  const handleCommonError = useCallback(
    (error: unknown): boolean => {
      if (error instanceof SessionExpiredError) {
        const back = `${window.location.pathname}${window.location.search}`;
        router.replace(`/sign-in?callbackUrl=${encodeURIComponent(back)}`);
        return true;
      }
      if (error instanceof ClientNotFoundError) {
        setDeleteOpen(false);
        setLoadState('not-found');
        return true;
      }
      return false;
    },
    [router],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchClient(id, controller.signal).then(
      (loaded) => {
        setClient(loaded);
        setLoadState('ready');
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (!handleCommonError(error)) setLoadState('failed');
      },
    );
    return () => controller.abort();
  }, [id, reloadCount, handleCommonError]);

  const startEdit = (current: Client) => {
    setSaveError(null);
    setFieldErrors({});
    setForm(toFormValues(current));
  };

  const cancelEdit = () => {
    setSaveError(null);
    setFieldErrors({});
    setForm(null);
  };

  const changeField = (field: ClientField, value: string) => {
    setForm((values) => (values ? { ...values, [field]: value } : values));
    setFieldErrors((errors) => ({ ...errors, [field]: undefined }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form || !client || saving) return;

    const errors = validateContactFields(form, client);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSaveError(null);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      setClient(await updateClient(id, toUpdateBody(form)));
      setForm(null);
    } catch (error) {
      if (error instanceof DuplicateClientError) setSaveError(DUPLICATE_ERROR);
      else if (!handleCommonError(error)) setSaveError(GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteFailed(false);
    try {
      await deleteClient(id);
      // Replace, so the browser's Back button does not return to the deleted client
      router.replace('/clients');
    } catch (error) {
      if (!handleCommonError(error)) setDeleteFailed(true);
      setDeleting(false);
    }
  };

  if (loadState === 'not-found') {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1">Client Details</h1>
        <BackLink />
        <Alert variant="error">Client not found.</Alert>
      </div>
    );
  }

  if (loadState === 'failed') {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1">Client Details</h1>
        <BackLink />
        <Alert
          variant="error"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setLoadState('loading');
                setReloadCount((count) => count + 1);
              }}
            >
              Try Again
            </Button>
          }
        >
          {GENERIC_ERROR}
        </Alert>
      </div>
    );
  }

  if (loadState === 'loading' || !client) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1">Client Details</h1>
        <BackLink />
        <LoadingCards />
      </div>
    );
  }

  const editing = form !== null;
  const cardProps = { client, form, errors: fieldErrors, disabled: saving, onChange: changeField };

  return (
    <>
      <form onSubmit={save} className="flex flex-col gap-6">
        <h1 className="text-h1">Client Details</h1>

        <div className="flex items-center justify-between gap-4">
          <BackLink />
          <div className="flex gap-3">
            {editing ? (
              <>
                {/* Distinct keys: if React reused the Edit button's element here, the click that
                    opened edit mode would count as a click on a submit button and save at once */}
                <Button key="save" type="submit" disabled={saving}>
                  Save
                </Button>
                <Button variant="secondary" disabled={saving} onClick={cancelEdit}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  key="edit"
                  variant="secondary"
                  icon={<Pencil />}
                  onClick={() => startEdit(client)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive-outline"
                  icon={<Trash2 />}
                  onClick={() => {
                    setDeleteFailed(false);
                    setDeleteOpen(true);
                  }}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {saveError ? <Alert variant="error">{saveError}</Alert> : null}

        <ClientFieldsCard label="Client information" fields={CONSIGNEE_FIELDS} {...cardProps} />
        <ClientFieldsCard
          title="Shipment Details"
          label="Shipment Details"
          fields={SHIPMENT_FIELDS}
          {...cardProps}
        />

        <Card aria-label="Record status" className="text-body">
          <dl>
            <DetailRow label="Date Added">{formatDetailsDate(client.dateAdded)}</DetailRow>
            <DetailRow label="Processing Status">
              <StatusBadge status={client.processingStatus} />
            </DetailRow>
          </dl>
        </Card>

        {client.processingStatus === 'Failed' ? (
          <Alert variant="error" title="Error Details">
            {client.errorDetails}
          </Alert>
        ) : null}
      </form>

      <DeleteClientModal
        open={deleteOpen}
        deleting={deleting}
        failed={deleteFailed}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
