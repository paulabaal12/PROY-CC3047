import SearchIcon from '@mui/icons-material/Search';
import { Button, Chip, InputAdornment, MenuItem, TextField } from '@mui/material';
import { PRIORITY_COLORS } from '@/app/theme';
import { PRIORITIES } from '@/config/priorityMatrix';
import { ASSIGNEES, assigneeName } from '@/config/roles';
import { servicesOfType } from '@/config/services';
import { t } from '@/config/texts';
import type { AssigneeId, CategoryId, TicketType } from '@/types';
import { EMPTY_FILTERS, type BoardFilters } from '../hooks/useBoardFilters';
import styles from './Board.module.scss';

interface Props {
  type: TicketType;
  filters: BoardFilters;
  onChange: (f: BoardFilters) => void;
  active: boolean;
}

export function BoardFiltersBar({ type, filters, onChange, active }: Props) {
  const togglePriority = (p: (typeof PRIORITIES)[number]) =>
    onChange({
      ...filters,
      priorities: filters.priorities.includes(p)
        ? filters.priorities.filter((x) => x !== p)
        : [...filters.priorities, p],
    });

  return (
    <div className={styles.filters} role="search" aria-label="Filtros del tablero">
      <TextField
        size="small"
        placeholder="Buscar en esta cola…"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className={styles.search}
        slotProps={{
          htmlInput: { 'aria-label': 'Buscar en esta cola' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        select
        size="small"
        label="Categoría"
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value as CategoryId | '' })}
        className={styles.select}
      >
        <MenuItem value="">{t.common.all}</MenuItem>
        {servicesOfType(type).map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.shortName}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Responsable"
        value={filters.assignee}
        onChange={(e) => onChange({ ...filters, assignee: e.target.value as AssigneeId | '' })}
        className={styles.select}
      >
        <MenuItem value="">{t.common.all}</MenuItem>
        {ASSIGNEES.map((a) => (
          <MenuItem key={a} value={a}>
            {assigneeName(a)}
          </MenuItem>
        ))}
      </TextField>
      <div className={styles.priorityFilter} role="group" aria-label="Filtrar por prioridad">
        {PRIORITIES.map((p) => {
          const on = filters.priorities.includes(p);
          return (
            <Chip
              key={p}
              label={p}
              size="small"
              onClick={() => togglePriority(p)}
              aria-pressed={on}
              sx={{
                border: '2px solid',
                borderColor: on ? '#0A1A2E' : 'divider',
                bgcolor: on ? PRIORITY_COLORS[p].bg : 'background.paper',
                color: on ? PRIORITY_COLORS[p].ink : 'text.primary',
              }}
            />
          );
        })}
      </div>
      {active && (
        <Button size="small" onClick={() => onChange(EMPTY_FILTERS)}>
          {t.common.clearFilters}
        </Button>
      )}
    </div>
  );
}
