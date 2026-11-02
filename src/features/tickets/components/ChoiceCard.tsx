import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { ReactNode } from 'react';
import clsx from '@/utils/clsx';
import styles from './ChoiceCard.module.scss';

interface Props {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  name: string;
  value: string;
}

/** Large radio-like card used across the form steps. */
export function ChoiceCard({ selected, onSelect, title, description, icon, meta, name, value }: Props) {
  return (
    <label className={clsx(styles.card, selected && styles.selected)}>
      <input
        type="radio"
        className="visually-hidden"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
      />
      <span className={styles.top}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.title}>{title}</span>
        {selected && <CheckCircleIcon className={styles.check} aria-hidden />}
      </span>
      {description && <span className={styles.description}>{description}</span>}
      {meta && <span className={styles.meta}>{meta}</span>}
    </label>
  );
}
