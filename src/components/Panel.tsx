import type { ElementType, ReactNode } from 'react';
import clsx from '@/utils/clsx';
import styles from './Panel.module.scss';

interface Props {
  children: ReactNode;
  title?: ReactNode;
  /** Short helper line under the title. */
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Lifts softly on hover (clickable cards). */
  interactive?: boolean;
  /** `accent`: tinted surface; `danger`: thin red accent on the left edge. */
  tone?: 'default' | 'accent' | 'danger';
  as?: ElementType;
}

/** White card with a hairline border: the base surface of the app. */
export function Panel({
  children,
  title,
  subtitle,
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
          <div className={styles.headText}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </Tag>
  );
}
