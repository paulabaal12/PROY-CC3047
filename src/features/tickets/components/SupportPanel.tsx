import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import CallMadeIcon from '@mui/icons-material/CallMade';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { HardCard, PriorityChip } from '@/components';
import { IMPACTS, URGENCIES } from '@/config/priorityMatrix';
import { ASSIGNEES, assigneeName, LEVELS } from '@/config/roles';
import { useRole } from '@/features/auth';
import { useToast } from '@/hooks';
import { ticketService } from '@/services';
import type { AssigneeId, Impact, Status, SupportLevel, Ticket, TicketPatch, Urgency } from '@/types';
import { calculatePriority } from '@/utils/priority';
import { STATUSES, canTransition } from '@/utils/workflow';
import type { EscalationHint } from '@/utils/escalationHints';
import { EscalateDialog } from './EscalateDialog';
import { ChangeRequestDialog, KnownErrorDialog, ProblemDialog } from './ProblemDialogs';

const SUGGESTED_TAGS = [
  'github-pages',
  'dns',
  'https',
  'kobo',
  'lista-kobo',
  'update-steam',
  'imagen',
  'rendimiento',
  'filtros',
  'datos',
  'deploy',
];

interface Draft {
  status: Status;
  impact: Impact;
  urgency: Urgency;
  assignee: AssigneeId;
  level: SupportLevel;
  tags: string[];
}

const toDraft = (t: Ticket): Draft => ({
  status: t.status,
  impact: t.impact,
  urgency: t.urgency,
  assignee: t.assignee,
  level: t.level,
  tags: t.tags,
});

type DialogKind = 'escalate' | 'problem' | 'known-error' | 'change' | null;

interface Props {
  ticket: Ticket;
  breached: boolean;
  hints: EscalationHint[];
}

