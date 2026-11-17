import { createServer } from 'node:http';
import { createWriteStream, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(apiDirectory, '../..');
const catalogPath = resolve(projectRoot, 'reference/catalog-reference.json');
const port = Number(process.env.API_PORT ?? 3000);
const logPath = process.env.API_LOG_PATH ?? resolve(apiDirectory, '../logs/api.log');
const serviceName = 'centralamerica-games-api';
const simulated4xxRate = Number(process.env.API_SIMULATED_4XX_RATE ?? 0.10);
const simulated5xxRate = Number(process.env.API_SIMULATED_5XX_RATE ?? 0.05);
const latencyMinMs = Number(process.env.API_LATENCY_MIN_MS ?? 100);
const latencyMaxMs = Number(process.env.API_LATENCY_MAX_MS ?? 800);
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const games = [...catalog.games].sort((a, b) => a.name.localeCompare(b.name));
const studios = [...catalog.studios].sort((a, b) => a.name.localeCompare(b.name));
const serviceCatalog = {
  registro: 'Registro de un nuevo videojuego o estudio',
  actualizacion: 'Actualización de información del catálogo',
  'mantenimiento-bd': 'Mantenimiento de la base de datos',
  extraccion: 'Extracción de información del catálogo',
  'sitio-no-disponible': 'Reporte de sitio no disponible',
  'busqueda-lenta': 'Reporte de búsqueda lenta',
  'ficha-corrupta': 'Reporte de ficha corrupta',
};

if (
  !Number.isFinite(simulated4xxRate) ||
  !Number.isFinite(simulated5xxRate) ||
  simulated4xxRate < 0 ||
  simulated5xxRate < 0 ||
  simulated4xxRate + simulated5xxRate >= 1
) {
  throw new Error('Las tasas de error deben ser >= 0 y sumar menos de 1.');
}
if (
  !Number.isFinite(latencyMinMs) ||
  !Number.isFinite(latencyMaxMs) ||
  latencyMinMs < 0 ||
  latencyMaxMs < latencyMinMs
) {
  throw new Error('La latencia debe tener límites válidos: 0 <= mínimo <= máximo.');
}

mkdirSync(dirname(logPath), { recursive: true });
const logStream = createWriteStream(logPath, { flags: 'a' });

function writeLog(request, response, startedAt, statusCode, level) {
  const durationNs = Number(process.hrtime.bigint() - startedAt);
  const entry = {
    '@timestamp': new Date().toISOString(),
    'http': {
      'request': { 'method': request.method },
      'response': { 'status_code': statusCode },
    },
    'event': { 'duration': durationNs },
    'url': { 'path': new URL(request.url ?? '/', 'http://localhost').pathname },
    'service': { 'name': serviceName },
    'log': { 'level': level },
    'request': { 'id': request.headers['x-request-id'] ?? crypto.randomUUID() },
    'client': { 'address': request.socket.remoteAddress ?? 'unknown' },
    'user_agent': { 'original': request.headers['user-agent'] ?? '' },
  };
  logStream.write(`${JSON.stringify(entry)}\n`);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function getGame(id) {
  return games.find((game) => game.slug === id || game.id === id);
}

const wait = (durationMs) => new Promise((resolveWait) => setTimeout(resolveWait, durationMs));

async function route(request) {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (request.method !== 'GET') {
    return { status: 405, body: { error: 'Método no permitido' } };
  }

  if (url.pathname === '/api/health') {
    return { status: 200, body: { status: 'up', service: serviceName, timestamp: new Date().toISOString() } };
  }
  if (url.pathname === '/api/services') {
    return {
      status: 200,
      body: {
        count: Object.keys(serviceCatalog).length,
        data: Object.entries(serviceCatalog).map(([id, name]) => ({
          id,
          name,
          endpoint: `/api/services/${id}`,
          method: 'GET',
        })),
      },
    };
  }
  const simulatedServiceMatch = url.pathname.match(/^\/api\/services\/([^/]+)\/?$/);
  if (simulatedServiceMatch) {
    let serviceId;
    try {
      serviceId = decodeURIComponent(simulatedServiceMatch[1]);
    } catch {
      return { status: 400, body: { error: 'Identificador de servicio inválido' } };
    }
    const serviceTitle = Object.hasOwn(serviceCatalog, serviceId) ? serviceCatalog[serviceId] : undefined;
    if (!serviceTitle) return { status: 404, body: { error: 'Servicio no encontrado', id: serviceId } };

    request.simulatedServiceId = serviceId;
    const simulatedLatencyMs = latencyMinMs + Math.random() * (latencyMaxMs - latencyMinMs);
    await wait(simulatedLatencyMs);

    const outcome = Math.random();
    if (outcome < simulated4xxRate) {
      return {
        status: 400,
        body: {
          error: 'Solicitud simulada rechazada por validación',
          service: { id: serviceId, name: serviceTitle },
          simulated: true,
          simulatedLatencyMs: Math.round(simulatedLatencyMs),
        },
      };
    }
    if (outcome < simulated4xxRate + simulated5xxRate) {
      return {
        status: 503,
        body: {
          error: 'Falla temporal simulada del servicio',
          service: { id: serviceId, name: serviceTitle },
          simulated: true,
          simulatedLatencyMs: Math.round(simulatedLatencyMs),
        },
      };
    }
    return {
      status: 200,
      body: {
        status: 'success',
        service: { id: serviceId, name: serviceTitle },
        simulated: true,
        requestId: crypto.randomUUID(),
        processedAt: new Date().toISOString(),
        simulatedLatencyMs: Math.round(simulatedLatencyMs),
      },
    };
  }
  if (url.pathname === '/api/games') {
    return { status: 200, body: { count: games.length, data: games } };
  }
  if (url.pathname.startsWith('/api/games/')) {
    let id;
    try {
      id = decodeURIComponent(url.pathname.slice('/api/games/'.length));
    } catch {
      return { status: 400, body: { error: 'Identificador de videojuego inválido' } };
    }
    const game = getGame(id);
    return game
      ? { status: 200, body: game }
      : { status: 404, body: { error: 'Videojuego no encontrado', id } };
  }
  if (url.pathname === '/api/studios') {
    return { status: 200, body: { count: studios.length, data: studios } };
  }
  if (url.pathname === '/api/search') {
    const query = (url.searchParams.get('q') ?? '').trim();
    if (!query) return { status: 400, body: { error: 'El parámetro q es obligatorio' } };
    const needle = query.toLocaleLowerCase();
    const matchingGames = games.filter((game) => {
      const studioNames = game.studios
        .map((relation) => studios.find((studio) => studio.id === relation.id)?.name ?? '')
        .join(' ');
      return `${game.name} ${game.slug} ${game.status} ${game.platforms.join(' ')} ${studioNames}`
        .toLocaleLowerCase().includes(needle);
    });
    const matchingStudios = studios.filter((studio) =>
      `${studio.name} ${studio.city} ${studio.country}`.toLocaleLowerCase().includes(needle),
    );
    return { status: 200, body: { query, games: matchingGames, studios: matchingStudios } };
  }
  return { status: 404, body: { error: 'Ruta no encontrada' } };
}

const server = createServer(async (request, response) => {
  const startedAt = process.hrtime.bigint();
  let statusCode = 500;
  let level = 'error';
  response.once('finish', () => writeLog(request, response, startedAt, statusCode, level));
  try {
    const result = await route(request);
    statusCode = result.status;
    level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    sendJson(response, result.status, result.body);
  } catch (error) {
    statusCode = 500;
    level = 'error';
    sendJson(response, 500, { error: 'Error interno de la API' });
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  }
});

server.listen(port, '0.0.0.0', () => {
  process.stdout.write(`${serviceName} escuchando en http://0.0.0.0:${port}\n`);
});

function shutdown() {
  server.close(() => logStream.end(() => process.exit(0)));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
