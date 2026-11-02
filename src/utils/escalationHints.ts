import { L1_ESCALATION_LIMIT, P1_HIERARCHICAL_THRESHOLD } from '@/config/escalation';
import type { AssigneeId, EscalationRoute, Ticket } from '@/types';
import { businessMinutesBetween } from './businessHours';
import { isActive } from './workflow';

export interface EscalationHint {
  route: EscalationRoute;
  to: AssigneeId;
  reason: string;
}

const escalatedHierarchically = (t: Ticket): boolean =>
  t.history.some((h) => h.kind === 'escalation' && h.to === 'dueno');

/** Suggests escalations that are due according to the Fase 1 rules. */
export function getEscalationHints(ticket: Ticket, now: Date): EscalationHint[] {
  if (!isActive(ticket.status) || ticket.type !== 'Incidente') return [];
  const hints: EscalationHint[] = [];
  const elapsed = businessMinutesBetween(new Date(ticket.createdAt), now);
  const limit = L1_ESCALATION_LIMIT[ticket.priority];
  if (ticket.assignee === 'service-desk' && limit !== undefined && elapsed > limit) {
    hints.push({
      route: 'funcional',
      to: 'resp-tecnico',
      reason: `Prioridad ${ticket.priority}: Nivel 1 superó los ${limit} min sin resolver.`,
    });
  }
  if (
    ticket.priority === 'Crítica' &&
    elapsed > P1_HIERARCHICAL_THRESHOLD &&
    ticket.assignee !== 'dueno' &&
    !escalatedHierarchically(ticket)
  ) {
    hints.push({
      route: 'jerarquica',
      to: 'dueno',
      reason: `P1 con ${Math.round(elapsed)} min: se proyecta a más de 90 min.`,
    });
  }
  return hints;
}
