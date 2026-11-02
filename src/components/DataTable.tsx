import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from '@/utils/clsx';
import styles from './DataTable.module.scss';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** CSS width, e.g. '120px' or '30%'. */
  width?: string;
  align?: 'left' | 'right';
  /** Hide this column below a breakpoint to avoid horizontal scroll. */
  hideBelow?: 'sm' | 'md' | 'lg';
  /** Let the cell wrap instead of truncating. */
  wrap?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  /** Makes rows clickable (and keyboard-activable) links. */
  getHref?: (row: T) => string;
  caption?: string;
}

const HIDE: Record<NonNullable<Column<unknown>['hideBelow']>, string | undefined> = {
  sm: styles.hideSm,
  md: styles.hideMd,
  lg: styles.hideLg,
};

/** Compact table: 48px rows, tinted hover, tabular numbers. */
export function DataTable<T>({ columns, rows, getKey, getHref, caption }: Props<T>) {
  const navigate = useNavigate();
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <colgroup>
          {columns.map((c) => (
            <col
              key={c.key}
              style={c.width ? { width: c.width } : undefined}
              className={c.hideBelow && HIDE[c.hideBelow]}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={clsx(
                  c.align === 'right' && styles.right,
                  c.hideBelow && HIDE[c.hideBelow],
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = getHref?.(row);
            return (
              <tr
                key={getKey(row)}
                className={clsx(href && styles.clickable)}
                tabIndex={href ? 0 : undefined}
                onClick={href ? () => navigate(href) : undefined}
                onKeyDown={
                  href
                    ? (e) => {
                        if (e.key === 'Enter') navigate(href);
                      }
                    : undefined
                }
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={clsx(
                      c.align === 'right' && styles.right,
                      c.wrap && styles.wrapCell,
                      c.hideBelow && HIDE[c.hideBelow],
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
