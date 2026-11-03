// Normalization used for duplicate detection and phone search (ARCHITECTURE 9.4)

export function normalizeCompanyName(value: string | null | undefined): string | null {
  const normalized = (value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  return normalized || null;
}

export function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim().toLowerCase();
  return normalized || null;
}

export function phoneToDigits(value: string | null | undefined): string | null {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits || null;
}
