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
  /** Hover darkens the border (clickable cards). */
  interactive?: boolean;
  /** `accent` uses the muted surface. Other tones are kept for compatibility and render neutral. */
  tone?: 'default' | 'accent' | 'danger';
  /** No inner padding (tables). */
  flush?: boolean;
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
  flush = false,
  as: Tag = 'section',
}: Props) {
  return (
    <Tag
      className={clsx(
        styles.card,
        interactive && styles.interactive,
        tone === 'accent' && styles.accent,
        flush && styles.flush,
        className,
      )}
    >
      {(title || action) && (
        <div className={styles.head}>
          <div className={styles.headText}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </Tag>
  );
}
