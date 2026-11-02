import { Chip, Tooltip } from '@mui/material';
import { PRIORITY_COLORS } from '@/app/theme';
import type { Impact, Priority, Urgency } from '@/types';

interface Props {
  priority: Priority;
  impact?: Impact;
  urgency?: Urgency;
  size?: 'small' | 'medium';
}

export function PriorityChip({ priority, impact, urgency, size = 'small' }: Props) {
  const { bg, ink } = PRIORITY_COLORS[priority];
  const chip = (
    <Chip
      size={size}
      label={priority}
      sx={{ bgcolor: bg, color: ink, border: '2px solid #0A1A2E', fontWeight: 800 }}
    />
  );
  if (!impact || !urgency) return chip;
  return <Tooltip title={`Impacto ${impact} × Urgencia ${urgency}`}>{chip}</Tooltip>;
}
