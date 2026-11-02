/**
 * Demo data. Studios and games are real entries from reference/catalog-reference.json;
 * requesters are invented (@example.com) and every event is fictitious.
 * Dates are relative to the first run so the demo always covers the last 3 weeks.
 */
import { assigneeName, levelForAssignee, roleById } from '@/config/roles';
import type {
  Actor,
  AssigneeId,
  CategoryId,
  Channel,
  ChangeType,
  EscalationRoute,
  HistoryEntry,
  Impact,
  Person,
  RoleId,
  Status,
  Ticket,
  TicketComment,
  TicketDetails,
  Urgency,
} from '@/types';
import { serviceById } from '@/config/services';
import { addBusinessMinutes, atLocalTime, businessDaysBefore } from '@/utils/businessHours';
import { formatTicketId } from '@/utils/ids';
import { calculatePriority } from '@/utils/priority';

interface SeedComment {
  after: number;
  role: RoleId;
  text: string;
  internal?: boolean;
}

interface SeedEscalation {
  after: number;
  route: EscalationRoute;
  to: AssigneeId;
  reason: string;
}

interface SeedSpec {
  key: string;
  category: CategoryId;
  title: string;
  description: string;
  impact: Impact;
  urgency: Urgency;
  channel: Channel;
  requester: Person;
  tags: string[];
  /** Business days before the first run; `minutesAgo` overrides it for live tickets. */
  day: number;
  at: [number, number];
  minutesAgo?: number;
  status: Status;
  assignee?: AssigneeId;
  studio?: string;
  game?: string;
  details: TicketDetails;
  /** Business minutes after creation. */
  respondAfter?: number;
  resolveAfter?: number;
  closeAfter?: number;
  comments?: SeedComment[];
  escalations?: SeedEscalation[];
  problem?: { rootCause: string; links: string[] };
  knownError?: { workaround: string };
  change?: { type: ChangeType; parent: string };
  slaBreachCause?: string;
}

const P = {
  monitor: { name: 'UptimeRobot (alerta automática)', email: 'alertas-uptime@example.com' },
  lucia: roleById('usuario').persona,
  carlos: { name: 'Carlos Pineda', email: 'carlos.pineda@example.com' },
  valeria: { name: 'Valeria Rojas', email: 'valeria.rojas@example.com' },
  jose: { name: 'José Ramírez', email: 'jose.ramirez@example.com' },
  fernanda: { name: 'Fernanda Morales', email: 'fernanda.morales@example.com' },
  sofia: { name: 'Sofía Herrera', email: 'sofia.herrera@example.com' },
  gabriel: { name: 'Gabriel Chávez', email: 'gabriel.chavez@example.com' },
  isabel: { name: 'Isabel Torres', email: 'isabel.torres@example.com' },
  mateo: { name: 'Mateo Barrios', email: 'mateo.barrios@example.com' },
  daniela: { name: 'Daniela Pérez', email: 'daniela.perez@example.com' },
} satisfies Record<string, Person>;

