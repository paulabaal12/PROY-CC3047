import { assigneeName, isInternalRole, levelForAssignee, roleById } from '@/config/roles';
import type {
  Actor,
  ChangeRequestInput,
  EscalationInput,
  HistoryEntry,
  HistoryKind,
  KnownErrorInput,
  NewTicketInput,
  ProblemInput,
  Ticket,
  TicketComment,
  TicketPatch,
  TicketType,
} from '@/types';
import { formatTicketId, parseTicketNumber, uid } from '@/utils/ids';
import { calculatePriority } from '@/utils/priority';
import { transitionError } from '@/utils/workflow';
import { readJson, STORAGE_KEYS, writeJson, type KeyValueStorage } from './storage';

export interface TicketQuery {
  type?: TicketType;
  requesterEmail?: string;
  search?: string;
}

export interface NewCommentInput {
  text: string;
  internal: boolean;
}

/**
 * Single entry point for ticket data. Every method is async so this localStorage
 * implementation can be replaced by an HTTP backend without touching components.
 */
export interface TicketService {
  list(query?: TicketQuery): Promise<Ticket[]>;
  get(id: string): Promise<Ticket | undefined>;
  create(input: NewTicketInput, actor: Actor): Promise<Ticket>;
  update(id: string, patch: TicketPatch, actor: Actor, note?: string): Promise<Ticket>;
  addComment(id: string, comment: NewCommentInput, actor: Actor): Promise<Ticket>;
  escalate(id: string, input: EscalationInput, actor: Actor): Promise<Ticket>;
  createProblem(id: string, input: ProblemInput, actor: Actor): Promise<Ticket>;
  markKnownError(id: string, input: KnownErrorInput, actor: Actor): Promise<Ticket>;
  createChangeRequest(id: string, input: ChangeRequestInput, actor: Actor): Promise<Ticket>;
  resetDemoData(): Promise<Ticket[]>;
  subscribe(listener: () => void): () => void;
}

export interface TicketServiceOptions {
  storage: KeyValueStorage;
  now?: () => Date;
  seed?: (now: Date) => Ticket[];
  /** Simulated network latency (ms) so loading states are visible. */
  latencyMs?: number;
}

export class TicketNotFoundError extends Error {
  constructor(id: string) {
    super(`No existe el ticket ${id}`);
  }
}

const clone = <T>(value: T): T => structuredClone(value);

