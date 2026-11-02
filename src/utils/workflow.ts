import type { Status } from '@/types';

export const STATUSES: Status[] = ['Abierto', 'En progreso', 'Resuelto', 'Cerrado'];

/** Allowed status transitions. Closed tickets are final (reopen = new ticket). */
export const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  Abierto: ['En progreso', 'Resuelto'],
  'En progreso': ['Abierto', 'Resuelto'],
  Resuelto: ['En progreso', 'Cerrado'],
  Cerrado: [],
};

export const canTransition = (from: Status, to: Status): boolean =>
  from === to || ALLOWED_TRANSITIONS[from].includes(to);

export const transitionError = (from: Status, to: Status): string | null => {
  if (canTransition(from, to)) return null;
  if (from === 'Cerrado') return 'Un ticket cerrado no se reabre: crea uno nuevo y vincúlalo.';
  if (to === 'Cerrado')
    return 'Solo se cierra un ticket resuelto (el solicitante confirma la solución).';
  return `No se puede pasar de ${from} a ${to}.`;
};

export const isActive = (status: Status): boolean =>
  status === 'Abierto' || status === 'En progreso';
