import { displayTicketId } from '@/utils/ticketIds';
import { TicketId } from '@/components/TicketId';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import { Chip, Tab, Tabs } from '@mui/material';
import { useMemo, useState } from 'react';
import { NEUTRAL_TONE, toneSx } from '@/app/theme';
import { Link as RouterLink } from 'react-router-dom';
import {
  CardListSkeleton,
  EmptyState,
  Panel,
  PageHeader,
  PriorityChip,
  StatusChip,
} from '@/components';
import { assigneeName } from '@/config/roles';
import { categoryName } from '@/config/services';
import { useTickets } from '@/hooks';
import type { Ticket } from '@/types';
import { formatDate } from '@/utils/dates';
import styles from './Problems.module.scss';

type Filter = 'all' | 'problems' | 'known';

function ProblemCard({ problem, all }: { problem: Ticket; all: Ticket[] }) {
  const incidents = all.filter((t) => problem.linkedTicketIds.includes(t.id));
  const changes = all.filter((t) => t.parentTicketId === problem.id);
  return (
    <Panel className={styles.card} as="article">
      <div className={styles.top}>
        <TicketId id={problem.id} className={styles.id} />
        <div className={styles.chips}>
          <Chip
            size="small"
            label={problem.knownError ? 'Error conocido' : 'Problema'}
            sx={toneSx(NEUTRAL_TONE)}
          />
          <PriorityChip priority={problem.priority} />
          <StatusChip status={problem.status} />
        </div>
      </div>
      <h3 className={styles.title}>
        <RouterLink to={`/tickets/${problem.id}`}>{problem.title}</RouterLink>
      </h3>
      <p className={styles.meta}>
        {categoryName(problem.category)} · {assigneeName(problem.assignee)} · desde{' '}
        {formatDate(problem.createdAt)}
      </p>
      {problem.rootCause && (
        <p className={styles.block}>
          <span>Causa raíz</span>
          {problem.rootCause}
        </p>
      )}
      <div className={problem.workaround ? styles.workaround : styles.noWorkaround}>
        <span>Workaround</span>
        {problem.workaround ?? 'Sin workaround documentado todavía.'}
      </div>
      <div className={styles.block}>
        <span>Incidentes asociados ({incidents.length})</span>
        {incidents.length === 0 ? (
          <em>Ninguno</em>
        ) : (
          <ul className={styles.rows}>
            {incidents.map((i) => (
              <li key={i.id}>
                <RouterLink to={`/tickets/${i.id}`}>{displayTicketId(i.id)}</RouterLink>
                <span>{i.title}</span>
                <em>{i.status}</em>
              </li>
            ))}
          </ul>
        )}
      </div>
      {changes.length > 0 && (
        <div className={styles.block}>
          <span>Cambios para la solución definitiva</span>
          <ul className={styles.rows}>
            {changes.map((c) => (
              <li key={c.id}>
                <RouterLink to={`/tickets/${c.id}`}>{displayTicketId(c.id)}</RouterLink>
                <span>{c.changeType}</span>
                <em>{c.status}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

export function ProblemsPage() {
  const { data, loading } = useTickets();
  const [filter, setFilter] = useState<Filter>('all');
  const problems = useMemo(
    () =>
      data
        .filter((t) => t.isProblem || t.knownError)
        .filter((t) => filter === 'all' || (filter === 'known' ? t.knownError : !t.knownError))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [data, filter],
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Soporte' }, { label: 'Problemas' }]}
        title="Problemas y errores conocidos"
        subtitle="Causas raíz que agrupan incidentes repetidos, con su workaround para Nivel 1."
      />
      <Tabs value={filter} onChange={(_, v: Filter) => setFilter(v)} sx={{ mb: 2 }}>
        <Tab value="all" label="Todos" />
        <Tab value="problems" label="Problemas abiertos" />
        <Tab value="known" label="Errores conocidos" />
      </Tabs>
      {loading ? (
        <CardListSkeleton count={2} />
      ) : problems.length === 0 ? (
        <EmptyState
          icon={<BugReportOutlinedIcon />}
          title="No hay problemas registrados"
          description="Desde el detalle de un incidente, usa “Crear problema” cuando se repite o se desconoce su causa."
        />
      ) : (
        <div className={styles.grid}>
          {problems.map((p) => (
            <ProblemCard key={p.id} problem={p} all={data} />
          ))}
        </div>
      )}
    </>
  );
}
