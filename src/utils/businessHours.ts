import { BUSINESS_DAY_MINUTES, HOLIDAYS, SERVICE_WINDOW } from '@/config/sla';
import type { BusinessDuration } from '@/config/priorityMatrix';

export interface WindowConfig {
  utcOffsetMinutes: number;
  workDays: readonly number[];
  startMinute: number;
  endMinute: number;
  holidays: readonly string[];
}

export const DEFAULT_WINDOW: WindowConfig = { ...SERVICE_WINDOW, holidays: HOLIDAYS };

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Index of the local (service time zone) calendar day containing `ms`. */
const localDayIndex = (ms: number, cfg: WindowConfig): number =>
  Math.floor((ms + cfg.utcOffsetMinutes * MINUTE) / DAY);

/** UTC timestamp of local midnight for a day index. */
const localMidnightUtc = (day: number, cfg: WindowConfig): number =>
  day * DAY - cfg.utcOffsetMinutes * MINUTE;

const isWorkDay = (day: number, cfg: WindowConfig): boolean => {
  const asUtc = new Date(day * DAY);
  const weekday = asUtc.getUTCDay() === 0 ? 7 : asUtc.getUTCDay();
  if (!cfg.workDays.includes(weekday)) return false;
  return !cfg.holidays.includes(asUtc.toISOString().slice(0, 10));
};

const windowOf = (day: number, cfg: WindowConfig): [number, number] => {
  const midnight = localMidnightUtc(day, cfg);
  return [midnight + cfg.startMinute * MINUTE, midnight + cfg.endMinute * MINUTE];
};

/** True when `date` falls inside the service window (a work day, between start and end). */
export function isWithinServiceWindow(date: Date, cfg: WindowConfig = DEFAULT_WINDOW): boolean {
  const ms = date.getTime();
  const day = localDayIndex(ms, cfg);
  if (!isWorkDay(day, cfg)) return false;
  const [start, end] = windowOf(day, cfg);
  return ms >= start && ms < end;
}

/** Business minutes elapsed between two instants; only time inside the window counts. */
export function businessMinutesBetween(
  start: Date,
  end: Date,
  cfg: WindowConfig = DEFAULT_WINDOW,
): number {
  const from = start.getTime();
  const to = end.getTime();
  if (to <= from) return 0;
  let total = 0;
  const lastDay = localDayIndex(to, cfg);
  for (let day = localDayIndex(from, cfg); day <= lastDay; day++) {
    if (!isWorkDay(day, cfg)) continue;
    const [ws, we] = windowOf(day, cfg);
    total += Math.max(0, Math.min(to, we) - Math.max(from, ws));
  }
  return total / MINUTE;
}

/**
 * Instant at which `minutes` business minutes have run from `start`.
 * If `start` is outside the window, the clock starts at the next opening.
 */
export function addBusinessMinutes(
  start: Date,
  minutes: number,
  cfg: WindowConfig = DEFAULT_WINDOW,
): Date {
  let remaining = Math.max(0, minutes) * MINUTE;
  let cursor = start.getTime();
  let day = localDayIndex(cursor, cfg);
  // Guard: a 10-year horizon is far beyond any SLA.
  for (let i = 0; i < 3660; i++, day++) {
    if (isWorkDay(day, cfg)) {
      const [ws, we] = windowOf(day, cfg);
      const from = Math.max(cursor, ws);
      if (from < we) {
        const available = we - from;
        if (remaining <= available) return new Date(from + remaining);
        remaining -= available;
      }
    }
    cursor = localMidnightUtc(day + 1, cfg);
  }
  throw new Error('addBusinessMinutes: no business time found');
}

/** Next instant the clock runs (now if already inside the window). */
export function nextWindowOpening(date: Date, cfg: WindowConfig = DEFAULT_WINDOW): Date {
  return addBusinessMinutes(date, 0, cfg);
}

/** Moves back `days` work days from `date`'s local day (0 = today if it is a work day). */
export function businessDaysBefore(
  date: Date,
  days: number,
  cfg: WindowConfig = DEFAULT_WINDOW,
): number {
  let day = localDayIndex(date.getTime(), cfg);
  let left = days;
  while (!isWorkDay(day, cfg)) day--;
  while (left > 0) {
    day--;
    if (isWorkDay(day, cfg)) left--;
  }
  return day;
}

/** UTC instant for local `hh:mm` on a local day index. */
export function atLocalTime(
  day: number,
  hours: number,
  minutes = 0,
  cfg: WindowConfig = DEFAULT_WINDOW,
): Date {
  return new Date(localMidnightUtc(day, cfg) + (hours * 60 + minutes) * MINUTE);
}

export const toBusinessMinutes = (duration: BusinessDuration): number =>
  'days' in duration ? duration.days * BUSINESS_DAY_MINUTES : duration.minutes;

/** "45 min", "3 h 20 min", "2 d háb 1 h". Days are business days of 9 h. */
export function formatBusinessMinutes(total: number): string {
  const m = Math.max(0, Math.round(Math.abs(total)));
  const days = Math.floor(m / BUSINESS_DAY_MINUTES);
  const hours = Math.floor((m % BUSINESS_DAY_MINUTES) / 60);
  const mins = m % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} d háb`);
  if (hours) parts.push(`${hours} h`);
  if (mins && !days) parts.push(`${mins} min`);
  return parts.length ? parts.join(' ') : '0 min';
}
