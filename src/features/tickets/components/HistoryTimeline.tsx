import { displayTicketId } from '@/utils/ticketIds';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import CallMadeIcon from '@mui/icons-material/CallMade';
import FiberNewOutlinedIcon from '@mui/icons-material/FiberNewOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import TimerOffOutlinedIcon from '@mui/icons-material/TimerOffOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { assigneeName, roleById } from '@/config/roles';
import type { AssigneeId, HistoryEntry, HistoryKind } from '@/types';
import { formatDateTime } from '@/utils/dates';
import styles from './HistoryTimeline.module.scss';

const ICONS: Record<HistoryKind, ReactNode> = {
  created: <FiberNewOutlinedIcon />,
  status: <SwapVertIcon />,
  impact: <TuneIcon />,
  urgency: <TuneIcon />,
  priority: <TuneIcon />,
  assignee: <PersonOutlineIcon />,
  level: <AccountTreeOutlinedIcon />,
  tags: <LocalOfferOutlinedIcon />,
  escalation: <CallMadeIcon />,
  problem: <BugReportOutlinedIcon />,
  'known-error': <BugReportOutlinedIcon />,
  change: <PublishedWithChangesIcon />,
  'sla-cause': <TimerOffOutlinedIcon />,
};

const LABELS: Record<HistoryKind, string> = {
  created: 'Ticket creado',
  status: 'Cambio de estado',
  impact: 'Cambio de impacto',
  urgency: 'Cambio de urgencia',
  priority: 'Prioridad recalculada',
  assignee: 'Reasignado',
  level: 'Cambio de nivel',
  tags: 'Tags actualizados',
  escalation: 'Escalamiento',
  problem: 'Gestión de problemas',
  'known-error': 'Error conocido',
  change: 'Solicitud de cambio',
  'sla-cause': 'Causa de incumplimiento registrada',
};

function Transition({ entry }: { entry: HistoryEntry }) {
  if (entry.kind === 'escalation') {
    return (
      <>
        {entry.from} → <strong>{assigneeName(entry.to as AssigneeId)}</strong>
      </>
    );
  }
  if (entry.kind === 'change' && entry.to) {
    return <RouterLink to={`/tickets/${entry.to}`}>Ver {displayTicketId(entry.to)}</RouterLink>;
  }
  if (!entry.from && !entry.to) return null;
  if (entry.kind === 'created') return null;
  return (
    <>
      {entry.from || '—'} → <strong>{entry.to || '—'}</strong>
    </>
  );
}

export function HistoryTimeline({ history }: { history: HistoryEntry[] }) {
  const entries = [...history].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <ol className={styles.timeline}>
      {entries.map((entry) => (
        <li key={entry.id} className={styles.entry} data-kind={entry.kind}>
          <span className={styles.dot} aria-hidden>
            {ICONS[entry.kind]}
          </span>
          <div className={styles.body}>
            <p className={styles.head}>
              <strong>{LABELS[entry.kind]}</strong> <Transition entry={entry} />
            </p>
            {entry.note && <p className={styles.note}>{entry.note}</p>}
            <p className={styles.meta}>
              {entry.actor.name} · {roleById(entry.actor.role).short} · {formatDateTime(entry.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
