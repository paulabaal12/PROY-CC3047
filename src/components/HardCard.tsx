import type { ElementType, ReactNode } from 'react';
import clsx from '@/utils/clsx';
import styles from './HardCard.module.scss';

interface Props {
  children: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Lifts on hover (clickable cards). */
  interactive?: boolean;
  tone?: 'default' | 'accent' | 'danger';
  as?: ElementType;
}

/** Surface with a 2px ink border and hard offset shadow ("Pacífico Tropical"). */
export function HardCard({
  children,
  title,
  action,
  className,
  interactive = false,
  tone = 'default',
  as: Tag = 'section',
}: Props) {
  return (
    <Tag
      className={clsx(
        styles.card,
        interactive && styles.interactive,
        tone === 'accent' && styles.accent,
        tone === 'danger' && styles.danger,
        className,
      )}
    >
      {(title || action) && (
        <div className={styles.head}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </Tag>
  );
}
