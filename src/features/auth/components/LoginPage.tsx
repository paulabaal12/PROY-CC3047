import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Alert, Button, IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import aecidLogo from '@/assets/logos/aecid.png';
import uvgLogo from '@/assets/logos/uvg.png';
import { useSupabaseSession } from '../hooks/useSupabaseSession';
import styles from './LoginPage.module.scss';

export function LoginPage() {
  const { configured, loading, session, signIn, signOut } = useSupabaseSession();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const staffRole = session?.user.app_metadata?.service_desk_role;
  if (
    session &&
    ['service-desk', 'resp-tecnico', 'resp-contenido', 'dueno'].includes(String(staffRole))
  ) {
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

  const checkCaps = (e: KeyboardEvent) => setCapsLock(e.getModifierState('CapsLock'));

  return (
    <div className={styles.page}>
      {/* Decorative background: high-contrast shapes behind the centered card. */}
      <div className={styles.scene} aria-hidden>
        <span className={styles.glow} />
        <span className={styles.glow2} />
        <svg className={styles.waves} viewBox="0 0 1440 900" preserveAspectRatio="none">
          {/* Same curve shifted down by a fixed gap: the lines stay parallel and never cross. */}
          {Array.from({ length: 24 }, (_, i) => (
            <path
              key={`top${i}`}
              transform={`translate(0 ${i * 9})`}
              d="M-40 150 C 300 260, 600 40, 920 150 S 1300 260, 1500 120"
            />
          ))}
          {Array.from({ length: 24 }, (_, i) => (
            <path
              key={`bottom${i}`}
              transform={`translate(0 ${i * 9})`}
              d="M-40 610 C 320 500, 680 760, 1000 620 S 1340 470, 1500 540"
            />
          ))}
        </svg>
      </div>

      <main className={styles.center}>
        <form className={styles.card} onSubmit={submit} noValidate>
          <p className={styles.brandName}>Service Desk</p>
          <h2>Inicia sesión</h2>
          <p className={styles.lead}>Usa la cuenta del equipo de soporte.</p>

          {!configured && (
            <Alert severity="error">
              Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {session && !staffRole && (
            <Alert severity="warning">
              Esta cuenta no tiene rol de equipo. Cierra la sesión y solicita acceso al
              administrador.
            </Alert>
          )}

          <label className={styles.label} htmlFor="login-email">
            Correo del equipo
          </label>
          <TextField
            id="login-email"
            type="email"
            autoComplete="username"
            placeholder="nombre@uvg.edu.gt"
            required
            fullWidth
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={styles.input}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <label className={styles.label} htmlFor="login-password">
            Contraseña
          </label>
          <TextField
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            fullWidth
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyUp={checkCaps}
            onKeyDown={checkCaps}
            className={styles.input}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-pressed={showPassword}
                        className={styles.eye}
                      >
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon fontSize="small" />
                        ) : (
                          <VisibilityOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />
          {capsLock && <p className={styles.caps}>Bloq Mayús está activado.</p>}

          {session ? (
            <Button
              type="button"
              variant="outlined"
              size="large"
              fullWidth
              onClick={signOut}
              className={styles.submit}
            >
              Cerrar sesión
            </Button>
          ) : (
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={!configured || loading || submitting}
              className={styles.submit}
            >
              {submitting ? 'Ingresando…' : 'Iniciar sesión'}
            </Button>
          )}

          <p className={styles.help}>
            ¿No tienes acceso? Pide al administrador que asigne tu rol de soporte.
          </p>
        </form>

        <div className={styles.logos}>
          <img src={uvgLogo} alt="Universidad del Valle de Guatemala" />
          <img src={aecidLogo} alt="AECID — Cooperación Española" />
        </div>
      </main>
    </div>
  );
}
