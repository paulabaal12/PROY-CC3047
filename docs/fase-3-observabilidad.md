# Fase 3 — API y observabilidad de CentralAmerica.Games

## Arquitectura implementada

El sitio React/Vite existente sigue funcionando como antes. Se agregó una API Node.js independiente que lee el catálogo real desde `reference/catalog-reference.json`; no escribe en ese archivo ni reemplaza el sitio.

```text
Cliente / navegador ──HTTP──> API Node (3000) ──> catálogo JSON existente
                                   │ JSON por petición
                                   ▼
                       observability/logs/api.log
                                   │ Filebeat
                                   ▼
                            Elasticsearch ──> Kibana (5601)
                                   ▲
                              Heartbeat
                         /api/health y /api/games
```

Docker Compose levanta la API y Elasticsearch, Kibana, Filebeat y Heartbeat en una red interna. Los puertos de la máquina anfitriona están limitados a `127.0.0.1`. Para este entorno local de curso, la seguridad de Elasticsearch está desactivada; no se debe reutilizar esa configuración para publicar el stack en Internet.

## API

La API usa el `slug` del catálogo como identificador de videojuego, porque el esquema de `reference/catalog-reference.json` no tiene un campo `id`.

| Método y ruta | Respuesta |
|---|---|
| `GET /api/health` | Estado `up`, nombre del servicio y timestamp UTC |
| `GET /api/games` | Videojuegos ordenados por nombre y cantidad |
| `GET /api/games/:slug` | Videojuego o `404` |
| `GET /api/studios` | Estudios ordenados por nombre y cantidad |
| `GET /api/search?q=texto` | Coincidencias en videojuegos (nombre, slug, estado, plataformas, estudio) y estudios |

`/api/search` responde `400` si falta `q`. Las rutas inexistentes y los slugs desconocidos responden `404`.

## Logs

Cada respuesta HTTP genera automáticamente una línea JSON en `observability/logs/api.log`. `event.duration` se mide con reloj monotónico y se expresa en nanosegundos. Los errores 4xx reciben `log.level: warn`, los 5xx `error` y las respuestas exitosas `info`.

Ejemplo de evento (la duración, timestamp y datos de petición se generan al atender la solicitud):

```json
{"@timestamp":"2026-11-14T18:30:00.000Z","http":{"request":{"method":"GET"},"response":{"status_code":200}},"event":{"duration":15200000},"url":{"path":"/api/games"},"service":{"name":"centralamerica-games-api"},"log":{"level":"info"},"request":{"id":"..."},"client":{"address":"127.0.0.1"},"user_agent":{"original":"..."}}
```

Para generar una muestra de 60 registros con tráfico real hacia la API, primero levanta el stack y después ejecuta:

```powershell
npm run api:sample-logs
```

El script hace solicitudes HTTP a los endpoints; no construye ni escribe eventos manualmente. Incluye solicitudes exitosas, búsquedas inválidas y slugs inexistentes. El resultado queda anexado en `observability/logs/api.log`.

## Arranque local

Requisitos: Docker Desktop con Compose, Node.js 20+ y al menos 4 GB de memoria asignada a Docker.

```powershell
docker compose up --build -d
docker compose ps
```

URLs:

- API: <http://localhost:3000/api/health>
- Elasticsearch: <http://localhost:9200>
- Kibana: <http://localhost:5601>

También se puede desarrollar la API sin Docker con `npm run api`. La interfaz web sigue arrancando con `npm run dev` como antes.

Para detener los contenedores conservando los datos de Elasticsearch: `docker compose down`. Para borrar también el índice local y sus volúmenes: `docker compose down -v`.

## Estado actual y pasos para completar la fase

### Punto actual

El último resultado compartido de `docker compose up --build -d` muestra que Compose construyó la imagen y creó la red/volúmenes. La API y Elasticsearch aparecen como `Healthy`; Kibana, Filebeat y Heartbeat aparecen como `Started`. Esto confirma que los contenedores arrancaron, pero todavía hay que confirmar la llegada de eventos a Elasticsearch, que Kibana termine de iniciar y que el dashboard esté creado y guardado.

### 1. Confirmar que la API y el stack siguen arriba

Desde PowerShell, en la carpeta raíz del proyecto:

```powershell
docker compose ps
Invoke-RestMethod http://localhost:3000/api/health | ConvertTo-Json
```

La API debe responder `status: up`. Si un contenedor aparece como `Exited` o `Restarting`, consulta sus registros con `docker compose logs --tail 100 <servicio>`; los nombres válidos son `api`, `elasticsearch`, `kibana`, `filebeat` y `heartbeat`.

### 2. Generar tráfico real e inspeccionar la ingesta

Ejecuta el generador desde otra ventana de PowerShell. Hace solicitudes HTTP contra la API ya levantada; cada evento se escribe automáticamente en el archivo compartido:

