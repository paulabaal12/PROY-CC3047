import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SendIcon from '@mui/icons-material/Send';
import { Alert, Button, Chip, FormControlLabel, Switch, TextField } from '@mui/material';
import { useState } from 'react';
import { PersonAvatar } from '@/components';
import { roleById } from '@/config/roles';
import { useRole } from '@/features/auth';
import { useToast } from '@/hooks';
import { ticketService } from '@/services';
import type { Ticket } from '@/types';
import clsx from '@/utils/clsx';
import { formatDateTime } from '@/utils/dates';
import styles from './CommentsSection.module.scss';

export function CommentsSection({ ticket }: { ticket: Ticket }) {
  const { actor, isInternal } = useRole();
  const notify = useToast();
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Users never see internal notes.
  const comments = ticket.comments.filter((c) => isInternal || !c.internal);
  const closed = ticket.status === 'Cerrado';

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      await ticketService.addComment(ticket.id, { text, internal: isInternal && internal }, actor);
      setText('');
      notify(internal ? 'Nota interna guardada' : 'Comentario publicado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo comentar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.section}>
      {comments.length === 0 ? (
        <p className={styles.empty}>Todavía no hay comentarios.</p>
      ) : (
        <ul className={styles.list}>
          {comments.map((c) => (
            <li key={c.id} className={clsx(styles.comment, c.internal && styles.internal)}>
              <PersonAvatar name={c.author} role={c.role} size={32} />
              <div className={styles.bubble}>
                <div className={styles.meta}>
                  <strong>{c.author}</strong>
                  <span>{roleById(c.role).short}</span>
                  <span>· {formatDateTime(c.createdAt)}</span>
                  {c.internal && (
                    <Chip
                      size="small"
                      icon={<LockOutlinedIcon />}
                      label="Nota interna"
                      sx={{
                        bgcolor: 'rgba(202,138,4,0.1)',
                        color: '#854D0E',
                        height: 22,
                        '& .MuiChip-icon': { color: 'inherit' },
                        '[data-theme="dark"] &': { color: '#FCD34D' },
                      }}
                    />
                  )}
                </div>
                <p className={styles.text}>{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {closed ? (
        <Alert severity="info">
          El ticket está cerrado; para un caso nuevo registra otro ticket.
        </Alert>
      ) : (
        <form
          className={styles.composer}
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <TextField
            multiline
            minRows={2}
            fullWidth
            label={internal ? 'Nota interna (solo soporte)' : 'Escribe un comentario'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            sx={
              internal
                ? { '& .MuiInputBase-root': { bgcolor: 'rgba(245,158,11,0.06)' } }
                : undefined
            }
          />
          {error && <Alert severity="error">{error}</Alert>}
          <div className={styles.composerActions}>
            {isInternal ? (
              <FormControlLabel
                control={
                  <Switch checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                }
                label="Nota interna"
              />
            ) : (
              <span />
            )}
            <Button
              type="submit"
              variant="contained"
              endIcon={<SendIcon />}
              disabled={!text.trim() || sending}
            >
              {internal ? 'Guardar nota' : 'Comentar'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
