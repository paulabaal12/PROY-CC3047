import type { CategoryId, Impact, TicketType, Urgency } from '@/types';
import { COUNTRIES, GAME_STATUS_LABELS, PLATFORMS } from './catalogReference';

/**
 * Field kinds supported by the dynamic form. `studio` and `game` render selects fed by
 * the real catalog; `file` keeps only the file name (no upload in this phase).
 */
export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'url'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'studio'
  | 'game'
  | 'file';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  id: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: FieldOption[];
  helper?: string;
  placeholder?: string;
  /** studio select: allow "Nuevo estudio (no está en el catálogo)". */
  allowNew?: boolean;
  /** Only show the field when another field has one of these values. */
  showIf?: { field: string; in: string[] };
}

export interface ServiceDef {
  id: CategoryId;
  type: TicketType;
  name: string;
  shortName: string;
  /** Why ITIL classifies it as a request or an incident (Fase 1). */
  justification: string;
  /** Who requests or reports it (Fase 1). */
  requestedBy: string;
  /** Who usually handles it after Service Desk. */
  handledBy: string;
  examples: string[];
  defaultImpact: Impact;
  defaultUrgency: Urgency;
  fields: FieldDef[];
}

const opts = (values: string[]): FieldOption[] => values.map((v) => ({ value: v, label: v }));

export const NEW_STUDIO = '__nuevo__';

