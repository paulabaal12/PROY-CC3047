import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import styles from './PageHeader.module.scss';

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  breadcrumbs?: Crumb[];
  title: string;
  /** One line, truncated beyond 640px. */
  subtitle?: string;
  actions?: ReactNode;
  /** Optional row under the title (chips, status). */
  meta?: ReactNode;
}

/** The single page header used by every view: breadcrumb, title, one-line subtitle, actions. */
export function PageHeader({ breadcrumbs, title, subtitle, actions, meta }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Ruta" className={styles.crumbs}>
            <ol>
              {breadcrumbs.map((c, i) => (
                <li key={`${c.label}-${i}`}>
                  {i > 0 && <ChevronRightIcon className={styles.sep} aria-hidden />}
                  {c.to ? (
                    <RouterLink to={c.to}>{c.label}</RouterLink>
                  ) : (
                    <span aria-current={i === breadcrumbs.length - 1 ? 'page' : undefined}>
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className={styles.title}>{title}</h1>
        {meta && <div className={styles.meta}>{meta}</div>}
        {subtitle && (
          <p className={styles.subtitle} title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
