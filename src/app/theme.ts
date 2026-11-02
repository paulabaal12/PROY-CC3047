import { alpha, createTheme, type Theme } from '@mui/material/styles';
import type { ThemeMode } from '@/services';
import type { Priority, Status } from '@/types';

export const COLORS = {
  navy: '#0B2545',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  sky: '#38BDF8',
  skyLight: '#E0F2FE',
  bg: '#F4F8FD',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
} as const;

/** Tinted chip colors: `color` for dots/bars, `ink` (light) and `inkDark` (dark mode) for text. */
export interface Tone {
  color: string;
  ink: string;
  inkDark: string;
}

export const PRIORITY_COLORS: Record<Priority, Tone> = {
  Crítica: { color: '#EF4444', ink: '#B91C1C', inkDark: '#FCA5A5' },
  Alta: { color: '#F97316', ink: '#C2410C', inkDark: '#FDBA74' },
  Media: { color: '#F59E0B', ink: '#92400E', inkDark: '#FCD34D' },
  Baja: { color: '#38BDF8', ink: '#0369A1', inkDark: '#7DD3FC' },
  Planificada: { color: '#94A3B8', ink: '#475569', inkDark: '#CBD5E1' },
};

export const STATUS_COLORS: Record<Status, Tone> = {
  Abierto: { color: '#38BDF8', ink: '#0369A1', inkDark: '#7DD3FC' },
  'En progreso': { color: '#2563EB', ink: '#1D4ED8', inkDark: '#93C5FD' },
  Resuelto: { color: '#10B981', ink: '#047857', inkDark: '#6EE7B7' },
  Cerrado: { color: '#94A3B8', ink: '#475569', inkDark: '#CBD5E1' },
};