export function matchesSearch(ticket: Ticket, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [ticket.id, ticket.title, ticket.description, ticket.requester.name, ...ticket.tags]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export function createTicketService(options: TicketServiceOptions): TicketService {
  const { storage, now = () => new Date(), seed, latencyMs = 0 } = options;
  const listeners = new Set<() => void>();

  const delay = () =>
    latencyMs > 0 ? new Promise<void>((r) => setTimeout(r, latencyMs)) : Promise.resolve();

  const load = (): Ticket[] => {
    const stored = readJson<Ticket[] | null>(storage, STORAGE_KEYS.tickets, null);
    if (stored) return stored;
    const initial = seed ? seed(now()) : [];
    writeJson(storage, STORAGE_KEYS.tickets, initial);
    return initial;
  };

  const save = (tickets: Ticket[]) => {
    writeJson(storage, STORAGE_KEYS.tickets, tickets);
    listeners.forEach((l) => l());
  };

  const history = (
    kind: HistoryKind,
    actor: Actor,
    at: string,
    extra: Partial<HistoryEntry> = {},
  ): HistoryEntry => ({ id: uid(), at, kind, actor: { ...actor }, ...extra });

  /** Loads, mutates one ticket and persists. Returns a copy of the updated ticket. */
  const mutate = async (id: string, fn: (t: Ticket, at: string, all: Ticket[]) => void) => {
    await delay();
    const all = load();
    const ticket = all.find((t) => t.id === id);
    if (!ticket) throw new TicketNotFoundError(id);
    const at = now().toISOString();
    fn(ticket, at, all);
    ticket.updatedAt = at;
    save(all);
    return clone(ticket);
  };

  const nextId = (all: Ticket[]) =>
    formatTicketId(all.reduce((max, t) => Math.max(max, parseTicketNumber(t.id)), 0) + 1);

  const requireInternal = (actor: Actor) => {
    if (!isInternalRole(actor.role)) throw new Error('Solo el equipo de soporte puede hacer esto.');
  };

  const buildTicket = (input: NewTicketInput, actor: Actor, id: string, at: string): Ticket => {
    const studio = typeof input.details.estudio === 'string' ? input.details.estudio : undefined;
    const game = typeof input.details.juego === 'string' ? input.details.juego : undefined;
    return {
      id,
      type: input.type,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      tags: input.tags ?? [],
      impact: input.impact,
      urgency: input.urgency,
      priority: calculatePriority(input.impact, input.urgency),
      status: 'Abierto',
      channel: input.channel,
      requester: { ...input.requester },
      assignee: 'service-desk',
      level: 'Nivel 1',
      isProblem: false,
      knownError: false,
      linkedTicketIds: [],
      parentTicketId: input.parentTicketId,
      changeType: input.changeType,
      relatedStudioId: input.relatedStudioId ?? (studio && studio !== '__nuevo__' ? studio : undefined),
      relatedGameSlug: input.relatedGameSlug ?? (game || undefined),
      details: clone(input.details),
      comments: [],
      history: [
        history('created', actor, at, {
          to: 'Abierto',
          note: `Registrado por ${input.channel}. Prioridad ${calculatePriority(input.impact, input.urgency)}.`,
        }),
      ],
      createdAt: at,
      updatedAt: at,
    };
  };

  const service: TicketService = {
    async list(query = {}) {
      await delay();
      return load()
        .filter((t) => !query.type || t.type === query.type)
        .filter((t) => !query.requesterEmail || t.requester.email === query.requesterEmail)
        .filter((t) => !query.search || matchesSearch(t, query.search))
        .map(clone);
    },

    async get(id) {
      await delay();
      const ticket = load().find((t) => t.id === id);
      return ticket ? clone(ticket) : undefined;
    },

    async create(input, actor) {
      await delay();
      const all = load();
      const ticket = buildTicket(input, actor, nextId(all), now().toISOString());
      all.push(ticket);
      save(all);
      return clone(ticket);
    },

    update(id, patch, actor, note) {
      requireInternal(actor);
      return mutate(id, (t, at) => {
        if (patch.status && patch.status !== t.status) {
          const error = transitionError(t.status, patch.status);
          if (error) throw new Error(error);
          t.history.push(history('status', actor, at, { from: t.status, to: patch.status, note }));
          t.status = patch.status;
          if (patch.status !== 'Abierto' && !t.respondedAt) t.respondedAt = at;
          if (patch.status === 'Resuelto') t.resolvedAt = at;
          if (patch.status === 'En progreso' || patch.status === 'Abierto') t.resolvedAt = undefined;
          if (patch.status === 'Cerrado') t.closedAt = at;
        }
        const previousPriority = t.priority;
        if (patch.impact && patch.impact !== t.impact) {
          t.history.push(history('impact', actor, at, { from: t.impact, to: patch.impact }));
          t.impact = patch.impact;
        }
        if (patch.urgency && patch.urgency !== t.urgency) {
          t.history.push(history('urgency', actor, at, { from: t.urgency, to: patch.urgency }));
          t.urgency = patch.urgency;
        }
        t.priority = calculatePriority(t.impact, t.urgency);
        if (t.priority !== previousPriority) {
          t.history.push(
            history('priority', actor, at, {
              from: previousPriority,
              to: t.priority,
              note: 'Recalculada con la matriz impacto × urgencia.',
            }),
          );
        }
        if (patch.assignee && patch.assignee !== t.assignee) {
          t.history.push(
            history('assignee', actor, at, {
              from: assigneeName(t.assignee),
              to: assigneeName(patch.assignee),
            }),
          );
          t.assignee = patch.assignee;
          if (!patch.level) patch = { ...patch, level: levelForAssignee(t.assignee, t.level) };
        }
        if (patch.level && patch.level !== t.level) {
          t.history.push(history('level', actor, at, { from: t.level, to: patch.level }));
          t.level = patch.level;
        }
        if (patch.tags && patch.tags.join('|') !== t.tags.join('|')) {
          t.history.push(
            history('tags', actor, at, { from: t.tags.join(', '), to: patch.tags.join(', ') }),
          );
          t.tags = [...patch.tags];
        }
        if (patch.slaBreachCause !== undefined && patch.slaBreachCause !== t.slaBreachCause) {
          t.history.push(history('sla-cause', actor, at, { note: patch.slaBreachCause }));
          t.slaBreachCause = patch.slaBreachCause;
        }
      });
    },

    addComment(id, input, actor) {
      const text = input.text.trim();
      if (!text) return Promise.reject(new Error('El comentario está vacío.'));
      if (input.internal) requireInternal(actor);
      return mutate(id, (t, at) => {
        const comment: TicketComment = {
          id: uid(),
          author: actor.name,
          role: actor.role,
          text,
          createdAt: at,
          internal: input.internal,
        };
        t.comments.push(comment);
        // First public reply from support counts as the SLA response.
        if (isInternalRole(actor.role) && !input.internal && !t.respondedAt) t.respondedAt = at;
      });
    },

    escalate(id, input, actor) {
      requireInternal(actor);
      return mutate(id, (t, at) => {
        const from = t.assignee;
        t.assignee = input.to;
        const level = levelForAssignee(input.to, t.level);
        const route = input.route === 'funcional' ? 'Funcional' : 'Jerárquica';
        t.history.push(
          history('escalation', actor, at, {
            from: assigneeName(from),
            to: input.to,
            note: `${route}: ${input.reason}${input.note ? ` — ${input.note}` : ''}`,
          }),
        );
        if (level !== t.level) {
          t.history.push(history('level', actor, at, { from: t.level, to: level }));
          t.level = level;
        }
        if (t.status === 'Abierto') {
          t.history.push(history('status', actor, at, { from: 'Abierto', to: 'En progreso' }));
          t.status = 'En progreso';
          t.respondedAt ??= at;
        }
      });
    },

    createProblem(id, input, actor) {
      requireInternal(actor);
      return mutate(id, (t, at, all) => {
        t.isProblem = true;
        t.rootCause = input.rootCause.trim();
        t.linkedTicketIds = Array.from(new Set(input.linkedTicketIds.filter((x) => x !== t.id)));
        if (!t.tags.includes('problema')) t.tags.push('problema');
        t.history.push(
          history('problem', actor, at, {
            note: `Registro de problema creado. Incidentes asociados: ${t.linkedTicketIds.join(', ') || 'ninguno'}.`,
          }),
        );
        for (const linked of all.filter((x) => t.linkedTicketIds.includes(x.id))) {
          linked.history.push(history('problem', actor, at, { note: `Asociado al problema ${t.id}.` }));
          linked.updatedAt = at;
        }
      });
    },

    markKnownError(id, input, actor) {
      requireInternal(actor);
      if (!input.workaround.trim()) return Promise.reject(new Error('Documentá el workaround.'));
      return mutate(id, (t, at) => {
        t.knownError = true;
        t.isProblem = true;
        t.rootCause = input.rootCause.trim();
        t.workaround = input.workaround.trim();
        for (const tag of ['problema', 'error conocido']) if (!t.tags.includes(tag)) t.tags.push(tag);
        t.history.push(history('known-error', actor, at, { note: `Workaround: ${t.workaround}` }));
      });
    },

    async createChangeRequest(id, input, actor) {
      requireInternal(actor);
      await delay();
      const all = load();
      const parent = all.find((t) => t.id === id);
      if (!parent) throw new TicketNotFoundError(id);
      const at = now().toISOString();
      const isStandard = input.changeType === 'Cambio estándar';
      const change = buildTicket(
        {
          type: 'Solicitud',
          category: input.category,
          title: input.title,
          description: input.description,
          tags: [input.changeType.toLowerCase()],
          impact: isStandard ? 'Bajo' : parent.impact,
          urgency: 'Baja',
          channel: 'Portal/Correo',
          requester: roleById(actor.role).persona,
          relatedStudioId: parent.relatedStudioId,
          relatedGameSlug: parent.relatedGameSlug,
          details: {},
          parentTicketId: parent.id,
          changeType: input.changeType,
        },
        actor,
        nextId(all),
        at,
      );
      // Standard changes are pre-approved; normal changes need the service owner.
      change.assignee = isStandard ? 'resp-tecnico' : 'dueno';
      change.level = isStandard ? 'Nivel 2' : 'Nivel 1';
      change.history.push(
        history('change', actor, at, {
          note: `${input.changeType} generado desde ${parent.id}. ${isStandard ? 'Preautorizado.' : 'Requiere aprobación del Dueño del servicio.'}`,
        }),
      );
      parent.history.push(
        history('change', actor, at, { to: change.id, note: `${input.changeType}: ${change.id}` }),
      );
      parent.updatedAt = at;
      all.push(change);
      save(all);
      return clone(change);
    },

    async resetDemoData() {
      await delay();
      const data = seed ? seed(now()) : [];
      save(data);
      return clone(data);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };

  return service;
}
