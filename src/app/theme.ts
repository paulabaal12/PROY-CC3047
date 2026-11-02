import { createTheme, type Theme } from '@mui/material/styles';
import type { ThemeMode } from '@/services';
import type { Priority } from '@/types';

export const COLORS = {
  navy: '#0A1A2E',
  navyPanel: '#0D1F36',
  navyPaper: '#102740',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  blue: '#3B82F6',
  sky: '#3AAFD3',
  skyLight: '#E0F2FE',
  bg: '#F4F8FD',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#CBD5E1',
  success: '#2DC1A5',
} as const;

export const PRIORITY_COLORS: Record<Priority, { bg: string; ink: string }> = {
  Crítica: { bg: '#E94F37', ink: '#FFFFFF' },
  Alta: { bg: '#F4A261', ink: '#0A1A2E' },
  Media: { bg: '#F4D03F', ink: '#0A1A2E' },
  Baja: { bg: '#3AAFD3', ink: '#0A1A2E' },
  Planificada: { bg: '#94A3B8', ink: '#0A1A2E' },
};

export const FONTS = {
  display: "'Archivo Black', 'Arial Black', system-ui, sans-serif",
  accent: "'DM Serif Display', Georgia, serif",
  body: "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export function createAppTheme(mode: ThemeMode): Theme {
  const dark = mode === 'dark';
  const ink = dark ? '#6FB6E8' : COLORS.navy;
  const shadow = dark ? COLORS.primary : COLORS.sky;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: dark ? COLORS.blue : COLORS.primary,
        dark: COLORS.primaryHover,
        contrastText: '#fff',
      },
      secondary: { main: COLORS.sky, contrastText: COLORS.navy },
      success: { main: dark ? COLORS.success : '#14876F', contrastText: '#fff' },
      error: { main: '#C8371F' },
      warning: { main: '#B45309' },
      background: {
        default: dark ? COLORS.navy : COLORS.bg,
        paper: dark ? COLORS.navyPanel : COLORS.surface,
      },
      text: {
        primary: dark ? '#E8EEF7' : COLORS.text,
        secondary: dark ? '#9FB2C8' : COLORS.textMuted,
      },
      divider: dark ? '#29466A' : COLORS.border,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: FONTS.body,
      h1: { fontFamily: FONTS.display, fontSize: '2rem', lineHeight: 1.1 },
      h2: { fontFamily: FONTS.display, fontSize: '1.6rem', lineHeight: 1.15 },
      h3: { fontFamily: FONTS.display, fontSize: '1.25rem' },
      h4: { fontFamily: FONTS.display, fontSize: '1.1rem' },
      h5: { fontFamily: FONTS.display, fontSize: '1rem' },
      h6: { fontFamily: FONTS.body, fontWeight: 700, fontSize: '1rem' },
      button: { fontWeight: 700, textTransform: 'none' },
      overline: { fontWeight: 700, letterSpacing: '0.08em' },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease',
          },
          contained: {
            border: `2px solid ${ink}`,
            boxShadow: `3px 3px 0 ${shadow}`,
            '&:hover': { transform: 'translate(-1px,-1px)', boxShadow: `4px 4px 0 ${shadow}` },
            '&:active': { transform: 'translate(2px,2px)', boxShadow: `1px 1px 0 ${shadow}` },
          },
          outlined: { borderWidth: 2, '&:hover': { borderWidth: 2 } },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { border: `2px solid ${ink}`, boxShadow: `6px 6px 0 ${shadow}` },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 700, borderRadius: 8 } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 10 },
          notchedOutline: { borderWidth: 2, borderColor: dark ? '#29466A' : COLORS.border },
        },
      },
      MuiTab: {
        styleOverrides: { root: { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' } },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { fontSize: '0.8rem', backgroundColor: COLORS.navy } },
      },
    },
  });
}
