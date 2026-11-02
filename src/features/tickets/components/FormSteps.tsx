import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import { Alert, Chip, MenuItem, TextField } from '@mui/material';
import { PRIORITY_MATRIX } from '@/config/priorityMatrix';
import { CHANNELS } from '@/config/roles';
import { servicesOfType, type ServiceDef } from '@/config/services';
import type { CategoryId, Channel, TicketType } from '@/types';
import type { FormErrors, TicketFormState } from '../hooks/useTicketForm';
import { ChoiceCard } from './ChoiceCard';
import { DynamicField } from './DynamicField';
import styles from './FormSteps.module.scss';

export function TypeStep({
  value,
  error,
  onChange,
}: {
  value?: TicketType;
  error?: string;
  onChange: (t: TicketType) => void;
}) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>¿Qué necesitas reportar?</legend>
      <div className={styles.grid2}>
        <ChoiceCard
          name="type"
          value="Incidente"
          selected={value === 'Incidente'}
          onSelect={() => onChange('Incidente')}
          icon={<ReportProblemOutlinedIcon />}
          title="Incidente"
          description="Algo que debería funcionar dejó de hacerlo: el sitio no carga, la búsqueda falla o una ficha está rota."
          meta={<Chip size="small" label="3 incidentes tipificados" />}
        />
        <ChoiceCard
          name="type"
          value="Solicitud"
          selected={value === 'Solicitud'}
          onSelect={() => onChange('Solicitud')}
          icon={<AssignmentOutlinedIcon />}
          title="Solicitud de servicio"
          description="Nada está roto: pides algo previsto, como registrar un juego, actualizar una ficha o extraer datos."
          meta={<Chip size="small" label="4 solicitudes del catálogo" />}
        />
      </div>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </fieldset>
  );
}

export function CategoryStep({
  type,
  value,
  error,
  onChange,
}: {
  type: TicketType;
  value?: CategoryId;
  error?: string;
  onChange: (c: CategoryId) => void;
}) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        {type === 'Incidente' ? 'Elige el incidente tipificado' : 'Elige la solicitud del catálogo'}
      </legend>
      <div className={styles.grid2}>
        {servicesOfType(type).map((svc) => (
          <ChoiceCard
            key={svc.id}
            name="category"
            value={svc.id}
            selected={value === svc.id}
            onSelect={() => onChange(svc.id)}
            title={svc.name}
            description={svc.justification}
            meta={
              <Chip
                size="small"
                variant="outlined"
                label={`Sugerido: ${PRIORITY_MATRIX[svc.defaultImpact][svc.defaultUrgency].priority}`}
              />
            }
          />
        ))}
      </div>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </fieldset>
  );
}

const TITLE_PLACEHOLDER: Record<CategoryId, string> = {
  registro: 'p. ej. Alta de estudio: Nombre del estudio',
  actualizacion: 'p. ej. Corregir plataformas de un juego',
  'mantenimiento-bd': 'p. ej. Normalizar nombres de plataformas',
  extraccion: 'p. ej. CSV de estudios de Costa Rica',
  'sitio-no-disponible': 'p. ej. El sitio no carga (error 404)',
  'busqueda-lenta': 'p. ej. El filtro por país no responde',
  'ficha-corrupta': 'p. ej. La capsule de un juego no carga',
};

export function DetailsStep({
  service,
  state,
  errors,
  onTitle,
  onDescription,
  onDetail,
}: {
  service: ServiceDef;
  state: TicketFormState;
  errors: FormErrors;
  onTitle: (v: string) => void;
  onDescription: (v: string) => void;
  onDetail: (id: string, v: string | string[]) => void;
}) {
  return (
    <div className={styles.stack}>
      <p className={styles.hint}>{service.name}</p>
      <div className={styles.fields}>
        <TextField
          className={styles.full}
          label="Título *"
          value={state.title}
          onChange={(e) => onTitle(e.target.value)}
          error={Boolean(errors.title)}
          helperText={errors.title}
          placeholder={TITLE_PLACEHOLDER[service.id]}
        />
        <TextField
          className={styles.full}
          label="Descripción *"
          value={state.description}
          onChange={(e) => onDescription(e.target.value)}
          error={Boolean(errors.description)}
          helperText={
            errors.description ?? 'Qué pasa o qué necesitas, con el mayor detalle posible.'
          }
          multiline
          minRows={3}
        />
        <h3 className={`${styles.sectionTitle} ${styles.full}`}>Campos de {service.shortName}</h3>
        {service.fields.map((field) => (
          <div
            key={field.id}
            className={field.kind === 'textarea' || field.kind === 'file' ? styles.full : undefined}
          >
            <DynamicField
              field={field}
              value={state.details[field.id]}
              details={state.details}
              error={errors[`details.${field.id}`]}
              onChange={(v) => onDetail(field.id, v)}
            />
          </div>
        ))}
      </div>
      {service.id === 'registro' && (
        <Alert severity="info" variant="outlined">
          Son los campos obligatorios de una ficha (Fase 1): la solicitud no se envía con alguno
          vacío.
        </Alert>
      )}
    </div>
  );
}

export function RequesterStep({
  state,
  errors,
  canChooseChannel,
  onName,
  onEmail,
  onChannel,
}: {
  state: TicketFormState;
  errors: FormErrors;
  canChooseChannel: boolean;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onChannel: (c: Channel) => void;
}) {
  return (
    <div className={styles.stack}>
      <div className={styles.fields}>
        <TextField
          label="Nombre del solicitante *"
          value={state.requester.name}
          onChange={(e) => onName(e.target.value)}
          error={Boolean(errors.requesterName)}
          helperText={errors.requesterName}
          autoComplete="name"
        />
        <TextField
          label="Correo *"
          type="email"
          value={state.requester.email}
          onChange={(e) => onEmail(e.target.value)}
          error={Boolean(errors.requesterEmail)}
          helperText={errors.requesterEmail ?? 'Te avisaremos por aquí de cada avance.'}
          autoComplete="email"
        />
        <TextField
          select
          label="Canal de ingreso"
          value={state.channel}
          onChange={(e) => onChannel(e.target.value as Channel)}
          disabled={!canChooseChannel}
          helperText={
            canChooseChannel
              ? 'Service Desk registra aquí los casos que llegan por otros canales.'
              : 'Los usuarios registran por el portal.'
          }
          className={styles.full}
        >
          {CHANNELS.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.id} — {c.description}
            </MenuItem>
          ))}
        </TextField>
      </div>
    </div>
  );
}
