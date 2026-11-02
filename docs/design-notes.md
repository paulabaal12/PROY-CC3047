# Notas de diseño

El Service Desk sigue un estilo **soft UI minimalista**: tarjetas blancas sobre un fondo claro azulado, bordes finos, mucho espacio en blanco y una identidad en azules y celestes. La jerarquía se consigue con el espacio, el tamaño y el peso tipográfico, no con bordes gruesos ni colores fuertes.

## Inspiración

| # | Pieza | Qué tomamos |
|---|---|---|
| 1 | **Helpdesk Ticket Dashboard Redesign**, Dribbble ([wastiansal](https://dribbble.com/wastiansal/shots)) | **Layout y jerarquía del dashboard.** Arriba, una fila de KPIs en tarjetas limpias con el número grande y un ícono suave en una esquina; debajo, los objetivos y las gráficas en tarjetas del mismo ancho. Un solo color de acento por tarjeta y etiquetas pequeñas en gris. |
| 2 | **KirriDesk — Ticket List / Ticket Preview**, Dribbble ([colección](https://dribbble.com/alibek_thedesigner/collections/6892790-)) | **Tratamiento de tickets y chips.** Filas de ticket con el ID en color primario, título en negrita y metadatos en gris. Chips de prioridad y estado con fondo tintado y un punto de color, en lugar de bloques saturados. Avatares con iniciales sobre fondos pastel. |
| 3 | **Project tracker kanban**, Kombai Gallery ([proyecto](https://ww2.kombai.com/gallery/inspirations/project-tracker-web-55/)) | **Tratamiento del tablero.** Columnas con un fondo apenas más oscuro que la página, tarjetas blancas con la misma estructura y una navegación lateral delgada. De ahí salen las columnas gris azulado, el contador discreto junto al título y el punto de color por estado en vez de subrayados. |
| 4 | **Linear — Board layout** ([documentación](https://linear.app/docs/board-layout)) | **Densidad e interacción.** Tarjetas compactas en las que cada dato ocupa siempre el mismo lugar, el arrastre con elevación suave y los filtros en una sola fila sobre el tablero. Este patrón ordena la tarjeta del Kanban: ID y prioridad arriba, título en dos líneas como máximo, categoría y, en el pie, el responsable y el SLA. |

## Sistema visual

- **Fondo y superficies.** Página `#F4F8FD`, tarjetas `#FFFFFF`, bordes de 1 px `#E2E8F0` y radio de 14 px. La única sombra es una difusa casi imperceptible (`0 1px 2px rgba(15,23,42,.04)`); al pasar el cursor por una tarjeta interactiva sube 1 px y su sombra se vuelve algo más visible.
- **Paleta.** Sidebar y títulos en azul profundo `#0B2545`; primario `#2563EB` (hover `#1D4ED8`); acento celeste `#38BDF8` y fondos `#E0F2FE`; texto `#0F172A` y secundario `#64748B`; éxito `#10B981`.
- **Prioridades.** Siempre como chip tintado (10–12% del color) con un punto y el texto en el tono oscuro correspondiente: Crítica `#EF4444`, Alta `#F97316`, Media `#F59E0B`, Baja `#38BDF8`, Planificada `#94A3B8`. Los estados siguen la misma regla.
- **Tipografía.** Solo dos familias: **Poppins** para títulos, números grandes y botones, e **Inter** para cuerpo, tablas, formularios y etiquetas. Escala: título de página 28–30 px/600, título de tarjeta 16–18 px/600, cuerpo 14–15 px/400, etiquetas 12–13 px/500. Sin itálicas decorativas.
- **Alturas de control.** Tres tokens (`36`, `40` y `48 px`). Los botones, inputs, selects, el buscador, los botones de ícono y los filtros de prioridad del tablero miden 40 px y se alinean al centro cuando comparten fila. Los botones primario y secundario comparten padding, radio (10 px) y peso; los dos botones del pie de un formulario van a la derecha y tienen el mismo ancho.
- **Espaciado.** Sistema de 8 px (múltiplos de 4 en detalles). El padding interno de las tarjetas es de 20–24 px y los gutters entre tarjetas son iguales en cada grilla.
- **Sidebar.** Azul profundo y plano, con la navegación agrupada (Portal, Soporte, Cuenta). El ítem activo lleva un fondo translúcido y una barrita lateral celeste de 3 px. El selector de rol es una tarjeta compacta al pie, con avatar y nombre.
- **Detalles con identidad.** Estados vacíos con una ilustración ligera (ícono en una tarjeta flotante, halo celeste y dos puntos de acento), encabezados de página con un resumen en pastillas (activos, P1 abiertos, SLA vencido), KPIs con un ícono tintado, línea de tiempo vertical con puntos de color por tipo de evento y avatares pastel por rol.
- **Gráficas.** Paleta categórica que arranca en azules y celestes, validada con un verificador de paletas (banda de luminosidad, croma y separación para daltonismo y visión normal) contra la tarjeta blanca y el panel oscuro. Tooltips blancos con borde fino, leyenda legible con valores y una vista de tabla en cada gráfica.
- **Modo noche.** El mismo lenguaje sobre `#0A1628` y paneles `#111F35`: bordes finos, sin sombras de color y las mismas dos fuentes. Los chips usan tonos claros del mismo color para mantener el contraste AA.
- **Accesibilidad.** Contraste AA, foco visible de 2 px, enlace "Saltar al contenido", tarjetas del tablero operables con teclado y prioridades que siempre llevan texto además del color.
