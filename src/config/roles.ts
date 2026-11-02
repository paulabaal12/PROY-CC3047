import type {
  AssigneeId,
  Channel,
  InternalRoleId,
  Person,
  ProviderId,
  RoleId,
  SupportLevel,
} from '@/types';

export interface RoleDef {
  id: RoleId;
  name: string;
  short: string;
  level?: SupportLevel;
  description: string;
  permissions: string[];
  /** Simulated person for the demo (fictitious). */
  persona: Person;
}

export const ROLES: RoleDef[] = [
  {
    id: 'usuario',
    name: 'Usuario',
    short: 'Usuario',
    description: 'Estudio, investigador o visitante del catálogo.',
    permissions: ['Crea tickets', 'Ve sus tickets', 'Comenta (sin notas internas)'],
    persona: { name: 'Lucía Méndez', email: 'lucia.mendez@example.com' },
  },
  {
    id: 'service-desk',
    name: 'Service Desk (Nivel 1)',
    short: 'Service Desk',
    level: 'Nivel 1',
    description: 'Punto único de contacto: registra, clasifica, prioriza y da seguimiento.',
    permissions: ['Registra y clasifica', 'Prioriza', 'Comenta y cambia estado', 'Escala'],
    persona: { name: 'Andrea Solís', email: 'andrea.solis@example.com' },
  },
  {
    id: 'resp-tecnico',
    name: 'Responsable técnico (Nivel 2)',
    short: 'Resp. técnico',
    level: 'Nivel 2',
    description: 'Incidentes, publicación en GitHub Pages, build y restauración de datos.',
    permissions: [
      'Diagnostica y corrige',
      'Despliega',
      'Restaura datos e imágenes',
      'Escala a Nivel 3',
    ],
    persona: { name: 'Diego Castillo', email: 'diego.castillo@example.com' },
  },
  {
    id: 'resp-contenido',
    name: 'Responsable de contenido (Nivel 2)',
    short: 'Resp. contenido',
    level: 'Nivel 2',
    description: 'Valida los criterios de inclusión de fichas y la calidad de los datos.',
    permissions: ['Valida criterios de inclusión', 'Aprueba altas y retiros', 'Corrige contenido'],
    persona: { name: 'Mariela Ruiz', email: 'mariela.ruiz@example.com' },
  },
  {
    id: 'dueno',
    name: 'Dueño del servicio',
    short: 'Dueño',
    description: 'Responde por el servicio; recibe los escalamientos jerárquicos.',
    permissions: ['Ve todo', 'Decide presupuesto y disputas', 'Aprueba cambios normales'],
    persona: { name: 'Roberto Aguilar', email: 'roberto.aguilar@example.com' },
  },
];

export const INTERNAL_ROLES: InternalRoleId[] = [
  'service-desk',
  'resp-tecnico',
  'resp-contenido',
  'dueno',
];

export const isInternalRole = (role: RoleId): role is InternalRoleId => role !== 'usuario';

export const roleById = (id: RoleId): RoleDef => {
  const role = ROLES.find((r) => r.id === id);
  if (!role) throw new Error(`Unknown role ${id}`);
  return role;
};

export interface ProviderDef {
  id: ProviderId;
  name: string;
  scope: string;
}

/** Level 3: external providers. */
export const PROVIDERS: ProviderDef[] = [
  {
    id: 'proveedor-github',
    name: 'GitHub Pages',
    scope: 'Hosting, dominio, HTTPS y GitHub Actions',
  },
  {
    id: 'proveedor-kobo',
    name: 'KoboToolbox',
    scope: 'Formularios de alta y de juegos adicionales',
  },
  { id: 'proveedor-uptimerobot', name: 'UptimeRobot', scope: 'Monitoreo cada 5 min y alertas' },
];

export const assigneeName = (id: AssigneeId): string => {
  const provider = PROVIDERS.find((p) => p.id === id);
  if (provider) return `${provider.name} (Nivel 3)`;
  return roleById(id as RoleId).name;
};

export const assigneeShort = (id: AssigneeId): string => {
  const provider = PROVIDERS.find((p) => p.id === id);
  if (provider) return provider.name;
  return roleById(id as RoleId).short;
};

export const ASSIGNEES: AssigneeId[] = [...INTERNAL_ROLES, ...PROVIDERS.map((p) => p.id)];

/** Support level implied by the holder of the ticket. */
export const levelForAssignee = (id: AssigneeId, current: SupportLevel): SupportLevel => {
  if (id === 'service-desk') return 'Nivel 1';
  if (id === 'resp-tecnico' || id === 'resp-contenido') return 'Nivel 2';
  if (id.startsWith('proveedor-')) return 'Nivel 3';
  return current; // Dueño: hierarchical, keeps the technical level.
};

export const LEVELS: SupportLevel[] = ['Nivel 1', 'Nivel 2', 'Nivel 3'];

export interface ChannelDef {
  id: Channel;
  description: string;
}

export const CHANNELS: ChannelDef[] = [
  { id: 'Formulario Kobo', description: 'Altas y juegos adicionales enviados por los estudios.' },
  { id: 'Portal/Correo', description: 'Este portal o el correo del catálogo.' },
  { id: 'Monitoreo UptimeRobot', description: 'Alertas automáticas de caída (cada 5 min).' },
  { id: 'Mensajería', description: 'WhatsApp o mensajes directos de la comunidad.' },
];
