import { Skeleton, Stack } from '@mui/material';

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Stack gap={1.5} aria-busy aria-label="Cargando">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={92} sx={{ borderRadius: 3 }} />
      ))}
    </Stack>
  );
}

export function PageSkeleton() {
  return (
    <Stack gap={2} aria-busy aria-label="Cargando">
      <Skeleton variant="text" width="40%" height={48} />
      <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
    </Stack>
  );
}
