import AddIcon from '@mui/icons-material/Add';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Panel, PriorityChip } from '@/components';
import { serviceById } from '@/config/services';
import type { Ticket } from '@/types';
import { formatBusinessMinutes } from '@/utils/businessHours';
import { formatDateTime } from '@/utils/dates';
import { getSlaTargets } from '@/utils/priority';
import { getTicketSla } from '@/utils/sla';
import styles from './Confirmation.module.scss';

export function Confirmation({ ticket, onAnother }: { ticket: Ticket; onAnother: () => void }) {
  const targets = getSlaTargets(ticket.impact, ticket.urgency);
  const sla = getTicketSla(ticket, new Date(ticket.createdAt));
  return (
    <div className={styles.wrap}>
      <Panel className={styles.card}>
        <div className={styles.badge} aria-hidden>
          <CheckRoundedIcon fontSize="large" />
        </div>
        <p className={styles.eyebrow}>Ticket registrado</p>
        <h1 className={styles.id}>{ticket.id}</h1>
        <p className={styles.title}>{ticket.title}</p>
        <dl className={styles.facts}>
          <div>
            <dt>Servicio</dt>
            <dd>{serviceById(ticket.category).shortName}</dd>
          </div>
          <div>
            <dt>Prioridad</dt>
            <dd>
              <PriorityChip priority={ticket.priority} />
            </dd>
          </div>
          <div>
            <dt>Respuesta antes de</dt>
            <dd>
              {formatDateTime(sla.response.deadline)}
              <small> ({formatBusinessMinutes(targets.responseMinutes)} hábiles)</small>
            </dd>
          </div>
          <div>
            <dt>Resolución antes de</dt>
            <dd>
              {formatDateTime(sla.resolution.deadline)}
              <small> ({formatBusinessMinutes(targets.resolutionMinutes)} hábiles)</small>
            </dd>
          </div>
        </dl>
        <p className={styles.note}>
          Guarda este número para dar seguimiento. Service Desk revisará la clasificación y te
          responderá a <strong>{ticket.requester.email}</strong>.
        </p>
        <div className={styles.actions}>
          <Button
            variant="contained"
            component={RouterLink}
            to={`/tickets/${ticket.id}`}
            startIcon={<VisibilityOutlinedIcon />}
          >
            Ver ticket
          </Button>
          <Button variant="outlined" onClick={onAnother} startIcon={<AddIcon />}>
            Registrar otro
          </Button>
        </div>
      </Panel>
    </div>
  );
}
