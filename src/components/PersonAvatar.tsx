import { Avatar } from '@mui/material';
import type { RoleId } from '@/types';

// Neutral tints from the navy/sky family; text stays dark for contrast.
const ROLE_COLOR: Record<RoleId, { bg: string; ink: string }> = {
  usuario: { bg: '#F3F4F6', ink: '#374151' },
  'service-desk': { bg: '#E8F4FB', ink: '#075985' },
  'resp-tecnico': { bg: '#EEF1F8', ink: '#182C61' },
  'resp-contenido': { bg: '#ECFDF5', ink: '#065F46' },
  dueno: { bg: '#FEF3C7', ink: '#92400E' },
};

const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export function PersonAvatar({
  name,
  role,
  size = 32,
}: {
  name: string;
  role: RoleId;
  size?: number;
}) {
  const c = ROLE_COLOR[role];
  return (
    <Avatar
      aria-hidden
      sx={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.38),
        fontWeight: 600,
        bgcolor: c.bg,
        color: c.ink,
      }}
    >
      {initials(name)}
    </Avatar>
  );
}
