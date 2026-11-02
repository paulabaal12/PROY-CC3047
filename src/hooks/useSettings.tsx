import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { settingsService, type AppSettings } from '@/services';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => settingsService.getSettings());

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      settingsService.saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// Context hook lives next to its provider on purpose.
// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
