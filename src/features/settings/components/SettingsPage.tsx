import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { HardCard, PageHeader } from '@/components';
import { ROLES } from '@/config/roles';
import { SERVICE_WINDOW } from '@/config/sla';
import { useRole } from '@/features/auth';
import { useSettings, useToast } from '@/hooks';
import { ticketService } from '@/services';
import styles from './Settings.module.scss';

export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { isInternal, roleDef } = useRole();
  const notify = useToast();
  const [availability, setAvailability] = useState(String(settings.availability));
  const [confirm, setConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const value = Number(availability);
  const validAvailability = Number.isFinite(value) && value >= 0 && value <= 100;

  const reset = async () => {
    setResetting(true);
    const data = await ticketService.resetDemoData();
    setResetting(false);
    setConfirm(false);
    notify(`Datos de demostración restablecidos (${data.length} tickets)`);
  };

  return (
    <>
      <PageHeader eyebrow="Preferencias" title="Configuración" />
      <div className={styles.grid}>
        <HardCard title="Apariencia">
          <FormControlLabel
            control={
              <Switch
                checked={settings.themeMode === 'dark'}
                onChange={(e) => updateSettings({ themeMode: e.target.checked ? 'dark' : 'light' })}
              />
            }
            label="Modo noche (navy del sitio)"
          />
        </HardCard>

        <HardCard title="Rol simulado">
          <p className={styles.text}>
            Activo: <strong>{roleDef.name}</strong> ({roleDef.persona.name}). Cambialo desde el
            selector de la barra lateral.
          </p>
          <ul className={styles.roles}>
            {ROLES.map((r) => (
              <li key={r.id}>
                <strong>{r.name}:</strong> {r.permissions.join(' · ')}
              </li>
            ))}
          </ul>
        </HardCard>

        <HardCard title="Disponibilidad de referencia (UptimeRobot)">
          <p className={styles.text}>
            El objetivo de disponibilidad (≥ 99% mensual) lo mide UptimeRobot. Registrá aquí el
            valor del mes para el Dashboard.
          </p>
          <Stack direction="row" gap={1} alignItems="flex-start">
            <TextField
              size="small"
              type="number"
              label="Disponibilidad del mes"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              error={!validAvailability}
              helperText={validAvailability ? ' ' : 'Entre 0 y 100'}
              disabled={!isInternal}
              slotProps={{
                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                htmlInput: { step: 0.01, min: 0, max: 100 },
              }}
            />
            <Button
              variant="contained"
              disabled={!isInternal || !validAvailability || value === settings.availability}
              onClick={() => {
                updateSettings({ availability: value });
                notify('Disponibilidad actualizada');
              }}
            >
              Guardar
            </Button>
          </Stack>
        </HardCard>

        <HardCard title="Ventana de servicio">
          <p className={styles.text}>
            {SERVICE_WINDOW.label}. Los feriados de Guatemala no cuentan para el SLA.
          </p>
        </HardCard>

        <HardCard title="Datos de demostración" tone="danger">
          <p className={styles.text}>
            Borra los tickets guardados en este navegador y vuelve a cargar los ~28 tickets de
            ejemplo (fechas de las últimas 3 semanas).
          </p>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RestartAltIcon />}
            onClick={() => setConfirm(true)}
          >
            Restablecer datos de demostración
          </Button>
        </HardCard>
      </div>

      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>¿Restablecer los datos?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se perderán los tickets, comentarios y cambios hechos en este navegador. No se puede
            deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void reset()}
            disabled={resetting}
          >
            Restablecer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
