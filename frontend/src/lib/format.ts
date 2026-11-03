// Display helpers (PRD 3.ג): missing values and dates in Asia/Jerusalem

export const NOT_AVAILABLE = 'NOT Available';

export function isMissing(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === '';
}

const tableDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Jerusalem',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

// "Jul 20, 2026"
export function formatTableDate(iso: string): string {
  return tableDate.format(new Date(iso));
}
