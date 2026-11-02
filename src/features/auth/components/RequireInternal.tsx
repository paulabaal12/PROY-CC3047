import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components';
import { t } from '@/config/texts';
import { useRole } from '../hooks/useRole';

/** Board, editing and dashboard are only for the 4 internal roles. */
export function RequireInternal({ children }: { children: ReactNode }) {
  const { isInternal } = useRole();
  if (!isInternal) {
    return (
      <EmptyState
        icon={<LockOutlinedIcon fontSize="large" />}
        title={t.empty.restricted}
        description={t.empty.restrictedHint}
      />
    );
  }
  return <>{children}</>;
}
