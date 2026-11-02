// Tickets ingested from KoboToolbox use the submission UUID: CAG-KB-24e8b073-43a9-….
// The full ID stays the source of truth; the UI shows a short, readable form.
const KOBO_ID = /^CAG-KB-([0-9a-f]{8})/i;

/** "CAG-KB-24e8b073-43a9-…" → "KB-24E8B0"; sequential IDs ("CAG-0028") are returned as-is. */
export function displayTicketId(id: string): string {
  const match = KOBO_ID.exec(id);
  return match?.[1] ? `KB-${match[1].slice(0, 6).toUpperCase()}` : id;
}

/** True when the short form hides part of the ID (show the full one in a tooltip). */
export const isShortenedId = (id: string): boolean => displayTicketId(id) !== id;
