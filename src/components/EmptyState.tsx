import type { ReactNode } from 'react';
import styles from './EmptyState.module.scss';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Sober empty state: a line icon, a short title and one action. */
export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className={styles.empty}>
      {icon && (
        <div className={styles.icon} aria-hidden>
          {icon}
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
