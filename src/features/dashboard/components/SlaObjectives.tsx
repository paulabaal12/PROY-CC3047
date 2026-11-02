import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Alert } from '@mui/material';
import { HardCard } from '@/components';
import { SLA_OBJECTIVES, type SlaObjective } from '@/config/sla';
import type { ObjectiveResult } from '@/utils/slaCompliance';
import clsx from '@/utils/clsx';
import type { DashboardData } from '../hooks/useDashboardData';
import styles from './Dashboard.module.scss';

type Verdict = 'met' | 'missed' | 'na';

const verdict = (value: number | null, target: number): Verdict =>
  value === null ? 'na' : value >= target ? 'met' : 'missed';

function VerdictBadge({ v }: { v: Verdict }) {
  if (v === 'na')
    return (
      <span className={clsx(styles.verdict, styles.na)}>
        <HelpOutlineIcon /> Sin datos
      </span>
    );
  return v === 'met' ? (
    <span className={clsx(styles.verdict, styles.met)}>
      <CheckCircleOutlineIcon /> Cumple
    </span>
  ) : (
    <span className={clsx(styles.verdict, styles.missed)}>
      <ErrorOutlineIcon /> No cumple
    </span>
  );
}

function Meter({ label, value, target }: { label: string; value: number | null; target: number }) {
  return (
    <div className={styles.meter}>
      <div className={styles.meterHead}>
        <span>{label}</span>
        <strong>{value === null ? '—' : `${value}%`}</strong>
      </div>
      <div className={styles.meterTrack} aria-hidden>
        <div
          className={clsx(styles.meterFill, value !== null && value < target && styles.meterLow)}
          style={{ width: `${value ?? 0}%` }}
        />
        <span
          className={styles.meterTarget}
          style={{ left: `${target}%` }}
          title={`Meta ${target}%`}
        />
      </div>
    </div>
  );
}

function ObjectiveCard({
  objective,
  value,
  result,
}: {
  objective: SlaObjective;
  value: number | null;
  result?: ObjectiveResult;
}) {
  const v = verdict(value, objective.target.percent);
  return (
    <div className={styles.objective}>
      <div className={styles.objectiveHead}>
        <h3>{objective.name}</h3>
        <VerdictBadge v={v} />
      </div>
      <p className={styles.objectiveDesc}>{objective.description}</p>
      <Meter
        label={`SLA: ${objective.target.percent}% ${objective.target.withinLabel}`}
        value={value}
        target={objective.target.percent}
      />
      {objective.internal && result && (
        <Meter
          label={`Interno (OLA): ${objective.internal.percent}% ${objective.internal.withinLabel}`}
          value={result.internalPercent}
          target={objective.internal.percent}
        />
      )}
      {result && (
        <p className={styles.objectiveFoot}>
          {result.total === 0
            ? 'Todavía no hay casos resueltos para medir.'
            : `${result.withinTarget} de ${result.total} a tiempo · ${result.withinInternal} dentro de la meta interna.`}
        </p>
      )}
    </div>
  );
}

export function SlaObjectives({
  data,
  availability,
}: {
  data: DashboardData;
  availability: number;
}) {
  const [avail, p1, upd] = SLA_OBJECTIVES;
  return (
    <HardCard title="Objetivos del SLA (Fase 1)">
      <div className={styles.objectives}>
        {avail && <ObjectiveCard objective={avail} value={availability} />}
        {p1 && <ObjectiveCard objective={p1} value={data.p1.percent} result={data.p1} />}
        {upd && (
          <ObjectiveCard objective={upd} value={data.updates.percent} result={data.updates} />
        )}
      </div>
      <div className={styles.months}>
        <p className={styles.monthsTitle}>Objetivo P1 por mes (últimos 6)</p>
        <ol className={styles.monthStrip}>
          {data.months.map((m) => (
            <li
              key={m.key}
              className={clsx(
                m.total === 0 && styles.monthEmpty,
                m.breached && styles.monthBreached,
              )}
              title={m.total === 0 ? 'Sin P1 resueltos' : m.breached ? 'Incumplido' : 'Cumplido'}
            >
              <span>{m.label}</span>
              <strong>{m.total === 0 ? '—' : m.breached ? 'Incumplido' : 'Cumplido'}</strong>
            </li>
          ))}
        </ol>
        {data.recurrent ? (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            Incumplimiento recurrente (2 meses seguidos o 3 en 6): pasa al flujo de problema y se
            escala al Dueño del servicio.
          </Alert>
        ) : (
          <p className={styles.objectiveFoot}>
            Un incumplimiento aislado se registra con su causa; si se repite 2 meses seguidos o 3 en
            6 es recurrente y pasa a flujo de problema.
          </p>
        )}
      </div>
    </HardCard>
  );
}
