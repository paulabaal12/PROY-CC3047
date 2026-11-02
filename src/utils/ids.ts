let counter = 0;

/** Short unique id for comments and history entries. */
export const uid = (): string =>
  `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const formatTicketId = (n: number): string => `CAG-${String(n).padStart(4, '0')}`;

export const parseTicketNumber = (id: string): number => Number(id.replace(/^CAG-/, '')) || 0;
