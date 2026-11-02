import { PRIORITY_MATRIX, PRIORITY_RANK, type MatrixCell } from '@/config/priorityMatrix';
import type { Impact, Priority, Ticket, Urgency } from '@/types';
import { toBusinessMinutes } from './businessHours';

export const getMatrixCell = (impact: Impact, urgency: Urgency): MatrixCell =>
  PRIORITY_MATRIX[impact][urgency];

/** Priority is always derived from impact × urgency; never typed by hand. */
export const calculatePriority = (impact: Impact, urgency: Urgency): Priority =>
  getMatrixCell(impact, urgency).priority;

export interface SlaTargets {
  responseMinutes: number;
  resolutionMinutes: number;
  label: string;
}

export function getSlaTargets(impact: Impact, urgency: Urgency): SlaTargets {
  const cell = getMatrixCell(impact, urgency);
  return {
    responseMinutes: toBusinessMinutes(cell.response),
    resolutionMinutes: toBusinessMinutes(cell.resolution),
    label: cell.label,
  };
}

/** Board order: highest priority first, then oldest first. */
export const compareByPriorityThenAge = (a: Ticket, b: Ticket): number =>
  PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.createdAt.localeCompare(b.createdAt);
