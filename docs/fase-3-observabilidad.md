# Fase 3 — API y observabilidad de CentralAmerica.Games

## Arquitectura implementada

El sitio React/Vite del Service Desk se mantiene independiente. Para esta fase se agregó una API de solo lectura en Node.js 22 que consulta los datos reales de `reference/catalog-reference.json`, sin alterar el catálogo ni sustituir el sitio público `centralamerica.games`. Esta API es una extensión construida para exponer consultas HTTP observables; los resultados de Heartbeat de esta fase miden la API local, no la disponibilidad del sitio público de GitHub Pages.

```text
Cliente / generador de tráfico ──HTTP──> API Node.js (:3000)
                                          │ consulta
                                          ▼
                                Catálogo JSON existente
                                          │
                      API registra cada respuesta HTTP
                                          ▼
                         observability/logs/api.log
                                          │ Filebeat (NDJSON)
                                          ▼
                                    Elasticsearch ─────> Kibana (:5601)
                                          ▲                 Dashboard
                                          │
                                     Heartbeat
                            /api/health y /api/games
```

Docker Compose define cinco servicios: `api`, `elasticsearch`, `kibana`, `filebeat` y `heartbeat`, conectados por la red `centralamerica-games-observability`. Los puertos publicados en el equipo anfitrión están limitados a `127.0.0.1`. La seguridad de Elasticsearch se desactiva únicamente para este entorno local académico; esta configuración **no debe exponerse a Internet**.

## API

La API utiliza el `slug` como identificador de videojuego, porque el catálogo no incluye un campo `id` para estos registros.

| Método y ruta | Resultado |
| --- | --- |
| `GET /api/health` | Estado `up`, servicio y fecha UTC; HTTP 200 |
| `GET /api/games` | Videojuegos ordenados alfabéticamente; HTTP 200 |
| `GET /api/games/:slug` | Ficha del videojuego; HTTP 200 o 404 si no existe |
| `GET /api/studios` | Estudios ordenados por nombre; HTTP 200 |
| `GET /api/search?q=texto` | Coincidencias entre juegos y estudios; HTTP 200 o 400 si falta `q` |

Una ruta inexistente recibe 404. Si ocurre una excepción no prevista, el servidor responde 500 y registra el error. Los códigos de respuesta proceden de la lógica de la API y no se establecen artificialmente dentro de los logs.

## Generación y recolección automática de logs

Por cada respuesta HTTP, `observability/api/server.mjs` agrega una línea JSON al archivo `observability/logs/api.log`. El generador `observability/api/generate-sample.mjs` realiza 60 solicitudes HTTP reales mediante `fetch`, incluyendo respuestas 200, 400 y 404; **no escribe entradas de log directamente**.

Los campos obligatorios se generan automáticamente y utilizan convenciones de Elastic Common Schema (ECS):

| Campo | Contenido |
| --- | --- |
| `@timestamp` | Fecha y hora UTC de la respuesta |
| `http.request.method` | Método HTTP solicitado |
| `http.response.status_code` | Código de respuesta |
| `event.duration` | Duración en nanosegundos, calculada con `process.hrtime.bigint()` |
| `url.path` | Ruta sin parámetros de consulta |
| `service.name` | `centralamerica-games-api` |
| `log.level` | `info` (2xx), `warn` (4xx), `error` (5xx) |

También se registran `request.id`, `client.address` y `user_agent.original`.

Filebeat lee el archivo mediante `filestream` y el parser `ndjson`; lo envía automáticamente a Elasticsearch en índices diarios `centralamerica-games-api-YYYY.MM.dd`. La configuración está en `observability/filebeat/filebeat.yml`. No se utiliza Logstash, porque Filebeat cumple el requisito de recolección.

La muestra conservada en la rama `observability` incluye **1,943 registros de peticiones del 15 de noviembre de 2026**, por encima del mínimo requerido de 50. La evidencia corresponde a una ejecución anterior; la presencia del archivo no demuestra por sí sola que los contenedores estén encendidos actualmente.

## Configuración de Heartbeat

