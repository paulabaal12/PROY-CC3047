import { describe, expect, it } from 'vitest';
import { displayTicketId, isShortenedId } from './ticketIds';

describe('displayTicketId', () => {
  it('acorta los IDs de Kobo basados en UUID', () => {
    expect(displayTicketId('CAG-KB-24e8b073-43a9-44db-aa34-523f8a23529b')).toBe('KB-24E8B0');
    expect(isShortenedId('CAG-KB-24e8b073-43a9-44db-aa34-523f8a23529b')).toBe(true);
  });
  it('deja intactos los IDs secuenciales', () => {
    expect(displayTicketId('CAG-0028')).toBe('CAG-0028');
    expect(isShortenedId('CAG-0028')).toBe(false);
  });
});
