import { useMemo } from 'react';
import { PRIORITIES } from '@/config/priorityMatrix';
import { SERVICES } from '@/config/services';
import type { Ticket, TicketType } from '@/types';
import { isSlaBreached } from '@/utils/sla';
import {
  averageResolutionMinutes,
  isRecurrentBreach,
  monthlyP1Breaches,
  overallSlaCompliance,
  p1RestoreCompliance,
  updateRequestCompliance,
} from '@/utils/slaCompliance';
import { isActive, STATUSES } from '@/utils/workflow';

export type RangeFilter = '7' | '30' | 'all';
export type TypeFilter = TicketType | 'all';

export interface Datum {
  name: string;
  value: number;
  key: string;
}

export function computeDashboard(all: Ticket[], now: Date, type: TypeFilter, range: RangeFilter) {
  const since = range === 'all' ? 0 : now.getTime() - Number(range) * 24 * 60 * 60_000;
  const tickets = all.filter(
    (t) => (type === 'all' || t.type === type) && new Date(t.createdAt).getTime() >= since,
  );
  const count = (fn: (t: Ticket) => boolean) => tickets.filter(fn).length;

  const byCategory: Datum[] = SERVICES.filter((s) => type === 'all' || s.type === type).map(
    (s) => ({
      key: s.id,
      name: s.shortName,
      value: count((t) => t.category === s.id),
    }),
  );
  const byPriority: Datum[] = PRIORITIES.map((p) => ({
    key: p,
    name: p,
    value: count((t) => t.priority === p),
  }));
  const byStatus: Datum[] = STATUSES.map((s) => ({
    key: s,
    name: s,
    value: count((t) => t.status === s),
  }));
  const byType: Datum[] = (['Incidente', 'Solicitud'] as const).map((k) => ({
    key: k,
    name: k === 'Incidente' ? 'Incidentes' : 'Solicitudes',
    value: count((t) => t.type === k),
  }));
  const tagCounts = new Map<string, number>();
  for (const t of tickets)
    for (const tag of t.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  const byTag: Datum[] = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([tag, value]) => ({ key: tag, name: tag, value }));

  // SLA objectives are measured over the whole history, not the type filter.
  const months = monthlyP1Breaches(all, now);
  return {
    total: tickets.length,
    open: count((t) => isActive(t.status)),
    criticalOpen: count((t) => t.priority === 'Crítica' && isActive(t.status)),
    breached: count((t) => isSlaBreached(t, now)),
    slaCompliance: overallSlaCompliance(tickets, now),
    avgResolution: averageResolutionMinutes(tickets),
    byCategory,
    byPriority,
    byStatus,
    byType,
    byTag,
    p1: p1RestoreCompliance(all),
    updates: updateRequestCompliance(all),
    months,
    recurrent: isRecurrentBreach(months.map((m) => m.breached)),
  };
}

export type DashboardData = ReturnType<typeof computeDashboard>;

export function useDashboardData(all: Ticket[], now: Date, type: TypeFilter, range: RangeFilter) {
  // Recompute at most once a minute for the clock.
  const minute = Math.floor(now.getTime() / 60_000);
  return useMemo(
    () => computeDashboard(all, new Date(minute * 60_000), type, range),
    [all, minute, type, range],
  );
}