La configuración de `observability/heartbeat/heartbeat.yml` incluye dos monitores HTTP sobre la API de Docker:

| Monitor | Endpoint | Intervalo | Resultado esperado |
| --- | --- | --- | --- |
| CentralAmerica.Games API health | `http://api:3000/api/health` | 10 segundos | 200 / `up` |
| CentralAmerica.Games catalog endpoint | `http://api:3000/api/games` | 30 segundos | 200 / `up` |

Heartbeat envía sus comprobaciones a los índices `heartbeat-*` de Elasticsearch. Los monitores comparten el mismo servidor, lo cual es suficiente para verificar la disponibilidad del entorno API requerido. La captura histórica del dashboard muestra ambos en `up`; una prueba adicional de caída y recuperación puede utilizarse como evidencia más completa.

## Dashboard de Kibana implementado

La rama incluye `observability/kibana/dashboard.ndjson`, una exportación de objetos guardados de Kibana con **dos data views, seis visualizaciones Lens y un dashboard** titulado **CentralAmerica.Games — Monitoreo API**. No es necesario volver a construirlo manualmente: se puede importar en cualquier entorno local compatible con la versión del stack.

| Panel | Fuente | Medición |
| --- | --- | --- |
| Tráfico de peticiones | `centralamerica-games-api-*` | Conteo de peticiones por `@timestamp` |
| Tiempo de respuesta promedio | `centralamerica-games-api-*` | `average(event.duration) / 1000000` en milisegundos |
| Estado de sistema (Heartbeat) | `heartbeat-*` | Último `monitor.status` y conteo de checks `up`/`down` por monitor |
| Distribución de códigos HTTP | `centralamerica-games-api-*` | Peticiones agrupadas por `http.response.status_code` |
| Error rate | `centralamerica-games-api-*` | `count(kql='http.response.status_code >= 400') / count() * 100` |
| Top endpoints | `centralamerica-games-api-*` | Top 10 rutas por `url.path` |

El dashboard está configurado para consultar las **últimas 24 horas** y actualizarse **cada 30 segundos**. Para analizar los logs históricos del 15 de noviembre de 2026 hay que elegir un rango temporal que incluya esa fecha, o generar tráfico nuevo.

## Resultados de la ejecución documentada

El informe de la Fase 3 y las capturas existentes en `docs/evidencia/` registran los siguientes resultados:

- Archivo de logs entregado: **1,943 solicitudes**, de las cuales 1,910 respondieron 200, 17 respondieron 404 y 16 respondieron 400. El porcentaje de respuestas 4xx sobre ese archivo completo fue aproximadamente **1.70 %**; no se registraron respuestas 5xx.
- Captura histórica del dashboard: **1.93 %** de error rate, **0.37 ms** de tiempo de respuesta promedio y **dos monitores Heartbeat en estado `up`**.
- Los porcentajes 1.70 % y 1.93 % corresponden a fuentes de cálculo distintas (archivo completo frente a vista del dashboard); pueden variar según el rango temporal y el momento de la captura. No deben presentarse como la misma medición.
- Las respuestas 400 y 404 son peticiones inválidas o rutas inexistentes, algunas generadas deliberadamente para probar el monitoreo. No representan por sí mismas errores internos 5xx.

Estas cifras son **resultados observados en una ejecución anterior**, no una afirmación de disponibilidad actual en tiempo real.

## Cómo reproducir y verificar la implementación

### 1. Levantar los servicios

Requisitos: Docker Desktop con Compose, Node.js 20 o posterior y al menos 4 GB de memoria asignada a Docker.

Desde la raíz del repositorio, en PowerShell:

```powershell
docker compose up --build -d
docker compose ps
Invoke-RestMethod http://localhost:3000/api/health | ConvertTo-Json
```

La API debe devolver `status: up`; Elasticsearch y la API cuentan con healthchecks. Los servicios de Kibana, Filebeat y Heartbeat deben permanecer ejecutándose. Si alguno falla, revisar `docker compose logs --tail 100 <servicio>` (sustituir `<servicio>` por `api`, `elasticsearch`, `kibana`, `filebeat` o `heartbeat`).

