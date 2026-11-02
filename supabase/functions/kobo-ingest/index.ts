import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from 'jsr:@supabase/server@^1';

type KoboRecord = Record<string, unknown>;
type TicketType = 'Incidente' | 'Solicitud';
type CategoryId =
  | 'actualizacion'
  | 'sitio-no-disponible'
  | 'busqueda-lenta'
  | 'ficha-corrupta';
type Impact = 'Alto' | 'Medio' | 'Bajo';
type Urgency = 'Alta' | 'Media' | 'Baja';
type Priority = 'Crítica' | 'Alta' | 'Media' | 'Baja' | 'Planificada';

interface CategoryConfig {
  category: CategoryId;
  type: TicketType;
  impact: Impact;
  urgency: Urgency;
}

const CATEGORIES: Record<string, CategoryConfig> = {
  actualizacion: {
    category: 'actualizacion',
    type: 'Solicitud',
    impact: 'Bajo',
    urgency: 'Baja',
  },
  sitio_no_disponible: {
    category: 'sitio-no-disponible',
    type: 'Incidente',
    impact: 'Alto',
    urgency: 'Alta',
  },
  busqueda_lenta: {
    category: 'busqueda-lenta',
    type: 'Incidente',
    impact: 'Medio',
    urgency: 'Media',
  },
  ficha_corrupta: {
    category: 'ficha-corrupta',
    type: 'Incidente',
    impact: 'Bajo',
    urgency: 'Baja',
  },
};

function calculatePriority(impact: Impact, urgency: Urgency): Priority {
  const matrix: Record<Impact, Record<Urgency, Priority>> = {
    Alto: { Alta: 'Crítica', Media: 'Alta', Baja: 'Media' },
    Medio: { Alta: 'Alta', Media: 'Media', Baja: 'Baja' },
    Bajo: { Alta: 'Media', Media: 'Baja', Baja: 'Planificada' },
  };
  return matrix[impact][urgency];
}

function textValue(record: KoboRecord, ...keys: string[]): string | undefined {
  const key = keys.find((candidate) => record[candidate] !== undefined);
  if (!key) return undefined;
  const value = record[key];
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return undefined;
}

function sameSecret(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return difference === 0;
}