```powershell
npm.cmd run api:sample-logs
Start-Sleep -Seconds 15
Invoke-RestMethod "http://localhost:9200/_cat/indices/centralamerica-games-api-*?v"
Invoke-RestMethod "http://localhost:9200/centralamerica-games-api-*/_count"
```

El índice debe aparecer y el conteo debe aumentar. La muestra preparada contiene al menos 50 registros, con respuestas 200, 400 y 404. Si el índice no aparece, revisa que el archivo exista y tenga líneas con `Get-Content observability/logs/api.log -Tail 5`, y luego consulta:

```powershell
docker compose logs --tail 100 filebeat
```

Busca errores de lectura de configuración, permisos, conexión a Elasticsearch o JSON inválido. Después de corregirlos, vuelve a ejecutar el generador y espera unos segundos.

### 3. Crear y guardar el dashboard

Abre <http://localhost:5601>. Si Kibana todavía no carga, espera un minuto y revisa `docker compose logs --tail 100 kibana`.

1. Ve a **Stack Management → Data Views → Create data view**.
2. Usa el patrón `centralamerica-games-api-*`, selecciona `@timestamp` como campo de tiempo y guarda.
3. Ve a **Analytics → Dashboard**, crea **CentralAmerica.Games — Monitoreo API** y añade los siguientes paneles usando ese data view:

| Panel | Configuración en Lens |
|---|---|
| Tráfico de peticiones | Eje X `@timestamp` con date histogram; métrica Count. |
| Tiempo de respuesta promedio | Fórmula `average(event.duration) / 1000000`; etiqueta el resultado en ms. |
| Estado de sistema | En **Observability → Uptime**, muestra el estado `up/down` para `CentralAmerica.Games API health` y `CentralAmerica.Games catalog endpoint`. |
| Distribución HTTP | Barras con `http.response.status_code` en el eje X y Count en el eje Y. |
| Error rate | Fórmula `count(kql='http.response.status_code >= 400') / count() * 100`; etiqueta en porcentaje. Si Lens no acepta la fórmula, crea una métrica Count filtrada por status >= 400 y compárala con el total en un segundo panel. |
| Top endpoints | Tabla o barras con `url.path` por Count; orden descendente y límite de 10 rutas. |

Usa un rango temporal que incluya la hora de generación de los logs, pulsa **Save** y confirma que todos los paneles estén visibles en una sola vista. Los datos de Heartbeat se consultan en la aplicación Uptime, ya que provienen de su propio índice y no del índice de logs de la API.

### 4. Tomar evidencias y terminar el informe

1. Captura la vista completa del dashboard, con título, rango de tiempo, paneles y valores visibles. Guarda el archivo en `docs/evidencias/` con un nombre claro, por ejemplo `dashboard-kibana.png`.
2. Conserva `observability/logs/api.log` con al menos 50 líneas generadas por solicitudes reales. No edites ni inventes eventos manualmente.
3. En el informe técnico, incluye arquitectura, versiones, endpoints, formato ECS, flujo API → archivo → Filebeat → Elasticsearch → Kibana, configuración de Heartbeat, resultados observados y la captura.
4. Registra cualquier ajuste que haya sido necesario para que los servicios arrancaran en el equipo del grupo.

### Criterio de finalización

- `docker compose ps` muestra los cinco servicios activos; API y Elasticsearch están saludables.
- Los índices de logs de la API tienen documentos y se ven en Kibana Discover.
- Heartbeat muestra los dos monitores de la API como `up` mientras la API está disponible.
- El dashboard guardado contiene los seis indicadores solicitados y sus paneles muestran datos en el rango elegido.
- El archivo de logs, la configuración, la captura y el informe están listos para entregar.

## Filebeat y Heartbeat

- Filebeat lee el archivo compartido como `filestream`, decodifica cada línea NDJSON y publica en el índice diario `centralamerica-games-api-YYYY.MM.dd`.
- Heartbeat accede a la API por el nombre DNS `api` dentro de la red Docker; no usa `localhost` porque ese nombre dentro del contenedor apuntaría al propio Heartbeat.
- Las versiones de Elasticsearch, Kibana y Beats se fijan juntas mediante `ELASTIC_VERSION` (por defecto `9.5.6`). Para cambiarla, usar la misma versión en los cuatro servicios Elastic.

## Evidencias para la entrega

- `docker-compose.yml`: stack completo más API.
- `observability/filebeat/filebeat.yml` y `observability/heartbeat/heartbeat.yml`: configuración de recolección y monitoreo.
- `observability/logs/api.log`: salida real de la API tras generar solicitudes.
- Captura del dashboard en Kibana después de configurar los paneles y seleccionar un rango temporal con datos.
- Este documento: arquitectura, rutas, campos, arranque y procedimiento de dashboard.