export const FONTS = {
  heading: "'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif",
  body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

/** Control heights shared by buttons, inputs, selects and filter chips. */
export const HEIGHTS = { sm: 36, md: 40, lg: 48 } as const;

/** sx for a tinted chip (10–12% background, dark tone text). */
export const toneSx = (tone: Tone) => ({
  bgcolor: alpha(tone.color, 0.12),
  color: tone.ink,
  '[data-theme="dark"] &': { color: tone.inkDark, bgcolor: alpha(tone.color, 0.18) },
});

export function createAppTheme(mode: ThemeMode): Theme {
  const dark = mode === 'dark';
  const border = dark ? '#1E2F4A' : COLORS.border;
  const borderStrong = dark ? '#2B4163' : '#CBD5E1';
  const surface = dark ? '#111F35' : COLORS.surface;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: dark ? '#60A5FA' : COLORS.primary,
        dark: COLORS.primaryHover,
        contrastText: dark ? '#0A1628' : '#FFFFFF',
      },
      secondary: { main: COLORS.sky, contrastText: COLORS.navy },
      success: { main: dark ? '#34D399' : '#047857', contrastText: '#FFFFFF' },
      error: { main: dark ? '#F87171' : '#DC2626' },
      warning: { main: dark ? '#FBBF24' : '#B45309' },
      info: { main: dark ? '#7DD3FC' : '#0369A1' },
      background: { default: dark ? '#0A1628' : COLORS.bg, paper: surface },
      text: {
        primary: dark ? '#E2E8F0' : COLORS.text,
        secondary: dark ? '#94A3B8' : COLORS.textMuted,
      },
      divider: border,
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: FONTS.body,
      fontSize: 14,
      h1: { fontFamily: FONTS.heading, fontWeight: 600, fontSize: '1.875rem' },
      h2: { fontFamily: FONTS.heading, fontWeight: 600, fontSize: '1.5rem' },
      h3: { fontFamily: FONTS.heading, fontWeight: 600, fontSize: '1.125rem' },
      h4: { fontFamily: FONTS.heading, fontWeight: 600, fontSize: '1rem' },
      h5: { fontFamily: FONTS.heading, fontWeight: 600, fontSize: '1rem' },
      h6: { fontFamily: FONTS.heading, fontWeight: 600, fontSize: '0.9375rem' },
      subtitle2: { fontFamily: FONTS.heading, fontWeight: 600 },
      button: {
        fontFamily: FONTS.heading,
        fontWeight: 500,
        textTransform: 'none',
        fontSize: '0.875rem',
      },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            height: HEIGHTS.md,
            minWidth: 96,
            padding: '0 16px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            transition: 'background-color 140ms ease, border-color 140ms ease, color 140ms ease',
          },
          sizeSmall: { height: HEIGHTS.sm, padding: '0 12px', minWidth: 72 },
          sizeLarge: { height: HEIGHTS.lg, padding: '0 20px' },
          contained: { '&:hover': { boxShadow: 'none' } },
          outlined: {
            borderColor: borderStrong,
            color: dark ? '#E2E8F0' : COLORS.text,
            backgroundColor: surface,
            '&:hover': { borderColor: dark ? '#60A5FA' : COLORS.primary, backgroundColor: surface },
          },
          outlinedError: { color: dark ? '#FCA5A5' : '#B91C1C' },
          outlinedSuccess: { color: dark ? '#6EE7B7' : '#047857' },
          text: { minWidth: 0 },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { width: HEIGHTS.md, height: HEIGHTS.md, borderRadius: 10 } },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: `1px solid ${border}`,
            boxShadow: '0 20px 48px rgba(15,23,42,0.16)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { fontFamily: FONTS.heading, fontWeight: 600, fontSize: '1.125rem' },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '12px 24px 20px',
            gap: 8,
            '& > :not(style) ~ :not(style)': { marginLeft: 0 },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { height: 26, borderRadius: 8, fontWeight: 500, fontSize: '0.75rem' },
          sizeMedium: { height: 30 },
          label: { padding: '0 10px' },
        },
      },
      // One input height for every size: 40px, aligned with buttons.
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: surface,
            fontSize: '0.875rem',
            '&:not(.MuiInputBase-multiline):not(.MuiAutocomplete-inputRoot)': {
              height: HEIGHTS.md,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: borderStrong },
          },
          input: { padding: '0 14px' },
          multiline: { padding: '10px 14px' },
          notchedOutline: { borderColor: border },
        },
      },
      MuiSelect: {
        styleOverrides: { select: { display: 'flex', alignItems: 'center', minHeight: 0 } },
      },
      MuiAutocomplete: {
        styleOverrides: {
          // Single and multiple autocompletes keep the 40px control height.
          inputRoot: {
            minHeight: HEIGHTS.md,
            paddingTop: '4px !important',
            paddingBottom: '4px !important',
          },
          input: { padding: '6px 4px !important' },
          tag: { margin: 2, height: 24 },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: '0.875rem' },
          outlined: {
            '&:not(.MuiInputLabel-shrink)': { transform: 'translate(14px, 10px) scale(1)' },
          },
        },
      },
      MuiFormHelperText: { styleOverrides: { root: { marginLeft: 2, fontSize: '0.75rem' } } },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: HEIGHTS.md, borderBottom: `1px solid ${border}` },
          indicator: { height: 2, borderRadius: 2 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: HEIGHTS.md,
            fontFamily: FONTS.heading,
            fontWeight: 500,
            textTransform: 'none',
            fontSize: '0.875rem',
            padding: '0 16px',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: { height: HEIGHTS.sm, textTransform: 'none', fontWeight: 500, padding: '0 12px' },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 10, fontSize: '0.8125rem', alignItems: 'center' },
          outlined: { borderWidth: 1 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.75rem',
            backgroundColor: COLORS.navy,
            borderRadius: 8,
            padding: '6px 10px',
          },
        },
      },
      MuiStepIcon: {
        styleOverrides: { text: { fontFamily: FONTS.heading, fontWeight: 600 } },
      },
      MuiSkeleton: {
        styleOverrides: { root: { backgroundColor: dark ? '#16263f' : '#E8EEF6' } },
      },
    },
  });
}
