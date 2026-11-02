import { Chip, Tooltip } from '@mui/material';
import { PRIORITY_COLORS, toneSx } from '@/app/theme';
import type { Impact, Priority, Urgency } from '@/types';
import styles from './Chips.module.scss';

interface Props {
  priority: Priority;
  impact?: Impact;
  urgency?: Urgency;
  size?: 'small' | 'medium';
}

/** Tinted chip with a colored dot: the color supports the label, it never replaces it. */
export function PriorityChip({ priority, impact, urgency, size = 'small' }: Props) {
  const tone = PRIORITY_COLORS[priority];
  const chip = (
    <Chip
      size={size}
      icon={<span className={styles.dot} style={{ background: tone.color }} aria-hidden />}
      label={priority}
      sx={{ ...toneSx(tone), fontWeight: 600, '& .MuiChip-icon': { ml: '8px', mr: '-4px' } }}
    />
  );
  if (!impact || !urgency) return chip;
  return <Tooltip title={`Impacto ${impact} × Urgencia ${urgency}`}>{chip}</Tooltip>;
}
