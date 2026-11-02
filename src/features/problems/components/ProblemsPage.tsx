import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import { Alert, Chip, Tab, Tabs } from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  CardListSkeleton,
  EmptyState,
  HardCard,
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
    <HardCard className={styles.card} tone={problem.knownError ? 'default' : 'danger'} as="article">
      <div className={styles.top}>
        <RouterLink to={`/tickets/${problem.id}`} className={styles.id}>
          {problem.id}
        </RouterLink>
        <div className={styles.chips}>
          {problem.knownError ? (
            <Chip
              size="small"
              label="Error conocido"
              sx={{ bgcolor: '#F4A261', color: '#0A1A2E', fontWeight: 800 }}
            />
          ) : (
            <Chip size="small" color="error" label="Problema" />
          )}
          <PriorityChip priority={problem.priority} />
          <StatusChip status={problem.status} />
        </div>
      </div>
      <h3 className={styles.title}>{problem.title}</h3>
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
      {problem.workaround ? (
        <Alert severity="success" variant="outlined">
          <strong>Workaround:</strong> {problem.workaround}
        </Alert>
      ) : (
        <Alert severity="warning" variant="outlined">
          Sin workaround documentado todavía.
        </Alert>
      )}
      <div className={styles.block}>
        <span>Incidentes asociados ({incidents.length})</span>
        {incidents.length === 0 ? (
          <em>Ninguno</em>
        ) : (
          <ul>
            {incidents.map((i) => (
              <li key={i.id}>
                <RouterLink to={`/tickets/${i.id}`}>{i.id}</RouterLink> {i.title} ·{' '}
                <em>{i.status}</em>
              </li>
            ))}
          </ul>
        )}
      </div>
      {changes.length > 0 && (
        <div className={styles.block}>
          <span>Cambios para la solución definitiva</span>
          <ul>
            {changes.map((c) => (
              <li key={c.id}>
                <RouterLink to={`/tickets/${c.id}`}>{c.id}</RouterLink> {c.changeType} ·{' '}
                <em>{c.status}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </HardCard>
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
        eyebrow="Gestión de problemas"
        title="Problemas y errores conocidos"
        subtitle="Causas raíz que agrupan incidentes repetidos, con su workaround para que Nivel 1 responda rápido."
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
          icon={<BugReportOutlinedIcon fontSize="large" />}
          title="No hay problemas registrados"
          description="Desde el detalle de un incidente, usá “Crear problema” cuando se repite o se desconoce su causa."
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
