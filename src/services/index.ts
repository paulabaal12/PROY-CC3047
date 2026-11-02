import { buildSeed } from './seed';
import { createBrowserStorage } from './storage';
import { createTicketService } from './ticketService';

/** App-wide service: localStorage + demo seed on first run. Swap this line for an HTTP client. */
export const ticketService = createTicketService({
  storage: createBrowserStorage(),
  seed: buildSeed,
  latencyMs: 180,
});

export type { TicketService, TicketQuery, NewCommentInput } from './ticketService';
export { matchesSearch } from './ticketService';
export * from './settingsService';
