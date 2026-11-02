import { useMemo, useState } from 'react';
import { matchesSearch } from '@/services';
import type { AssigneeId, CategoryId, Priority, Status, Ticket, TicketType } from '@/types';
import { compareByPriorityThenAge } from '@/utils/priority';
import { STATUSES } from '@/utils/workflow';

export interface BoardFilters {
  priorities: Priority[];
  category: CategoryId | '';
  assignee: AssigneeId | '';
  search: string;
}

export const EMPTY_FILTERS: BoardFilters = { priorities: [], category: '', assignee: '', search: '' };

export function applyBoardFilters(tickets: Ticket[], type: TicketType, f: BoardFilters): Ticket[] {
  return tickets.filter(
    (t) =>
      t.type === type &&
      (f.priorities.length === 0 || f.priorities.includes(t.priority)) &&
      (!f.category || t.category === f.category) &&
      (!f.assignee || t.assignee === f.assignee) &&
      matchesSearch(t, f.search),
  );
}

/** Groups by status; inside each column, Crítica first and then oldest first. */
export function groupByStatus(tickets: Ticket[]): Record<Status, Ticket[]> {
  const columns = Object.fromEntries(STATUSES.map((s) => [s, [] as Ticket[]])) as Record<Status, Ticket[]>;
  for (const t of tickets) columns[t.status].push(t);
  for (const s of STATUSES) columns[s].sort(compareByPriorityThenAge);
  return columns;
}

export function useBoardFilters(tickets: Ticket[], type: TicketType) {
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS);
  const filtered = useMemo(() => applyBoardFilters(tickets, type, filters), [tickets, type, filters]);
  const columns = useMemo(() => groupByStatus(filtered), [filtered]);
  const active =
    filters.priorities.length > 0 || Boolean(filters.category || filters.assignee || filters.search);
  return { filters, setFilters, columns, total: filtered.length, active };
}
