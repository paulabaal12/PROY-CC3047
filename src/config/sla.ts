/** Service window (Fase 1): Monday to Friday, 08:00–17:00, Guatemala time (UTC-6, no DST). */
export const SERVICE_WINDOW = {
  utcOffsetMinutes: -6 * 60,
  /** 1 = Monday … 5 = Friday (ISO weekday). */
  workDays: [1, 2, 3, 4, 5],
  startMinute: 8 * 60,
  endMinute: 17 * 60,
  label: 'Lunes a viernes, 8:00 a 17:00 (hora de Guatemala, UTC-6)',
} as const;

/** Minutes in one business day (full window). */
export const BUSINESS_DAY_MINUTES = SERVICE_WINDOW.endMinute - SERVICE_WINDOW.startMinute;

/** Guatemalan public holidays (YYYY-MM-DD, local date). The SLA clock does not run on them. */
export const HOLIDAYS: string[] = [
  '2026-01-01',
  '2026-04-02',
  '2026-04-03',
  '2026-05-01',
  '2026-06-30',
  '2026-09-15',
  '2026-10-20',
  '2026-11-01',
  '2026-12-25',
  '2027-01-01',
];

/** Share of the target left below which the timer turns yellow. */
export const SLA_WARNING_RATIO = 0.25;

export interface SlaObjective {
  id: 'disponibilidad' | 'restauracion-p1' | 'actualizacion';
  name: string;
  description: string;
  /** External SLA commitment. */
  target: { percent: number; withinLabel: string };
  /** Internal OLA target (stricter). */
  internal?: { percent: number; withinLabel: string };
}

export const SLA_OBJECTIVES: SlaObjective[] = [
  {
    id: 'disponibilidad',
    name: 'Disponibilidad del sitio',
    description:
      'Disponibilidad mensual de centralamerica.games medida por UptimeRobot (sondeo cada 5 min). Se registra aquí como dato de referencia.',
    target: { percent: 99, withinLabel: 'mensual' },
  },
  {
    id: 'restauracion-p1',
    name: 'Restauración de incidentes P1',
    description: 'Incidentes de prioridad Crítica restaurados dentro del tiempo comprometido.',
    target: { percent: 90, withinLabel: '≤ 90 min' },
    internal: { percent: 95, withinLabel: '≤ 75 min' },
  },
  {
    id: 'actualizacion',
    name: 'Solicitudes de actualización',
    description: 'Solicitudes de actualización o retiro de fichas resueltas a tiempo.',
    target: { percent: 90, withinLabel: '≤ 3 días hábiles' },
    internal: { percent: 95, withinLabel: '≤ 2 días hábiles' },
  },
];

/** Minute thresholds for the objectives above (business minutes). */
export const P1_RESTORE_MINUTES = 90;
export const P1_RESTORE_INTERNAL_MINUTES = 75;
export const UPDATE_REQUEST_DAYS = 3;
export const UPDATE_REQUEST_INTERNAL_DAYS = 2;

/** Default availability reference (editable in Configuración). */
export const DEFAULT_AVAILABILITY = 99.62;

/** P1 chain (OLA): how the 90 minutes are split between teams. */
export const P1_CHAIN: { step: string; owner: string; minutes: number }[] = [
  { step: 'Registro, clasificación y escalamiento', owner: 'Service Desk (Nivel 1)', minutes: 10 },
  { step: 'Diagnóstico y corrección', owner: 'Responsable técnico (Nivel 2)', minutes: 45 },
  { step: 'Despliegue y validación', owner: 'Responsable técnico + GitHub Pages', minutes: 20 },
  { step: 'Holgura', owner: '—', minutes: 15 },
];

/** Recurrent breach rule: 2 consecutive months, or 3 within the last 6 → problem workflow. */
export const RECURRENCE_RULE = {
  consecutiveMonths: 2,
  windowMonths: 6,
  breachesInWindow: 3,
  label:
    'Un incumplimiento aislado se registra con su causa. Si se repite 2 meses seguidos o 3 veces en 6 meses es recurrente y pasa al flujo de problema.',
};
