import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseSession } from '../hooks/useSupabaseSession';

export function LoginPage() {
  const { configured, loading, session, signIn, signOut } = useSupabaseSession();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const staffRole = session?.user.app_metadata?.service_desk_role;
  if (session && ['service-desk', 'resp-tecnico', 'resp-contenido', 'dueno'].includes(String(staffRole))) {
    const destination = (location.state as { from?: string } | null)?.from ?? '/board';
    return <Navigate to={destination} replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Card sx={{ width: 'min(100%, 420px)' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack component="form" onSubmit={submit} spacing={2.5}>
            <Stack alignItems="center" spacing={1} mb={1}>
              <LockOutlinedIcon color="primary" fontSize="large" />
              <Typography variant="h5" fontWeight={700}>Service Desk</Typography>
              <Typography color="text.secondary" textAlign="center">
                Inicia sesión con la cuenta del equipo de soporte.
              </Typography>
            </Stack>
            {!configured && <Alert severity="error">Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            {session && !staffRole && <Alert severity="warning">Esta cuenta no tiene rol de equipo. Cierra la sesión y solicita acceso al administrador.</Alert>}
            <TextField label="Correo del equipo" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <TextField label="Contraseña" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            {session ? (
              <Button type="button" variant="outlined" onClick={signOut}>
                Cerrar sesión
              </Button>
            ) : <Button type="submit" variant="contained" size="large" disabled={!configured || loading || submitting}>
              {submitting ? 'Ingresando…' : 'Iniciar sesión'}
            </Button>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
