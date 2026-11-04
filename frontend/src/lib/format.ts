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

const detailsTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jerusalem',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// "Jul 20, 2026 14:32"
export function formatDetailsDate(iso: string): string {
  const date = new Date(iso);
  return `${tableDate.format(date)} ${detailsTime.format(date)}`;
}
