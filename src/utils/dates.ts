const TZ = 'America/Guatemala';

const HAS_ZONE = /([zZ]|[+-]\d{2}:?\d{2})$/;

/**
 * ISO timestamp in UTC. Values without a zone (Kobo's `_submission_time`) are UTC, but
 * `new Date()` would read them as local time and shift them 6 h into the future.
 */
export function toUtcIso(value: string): string {
  const ms = Date.parse(HAS_ZONE.test(value) ? value : `${value}Z`);
  return Number.isNaN(ms) ? value : new Date(ms).toISOString();
}

const dateTimeFmt = new Intl.DateTimeFormat('es-GT', {
  timeZone: TZ,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFmt = new Intl.DateTimeFormat('es-GT', {
  timeZone: TZ,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const formatDateTime = (iso: string | Date): string => dateTimeFmt.format(new Date(iso));
export const formatDate = (iso: string | Date): string => dateFmt.format(new Date(iso));

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

/** "hace 5 min", "hace 3 días" (calendar time, not business time). */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diffMin = Math.round((new Date(iso).getTime() - now.getTime()) / 60_000);
  const abs = Math.abs(diffMin);
  if (abs < 60) return rtf.format(diffMin, 'minute');
  if (abs < 60 * 24) return rtf.format(Math.round(diffMin / 60), 'hour');
  return rtf.format(Math.round(diffMin / (60 * 24)), 'day');
}
