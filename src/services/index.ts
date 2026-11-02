import { buildSeed } from './seed';
import { createBrowserStorage } from './storage';
import { isAuthRequired } from './supabaseAuth';
import { supabaseTicketService } from './supabaseTicketService';
import { createTicketService } from './ticketService';

/** Supabase is the production source of truth; localStorage remains for offline demo mode. */
export const ticketService = isAuthRequired
  ? supabaseTicketService
  : createTicketService({ storage: createBrowserStorage(), seed: buildSeed, latencyMs: 180 });

export type { TicketService, TicketQuery, NewCommentInput } from './ticketService';
export { matchesSearch } from './ticketService';
export * from './settingsService';
