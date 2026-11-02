import type { ReactNode } from 'react';
import styles from './PageHeader.module.scss';

export interface HeaderStat {
  label: string;
  value: string | number;
  tone?: 'default' | 'danger' | 'success';
}

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Optional one-line summary under the title (counts, status). */
  stats?: HeaderStat[];
}

export function PageHeader({ eyebrow, title, subtitle, actions, stats }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {stats && stats.length > 0 && (
          <ul className={styles.stats}>
            {stats.map((s) => (
              <li key={s.label} data-tone={s.tone ?? 'default'}>
                <strong>{s.value}</strong> {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
