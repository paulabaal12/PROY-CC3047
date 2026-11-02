# Mapeo ITSM (ITIL v4) por pantalla

Qué práctica de ITIL v4 cubre cada pantalla del Service Desk de centralamerica.games y con qué elementos de la Fase 1.

| Pantalla | Práctica ITIL v4 | Qué implementa |
|---|---|---|
| **Nuevo ticket** (`#/tickets/new`) | Service Desk · Gestión de incidentes · Gestión de solicitudes de servicio | Punto único de contacto. Clasifica por **tipo** (incidente / solicitud) y **categoría del catálogo** (4 + 3), pide los campos específicos de cada servicio, sugiere impacto y urgencia con sus criterios y calcula la **prioridad con la matriz**. Muestra los tiempos de SLA antes de enviar y registra el **canal** (Kobo, portal/correo, UptimeRobot, mensajería). |
| **Mis tickets** (`#/tickets`) | Service Desk (seguimiento al usuario) | El usuario ve solo sus casos; el equipo ve lo asignado a su rol o toda la cola. Búsqueda global. |
| **Detalle del ticket** (`#/tickets/:id`) | Gestión de incidentes · Gestión de solicitudes · Gestión del nivel de servicio | Contadores de **SLA de respuesta y resolución** en horas hábiles; **cadena del P1** (OLA de 90 min); comentarios públicos y **notas internas**; **historial** completo de cambios de estado, prioridad, responsable, nivel y escalamientos. |
| Panel **Gestión (soporte)** del detalle | Gestión de incidentes (clasificación, escalamiento) · Gestión de problemas · Habilitación de cambios | Edición de estado, impacto y urgencia (prioridad recalculada), responsable, nivel y tags. **Escalamiento funcional** (Nivel 2 o proveedor de Nivel 3) y **jerárquico** (Dueño del servicio) con el motivo de la Fase 1. **Crear problema**, **marcar error conocido** con workaround y **generar solicitud de cambio** (estándar o normal). Registro de la **causa de incumplimiento del SLA**. |
| **Tablero** (`#/board`) | Service Desk · Gestión de incidentes · Gestión de solicitudes | Dos colas separadas (Incidentes / Solicitudes), flujo Abierto → En progreso → Resuelto → Cerrado con reglas de transición; orden por prioridad y antigüedad; **banner de P1**; alertas de **escalamiento sugerido** (Nivel 1 superó 10 o 30 min; P1 proyectado a más de 90 min). |
| **Problemas** (`#/problems`) | Gestión de problemas | Registros de problema con causa raíz, **incidentes asociados**, **errores conocidos** con workaround y cambios generados para la solución definitiva. |
| **Catálogo de servicios** (`#/catalog`) | Gestión del catálogo de servicios | Las 4 solicitudes y los 3 incidentes con su justificación (por qué son una cosa u otra), quién los solicita o reporta, quién los atiende, la prioridad sugerida, los datos que piden y un botón para crear el ticket. También la matriz de prioridad, los criterios, los canales, los roles y los niveles. |
| **Dashboard** (`#/dashboard`) | Gestión del nivel de servicio · Medición y reporte · Mejora continua | KPIs (abiertos, críticos abiertos, % dentro de SLA, tiempo promedio de resolución). Los **3 objetivos del SLA** con meta externa e interna (OLA): disponibilidad ≥ 99%, restauración de P1 (90% en ≤ 90 min; interno 95% en ≤ 75) y actualizaciones (90% en ≤ 3 días hábiles; interno 95% en 2). Historial mensual del objetivo P1 con la **regla de recurrencia** (2 meses seguidos o 3 en 6 pasan al flujo de problema). Gráficas por categoría, prioridad, estado, tipo y tag. |
| **Configuración** (`#/settings`) | Gestión del nivel de servicio (dato de monitoreo) | Disponibilidad mensual de referencia (la mide UptimeRobot), rol simulado, modo noche y restablecimiento de los datos de demostración. |

## Flujos

1. **Incidente**: registro (canal) → clasificación y priorización (Nivel 1) → diagnóstico; si no se resuelve en 10 min (Crítica) o 30 min (Alta), **escalamiento funcional** a Nivel 2 → proveedor (Nivel 3) si es la plataforma → resolución → cierre. Si un P1 se proyecta a más de 90 min, **escalamiento jerárquico** al Dueño.
2. **Solicitud**: registro (formulario de Kobo o portal) → validación de criterios (Responsable de contenido) → ejecución → resolución → cierre.
3. **Problema**: incidentes repetidos o sin causa conocida → **registro de problema** con incidentes asociados → causa raíz → **error conocido** con workaround para Nivel 1 → **solicitud de cambio** para la solución definitiva.
4. **Cambio**: *estándar* (preautorizado, de bajo riesgo; lo ejecuta el Responsable técnico) o *normal* (lo aprueba el Dueño del servicio). Queda vinculado al ticket que lo originó.
5. **Incumplimiento del SLA**: un caso aislado se registra con su causa; si es recurrente pasa al flujo de problema y se escala al Dueño.
