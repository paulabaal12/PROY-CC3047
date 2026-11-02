import { MenuItem, TextField, Tooltip } from '@mui/material';
import { PersonAvatar } from '@/components';
import { ROLES } from '@/config/roles';
import { t } from '@/config/texts';
import type { RoleId } from '@/types';
import { useRole } from '../hooks/useRole';
import styles from './RoleSelector.module.scss';

/** Simulated login: one compact row with the session and the role switcher. */
export function RoleSelector({ compact = false }: { compact?: boolean }) {
  const { role, roleDef, setRole } = useRole();

  if (compact) {
    return (
      <Tooltip title={`${roleDef.persona.name} · ${roleDef.name}`} placement="right">
        <span className={styles.compact}>
          <PersonAvatar name={roleDef.persona.name} role={role} size={28} />
        </span>
      </Tooltip>
    );
  }

  return (
    <div className={styles.row}>
      <PersonAvatar name={roleDef.persona.name} role={role} size={28} />
      <TextField
        select
        fullWidth
        value={role}
        onChange={(e) => setRole(e.target.value as RoleId)}
        className={styles.field}
        slotProps={{ htmlInput: { 'aria-label': t.header.role } }}
      >
        {ROLES.map((r) => (
          <MenuItem key={r.id} value={r.id}>
            {r.name}
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
}
