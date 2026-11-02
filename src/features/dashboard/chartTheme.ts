import { PRIORITY_COLORS, STATUS_COLORS } from '@/app/theme';
import type { ThemeMode } from '@/services';
import type { Priority, Status } from '@/types';

/**
 * Blue ramp (#182C61 → #B5D5EE) extended to 7 steps for the 7 catalog categories.
 * A sequential ramp is not enough on its own to tell categories apart, so every
 * chart also shows a legend with values and offers a table view.
 */
const RAMP: Record<ThemeMode, string[]> = {
  light: ['#182C61', '#24407F', '#2F5597', '#4F86C6', '#7FB2E0', '#9CC4E8', '#B5D5EE'],
  dark: ['#DCEBF7', '#B5D5EE', '#93C1E7', '#7FB2E0', '#5E98CF', '#4F86C6', '#3A6FAE'],
};

export interface ChartTheme {
  ramp: string[];
  single: string;
  grid: string;
  axis: string;
  surface: string;
  priority: (p: Priority) => string;
  status: (s: Status) => string;
}

export function chartTheme(mode: ThemeMode): ChartTheme {
  const dark = mode === 'dark';
  return {
    ramp: RAMP[mode],
    single: dark ? '#7FB2E0' : '#182C61',
    grid: dark ? '#1A2332' : '#F1F5F9',
    axis: dark ? '#9CA3AF' : '#6B7280',
    surface: dark ? '#0F1623' : '#FFFFFF',
    priority: (p) => PRIORITY_COLORS[p].color,
    // Navy disappears on the dark surface: use the light ramp step instead.
    status: (s) => (dark && s === 'En progreso' ? '#7FB2E0' : STATUS_COLORS[s].color),
  };
}
