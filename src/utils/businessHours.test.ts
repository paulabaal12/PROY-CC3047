import { describe, expect, it } from 'vitest';
import {
  addBusinessMinutes,
  businessDaysBefore,
  businessMinutesBetween,
  DEFAULT_WINDOW,
  formatBusinessMinutes,
  isWithinServiceWindow,
  nextWindowOpening,
  type WindowConfig,
} from './businessHours';

// Guatemala is UTC-6: 08:00 local = 14:00Z, 17:00 local = 23:00Z.
const gt = (date: string, time: string) => new Date(`${date}T${time}:00-06:00`);
const NO_HOLIDAYS: WindowConfig = { ...DEFAULT_WINDOW, holidays: [] };

describe('isWithinServiceWindow', () => {
  it('lunes 8:00 a 16:59 está dentro; 17:00 ya no', () => {
    expect(isWithinServiceWindow(gt('2026-10-26', '08:00'))).toBe(true);
    expect(isWithinServiceWindow(gt('2026-10-26', '16:59'))).toBe(true);
    expect(isWithinServiceWindow(gt('2026-10-26', '17:00'))).toBe(false);
    expect(isWithinServiceWindow(gt('2026-10-26', '07:59'))).toBe(false);
  });

  it('sábado, domingo y feriados están fuera', () => {
    expect(isWithinServiceWindow(gt('2026-10-31', '10:00'))).toBe(false);
    expect(isWithinServiceWindow(gt('2026-11-01', '10:00'))).toBe(false);
    expect(isWithinServiceWindow(gt('2026-10-20', '10:00'))).toBe(false); // Día de la Revolución
    expect(isWithinServiceWindow(gt('2026-10-20', '10:00'), NO_HOLIDAYS)).toBe(true);
  });

  it('usa la hora de Guatemala, no la UTC', () => {
    // 15:30Z on Monday = 09:30 in Guatemala
    expect(isWithinServiceWindow(new Date('2026-10-26T15:30:00Z'))).toBe(true);
    // 02:00Z on Tuesday = Monday 20:00 in Guatemala
    expect(isWithinServiceWindow(new Date('2026-10-27T02:00:00Z'))).toBe(false);
  });
});

describe('businessMinutesBetween', () => {
  it('cuenta minutos dentro de la misma ventana', () => {
    expect(businessMinutesBetween(gt('2026-10-26', '09:00'), gt('2026-10-26', '10:30'))).toBe(90);
  });

  it('no corre fuera de la ventana (noche)', () => {
    expect(businessMinutesBetween(gt('2026-10-26', '16:30'), gt('2026-10-27', '08:30'))).toBe(60);
  });

  it('no corre el fin de semana', () => {
    expect(businessMinutesBetween(gt('2026-10-30', '16:00'), gt('2026-11-02', '09:00'))).toBe(120);
  });

  it('un caso recibido fuera de ventana arranca a las 8:00', () => {
    expect(businessMinutesBetween(gt('2026-10-31', '22:00'), gt('2026-11-02', '08:15'))).toBe(15);
  });

  it('salta los feriados', () => {
    // Monday 16:00 → Wednesday 09:00; Tuesday 20 Oct is a holiday
    expect(businessMinutesBetween(gt('2026-10-19', '16:00'), gt('2026-10-21', '09:00'))).toBe(120);
    expect(
      businessMinutesBetween(gt('2026-10-19', '16:00'), gt('2026-10-21', '09:00'), NO_HOLIDAYS),
    ).toBe(120 + 540);
  });

  it('devuelve 0 si el fin es anterior al inicio', () => {
    expect(businessMinutesBetween(gt('2026-10-26', '10:00'), gt('2026-10-26', '09:00'))).toBe(0);
  });

  it('una semana hábil completa son 5 × 9 h', () => {
    expect(businessMinutesBetween(gt('2026-10-26', '00:00'), gt('2026-11-01', '23:59'))).toBe(
      5 * 540,
    );
  });
});

describe('addBusinessMinutes', () => {
  it('suma dentro del mismo día', () => {
    expect(addBusinessMinutes(gt('2026-10-26', '09:00'), 15)).toEqual(gt('2026-10-26', '09:15'));
  });

  it('pasa al día hábil siguiente al cerrar la ventana', () => {
    expect(addBusinessMinutes(gt('2026-10-26', '16:00'), 4 * 60)).toEqual(
      gt('2026-10-27', '11:00'),
    );
  });

  it('un P1 del viernes 16:50 vence el lunes', () => {
    expect(addBusinessMinutes(gt('2026-10-30', '16:50'), 15)).toEqual(gt('2026-11-02', '08:05'));
  });

  it('un caso del sábado arranca el lunes a las 8:00', () => {
    expect(addBusinessMinutes(gt('2026-10-31', '11:00'), 30)).toEqual(gt('2026-11-02', '08:30'));
    expect(nextWindowOpening(gt('2026-10-31', '11:00'))).toEqual(gt('2026-11-02', '08:00'));
  });

  it('2 días hábiles = 18 h hábiles', () => {
    expect(addBusinessMinutes(gt('2026-10-26', '10:00'), 2 * 540)).toEqual(
      gt('2026-10-28', '10:00'),
    );
  });

  it('es la inversa de businessMinutesBetween', () => {
    const start = gt('2026-10-15', '13:37');
    for (const m of [1, 59, 540, 1000, 5400]) {
      expect(businessMinutesBetween(start, addBusinessMinutes(start, m))).toBe(m);
    }
  });
});

describe('businessDaysBefore', () => {
  it('retrocede días hábiles saltando el fin de semana', () => {
    const monday = businessDaysBefore(gt('2026-11-02', '10:00'), 0);
    const friday = businessDaysBefore(gt('2026-11-02', '10:00'), 1);
    expect(monday - friday).toBe(3);
  });
});

describe('formatBusinessMinutes', () => {
  it('formatea minutos, horas y días hábiles', () => {
    expect(formatBusinessMinutes(45)).toBe('45 min');
    expect(formatBusinessMinutes(200)).toBe('3 h 20 min');
    expect(formatBusinessMinutes(540 * 2 + 60)).toBe('2 d háb 1 h');
    expect(formatBusinessMinutes(0)).toBe('0 min');
  });
});
