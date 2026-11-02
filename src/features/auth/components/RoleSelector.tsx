import { MenuItem, TextField } from '@mui/material';
import { ROLES } from '@/config/roles';
import { t } from '@/config/texts';
import type { RoleId } from '@/types';
import { useRole } from '../hooks/useRole';
import styles from './RoleSelector.module.scss';

export function RoleSelector() {
  const { role, roleDef, setRole } = useRole();
  return (
    <div className={styles.wrapper}>
      <TextField
        select
        size="small"
        fullWidth
        label={t.header.role}
        value={role}
        onChange={(e) => setRole(e.target.value as RoleId)}
        className={styles.field}
      >
        {ROLES.map((r) => (
          <MenuItem key={r.id} value={r.id}>
            {r.name}
          </MenuItem>
        ))}
      </TextField>
      <p className={styles.persona}>
        Sesión simulada como <strong>{roleDef.persona.name}</strong>
      </p>
    </div>
  );
}
