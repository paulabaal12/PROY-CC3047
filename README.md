# Service Desk · centralamerica.games

**Fase 2 · CC3047 Administración y Mantenimiento de Sistemas (UVG).** Service Desk del **Catálogo Centroamericano de Videojuegos** ([centralamerica.games](https://centralamerica.games)), construido sobre lo definido en la Fase 1: el catálogo de servicios, la matriz de prioridad, los SLA y OLA, los niveles de soporte, el escalamiento y los flujos de incidentes, solicitudes, problemas y cambios.

> El servicio de TI es real: un sitio estático (Astro + React + YAML) publicado en GitHub Pages, que recibe datos de los estudios por formularios de KoboToolbox y se monitorea con UptimeRobot. **Los tickets de demostración son ficticios.** Los estudios y juegos citados son entradas reales del catálogo; los solicitantes son inventados (`@example.com`).

## Cómo correrlo

Requiere Node 20 o más nuevo.

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest: matriz de prioridad, horas hábiles, SLA y ticketService
npm run lint      # ESLint (TypeScript estricto, sin any)
npm run build     # typecheck + build de producción en dist/
npm run preview   # sirve dist/ en http://localhost:4173
```

Al primer arranque se cargan **28 tickets** de las últimas 3 semanas. Se pueden restablecer en **Configuración → Restablecer datos de demostración**. El rol activo se elige en el selector de la barra lateral (login simulado) y se guarda en `localStorage`.

**Publicar en GitHub Pages:** el workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) corre lint, tests y build en cada push, y publica `dist/` en cada push a `main`. En el repo hay que activar *Settings → Pages → Source: GitHub Actions*. La app usa `HashRouter` y `base: './'`, así que funciona bajo cualquier nombre de repo (por ejemplo `/centralamerica-games-service-desk/`) sin configuración extra. Si se necesita una base absoluta, se define `VITE_BASE`.

## Trazabilidad Fase 1 → Fase 2

| Elemento de la Fase 1 | Dónde está en la Fase 2 |
|---|---|
| **Catálogo de servicios**: 4 solicitudes y 3 incidentes tipificados, con su justificación, quién los solicita o reporta y quién los atiende | [`src/config/services.ts`](src/config/services.ts) · página **Catálogo de servicios** · pasos 1 y 2 del formulario |
| **Campos obligatorios de ficha** (nombre, estudio, país, fundación, juego destacado, plataformas, género, enlace, imagen) y campos de cada categoría | `fields` de cada servicio en [`services.ts`](src/config/services.ts) · [`DynamicField`](src/features/tickets/components/DynamicField.tsx) · validación en [`useTicketForm`](src/features/tickets/hooks/useTicketForm.ts) |
| **Criterios de impacto y urgencia** | [`src/config/priorityMatrix.ts`](src/config/priorityMatrix.ts) · paso "Impacto y urgencia" · Catálogo |
| **Matriz de prioridad** (impacto × urgencia → 5 prioridades con respuesta y resolución por celda) | [`priorityMatrix.ts`](src/config/priorityMatrix.ts) · [`utils/priority.ts`](src/utils/priority.ts) (9 casos testeados) · vista previa en el formulario · recálculo al editar |
| **Ventana de servicio** L–V 8:00–17:00 (UTC-6); el reloj no corre fuera de ventana | [`config/sla.ts`](src/config/sla.ts) · [`utils/businessHours.ts`](src/utils/businessHours.ts) (con feriados de Guatemala, testeado) · ícono de pausa en los contadores |
| **SLA de respuesta y resolución** con semáforo (verde, amarillo < 25%, rojo) | [`utils/sla.ts`](src/utils/sla.ts) · [`SlaTimer`](src/components/SlaTimer.tsx) en tarjetas, listas y detalle |
| **3 objetivos del SLA** (disponibilidad ≥ 99%; P1 90% ≤ 90 min; actualizaciones 90% ≤ 3 días hábiles) | [`utils/slaCompliance.ts`](src/utils/slaCompliance.ts) · **Dashboard** → "Objetivos del SLA" · disponibilidad editable en Configuración |
| **OLA internas** (P1 95% ≤ 75 min; actualizaciones 95% ≤ 2 días) y **cadena del P1** (10 + 45 + 20 + 15 = 90 min) | Medidor "Interno (OLA)" en el Dashboard · [`P1ChainCard`](src/features/tickets/components/P1ChainCard.tsx) en el detalle de tickets Críticos |
| **Incumplimiento aislado vs recurrente** (2 meses seguidos o 3 en 6 → problema) | Campo "Causa del incumplimiento" en el detalle · `isRecurrentBreach` (testeado) · franja mensual en el Dashboard |
| **Roles y niveles**: Usuario, Service Desk (N1), Responsable técnico (N2), Responsable de contenido (N2), Dueño del servicio, proveedores N3 (GitHub Pages, KoboToolbox, UptimeRobot) | [`config/roles.ts`](src/config/roles.ts) · selector de rol · [`RequireInternal`](src/features/auth/components/RequireInternal.tsx) protege tablero, problemas y dashboard |
| **Escalamiento funcional y jerárquico** con sus disparadores | [`config/escalation.ts`](src/config/escalation.ts) · [`EscalateDialog`](src/features/tickets/components/EscalateDialog.tsx) · alertas automáticas de [`escalationHints.ts`](src/utils/escalationHints.ts) |
| **Canales** (Formulario Kobo, Portal/Correo, Monitoreo UptimeRobot, Mensajería) | `CHANNELS` en `roles.ts` · paso "Solicitante" (Service Desk registra casos de otros canales) |
| **Flujo de incidentes y solicitudes** (Abierto → En progreso → Resuelto → Cerrado) | [`utils/workflow.ts`](src/utils/workflow.ts) · **Tablero** con dos colas y drag and drop |
| **Gestión de problemas y errores conocidos** | Botones "Crear problema" y "Marcar como error conocido" · página **Problemas** |
| **Habilitación de cambios** (cambio estándar o normal) | "Generar solicitud de cambio" → Solicitud vinculada con tag de tipo de cambio; un cambio normal se asigna al Dueño para su aprobación |
| **Notion** (registro de casos en la operación real) | Reemplazado por esta app; todo el acceso a datos pasa por [`services/ticketService.ts`](src/services/ticketService.ts) |

Detalle por práctica de ITIL en [`docs/itsm-mapping.md`](docs/itsm-mapping.md).

## Estructura

```
src/
├── app/            # router (HashRouter), providers, tema MUI, layout (sidebar, header, pie)
├── assets/logos/   # UVG y AECID
├── components/     # Panel, PriorityChip, StatusChip, SlaTimer, PageHeader, EmptyState, skeletons…
├── config/         # datos de la Fase 1: services, priorityMatrix, sla, roles, escalation, textos
├── features/
│   ├── auth/       # rol simulado (contexto + selector + guard)
│   ├── tickets/    # formulario por pasos, lista, detalle, comentarios, historial, edición, diálogos
│   ├── board/      # Kanban con @dnd-kit, filtros, banner P1
│   ├── dashboard/  # KPIs, objetivos del SLA, gráficas (Recharts)
│   ├── catalog/    # Catálogo de servicios y matriz
│   ├── problems/   # Problemas y errores conocidos
│   └── settings/   # Configuración
├── hooks/          # useTickets, useNow, useSettings, useToast
├── services/       # ticketService (async), storage, seed, settings
├── styles/         # tokens SCSS (colores, alturas, espaciado), mixins, globales y variables del modo noche
├── types/          # modelo de ticket y del catálogo
└── utils/          # prioridad, horas hábiles, SLA, cumplimiento, escalamiento, fechas
reference/catalog-reference.json   # estudios, juegos, países y plataformas reales
docs/                              # mapeo ITSM y notas de diseño
```

## Decisiones de diseño

- **Fidelidad a la Fase 1 en configuración, no en componentes.** El catálogo, la matriz, los SLA, los roles y las reglas de escalamiento viven en `src/config/` como datos tipados. Los formularios, el tablero y el dashboard se generan a partir de ellos.
- **Prioridad siempre calculada.** Nunca se escribe a mano: `calculatePriority(impact, urgency)`. Si soporte cambia impacto o urgencia, se recalcula y queda en el historial.
- **Tiempos hábiles reales.** Los SLA cuentan solo minutos dentro de la ventana L–V 8:00–17:00 en hora de Guatemala (UTC-6 fijo, sin horario de verano), sin contar feriados. Un día hábil equivale a 9 horas. Un caso que entra el sábado empieza a contar el lunes a las 8:00.
- **Respuesta del SLA** = primer contacto de soporte con el usuario: un comentario público, el paso a "En progreso" o un escalamiento. Una nota interna no cuenta.
- **Reglas del flujo.** Solo se cierra un ticket resuelto, y un ticket cerrado no se reabre (se crea uno nuevo y se vincula). El tablero rechaza los movimientos inválidos con un mensaje.
- **Problemas.** El registro de problema es un ticket con `isProblem` que agrupa incidentes (`linkedTicketIds`). Se gestiona por causa raíz y no por el SLA de incidentes, así que su reloj no se mide.
- **Servicio de datos intercambiable.** `ticketService` expone una interfaz async (`list`, `get`, `create`, `update`, `addComment`, `escalate`, `createProblem`, `markKnownError`, `createChangeRequest`, `resetDemoData`, `subscribe`) sobre `localStorage`, con una latencia simulada para que se vean los estados de carga. Para pasar a un backend basta reemplazar la instancia en `services/index.ts`.
- **Soft UI minimalista en azules.** Tarjetas blancas con bordes de 1 px sobre fondo `#F4F8FD`, solo dos fuentes (Poppins para títulos e Inter para el cuerpo) y tokens de altura (36/40/48 px) para que botones, inputs y filtros de una misma fila midan igual. Hay modo noche, diseño responsive y la paleta de las gráficas está validada para daltonismo (ver [`docs/design-notes.md`](docs/design-notes.md)).
- **Textos en español centralizados** en [`src/config/texts.ts`](src/config/texts.ts) para poder traducirlos.

## Guion de demo (5 minutos)

1. **Catálogo de servicios (45 s).** Mostrar las 4 solicitudes y los 3 incidentes, la justificación de cada uno ("¿Por qué es un incidente?") y la matriz de prioridad con los tiempos por celda.
2. **Ingreso como Usuario (1 min).** Cambiar el rol a *Usuario*. En "Ficha con datos corruptos o imágenes que no cargan" → *Crear ticket de este servicio*. Elegir un estudio real del catálogo (p. ej. Selva Interactive), mostrar que el formulario no avanza con campos vacíos, cambiar el impacto y ver cómo la vista previa recalcula la prioridad y el SLA. Enviar y mostrar el número `CAG-00xx` en la confirmación. Intentar abrir el Tablero: acceso restringido.
3. **Tablero como Service Desk (1 min).** Cambiar a *Service Desk*. Señalar el banner del P1 abierto, las dos colas, el orden por prioridad y los contadores de SLA (verde, amarillo, rojo; pausa fuera de horario). Arrastrar el ticket nuevo a *En progreso*. Intentar llevar uno de *Resuelto* a *Abierto*: el sistema lo impide. Filtrar por prioridad *Crítica*.
4. **Detalle y escalamiento (1 min).** Abrir "Certificado HTTPS inválido": cadena del P1 (90 min), historial con escalamientos funcional (técnico → GitHub Pages) y jerárquico (Dueño), notas internas y la causa registrada del incumplimiento. Volver al ticket nuevo: *Escalar → Funcional → Responsable técnico*, cambiar la urgencia (la prioridad se recalcula y queda en el historial) y agregar una nota interna.
5. **Problemas y cambios (45 s).** Página *Problemas*: "Rendimiento de búsqueda y filtros" como error conocido con su workaround, y "Portadas de Steam tras update-steam" con sus incidentes y el **cambio normal** pendiente de aprobación del Dueño.
6. **Dashboard (30 s).** KPIs, objetivos del SLA con meta externa e interna (el objetivo P1 de octubre aparece *incumplido*), la regla de recurrencia y las gráficas por categoría, prioridad, estado, tipo y tag, con la vista de tabla.

## Calidad

- TypeScript `strict` (más `noUncheckedIndexedAccess`), sin `any`. ESLint y Prettier.
- 70 tests con Vitest: los 9 casos de la matriz y sus tiempos, horas hábiles (ventana, fines de semana, feriados, zona horaria), semáforo del SLA, cumplimiento del P1, regla de recurrencia, transiciones, sugerencias de escalamiento, `ticketService` (alta, edición con historial, comentarios internos, escalamiento, problema, error conocido, cambio) y la cobertura del seed.
