import type { AssigneeId, EscalationRoute } from '@/types';

export interface EscalationTarget {
  to: AssigneeId;
  label: string;
  reasons: string[];
}

export interface EscalationRouteDef {
  route: EscalationRoute;
  name: string;
  description: string;
  targets: EscalationTarget[];
}

/** Escalation = reassigning the ticket. Both routes always write to history. */
export const ESCALATION_ROUTES: EscalationRouteDef[] = [
  {
    route: 'funcional',
    name: 'Funcional (conocimiento)',
    description: 'Se pasa a quien sabe resolverlo: Nivel 2 o el proveedor (Nivel 3).',
    targets: [
      {
        to: 'resp-tecnico',
        label: 'Responsable técnico (Nivel 2)',
        reasons: [
          'Incidente Crítico que Nivel 1 no resolvió en ≤ 10 min',
          'Incidente Alto que Nivel 1 no resolvió en ≤ 30 min',
          'Datos corruptos o imágenes a restaurar',
          'Requiere cambio en el build, el script de validación o el despliegue',
        ],
      },
      {
        to: 'resp-contenido',
        label: 'Responsable de contenido (Nivel 2)',
        reasons: [
          'Validar criterios de inclusión de una ficha',
          'Verificar la fuente de una actualización',
        ],
      },
      {
        to: 'proveedor-github',
        label: 'GitHub Pages (Nivel 3)',
        reasons: [
          'Caída o degradación de GitHub Pages / Actions',
          'Problema de dominio o certificado HTTPS',
        ],
      },
      {
        to: 'proveedor-kobo',
        label: 'KoboToolbox (Nivel 3)',
        reasons: ['El formulario no recibe envíos', 'Exportación de envíos fallando'],
      },
      {
        to: 'proveedor-uptimerobot',
        label: 'UptimeRobot (Nivel 3)',
        reasons: ['Falsos positivos del monitor', 'El monitor no alertó una caída'],
      },
    ],
  },
  {
    route: 'jerarquica',
    name: 'Jerárquica (autoridad)',
    description: 'Se informa y se pasa la decisión al Dueño del servicio.',
    targets: [
      {
        to: 'dueno',
        label: 'Dueño del servicio',
        reasons: [
          'P1 que se proyecta a más de 90 min',
          'La solución exige presupuesto o afecta la partida de AECID',
          'Disputa por el retiro de una ficha',
          'Incumplimiento recurrente del SLA',
        ],
      },
    ],
  },
];

/** Level 1 time limits (business minutes) before a functional escalation is due. */
export const L1_ESCALATION_LIMIT: Partial<Record<string, number>> = {
  Crítica: 10,
  Alta: 30,
};

/** A P1 elapsed beyond this many minutes is projected past 90 min → hierarchical escalation. */
export const P1_HIERARCHICAL_THRESHOLD = 75;
