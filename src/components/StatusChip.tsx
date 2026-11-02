import { Chip } from '@mui/material';
import type { Status, TicketType } from '@/types';

const STATUS_STYLE: Record<Status, { bg: string; color: string }> = {
  Abierto: { bg: '#E0F2FE', color: '#0A1A2E' },
  'En progreso': { bg: '#2563EB', color: '#FFFFFF' },
  Resuelto: { bg: '#2DC1A5', color: '#0A1A2E' },
  Cerrado: { bg: '#CBD5E1', color: '#0F172A' },
};

export function StatusChip({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <Chip
      size="small"
      label={status}
      sx={{ bgcolor: s.bg, color: s.color, border: '2px solid #0A1A2E' }}
    />
  );
}

export function TypeChip({ type }: { type: TicketType }) {
  const incident = type === 'Incidente';
  return (
    <Chip
      size="small"
      variant="outlined"
      label={type}
      sx={{
        borderWidth: 2,
        borderColor: incident ? '#E94F37' : '#2563EB',
        color: incident ? '#B4301C' : '#1D4ED8',
        bgcolor: 'background.paper',
      }}
    />
  );
}
