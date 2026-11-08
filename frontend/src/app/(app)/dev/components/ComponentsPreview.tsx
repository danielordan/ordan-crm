'use client';

import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';

const COLORS = [
  ['Primary', 'bg-primary', '#00C8C8'],
  ['Primary Dark', 'bg-navy', '#0F1B3D'],
  ['Primary Light', 'bg-primary-light', '#E6FBFB'],
  ['Accent', 'bg-accent', '#B2EBF2'],
  ['Success', 'bg-success', '#22C55E'],
  ['Warning', 'bg-warning', '#F59E0B'],
  ['Error', 'bg-error', '#EF4444'],
  ['Info', 'bg-info', '#3B82F6'],
  ['Background', 'bg-background', '#F8FAFC'],
  ['Surface', 'bg-surface', '#FFFFFF'],
  ['Border', 'bg-border', '#E5E7EB'],
  ['Text Primary', 'bg-text-primary', '#0F172A'],
  ['Text Secondary', 'bg-text-secondary', '#64748B'],
] as const;

export function ComponentsPreview() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-h1">Design System Preview</h1>
        <p className="text-body text-text-secondary">Development only — not part of the product.</p>
      </div>

      <Card title="Colors">
        <div className="grid grid-cols-5 gap-4">
          {COLORS.map(([name, className, hex]) => (
            <div key={name} className="flex flex-col gap-2">
              <div className={`h-14 rounded-control border border-border ${className}`} />
              <div>
                <p className="text-body font-medium">{name}</p>
                <p className="text-body-sm text-text-secondary">{hex}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Typography (Inter)">
        <div className="flex flex-col gap-2">
          <p className="text-h1">Heading 1 — 32px Bold</p>
          <p className="text-h2">Heading 2 — 24px Semibold</p>
          <p className="text-h3">Heading 3 — 18px Semibold</p>
          <p className="text-subtitle">Subtitle — 16px Medium</p>
          <p className="text-body-lg">Body Large — 16px Regular</p>
          <p className="text-body">Body — 14px Regular</p>
          <p className="text-body-sm text-text-secondary">Body Small — 12px Regular</p>
        </div>
      </Card>

      <Card title="Buttons">
        <div className="flex flex-wrap gap-4">
          <Button icon={<Plus />}>Upload PDF</Button>
          <Button variant="secondary" icon={<RefreshCw />}>
            Refresh
          </Button>
          <Button variant="secondary" icon={<Pencil />}>
            Edit
          </Button>
          <Button variant="destructive-outline" icon={<Trash2 />}>
            Delete
          </Button>
          <Button variant="destructive">Delete</Button>
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>
            Previous
          </Button>
        </div>
      </Card>

      <Card title="Inputs and filters">
        <div className="flex gap-4">
          <Input
            className="flex-1"
            icon={<Search />}
            placeholder="Search by company, email, phone, country, port..."
          />
          <Select
            className="w-56"
            aria-label="Processing status"
            options={[
              { value: '', label: 'All Processing Status' },
              { value: 'Success', label: 'Success' },
              { value: 'Failed', label: 'Failed' },
            ]}
          />
        </div>
      </Card>

      <Card title="Status badges">
        <div className="flex gap-4">
          <StatusBadge status="Success" />
          <StatusBadge status="Failed" />
        </div>
      </Card>

      <Card title="Alerts">
        <div className="flex flex-col gap-4">
          <Alert variant="success">Client added successfully.</Alert>
          <Alert variant="info">Client already exists. No changes were made.</Alert>
          <Alert variant="warning">
            Information was extracted, but some required fields are missing.
          </Alert>
          <Alert variant="error" action={<Button variant="secondary">Try Again</Button>}>
            Something went wrong. Please try again.
          </Alert>
        </div>
      </Card>

      <Card title="Modal">
        <Button variant="destructive-outline" icon={<Trash2 />} onClick={() => setModalOpen(true)}>
          Open delete modal
        </Button>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Delete Client"
        icon={
          <span className="flex size-12 items-center justify-center rounded-full bg-error-light">
            <Trash2 aria-hidden="true" className="size-5 text-error" />
          </span>
        }
        footer={
          <>
            <Button variant="secondary" className="w-32" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="w-32" onClick={() => setModalOpen(false)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-body-lg">Are you sure you want to delete this client?</p>
        <p className="mt-1 text-body text-text-secondary">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
