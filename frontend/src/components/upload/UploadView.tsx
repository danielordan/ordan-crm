'use client';

import { CloudUpload, FileText, LoaderCircle, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { SessionExpiredError } from '@/lib/clients-api';
import { uploadDocument, validatePdfFile, type UploadOutcome } from '@/lib/upload';

// Upload PDF screen (DESIGN 1.2). Processing starts as soon as a file is chosen.
export function UploadView() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [outcome, setOutcome] = useState<UploadOutcome | null>(null);
  // Kept in the browser's memory only, so Try Again can send the same file
  const lastFile = useRef<File | null>(null);

  // A file dropped outside the drop area would otherwise open in the tab and leave the app
  useEffect(() => {
    const preventOpeningFile = (event: globalThis.DragEvent) => event.preventDefault();
    window.addEventListener('dragover', preventOpeningFile);
    window.addEventListener('drop', preventOpeningFile);
    return () => {
      window.removeEventListener('dragover', preventOpeningFile);
      window.removeEventListener('drop', preventOpeningFile);
    };
  }, []);

  async function processFile(file: File) {
    lastFile.current = file;
    const invalid = validatePdfFile(file);
    if (invalid) {
      setOutcome(invalid);
      return;
    }

    setOutcome(null);
    setProcessing(true);
    try {
      setOutcome(await uploadDocument(file));
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        router.replace(`/sign-in?callbackUrl=${encodeURIComponent('/upload')}`);
        return;
      }
      throw error;
    } finally {
      setProcessing(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    // One file per upload (PRD 4.3): if several are dropped, only the first is processed
    const file = event.dataTransfer.files[0];
    if (file && !processing) void processFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!processing) setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // Moving onto a child element is not leaving the area
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1">Upload PDF</h1>

      <div
        data-testid="drop-area"
        aria-busy={processing}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-border bg-surface px-6 py-16 text-center transition-colors',
          dragging && 'border-primary bg-primary-light',
          processing && 'opacity-70',
        )}
      >
        <CloudUpload aria-hidden="true" className="size-12 text-navy" strokeWidth={1.5} />
        <p className="mt-2 text-h3 text-text-primary">Drag and drop PDF file here</p>
        <p className="text-body text-text-secondary">or</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          aria-label="PDF file"
          hidden
          disabled={processing}
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Reset, so that choosing the same file again starts a new upload
            event.target.value = '';
            if (file) void processFile(file);
          }}
        />
        <Button
          variant="secondary"
          icon={<FileText />}
          disabled={processing}
          onClick={() => inputRef.current?.click()}
          className="my-2"
        >
          Choose PDF File
        </Button>
        {processing ? (
          <p role="status" className="flex items-center gap-2 text-body text-text-primary">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-primary" />
            Processing...
          </p>
        ) : (
          <p className="text-body text-text-secondary">
            Only PDF files are supported. Maximum size: 4 MB.
          </p>
        )}
      </div>

      {outcome ? (
        <Alert
          variant={outcome.variant}
          title={outcome.details ? outcome.message : undefined}
          action={
            outcome.canRetry ? (
              <Button
                variant="secondary"
                onClick={() => {
                  if (lastFile.current) void processFile(lastFile.current);
                }}
              >
                Try Again
              </Button>
            ) : outcome.clientId ? (
              <Button
                variant="secondary"
                icon={<Pencil />}
                onClick={() => router.push(`/clients/${outcome.clientId}?edit=true`)}
              >
                Edit Client
              </Button>
            ) : undefined
          }
        >
          {outcome.details ?? outcome.message}
        </Alert>
      ) : null}
    </div>
  );
}
