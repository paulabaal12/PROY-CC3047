# Notas de diseño

El Service Desk busca verse como una herramienta de producto real: **sobria, densa y con los datos como protagonistas**. Usa bordes de 1 px en lugar de sombras, radios pequeños (8–10 px), un solo color de acento y el rojo y el verde reservados para comunicar estado.

## Referencias

| # | Referencia | Qué tomamos |
|---|---|---|
| 1 | **Linear** — [Board layout](https://linear.app/docs/board-layout) | **Tablero y navegación.** Sidebar clara y colapsable a una columna de íconos, con el ítem activo marcado solo por un fondo tenue. Columnas de igual ancho sobre un gris apenas distinto del fondo, con un punto de color y un contador discreto en la cabecera. Tarjetas compactas (~148 px) donde cada dato ocupa siempre la misma posición: ID y prioridad arriba, título de dos líneas, categoría y, en el pie, responsable y SLA. |
| 2 | **Plain** — [plain.com](https://www.plain.com) | **Listas de soporte.** Colas de tickets como filas compactas de 48 px, tipografía contenida (14 px, pesos 400/500) e IDs en gris neutro en lugar de azul. Chips de estado con fondo tintado suave y un hover de fila muy tenue. De aquí sale el `DataTable` de *Mis tickets*, *Catálogo* y *Problemas*. |
| 3 | **Atlassian Design System / Jira Service Management** — [atlassian.design](https://atlassian.design/) | **Detalle de ticket y estructura de página.** Breadcrumb clicable sobre el título (en lugar de un "Volver"), el título con sus *lozenges* de tipo, estado y prioridad, y el selector de estado como acción principal a la derecha. Grilla 8/4: contenido, comentarios e historial a la izquierda; SLA y una lista clave/valor alineada a la derecha. |
| 4 | **GitHub Primer** — [primer.style](https://primer.style/) y **Stripe Dashboard** | **KPIs, tablas y estados.** Fila de métricas del mismo tamaño con etiqueta gris, número grande y una línea de contexto, sin íconos de colores. Números tabulares en tablas y contadores, controles segmentados de 32 px, botones con jerarquía clara (primario sólido, secundario con borde, terciario sin fondo) y estados vacíos con un ícono lineal y una sola acción. |

## Sistema visual

- **Color.** Fondo `#F6F7F9`; superficies (cards, sidebar, header) `#FFFFFF`; bordes `#E5E7EB` y `#D1D5DB` en inputs. Texto `#111827`, `#6B7280` y `#9CA3AF`. Primario navy `#182C61` (hover `#12204A`, active `#0D1938`) y tinte `#EEF1F8` para ítems activos y hover de filas. Acento celeste `#3BA7DC` usado con mesura: foco, el punto del logo y detalles puntuales.
- **Estados.** La prioridad se muestra como un punto de 8 px y un chip con fondo al 10% y texto oscuro del mismo tono: Crítica `#DC2626`, Alta `#EA580C`, Media `#CA8A04`, Baja `#0284C7` y Planificada `#9CA3AF`. Éxito `#059669`.
- **Gráficas.** Rampa azul `#182C61 → #2F5597 → #4F86C6 → #7FB2E0 → #B5D5EE` para categorías y series únicas, y colores de prioridad solo en la gráfica de prioridad. Cuadrícula `#F1F5F9`, ejes sin línea, tooltips claros y una vista de tabla en cada gráfica.
- **Sombras.** Ninguna en superficies. Solo los overlays (menús, diálogos y la tarjeta arrastrada) llevan `0 8px 24px rgba(17,24,39,.12)`.
- **Tipografía.** Poppins solo en el título de página (24 px/600), los números de KPI (28 px/600) y los títulos de card (16 px/600). El resto va en Inter: 14 px de cuerpo, 12–13 px en etiquetas y 500 para énfasis. Números con `tabular-nums`. Los IDs se muestran en Inter 500 gris, y los links en navy, sin subrayado salvo al pasar el cursor.
- **Alturas.** 36 px estándar (botones, inputs, selects, buscador, chips de filtro y botones de ícono), 32 px compacto (controles segmentados) y 44 px solo para el CTA principal de un formulario. Radio de 8 px en controles y 10 px en cards.
- **Grilla.** Contenido de hasta 1280 px, gutters de 24 px y espaciado en múltiplos de 8. Las cards de una misma fila se estiran a la misma altura y una card sola en su fila ocupa el ancho completo.
- **Página.** Todas las vistas usan el mismo `PageHeader`: breadcrumb, título de 24 px, subtítulo de una línea y acciones a la derecha, con el mismo margen superior.
- **Foco.** `outline: 2px solid #3BA7DC` solo con `:focus-visible`; un clic con el mouse no deja recuadros.
- **Modo noche.** Mismos tokens sobre fondo `#0A0F1A`, superficies `#0F1623`, bordes `#1F2937` y texto `#E5E7EB`, con el primario en celeste `#7FB2E0`.
