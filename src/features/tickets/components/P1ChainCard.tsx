import { Chip } from '@mui/material';
import { PRIORITY_COLORS, toneSx } from '@/app/theme';
import { Panel } from '@/components';
import { P1_CHAIN, RECURRENCE_RULE } from '@/config/sla';
import styles from './P1ChainCard.module.scss';

const TOTAL = P1_CHAIN.reduce((sum, s) => sum + s.minutes, 0);
// Blue ramp; the slack segment stays light.
const COLORS = ['#182C61', '#2F5597', '#4F86C6', '#B5D5EE'];

/** OLA reference shown on Critical tickets: how the 90 minutes are split. */
export function P1ChainCard({ elapsed }: { elapsed: number }) {
  const marker = Math.min(100, (elapsed / TOTAL) * 100);
  return (
    <Panel
      title="Cadena del P1"
      subtitle="OLA de 90 minutos repartida entre equipos"
      action={<Chip size="small" label="P1" sx={toneSx(PRIORITY_COLORS.Crítica)} />}
    >
      <div
        className={styles.bar}
        role="img"
        aria-label={`Transcurridos ${Math.round(elapsed)} de ${TOTAL} minutos`}
      >
        {P1_CHAIN.map((s, i) => (
          <span
            key={s.step}
            className={styles.segment}
            style={{ flexGrow: s.minutes, background: COLORS[i] }}
            title={`${s.step}: ${s.minutes} min`}
          >
            {s.minutes}′
          </span>
        ))}
        <span className={styles.marker} style={{ left: `${marker}%` }} aria-hidden />
      </div>
      <ol className={styles.steps}>
        {P1_CHAIN.map((s, i) => (
          <li key={s.step}>
            <span className={styles.swatch} style={{ background: COLORS[i] }} aria-hidden />
            <strong>{s.minutes} min</strong>
            <span>{s.step}</span>
            <em>{s.owner}</em>
          </li>
        ))}
      </ol>
      <p className={styles.elapsed}>
        Transcurrido: <strong>{Math.round(elapsed)} min hábiles</strong> de {TOTAL}.
      </p>
      <p className={styles.rule}>{RECURRENCE_RULE.label}</p>
    </Panel>
  );
}
