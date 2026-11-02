import type { ReactNode } from 'react';
import styles from './EmptyState.module.scss';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Friendly empty state: a soft illustrated badge, a short title and one action. */
export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className={styles.empty}>
      {icon && (
        <div className={styles.art} aria-hidden>
          <span className={styles.ring} />
          <span className={styles.spark} />
          <span className={styles.spark2} />
          <div className={styles.icon}>{icon}</div>
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
