import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect, useMemo, type ReactNode } from 'react';
import { RoleProvider, SupabaseSessionProvider } from '@/features/auth';
import { SettingsProvider, ToastProvider, useSettings } from '@/hooks';
import { createAppTheme } from './theme';

function ThemedApp({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const theme = useMemo(() => createAppTheme(settings.themeMode), [settings.themeMode]);

  // SCSS modules read the same mode through CSS variables.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.themeMode;
  }, [settings.themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SupabaseSessionProvider>
      <SettingsProvider>
        <ThemedApp>
          <RoleProvider>
            <ToastProvider>{children}</ToastProvider>
          </RoleProvider>
        </ThemedApp>
      </SettingsProvider>
    </SupabaseSessionProvider>
  );
}
