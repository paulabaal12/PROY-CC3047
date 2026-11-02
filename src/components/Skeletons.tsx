import { Skeleton, Stack } from '@mui/material';

export function CardListSkeleton({ count = 4, height = 48 }: { count?: number; height?: number }) {
  return (
    <Stack gap={1} aria-busy aria-label="Cargando">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={height} sx={{ borderRadius: '8px' }} />
      ))}
    </Stack>
  );
}

export function PageSkeleton() {
  return (
    <Stack gap={3} aria-busy aria-label="Cargando">
      <Stack gap={1}>
        <Skeleton variant="text" width={140} height={18} />
        <Skeleton variant="text" width="32%" height={34} />
      </Stack>
      <Skeleton variant="rounded" height={120} sx={{ borderRadius: '10px' }} />
      <Skeleton variant="rounded" height={320} sx={{ borderRadius: '10px' }} />
    </Stack>
  );
}
