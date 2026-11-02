import { Avatar } from '@mui/material';
import type { RoleId } from '@/types';

// Soft tinted backgrounds per role, with dark text for contrast.
const ROLE_COLOR: Record<RoleId, { bg: string; ink: string }> = {
  usuario: { bg: '#E2E8F0', ink: '#334155' },
  'service-desk': { bg: '#E0F2FE', ink: '#0369A1' },
  'resp-tecnico': { bg: '#DBEAFE', ink: '#1D4ED8' },
  'resp-contenido': { bg: '#D1FAE5', ink: '#047857' },
  dueno: { bg: '#FFEDD5', ink: '#C2410C' },
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
  size = 36,
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
        fontSize: size * 0.36,
        fontWeight: 600,
        fontFamily: "'Poppins', sans-serif",
        bgcolor: c.bg,
        color: c.ink,
      }}
    >
      {initials(name)}
    </Avatar>
  );
}
