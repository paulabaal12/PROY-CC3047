const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';
const intervalMs = Number(process.env.API_TRAFFIC_INTERVAL_MS ?? 250);
const serviceIds = [
  'registro',
  'actualizacion',
  'mantenimiento-bd',
  'extraccion',
  'sitio-no-disponible',
  'busqueda-lenta',
  'ficha-corrupta',
];
const args = process.argv.slice(2);
const countFlag = args.indexOf('--count');
const durationFlag = args.indexOf('--duration-seconds');
const requestLimit = countFlag >= 0 ? Number(args[countFlag + 1]) : Infinity;
const durationSeconds = durationFlag >= 0 ? Number(args[durationFlag + 1]) : Infinity;

if (!Number.isFinite(intervalMs) || intervalMs < 0) {
  throw new Error('API_TRAFFIC_INTERVAL_MS debe ser un número >= 0.');
}
if (!(Number.isInteger(requestLimit) && requestLimit > 0) && requestLimit !== Infinity) {
  throw new Error('--count debe ser un entero positivo.');
}
if (!(Number.isFinite(durationSeconds) && durationSeconds > 0) && durationSeconds !== Infinity) {
  throw new Error('--duration-seconds debe ser un número positivo.');
}

let stopRequested = false;
let requestCount = 0;
let transportErrors = 0;
const statuses = new Map();
const deadline = Number.isFinite(durationSeconds) ? Date.now() + durationSeconds * 1000 : Infinity;

process.once('SIGINT', () => {
  stopRequested = true;
  process.stdout.write('\nDeteniendo el generador después de la petición actual...\n');
});
process.once('SIGTERM', () => {
  stopRequested = true;
});

process.stdout.write(
  `Generador continuo para ${serviceIds.length} endpoints en ${baseUrl}. ` +
  `Intervalo entre solicitudes: ${intervalMs} ms. Presiona Ctrl+C para detenerlo.\n`,
);

while (!stopRequested && requestCount < requestLimit && Date.now() < deadline) {
  const serviceId = serviceIds[requestCount % serviceIds.length];
  const endpoint = `/api/services/${serviceId}`;
  try {
    const response = await fetch(new URL(endpoint, baseUrl), {
      headers: { 'user-agent': 'centralamerica-games-traffic-generator/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    await response.arrayBuffer();
    statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
  } catch (error) {
    transportErrors += 1;
    process.stderr.write(`No se pudo completar ${endpoint}: ${error.message}\n`);
  }
  requestCount += 1;

  if (!stopRequested && requestCount < requestLimit && Date.now() < deadline && intervalMs > 0) {
    await new Promise((resolveWait) => setTimeout(resolveWait, intervalMs));
  }
}

const statusSummary = [...statuses.entries()].map(([status, count]) => `${status}: ${count}`).join(', ');
process.stdout.write(
  `Resumen: ${requestCount} solicitudes intentadas${statusSummary ? `; respuestas HTTP (${statusSummary})` : ''}; ` +
  `${transportErrors} fallas de transporte.\n`,
);
