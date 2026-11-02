import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Alert, Button, Tab, Tabs } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { CardListSkeleton, PageHeader } from '@/components';
import { useRole } from '@/features/auth';
import { useNow, useTickets, useToast } from '@/hooks';
import { ticketService } from '@/services';
import type { Status, Ticket, TicketType } from '@/types';
import { isSlaBreached } from '@/utils/sla';
import { canTransition, isActive, STATUSES, transitionError } from '@/utils/workflow';
import { useBoardFilters } from '../hooks/useBoardFilters';
import { markDragEnd } from '../dragState';
import { BoardCardContent } from './BoardCard';
import { BoardColumn } from './BoardColumn';
import { BoardFiltersBar } from './BoardFiltersBar';
import styles from './Board.module.scss';

function P1Banner({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) return null;
  const many = tickets.length > 1;
  return (
    <div className={styles.p1Banner} role="alert">
      <span className={styles.p1Icon} aria-hidden>
        <ReportProblemOutlinedIcon fontSize="small" />
      </span>
      <div className={styles.p1Text}>
        <strong>
          {tickets.length} incidente{many ? 's' : ''} crítico{many ? 's' : ''} (P1) abierto
          {many ? 's' : ''}
        </strong>
        <span>
          Objetivo: restaurar en 90 min o menos (meta interna: 75). Aparecen primero en su columna.
        </span>
      </div>
      <div className={styles.p1Links}>
        {tickets.map((t) => (
          <RouterLink key={t.id} to={`/tickets/${t.id}`} className={styles.p1Link}>
            {t.id}
          </RouterLink>
        ))}
      </div>
    </div>
  );
}

export function BoardPage() {
  const { actor } = useRole();
  const notify = useToast();
  const now = useNow();
  const { data, loading, error, reload } = useTickets();
  const [type, setType] = useState<TicketType>('Incidente');
  const { filters, setFilters, columns, total, active } = useBoardFilters(data, type);
  const [dragging, setDragging] = useState<Ticket | null>(null);
  // Optimistic status while the service call is in flight.
  const [pending, setPending] = useState<Record<string, Status>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const p1Open = useMemo(
    () =>
      data.filter((t) => t.type === 'Incidente' && t.priority === 'Crítica' && isActive(t.status)),
    [data],
  );
  const counts = useMemo(
    () => ({
      Incidente: data.filter((t) => t.type === 'Incidente' && isActive(t.status)).length,
      Solicitud: data.filter((t) => t.type === 'Solicitud' && isActive(t.status)).length,
    }),
    [data],
  );

  const breachedActive = useMemo(
    () => data.filter((t) => isActive(t.status) && isSlaBreached(t, now)).length,
    [data, now],
  );

  const view = useMemo(() => {
    if (Object.keys(pending).length === 0) return columns;
    const moved = Object.fromEntries(STATUSES.map((s) => [s, [] as Ticket[]])) as Record<
      Status,
      Ticket[]
    >;
    for (const s of STATUSES)
      for (const t of columns[s])
        moved[pending[t.id] ?? s].push({ ...t, status: pending[t.id] ?? s });
    return moved;
  }, [columns, pending]);

  // Drop optimistic entries once the reloaded data reflects them.
  useEffect(() => {
    setPending((p) => {
      const left = Object.entries(p).filter(
        ([id, st]) => data.find((t) => t.id === id)?.status !== st,
      );
      return left.length === Object.keys(p).length ? p : Object.fromEntries(left);
    });
  }, [data]);

  const onDragStart = (e: DragStartEvent) =>
    setDragging(data.find((t) => t.id === e.active.id) ?? null);

  const onDragEnd = async (e: DragEndEvent) => {
    markDragEnd();
    setDragging(null);
    const ticket = data.find((t) => t.id === e.active.id);
    const to = e.over?.id as Status | undefined;
    if (!ticket || !to || to === ticket.status) return;
    const err = transitionError(ticket.status, to);
    if (err) {
      notify(err, 'warning');
      return;
    }
    setPending((p) => ({ ...p, [ticket.id]: to }));
    try {
      await ticketService.update(ticket.id, { status: to }, actor, 'Movido en el tablero.');
      notify(`${ticket.id} → ${to}`);
    } catch (ex) {
      notify(ex instanceof Error ? ex.message : 'No se pudo mover', 'error');
      setPending(({ [ticket.id]: _failed, ...rest }) => rest);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Service Desk"
        title="Tablero"
        subtitle="Dos colas separadas. Arrastra las tarjetas para cambiar su estado; dentro de cada columna se ordenan por prioridad y antigüedad."
        stats={[
          { label: 'activos', value: counts.Incidente + counts.Solicitud },
          {
            label: 'P1 abiertos',
            value: p1Open.length,
            tone: p1Open.length ? 'danger' : 'default',
          },
          {
            label: 'con SLA vencido',
            value: breachedActive,
            tone: breachedActive ? 'danger' : 'default',
          },
        ]}
      />
      <P1Banner tickets={p1Open} />

      <Tabs
        value={type}
        onChange={(_, v: TicketType) => setType(v)}
        sx={{ mb: 3 }}
        aria-label="Colas"
      >
        <Tab value="Incidente" label={`Incidentes · ${counts.Incidente}`} />
        <Tab value="Solicitud" label={`Solicitudes · ${counts.Solicitud}`} />
      </Tabs>

      <BoardFiltersBar type={type} filters={filters} onChange={setFilters} active={active} />

      {error && (
        <Alert severity="error" action={<Button onClick={reload}>Reintentar</Button>}>
          {error}
        </Alert>
      )}
      {loading ? (
        <div className={styles.board}>
          {STATUSES.map((s) => (
            <div key={s} className={styles.column}>
              <CardListSkeleton count={3} height={150} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {active && (
            <p className={styles.resultCount}>{total} tickets coinciden con los filtros.</p>
          )}
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={(e) => void onDragEnd(e)}
            onDragCancel={() => setDragging(null)}
          >
            <div className={styles.board}>
              {STATUSES.map((s) => (
                <BoardColumn
                  key={s}
                  status={s}
                  tickets={view[s]}
                  now={now}
                  dropAllowed={dragging ? canTransition(dragging.status, s) : null}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
              {dragging && <BoardCardContent ticket={dragging} now={now} overlay />}
            </DragOverlay>
          </DndContext>
        </>
      )}
    </>
  );
}
