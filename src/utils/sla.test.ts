import { describe, expect, it } from 'vitest';
import type { Ticket } from '@/types';
import { computeClock, getTicketSla } from './sla';
import { isRecurrentBreach, p1RestoreCompliance } from './slaCompliance';
import { canTransition } from './workflow';
import { getEscalationHints } from './escalationHints';

const gt = (date: string, time: string) => new Date(`${date}T${time}:00-06:00`);

describe('computeClock', () => {
  const start = gt('2026-10-26', '09:00');
  it('verde con más del 25% restante', () => {
    expect(computeClock(start, undefined, 60, gt('2026-10-26', '09:30')).state).toBe('ok');
  });
  it('amarillo con menos del 25% restante', () => {
    expect(computeClock(start, undefined, 60, gt('2026-10-26', '09:50')).state).toBe('warning');
  });
  it('rojo cuando vence', () => {
    expect(computeClock(start, undefined, 60, gt('2026-10-26', '10:01')).state).toBe('breached');
  });
  it('detenido: cumplido o incumplido', () => {
    const now = gt('2026-10-27', '09:00');
    expect(computeClock(start, gt('2026-10-26', '09:40'), 60, now).state).toBe('met');
    expect(computeClock(start, gt('2026-10-26', '10:40'), 60, now).state).toBe('missed');
  });
});

const baseTicket = (over: Partial<Ticket>): Ticket => ({
  id: 'CAG-0001',
  type: 'Incidente',
  category: 'sitio-no-disponible',
  title: 't',
  description: '',
  tags: [],
  impact: 'Alto',
  urgency: 'Alta',
  priority: 'Crítica',
  status: 'Abierto',
  channel: 'Monitoreo UptimeRobot',
  requester: { name: 'x', email: 'x@example.com' },
  assignee: 'service-desk',
  level: 'Nivel 1',
  isProblem: false,
  knownError: false,
  linkedTicketIds: [],
  details: {},
  comments: [],
  history: [],
  createdAt: gt('2026-10-26', '09:00').toISOString(),
  updatedAt: gt('2026-10-26', '09:00').toISOString(),
  ...over,
});

describe('getTicketSla', () => {
  it('usa los tiempos de la celda de la matriz', () => {
    const sla = getTicketSla(baseTicket({}), gt('2026-10-26', '09:10'));
    expect(sla.response.targetMinutes).toBe(15);
    expect(sla.resolution.targetMinutes).toBe(240);
    expect(sla.response.state).toBe('ok');
  });
  it('el reloj está en pausa fuera de ventana', () => {
    expect(getTicketSla(baseTicket({}), gt('2026-10-31', '10:00')).paused).toBe(true);
  });
});

describe('p1RestoreCompliance', () => {
  it('mide P1 restaurados en ≤ 90 min y ≤ 75 min (interno)', () => {
    const res = p1RestoreCompliance([
      baseTicket({ resolvedAt: gt('2026-10-26', '10:00').toISOString() }), // 60 min
      baseTicket({ resolvedAt: gt('2026-10-26', '10:20').toISOString() }), // 80 min
      baseTicket({ resolvedAt: gt('2026-10-26', '11:00').toISOString() }), // 120 min
      baseTicket({}), // still open: not measured
    ]);
    expect(res.total).toBe(3);
    expect(res.withinTarget).toBe(2);
    expect(res.withinInternal).toBe(1);
  });
});

describe('isRecurrentBreach (2 meses seguidos o 3 en 6)', () => {
  it('un incumplimiento aislado no es recurrente', () => {
    expect(isRecurrentBreach([false, true, false, false, false, false])).toBe(false);
  });
  it('2 meses seguidos sí', () => {
    expect(isRecurrentBreach([false, false, true, true, false, false])).toBe(true);
  });
  it('3 en 6 aunque no sean seguidos', () => {
    expect(isRecurrentBreach([true, false, true, false, true, false])).toBe(true);
  });
  it('solo cuenta los últimos 6 meses', () => {
    expect(isRecurrentBreach([true, true, false, false, true, false, false, false])).toBe(false);
  });
});

describe('workflow', () => {
  it('no se reabre un ticket cerrado ni se cierra uno sin resolver', () => {
    expect(canTransition('Cerrado', 'Abierto')).toBe(false);
    expect(canTransition('Abierto', 'Cerrado')).toBe(false);
    expect(canTransition('Resuelto', 'Cerrado')).toBe(true);
    expect(canTransition('Resuelto', 'En progreso')).toBe(true);
  });
});

describe('getEscalationHints', () => {
  it('sugiere escalamiento funcional pasados 10 min de un Crítico en Nivel 1', () => {
    expect(getEscalationHints(baseTicket({}), gt('2026-10-26', '09:05'))).toHaveLength(0);
    const hints = getEscalationHints(baseTicket({}), gt('2026-10-26', '09:11'));
    expect(hints.map((h) => h.route)).toEqual(['funcional']);
  });
  it('sugiere escalamiento jerárquico cuando un P1 se proyecta a más de 90 min', () => {
    const hints = getEscalationHints(
      baseTicket({ assignee: 'resp-tecnico' }),
      gt('2026-10-26', '10:20'),
    );
    expect(hints.map((h) => h.to)).toEqual(['dueno']);
  });
});