const SPECS: SeedSpec[] = [
  // ───────────── Incidentes: Sitio no disponible ─────────────
  {
    key: 'p1-pages',
    category: 'sitio-no-disponible',
    title: 'UptimeRobot: centralamerica.games caído (HTTP 503)',
    description:
      'El monitor reporta el sitio caído en dos sondeos seguidos. GitHub Status muestra degradación de GitHub Pages.',
    impact: 'Alto',
    urgency: 'Alta',
    channel: 'Monitoreo UptimeRobot',
    requester: P.monitor,
    tags: ['github-pages', 'caída'],
    day: 13,
    at: [9, 12],
    status: 'Cerrado',
    details: {
      url: 'https://centralamerica.games/',
      desde: '',
      error: 'HTTP 503 Service Unavailable',
    },
    respondAfter: 4,
    resolveAfter: 70,
    closeAfter: 400,
    escalations: [
      {
        after: 8,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Incidente Crítico que Nivel 1 no resolvió en ≤ 10 min',
      },
      {
        after: 20,
        route: 'funcional',
        to: 'proveedor-github',
        reason: 'Caída o degradación de GitHub Pages / Actions',
      },
    ],
    comments: [
      {
        after: 4,
        role: 'service-desk',
        text: 'Confirmado: el sitio no carga desde dos redes distintas. Se escala a técnico.',
      },
      {
        after: 25,
        role: 'resp-tecnico',
        text: 'Incidente abierto en githubstatus.com. Seguimos su actualización.',
        internal: true,
      },
      {
        after: 70,
        role: 'resp-tecnico',
        text: 'GitHub Pages restablecido. Sitio responde 200 en /es/ y /en/.',
      },
    ],
  },
  {
    key: 'p1-https',
    category: 'sitio-no-disponible',
    title: 'Certificado HTTPS inválido en centralamerica.games',
    description:
      'Al abrir el sitio aparece NET::ERR_CERT_COMMON_NAME_INVALID. Ocurrió después de revisar el archivo CNAME.',
    impact: 'Alto',
    urgency: 'Alta',
    channel: 'Portal/Correo',
    requester: P.carlos,
    tags: ['https', 'dns', 'cname'],
    day: 9,
    at: [10, 5],
    status: 'Resuelto',
    details: {
      url: 'https://centralamerica.games/es/',
      desde: '',
      error: 'NET::ERR_CERT_COMMON_NAME_INVALID — "Su conexión no es privada"',
    },
    respondAfter: 22,
    resolveAfter: 135,
    escalations: [
      {
        after: 22,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Incidente Crítico que Nivel 1 no resolvió en ≤ 10 min',
      },
      {
        after: 45,
        route: 'funcional',
        to: 'proveedor-github',
        reason: 'Problema de dominio o certificado HTTPS',
      },
      { after: 80, route: 'jerarquica', to: 'dueno', reason: 'P1 que se proyecta a más de 90 min' },
    ],
    comments: [
      {
        after: 22,
        role: 'service-desk',
        text: 'Gracias por avisar. Lo estamos revisando con prioridad Crítica.',
      },
      {
        after: 50,
        role: 'resp-tecnico',
        text: 'El CNAME quedó bien, pero GitHub está re-emitiendo el certificado. Se pidió soporte.',
        internal: true,
      },
      {
        after: 82,
        role: 'dueno',
        text: 'Informado. Si pasa de 2 h avisamos a UVG y AECID.',
        internal: true,
      },
      {
        after: 135,
        role: 'resp-tecnico',
        text: 'Certificado emitido y "Enforce HTTPS" activo. Sitio accesible.',
      },
    ],
    slaBreachCause:
      'Respuesta tardía: el aviso llegó por correo y no por UptimeRobot. La re-emisión del certificado de GitHub Pages superó los 90 min del objetivo P1.',
  },
  {
    key: 'p1-deploy',
    category: 'sitio-no-disponible',
    title: 'Sitio publicado vacío (404) tras cambio en deploy.yml',
    description:
      'Después del último push todas las rutas devuelven 404. El artefacto de Pages se subió sin la carpeta dist/.',
    impact: 'Alto',
    urgency: 'Alta',
    channel: 'Monitoreo UptimeRobot',
    requester: P.monitor,
    tags: ['github-actions', 'deploy'],
    day: 4,
    at: [8, 40],
    status: 'Cerrado',
    details: {
      url: 'https://centralamerica.games/',
      desde: '',
      error: "404 — There isn't a GitHub Pages site here.",
    },
    respondAfter: 3,
    resolveAfter: 55,
    closeAfter: 300,
    escalations: [
      {
        after: 7,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Requiere cambio en el build, el script de validación o el despliegue',
      },
    ],
    comments: [
      {
        after: 3,
        role: 'service-desk',
        text: 'Recibido. El último commit tocó .github/workflows/deploy.yml.',
      },
      {
        after: 55,
        role: 'resp-tecnico',
        text: 'Revertido el cambio en upload-pages-artifact (path: dist). Publicado de nuevo.',
      },
    ],
  },
  {
    key: 'p1-live',
    category: 'sitio-no-disponible',
    title: 'UptimeRobot: centralamerica.games no responde (timeout)',
    description: 'Dos sondeos seguidos sin respuesta en 30 s. Sin aviso de usuarios todavía.',
    impact: 'Alto',
    urgency: 'Alta',
    channel: 'Monitoreo UptimeRobot',
    requester: P.monitor,
    tags: ['caída'],
    day: 0,
    at: [8, 0],
    minutesAgo: 8,
    status: 'Abierto',
    details: { url: 'https://centralamerica.games/', desde: '', error: 'Timeout (30 s)' },
  },
  {
    key: 'dns-region',
    category: 'sitio-no-disponible',
    title: 'El sitio no carga desde Honduras y El Salvador',
    description:
      'Varios estudios reportan que el dominio no resuelve desde su proveedor de internet. Desde Guatemala sí carga.',
    impact: 'Alto',
    urgency: 'Media',
    channel: 'Mensajería',
    requester: P.jose,
    tags: ['dns'],
    day: 2,
    at: [11, 15],
    status: 'En progreso',
    details: {
      url: 'https://centralamerica.games/',
      desde: '',
      error: 'DNS_PROBE_FINISHED_NXDOMAIN',
    },
    respondAfter: 25,
    escalations: [
      {
        after: 40,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Incidente Alto que Nivel 1 no resolvió en ≤ 30 min',
      },
    ],
    comments: [
      {
        after: 25,
        role: 'service-desk',
        text: 'Gracias. ¿Nos podés compartir una captura y el proveedor de internet?',
      },
      {
        after: 30,
        role: 'usuario',
        text: 'Tigo en Tegucigalpa y Claro en San Salvador. Adjunto captura.',
      },
      {
        after: 60,
        role: 'resp-tecnico',
        text: 'Los registros A apuntan bien; parece caché de DNS de los proveedores. Monitoreando propagación.',
        internal: true,
      },
    ],
  },
  // ───────────── Incidentes: Búsqueda / filtros ─────────────
  {
    key: 'filter-ni',
    category: 'busqueda-lenta',
    title: 'El filtro por país no devuelve estudios de Nicaragua',
    description:
      'Al marcar Nicaragua en el catálogo no aparece ningún estudio, aunque Danny Garay está listado.',
    impact: 'Medio',
    urgency: 'Media',
    channel: 'Portal/Correo',
    requester: P.lucia,
    tags: ['filtros'],
    day: 11,
    at: [14, 20],
    status: 'Cerrado',
    studio: 'danny-garay',
    details: { funcion: 'Filtro por país (Nicaragua)', dispositivo: 'Laptop', navegador: 'Chrome' },
    respondAfter: 50,
    resolveAfter: 600,
    closeAfter: 1300,
    escalations: [
      {
        after: 60,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Requiere cambio en el build, el script de validación o el despliegue',
      },
    ],
    comments: [
      { after: 50, role: 'service-desk', text: 'Reproducido. Lo pasamos al responsable técnico.' },
      {
        after: 600,
        role: 'resp-tecnico',
        text: 'El código de país estaba como "NIC" en un YAML; corregido a "NI" y el validador ahora lo rechaza.',
      },
      { after: 700, role: 'usuario', text: 'Confirmo, ya aparece. ¡Gracias!' },
    ],
  },
  {
    key: 'search-mobile',
    category: 'busqueda-lenta',
    title: 'La búsqueda se congela en teléfonos al escribir',
    description: 'En Android, al escribir en el buscador la página se traba 3–4 s por cada letra.',
    impact: 'Medio',
    urgency: 'Alta',
    channel: 'Mensajería',
    requester: P.valeria,
    tags: ['rendimiento', 'móvil'],
    day: 6,
    at: [10, 30],
    status: 'En progreso',
    details: {
      funcion: 'Búsqueda libre del catálogo',
      dispositivo: 'Teléfono',
      navegador: 'Chrome',
    },
    respondAfter: 20,
    escalations: [
      {
        after: 35,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Incidente Alto que Nivel 1 no resolvió en ≤ 30 min',
      },
    ],
    comments: [
      {
        after: 20,
        role: 'service-desk',
        text: 'Mientras tanto podés usar el mapa por país (/es/mapa/), que no se traba.',
      },
      {
        after: 300,
        role: 'resp-tecnico',
        text: 'Mismo patrón que el problema de rendimiento de búsqueda. Se asocia.',
        internal: true,
      },
    ],
  },
  {
    key: 'games-safari',
    category: 'busqueda-lenta',
    title: 'La vista de juegos tarda más de 10 s en Safari',
    description: 'En /es/juegos/ la cuadrícula tarda muchísimo en aparecer en Safari (iPad).',
    impact: 'Medio',
    urgency: 'Media',
    channel: 'Portal/Correo',
    requester: P.daniela,
    tags: ['rendimiento'],
    day: 3,
    at: [9, 45],
    status: 'Abierto',
    details: {
      funcion: 'Vista de juegos (orden aleatorio)',
      dispositivo: 'Tablet',
      navegador: 'Safari',
    },
  },
  {
    key: 'prob-search',
    category: 'busqueda-lenta',
    title: 'Problema: rendimiento de búsqueda y filtros en el navegador',
    description:
      'Registro de problema que agrupa los incidentes de lentitud en búsqueda y filtros, sobre todo en móviles.',
    impact: 'Medio',
    urgency: 'Media',
    channel: 'Portal/Correo',
    requester: roleById('resp-tecnico').persona,
    tags: ['rendimiento'],
    day: 5,
    at: [15, 0],
    status: 'En progreso',
    assignee: 'resp-tecnico',
    details: { funcion: 'Búsqueda y filtros', dispositivo: 'Teléfono', navegador: 'Otro' },
    respondAfter: 10,
    problem: {
      rootCause:
        'El filtrado recorre todo catalog.json en cada pulsación (sin debounce) y el orden aleatorio vuelve a pintar la cuadrícula completa.',
      links: ['search-mobile', 'games-safari'],
    },
    knownError: {
      workaround:
        'Usar el mapa por país (/es/mapa/) o filtrar desde escritorio; en la vista de juegos ordenar A–Z en lugar de aleatorio.',
    },
    comments: [
      {
        after: 10,
        role: 'resp-tecnico',
        text: 'Abrimos el problema y documentamos el workaround para Nivel 1.',
        internal: true,
      },
    ],
  },
  {
    key: 'filter-tech',
    category: 'busqueda-lenta',
    title: 'Filtro "GameMaker Studio" muestra 0 resultados a veces',
    description: 'El filtro por tecnología a veces no devuelve nada; al recargar sí funciona.',
    impact: 'Bajo',
    urgency: 'Media',
    channel: 'Mensajería',
    requester: P.mateo,
    tags: ['filtros'],
    day: 8,
    at: [13, 10],
    status: 'Resuelto',
    details: { funcion: 'Filtro por tecnología', dispositivo: 'Escritorio', navegador: 'Firefox' },
    respondAfter: 90,
    resolveAfter: 900,
    comments: [
      { after: 90, role: 'service-desk', text: 'Gracias, lo reproducimos en Firefox.' },
      {
        after: 900,
        role: 'resp-tecnico',
        text: 'Había valores "Gamemaker" y "GameMaker Studio". Se normalizaron (ver cambio estándar).',
      },
    ],
  },
  // ───────────── Incidentes: Ficha corrupta / imagen ─────────────
  {
    key: 'capsule-mawkey',
    category: 'ficha-corrupta',
    title: 'La capsule de Mawkey: The Last Macaw no carga',
    description: 'En la vista de juegos la portada vertical aparece rota (ícono de imagen).',
    impact: 'Bajo',
    urgency: 'Baja',
    channel: 'Portal/Correo',
    requester: P.fernanda,
    tags: ['imagen'],
    day: 11,
    at: [16, 30],
    status: 'Cerrado',
    studio: 'guerra-pixel-studio',
    game: 'mawkey-the-last-macaw',
    details: { campo: 'Capsule' },
    respondAfter: 300,
    resolveAfter: 2400,
    closeAfter: 3000,
    escalations: [
      {
        after: 320,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Datos corruptos o imágenes a restaurar',
      },
    ],
    comments: [
      {
        after: 300,
        role: 'service-desk',
        text: 'Registrado. Prioridad Planificada: lo resolvemos en esta semana.',
      },
      {
        after: 2400,
        role: 'resp-tecnico',
        text: 'El archivo era capsule.PNG (mayúsculas). Renombrado y publicado.',
      },
    ],
  },
  {
    key: 'text-toziuha',
    category: 'ficha-corrupta',
    title: 'Caracteres extraños en la descripción de Toziuha Night',
    description: 'La descripción en español muestra "Ã±" en lugar de "ñ".',
    impact: 'Bajo',
    urgency: 'Media',
    channel: 'Mensajería',
    requester: P.gabriel,
    tags: ['codificación'],
    day: 7,
    at: [11, 0],
    status: 'Resuelto',
    studio: 'danny-garay',
    game: 'toziuha-night-order-of-the-alchemists',
    details: { campo: 'Descripción' },
    respondAfter: 120,
    resolveAfter: 1500,
    escalations: [
      {
        after: 130,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Datos corruptos o imágenes a restaurar',
      },
    ],
    comments: [
      {
        after: 1500,
        role: 'resp-tecnico',
        text: 'game.yaml guardado en Latin-1; convertido a UTF-8.',
      },
    ],
  },
  {
    key: 'prob-steam',
    category: 'ficha-corrupta',
    title: 'Problema: portadas de Steam reemplazadas tras update-steam',
    description:
      'Después de la Action semanal update-steam, varias fichas muestran la portada genérica de Steam o una imagen pixelada.',
    impact: 'Medio',
    urgency: 'Media',
    channel: 'Portal/Correo',
    requester: roleById('service-desk').persona,
    tags: ['update-steam', 'imagen'],
    day: 10,
    at: [9, 30],
    status: 'En progreso',
    assignee: 'resp-tecnico',
    details: { campo: 'Datos de Steam' },
    respondAfter: 60,
    problem: {
      rootCause:
        'update-steam baja la portada vertical cuando falta, pero no valida dimensiones (374×448) ni detecta la imagen por defecto de Steam.',
      links: ['capsule-bugfables', 'capsule-oscuro'],
    },
    comments: [
      {
        after: 60,
        role: 'resp-tecnico',
        text: 'Se crea el problema. Afecta ~7 de 34 juegos (≈20%).',
        internal: true,
      },
    ],
  },
  {
    key: 'capsule-bugfables',
    category: 'ficha-corrupta',
    title: 'Portada de Bug Fables: The Everlasting Sapling en blanco',
    description: 'Desde el lunes la portada del juego aparece como un rectángulo blanco.',
    impact: 'Bajo',
    urgency: 'Media',
    channel: 'Portal/Correo',
    requester: P.isabel,
    tags: ['imagen', 'update-steam'],
    day: 10,
    at: [8, 50],
    status: 'Resuelto',
    studio: 'moonsprout-games-sa',
    game: 'bug-fables-the-everlasting-sapling',
    details: { campo: 'Capsule' },
    respondAfter: 40,
    resolveAfter: 1200,
    escalations: [
      {
        after: 45,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Datos corruptos o imágenes a restaurar',
      },
    ],
    comments: [
      {
        after: 1200,
        role: 'resp-tecnico',
        text: 'Se restauró la capsule desde el historial de git.',
      },
    ],
  },
  {
    key: 'capsule-oscuro',
    category: 'ficha-corrupta',
    title: "Capsule pixelada en Oscuro Blossom's Glow",
    description: 'La portada se ve de muy baja resolución desde la última actualización de Steam.',
    impact: 'Bajo',
    urgency: 'Baja',
    channel: 'Portal/Correo',
    requester: P.valeria,
    tags: ['imagen', 'update-steam'],
    day: 5,
    at: [10, 10],
    status: 'Abierto',
    studio: 'hongoneon',
    game: 'oscuro-blossoms-glow',
    details: { campo: 'Capsule' },
  },
  {
    key: 'banner-erandique',
    category: 'ficha-corrupta',
    title: 'Banner roto en la ficha de Erandique antes de publicación en redes',
    description:
      'El banner no carga y mañana se publica la ficha en las redes del catálogo; coincide con una publicación programada.',
    impact: 'Bajo',
    urgency: 'Alta',
    channel: 'Mensajería',
    requester: P.jose,
    tags: ['imagen', 'difusión'],
    day: 2,
    at: [9, 5],
    status: 'En progreso',
    studio: 'black-jack-gs',
    game: 'erandique',
    details: { campo: 'Banner' },
    respondAfter: 60,
    escalations: [
      {
        after: 70,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Datos corruptos o imágenes a restaurar',
      },
    ],
    comments: [
      {
        after: 60,
        role: 'service-desk',
        text: 'Urgencia Alta por la publicación programada. Ya está con técnico.',
      },
    ],
  },
  {
    key: 'p1-data',
    category: 'ficha-corrupta',
    title: 'Más de la mitad de las fichas muestran datos vacíos',
    description:
      'Tras un merge, catalog.json se generó con descripciones y plataformas vacías en la mayoría de los juegos.',
    impact: 'Alto',
    urgency: 'Alta',
    channel: 'Portal/Correo',
    requester: P.sofia,
    tags: ['build-data', 'datos'],
    day: 12,
    at: [10, 40],
    status: 'Cerrado',
    details: { campo: 'Otro' },
    respondAfter: 5,
    resolveAfter: 85,
    closeAfter: 500,
    escalations: [
      {
        after: 6,
        route: 'funcional',
        to: 'resp-tecnico',
        reason: 'Datos corruptos o imágenes a restaurar',
      },
    ],
    comments: [
      {
        after: 5,
        role: 'service-desk',
        text: 'Impacto Alto (> 50% de fichas). Escalado a técnico.',
      },
      {
        after: 85,
        role: 'resp-tecnico',
        text: 'Revertido el merge y regenerado catalog.json. Validado en 10 fichas al azar.',
      },
    ],
  },
  // ───────────── Solicitudes: Registro ─────────────
  {
    key: 'alta-quetzal',
    category: 'registro',
    title: 'Alta de estudio: Quetzal Pixel Works (estudio nuevo)',
    description:
      'Envío del formulario de alta de estudios en KoboToolbox. Estudio ficticio de demostración.',
    impact: 'Bajo',
    urgency: 'Baja',
    channel: 'Formulario Kobo',
    requester: P.carlos,
    tags: ['kobo', 'alta'],
    day: 12,
    at: [12, 0],
    status: 'Cerrado',
    details: {
      registroDe: 'Estudio nuevo',
      nombre: 'Quetzal Pixel Works',
      estudio: '__nuevo__',
      pais: 'GT',
      fundacion: '2022',
      destacado: 'Volcanes de Fuego',
      plataformas: ['Steam', 'itch.io'],
      genero: 'Plataformas',
      enlace: 'https://example.com/quetzal-pixel-works',
      imagen: 'logo-quetzal.png',
    },
    respondAfter: 200,
    resolveAfter: 1350,
    closeAfter: 2000,
    escalations: [
      {
        after: 210,
        route: 'funcional',
        to: 'resp-contenido',
        reason: 'Validar criterios de inclusión de una ficha',
      },
    ],
    comments: [
      {
        after: 600,
        role: 'resp-contenido',
        text: 'Cumple criterios: estudio en GT, juego publicado y enlace verificable.',
      },
      {
        after: 1350,
        role: 'service-desk',
        text: 'Ficha publicada. Recordatorio: agregar el estudio a la lista del formulario de juegos adicionales.',
        internal: true,
      },
    ],
  },
  {
    key: 'alta-502',
    category: 'registro',
    title: 'Juego adicional de 502 Studios',
    description:
      'Formulario de juegos adicionales: un juego nuevo de 502 Studios (nombre ficticio de demostración).',
    impact: 'Bajo',
    urgency: 'Baja',
    channel: 'Formulario Kobo',
    requester: P.mateo,
    tags: ['kobo', 'alta'],
    day: 4,
    at: [14, 45],
    status: 'En progreso',
    studio: '502-studios',
    details: {
      registroDe: 'Videojuego de un estudio existente',
      nombre: 'Volcano Run (demo)',
      estudio: '502-studios',
      pais: 'GT',
      fundacion: '2012',
      destacado: "502's Arcade",
      plataformas: ['Steam', 'Nintendo Switch'],
      genero: 'Arcade',
      enlace: 'https://example.com/volcano-run',
      imagen: 'capsule-volcano-run.jpg',
    },
    respondAfter: 300,
    escalations: [
      {
        after: 310,
        route: 'funcional',
        to: 'resp-contenido',
        reason: 'Validar criterios de inclusión de una ficha',
      },
    ],
    comments: [
      {
        after: 400,
        role: 'resp-contenido',
        text: 'Falta confirmar la fecha de publicación. Se pidió al estudio.',
      },
    ],
  },
  {
    key: 'alta-tecolote',
    category: 'registro',
    title: 'Alta de estudio: Tecolote Games (Nicaragua)',
    description:
      'Envío nocturno del formulario de alta (fuera de la ventana de servicio). Estudio ficticio.',
    impact: 'Bajo',
    urgency: 'Baja',
    channel: 'Formulario Kobo',
    requester: P.lucia,
    tags: ['kobo', 'alta', 'fuera de horario'],
    day: 1,
    at: [21, 40],
    status: 'Abierto',
    details: {
      registroDe: 'Estudio nuevo',
      nombre: 'Tecolote Games',
      estudio: '__nuevo__',
      pais: 'NI',
      fundacion: '2023',
      destacado: 'Noches de León',
      plataformas: ['itch.io'],
      genero: 'Aventura narrativa',
      enlace: 'https://example.com/tecolote-games',
      imagen: 'logo-tecolote.png',
    },
  },
  // ───────────── Solicitudes: Actualización / retiro ─────────────
  {
    key: 'upd-speedrun',
    category: 'actualizacion',
    title: 'Corregir plataformas de Speed Run Project (agregar Xbox)',
    description: 'El estudio informa que el juego ya salió en Xbox.',
    impact: 'Bajo',
    urgency: 'Baja',
    channel: 'Portal/Correo',
    requester: P.isabel,
    tags: ['plataformas'],
    day: 9,
    at: [9, 20],
    status: 'Cerrado',
    studio: 'red-pixel-studios',
    game: 'speed-run-project',
    details: {
      estudio: 'red-pixel-studios',
      juego: 'speed-run-project',
      accion: 'Corregir',
      campo: 'plataformas',
      fuente: 'Correo del estudio + página de Microsoft Store',
    },
    respondAfter: 120,
    resolveAfter: 810,
    closeAfter: 1300,
    escalations: [
      {
        after: 130,
        route: 'funcional',
        to: 'resp-contenido',
        reason: 'Verificar la fuente de una actualización',
      },
    ],
    comments: [
      { after: 810, role: 'resp-contenido', text: 'Verificado en la tienda y publicado.' },
    ],
  },
  {
    key: 'upd-lez',
    category: 'actualizacion',
    title: 'Actualizar estado de LEZ: de early-access a released',
    description: 'El juego salió de acceso anticipado.',
    impact: 'Bajo',
    urgency: 'Baja',
    channel: 'Mensajería',
    requester: P.gabriel,
    tags: ['estado'],
    day: 8,
    at: [10, 0],
    status: 'Resuelto',
    studio: 'daztrax-studios',
    game: 'lez',
    details: {
      estudio: 'daztrax-studios',
      juego: 'lez',
      accion: 'Corregir',
      campo: 'status',
      fuente: 'Página de Steam del juego',
    },
    respondAfter: 400,
    resolveAfter: 2160,
    escalations: [
      {
        after: 420,
        route: 'funcional',
        to: 'resp-contenido',
        reason: 'Verificar la fuente de una actualización',
      },
    ],
    comments: [
      {
        after: 2160,
        role: 'resp-contenido',
        text: 'Actualizado. Se demoró por esperar confirmación del estudio.',
      },
    ],
    slaBreachCause:
      'Superó el objetivo de 3 días hábiles: se esperó confirmación del estudio sin pausar el caso.',
  },
  {
    key: 'retiro-chaotic',
    category: 'actualizacion',
    title: 'Retiro de la ficha de Chaotic Survivor',
    description: 'Una persona pide retirar la ficha; el estudio no ha confirmado y hay desacuerdo.',
    impact: 'Bajo',
    urgency: 'Media',
    channel: 'Portal/Correo',
    requester: P.daniela,
    tags: ['retiro', 'disputa'],
    day: 6,
    at: [15, 10],
    status: 'En progreso',
    studio: 'lost-train-studio',
    game: 'chaotic-survivor',
    details: {
      estudio: 'lost-train-studio',
      juego: 'chaotic-survivor',
      accion: 'Retirar',
      campo: 'ficha completa',
      fuente: 'Correo de una exintegrante (sin verificar)',
    },
    respondAfter: 200,
    escalations: [
      {
        after: 210,
        route: 'funcional',
        to: 'resp-contenido',
        reason: 'Verificar la fuente de una actualización',
      },
      {
        after: 700,
        route: 'jerarquica',
        to: 'dueno',
        reason: 'Disputa por el retiro de una ficha',
      },
    ],
    comments: [
      {
        after: 650,
        role: 'resp-contenido',
        text: 'El estudio dice que el juego sigue activo. Hay disputa.',
        internal: true,
      },
      {
        after: 720,
        role: 'dueno',
        text: 'Mantenemos la ficha hasta tener confirmación escrita del estudio.',
      },
    ],
  },
  {
    key: 'upd-illuminaria',
    category: 'actualizacion',
    title: 'Completar descripción en inglés de Illuminaria',
    description: 'La ficha en /en/ muestra la descripción en español.',
    impact: 'Bajo',
    urgency: 'Baja',
    channel: 'Portal/Correo',
    requester: P.lucia,
    tags: ['i18n'],
    day: 2,
    at: [16, 0],
    status: 'Abierto',
    studio: 'selva-interactive',
    game: 'illuminaria',
    details: {
      estudio: 'selva-interactive',
      juego: 'illuminaria',
      accion: 'Completar',
      campo: 'description.en',
      fuente: 'Texto enviado por el estudio',
    },
  },
  // ───────────── Solicitudes: Mantenimiento de BD ─────────────
  {
    key: 'chg-platforms',
    category: 'mantenimiento-bd',
    title: 'Normalizar nombres de tecnologías y plataformas en content/',
    description: 'Unificar "Gamemaker" → "GameMaker Studio" y similares en todos los YAML.',
    impact: 'Bajo',
    urgency: 'Baja',
    channel: 'Portal/Correo',
    requester: roleById('resp-tecnico').persona,
    tags: ['cambio estándar'],
    day: 7,
    at: [14, 0],
    status: 'Cerrado',
    assignee: 'resp-tecnico',
    details: { alcance: '68', motivo: 'Valores duplicados rompen los filtros por tecnología.' },
    change: { type: 'Cambio estándar', parent: 'filter-tech' },
    respondAfter: 30,
    resolveAfter: 600,
    closeAfter: 900,
    comments: [
      {
        after: 600,
        role: 'resp-tecnico',
        text: 'Normalizados 68 registros; npm run check en verde.',
      },
    ],
  },
  {
    key: 'chg-validate',
    category: 'mantenimiento-bd',
    title: 'Validar dimensiones de capsule en build-data.mjs',
    description:
      'Agregar al script de validación una regla que rechace capsules que no sean 374×448 o que sean la imagen por defecto de Steam.',
    impact: 'Medio',
    urgency: 'Baja',
    channel: 'Portal/Correo',
    requester: roleById('resp-tecnico').persona,
    tags: ['cambio normal'],
    day: 3,
    at: [11, 30],
    status: 'Abierto',
    assignee: 'dueno',
    details: {
      alcance: '34',
      motivo: 'Solución definitiva del problema de portadas tras update-steam.',
    },
    change: { type: 'Cambio normal', parent: 'prob-steam' },
    comments: [
      {
        after: 30,
        role: 'resp-tecnico',
        text: 'Cambio normal: toca el pipeline de publicación. Pendiente de aprobación del Dueño.',
        internal: true,
      },
    ],
  },
  // ───────────── Solicitudes: Extracción ─────────────
  {
    key: 'csv-aecid',
    category: 'extraccion',
    title: 'CSV de estudios de Guatemala para informe de AECID',
    description:
      'Se necesita para el informe trimestral, que se entrega mañana (tarea programada).',
    impact: 'Bajo',
    urgency: 'Alta',
    channel: 'Portal/Correo',
    requester: P.sofia,
    tags: ['informe', 'aecid'],
    day: 7,
    at: [8, 30],
    status: 'Cerrado',
    details: { formato: 'CSV', filtroPais: ['GT'], filtroEstado: [], motivo: 'Informe' },
    respondAfter: 30,
    resolveAfter: 300,
    closeAfter: 900,
    comments: [
      { after: 30, role: 'service-desk', text: 'Recibido. Lo tenés hoy antes de las 16:00.' },
      { after: 300, role: 'service-desk', text: 'Adjuntamos estudios-GT.csv (11 estudios).' },
    ],
  },
  {
    key: 'xls-prensa',
    category: 'extraccion',
    title: 'Excel de juegos publicados para nota de prensa',
    description: 'Lista de juegos con estado released, por país.',
    impact: 'Bajo',
    urgency: 'Baja',
    channel: 'Mensajería',
    requester: P.lucia,
    tags: ['prensa'],
    day: 1,
    at: [10, 15],
    status: 'Abierto',
    details: {
      formato: 'Excel',
      filtroPais: [],
      filtroEstado: ['released'],
      motivo: 'Publicación',
    },
  },
];

