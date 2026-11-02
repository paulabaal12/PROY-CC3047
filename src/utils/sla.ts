import { SLA_WARNING_RATIO } from '@/config/sla';
import type { Ticket } from '@/types';
import {
  addBusinessMinutes,
  businessMinutesBetween,
  DEFAULT_WINDOW,
  isWithinServiceWindow,
  type WindowConfig,
} from './businessHours';
import { getSlaTargets } from './priority';

/** ok/warning/breached while running; met/missed once stopped. */
export type SlaState = 'ok' | 'warning' | 'breached' | 'met' | 'missed';

export interface SlaClock {
  targetMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  deadline: Date;
  state: SlaState;
  stopped: boolean;
}

export function computeClock(
  start: Date,
  stop: Date | undefined,
  targetMinutes: number,
  now: Date,
  cfg: WindowConfig = DEFAULT_WINDOW,
): SlaClock {
  const elapsed = businessMinutesBetween(start, stop ?? now, cfg);
  const remaining = targetMinutes - elapsed;
  let state: SlaState;
  if (stop) state = elapsed <= targetMinutes ? 'met' : 'missed';
  else if (remaining < 0) state = 'breached';
  else if (remaining / targetMinutes < SLA_WARNING_RATIO) state = 'warning';
  else state = 'ok';
  return {
    targetMinutes,
    elapsedMinutes: elapsed,
    remainingMinutes: remaining,
    deadline: addBusinessMinutes(start, targetMinutes, cfg),
    state,
    stopped: Boolean(stop),
  };
}

export interface TicketSla {
  response: SlaClock;
  resolution: SlaClock;
  /** The clock is not running right now (outside the service window). */
  paused: boolean;
}

const toDate = (iso?: string): Date | undefined => (iso ? new Date(iso) : undefined);

export function getTicketSla(
  ticket: Ticket,
  now: Date,
  cfg: WindowConfig = DEFAULT_WINDOW,
): TicketSla {
  const targets = getSlaTargets(ticket.impact, ticket.urgency);
  const created = new Date(ticket.createdAt);
  const resolved = toDate(ticket.resolvedAt) ?? toDate(ticket.closedAt);
  const responded = toDate(ticket.respondedAt) ?? resolved;
  return {
    response: computeClock(created, responded, targets.responseMinutes, now, cfg),
    resolution: computeClock(created, resolved, targets.resolutionMinutes, now, cfg),
    paused: !isWithinServiceWindow(now, cfg),
  };
}

/** Problem records are managed by problem management, not by the incident SLA clocks. */
export const isSlaExempt = (ticket: Ticket): boolean => ticket.isProblem;

const isBad = (c: SlaClock) => c.state === 'breached' || c.state === 'missed';

/** True if either the response or the resolution target was (or is being) missed. */
export function isSlaBreached(
  ticket: Ticket,
  now: Date,
  cfg: WindowConfig = DEFAULT_WINDOW,
): boolean {
  if (isSlaExempt(ticket)) return false;
  const sla = getTicketSla(ticket, now, cfg);
  return isBad(sla.response) || isBad(sla.resolution);
}
