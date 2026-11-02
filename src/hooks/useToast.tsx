import { Alert, Snackbar, type AlertColor } from '@mui/material';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  severity: AlertColor;
}

type Notify = (message: string, severity?: AlertColor) => void;

const ToastContext = createContext<Notify | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const notify = useCallback<Notify>(
    (message, severity = 'success') => setToast({ id: Date.now(), message, severity }),
    [],
  );
  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.id}
        open={Boolean(toast)}
        autoHideDuration={4500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          variant="filled"
          severity={toast?.severity ?? 'success'}
          onClose={() => setToast(null)}
          sx={{ fontWeight: 600 }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

// Context hook lives next to its provider on purpose.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): Notify {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
