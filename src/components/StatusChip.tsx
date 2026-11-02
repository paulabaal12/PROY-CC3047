import { Chip } from '@mui/material';
import { PRIORITY_COLORS, STATUS_COLORS, toneSx } from '@/app/theme';
import type { Status, TicketType } from '@/types';

export function StatusChip({ status }: { status: Status }) {
  return <Chip size="small" label={status} sx={toneSx(STATUS_COLORS[status])} />;
}

export function TypeChip({ type }: { type: TicketType }) {
  const tone = type === 'Incidente' ? PRIORITY_COLORS.Crítica : STATUS_COLORS['En progreso'];
  return (
    <Chip
      size="small"
      variant="outlined"
      label={type}
      sx={{
        borderColor: 'divider',
        color: tone.ink,
        bgcolor: 'background.paper',
        '[data-theme="dark"] &': { color: tone.inkDark },
      }}
    />
  );
}
