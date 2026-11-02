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

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  const item = payload?.[0];
  if (!active || !item) return null;
  const datum = item.payload as Datum;
  return (
    <div className={styles.tooltip}>
      <strong>{datum.name}</strong>
      <span>
        {datum.value} ticket{datum.value === 1 ? '' : 's'}
      </span>
    </div>
  );
}

/** Donut with a legend that doubles as direct labels (name + count). */
export function DonutChart({ data, theme }: { data: Datum[]; theme: ChartTheme }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={styles.donutWrap}>
      <div className={styles.donut}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              stroke={theme.surface}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={d.key} fill={theme.categorical[i % theme.categorical.length]} />
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
      <ul className={styles.legend}>
        {data.map((d, i) => (
          <li key={d.key}>
            <span
              className={styles.swatch}
              style={{ background: theme.categorical[i] }}
              aria-hidden
            />
            <span className={styles.legendName}>{d.name}</span>
            <span className={styles.legendValue}>{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface BarsProps {
  data: Datum[];
  theme: ChartTheme;
  colorFor?: (d: Datum) => string;
  height?: number;
}

/** Horizontal bars: names on the axis carry identity; the count is the end label. */
export function HorizontalBars({ data, theme, colorFor, height }: BarsProps) {
  const h = height ?? Math.max(160, data.length * 38 + 20);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 36, bottom: 4, left: 4 }}
        barCategoryGap={8}
      >
        <CartesianGrid horizontal={false} stroke={theme.grid} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: theme.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={118}
          tick={{ fill: theme.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: theme.grid, opacity: 0.5 }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.key} fill={colorFor ? colorFor(d) : theme.single} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            fill={theme.axis}
            fontSize={12}
            fontWeight={700}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
