import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PriorityChip, SlaTimer } from '@/components';
import { assigneeShort } from '@/config/roles';
import { categoryName } from '@/config/services';
import type { Ticket } from '@/types';
import clsx from '@/utils/clsx';
import { getEscalationHints } from '@/utils/escalationHints';
import { isActive } from '@/utils/workflow';
import { justDragged } from '../dragState';
import styles from './Board.module.scss';

interface Props {
  ticket: Ticket;
  now: Date;
  overlay?: boolean;
}

export function BoardCardContent({ ticket, now, overlay }: Props) {
  const hints = getEscalationHints(ticket, now);
  return (
    <div className={clsx(styles.card, ticket.priority === 'Crítica' && styles.critical, overlay && styles.overlay)}>
      <div className={styles.cardTop}>
        <span className={styles.cardId}>{ticket.id}</span>
        <span className={styles.cardIcons}>
          {(ticket.isProblem || ticket.knownError) && (
            <Tooltip title={ticket.knownError ? 'Error conocido' : 'Problema'}>
              <BugReportOutlinedIcon className={styles.problemIcon} />
            </Tooltip>
          )}
          {hints.length > 0 && (
            <Tooltip title={hints.map((h) => h.reason).join(' ')}>
              <PriorityHighIcon className={styles.hintIcon} aria-label="Escalamiento sugerido" />
            </Tooltip>
          )}
          <PriorityChip priority={ticket.priority} impact={ticket.impact} urgency={ticket.urgency} />
        </span>
      </div>
      <p className={styles.cardTitle}>{ticket.title}</p>
      <p className={styles.cardMeta}>
        {categoryName(ticket.category)} · <strong>{assigneeShort(ticket.assignee)}</strong>
      </p>
      {isActive(ticket.status) && <SlaTimer ticket={ticket} now={now} compact />}
    </div>
  );
}

export function BoardCard({ ticket, now }: Props) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { status: ticket.status },
    disabled: ticket.status === 'Cerrado',
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={clsx(styles.draggable, isDragging && styles.dragging)}
      {...listeners}
      {...attributes}
      aria-roledescription="Tarjeta arrastrable"
      aria-label={`${ticket.id} ${ticket.title}. Prioridad ${ticket.priority}. Enter para abrir.`}
      onClick={() => !justDragged() && navigate(`/tickets/${ticket.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/tickets/${ticket.id}`);
        else listeners?.onKeyDown?.(e);
      }}
    >
      <BoardCardContent ticket={ticket} now={now} />
    </div>
  );
}
