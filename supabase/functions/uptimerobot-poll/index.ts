import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from 'jsr:@supabase/server@^1';

type MonitorStatus = 0 | 1 | 2 | 8 | 9;
interface UptimeMonitor {
  id: number | string;
  status: MonitorStatus;
  friendly_name?: string;
  url?: string;
}
interface UptimeResponse {
  stat?: string;
  monitors?: UptimeMonitor[];
  error?: { message?: string };
}
interface MonitorState {
  monitor_id: string;
  monitor_status: 'up' | 'down';
  ticket_id: string | null;
}
interface TicketRecord {
  id: string;
  type: 'Incidente';
  category: 'sitio-no-disponible';
  title: string;
  description: string;
  tags: string[];
  impact: 'Alto';
  urgency: 'Alta';
  priority: 'CrÃ­tica';
  status: 'Abierto' | 'En progreso' | 'Resuelto' | 'Cerrado';
  channel: 'Monitoreo UptimeRobot';
  requester: { name: string; email: string };
  assignee: 'service-desk';
  level: 'Nivel 1';
  isProblem: boolean;
  knownError: boolean;
  linkedTicketIds: string[];
  details: Record<string, string>;
  comments: unknown[];
  history: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  resolvedAt?: string;
};

function equalSecret(received: string, expected: string): boolean {
  const a = new TextEncoder().encode(received);
  const b = new TextEncoder().encode(expected);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) mismatch |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return mismatch === 0;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function priorityForDown(): TicketRecord['priority'] {
  return 'CrÃ­tica';
}

function normalizeUrl(value: string): string {
  const url = new URL(value);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  return `${url.origin}${path}`;
}

async function readMonitor(apiKey: string, monitorUrl: string): Promise<UptimeMonitor> {
  const body = new URLSearchParams({ api_key: apiKey, format: 'json' });
  const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error(`UptimeRobot API respondió ${response.status}`);
  const result = (await response.json()) as UptimeResponse;
  const monitor = result.monitors?.find(
    (item) => item.url && normalizeUrl(item.url) === normalizeUrl(monitorUrl),
  );
  if (result.stat !== 'ok' || !monitor)
    throw new Error(result.error?.message ?? `No se encontró el monitor para ${monitorUrl}.`);
  return monitor;
}

