const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';
const requests = [
  ...Array.from({ length: 20 }, (_, index) => `/api/games${index % 2 ? '' : '?page=1'}`),
  ...Array.from({ length: 12 }, () => '/api/studios'),
  ...Array.from({ length: 12 }, (_, index) => `/api/search?q=${index % 2 ? 'Guatemala' : 'game'}`),
  ...Array.from({ length: 8 }, () => '/api/health'),
  ...Array.from({ length: 4 }, (_, index) => `/api/games/missing-${index}`),
  ...Array.from({ length: 4 }, () => '/api/search'),
];

let failures = 0;
for (const path of requests) {
  const response = await fetch(new URL(path, baseUrl));
  if (response.status >= 500) failures += 1;
  await response.arrayBuffer();
}
process.stdout.write(`Solicitudes realizadas: ${requests.length}; errores 5xx: ${failures}\n`);
process.stdout.write(`Los registros se agregaron automáticamente a observability/logs/api.log en el servidor.\n`);
