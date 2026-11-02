import { displayTicketId } from '@/utils/ticketIds';
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { servicesOfType } from '@/config/services';
import { useRole } from '@/features/auth';
import { useTickets, useToast } from '@/hooks';
import { ticketService } from '@/services';
import type { CategoryId, ChangeType, Ticket } from '@/types';

interface DialogProps {
  ticket: Ticket;
  open: boolean;
  onClose: () => void;
}

function useSubmit(onClose: () => void) {
  const notify = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>, message: string) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
      notify(message);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };
  return { saving, error, setError, run };
}

/** Problem record: root cause investigation that groups related incidents. */
export function ProblemDialog({ ticket, open, onClose }: DialogProps) {
  const { actor } = useRole();
  const { data } = useTickets({ type: 'Incidente' });
  const [rootCause, setRootCause] = useState(ticket.rootCause ?? '');
  const [linked, setLinked] = useState<string[]>(ticket.linkedTicketIds);
  const { saving, error, setError, run } = useSubmit(onClose);
  const options = useMemo(() => data.filter((x) => x.id !== ticket.id), [data, ticket.id]);

  const submit = () => {
    if (rootCause.trim().length < 10)
      return setError('Describe la causa raíz (o la hipótesis) en al menos 10 caracteres.');
    void run(
      () => ticketService.createProblem(ticket.id, { rootCause, linkedTicketIds: linked }, actor),
      `Problema registrado en ${displayTicketId(ticket.id)}`,
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Crear problema</DialogTitle>
      <DialogContent>
        <Stack gap={2}>
          <DialogContentText>
            Un problema es la causa desconocida de uno o más incidentes. Se investiga aparte del
            incidente para evitar que se repita.
          </DialogContentText>
          <TextField
            label="Causa raíz o hipótesis"
            multiline
            minRows={3}
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
          />
          <Autocomplete
            multiple
            options={options}
            value={options.filter((o) => linked.includes(o.id))}
            getOptionLabel={(o) => `${o.id} · ${o.title}`}
            onChange={(_, v) => setLinked(v.map((x) => x.id))}
            renderInput={(params) => <TextField {...params} label="Incidentes asociados" />}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>
          Crear problema
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Known error: root cause identified and a documented workaround. */
export function KnownErrorDialog({ ticket, open, onClose }: DialogProps) {
  const { actor } = useRole();
  const [rootCause, setRootCause] = useState(ticket.rootCause ?? '');
  const [workaround, setWorkaround] = useState(ticket.workaround ?? '');
  const { saving, error, setError, run } = useSubmit(onClose);

  // The ticket may refresh after the dialog opens (e.g. right after creating the problem).
  useEffect(() => {
    setRootCause((prev) => prev || ticket.rootCause || '');
  }, [ticket.rootCause]);

  const submit = () => {
    if (!rootCause.trim()) return setError('Indica la causa raíz identificada.');
    if (workaround.trim().length < 10)
      return setError('Documenta el workaround (mínimo 10 caracteres).');
    void run(
      () => ticketService.markKnownError(ticket.id, { rootCause, workaround }, actor),
      `${displayTicketId(ticket.id)} marcado como error conocido`,
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Marcar como error conocido</DialogTitle>
      <DialogContent>
        <Stack gap={2}>
          <DialogContentText>
            Error conocido = problema con causa raíz identificada y una solución temporal
            (workaround) que Nivel 1 puede aplicar mientras llega la solución definitiva.
          </DialogContentText>
          <TextField
            label="Causa raíz"
            multiline
            minRows={2}
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
          />
          <TextField
            label="Workaround documentado"
            multiline
            minRows={3}
            value={workaround}
            onChange={(e) => setWorkaround(e.target.value)}
            helperText="Pasos concretos que Service Desk puede indicar al usuario."
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>
          Guardar error conocido
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const CHANGE_HELP: Record<ChangeType, string> = {
  'Cambio estándar':
    'Preautorizado, de bajo riesgo y repetible (p. ej. corregir un YAML de content/ o reemplazar una imagen). Lo ejecuta el Responsable técnico.',
  'Cambio normal':
    'Requiere evaluación y aprobación del Dueño del servicio (p. ej. modificar el script de validación, deploy.yml, el dominio o los formularios de Kobo).',
};

/** Creates a linked Solicitud when the fix requires modifying the service. */
export function ChangeRequestDialog({ ticket, open, onClose }: DialogProps) {
  const { actor } = useRole();
  const [changeType, setChangeType] = useState<ChangeType>('Cambio estándar');
  const [category, setCategory] = useState<CategoryId>('mantenimiento-bd');
  const [title, setTitle] = useState(`Cambio para ${displayTicketId(ticket.id)}: `);
  const [description, setDescription] = useState('');
  const { saving, error, setError, run } = useSubmit(onClose);

  const submit = () => {
    if (title.trim().length < 12) return setError('Escribe un título para el cambio.');
    if (description.trim().length < 10) return setError('Describe qué se modifica del servicio.');
    void run(
      () =>
        ticketService.createChangeRequest(
          ticket.id,
          { changeType, category, title, description },
          actor,
        ),
      `${changeType} generado`,
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Generar solicitud de cambio</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <TextField
            select
            label="Tipo de cambio"
            value={changeType}
            onChange={(e) => setChangeType(e.target.value as ChangeType)}
          >
            <MenuItem value="Cambio estándar">Cambio estándar</MenuItem>
            <MenuItem value="Cambio normal">Cambio normal</MenuItem>
          </TextField>
          <Alert severity="info" variant="outlined">
            {CHANGE_HELP[changeType]}
          </Alert>
          <TextField
            select
            label="Servicio de la solicitud"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId)}
          >
            {servicesOfType('Solicitud').map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField
            label="Qué se modifica y por qué"
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>
          Generar solicitud
        </Button>
      </DialogActions>
    </Dialog>
  );
}