function createIncident(monitor: UptimeMonitor, now: string): TicketRecord {
  const monitorName = monitor.friendly_name || 'centralamerica.games';
  const monitorUrl = monitor.url || 'https://centralamerica.games/es/';
  const id = `CAG-UR-${monitor.id}-${Date.now()}`;
  const actor = { role: 'service-desk', name: 'UptimeRobot (monitoreo automático)' };
  return {
    id,
    type: 'Incidente',
    category: 'sitio-no-disponible',
    title: `Sitio no disponible: ${monitorName}`,
    description: `UptimeRobot confirmó que el monitor está caído. URL afectada: ${monitorUrl}. El Service Desk debe investigar la causa y restaurar el servicio.`,
    tags: ['uptimerobot', 'monitoreo-automatico'],
    impact: 'Alto',
    urgency: 'Alta',
    priority: priorityForDown(),
    status: 'Abierto',
    channel: 'Monitoreo UptimeRobot',
    requester: { name: 'UptimeRobot', email: 'monitoring@centralamerica.games' },
    assignee: 'service-desk',
    level: 'Nivel 1',
    isProblem: false,
    knownError: false,
    linkedTicketIds: [],
    details: {
      url: monitorUrl,
      desde: now,
      error: 'UptimeRobot reportó el estado Down.',
      monitor_id: String(monitor.id),
      monitor_name: monitorName,
    },
    comments: [],
    history: [
      {
        id: crypto.randomUUID(),
        at: now,
        kind: 'created',
        actor,
        to: 'Abierto',
        note: `Incidente creado automáticamente por UptimeRobot. Prioridad ${priorityForDown()}.`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const cronSecret = Deno.env.get('UPTIMEROBOT_CRON_SECRET');
    const apiKey = Deno.env.get('UPTIMEROBOT_READONLY_API_KEY');
    const monitorUrl = Deno.env.get('UPTIMEROBOT_MONITOR_URL');
    if (!cronSecret || !apiKey || !monitorUrl) {
      return json({ error: 'UptimeRobot polling secrets are not configured' }, 500);
    }
    if (!equalSecret(req.headers.get('x-cron-secret') ?? '', cronSecret)) {
      return json({ error: 'Unauthorized' }, 401);
    }

    let monitor: UptimeMonitor;
    try {
      monitor = await readMonitor(apiKey, monitorUrl);
    } catch (error) {
      console.error('Could not read UptimeRobot monitor', error);
      return json({ error: error instanceof Error ? error.message : 'UptimeRobot API error' }, 502);
    }

    const status = Number(monitor.status);
    if (status === 0) return json({ ok: true, status: 'paused', created: false });
    if (status === 1 || status === 8) return json({ ok: true, status: 'pending-check', created: false });
    if (status !== 2 && status !== 9) return json({ error: `Unknown monitor status: ${status}` }, 502);

    const monitorKey = String(monitor.id);
    const currentStatus = status === 9 ? 'down' : 'up';
    const stateResult = await ctx.supabaseAdmin
      .from('uptimerobot_monitor_state')
      .select('monitor_id,monitor_status,ticket_id')
      .eq('monitor_id', monitorKey)
      .maybeSingle();
    if (stateResult.error) {
      console.error('Could not read monitor state', stateResult.error);
      return json({ error: 'Could not read monitor state' }, 500);
    }
    const previous = stateResult.data as MonitorState | null;

    if (currentStatus === 'down') {
      if (previous?.monitor_status === 'down' && previous.ticket_id) {
        return json({ ok: true, status: 'down', created: false, ticket_id: previous.ticket_id });
      }

      const now = new Date().toISOString();
      const ticket = createIncident(monitor, now);
      const ticketResult = await ctx.supabaseAdmin.from('service_desk_tickets').insert({
        id: ticket.id,
        source_submission_id: `uptimerobot:${monitorKey}:${now}`,
        ticket,
        created_at: now,
        updated_at: now,
      });
      if (ticketResult.error) {
        console.error('Could not create UptimeRobot ticket', ticketResult.error);
        return json({ error: 'Could not create Service Desk ticket' }, 500);
      }

      const saveState = await ctx.supabaseAdmin.from('uptimerobot_monitor_state').upsert(
        { monitor_id: monitorKey, monitor_status: 'down', ticket_id: ticket.id, updated_at: now },
        { onConflict: 'monitor_id' },
      );
      if (saveState.error) {
        console.error('Could not save UptimeRobot monitor state', saveState.error);
        return json({ error: 'Ticket created but monitor state was not saved' }, 500);
      }
      return json({ ok: true, status: 'down', created: true, ticket_id: ticket.id });
    }

    if (previous?.monitor_status === 'down' && previous.ticket_id) {
      const ticketResult = await ctx.supabaseAdmin
        .from('service_desk_tickets')
        .select('ticket')
        .eq('id', previous.ticket_id)
        .maybeSingle();
      if (ticketResult.error) {
        console.error('Could not read incident ticket', ticketResult.error);
        return json({ error: 'Could not read incident ticket' }, 500);
      }

      const ticket = ticketResult.data?.ticket as TicketRecord | undefined;
      if (ticket && (ticket.status === 'Abierto' || ticket.status === 'En progreso')) {
        const now = new Date().toISOString();
        const actor = { role: 'service-desk', name: 'UptimeRobot (monitoreo automático)' };
        ticket.history.push({
          id: crypto.randomUUID(),
          at: now,
          kind: 'status',
          actor,
          from: ticket.status,
          to: 'Resuelto',
          note: 'UptimeRobot detectó que el monitor volvió a estar disponible.',
        });
        ticket.status = 'Resuelto';
        ticket.updatedAt = now;
        ticket.resolvedAt = now;
        ticket.respondedAt ??= now;
        const updateResult = await ctx.supabaseAdmin
          .from('service_desk_tickets')
          .update({ ticket, updated_at: now })
          .eq('id', previous.ticket_id);
        if (updateResult.error) {
          console.error('Could not resolve UptimeRobot ticket', updateResult.error);
          return json({ error: 'Could not resolve Service Desk ticket' }, 500);
        }
      }
    }

    const saveState = await ctx.supabaseAdmin.from('uptimerobot_monitor_state').upsert(
      { monitor_id: monitorKey, monitor_status: 'up', ticket_id: null, updated_at: new Date().toISOString() },
      { onConflict: 'monitor_id' },
    );
    if (saveState.error) {
      console.error('Could not save UptimeRobot monitor state', saveState.error);
      return json({ error: 'Could not save monitor state' }, 500);
    }
    return json({ ok: true, status: 'up', resolved_ticket_id: previous?.ticket_id ?? null });
  }),
};
