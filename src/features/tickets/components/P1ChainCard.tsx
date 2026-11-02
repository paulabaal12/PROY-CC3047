import { Panel } from '@/components';
import { P1_CHAIN, RECURRENCE_RULE } from '@/config/sla';
import styles from './P1ChainCard.module.scss';

const TOTAL = P1_CHAIN.reduce((sum, s) => sum + s.minutes, 0);
const COLORS = ['#38BDF8', '#2563EB', '#1D4ED8', '#E2E8F0'];

/** OLA reference shown on Critical tickets: how the 90 minutes are split. */
export function P1ChainCard({ elapsed }: { elapsed: number }) {
  const marker = Math.min(100, (elapsed / TOTAL) * 100);
  return (
    <Panel title="Cadena del P1 (OLA · 90 min)" tone="danger">
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
            <strong>{s.minutes} min</strong> {s.step} <em>· {s.owner}</em>
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
