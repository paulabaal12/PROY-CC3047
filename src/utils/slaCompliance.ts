import {
  BUSINESS_DAY_MINUTES,
  P1_RESTORE_INTERNAL_MINUTES,
  P1_RESTORE_MINUTES,
  RECURRENCE_RULE,
  UPDATE_REQUEST_DAYS,
  UPDATE_REQUEST_INTERNAL_DAYS,
} from '@/config/sla';
import type { Ticket } from '@/types';
import { businessMinutesBetween } from './businessHours';
import { isSlaBreached } from './sla';

export interface ObjectiveResult {
  total: number;
  withinTarget: number;
  withinInternal: number;
  /** null when there is nothing to measure yet. */
  percent: number | null;
  internalPercent: number | null;
}

const pct = (part: number, total: number): number | null =>
  total === 0 ? null : Math.round((part / total) * 1000) / 10;

const resolutionMinutes = (t: Ticket): number | null =>
  t.resolvedAt ? businessMinutesBetween(new Date(t.createdAt), new Date(t.resolvedAt)) : null;

function measure(tickets: Ticket[], target: number, internal: number): ObjectiveResult {
  const durations = tickets.map(resolutionMinutes).filter((m): m is number => m !== null);
  const within = durations.filter((m) => m <= target).length;
  const withinInternal = durations.filter((m) => m <= internal).length;
  return {
    total: durations.length,
    withinTarget: within,
    withinInternal,
    percent: pct(within, durations.length),
    internalPercent: pct(withinInternal, durations.length),
  };
}

export const isP1Incident = (t: Ticket): boolean =>
  t.type === 'Incidente' && t.priority === 'Crítica';

/** Objective 2: P1 incidents restored in ≤ 90 min (internal: ≤ 75 min). */
export const p1RestoreCompliance = (tickets: Ticket[]): ObjectiveResult =>
  measure(tickets.filter(isP1Incident), P1_RESTORE_MINUTES, P1_RESTORE_INTERNAL_MINUTES);

/** Objective 3: update/retire requests resolved in ≤ 3 business days (internal: ≤ 2). */
export const updateRequestCompliance = (tickets: Ticket[]): ObjectiveResult =>
  measure(
    tickets.filter((t) => t.category === 'actualizacion'),
    UPDATE_REQUEST_DAYS * BUSINESS_DAY_MINUTES,
    UPDATE_REQUEST_INTERNAL_DAYS * BUSINESS_DAY_MINUTES,
  );

/** Share of tickets whose response and resolution targets are (so far) met. */
export function overallSlaCompliance(tickets: Ticket[], now: Date): number | null {
  const ok = tickets.filter((t) => !isSlaBreached(t, now)).length;
  return pct(ok, tickets.length);
}

/** Average business minutes from creation to resolution (resolved tickets only). */
export function averageResolutionMinutes(tickets: Ticket[]): number | null {
  const durations = tickets.map(resolutionMinutes).filter((m): m is number => m !== null);
  if (!durations.length) return null;
  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

/**
 * Recurrent breach rule (Fase 1). `monthly` holds one flag per month, oldest first.
 * Recurrent if two consecutive months were breached, or 3+ breaches within the last 6.
 */
export function isRecurrentBreach(monthly: boolean[]): boolean {
  const window = monthly.slice(-RECURRENCE_RULE.windowMonths);
  let run = 0;
  let longestRun = 0;
  for (const breached of window) {
    run = breached ? run + 1 : 0;
    longestRun = Math.max(longestRun, run);
  }
  return (
    longestRun >= RECURRENCE_RULE.consecutiveMonths ||
    window.filter(Boolean).length >= RECURRENCE_RULE.breachesInWindow
  );
}

export interface MonthBreach {
  key: string;
  label: string;
  total: number;
  breached: boolean;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** P1 objective per month for the last `months` months (oldest first). */
export function monthlyP1Breaches(tickets: Ticket[], now: Date, months = 6): MonthBreach[] {
  const result: MonthBreach[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    const inMonth = tickets.filter((t) => t.createdAt.slice(0, 7) === key);
    const res = p1RestoreCompliance(inMonth);
    result.push({
      key,
      label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      total: res.total,
      breached: res.percent !== null && res.percent < 90,
    });
  }
  return result;
}
