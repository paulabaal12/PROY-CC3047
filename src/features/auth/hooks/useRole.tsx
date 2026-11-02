import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { isInternalRole, roleById, type RoleDef } from '@/config/roles';
import { settingsService } from '@/services';
import type { Actor, RoleId } from '@/types';

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
  const [role, setRoleState] = useState<RoleId>(() => settingsService.getRole());

  const setRole = useCallback((next: RoleId) => {
    settingsService.setRole(next);
    setRoleState(next);
  }, []);

  const value = useMemo<RoleContextValue>(() => {
    const roleDef = roleById(role);
    return {
      role,
      roleDef,
      actor: { role, name: roleDef.persona.name },
      isInternal: isInternalRole(role),
      setRole,
    };
  }, [role, setRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

// Context hook lives next to its provider on purpose.
// eslint-disable-next-line react-refresh/only-export-components
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}
