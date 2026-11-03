import type {
  Actor,
  ChangeRequestInput,
  EscalationInput,
  KnownErrorInput,
  NewTicketInput,
  ProblemInput,
  Ticket,
  TicketPatch,
} from '@/types';
import { createMemoryStorage, STORAGE_KEYS } from './storage';
import {
  createTicketService,
  type NewCommentInput,
  type TicketQuery,
  type TicketService,
} from './ticketService';
import { supabaseAuth, supabaseConfig } from './supabaseAuth';
import { toUtcIso } from '@/utils/dates';
import { calculatePriority } from '@/utils/priority';

interface TicketRow {
  id: string;
  ticket: Ticket;
  source_submission_id: string | null;
}

const storage = createMemoryStorage();
const localService = createTicketService({ storage });
const listeners = new Set<() => void>();
let poll: ReturnType<typeof setInterval> | undefined;
let lastSnapshot = '';

async function request(path: string, init: RequestInit = {}) {
  const { url, key } = supabaseConfig();
  const token = await supabaseAuth.accessToken();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase respondió ${response.status}: ${body || response.statusText}`);
  }
  return response;
}

/** Older kobo-ingest rows store UTC dates without a zone; read them as UTC. */
function normalizeDates(ticket: Ticket): Ticket {
  const opt = (value?: string) => (value ? toUtcIso(value) : value);
  return {
    ...ticket,
    createdAt: toUtcIso(ticket.createdAt),
    updatedAt: toUtcIso(ticket.updatedAt),
    respondedAt: opt(ticket.respondedAt),
    resolvedAt: opt(ticket.resolvedAt),
    closedAt: opt(ticket.closedAt),
    comments: ticket.comments.map((c) => ({ ...c, createdAt: toUtcIso(c.createdAt) })),
    history: ticket.history.map((h) => ({ ...h, at: toUtcIso(h.at) })),
  };
}

async function fetchTickets(): Promise<Ticket[]> {
  const response = await request('service_desk_tickets?select=id,ticket&order=created_at.desc');
  const rows = (await response.json()) as TicketRow[];
  return rows
    .map((row) => row.ticket)
    .filter((ticket): ticket is Ticket => Boolean(ticket?.id))
    .map((ticket) => ({
      ...normalizeDates(ticket),
      // Always derive this label from the matrix; persisted labels may be stale or malformed.
      priority: calculatePriority(ticket.impact, ticket.urgency),
    }));
}

function setSnapshot(tickets: Ticket[]) {
  storage.setItem(STORAGE_KEYS.tickets, JSON.stringify(tickets));
  lastSnapshot = JSON.stringify(tickets);
}

async function persistChanges(before: Ticket[], after: Ticket[]) {
  const previous = new Map(before.map((ticket) => [ticket.id, ticket]));
  for (const ticket of after) {
    const prior = previous.get(ticket.id);
    if (prior && JSON.stringify(prior) === JSON.stringify(ticket)) continue;
    if (prior) {
      await request(`service_desk_tickets?id=eq.${encodeURIComponent(ticket.id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ ticket, updated_at: ticket.updatedAt }),
      });
    } else {
      await request('service_desk_tickets', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ id: ticket.id, source_submission_id: null, ticket }),
      });
    }
  }
  lastSnapshot = JSON.stringify(after);
  listeners.forEach((listener) => listener());
}

async function mutate<T>(operation: () => Promise<T>): Promise<T> {
  const before = await fetchTickets();
  setSnapshot(before);
  const result = await operation();
  const after = JSON.parse(storage.getItem(STORAGE_KEYS.tickets) ?? '[]') as Ticket[];
  await persistChanges(before, after);
  return result;
}

export const supabaseTicketService: TicketService = {
  async list(query?: TicketQuery) {
    setSnapshot(await fetchTickets());
    return localService.list(query);
  },
  async get(id: string) {
    setSnapshot(await fetchTickets());
    return localService.get(id);
  },
  create(input: NewTicketInput, actor: Actor) {
    return mutate(() => localService.create(input, actor));
  },
  update(id: string, patch: TicketPatch, actor: Actor, note?: string) {
    return mutate(() => localService.update(id, patch, actor, note));
  },
  addComment(id: string, comment: NewCommentInput, actor: Actor) {
    return mutate(() => localService.addComment(id, comment, actor));
  },
  escalate(id: string, input: EscalationInput, actor: Actor) {
    return mutate(() => localService.escalate(id, input, actor));
  },
  createProblem(id: string, input: ProblemInput, actor: Actor) {
    return mutate(() => localService.createProblem(id, input, actor));
  },
  markKnownError(id: string, input: KnownErrorInput, actor: Actor) {
    return mutate(() => localService.markKnownError(id, input, actor));
  },
  createChangeRequest(id: string, input: ChangeRequestInput, actor: Actor) {
    return mutate(() => localService.createChangeRequest(id, input, actor));
  },
  async resetDemoData() {
    throw new Error('No se pueden restablecer datos de demostración en Supabase.');
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!poll) {
      poll = setInterval(() => {
        void fetchTickets()
          .then((tickets) => {
            const snapshot = JSON.stringify(tickets);
            if (snapshot !== lastSnapshot) {
              setSnapshot(tickets);
              listeners.forEach((notify) => notify());
            }
          })
          .catch((error: unknown) => console.error('No se pudieron actualizar los tickets', error));
      }, 15_000);
    }
    return () => {
      listeners.delete(listener);
      if (!listeners.size && poll) {
        clearInterval(poll);
        poll = undefined;
      }
    };
  },
};
