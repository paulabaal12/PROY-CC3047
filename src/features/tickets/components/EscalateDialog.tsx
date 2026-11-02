import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { ESCALATION_ROUTES } from '@/config/escalation';
import { assigneeName } from '@/config/roles';
import { useRole } from '@/features/auth';
import { useToast } from '@/hooks';
import { ticketService } from '@/services';
import type { AssigneeId, EscalationRoute, Ticket } from '@/types';
import type { EscalationHint } from '@/utils/escalationHints';

interface Props {
  ticket: Ticket;
  open: boolean;
  onClose: () => void;
  hint?: EscalationHint;
}

/** Escalating = reassigning, with the route and reason written to history. */
export function EscalateDialog({ ticket, open, onClose, hint }: Props) {
  const { actor } = useRole();
  const notify = useToast();
  const [route, setRoute] = useState<EscalationRoute>(hint?.route ?? 'funcional');
  const routeDef = ESCALATION_ROUTES.find((r) => r.route === route) ?? ESCALATION_ROUTES[0]!;
  const targets = routeDef.targets.filter((tg) => tg.to !== ticket.assignee);
  const [to, setTo] = useState<AssigneeId | ''>(hint?.to ?? '');
  const target = targets.find((tg) => tg.to === to);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeRoute = (r: EscalationRoute) => {
    setRoute(r);
    setTo(r === 'jerarquica' ? 'dueno' : '');
    setReason('');
  };

  const submit = async () => {
    if (!to || !reason) {
      setError('Elige a quién se escala y el motivo.');
      return;
    }
    setSaving(true);
    try {
      await ticketService.escalate(
        ticket.id,
        { route, to, reason, note: note.trim() || undefined },
        actor,
      );
      notify(`Escalado a ${assigneeName(to)}`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo escalar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Escalar {ticket.id}</DialogTitle>
      <DialogContent>
        <Stack gap={2}>
          <Tabs
            value={route}
            onChange={(_, v: EscalationRoute) => changeRoute(v)}
            variant="fullWidth"
          >
            {ESCALATION_ROUTES.map((r) => (
              <Tab key={r.route} value={r.route} label={r.name} />
            ))}
          </Tabs>
          <Alert severity="info" variant="outlined">
            {routeDef.description} Actualmente lo tiene:{' '}
            <strong>{assigneeName(ticket.assignee)}</strong>.
          </Alert>
          {hint && hint.route === route && <Alert severity="warning">{hint.reason}</Alert>}
          <TextField
            select
            label="Escalar a"
            value={to}
            onChange={(e) => {
              setTo(e.target.value as AssigneeId);
              setReason('');
            }}
          >
            {targets.map((tg) => (
              <MenuItem key={tg.to} value={tg.to}>
                {tg.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Motivo (criterio de la Fase 1)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={!target}
          >
            {target?.reasons.map((r) => (
              <MenuItem key={r} value={r} sx={{ whiteSpace: 'normal' }}>
                {r}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Nota para quien recibe (opcional)"
            multiline
            minRows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => void submit()} disabled={saving}>
          Escalar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
