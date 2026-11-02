import { Skeleton, Stack } from '@mui/material';

export function CardListSkeleton({ count = 4, height = 96 }: { count?: number; height?: number }) {
  return (
    <Stack gap={1.5} aria-busy aria-label="Cargando">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={height} sx={{ borderRadius: '14px' }} />
      ))}
    </Stack>
  );
}

export function PageSkeleton() {
  return (
    <Stack gap={3} aria-busy aria-label="Cargando">
      <Stack gap={1}>
        <Skeleton variant="text" width={120} height={20} />
        <Skeleton variant="text" width="36%" height={40} />
      </Stack>
      <Skeleton variant="rounded" height={140} sx={{ borderRadius: '14px' }} />
      <Skeleton variant="rounded" height={280} sx={{ borderRadius: '14px' }} />
    </Stack>
  );
}
