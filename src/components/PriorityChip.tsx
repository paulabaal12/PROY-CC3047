import { Chip, Tooltip } from '@mui/material';
import { PRIORITY_COLORS, toneSx } from '@/app/theme';
import type { Impact, Priority, Urgency } from '@/types';
import { calculatePriority } from '@/utils/priority';
import styles from './Chips.module.scss';

interface Props {
  priority: Priority;
  impact?: Impact;
  urgency?: Urgency;
  size?: 'small' | 'medium';
}

/** 8px dot + tinted chip: the color supports the label, it never replaces it. */
export function PriorityChip({ priority, impact, urgency, size = 'small' }: Props) {
  const safePriority = PRIORITY_COLORS[priority]
    ? priority
    : impact && urgency
      ? calculatePriority(impact, urgency)
      : 'Baja';
  const tone = PRIORITY_COLORS[safePriority];
  const chip = (
    <Chip
      size={size}
      icon={<span className={styles.dot} style={{ background: tone.color }} aria-hidden />}
      label={safePriority}
      sx={{ ...toneSx(tone), '& .MuiChip-icon': { ml: '8px', mr: '-2px' } }}
    />
  );
  if (!impact || !urgency) return chip;
  return <Tooltip title={`Impacto ${impact} × Urgencia ${urgency}`}>{chip}</Tooltip>;
}
