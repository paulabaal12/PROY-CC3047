import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState, type ReactNode } from 'react';
import { Panel } from '@/components';
import type { Datum } from '../hooks/useDashboardData';
import styles from './Dashboard.module.scss';

interface Props {
  title: string;
  /** Column header for the table view. */
  dimension: string;
  data: Datum[];
  children: ReactNode;
  className?: string;
}

/** Chart card with a Chart/Table segmented control, so values never depend on color alone. */
export function ChartCard({ title, dimension, data, children, className }: Props) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Panel
      className={className}
      title={title}
      action={
        <ToggleButtonGroup
          exclusive
          value={view}
          onChange={(_, v: 'chart' | 'table' | null) => v && setView(v)}
          aria-label={`Vista de ${title}`}
        >
          <ToggleButton value="chart">Gráfica</ToggleButton>
          <ToggleButton value="table">Tabla</ToggleButton>
        </ToggleButtonGroup>
      }
    >
      {total === 0 ? (
        <p className={styles.noData}>Sin datos en este periodo.</p>
      ) : view === 'chart' ? (
        <div className={styles.chart}>{children}</div>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{dimension}</th>
                <th scope="col">Tickets</th>
                <th scope="col">%</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.key}>
                  <td>{d.name}</td>
                  <td>{d.value}</td>
                  <td>{Math.round((d.value / total) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
