import { PRIORITY_COLORS } from '@/app/theme';
import type { ThemeMode } from '@/services';
import type { Priority } from '@/types';

/**
 * Categorical order for the 7 catalog categories. Validated with the dataviz
 * palette checker (lightness band, chroma, CVD and normal-vision separation)
 * against the light surface and, separately, the navy panel in dark mode.
 */
const CATEGORICAL: Record<ThemeMode, string[]> = {
  light: ['#2563EB', '#E07A1F', '#14A38B', '#8B5CF6', '#C2410C', '#0891B2', '#B8326E'],
  dark: ['#5B8DEF', '#C86A1A', '#1FA58C', '#9B7BF0', '#E2553A', '#1C9DC0', '#D24F8C'],
};

export interface ChartTheme {
  categorical: string[];
  single: string;
  grid: string;
  axis: string;
  surface: string;
  priority: (p: Priority) => string;
}

export function chartTheme(mode: ThemeMode): ChartTheme {
  const dark = mode === 'dark';
  return {
    categorical: CATEGORICAL[mode],
    single: dark ? '#5B8DEF' : '#2563EB',
    grid: dark ? '#1C3352' : '#E2E8F0',
    axis: dark ? '#9FB2C8' : '#64748B',
    surface: dark ? '#0D1F36' : '#FFFFFF',
    priority: (p) => PRIORITY_COLORS[p].bg,
  };
}
