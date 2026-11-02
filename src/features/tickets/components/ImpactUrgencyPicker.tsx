import { Alert } from '@mui/material';
import { IMPACT_CRITERIA, IMPACTS, URGENCIES, URGENCY_CRITERIA } from '@/config/priorityMatrix';
import type { ServiceDef } from '@/config/services';
import type { Impact, Urgency } from '@/types';
import { ChoiceCard } from './ChoiceCard';
import styles from './FormSteps.module.scss';

interface Props {
  service?: ServiceDef;
  impact: Impact;
  urgency: Urgency;
  onImpact: (impact: Impact) => void;
  onUrgency: (urgency: Urgency) => void;
}

export function ImpactUrgencyPicker({ service, impact, urgency, onImpact, onUrgency }: Props) {
  const changed = service && (service.defaultImpact !== impact || service.defaultUrgency !== urgency);
  return (
    <div className={styles.stack}>
      {service && (
        <Alert severity={changed ? 'warning' : 'info'} variant="outlined">
          Sugerido para <strong>{service.shortName}</strong>: impacto {service.defaultImpact} y urgencia{' '}
          {service.defaultUrgency}.{' '}
          {changed ? 'Lo cambiaste: Service Desk lo revisará al clasificar.' : 'Podés ajustarlo según los criterios.'}
        </Alert>
      )}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Impacto: ¿a cuánto del servicio afecta?</legend>
        <div className={styles.grid3}>
          {IMPACTS.map((level) => (
            <ChoiceCard
              key={level}
              name="impact"
              value={level}
              selected={impact === level}
              onSelect={() => onImpact(level)}
              title={level}
              description={IMPACT_CRITERIA[level]}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Urgencia: ¿qué tan rápido se necesita?</legend>
        <div className={styles.grid3}>
          {URGENCIES.map((level) => (
            <ChoiceCard
              key={level}
              name="urgency"
              value={level}
              selected={urgency === level}
              onSelect={() => onUrgency(level)}
              title={level}
              description={URGENCY_CRITERIA[level]}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
