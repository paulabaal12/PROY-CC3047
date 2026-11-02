/**
 * UI strings (es). Domain texts from Fase 1 live next to their config; everything else
 * is centralized here so another locale can be added by providing the same shape.
 */
export const es = {
  app: {
    name: 'Service Desk',
    service: 'centralamerica.games',
    tagline: 'Catálogo Centroamericano de Videojuegos',
    course: 'CC3047 · Fase 2',
  },
  nav: {
    newTicket: 'Nuevo ticket',
    myTickets: 'Mis tickets',
    catalog: 'Catálogo de servicios',
    board: 'Tablero',
    problems: 'Problemas',
    dashboard: 'Dashboard',
    settings: 'Configuración',
    internalOnly: 'Solo equipo de soporte',
  },
  header: {
    search: 'Buscar tickets por ID, título, solicitante o tag…',
    role: 'Rol activo',
    menu: 'Abrir menú',
  },
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    back: 'Volver',
    next: 'Siguiente',
    close: 'Cerrar',
    loading: 'Cargando…',
    none: '—',
    all: 'Todos',
    clearFilters: 'Limpiar filtros',
    retry: 'Reintentar',
  },
  fields: {
    type: 'Tipo',
    category: 'Categoría',
    title: 'Título',
    description: 'Descripción',
    tags: 'Tags',
    impact: 'Impacto',
    urgency: 'Urgencia',
    priority: 'Prioridad',
    status: 'Estado',
    channel: 'Canal',
    requester: 'Solicitante',
    name: 'Nombre',
    email: 'Correo',
    assignee: 'Responsable',
    level: 'Nivel',
    createdAt: 'Creado',
    updatedAt: 'Actualizado',
    respondedAt: 'Primera respuesta',
    resolvedAt: 'Resuelto',
    studio: 'Estudio',
    game: 'Juego',
  },
  sla: {
    response: 'Respuesta',
    resolution: 'Resolución',
    remaining: 'restante',
    overdue: 'vencido hace',
    met: 'cumplido',
    missed: 'incumplido',
    paused: 'Reloj en pausa (fuera de la ventana de servicio)',
  },
  empty: {
    noTickets: 'No hay tickets por aquí',
    noTicketsHint: 'Cuando registres uno aparecerá en esta lista.',
    noResults: 'Nada coincide con los filtros',
    noResultsHint: 'Prueba con otra búsqueda o limpia los filtros.',
    restricted: 'Esta vista es del equipo de soporte',
    restrictedHint:
      'Cambia el rol activo en la barra lateral a Service Desk, un Responsable o el Dueño del servicio.',
    notFound: 'No encontramos ese ticket',
  },
} as const;

export const t = es;