function makeDetails(record: KoboRecord, category: CategoryId): Record<string, string> {
  const details: Record<string, string> = {};
  const add = (target: string, ...sources: string[]) => {
    const value = textValue(record, ...sources);
    if (value) details[target] = value;
  };

  if (category === 'actualizacion') {
    for (const key of ['estudio', 'juego', 'accion', 'campo', 'fuente']) {
      add(key, `reporte/datos_actualizacion/${key}`, `reporte/${key}`, key);
    }
  } else if (category === 'sitio-no-disponible') {
    add('url', 'reporte/datos_sitio_caido/url', 'reporte/url', 'url');
    add('desde', 'reporte/datos_sitio_caido/desde', 'reporte/desde', 'desde');
    add(
      'error',
      'reporte/datos_sitio_caido/error_visto',
      'reporte/error_visto',
      'error_visto',
    );
  } else if (category === 'busqueda-lenta') {
    for (const key of ['funcion', 'dispositivo', 'navegador']) {
      add(key, `reporte/datos_busqueda/${key}`, `reporte/${key}`, key);
    }
  } else {
    add('estudio', 'reporte/datos_ficha/estudio_ficha', 'reporte/estudio_ficha', 'estudio_ficha');
    add('juego', 'reporte/datos_ficha/juego_ficha', 'reporte/juego_ficha', 'juego_ficha');
    add('campo', 'reporte/datos_ficha/campo_afectado', 'reporte/campo_afectado', 'campo_afectado');
  }

  add('pagina_afectada', 'reporte/pagina_afectada', 'pagina_afectada');
  add('evidencia', 'reporte/evidencia', 'evidencia');
  return details;
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'POST') return jsonError('Method not allowed', 405);

    const username = Deno.env.get('KOBO_WEBHOOK_USER');
    const password = Deno.env.get('KOBO_WEBHOOK_PASSWORD');
    if (!username || !password) return jsonError('Webhook credentials are not configured', 500);

    const expectedAuthorization = `Basic ${btoa(`${username}:${password}`)}`;
    if (!sameSecret(req.headers.get('authorization') ?? '', expectedAuthorization)) {
      return jsonError('Unauthorized', 401);
    }

    let body: KoboRecord;
    try {
      const parsed: unknown = await req.json();
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return jsonError('Expected a JSON object', 400);
      }
      body = parsed as KoboRecord;
    } catch {
      return jsonError('Invalid JSON', 400);
    }

    const wrapped = body.submission;
    const record =
      wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)
        ? (wrapped as KoboRecord)
        : body;
    const submissionId =
      record._uuid ?? record._id ?? record['meta/instanceID'] ?? record.submission_id;
    if (!submissionId) return jsonError('Kobo submission ID is missing', 400);

    const categoryKey = textValue(record, 'reporte/categoria', 'categoria');
    const config = categoryKey ? CATEGORIES[categoryKey] : undefined;
    if (!config) return jsonError('Unknown or missing support category', 400);

    const title = textValue(record, 'reporte/titulo', 'titulo');
    const description = textValue(record, 'reporte/descripcion', 'descripcion');
    const requesterName = textValue(record, 'reporte/nombre', 'nombre');
    const requesterEmail = textValue(record, 'reporte/correo', 'correo');
    if (!title || !description || !requesterName || !requesterEmail) {
      return jsonError('Required ticket fields are missing', 400);
    }

    const now = new Date().toISOString();
    const submittedAt = textValue(record, '_submission_time');
    const createdAt = submittedAt && !Number.isNaN(Date.parse(submittedAt)) ? submittedAt : now;
    const submissionIdText = String(submissionId);
    const ticketId = `CAG-KB-${submissionIdText}`;
    const priority = calculatePriority(config.impact, config.urgency);
    const actor = { role: 'service-desk', name: 'KoboToolbox' };
    const ticket = {
      id: ticketId,
      type: config.type,
      category: config.category,
      title,
      description,
      tags: ['kobo'],
      impact: config.impact,
      urgency: config.urgency,
      priority,
      status: 'Abierto',
      channel: 'Formulario Kobo',
      requester: { name: requesterName, email: requesterEmail },
      assignee: 'service-desk',
      level: 'Nivel 1',
      isProblem: false,
      knownError: false,
      linkedTicketIds: [],
      details: makeDetails(record, config.category),
      comments: [],
      history: [
        {
          id: crypto.randomUUID(),
          at: createdAt,
          kind: 'created',
          actor,
          to: 'Abierto',
          note: `Registrado por Formulario Kobo. Prioridad ${priority}.`,
        },
      ],
      createdAt,
      updatedAt: createdAt,
    };

    const rawResult = await ctx.supabaseAdmin.from('kobo_submissions').upsert(
      {
        submission_id: submissionIdText,
        received_at: now,
        payload: record,
        processing_status: 'processed',
      },
      { onConflict: 'submission_id', ignoreDuplicates: true },
    );
    if (rawResult.error) {
      console.error('Could not save Kobo submission', rawResult.error);
      return jsonError('Could not save Kobo submission', 500);
    }

    const ticketResult = await ctx.supabaseAdmin.from('service_desk_tickets').upsert(
      {
        id: ticketId,
        source_submission_id: submissionIdText,
        ticket,
        updated_at: createdAt,
      },
      { onConflict: 'source_submission_id', ignoreDuplicates: true },
    );
    if (ticketResult.error) {
      console.error('Could not create Service Desk ticket', ticketResult.error);
      return jsonError('Could not create Service Desk ticket', 500);
    }

    return Response.json({ ok: true, ticket_id: ticketId }, { status: 200 });
  }),
};
