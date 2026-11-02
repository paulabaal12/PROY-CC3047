import { alpha, createTheme, type Theme } from '@mui/material/styles';
import type { ThemeMode } from '@/services';
import type { Priority, Status } from '@/types';

export const COLORS = {
  bg: '#F6F7F9',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  text: '#111827',
  text2: '#6B7280',
  text3: '#9CA3AF',
  primary: '#182C61',
  primaryHover: '#12204A',
  primaryActive: '#0D1938',
  primaryTint: '#EEF1F8',
  accent: '#3BA7DC',
  accentTint: '#E8F4FB',
  success: '#059669',
} as const;

/** Blue ramp for single-series charts and categories. */
export const BLUE_RAMP = ['#182C61', '#2F5597', '#4F86C6', '#7FB2E0', '#B5D5EE'] as const;

/** Tinted chip colors: `color` for dots/bars, `ink` (light) and `inkDark` (dark mode) for text. */
export interface Tone {
  color: string;
  ink: string;
  inkDark: string;
}

export const PRIORITY_COLORS: Record<Priority, Tone> = {
  Crítica: { color: '#DC2626', ink: '#991B1B', inkDark: '#FCA5A5' },
  Alta: { color: '#EA580C', ink: '#9A3412', inkDark: '#FDBA74' },
  Media: { color: '#CA8A04', ink: '#854D0E', inkDark: '#FDE047' },
  Baja: { color: '#0284C7', ink: '#075985', inkDark: '#7DD3FC' },
  Planificada: { color: '#9CA3AF', ink: '#4B5563', inkDark: '#D1D5DB' },
};

export const STATUS_COLORS: Record<Status, Tone> = {
  Abierto: { color: '#3BA7DC', ink: '#075985', inkDark: '#7DD3FC' },
  'En progreso': { color: '#182C61', ink: '#182C61', inkDark: '#A5CBEC' },
  Resuelto: { color: '#059669', ink: '#065F46', inkDark: '#6EE7B7' },
  Cerrado: { color: '#9CA3AF', ink: '#4B5563', inkDark: '#D1D5DB' },
};

export const NEUTRAL_TONE: Tone = { color: '#6B7280', ink: '#374151', inkDark: '#D1D5DB' };

