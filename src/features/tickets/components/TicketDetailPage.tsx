import { displayTicketId } from '@/utils/ticketIds';
import { TicketId } from '@/components/TicketId';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Alert, Button, Chip, MenuItem, TextField } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { NEUTRAL_TONE, PRIORITY_COLORS, toneSx } from '@/app/theme';
import {
  EmptyState,
  PageHeader,
  Panel,
  PageSkeleton,
  PriorityChip,
  SlaTimer,
  StatusChip,
  TypeChip,
} from '@/components';
import { assigneeName } from '@/config/roles';
import { serviceById } from '@/config/services';
import { t } from '@/config/texts';
import { useRole } from '@/features/auth';
import { useNow, useTicket, useTickets } from '@/hooks';
import { businessMinutesBetween } from '@/utils/businessHours';
import { formatDateTime } from '@/utils/dates';
import { getEscalationHints } from '@/utils/escalationHints';
import { isSlaBreached } from '@/utils/sla';
import { canTransition, STATUSES } from '@/utils/workflow';
import { ticketService } from '@/services';
import { useToast } from '@/hooks';
import type { Status, Ticket } from '@/types';
import { CommentsSection } from './CommentsSection';
import { DetailsList } from './DetailsList';
import { HistoryTimeline } from './HistoryTimeline';
import { P1ChainCard } from './P1ChainCard';
import { SupportPanel } from './SupportPanel';
import styles from './TicketDetailPage.module.scss';

