import { describe, expect, it } from 'vitest';
import type { Impact, Priority, Ticket, Urgency } from '@/types';
import { calculatePriority, compareByPriorityThenAge, getSlaTargets } from './priority';

const H = 60;
const D = 9 * 60; // one business day

// [impact, urgency, priority, response (business min), resolution (business min)]
const MATRIX: [Impact, Urgency, Priority, number, number][] = [
  ['Alto', 'Alta', 'Crítica', 15, 4 * H],
  ['Alto', 'Media', 'Alta', 30, 8 * H],
  ['Alto', 'Baja', 'Media', 2 * H, 2 * D],
  ['Medio', 'Alta', 'Alta', 30, 8 * H],
  ['Medio', 'Media', 'Media', 4 * H, 2 * D],
  ['Medio', 'Baja', 'Baja', 1 * D, 5 * D],
  ['Bajo', 'Alta', 'Media', 4 * H, 2 * D],
  ['Bajo', 'Media', 'Baja', 1 * D, 5 * D],
  ['Bajo', 'Baja', 'Planificada', 2 * D, 10 * D],
];

describe('calculatePriority (matriz impacto × urgencia de la Fase 1)', () => {
  it.each(MATRIX)('impacto %s × urgencia %s → %s', (impact, urgency, priority) => {
    expect(calculatePriority(impact, urgency)).toBe(priority);
  });

  it.each(MATRIX)(
    'impacto %s × urgencia %s → tiempos de SLA',
    (impact, urgency, _priority, response, resolution) => {
      const targets = getSlaTargets(impact, urgency);
      expect(targets.responseMinutes).toBe(response);
      expect(targets.resolutionMinutes).toBe(resolution);
    },
  );
});

describe('compareByPriorityThenAge', () => {
  const t = (priority: Priority, createdAt: string) => ({ priority, createdAt }) as Ticket;

  it('ordena Crítica arriba y, a igual prioridad, el más antiguo primero', () => {
    const list = [
      t('Baja', '2026-10-01T10:00:00Z'),
      t('Crítica', '2026-10-05T10:00:00Z'),
      t('Crítica', '2026-10-02T10:00:00Z'),
      t('Planificada', '2026-09-01T10:00:00Z'),
      t('Alta', '2026-10-03T10:00:00Z'),
    ].sort(compareByPriorityThenAge);
    expect(list.map((x) => `${x.priority}@${x.createdAt.slice(5, 10)}`)).toEqual([
      'Crítica@10-02',
      'Crítica@10-05',
      'Alta@10-03',
      'Baja@10-01',
      'Planificada@09-01',
    ]);
  });
});
