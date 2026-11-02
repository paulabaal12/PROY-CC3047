import { CircularProgress, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseSession } from '../hooks/useSupabaseSession';

export function RequireSession({ children }: { children: ReactNode }) {
  const { configured, loading, session } = useSupabaseSession();
  const location = useLocation();
  if (!configured) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  const role = session?.user.app_metadata?.service_desk_role;
  if (session && ['service-desk', 'resp-tecnico', 'resp-contenido', 'dueno'].includes(String(role)))
    return <>{children}</>;
  if (loading)
    return (
      <Stack alignItems="center" justifyContent="center" minHeight="50vh" spacing={2}>
        <CircularProgress />
        <Typography color="text.secondary">Comprobando sesión…</Typography>
      </Stack>
    );
  return <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
