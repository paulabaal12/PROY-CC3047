const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const STORAGE_KEY = 'cag-sd:supabase-session:v1';

export interface AuthUser {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type: string;
  user: AuthUser;
}

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const isAuthRequired = import.meta.env.PROD || isSupabaseConfigured;
let session: AuthSession | null = null;
const listeners = new Set<() => void>();

function save(next: AuthSession | null) {
  session = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The current tab can still use its in-memory session.
  }
  listeners.forEach((listener) => listener());
}

function load(): AuthSession | null {
  if (session) return session;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    session = raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    session = null;
  }
  return session;
}

async function authRequest(path: string, body?: unknown): Promise<AuthSession> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Falta configurar Supabase en esta aplicación.');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const result = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    user?: AuthUser;
    msg?: string;
    message?: string;
    error_description?: string;
  };
  if (!response.ok || !result.access_token || !result.refresh_token || !result.user) {
    throw new Error(result.msg ?? result.message ?? result.error_description ?? 'No se pudo iniciar sesión.');
  }
  return {
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    expires_in: result.expires_in,
    expires_at: result.expires_in ? Math.floor(Date.now() / 1000) + result.expires_in : undefined,
    token_type: result.token_type ?? 'bearer',
    user: result.user,
  };
}

export const supabaseAuth = {
  getSession: load,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async restore(): Promise<AuthSession | null> {
    const current = load();
    if (!current) return null;
    if (!current.expires_at || current.expires_at > Date.now() / 1000 + 60) return current;
    try {
      const refreshed = await authRequest('token?grant_type=refresh_token', {
        refresh_token: current.refresh_token,
      });
      save(refreshed);
      return refreshed;
    } catch {
      save(null);
      return null;
    }
  },
  async signIn(email: string, password: string): Promise<AuthSession> {
    const next = await authRequest('token?grant_type=password', { email, password });
    save(next);
    return next;
  },
  signOut() {
    save(null);
  },
  async accessToken(): Promise<string> {
    const current = await this.restore();
    if (!current) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    return current.access_token;
  },
};

export function supabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Falta configurar Supabase.');
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}
