import { beforeEach, describe, expect, it } from 'vitest';
import { PRIORITIES } from '@/config/priorityMatrix';
import { CHANNELS } from '@/config/roles';
import { SERVICES } from '@/config/services';
import type { Actor, NewTicketInput } from '@/types';
import { STATUSES } from '@/utils/workflow';
import { isSlaBreached } from '@/utils/sla';
import { buildSeed } from './seed';
import { createMemoryStorage } from './storage';
import { createTicketService, type TicketService } from './ticketService';

// Monday 26 Oct 2026, 10:00 Guatemala time
let clock = new Date('2026-10-26T10:00:00-06:00');
const advance = (minutes: number) => (clock = new Date(clock.getTime() + minutes * 60_000));

const desk: Actor = { role: 'service-desk', name: 'Andrea Solís' };
const user: Actor = { role: 'usuario', name: 'Lucía Méndez' };

const incident: NewTicketInput = {
  type: 'Incidente',
  category: 'sitio-no-disponible',
  title: 'Sitio caído',
  description: 'No carga',
  impact: 'Alto',
  urgency: 'Alta',
  channel: 'Monitoreo UptimeRobot',
  requester: { name: 'Lucía Méndez', email: 'lucia.mendez@example.com' },
  details: { url: 'https://centralamerica.games/', desde: '', error: '503' },
};

let service: TicketService;

beforeEach(() => {
  clock = new Date('2026-10-26T10:00:00-06:00');
  service = createTicketService({ storage: createMemoryStorage(), now: () => clock });
});

describe('ticketService.create', () => {
  it('asigna IDs CAG-0001, CAG-0002… y calcula la prioridad', async () => {
    const a = await service.create(incident, user);
    const b = await service.create({ ...incident, impact: 'Bajo', urgency: 'Baja' }, user);
    expect(a.id).toBe('CAG-0001');
    expect(b.id).toBe('CAG-0002');
    expect(a.priority).toBe('Crítica');
    expect(b.priority).toBe('Planificada');
    expect(a.status).toBe('Abierto');
    expect(a.assignee).toBe('service-desk');
    expect(a.history[0]?.kind).toBe('created');
  });

  it('persiste en el storage y filtra por solicitante', async () => {
    await service.create(incident, user);
    await service.create(
      { ...incident, requester: { name: 'Otro', email: 'otro@example.com' } },
      user,
    );
    const mine = await service.list({ requesterEmail: 'lucia.mendez@example.com' });
    expect(mine).toHaveLength(1);
  });
});

describe('ticketService.update', () => {
  it('recalcula la prioridad al cambiar impacto y lo deja en el historial', async () => {
    const t = await service.create(incident, user);
    const updated = await service.update(t.id, { impact: 'Medio' }, desk);
    expect(updated.priority).toBe('Alta');
    const kinds = updated.history.map((h) => h.kind);
    expect(kinds).toContain('impact');
    expect(kinds).toContain('priority');
  });

  it('marca respuesta, resolución y cierre según el estado', async () => {
    const t = await service.create(incident, user);
    advance(5);
    const inProgress = await service.update(t.id, { status: 'En progreso' }, desk);
    expect(inProgress.respondedAt).toBe(clock.toISOString());
    advance(30);
    const resolved = await service.update(t.id, { status: 'Resuelto' }, desk);
    expect(resolved.resolvedAt).toBe(clock.toISOString());
    const closed = await service.update(t.id, { status: 'Cerrado' }, desk);
    expect(closed.closedAt).toBeDefined();
  });

  it('rechaza transiciones inválidas', async () => {
    const t = await service.create(incident, user);
    await expect(service.update(t.id, { status: 'Cerrado' }, desk)).rejects.toThrow();
  });

  it('un usuario no puede editar', async () => {
    const t = await service.create(incident, user);
    expect(() => service.update(t.id, { status: 'En progreso' }, user)).toThrow();
  });

  it('cambiar el responsable ajusta el nivel', async () => {
    const t = await service.create(incident, user);
    const updated = await service.update(t.id, { assignee: 'proveedor-github' }, desk);
    expect(updated.level).toBe('Nivel 3');
  });
});

describe('comentarios', () => {
  it('la primera respuesta pública de soporte cuenta como respuesta; la nota interna no', async () => {
    const t = await service.create(incident, user);
    const internal = await service.addComment(t.id, { text: 'nota', internal: true }, desk);
    expect(internal.respondedAt).toBeUndefined();
    const reply = await service.addComment(t.id, { text: 'hola', internal: false }, desk);
    expect(reply.respondedAt).toBeDefined();
  });

  it('un usuario no puede escribir notas internas', async () => {
    const t = await service.create(incident, user);
    expect(() => service.addComment(t.id, { text: 'x', internal: true }, user)).toThrow();
  });
});

