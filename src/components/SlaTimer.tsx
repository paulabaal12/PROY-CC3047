import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import { Tooltip } from '@mui/material';
import clsx from '@/utils/clsx';
import { t } from '@/config/texts';
import type { Ticket } from '@/types';
import { formatBusinessMinutes } from '@/utils/businessHours';
import { formatDateTime } from '@/utils/dates';
import { getTicketSla, type SlaClock } from '@/utils/sla';
import styles from './SlaTimer.module.scss';

const STATE_CLASS: Record<SlaClock['state'], string> = {
  ok: styles.ok ?? '',
  warning: styles.warning ?? '',
  breached: styles.breached ?? '',
  met: styles.met ?? '',
  missed: styles.breached ?? '',
};

function describe(clock: SlaClock): string {
  switch (clock.state) {
    case 'met':
      return `${t.sla.met} (${formatBusinessMinutes(clock.elapsedMinutes)})`;
    case 'missed':
      return `${t.sla.missed} (+${formatBusinessMinutes(-clock.remainingMinutes)})`;
    case 'breached':
      return `${t.sla.overdue} ${formatBusinessMinutes(-clock.remainingMinutes)}`;
    default:
      return `${formatBusinessMinutes(clock.remainingMinutes)} ${t.sla.remaining}`;
  }
}

function Clock({ label, clock, paused }: { label: string; clock: SlaClock; paused: boolean }) {
  const percent = Math.min(100, (clock.elapsedMinutes / clock.targetMinutes) * 100);
  const running = !clock.stopped;
  return (
    <Tooltip
      title={`Meta ${formatBusinessMinutes(clock.targetMinutes)} hábiles · vence ${formatDateTime(clock.deadline)}${running && paused ? ` · ${t.sla.paused}` : ''}`}
    >
      <div className={clsx(styles.clock, STATE_CLASS[clock.state])} role="status">
        <div className={styles.row}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>
            {running && paused && <PauseCircleOutlineIcon className={styles.pause} aria-label={t.sla.paused} />}
            {describe(clock)}
          </span>
        </div>
        <div className={styles.track} aria-hidden>
          <div className={styles.bar} style={{ width: `${percent}%` }} />
        </div>
      </div>
    </Tooltip>
  );
}

interface Props {
  ticket: Ticket;
  now: Date;
  compact?: boolean;
}

/** Response and resolution clocks: green, yellow (< 25% left) and red (overdue). */
export function SlaTimer({ ticket, now, compact = false }: Props) {
  const sla = getTicketSla(ticket, now);
  if (compact) {
    // Cards show the clock that matters right now.
    const clock = sla.response.stopped ? sla.resolution : sla.response;
    const label = sla.response.stopped ? t.sla.resolution : t.sla.response;
    return <Clock label={label} clock={clock} paused={sla.paused} />;
  }
  return (
    <div className={styles.stack}>
      <Clock label={t.sla.response} clock={sla.response} paused={sla.paused} />
      <Clock label={t.sla.resolution} clock={sla.resolution} paused={sla.paused} />
    </div>
  );
}
