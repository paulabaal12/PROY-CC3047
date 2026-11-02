import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { MenuItem, TextField } from '@mui/material';
import { useState, type ReactNode } from 'react';
import { Panel, PageHeader, PageSkeleton } from '@/components';
import { useNow, useSettings, useTickets } from '@/hooks';
import type { Priority } from '@/types';
import { formatBusinessMinutes } from '@/utils/businessHours';
import { chartTheme } from '../chartTheme';
import { useDashboardData, type RangeFilter, type TypeFilter } from '../hooks/useDashboardData';
import { ChartCard } from './ChartCard';
import { DonutChart, HorizontalBars } from './Charts';
import { SlaObjectives } from './SlaObjectives';
import styles from './Dashboard.module.scss';

function Kpi({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: 'default' | 'danger' | 'success';
}) {
  return (
    <Panel className={styles.kpi}>
      <div className={styles.kpiHead}>
        <p className={styles.kpiLabel}>{label}</p>
        <span className={styles.kpiIcon} data-tone={tone} aria-hidden>
          {icon}
        </span>
      </div>
      <p className={styles.kpiValue}>{value}</p>
      {hint && <p className={styles.kpiHint}>{hint}</p>}
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

  return (
    <>
      <PageHeader
        eyebrow="Gestión del nivel de servicio"
        title="Dashboard"
        subtitle="Volumen, prioridad y cumplimiento del SLA del Service Desk de centralamerica.games."
      />

      <div className={styles.filterRow} role="group" aria-label="Filtros del dashboard">
        <TextField
          select
          label="Tipo"
          className={styles.filter}
          value={type}
          onChange={(e) => setType(e.target.value as TypeFilter)}
        >
          <MenuItem value="all">Incidentes y solicitudes</MenuItem>
          <MenuItem value="Incidente">Solo incidentes</MenuItem>
          <MenuItem value="Solicitud">Solo solicitudes</MenuItem>
        </TextField>
        <TextField
          select
          label="Periodo"
          className={styles.filter}
          value={range}
          onChange={(e) => setRange(e.target.value as RangeFilter)}
        >
          <MenuItem value="7">Últimos 7 días</MenuItem>
          <MenuItem value="30">Últimos 30 días</MenuItem>
          <MenuItem value="all">Todo el historial</MenuItem>
        </TextField>
        <span className={styles.filterNote}>{data.total} tickets en la selección</span>
      </div>

      <div className={styles.kpis}>
        <Kpi
          label="Abiertos"
          value={String(data.open)}
          hint="Abierto + En progreso"
          icon={<InboxOutlinedIcon fontSize="small" />}
        />
        <Kpi
          label="Críticos abiertos"
          value={String(data.criticalOpen)}
          hint="P1 sin resolver"
          icon={<ReportProblemOutlinedIcon fontSize="small" />}
          tone={data.criticalOpen > 0 ? 'danger' : 'default'}
        />
        <Kpi
          label="% dentro de SLA"
          value={data.slaCompliance === null ? '—' : `${data.slaCompliance}%`}
          hint={`${data.breached} con respuesta o resolución vencida`}
          icon={<VerifiedOutlinedIcon fontSize="small" />}
          tone="success"
        />
        <Kpi
          label="Tiempo prom. de resolución"
          value={data.avgResolution === null ? '—' : formatBusinessMinutes(data.avgResolution)}
          hint="En horas hábiles"
          icon={<ScheduleOutlinedIcon fontSize="small" />}
        />
      </div>

      <SlaObjectives data={data} availability={settings.availability} />

      <div className={styles.charts}>
        <ChartCard title="Tickets por categoría" data={data.byCategory} className={styles.wide}>
          <DonutChart data={data.byCategory} theme={theme} />
        </ChartCard>
        <ChartCard title="Tickets por prioridad" data={data.byPriority}>
          <HorizontalBars
            data={data.byPriority}
            theme={theme}
            colorFor={(d) => theme.priority(d.key as Priority)}
          />
        </ChartCard>
        <ChartCard title="Tickets por estado" data={data.byStatus}>
          <HorizontalBars data={data.byStatus} theme={theme} />
        </ChartCard>
        <ChartCard title="Tickets por tipo" data={data.byType}>
          <HorizontalBars data={data.byType} theme={theme} height={130} />
        </ChartCard>
        <ChartCard title="Tickets por tag (top 10)" data={data.byTag}>
          <HorizontalBars data={data.byTag} theme={theme} />
        </ChartCard>
      </div>
    </>
  );
}
