import { MenuItem, TextField } from '@mui/material';
import { PersonAvatar } from '@/components';
import { ROLES } from '@/config/roles';
import { t } from '@/config/texts';
import type { RoleId } from '@/types';
import { useRole } from '../hooks/useRole';
import styles from './RoleSelector.module.scss';

/** Simulated login: compact profile card with a role switcher. */
export function RoleSelector() {
  const { role, roleDef, setRole } = useRole();
  return (
    <div className={styles.card}>
      <div className={styles.who}>
        <PersonAvatar name={roleDef.persona.name} role={role} size={32} />
        <div className={styles.whoText}>
          <strong>{roleDef.persona.name}</strong>
          <span>Sesión simulada</span>
        </div>
      </div>
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