export function TicketDetailPage() {
  const { id } = useParams();
  const { isInternal, roleDef } = useRole();
  const now = useNow(15_000);
  const { data: ticket, loading, error } = useTicket(id);
  const { data: all } = useTickets();

  if (loading) return <PageSkeleton />;
  if (error) return <Alert severity="error">{error}</Alert>;
  // Users only see their own tickets.
  if (!ticket || (!isInternal && ticket.requester.email !== roleDef.persona.email)) {
    return (
      <EmptyState
        icon={<SearchOffIcon fontSize="large" />}
        title={t.empty.notFound}
        description={!ticket ? `No existe ${id}.` : 'Este ticket pertenece a otro solicitante.'}
        action={
          <Button component={RouterLink} to="/tickets" variant="contained">
            {t.nav.myTickets}
          </Button>
        }
      />
    );
  }

  const service = serviceById(ticket.category);
  const breached = isSlaBreached(ticket, now);
  const hints = isInternal ? getEscalationHints(ticket, now) : [];
  const elapsed = businessMinutesBetween(
    new Date(ticket.createdAt),
    new Date(ticket.resolvedAt ?? now),
  );
  const linked = all.filter((x) => ticket.linkedTicketIds.includes(x.id));
  const problems = all.filter((x) => x.isProblem && x.linkedTicketIds.includes(ticket.id));
  const changes = all.filter((x) => x.parentTicketId === ticket.id);

  return (
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={
          isInternal
            ? [{ label: t.nav.board, to: '/board' }, { label: displayTicketId(ticket.id) }]
            : [{ label: t.nav.myTickets, to: '/tickets' }, { label: displayTicketId(ticket.id) }]
        }
        title={ticket.title}
        subtitle={`${service.name} · registrado ${formatDateTime(ticket.createdAt)} por ${ticket.channel}`}
        meta={
          <>
            <TicketId id={ticket.id} className={styles.id} />
            <TypeChip type={ticket.type} />
            <StatusChip status={ticket.status} />
            <PriorityChip
              priority={ticket.priority}
              impact={ticket.impact}
              urgency={ticket.urgency}
            />
            {ticket.priority === 'Crítica' && ticket.type === 'Incidente' && (
              <Chip size="small" label="P1" sx={toneSx(PRIORITY_COLORS.Crítica)} />
            )}
            {ticket.isProblem && <Chip size="small" label="Problema" sx={toneSx(NEUTRAL_TONE)} />}
            {ticket.knownError && (
              <Chip size="small" label="Error conocido" sx={toneSx(NEUTRAL_TONE)} />
            )}
            {ticket.changeType && (
              <Chip size="small" label={ticket.changeType} sx={toneSx(NEUTRAL_TONE)} />
            )}
          </>
        }
        actions={isInternal ? <StatusControl ticket={ticket} /> : undefined}
      />

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          {ticket.priority === 'Crítica' && ticket.type === 'Incidente' && (
            <P1ChainCard elapsed={elapsed} />
          )}

          <Panel title="Descripción">
            <p className={styles.description}>{ticket.description}</p>
            <DetailsList ticket={ticket} />
          </Panel>

          {(ticket.isProblem || ticket.knownError) && (
            <Panel title={ticket.knownError ? 'Error conocido' : 'Registro de problema'}>
              {ticket.rootCause && (
                <p className={styles.para}>
                  <span className={styles.label}>Causa raíz</span>
                  {ticket.rootCause}
                </p>
              )}
              <div className={ticket.workaround ? styles.workaround : styles.noWorkaround}>
                <span className={styles.label}>Workaround</span>
                {ticket.workaround ?? 'Sin workaround documentado todavía.'}
              </div>
              <p className={styles.label}>Incidentes asociados</p>
              <LinkList tickets={linked} empty="Sin incidentes asociados." />
            </Panel>
          )}

          {(problems.length > 0 || changes.length > 0 || ticket.parentTicketId) && (
            <Panel title="Trazabilidad">
              {problems.length > 0 && (
                <>
                  <p className={styles.label}>Asociado al problema</p>
                  <LinkList tickets={problems} />
                  {problems.find((p) => p.workaround) && (
                    <div className={styles.workaround}>
                      <span className={styles.label}>Workaround disponible</span>
                      {problems.find((p) => p.workaround)?.workaround}
                    </div>
                  )}
                </>
              )}
              {ticket.parentTicketId && (
                <p className={styles.para}>
                  Solicitud de cambio generada desde{' '}
                  <RouterLink to={`/tickets/${ticket.parentTicketId}`}>
                    {ticket.parentTicketId}
                  </RouterLink>
                  .
                </p>
              )}
              {changes.length > 0 && (
                <>
                  <p className={styles.label}>Solicitudes de cambio generadas</p>
                  <LinkList tickets={changes} />
                </>
              )}
            </Panel>
          )}

          <Panel
            title={`Comentarios (${ticket.comments.filter((c) => isInternal || !c.internal).length})`}
          >
            <CommentsSection ticket={ticket} />
          </Panel>

          <Panel title="Historial">
            <HistoryTimeline history={ticket.history} />
          </Panel>
        </div>

        <aside className={styles.sideCol}>
          <Panel title="SLA">
            <SlaTimer ticket={ticket} now={now} />
            {ticket.slaBreachCause && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Causa registrada:</strong> {ticket.slaBreachCause}
              </Alert>
            )}
          </Panel>

          <Panel title="Información">
            <dl className={styles.info}>
              <Info
                label={t.fields.requester}
                value={`${ticket.requester.name} · ${ticket.requester.email}`}
              />
              <Info label={t.fields.channel} value={ticket.channel} />
              <Info label={t.fields.assignee} value={assigneeName(ticket.assignee)} />
              <Info label={t.fields.level} value={ticket.level} />
              <Info label={t.fields.impact} value={ticket.impact} />
              <Info label={t.fields.urgency} value={ticket.urgency} />
              <Info label={t.fields.createdAt} value={formatDateTime(ticket.createdAt)} />
              <Info
                label={t.fields.respondedAt}
                value={ticket.respondedAt ? formatDateTime(ticket.respondedAt) : '—'}
              />
              <Info
                label={t.fields.resolvedAt}
                value={ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : '—'}
              />
            </dl>
            {ticket.tags.length > 0 && (
              <div className={styles.tags}>
                {ticket.tags.map((tag) => (
                  <Chip key={tag} size="small" label={tag} sx={toneSx(NEUTRAL_TONE)} />
                ))}
              </div>
            )}
          </Panel>

          {isInternal && <SupportPanel ticket={ticket} breached={breached} hints={hints} />}
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function LinkList({
  tickets,
  empty,
}: {
  tickets: { id: string; title: string; status: string }[];
  empty?: string;
}) {
  if (tickets.length === 0) return empty ? <p className={styles.muted}>{empty}</p> : null;
  return (
    <ul className={styles.links}>
      {tickets.map((x) => (
        <li key={x.id}>
          <RouterLink to={`/tickets/${x.id}`}>{displayTicketId(x.id)}</RouterLink>
          <span className={styles.linkTitle}>{x.title}</span>
          <em>{x.status}</em>
        </li>
      ))}
    </ul>
  );
}

/** Status as the page's main action (same transition rules as the board). */
function StatusControl({ ticket }: { ticket: Ticket }) {
  const { actor } = useRole();
  const notify = useToast();
  const [saving, setSaving] = useState(false);
  const change = async (to: Status) => {
    setSaving(true);
    try {
      await ticketService.update(ticket.id, { status: to }, actor);
      notify(`${displayTicketId(ticket.id)} → ${to}`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo cambiar el estado', 'error');
    } finally {
      setSaving(false);
    }
  };
  return (
    <TextField
      select
      value={ticket.status}
      onChange={(e) => void change(e.target.value as Status)}
      disabled={saving || ticket.status === 'Cerrado'}
      className={styles.statusControl}
      slotProps={{ htmlInput: { 'aria-label': 'Estado del ticket' } }}
    >
      {STATUSES.map((st) => (
        <MenuItem key={st} value={st} disabled={!canTransition(ticket.status, st)}>
          {st}
        </MenuItem>
      ))}
    </TextField>
  );
}
