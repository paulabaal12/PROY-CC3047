import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Switch,
  TextField,
} from '@mui/material';
import { useState, type ReactNode } from 'react';
import { PageHeader } from '@/components';
import { ROLES } from '@/config/roles';
import { SERVICE_WINDOW } from '@/config/sla';
import { useRole } from '@/features/auth';
import { useSettings, useToast } from '@/hooks';
import { ticketService } from '@/services';
import { isAuthRequired } from '@/services/supabaseAuth';
import type { RoleId } from '@/types';
import styles from './Settings.module.scss';

const ROLE_ICON: Record<RoleId, ReactNode> = {
  usuario: <PersonOutlineIcon />,
  'service-desk': <HeadsetMicOutlinedIcon />,
  'resp-tecnico': <EngineeringOutlinedIcon />,
  'resp-contenido': <FactCheckOutlinedIcon />,
  dueno: <AdminPanelSettingsOutlinedIcon />,
};

/** One settings row: title and description on the left, the control on the right. */
function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {children && <div className={styles.rowControl}>{children}</div>}
    </div>
  );
}

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
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={[{ label: 'Cuenta' }, { label: 'Configuración' }]}
        title="Configuración"
        subtitle="Preferencias de este navegador y valores de referencia del servicio."
      />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Apariencia</h2>
        <Row title="Modo noche" description="Cambia la interfaz a un tema oscuro.">
          <Switch
            checked={settings.themeMode === 'dark'}
            onChange={(e) => updateSettings({ themeMode: e.target.checked ? 'dark' : 'light' })}
            slotProps={{ input: { 'aria-label': 'Modo noche' } }}
          />
        </Row>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{isAuthRequired ? 'Acceso del equipo' : 'Rol simulado'}</h2>
        <Row
          title={roleDef.name}
          description={`Sesión de ${roleDef.persona.name}. Cámbialo desde el selector de la barra lateral.`}
        />
        {!isAuthRequired && <ul className={styles.roles}>
          {ROLES.map((r) => (
            <li key={r.id} className={r.id === roleDef.id ? styles.current : undefined}>
              <span className={styles.roleIcon} aria-hidden>
                {ROLE_ICON[r.id]}
              </span>
              <div>
                <strong>{r.name}</strong>
                <span>{r.permissions.join(' · ')}</span>
              </div>
            </li>
          ))}
        </ul>}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Disponibilidad</h2>
        <Row
          title="Disponibilidad del mes"
          description="La mide UptimeRobot; el objetivo es 99% mensual. Se muestra en el Dashboard."
        >
          <div className={styles.inline}>
            <TextField
              type="number"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              error={!validAvailability}
              disabled={!isInternal}
              className={styles.inlineField}
              slotProps={{
                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                htmlInput: { step: 0.01, min: 0, max: 100, 'aria-label': 'Disponibilidad del mes' },
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
          </div>
        </Row>
        {!validAvailability && <p className={styles.error}>Ingresa un valor entre 0 y 100.</p>}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ventana de servicio</h2>
        <Row
          title={SERVICE_WINDOW.label}
          description="El reloj del SLA solo corre dentro de la ventana; los feriados de Guatemala no cuentan."
        />
      </section>

      {!isAuthRequired && <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Datos de demostración</h2>
        <Row
          title="Restablecer datos"
          description="Borra los tickets de este navegador y vuelve a cargar los ~28 tickets de ejemplo."
        >
          <Button
            variant="outlined"
            color="error"
            startIcon={<RestartAltIcon />}
            onClick={() => setConfirm(true)}
          >
            Restablecer
          </Button>
        </Row>
      </section>}

      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>¿Restablecer los datos?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se perderán los tickets, comentarios y cambios hechos en este navegador. No se puede
            deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirm(false)}>
            Cancelar
          </Button>
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
    </div>
  );
}
