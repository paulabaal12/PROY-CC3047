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

/** 8px dot + tinted chip: the color supports the label, it never replaces it. */
export function PriorityChip({ priority, impact, urgency, size = 'small' }: Props) {
  const tone = PRIORITY_COLORS[priority];
  const chip = (
    <Chip
      size={size}
      icon={<span className={styles.dot} style={{ background: tone.color }} aria-hidden />}
      label={priority}
      sx={{ ...toneSx(tone), '& .MuiChip-icon': { ml: '8px', mr: '-2px' } }}
    />
  );
  if (!impact || !urgency) return chip;
  return <Tooltip title={`Impacto ${impact} × Urgencia ${urgency}`}>{chip}</Tooltip>;
}
