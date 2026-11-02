import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isSupabaseConfigured, supabaseAuth, type AuthSession } from '@/services/supabaseAuth';

interface SessionContextValue {
  session: AuthSession | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SupabaseSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(supabaseAuth.getSession());
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    const unsubscribe = supabaseAuth.subscribe(() => setSession(supabaseAuth.getSession()));
    void supabaseAuth.restore().finally(() => active && setLoading(false));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      loading,
      configured: isSupabaseConfigured,
      async signIn(email, password) {
        setLoading(true);
        try {
          const next = await supabaseAuth.signIn(email, password);
          const role = next.user.app_metadata?.service_desk_role;
          if (!['service-desk', 'resp-tecnico', 'resp-contenido', 'dueno'].includes(String(role))) {
            supabaseAuth.signOut();
            throw new Error('La cuenta no tiene un rol autorizado para el Service Desk.');
          }
          setSession(next);
        } finally {
          setLoading(false);
        }
      },
      signOut() {
        supabaseAuth.signOut();
        setSession(null);
      },
    }),
    [session, loading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSupabaseSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSupabaseSession must be used inside SupabaseSessionProvider');
  return context;
}
