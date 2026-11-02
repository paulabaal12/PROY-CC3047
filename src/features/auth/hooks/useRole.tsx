import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { isInternalRole, roleById, type RoleDef } from '@/config/roles';
import { settingsService } from '@/services';
import type { Actor, RoleId } from '@/types';
import { useSupabaseSession } from './useSupabaseSession';

interface RoleContextValue {
  role: RoleId;
  roleDef: RoleDef;
  actor: Actor;
  isInternal: boolean;
  setRole: (role: RoleId) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

/** Simulated login: the active role is persisted in localStorage. */
export function RoleProvider({ children }: { children: ReactNode }) {
  const { configured, session } = useSupabaseSession();
  const [role, setRoleState] = useState<RoleId>(() => settingsService.getRole());

  const claim = session?.user.app_metadata?.service_desk_role;
  const authenticatedRole: RoleId =
    claim === 'service-desk' ||
    claim === 'resp-tecnico' ||
    claim === 'resp-contenido' ||
    claim === 'dueno'
      ? claim
      : 'service-desk';
  const activeRole = configured ? authenticatedRole : role;

  const setRole = useCallback(
    (next: RoleId) => {
      if (configured) return;
      settingsService.setRole(next);
      setRoleState(next);
    },
    [configured],
  );

  const value = useMemo<RoleContextValue>(() => {
    const roleDef = roleById(activeRole);
    return {
      role: activeRole,
      roleDef,
      actor: {
        role: activeRole,
        name: configured ? (session?.user.email ?? roleDef.persona.name) : roleDef.persona.name,
      },
      isInternal: isInternalRole(activeRole),
      setRole,
    };
  }, [activeRole, configured, session?.user.email, setRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

// Context hook lives next to its provider on purpose.
// eslint-disable-next-line react-refresh/only-export-components
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}