describe('escalamiento, problemas y cambios', () => {
  it('escalar reasigna y queda en el historial', async () => {
    const t = await service.create(incident, user);
    const esc = await service.escalate(
      t.id,
      { route: 'funcional', to: 'resp-tecnico', reason: 'Nivel 1 superó 10 min' },
      desk,
    );
    expect(esc.assignee).toBe('resp-tecnico');
    expect(esc.level).toBe('Nivel 2');
    expect(esc.status).toBe('En progreso');
    expect(esc.history.some((h) => h.kind === 'escalation')).toBe(true);
  });

  it('crea un problema con incidentes asociados y luego un error conocido', async () => {
    const a = await service.create(incident, user);
    const b = await service.create(incident, user);
    const problem = await service.createProblem(
      a.id,
      { rootCause: 'GitHub Pages', linkedTicketIds: [b.id] },
      desk,
    );
    expect(problem.isProblem).toBe(true);
    expect(problem.linkedTicketIds).toEqual([b.id]);
    const linked = await service.get(b.id);
    expect(linked?.history.some((h) => h.kind === 'problem')).toBe(true);
    const ke = await service.markKnownError(
      a.id,
      { rootCause: 'GH', workaround: 'Usar caché' },
      desk,
    );
    expect(ke.knownError).toBe(true);
    expect(ke.workaround).toBe('Usar caché');
  });

  it('genera una solicitud de cambio vinculada', async () => {
    const a = await service.create(incident, user);
    const change = await service.createChangeRequest(
      a.id,
      {
        changeType: 'Cambio normal',
        category: 'mantenimiento-bd',
        title: 'Cambiar deploy',
        description: 'x',
      },
      desk,
    );
    expect(change.type).toBe('Solicitud');
    expect(change.parentTicketId).toBe(a.id);
    expect(change.tags).toContain('cambio normal');
    expect(change.assignee).toBe('dueno');
  });
});

describe('seed de demostración', () => {
  const now = new Date('2026-11-02T11:00:00-06:00');
  const seed = buildSeed(now);

  it('tiene entre 25 y 30 tickets con IDs únicos', () => {
    expect(seed.length).toBeGreaterThanOrEqual(25);
    expect(seed.length).toBeLessThanOrEqual(30);
    expect(new Set(seed.map((t) => t.id)).size).toBe(seed.length);
  });

  it('cubre las 7 categorías, las 5 prioridades, los 4 estados y los 4 canales', () => {
    expect(new Set(seed.map((t) => t.category))).toEqual(new Set(SERVICES.map((s) => s.id)));
    expect(new Set(seed.map((t) => t.priority))).toEqual(new Set(PRIORITIES));
    expect(new Set(seed.map((t) => t.status))).toEqual(new Set(STATUSES));
    expect(new Set(seed.map((t) => t.channel))).toEqual(new Set(CHANNELS.map((c) => c.id)));
  });

  it('incluye varios críticos, SLA vencidos y problemas / errores conocidos', () => {
    expect(seed.filter((t) => t.priority === 'Crítica').length).toBeGreaterThanOrEqual(3);
    expect(seed.filter((t) => isSlaBreached(t, now)).length).toBeGreaterThanOrEqual(2);
    expect(seed.filter((t) => t.isProblem || t.knownError).length).toBeGreaterThanOrEqual(2);
  });

  it('las fechas están en las últimas 3 semanas y nunca en el futuro', () => {
    const threeWeeks = 22 * 24 * 60 * 60_000;
    for (const t of seed) {
      const created = new Date(t.createdAt).getTime();
      expect(created).toBeLessThanOrEqual(now.getTime());
      expect(now.getTime() - created).toBeLessThan(threeWeeks);
      for (const c of t.comments)
        expect(new Date(c.createdAt).getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });

  it('los solicitantes usan correos @example.com', () => {
    expect(seed.every((t) => t.requester.email.endsWith('@example.com'))).toBe(true);
  });

  it('referencia estudios y juegos reales del catálogo', () => {
    expect(seed.some((t) => t.relatedGameSlug === 'mawkey-the-last-macaw')).toBe(true);
  });

  it('se carga al primer arranque y se restablece', async () => {
    const svc = createTicketService({
      storage: createMemoryStorage(),
      now: () => now,
      seed: buildSeed,
    });
    const list = await svc.list();
    expect(list).toHaveLength(seed.length);
    await svc.create(incident, user);
    expect(await svc.list()).toHaveLength(seed.length + 1);
    await svc.resetDemoData();
    expect(await svc.list()).toHaveLength(seed.length);
  });
});