export const FONTS = {
  heading: "'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif",
  body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

/** Control heights: standard, compact and the main form CTA. */
export const HEIGHTS = { compact: 32, md: 36, cta: 44 } as const;

/** sx for a tinted chip (10% background, dark tone text). */
export const toneSx = (tone: Tone) => ({
  bgcolor: alpha(tone.color, 0.1),
  color: tone.ink,
  '[data-theme="dark"] &': { color: tone.inkDark, bgcolor: alpha(tone.color, 0.18) },
});

const OVERLAY_SHADOW = '0 8px 24px rgba(17,24,39,0.12)';

export function createAppTheme(mode: ThemeMode): Theme {
  const dark = mode === 'dark';
  const c = dark
    ? {
        bg: '#0A0F1A',
        surface: '#0F1623',
        border: '#1F2937',
        borderStrong: '#374151',
        text: '#E5E7EB',
        text2: '#9CA3AF',
        primary: '#7FB2E0',
        primaryHover: '#A5CBEC',
        primaryActive: '#5E98CF',
        onPrimary: '#0A0F1A',
        disabledBg: '#1A2332',
        disabledText: '#6B7280',
      }
    : {
        bg: COLORS.bg,
        surface: COLORS.surface,
        border: COLORS.border,
        borderStrong: COLORS.borderStrong,
        text: COLORS.text,
        text2: COLORS.text2,
        primary: COLORS.primary,
        primaryHover: COLORS.primaryHover,
        primaryActive: COLORS.primaryActive,
        onPrimary: '#FFFFFF',
        disabledBg: '#F3F4F6',
        disabledText: COLORS.text3,
      };

  return createTheme({
    palette: {
      mode,
      primary: { main: c.primary, dark: c.primaryHover, contrastText: c.onPrimary },
      secondary: { main: COLORS.accent, contrastText: '#FFFFFF' },
      success: { main: dark ? '#34D399' : COLORS.success, contrastText: '#FFFFFF' },
      error: { main: dark ? '#F87171' : '#DC2626' },
      warning: { main: dark ? '#FBBF24' : '#B45309' },
      info: { main: dark ? '#7DD3FC' : '#0369A1' },
      background: { default: c.bg, paper: c.surface },
      text: { primary: c.text, secondary: c.text2 },
      divider: c.border,
      action: { disabledBackground: c.disabledBg, disabled: c.disabledText },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: FONTS.body,
      fontSize: 14,
      h1: { fontFamily: FONTS.heading, fontWeight: 600, fontSize: '1.5rem' },
      h2: { fontFamily: FONTS.heading, fontWeight: 600, fontSize: '1rem' },
      h3: { fontFamily: FONTS.body, fontWeight: 600, fontSize: '0.9375rem' },
      subtitle2: { fontWeight: 600 },
      button: {
        fontFamily: FONTS.body,
        fontWeight: 500,
        textTransform: 'none',
        fontSize: '0.875rem',
      },
    },
    components: {
      MuiButtonBase: { defaultProps: { disableRipple: true } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            height: HEIGHTS.md,
            minWidth: 0,
            padding: '0 14px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            transition: 'background-color 120ms ease, border-color 120ms ease, color 120ms ease',
            '&.Mui-disabled': {
              backgroundColor: c.disabledBg,
              color: c.disabledText,
              borderColor: c.disabledBg,
            },
          },
          sizeSmall: { height: HEIGHTS.compact, padding: '0 10px', fontSize: '0.8125rem' },
          sizeLarge: { height: HEIGHTS.cta, padding: '0 20px' },
          contained: {
            '&:hover': { boxShadow: 'none' },
            '&:active': { backgroundColor: c.primaryActive },
          },
          outlined: {
            borderColor: c.borderStrong,
            color: c.text,
            backgroundColor: c.surface,
            '&:hover': {
              borderColor: c.borderStrong,
              backgroundColor: dark ? '#131C2B' : '#F9FAFB',
            },
          },
          outlinedError: { color: dark ? '#FCA5A5' : '#B91C1C' },
          outlinedSuccess: { color: dark ? '#6EE7B7' : '#047857' },
          text: {
            color: c.text2,
            '&:hover': { backgroundColor: dark ? '#131C2B' : '#F3F4F6', color: c.text },
          },
          textPrimary: { color: c.primary },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { width: HEIGHTS.md, height: HEIGHTS.md, borderRadius: 8, color: c.text2 },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { border: `1px solid ${c.border}`, boxShadow: `${OVERLAY_SHADOW} !important` },
        },
      },
      MuiPopover: {
        styleOverrides: { paper: { boxShadow: OVERLAY_SHADOW, border: `1px solid ${c.border}` } },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: { boxShadow: OVERLAY_SHADOW, border: `1px solid ${c.border}` },
          // Single and multiple autocompletes keep the 36px control height.
          inputRoot: {
            minHeight: HEIGHTS.md,
            paddingTop: '2px !important',
            paddingBottom: '2px !important',
          },
          input: { padding: '6px 4px !important' },
          tag: { margin: 2, height: 24 },
        },
      },
      MuiMenuItem: {
        styleOverrides: { root: { fontSize: '0.875rem', minHeight: 36 } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 10, border: `1px solid ${c.border}`, boxShadow: OVERLAY_SHADOW },
        },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontFamily: FONTS.heading, fontWeight: 600, fontSize: '1rem' } },
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
          root: { height: 22, borderRadius: 6, fontWeight: 500, fontSize: '0.75rem' },
          sizeMedium: { height: 26 },
          label: { padding: '0 8px' },
          outlined: { borderColor: c.border },
        },
      },
      // One input height for every size: 36px, aligned with buttons.
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: c.surface,
            fontSize: '0.875rem',
            '&:not(.MuiInputBase-multiline):not(.MuiAutocomplete-inputRoot)': {
              height: HEIGHTS.md,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: dark ? '#4B5563' : '#9CA3AF',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: COLORS.accent,
              borderWidth: 1,
            },
          },
          input: { padding: '0 12px' },
          multiline: { padding: '8px 12px' },
          notchedOutline: { borderColor: c.borderStrong },
        },
      },
      MuiSelect: {
        styleOverrides: { select: { display: 'flex', alignItems: 'center', minHeight: 0 } },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            '&.Mui-focused': { color: dark ? '#7FB2E0' : COLORS.primary },
          },
          outlined: {
            '&:not(.MuiInputLabel-shrink)': { transform: 'translate(12px, 8px) scale(1)' },
          },
        },
      },
      MuiFormHelperText: { styleOverrides: { root: { marginLeft: 2, fontSize: '0.75rem' } } },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: HEIGHTS.md, borderBottom: `1px solid ${c.border}` },
          indicator: { height: 2, backgroundColor: c.primary },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: HEIGHTS.md,
            fontWeight: 500,
            textTransform: 'none',
            fontSize: '0.875rem',
            padding: '0 12px',
            color: c.text2,
            '&.Mui-selected': { color: c.text },
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? '#131C2B' : '#F3F4F6',
            borderRadius: 8,
            padding: 2,
            gap: 2,
          },
          grouped: { border: 0, borderRadius: '6px !important' },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            height: HEIGHTS.compact - 4,
            padding: '0 10px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.8125rem',
            color: c.text2,
            border: 0,
            '&.Mui-selected': {
              backgroundColor: c.surface,
              color: c.text,
              boxShadow: `0 0 0 1px ${c.border}`,
              '&:hover': { backgroundColor: c.surface },
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 8, fontSize: '0.8125rem', alignItems: 'center' },
          outlined: { borderWidth: 1 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.75rem',
            backgroundColor: '#111827',
            borderRadius: 6,
            padding: '6px 8px',
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked + .MuiSwitch-track': { backgroundColor: c.primary, opacity: 1 },
          },
        },
      },
      MuiStepIcon: {
        styleOverrides: {
          root: {
            color: dark ? '#374151' : '#D1D5DB',
            '&.Mui-active, &.Mui-completed': { color: c.primary },
          },
          text: { fontWeight: 600, fill: '#FFFFFF' },
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          label: {
            fontSize: '0.8125rem',
            color: c.text2,
            '&.Mui-active, &.Mui-completed': { color: c.text, fontWeight: 500 },
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: { root: { backgroundColor: dark ? '#1A2332' : '#EEF0F4' } },
      },
      MuiDrawer: {
        styleOverrides: { paper: { borderRight: `1px solid ${c.border}` } },
      },
    },
  });
}
