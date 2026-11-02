# Notas de diseño

El Service Desk debe sentirse de la misma familia que **centralamerica.games** (sistema "Pacífico Tropical": modernismo gráfico latinoamericano, tipografía bold, bordes marcados y sombras duras), pero con una paleta en azules y celestes, más serena para trabajar varias horas.

## Referencias

No había un MCP de Figma disponible, así que las referencias salen de una búsqueda en Dribbble y de una guía sobre neobrutalismo. Se revisaron los listados y las descripciones públicas de cada pieza.

| # | Referencia | Qué tomamos |
|---|---|---|
| 1 | **"IT Support \| Ticket Dashboard"**, Dribbble ([thecodesalim](https://dribbble.com/thecodesalim)) | Primero una fila de KPIs grandes (abiertos, críticos, % SLA, tiempo promedio) y debajo las gráficas por dimensión. Lo aplicamos al Dashboard: 4 KPIs con número grande en Archivo Black y una línea editorial en DM Serif Display. |
| 2 | **"Kanban Board View for Ticket Management System"**, Dribbble ([batuhankrskl](https://dribbble.com/batuhankrskl)) | Columnas con contador en la cabecera, tarjetas compactas (ID, título, prioridad, responsable) y una barra de filtros en una sola fila sobre el tablero. Le sumamos el contador de SLA y el banner de P1. |
| 3 | **Bruddle — Neo Brutalism UI Kit** ([caso en Contra](https://contra.com/p/YOsAoBUr-bruddle-neo-brutalism-ui-kit-a-product-design-case-study)) y la guía de [NN/g sobre neobrutalismo](https://www.nngroup.com/articles/neobrutalism/) | Bordes gruesos, sombra dura desplazada y bloques de color plano: el mismo lenguaje del sitio. De la guía de NN/g tomamos los cuidados: contraste AA, usar las sombras duras solo en superficies interactivas o importantes y no sacrificar legibilidad por estilo. |

## Decisiones visuales

- **Paleta**: navy del sitio (`#0A1A2E`) para el sidebar y los títulos; primario `#2563EB`; celeste `#3AAFD3` (el teal del sitio) para acentos y sombras duras. Las prioridades usan los colores del sitio: rojo `#E94F37`, papaya, mostaza, celeste y gris.
- **Tarjetas**: borde de 2 px, radio de 12 px y sombra `4px 4px 0` en celeste. Al pasar el cursor la tarjeta "se levanta" (`translate(-2px,-2px)` y sombra de 6 px). Se respeta `prefers-reduced-motion`.
- **Tipografía**: Archivo Black (títulos y números), DM Serif Display itálica (subtítulos y detalles editoriales) y DM Sans (cuerpo), las mismas del sitio.
- **Modo noche**: fondo `#0A1A2E` y paneles `#0D1F36`. Los títulos usan un token propio (`--heading`) para no quedar del color de los bordes.
- **Gráficas**: la paleta categórica de las 7 categorías se validó con un verificador de paletas (banda de luminosidad, croma y separación para daltonismo y para visión normal) contra la superficie clara y contra el panel oscuro. Cada gráfica tiene una vista de tabla, así ningún valor depende solo del color o del hover.
- **Accesibilidad**: enlace "Saltar al contenido", foco visible de 3 px, tarjetas del tablero operables con teclado (dnd-kit `KeyboardSensor`; Enter abre el ticket), chips de prioridad que siempre incluyen texto y estados SLA con texto además del color.
