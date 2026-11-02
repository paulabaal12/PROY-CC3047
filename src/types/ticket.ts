export type TicketType = 'Incidente' | 'Solicitud';

export type CategoryId =
  // Solicitudes de servicio
  | 'registro'
  | 'actualizacion'
  | 'mantenimiento-bd'
  | 'extraccion'
  // Incidentes tipificados
  | 'sitio-no-disponible'
  | 'busqueda-lenta'
  | 'ficha-corrupta';

export type Impact = 'Alto' | 'Medio' | 'Bajo';
export type Urgency = 'Alta' | 'Media' | 'Baja';
export type Priority = 'Crítica' | 'Alta' | 'Media' | 'Baja' | 'Planificada';
export type Status = 'Abierto' | 'En progreso' | 'Resuelto' | 'Cerrado';
export type Channel = 'Formulario Kobo' | 'Portal/Correo' | 'Monitoreo UptimeRobot' | 'Mensajería';
export type SupportLevel = 'Nivel 1' | 'Nivel 2' | 'Nivel 3';
export type ChangeType = 'Cambio estándar' | 'Cambio normal';

export type RoleId = 'usuario' | 'service-desk' | 'resp-tecnico' | 'resp-contenido' | 'dueno';
export type InternalRoleId = Exclude<RoleId, 'usuario'>;
export type ProviderId = 'proveedor-github' | 'proveedor-kobo' | 'proveedor-uptimerobot';
/** Who holds the ticket: an internal role or a Level 3 provider. */
export type AssigneeId = InternalRoleId | ProviderId;

export type DetailValue = string | string[];
/** Category-specific fields, keyed by the field ids declared in config/categoryFields. */
export type TicketDetails = Record<string, DetailValue>;

export interface Person {
  name: string;
  email: string;
}

export interface Actor {
  role: RoleId;
  name: string;
}

export interface TicketComment {
  id: string;
  author: string;
  role: RoleId;
  text: string;
  createdAt: string;
  internal: boolean;
}

export type HistoryKind =
  | 'created'
  | 'status'
  | 'impact'
  | 'urgency'
  | 'priority'
  | 'assignee'
  | 'level'
  | 'tags'
  | 'escalation'
  | 'problem'
  | 'known-error'
  | 'change'
  | 'sla-cause';

export interface HistoryEntry {
  id: string;
  at: string;
  kind: HistoryKind;
  actor: Actor;
  from?: string;
  to?: string;
  note?: string;
}

export type EscalationRoute = 'funcional' | 'jerarquica';

export interface Ticket {
  id: string;
  type: TicketType;
  category: CategoryId;
  title: string;
  description: string;
  tags: string[];
  impact: Impact;
  urgency: Urgency;
  priority: Priority;
  status: Status;
  channel: Channel;
  requester: Person;
  assignee: AssigneeId;
  level: SupportLevel;
  isProblem: boolean;
  knownError: boolean;
  /** Problem record: root cause (hypothesis or confirmed). */
  rootCause?: string;
  /** Known error: documented workaround. */
  workaround?: string;
  /** Problem record: incidents grouped under it. */
  linkedTicketIds: string[];
  /** Change request: ticket that originated it. */
  parentTicketId?: string;
  changeType?: ChangeType;
  /** Recorded cause when the SLA was missed. */
  slaBreachCause?: string;
  relatedStudioId?: string;
  relatedGameSlug?: string;
  details: TicketDetails;
  comments: TicketComment[];
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface NewTicketInput {
  type: TicketType;
  category: CategoryId;
  title: string;
  description: string;
  tags?: string[];
  impact: Impact;
  urgency: Urgency;
  channel: Channel;
  requester: Person;
  relatedStudioId?: string;
  relatedGameSlug?: string;
  details: TicketDetails;
  parentTicketId?: string;
  changeType?: ChangeType;
}

/** Fields support staff can edit directly; each change is written to history. */
export interface TicketPatch {
  status?: Status;
  impact?: Impact;
  urgency?: Urgency;
  assignee?: AssigneeId;
  level?: SupportLevel;
  tags?: string[];
  slaBreachCause?: string;
}

export interface EscalationInput {
  route: EscalationRoute;
  to: AssigneeId;
  reason: string;
  note?: string;
}

export interface ProblemInput {
  rootCause: string;
  linkedTicketIds: string[];
}

export interface KnownErrorInput {
  rootCause: string;
  workaround: string;
}

export interface ChangeRequestInput {
  changeType: ChangeType;
  category: CategoryId;
  title: string;
  description: string;
}
