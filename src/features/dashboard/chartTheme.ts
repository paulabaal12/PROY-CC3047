import { PRIORITY_COLORS } from '@/app/theme';
import type { ThemeMode } from '@/services';
import type { Priority } from '@/types';

/**
 * Categorical order for the 7 catalog categories, led by the blues of the identity.
 * Validated with a palette checker (lightness band, chroma, CVD and normal-vision
 * separation) against the white card and, separately, the dark panel. Every chart
 * also has a legend and a table view, so no value depends on color alone.
 */
const CATEGORICAL: Record<ThemeMode, string[]> = {
  light: ['#2563EB', '#F59E0B', '#0EA5E9', '#8B5CF6', '#0D9488', '#E11D48', '#4F46E5'],
  dark: ['#3B82F6', '#D97706', '#0284C7', '#8B5CF6', '#0D9488', '#E11D48', '#6366F1'],
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
    single: dark ? '#60A5FA' : '#2563EB',
    grid: dark ? '#1E2F4A' : '#EEF2F7',
    axis: dark ? '#94A3B8' : '#64748B',
    surface: dark ? '#111F35' : '#FFFFFF',
    priority: (p) => PRIORITY_COLORS[p].color,
  };
}
