import AddIcon from '@mui/icons-material/Add';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Alert, Button, Tab, Tabs } from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  CardListSkeleton,
  DataTable,
  EmptyState,
  PageHeader,
  PriorityChip,
  SlaTimer,
  StatusChip,
  type Column,
} from '@/components';
import { assigneeShort } from '@/config/roles';
import { categoryName } from '@/config/services';
import { t } from '@/config/texts';
import { useRole } from '@/features/auth';
import { useNow, useTickets } from '@/hooks';
import type { Ticket } from '@/types';
import { formatRelative } from '@/utils/dates';
import { isActive } from '@/utils/workflow';
import styles from './TicketListPage.module.scss';

type Scope = 'mine' | 'all';

export function TicketListPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const { role, roleDef, isInternal } = useRole();
  const [scope, setScope] = useState<Scope>(search ? 'all' : 'mine');
  const now = useNow();
  const { data, loading, error, reload } = useTickets({
    requesterEmail: isInternal ? undefined : roleDef.persona.email,
    search: search || undefined,
  });

  const tickets = useMemo(() => {
    const list =
      isInternal && scope === 'mine' && !search ? data.filter((x) => x.assignee === role) : data;
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [data, isInternal, scope, search, role]);

  const columns: Column<Ticket>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '112px',
      render: (x) => <span className={styles.id}>{x.id}</span>,
    },
    {
      key: 'title',
      header: 'Ticket',
      render: (x) => (
        <div className={styles.titleCell}>
          <span className={styles.title}>{x.title}</span>
          <span className={styles.sub}>
            {x.type} · {categoryName(x.category)}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Prioridad',
      width: '140px',
      render: (x) => <PriorityChip priority={x.priority} />,
    },
    {
      key: 'status',
      header: 'Estado',
      width: '120px',
      hideBelow: 'sm',
      render: (x) => <StatusChip status={x.status} />,
    },
    {
      key: 'assignee',
      header: 'Responsable',
      width: '148px',
      hideBelow: 'lg',
      render: (x) => <span className={styles.muted}>{assigneeShort(x.assignee)}</span>,
    },
    {
      key: 'sla',
      header: 'SLA',
      width: '172px',
      hideBelow: 'md',
      render: (x) =>
        isActive(x.status) ? (
          <SlaTimer ticket={x} now={now} compact />
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    {
      key: 'updated',
      header: 'Actualizado',
      width: '140px',
      align: 'right',
      hideBelow: 'md',
      render: (x) => <span className={styles.muted}>{formatRelative(x.updatedAt, now)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Portal' }, { label: t.nav.myTickets }]}
        title={search ? `Resultados para “${search}”` : t.nav.myTickets}
        subtitle={
          isInternal
            ? `Tickets asignados a ${roleDef.name}. Cambia a “Todos” para ver la cola completa.`
            : `Tickets registrados con ${roleDef.persona.email}.`
        }
        actions={
          <Button
            component={RouterLink}
            to="/tickets/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            {t.nav.newTicket}
          </Button>
        }
      />

      {isInternal && !search && (
        <Tabs value={scope} onChange={(_, v: Scope) => setScope(v)} sx={{ mb: 2 }}>
          <Tab value="mine" label="Asignados a mí" />
          <Tab value="all" label="Todos" />
        </Tabs>
      )}
      {search && (
        <Button variant="outlined" onClick={() => setParams({})} sx={{ mb: 2 }}>
          Quitar búsqueda
        </Button>
      )}

      {error && (
        <Alert severity="error" action={<Button onClick={reload}>{t.common.retry}</Button>}>
          {error}
        </Alert>
      )}
      {loading ? (
        <CardListSkeleton count={6} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={search ? <SearchOffIcon /> : <InboxOutlinedIcon />}
          title={search ? t.empty.noResults : t.empty.noTickets}
          description={search ? t.empty.noResultsHint : t.empty.noTicketsHint}
          action={
            !search && (
              <Button component={RouterLink} to="/tickets/new" variant="contained">
                {t.nav.newTicket}
              </Button>
            )
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={tickets}
          getKey={(x) => x.id}
          getHref={(x) => `/tickets/${x.id}`}
          caption={t.nav.myTickets}
        />
      )}
    </>
  );
}