/** Support edits: status, impact/urgency (priority recalculated), assignee, level and tags. */
export function SupportPanel({ ticket, breached, hints }: Props) {
  const { actor } = useRole();
  const notify = useToast();
  const [draft, setDraft] = useState<Draft>(() => toDraft(ticket));
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [hint, setHint] = useState<EscalationHint | undefined>();
  const [cause, setCause] = useState(ticket.slaBreachCause ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(toDraft(ticket));
    setCause(ticket.slaBreachCause ?? '');
  }, [ticket]);

  const patch = useMemo(() => {
    const p: TicketPatch = {};
    if (draft.status !== ticket.status) p.status = draft.status;
    if (draft.impact !== ticket.impact) p.impact = draft.impact;
    if (draft.urgency !== ticket.urgency) p.urgency = draft.urgency;
    if (draft.assignee !== ticket.assignee) p.assignee = draft.assignee;
    if (draft.level !== ticket.level) p.level = draft.level;
    if (draft.tags.join('|') !== ticket.tags.join('|')) p.tags = draft.tags;
    return p;
  }, [draft, ticket]);
  const dirty = Object.keys(patch).length > 0;
  const newPriority = calculatePriority(draft.impact, draft.urgency);
  const closed = ticket.status === 'Cerrado';

  const save = async (p: TicketPatch, message: string) => {
    setSaving(true);
    setError(null);
    try {
      await ticketService.update(ticket.id, p, actor);
      notify(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <HardCard title="Gestión (soporte)" tone="accent">
      <Stack gap={2}>
        {hints.map((h) => (
          <Alert
            key={h.route}
            severity="warning"
            icon={<TipsAndUpdatesOutlinedIcon />}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setHint(h);
                  setDialog('escalate');
                }}
              >
                Escalar
              </Button>
            }
          >
            <strong>Escalamiento {h.route === 'funcional' ? 'funcional' : 'jerárquico'} sugerido.</strong> {h.reason}
          </Alert>
        ))}

        <TextField
          select
          size="small"
          label="Estado"
          value={draft.status}
          onChange={(e) => set('status', e.target.value as Status)}
          disabled={closed}
        >
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s} disabled={!canTransition(ticket.status, s)}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" gap={1.5}>
          <TextField
            select
            fullWidth
            size="small"
            label="Impacto"
            value={draft.impact}
            onChange={(e) => set('impact', e.target.value as Impact)}
            disabled={closed}
          >
            {IMPACTS.map((i) => (
              <MenuItem key={i} value={i}>
                {i}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            size="small"
            label="Urgencia"
            value={draft.urgency}
            onChange={(e) => set('urgency', e.target.value as Urgency)}
            disabled={closed}
          >
            {URGENCIES.map((u) => (
              <MenuItem key={u} value={u}>
                {u}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Prioridad calculada
          </Typography>
          <PriorityChip priority={newPriority} />
        </Stack>
        <TextField
          select
          size="small"
          label="Responsable"
          value={draft.assignee}
          onChange={(e) => set('assignee', e.target.value as AssigneeId)}
          disabled={closed}
          helperText="Para escalar con motivo, usá el botón Escalar."
        >
          {ASSIGNEES.map((a) => (
            <MenuItem key={a} value={a}>
              {assigneeName(a)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Nivel"
          value={draft.level}
          onChange={(e) => set('level', e.target.value as SupportLevel)}
          disabled={closed}
        >
          {LEVELS.map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </TextField>
        <Autocomplete
          multiple
          freeSolo
          size="small"
          options={SUGGESTED_TAGS}
          value={draft.tags}
          onChange={(_, v) => set('tags', v.map((x) => x.trim().toLowerCase()).filter(Boolean))}
          disabled={closed}
          renderTags={(tags, getTagProps) =>
            tags.map((tag, index) => {
              const { key, ...rest } = getTagProps({ index });
              return <Chip key={key} {...rest} label={tag} size="small" />;
            })
          }
          renderInput={(params) => <TextField {...params} label="Tags" placeholder="Agregar tag" />}
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          disabled={!dirty || saving}
          onClick={() => void save(patch, 'Cambios guardados en el historial')}
        >
          Guardar cambios
        </Button>

        <Divider />
        <Stack gap={1}>
          <Button variant="outlined" startIcon={<CallMadeIcon />} onClick={() => setDialog('escalate')} disabled={closed}>
            Escalar
          </Button>
          {ticket.type === 'Incidente' && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<BugReportOutlinedIcon />}
                onClick={() => setDialog('problem')}
              >
                {ticket.isProblem ? 'Editar problema' : 'Crear problema'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<BugReportOutlinedIcon />}
                onClick={() => setDialog('known-error')}
              >
                {ticket.knownError ? 'Editar workaround' : 'Marcar como error conocido'}
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            color="success"
            startIcon={<PublishedWithChangesIcon />}
            onClick={() => setDialog('change')}
          >
            Generar solicitud de cambio
          </Button>
        </Stack>

        {breached && (
          <>
            <Divider />
            <Typography variant="subtitle2">Causa del incumplimiento del SLA</Typography>
            <TextField
              size="small"
              multiline
              minRows={2}
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              helperText="Un incumplimiento aislado se registra con su causa."
            />
            <Button
              size="small"
              disabled={!cause.trim() || cause === (ticket.slaBreachCause ?? '') || saving}
              onClick={() => void save({ slaBreachCause: cause.trim() }, 'Causa registrada')}
            >
              Registrar causa
            </Button>
          </>
        )}
      </Stack>

      {dialog === 'escalate' && (
        <EscalateDialog
          open
          ticket={ticket}
          hint={hint}
          onClose={() => {
            setDialog(null);
            setHint(undefined);
          }}
        />
      )}
      {dialog === 'problem' && <ProblemDialog open ticket={ticket} onClose={() => setDialog(null)} />}
      {dialog === 'known-error' && <KnownErrorDialog open ticket={ticket} onClose={() => setDialog(null)} />}
      {dialog === 'change' && <ChangeRequestDialog open ticket={ticket} onClose={() => setDialog(null)} />}
    </HardCard>
  );
}
