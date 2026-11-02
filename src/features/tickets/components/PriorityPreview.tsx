import { PriorityChip } from '@/components';
import { SERVICE_WINDOW } from '@/config/sla';
import type { Impact, Urgency } from '@/types';
import { formatBusinessMinutes } from '@/utils/businessHours';
import { calculatePriority, getSlaTargets } from '@/utils/priority';
import styles from './PriorityPreview.module.scss';

/** Priority and SLA targets derived from impact × urgency, shown before submitting. */
export function PriorityPreview({ impact, urgency }: { impact: Impact; urgency: Urgency }) {
  const priority = calculatePriority(impact, urgency);
  const targets = getSlaTargets(impact, urgency);
  return (
    <div className={styles.preview} aria-live="polite">
      <p className={styles.eyebrow}>Vista previa</p>
      <div className={styles.priority}>
        <span>Prioridad</span>
        <PriorityChip priority={priority} size="medium" />
      </div>
      <p className={styles.formula}>
        Impacto <strong>{impact}</strong> × Urgencia <strong>{urgency}</strong>
      </p>
      <dl className={styles.targets}>
        <div>
          <dt>Respuesta</dt>
          <dd>{formatBusinessMinutes(targets.responseMinutes)}</dd>
        </div>
        <div>
          <dt>Resolución</dt>
          <dd>{formatBusinessMinutes(targets.resolutionMinutes)}</dd>
        </div>
      </dl>
      <p className={styles.note}>
        <em>{targets.label}.</em> Tiempos hábiles: {SERVICE_WINDOW.label}.
      </p>
    </div>
  );
}
