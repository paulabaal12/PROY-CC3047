import { Link as RouterLink } from 'react-router-dom';
import { PriorityChip, SlaTimer, StatusChip, TypeChip } from '@/components';
import { assigneeShort } from '@/config/roles';
import { categoryName } from '@/config/services';
import type { Ticket } from '@/types';
import { formatRelative } from '@/utils/dates';
import { isActive } from '@/utils/workflow';
import styles from './TicketListItem.module.scss';

export function TicketListItem({ ticket, now }: { ticket: Ticket; now: Date }) {
  return (
    <RouterLink to={`/tickets/${ticket.id}`} className={styles.item}>
      <div className={styles.main}>
        <div className={styles.meta}>
          <span className={styles.id}>{ticket.id}</span>
          <TypeChip type={ticket.type} />
          <span className={styles.category}>{categoryName(ticket.category)}</span>
        </div>
        <p className={styles.title}>{ticket.title}</p>
        <p className={styles.sub}>
          {ticket.requester.name} · {assigneeShort(ticket.assignee)} · actualizado{' '}
          {formatRelative(ticket.updatedAt, now)}
        </p>
      </div>
      <div className={styles.side}>
        <div className={styles.chips}>
          <PriorityChip priority={ticket.priority} impact={ticket.impact} urgency={ticket.urgency} />
          <StatusChip status={ticket.status} />
        </div>
        {isActive(ticket.status) && (
          <div className={styles.sla}>
            <SlaTimer ticket={ticket} now={now} compact />
          </div>
        )}
      </div>
    </RouterLink>
  );
}
