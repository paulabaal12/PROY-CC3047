import { DEFAULT_AVAILABILITY } from '@/config/sla';
import type { RoleId } from '@/types';
import { createBrowserStorage, readJson, STORAGE_KEYS, writeJson } from './storage';

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  /** Monthly availability reported by UptimeRobot (reference value, %). */
  availability: number;
  themeMode: ThemeMode;
}

const DEFAULT_SETTINGS: AppSettings = { availability: DEFAULT_AVAILABILITY, themeMode: 'light' };
const ROLE_IDS: RoleId[] = ['usuario', 'service-desk', 'resp-tecnico', 'resp-contenido', 'dueno'];

const storage = createBrowserStorage();

/** Per-browser preferences (simulated role, theme, availability reference). */
export const settingsService = {
  getRole(): RoleId {
    const stored = storage.getItem(STORAGE_KEYS.role) as RoleId | null;
    return stored && ROLE_IDS.includes(stored) ? stored : 'service-desk';
  },
  setRole(role: RoleId): void {
    storage.setItem(STORAGE_KEYS.role, role);
  },
  getSettings(): AppSettings {
    return {
      ...DEFAULT_SETTINGS,
      ...readJson<Partial<AppSettings>>(storage, STORAGE_KEYS.settings, {}),
    };
  },
  saveSettings(settings: AppSettings): void {
    writeJson(storage, STORAGE_KEYS.settings, settings);
  },
};