const actorFor = (role: RoleId, requester: Person): Actor =>
  role === 'usuario' ? { role, name: requester.name } : { role, name: roleById(role).persona.name };

export function buildSeed(now: Date): Ticket[] {
  const safe = (d: Date) => (d.getTime() > now.getTime() ? new Date(now.getTime() - 60_000) : d);
  let counter = 0;
  const hid = () => `seed-${(counter++).toString(36)}`;

  const created = SPECS.map((spec) => {
    const createdAt =
      spec.minutesAgo !== undefined
        ? new Date(now.getTime() - spec.minutesAgo * 60_000)
        : safe(atLocalTime(businessDaysBefore(now, spec.day), spec.at[0], spec.at[1]));
    return { spec, createdAt };
  }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const idByKey = new Map(created.map(({ spec }, i) => [spec.key, formatTicketId(i + 1)]));

  const tickets = created.map(({ spec, createdAt }): Ticket => {
    const at = (after: number) => safe(addBusinessMinutes(createdAt, after)).toISOString();
    const sd = actorFor('service-desk', spec.requester);
    const history: HistoryEntry[] = [];
    const push = (e: Omit<HistoryEntry, 'id'>) => history.push({ id: hid(), ...e });
    const priority = calculatePriority(spec.impact, spec.urgency);

    const creator = spec.change ? actorFor('resp-tecnico', spec.requester) : sd;
    push({
      at: createdAt.toISOString(),
      kind: 'created',
      actor: creator,
      to: 'Abierto',
      note: `Registrado por ${spec.channel}. Prioridad ${priority}.`,
    });
    if (spec.change) {
      const parentId = idByKey.get(spec.change.parent);
      push({
        at: createdAt.toISOString(),
        kind: 'change',
        actor: creator,
        note: `${spec.change.type} generado desde ${parentId}.`,
      });
    }

    let assignee: AssigneeId = 'service-desk';
    let level = levelForAssignee(assignee, 'Nivel 1');
    let status: Status = 'Abierto';
    const setStatus = (to: Status, when: string, actor: Actor) => {
      if (to === status) return;
      push({ at: when, kind: 'status', actor, from: status, to });
      status = to;
    };

    // Providers act through the technical lead in this simulation.
    const holder = (): Actor =>
      assignee.startsWith('proveedor-')
        ? actorFor('resp-tecnico', spec.requester)
        : actorFor(assignee as RoleId, spec.requester);

    for (const esc of spec.escalations ?? []) {
      const when = at(esc.after);
      const actor = holder();
      const route = esc.route === 'funcional' ? 'Funcional' : 'Jerárquica';
      push({
        at: when,
        kind: 'escalation',
        actor,
        from: assigneeName(assignee),
        to: esc.to,
        note: `${route}: ${esc.reason}`,
      });
      const nextLevel = levelForAssignee(esc.to, level);
      if (nextLevel !== level) push({ at: when, kind: 'level', actor, from: level, to: nextLevel });
      assignee = esc.to;
      level = nextLevel;
      if (status === 'Abierto') setStatus('En progreso', when, actor);
    }
    if (spec.assignee && spec.assignee !== assignee) {
      const when = at(spec.respondAfter ?? 1);
      push({
        at: when,
        kind: 'assignee',
        actor: sd,
        from: assigneeName(assignee),
        to: assigneeName(spec.assignee),
      });
      assignee = spec.assignee;
      level = levelForAssignee(assignee, level);
    }

    const respondedAt = spec.respondAfter !== undefined ? at(spec.respondAfter) : undefined;
    if (respondedAt && spec.status !== 'Abierto') setStatus('En progreso', respondedAt, sd);
    const resolvedAt = spec.resolveAfter !== undefined ? at(spec.resolveAfter) : undefined;
    if (resolvedAt) setStatus('Resuelto', resolvedAt, holder());
    const closedAt = spec.closeAfter !== undefined ? at(spec.closeAfter) : undefined;
    if (closedAt) setStatus('Cerrado', closedAt, sd);

    const id = idByKey.get(spec.key) ?? formatTicketId(0);
    const linkedTicketIds = (spec.problem?.links ?? [])
      .map((k) => idByKey.get(k) ?? '')
      .filter(Boolean);
    if (spec.problem) {
      push({
        at: at(spec.respondAfter ?? 5),
        kind: 'problem',
        actor: holder(),
        note: `Registro de problema creado. Incidentes asociados: ${linkedTicketIds.join(', ')}.`,
      });
    }
    if (spec.knownError) {
      push({
        at: at((spec.respondAfter ?? 5) + 30),
        kind: 'known-error',
        actor: holder(),
        note: `Workaround: ${spec.knownError.workaround}`,
      });
    }
    if (spec.slaBreachCause) {
      push({ at: resolvedAt ?? at(1), kind: 'sla-cause', actor: sd, note: spec.slaBreachCause });
    }

    const comments: TicketComment[] = (spec.comments ?? []).map((c) => {
      const actor = actorFor(c.role, spec.requester);
      return {
        id: hid(),
        author: actor.name,
        role: c.role,
        text: c.text,
        createdAt: at(c.after),
        internal: c.internal ?? false,
      };
    });

    history.sort((a, b) => a.at.localeCompare(b.at));
    const events = [
      createdAt.toISOString(),
      ...history.map((h) => h.at),
      ...comments.map((c) => c.createdAt),
    ];
    const tags = [...spec.tags];
    if (spec.problem && !tags.includes('problema')) tags.push('problema');
    if (spec.knownError && !tags.includes('error conocido')) tags.push('error conocido');

    return {
      id,
      type: serviceById(spec.category).type,
      category: spec.category,
      title: spec.title,
      description: spec.description,
      tags,
      impact: spec.impact,
      urgency: spec.urgency,
      priority,
      status: spec.status,
      channel: spec.channel,
      requester: spec.requester,
      assignee,
      level,
      isProblem: Boolean(spec.problem),
      knownError: Boolean(spec.knownError),
      rootCause: spec.problem?.rootCause,
      workaround: spec.knownError?.workaround,
      linkedTicketIds,
      parentTicketId: spec.change ? idByKey.get(spec.change.parent) : undefined,
      changeType: spec.change?.type,
      slaBreachCause: spec.slaBreachCause,
      relatedStudioId:
        spec.studio ??
        (typeof spec.details.estudio === 'string' && spec.details.estudio !== '__nuevo__'
          ? spec.details.estudio
          : undefined),
      relatedGameSlug: spec.game,
      details: {
        ...spec.details,
        ...(spec.category === 'sitio-no-disponible' ? { desde: createdAt.toISOString() } : {}),
      },
      comments,
      history,
      createdAt: createdAt.toISOString(),
      updatedAt: events.sort().at(-1) ?? createdAt.toISOString(),
      respondedAt: spec.status === 'Abierto' ? undefined : respondedAt,
      resolvedAt,
      closedAt,
    };
  });

  // Traceability on the incidents grouped under each problem.
  for (const problem of tickets.filter((t) => t.isProblem)) {
    const when = problem.history.find((h) => h.kind === 'problem')?.at ?? problem.createdAt;
    for (const linked of tickets.filter((t) => problem.linkedTicketIds.includes(t.id))) {
      linked.history.push({
        id: hid(),
        at: when,
        kind: 'problem',
        actor:
          problem.history.find((h) => h.kind === 'problem')?.actor ??
          actorFor('resp-tecnico', linked.requester),
        note: `Asociado al problema ${problem.id}.`,
      });
      linked.history.sort((a, b) => a.at.localeCompare(b.at));
    }
  }
  return tickets;
}
