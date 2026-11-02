import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';
import { Alert, Button, Step, StepButton, Stepper, useMediaQuery, useTheme } from '@mui/material';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HardCard, PageHeader } from '@/components';
import { SERVICES, serviceById } from '@/config/services';
import { useRole } from '@/features/auth';
import { useToast } from '@/hooks';
import { ticketService } from '@/services';
import type { CategoryId, Ticket } from '@/types';
import { STEPS, toNewTicketInput, useTicketForm } from '../hooks/useTicketForm';
import { Confirmation } from './Confirmation';
import { CategoryStep, DetailsStep, RequesterStep, TypeStep } from './FormSteps';
import { ImpactUrgencyPicker } from './ImpactUrgencyPicker';
import { PriorityPreview } from './PriorityPreview';
import styles from './NewTicketPage.module.scss';

const isCategory = (v: string | null): v is CategoryId => SERVICES.some((s) => s.id === v);

/** Remounts the form when the preset category or the active role changes. */
export function NewTicketPage() {
  const [params] = useSearchParams();
  const preset = params.get('category');
  const { role } = useRole();
  return (
    <NewTicketForm
      key={`${preset ?? ''}-${role}`}
      preset={isCategory(preset) ? preset : undefined}
    />
  );
}

function NewTicketForm({ preset }: { preset?: CategoryId }) {
  const { roleDef, actor, isInternal } = useRole();
  const notify = useToast();
  const theme = useTheme();
  const vertical = useMediaQuery(theme.breakpoints.down('md'));
  const form = useTicketForm(roleDef.persona, 'Portal/Correo', preset);
  const { state, step, errors } = form;
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Ticket | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const service = useMemo(
    () => (state.category ? serviceById(state.category) : undefined),
    [state.category],
  );
  const last = step === STEPS.length - 1;

  const submit = async () => {
    if (!form.validateAll()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const ticket = await ticketService.create(toNewTicketInput(state), actor);
      setCreated(ticket);
      notify(`Ticket ${ticket.id} registrado`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo registrar el ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <Confirmation
        ticket={created}
        onAnother={() => {
          setCreated(null);
          form.reset();
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Ingreso de ticket"
        title="Nuevo ticket"
        subtitle="Contanos qué pasa en centralamerica.games. Lo clasificamos con el catálogo de servicios y la matriz de prioridad."
      />
      <div className={styles.layout}>
        <HardCard className={styles.formCard}>
          <Stepper
            nonLinear
            activeStep={step}
            orientation={vertical ? 'vertical' : 'horizontal'}
            alternativeLabel={!vertical}
            className={styles.stepper}
          >
            {STEPS.map((label, i) => (
              <Step key={label} completed={i < step}>
                <StepButton onClick={() => i < step && form.setStep(i)} disabled={i > step}>
                  {label}
                </StepButton>
              </Step>
            ))}
          </Stepper>

          <form
            className={styles.body}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (last) void submit();
              else form.next();
            }}
          >
            {step === 0 && (
              <TypeStep value={state.type} error={errors.type} onChange={form.setType} />
            )}
            {step === 1 && state.type && (
              <CategoryStep
                type={state.type}
                value={state.category}
                error={errors.category}
                onChange={form.setCategory}
              />
            )}
            {step === 2 && service && (
              <DetailsStep
                service={service}
                state={state}
                errors={errors}
                onTitle={(v) => form.update('title', v)}
                onDescription={(v) => form.update('description', v)}
                onDetail={form.setDetail}
              />
            )}
            {step === 3 && (
              <ImpactUrgencyPicker
                service={service}
                impact={state.impact}
                urgency={state.urgency}
                onImpact={(v) => form.update('impact', v)}
                onUrgency={(v) => form.update('urgency', v)}
              />
            )}
            {step === 4 && (
              <RequesterStep
                state={state}
                errors={errors}
                canChooseChannel={isInternal}
                onName={(v) => form.update('requester', { ...state.requester, name: v })}
                onEmail={(v) => form.update('requester', { ...state.requester, email: v })}
                onChannel={(v) => form.update('channel', v)}
              />
            )}

            {Object.keys(errors).length > 0 && step === 2 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Revisá los campos marcados: faltan {Object.keys(errors).length} dato(s).
              </Alert>
            )}
            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}

            <div className={styles.actions}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={form.back}
                disabled={step === 0 || submitting}
              >
                Atrás
              </Button>
              {last ? (
                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<SendIcon />}
                  disabled={submitting}
                >
                  {submitting ? 'Enviando…' : 'Enviar ticket'}
                </Button>
              ) : (
                <Button type="submit" variant="contained" endIcon={<ArrowForwardIcon />}>
                  Siguiente
                </Button>
              )}
            </div>
          </form>
        </HardCard>

        <aside className={styles.side}>
          <PriorityPreview impact={state.impact} urgency={state.urgency} />
          {service && (
            <HardCard title="Servicio elegido" tone="accent">
              <p className={styles.sideTitle}>{service.name}</p>
              <p className={styles.sideText}>
                <strong>{service.type}.</strong> {service.justification}
              </p>
              <p className={styles.sideText}>
                <strong>Atiende:</strong> {service.handledBy}
              </p>
            </HardCard>
          )}
        </aside>
      </div>
    </>
  );
}