### 2. Producir y verificar logs nuevos

```powershell
npm.cmd run api:sample-logs
Start-Sleep -Seconds 15
Invoke-RestMethod 'http://localhost:9200/centralamerica-games-api-*/_count'
Get-Content observability/logs/api.log -Tail 5
```

El conteo debe aumentar después de generar tráfico y la muestra debe conservar las entradas con los siete campos obligatorios. También se pueden consultar los registros en Kibana Discover seleccionando `centralamerica-games-api-*`.

### 3. Importar el dashboard ya creado

Una vez que Kibana responda en <http://localhost:5601>, importar los objetos guardados si el entorno aún no los tiene:

```powershell
curl.exe -X POST 'http://localhost:5601/api/saved_objects/_import?overwrite=true' -H 'kbn-xsrf: true' --form 'file=@observability/kibana/dashboard.ndjson'
```

Abrir **Analytics → Dashboard → CentralAmerica.Games — Monitoreo API**. Comprobar los seis paneles y ajustar el filtro temporal: últimas 24 horas para datos recientes, o un rango personalizado que cubra el 15 de noviembre de 2026 para la muestra histórica.

### 4. Verificar Heartbeat

Revisar la tabla **Estado de sistema (Heartbeat)** y confirmar que aparecen ambos monitores y sus recuentos. Una comprobación opcional de falla controlada consiste en detener temporalmente `api`, esperar el siguiente chequeo, verificar un estado `down` y luego restaurar el servicio:

```powershell
docker compose stop api
# Comprobar en Kibana el registro de 'down' después del siguiente chequeo.
docker compose start api
# Comprobar posteriormente la recuperación a 'up'.
```

La demostración de caída y recuperación es opcional; solo debe documentarse como realizada si efectivamente se prueba y se conserva la evidencia.

### 5. Detener el entorno

```powershell
docker compose down
```

Este comando conserva los volúmenes. **`docker compose down -v` elimina también los volúmenes**, incluidos los datos almacenados de Elasticsearch, y solamente debe utilizarse si se desea reiniciar completamente el entorno.

## Evidencias disponibles para la entrega

Los siguientes artefactos ya están incluidos en la rama `observability`:

| Entregable | Ubicación |
| --- | --- |
| Configuración Docker Compose | `docker-compose.yml` |
| Configuración Filebeat | `observability/filebeat/filebeat.yml` |
| Configuración Heartbeat | `observability/heartbeat/heartbeat.yml` |
| Código que genera logs automáticamente | `observability/api/server.mjs` |
| Muestra de logs (1,943 registros) | `observability/logs/api.log` |
| Exportación del dashboard y data views | `observability/kibana/dashboard.ndjson` |
| Captura del dashboard completo | `docs/evidencia/dashboard-completo.png` |
| KPIs y estado Heartbeat | `docs/evidencia/dashboard-kpis-estado.png` |
| Tráfico de peticiones | `docs/evidencia/dashboard-trafico.png` |
| Códigos HTTP y endpoints | `docs/evidencia/dashboard-codigos-endpoints.png` |
| Explicación técnica y pasos de reproducción | `docs/fase-3-observabilidad.md` (este archivo) |

El informe académico en PDF se entrega por separado. **Antes de enviarlo, incorporar la captura del dashboard como Anexo A**, ya que el PDF revisado la menciona pero no la contiene, y agregar una interpretación breve de los resultados y conclusiones.

## Alcance y limitaciones

- El monitoreo cubre la **API Node.js incorporada en esta fase**, no todas las peticiones de la web estática original ni el Service Desk conectado a Supabase.
- La API utiliza una copia del catálogo en `reference/catalog-reference.json`; no debe interpretarse como una API productiva integrada a GitHub Pages.
- El stack se configura para un **entorno local de demostración**. Los valores de disponibilidad y rendimiento pueden diferir de los de un despliegue real.
- La evidencia confirma que se preparó y mostró un dashboard con datos, pero la ejecución actual debe comprobarse al iniciar nuevamente el stack.
