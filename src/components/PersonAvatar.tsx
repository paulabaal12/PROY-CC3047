import { Avatar } from '@mui/material';
import type { RoleId } from '@/types';

const ROLE_COLOR: Record<RoleId, string> = {
  usuario: '#94A3B8',
  'service-desk': '#3AAFD3',
  'resp-tecnico': '#2563EB',
  'resp-contenido': '#2DC1A5',
  dueno: '#F4A261',
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
  return (
    <Avatar
      aria-hidden
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 800,
        bgcolor: ROLE_COLOR[role],
        color: '#0A1A2E',
        border: '2px solid #0A1A2E',
      }}
    >
      {initials(name)}
    </Avatar>
  );
}
