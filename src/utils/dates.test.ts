import { describe, expect, it } from 'vitest';
import { toUtcIso } from './dates';

describe('toUtcIso', () => {
  it('reads a Kobo timestamp without zone as UTC', () => {
    expect(toUtcIso('2026-11-02T18:30:12')).toBe('2026-11-02T18:30:12.000Z');
  });

  it('keeps timestamps that already carry a zone', () => {
    expect(toUtcIso('2026-11-02T18:30:12.000Z')).toBe('2026-11-02T18:30:12.000Z');
    expect(toUtcIso('2026-11-02T12:30:12-06:00')).toBe('2026-11-02T18:30:12.000Z');
  });

  it('leaves invalid values untouched', () => {
    expect(toUtcIso('no-date')).toBe('no-date');
  });
});
