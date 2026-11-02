import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PersonAvatar, PriorityChip, SlaTimer } from '@/components';
import { assigneeShort } from '@/config/roles';
import { categoryName } from '@/config/services';
import type { RoleId, Ticket } from '@/types';
import clsx from '@/utils/clsx';
import { formatDate } from '@/utils/dates';
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
  const holder = assigneeShort(ticket.assignee);
  const holderRole: RoleId = ticket.assignee.startsWith('proveedor-')
    ? 'usuario'
    : (ticket.assignee as RoleId);
  return (
    <div className={clsx(styles.card, overlay && styles.overlay)}>
      <div className={styles.cardTop}>
        <span className={styles.cardId}>
          {ticket.priority === 'Crítica' && (
            <span className={styles.p1Dot} aria-label="P1" role="img" />
          )}
          {ticket.id}
        </span>
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
          <PriorityChip
            priority={ticket.priority}
            impact={ticket.impact}
            urgency={ticket.urgency}
          />
        </span>
      </div>
      <p className={styles.cardTitle} title={ticket.title}>
        {ticket.title}
      </p>
      <p className={styles.cardCategory}>{categoryName(ticket.category)}</p>
      <div className={styles.cardFooter}>
        <span className={styles.cardAssignee}>
          <PersonAvatar name={holder} role={holderRole} size={20} />
          <span>{holder}</span>
        </span>
        <div className={styles.cardSla}>
          {isActive(ticket.status) ? (
            <SlaTimer ticket={ticket} now={now} compact />
          ) : (
            <span className={styles.cardDone}>
              {ticket.status === 'Cerrado' ? 'Cerrado' : 'Resuelto'}
              {ticket.resolvedAt ? ` · ${formatDate(ticket.resolvedAt)}` : ''}
            </span>
          )}
        </div>
      </div>
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
