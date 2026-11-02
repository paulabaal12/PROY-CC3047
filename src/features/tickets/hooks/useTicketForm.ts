import { useCallback, useMemo, useState } from 'react';
import { findStudio } from '@/config/catalogReference';
import { NEW_STUDIO, serviceById, type FieldDef } from '@/config/services';
import type {
  CategoryId,
  Channel,
  DetailValue,
  Impact,
  NewTicketInput,
  Person,
  TicketDetails,
  TicketType,
  Urgency,
} from '@/types';

export interface TicketFormState {
  type?: TicketType;
  category?: CategoryId;
  title: string;
  description: string;
  details: TicketDetails;
  impact: Impact;
  urgency: Urgency;
  channel: Channel;
  requester: Person;
}

export type FormErrors = Record<string, string>;

export const STEPS = [
  'Tipo',
  'Categoría',
  'Detalles',
  'Impacto y urgencia',
  'Solicitante',
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/\S+\.\S+/i;

const isEmpty = (v: DetailValue | undefined) =>
  v === undefined || (Array.isArray(v) ? v.length === 0 : v.trim() === '');

export function validateField(field: FieldDef, value: DetailValue | undefined): string | null {
  if (field.required && isEmpty(value)) return 'Campo obligatorio';
  if (isEmpty(value) || Array.isArray(value) || value === undefined) return null;
  if (field.kind === 'url' && !URL_RE.test(value)) return 'Ingresá un enlace válido (https://…)';
  if (field.kind === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 'Ingresá un número válido';
    if (field.id === 'fundacion' && (n < 1970 || n > new Date().getFullYear()))
      return `Año entre 1970 y ${new Date().getFullYear()}`;
  }
  return null;
}

export function validateStep(step: number, state: TicketFormState): FormErrors {
  const errors: FormErrors = {};
  if (step === 0 && !state.type) errors.type = 'Elegí si es un incidente o una solicitud';
  if (step === 1 && !state.category) errors.category = 'Elegí una categoría del catálogo';
  if (step === 2 && state.category) {
    if (state.title.trim().length < 6) errors.title = 'Escribí un título de al menos 6 caracteres';
    if (state.description.trim().length < 10)
      errors.description = 'Contá qué pasa o qué necesitás (mínimo 10 caracteres)';
    for (const field of serviceById(state.category).fields) {
      const error = validateField(field, state.details[field.id]);
      if (error) errors[`details.${field.id}`] = error;
    }
  }
  if (step === 4) {
    if (state.requester.name.trim().length < 3) errors.requesterName = 'Ingresá el nombre';
    if (!EMAIL_RE.test(state.requester.email.trim())) errors.requesterEmail = 'Correo no válido';
  }
  return errors;
}

export function toNewTicketInput(state: TicketFormState): NewTicketInput {
  if (!state.type || !state.category) throw new Error('Formulario incompleto');
  return {
    type: state.type,
    category: state.category,
    title: state.title,
    description: state.description,
    impact: state.impact,
    urgency: state.urgency,
    channel: state.channel,
    requester: { name: state.requester.name.trim(), email: state.requester.email.trim() },
    details: state.details,
  };
}

const initialState = (requester: Person, channel: Channel, category?: CategoryId): TicketFormState => {
  const svc = category ? serviceById(category) : undefined;
  return {
    type: svc?.type,
    category,
    title: '',
    description: '',
    details: {},
    impact: svc?.defaultImpact ?? 'Bajo',
    urgency: svc?.defaultUrgency ?? 'Baja',
    channel,
    requester,
  };
};

export function useTicketForm(requester: Person, channel: Channel, presetCategory?: CategoryId) {
  const [state, setState] = useState<TicketFormState>(() =>
    initialState(requester, channel, presetCategory),
  );
  const [step, setStep] = useState(presetCategory ? 2 : 0);
  const [errors, setErrors] = useState<FormErrors>({});

  const setType = useCallback((type: TicketType) => {
    setState((s) => (s.type === type ? s : { ...s, type, category: undefined, details: {} }));
    setErrors({});
  }, []);

  /** Choosing a category suggests its default impact and urgency (still editable). */
  const setCategory = useCallback((category: CategoryId) => {
    const svc = serviceById(category);
    setState((s) =>
      s.category === category
        ? s
        : { ...s, category, details: {}, impact: svc.defaultImpact, urgency: svc.defaultUrgency },
    );
    setErrors({});
  }, []);

  const setDetail = useCallback((id: string, value: DetailValue) => {
    setState((s) => {
      const details = { ...s.details, [id]: value };
      // Picking a catalog studio pre-fills its country and founding year.
      if (id === 'estudio' && typeof value === 'string' && value !== NEW_STUDIO) {
        const studio = findStudio(value);
        if (studio && s.category === 'registro') {
          details.pais = studio.country;
          details.fundacion = String(studio.founded);
        }
        if (s.details.juego) details.juego = '';
      }
      return { ...s, details };
    });
    setErrors((e) => {
      const { [`details.${id}`]: _removed, ...rest } = e;
      return rest;
    });
  }, []);

  const update = useCallback(<K extends keyof TicketFormState>(key: K, value: TicketFormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
    setErrors((e) => {
      const { [key as string]: _removed, ...rest } = e;
      return rest;
    });
  }, []);

  const next = useCallback(() => {
    const stepErrors = validateStep(step, state);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setStep((s) => Math.min(s + 1, STEPS.length - 1));
    return Object.keys(stepErrors).length === 0;
  }, [step, state]);

  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  /** Validates every step; jumps to the first one with errors. */
  const validateAll = useCallback(() => {
    for (let i = 0; i < STEPS.length; i++) {
      const stepErrors = validateStep(i, state);
      if (Object.keys(stepErrors).length) {
        setErrors(stepErrors);
        setStep(i);
        return false;
      }
    }
    return true;
  }, [state]);

  const reset = useCallback(() => {
    setState(initialState(requester, channel));
    setStep(0);
    setErrors({});
  }, [requester, channel]);

  return useMemo(
    () => ({ state, step, errors, setStep, setType, setCategory, setDetail, update, next, back, validateAll, reset }),
    [state, step, errors, setType, setCategory, setDetail, update, next, back, validateAll, reset],
  );
}
