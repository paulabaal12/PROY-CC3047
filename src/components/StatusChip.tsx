import { Chip } from '@mui/material';
import { NEUTRAL_TONE, STATUS_COLORS, toneSx } from '@/app/theme';
import type { Status, TicketType } from '@/types';

export function StatusChip({ status }: { status: Status }) {
  return <Chip size="small" label={status} sx={toneSx(STATUS_COLORS[status])} />;
}

/** Type is context, not state: neutral gray. */
export function TypeChip({ type }: { type: TicketType }) {
  return <Chip size="small" label={type} sx={toneSx(NEUTRAL_TONE)} />;
}