const countryOptions = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const statusOptions = Object.entries(GAME_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const SERVICES: ServiceDef[] = [
  {
    id: 'registro',
    type: 'Solicitud',
    name: 'Registro de un nuevo videojuego o estudio',
    shortName: 'Registro de ficha',
    justification:
      'Es una petición planificada para agregar contenido: nada está roto. Sigue un flujo estándar y repetible (formulario de Kobo → validación de criterios → YAML en content/ → build).',
    requestedBy:
      'Estudios de la región (formulario de alta o de juegos adicionales en KoboToolbox).',
    handledBy: 'Responsable de contenido (valida criterios) y Service Desk (publica).',
    examples: [
      'Alta de un estudio nuevo con su juego destacado',
      'Juego adicional de un estudio ya listado',
    ],
    defaultImpact: 'Bajo',
    defaultUrgency: 'Baja',
    fields: [
      {
        id: 'registroDe',
        label: '¿Qué se registra?',
        kind: 'select',
        required: true,
        options: opts(['Estudio nuevo', 'Videojuego de un estudio existente']),
      },
      { id: 'nombre', label: 'Nombre del estudio o videojuego', kind: 'text', required: true },
      {
        id: 'estudio',
        label: 'Estudio',
        kind: 'studio',
        required: true,
        allowNew: true,
        helper: 'Elegí uno del catálogo o "Nuevo estudio".',
      },
      { id: 'pais', label: 'País', kind: 'select', required: true, options: countryOptions },
      {
        id: 'fundacion',
        label: 'Año de fundación',
        kind: 'number',
        required: true,
        placeholder: 'p. ej. 2019',
      },
      { id: 'destacado', label: 'Videojuego destacado', kind: 'text', required: true },
      {
        id: 'plataformas',
        label: 'Plataformas',
        kind: 'multiselect',
        required: true,
        options: opts(PLATFORMS),
      },
      {
        id: 'genero',
        label: 'Género',
        kind: 'text',
        required: true,
        placeholder: 'p. ej. Metroidvania',
      },
      {
        id: 'enlace',
        label: 'Enlace (tienda o sitio oficial)',
        kind: 'url',
        required: true,
        placeholder: 'https://',
      },
      {
        id: 'imagen',
        label: 'Imagen (logo, banner o capsule)',
        kind: 'file',
        required: true,
        helper: 'Adjuntá el archivo o pegá un enlace. Solo se guarda el nombre.',
      },
    ],
  },
  {
    id: 'actualizacion',
    type: 'Solicitud',
    name: 'Actualización o retiro de una ficha',
    shortName: 'Actualización / retiro',
    justification:
      'El servicio funciona: el estudio pide cambiar o retirar información propia. Es un cambio de contenido previsto, con fuente verificable, no una interrupción.',
    requestedBy:
      'Estudios listados (o su representante) y el equipo del catálogo al detectar datos desactualizados.',
    handledBy: 'Responsable de contenido; un retiro en disputa escala al Dueño del servicio.',
    examples: ['Corregir las plataformas de un juego', 'Retirar un juego cancelado'],
    defaultImpact: 'Bajo',
    defaultUrgency: 'Baja',
    fields: [
      { id: 'estudio', label: 'Estudio afectado', kind: 'studio', required: true },
      { id: 'juego', label: 'Juego afectado (si aplica)', kind: 'game' },
      {
        id: 'accion',
        label: 'Acción',
        kind: 'select',
        required: true,
        options: opts(['Corregir', 'Completar', 'Retirar']),
      },
      {
        id: 'campo',
        label: '¿Qué campo cambia?',
        kind: 'text',
        required: true,
        placeholder: 'p. ej. plataformas, descripción, enlace',
      },
      {
        id: 'fuente',
        label: 'Fuente de la información',
        kind: 'text',
        required: true,
        helper: 'El propio estudio o un enlace verificable.',
      },
    ],
  },
  {
    id: 'mantenimiento-bd',
    type: 'Solicitud',
    name: 'Mantenimiento y actualización de la base de datos del catálogo',
    shortName: 'Mantenimiento de BD',
    justification:
      'Trabajo programado sobre los YAML de content/ (depuración, normalización, nuevos campos). Se planifica y no responde a una falla.',
    requestedBy:
      'Dueño del servicio y equipo del catálogo (también surge de un problema o de un cambio).',
    handledBy: 'Responsable técnico y Responsable de contenido.',
    examples: ['Normalizar nombres de plataformas', 'Agregar un campo nuevo a game.yaml'],
    defaultImpact: 'Bajo',
    defaultUrgency: 'Baja',
    fields: [
      {
        id: 'alcance',
        label: 'Alcance (cantidad aproximada de registros)',
        kind: 'number',
        required: true,
      },
      { id: 'motivo', label: 'Motivo', kind: 'textarea', required: true },
    ],
  },
  {
    id: 'extraccion',
    type: 'Solicitud',
    name: 'Extracción de datos del catálogo (CSV/Excel)',
    shortName: 'Extracción de datos',
    justification:
      'Es un pedido de información a partir de datos que ya existen y funcionan. No hay degradación del servicio; se atiende según calendario.',
    requestedBy: 'UVG, AECID, investigadores, prensa y estudios (informes o publicaciones).',
    handledBy: 'Service Desk (Nivel 1) con apoyo técnico si el filtro es complejo.',
    examples: ['CSV de estudios de Guatemala', 'Excel de juegos publicados para un informe'],
    defaultImpact: 'Bajo',
    defaultUrgency: 'Baja',
    fields: [
      {
        id: 'formato',
        label: 'Formato',
        kind: 'select',
        required: true,
        options: opts(['CSV', 'Excel']),
      },
      { id: 'filtroPais', label: 'Filtro: país', kind: 'multiselect', options: countryOptions },
      {
        id: 'filtroEstado',
        label: 'Filtro: estado del juego',
        kind: 'multiselect',
        options: statusOptions,
      },
      {
        id: 'motivo',
        label: 'Motivo',
        kind: 'select',
        required: true,
        options: opts(['Informe', 'Publicación']),
      },
    ],
  },
  {
    id: 'sitio-no-disponible',
    type: 'Incidente',
    name: 'Sitio no disponible',
    shortName: 'Sitio no disponible',
    justification:
      'Interrupción no planificada del servicio: centralamerica.games no carga (GitHub Pages, DNS o HTTPS). Hay que restaurarlo cuanto antes.',
    requestedBy: 'Monitoreo UptimeRobot (cada 5 min) y cualquier usuario del catálogo.',
    handledBy: 'Responsable técnico (Nivel 2) y, si es la plataforma, GitHub Pages (Nivel 3).',
    examples: ['Error 404 en todo el dominio', 'Certificado HTTPS vencido'],
    defaultImpact: 'Alto',
    defaultUrgency: 'Alta',
    fields: [
      {
        id: 'url',
        label: 'URL afectada',
        kind: 'url',
        required: true,
        placeholder: 'https://centralamerica.games/es/',
      },
      { id: 'desde', label: '¿Desde cuándo?', kind: 'datetime', required: true },
      { id: 'error', label: 'Mensaje de error visto', kind: 'textarea', required: true },
    ],
  },
  {
    id: 'busqueda-lenta',
    type: 'Incidente',
    name: 'Búsqueda, filtros o carga lentos o fallando',
    shortName: 'Búsqueda / filtros',
    justification:
      'Degradación no planificada de una función clave: la búsqueda y los filtros corren en el navegador y dejan de responder o tardan, aunque el sitio esté arriba.',
    requestedBy: 'Usuarios del catálogo (portal, correo o mensajería).',
    handledBy: 'Responsable técnico (Nivel 2).',
    examples: [
      'El filtro por país no devuelve resultados',
      'La vista de juegos tarda más de 10 s en móvil',
    ],
    defaultImpact: 'Medio',
    defaultUrgency: 'Media',
    fields: [
      {
        id: 'funcion',
        label: '¿Qué filtro o búsqueda?',
        kind: 'text',
        required: true,
        placeholder: 'p. ej. filtro por tecnología',
      },
      {
        id: 'dispositivo',
        label: 'Dispositivo',
        kind: 'select',
        required: true,
        options: opts(['Escritorio', 'Laptop', 'Tablet', 'Teléfono']),
      },
      {
        id: 'navegador',
        label: 'Navegador',
        kind: 'select',
        required: true,
        options: opts(['Chrome', 'Firefox', 'Safari', 'Edge', 'Otro']),
      },
    ],
  },
  {
    id: 'ficha-corrupta',
    type: 'Incidente',
    name: 'Ficha con datos corruptos o imágenes que no cargan',
    shortName: 'Ficha corrupta / imagen',
    justification:
      'Algo que debería funcionar dejó de hacerlo en una ficha publicada (texto roto, imagen 404). Es una falla, no un pedido de cambio de contenido.',
    requestedBy: 'Usuarios, estudios afectados o el equipo tras la Action semanal update-steam.',
    handledBy: 'Responsable técnico (restaurar datos/imágenes) con validación de contenido.',
    examples: ['La capsule de un juego no carga', 'Caracteres extraños en la descripción'],
    defaultImpact: 'Bajo',
    defaultUrgency: 'Baja',
    fields: [
      { id: 'estudio', label: 'Estudio afectado', kind: 'studio', required: true },
      { id: 'juego', label: 'Juego afectado', kind: 'game' },
      {
        id: 'campo',
        label: 'Campo afectado',
        kind: 'select',
        required: true,
        options: opts([
          'Logo',
          'Banner',
          'Capsule',
          'Capturas (ss1, ss2…)',
          'Descripción',
          'Plataformas',
          'Enlace',
          'Datos de Steam',
          'Otro',
        ]),
      },
    ],
  },
];

export const serviceById = (id: CategoryId): ServiceDef => {
  const svc = SERVICES.find((s) => s.id === id);
  if (!svc) throw new Error(`Unknown category ${id}`);
  return svc;
};

export const servicesOfType = (type: TicketType): ServiceDef[] =>
  SERVICES.filter((s) => s.type === type);

export const categoryName = (id: CategoryId): string => serviceById(id).shortName;
