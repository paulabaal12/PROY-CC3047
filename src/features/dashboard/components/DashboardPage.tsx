import { MenuItem, TextField } from '@mui/material';
import { useState } from 'react';
import { Panel, PageHeader, PageSkeleton } from '@/components';
import { useNow, useSettings, useTickets } from '@/hooks';
import type { Priority, Status } from '@/types';
import { formatBusinessMinutes } from '@/utils/businessHours';
import { chartTheme } from '../chartTheme';
import { useDashboardData, type RangeFilter, type TypeFilter } from '../hooks/useDashboardData';
import { ChartCard } from './ChartCard';
import { DonutChart, HorizontalBars, SegmentedBar } from './Charts';
import { SlaObjectives } from './SlaObjectives';
import styles from './Dashboard.module.scss';

function Kpi({ label, value, context }: { label: string; value: string; context: string }) {
  return (
    <Panel className={styles.kpi}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue}>{value}</p>
      <p className={styles.kpiContext}>{context}</p>
    </Panel>
  );
}

export function DashboardPage() {
  const { data: tickets, loading } = useTickets();
  const { settings } = useSettings();
  const now = useNow(60_000);
  const [type, setType] = useState<TypeFilter>('all');
  const [range, setRange] = useState<RangeFilter>('all');
  const data = useDashboardData(tickets, now, type, range);
  const theme = chartTheme(settings.themeMode);

  if (loading) return <PageSkeleton />;

  const resolved = data.byStatus
    .filter((s) => s.key === 'Resuelto' || s.key === 'Cerrado')
    .reduce((sum, s) => sum + s.value, 0);
  const tags = data.byTag.slice(0, 8);
  const statusColors = data.byStatus.map((s) => theme.status(s.key as Status));
  const typeColors =
    settings.themeMode === 'dark' ? ['#7FB2E0', '#3A6FAE'] : ['#182C61', '#7FB2E0'];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Soporte' }, { label: 'Dashboard' }]}
        title="Dashboard"
        subtitle={`Volumen, prioridad y cumplimiento del SLA · ${data.total} tickets en la selección`}
        actions={
          <>
            <TextField
              select
              value={type}
              onChange={(e) => setType(e.target.value as TypeFilter)}
              className={styles.filter}
              slotProps={{ htmlInput: { 'aria-label': 'Tipo' } }}
            >
              <MenuItem value="all">Incidentes y solicitudes</MenuItem>
              <MenuItem value="Incidente">Solo incidentes</MenuItem>
              <MenuItem value="Solicitud">Solo solicitudes</MenuItem>
            </TextField>
            <TextField
              select
              value={range}
              onChange={(e) => setRange(e.target.value as RangeFilter)}
              className={styles.filter}
              slotProps={{ htmlInput: { 'aria-label': 'Periodo' } }}
            >
              <MenuItem value="7">Últimos 7 días</MenuItem>
              <MenuItem value="30">Últimos 30 días</MenuItem>
              <MenuItem value="all">Todo el historial</MenuItem>
            </TextField>
          </>
        }
      />

      <div className={styles.grid}>
        <div className={styles.span3}>
          <Kpi label="Abiertos" value={String(data.open)} context="Abierto + En progreso" />
        </div>
        <div className={styles.span3}>
          <Kpi
            label="Críticos abiertos"
            value={String(data.criticalOpen)}
            context={data.criticalOpen ? 'P1 sin resolver: atender primero' : 'Sin P1 pendientes'}
          />
        </div>
        <div className={styles.span3}>
          <Kpi
            label="Dentro de SLA"
            value={data.slaCompliance === null ? '—' : `${data.slaCompliance}%`}
            context={`${data.breached} con respuesta o resolución vencida`}
          />
        </div>
        <div className={styles.span3}>
          <Kpi
            label="Tiempo medio de resolución"
            value={data.avgResolution === null ? '—' : formatBusinessMinutes(data.avgResolution)}
            context={`Horas hábiles · ${resolved} resueltos o cerrados`}
          />
        </div>

        <ChartCard
          title="Por prioridad"
          dimension="Prioridad"
          data={data.byPriority}
          className={`${styles.span6} ${styles.h360}`}
        >
          <HorizontalBars
            data={data.byPriority}
            theme={theme}
            colorFor={(d) => theme.priority(d.key as Priority)}
            height={260}
          />
        </ChartCard>
        <ChartCard
          title="Por categoría"
          dimension="Categoría"
          data={data.byCategory}
          className={`${styles.span6} ${styles.h360}`}
        >
          <DonutChart data={data.byCategory} colors={theme.ramp} theme={theme} />
        </ChartCard>

        <ChartCard
          title="Por estado"
          dimension="Estado"
          data={data.byStatus}
          className={`${styles.span6} ${styles.h280}`}
        >
          <SegmentedBar data={data.byStatus} colors={statusColors} />
        </ChartCard>
        <ChartCard
          title="Por tipo"
          dimension="Tipo"
          data={data.byType}
          className={`${styles.span6} ${styles.h280}`}
        >
          <DonutChart data={data.byType} colors={typeColors} theme={theme} size={160} />
        </ChartCard>

        <ChartCard title="Por tag (top 8)" dimension="Tag" data={tags} className={styles.span12}>
          <HorizontalBars data={tags} theme={theme} height={tags.length * 36 + 8} />
        </ChartCard>

        <div className={styles.span12}>
          <SlaObjectives data={data} availability={settings.availability} />
        </div>
      </div>
    </>
  );
}
