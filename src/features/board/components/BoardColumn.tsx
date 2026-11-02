import { useDroppable } from '@dnd-kit/core';
import { Tooltip } from '@mui/material';
import type { Status, Ticket } from '@/types';
import clsx from '@/utils/clsx';
import { BoardCard } from './BoardCard';
import styles from './Board.module.scss';

interface Props {
  status: Status;
  tickets: Ticket[];
  now: Date;
  /** Whether the card being dragged may be dropped here. */
  dropAllowed: boolean | null;
}

const HINT: Record<Status, string> = {
  Abierto: 'Registrado, pendiente de atender',
  'En progreso': 'Alguien lo está trabajando',
  Resuelto: 'Solución aplicada, por confirmar',
  Cerrado: 'Confirmado y cerrado',
};

export function BoardColumn({ status, tickets, now, dropAllowed }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={clsx(
        styles.column,
        isOver && dropAllowed && styles.over,
        isOver && dropAllowed === false && styles.denied,
      )}
      data-status={status}
      aria-label={`${status}: ${tickets.length} tickets`}
    >
      <header className={styles.columnHead}>
        <Tooltip title={HINT[status]} placement="top-start">
          <h2>
            <span className={styles.statusDot} aria-hidden />
            {status}
          </h2>
        </Tooltip>
        <span className={styles.count}>{tickets.length}</span>
      </header>
      <div className={styles.cards}>
        {tickets.length === 0 ? (
          <p className={styles.columnEmpty}>Sin tickets</p>
        ) : (
          tickets.map((t) => <BoardCard key={t.id} ticket={t} now={now} />)
        )}
      </div>
    </section>
  );
}
