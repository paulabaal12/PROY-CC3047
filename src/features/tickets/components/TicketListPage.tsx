import AddIcon from '@mui/icons-material/Add';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Alert, Button, Stack, Tab, Tabs } from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { CardListSkeleton, EmptyState, PageHeader } from '@/components';
import { t } from '@/config/texts';
import { useRole } from '@/features/auth';
import { useNow, useTickets } from '@/hooks';
import { TicketListItem } from './TicketListItem';

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
    const list = isInternal && scope === 'mine' && !search ? data.filter((x) => x.assignee === role) : data;
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [data, isInternal, scope, search, role]);

  return (
    <>
      <PageHeader
        eyebrow={isInternal ? roleDef.name : 'Portal del usuario'}
        title={search ? `Resultados para “${search}”` : t.nav.myTickets}
        subtitle={
          isInternal
            ? 'Tickets asignados a tu rol. Cambiá a “Todos” para ver la cola completa.'
            : `Tickets registrados con ${roleDef.persona.email}.`
        }
        actions={
          <Button component={RouterLink} to="/tickets/new" variant="contained" startIcon={<AddIcon />}>
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
        <Button size="small" onClick={() => setParams({})} sx={{ mb: 2 }}>
          Quitar búsqueda
        </Button>
      )}

      {error && (
        <Alert severity="error" action={<Button onClick={reload}>{t.common.retry}</Button>}>
          {error}
        </Alert>
      )}
      {loading ? (
        <CardListSkeleton />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={search ? <SearchOffIcon fontSize="large" /> : <InboxOutlinedIcon fontSize="large" />}
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
        <Stack gap={1.5}>
          {tickets.map((ticket) => (
            <TicketListItem key={ticket.id} ticket={ticket} now={now} />
          ))}
        </Stack>
      )}
    </>
  );
}
