import { Tooltip } from '@mui/material';
import { displayTicketId, isShortenedId } from '@/utils/ticketIds';

/** Short, readable ticket ID; the full database ID appears on hover when it was shortened. */
export function TicketId({ id, className }: { id: string; className?: string }) {
  const short = <span className={className}>{displayTicketId(id)}</span>;
  return isShortenedId(id) ? <Tooltip title={id}>{short}</Tooltip> : short;
}
