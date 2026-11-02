import type { Impact, Priority, Urgency } from '@/types';

/** A business duration. Days are business days (one day = one full service window). */
export type BusinessDuration = { minutes: number } | { days: number };

export interface MatrixCell {
  priority: Priority;
  response: BusinessDuration;
  resolution: BusinessDuration;
  /** Label as written in the Fase 1 document. */
  label: string;
}

export const IMPACTS: Impact[] = ['Alto', 'Medio', 'Bajo'];
export const URGENCIES: Urgency[] = ['Alta', 'Media', 'Baja'];
export const PRIORITIES: Priority[] = ['Crítica', 'Alta', 'Media', 'Baja', 'Planificada'];

/** Impact × urgency matrix, exactly as defined in Fase 1. */
export const PRIORITY_MATRIX: Record<Impact, Record<Urgency, MatrixCell>> = {
  Alto: {
    Alta: {
      priority: 'Crítica',
      response: { minutes: 15 },
      resolution: { minutes: 4 * 60 },
      label: 'Respuesta 15 min · resolución 4 h',
    },
    Media: {
      priority: 'Alta',
      response: { minutes: 30 },
      resolution: { minutes: 8 * 60 },
      label: 'Respuesta 30 min · resolución 8 h (mismo día)',
    },
    Baja: {
      priority: 'Media',
      response: { minutes: 2 * 60 },
      resolution: { days: 2 },
      label: 'Respuesta 2 h · resolución 2 días hábiles',
    },
  },
  Medio: {
    Alta: {
      priority: 'Alta',
      response: { minutes: 30 },
      resolution: { minutes: 8 * 60 },
      label: 'Respuesta 30 min · resolución 8 h (mismo día)',
    },
    Media: {
      priority: 'Media',
      response: { minutes: 4 * 60 },
      resolution: { days: 2 },
      label: 'Respuesta 4 h · resolución 2 días hábiles',
    },
    Baja: {
      priority: 'Baja',
      response: { days: 1 },
      resolution: { days: 5 },
      label: 'Respuesta 1 día hábil · resolución 5 días hábiles',
    },
  },
  Bajo: {
    Alta: {
      priority: 'Media',
      response: { minutes: 4 * 60 },
      resolution: { days: 2 },
      label: 'Respuesta 4 h · resolución 2 días hábiles',
    },
    Media: {
      priority: 'Baja',
      response: { days: 1 },
      resolution: { days: 5 },
      label: 'Respuesta 1 día hábil · resolución 5 días hábiles',
    },
    Baja: {
      priority: 'Planificada',
      response: { days: 2 },
      resolution: { days: 10 },
      label: 'Respuesta 2 días hábiles · resolución 10 días hábiles',
    },
  },
};

export const PRIORITY_RANK: Record<Priority, number> = {
  Crítica: 0,
  Alta: 1,
  Media: 2,
  Baja: 3,
  Planificada: 4,
};

export const IMPACT_CRITERIA: Record<Impact, string> = {
  Alto: 'Afecta a todos o al sitio completo: el catálogo no carga o más del 50% de las fichas están inaccesibles.',
  Medio:
    'Una función clave falla sin tumbar el sitio, o entre el 10% y el 50% del catálogo está afectado.',
  Bajo: 'Un elemento puntual, o menos del 10% del catálogo.',
};

export const URGENCY_CRITERIA: Record<Urgency, string> = {
  Alta: 'No hay forma alternativa de usar el servicio, o coincide con una publicación o tarea programada.',
  Media: 'Existe una forma parcial de seguir consultando el catálogo.',
  Baja: 'No impide la consulta ni la difusión; se puede programar.',
};
