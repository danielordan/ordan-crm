import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Client, ClientField, ClientFormValues, FieldDefinition } from '@/lib/client-details';
import type { FieldErrors } from '@/lib/contact-validation';
import { isMissing, NOT_AVAILABLE } from '@/lib/format';
import type { ReactNode } from 'react';

const SHIPMENT_TYPE_OPTIONS = [
  { value: '', label: NOT_AVAILABLE },
  { value: 'FCL', label: 'FCL' },
  { value: 'LCL', label: 'LCL' },
];

const ROW_CLASSES =
  'grid grid-cols-[180px_1fr] items-center gap-4 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0';

export function FieldValue({ value }: { value: string | null }) {
  if (isMissing(value)) return <span className="text-text-secondary">{NOT_AVAILABLE}</span>;
  return <span className="break-words whitespace-pre-wrap">{value}</span>;
}

// A label and value row inside a <dl>
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={ROW_CLASSES}>
      <dt className="font-medium text-text-primary">{label}</dt>
      <dd className="min-w-0 text-text-primary">{children}</dd>
    </div>
  );
}

interface ClientFieldsCardProps {
  title?: string;
  label: string;
  fields: FieldDefinition[];
  client: Client;
  // Form values in edit mode; null when only viewing
  form: ClientFormValues | null;
  errors: FieldErrors;
  disabled: boolean;
  onChange: (field: ClientField, value: string) => void;
}

// A card of client fields: read-only rows, or inputs in edit mode (DESIGN 1.3)
export function ClientFieldsCard({
  title,
  label,
  fields,
  client,
  form,
  errors,
  disabled,
  onChange,
}: ClientFieldsCardProps) {
  return (
    <Card title={title} aria-label={label} className="text-body">
      {form ? (
        <div>
          {fields.map(({ name, label: fieldLabel }) => {
            const id = `client-${name}`;
            const error = errors[name];
            return (
              <div key={name} className={ROW_CLASSES}>
                <label htmlFor={id} className="font-medium text-text-primary">
                  {fieldLabel}
                </label>
                {name === 'shipmentType' ? (
                  <Select
                    id={id}
                    options={SHIPMENT_TYPE_OPTIONS}
                    value={form[name]}
                    disabled={disabled}
                    onChange={(event) => onChange(name, event.target.value)}
                  />
                ) : (
                  <div className="flex flex-col gap-1">
                    <Input
                      id={id}
                      value={form[name]}
                      disabled={disabled}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${id}-error` : undefined}
                      onChange={(event) => onChange(name, event.target.value)}
                    />
                    {error ? (
                      <p id={`${id}-error`} className="text-body-sm text-error-text">
                        {error}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <dl>
          {fields.map(({ name, label: fieldLabel }) => (
            <DetailRow key={name} label={fieldLabel}>
              <FieldValue value={client[name]} />
            </DetailRow>
          ))}
        </dl>
      )}
    </Card>
  );
}
