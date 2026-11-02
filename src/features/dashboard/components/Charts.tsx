import { Tooltip as MuiTooltip } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { ChartTheme } from '../chartTheme';
import type { Datum } from '../hooks/useDashboardData';
import styles from './Dashboard.module.scss';

const pct = (v: number, total: number) => (total ? Math.round((v / total) * 100) : 0);

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  const item = payload?.[0];
  if (!active || !item) return null;
  const datum = item.payload as Datum;
  return (
    <div className={styles.tooltip}>
      <span>{datum.name}</span>
      <strong>
        {datum.value} ticket{datum.value === 1 ? '' : 's'}
      </strong>
    </div>
  );
}

interface LegendProps {
  data: Datum[];
  colors: string[];
}

function Legend({ data, colors }: LegendProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className={styles.legend}>
      {data.map((d, i) => (
        <li key={d.key}>
          <span className={styles.swatch} style={{ background: colors[i] }} aria-hidden />
          <span className={styles.legendName}>{d.name}</span>
          <span className={styles.legendValue}>{d.value}</span>
          <span className={styles.legendPct}>{pct(d.value, total)}%</span>
        </li>
      ))}
    </ul>
  );
}

/** Donut with the legend on the right (stacked below on narrow screens). */
export function DonutChart({
  data,
  colors,
  theme,
  size = 200,
}: {
  data: Datum[];
  colors: string[];
  theme: ChartTheme;
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={styles.donutWrap}>
      <div className={styles.donut} style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="66%"
              outerRadius="100%"
              stroke={theme.surface}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={d.key} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.donutCenter} aria-hidden>
          <strong>{total}</strong>
          <span>tickets</span>
        </div>
      </div>
      <Legend data={data} colors={colors} />
    </div>
  );
}

interface BarsProps {
  data: Datum[];
  theme: ChartTheme;
  colorFor?: (d: Datum) => string;
  height: number;
  labelWidth?: number;
}

/** Horizontal bars: names on the axis carry identity; the count sits at the end. */
export function HorizontalBars({ data, theme, colorFor, height, labelWidth = 104 }: BarsProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
        barCategoryGap="28%"
      >
        <CartesianGrid horizontal={false} stroke={theme.grid} />
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={labelWidth}
          tick={{ fill: theme.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: theme.grid }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.key} fill={colorFor ? colorFor(d) : theme.single} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            fill={theme.axis}
            fontSize={12}
            fontWeight={500}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** A single segmented bar (parts of a whole) with a legend underneath. */
export function SegmentedBar({ data, colors }: { data: Datum[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={styles.segmented}>
      <div
        className={styles.segBar}
        role="img"
        aria-label={data.map((d) => `${d.name}: ${d.value}`).join(', ')}
      >
        {data
          .filter((d) => d.value > 0)
          .map((d) => (
            <MuiTooltip key={d.key} title={`${d.name}: ${d.value} (${pct(d.value, total)}%)`}>
              <span
                className={styles.segment}
                style={{ flexGrow: d.value, background: colors[data.indexOf(d)] }}
              />
            </MuiTooltip>
          ))}
      </div>
      <Legend data={data} colors={colors} />
    </div>
  );
}
