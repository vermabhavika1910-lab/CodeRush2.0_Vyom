import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface Toast {
  id: number;
  title: string;
  message?: string;
  variant: 'success' | 'error' | 'info' | 'warning';
}

interface ToastCtx {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastCtx>({ toasts: [], push: () => {}, dismiss: () => {} });

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { ...t, id }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2.5rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="maestro-slide-in flex items-start gap-3 rounded-xl border p-3.5 backdrop-blur-md"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <ToastIcon variant={t.variant} />
          <div className="min-w-0 flex-1">
            <p
              className="font-[var(--font-heading)] text-[15px] font-semibold leading-tight"
              style={{ color: 'var(--heading)' }}
            >
              {t.title}
            </p>
            {t.message && (
              <p className="mt-0.5 text-[13px] leading-snug" style={{ color: 'var(--body-muted)' }}>
                {t.message}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 rounded-md p-1 transition-colors hover:bg-[var(--bg-sunken)]"
            style={{ color: 'var(--body-muted)' }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ToastIcon({ variant }: { variant: Toast['variant'] }) {
  const color =
    variant === 'success'
      ? 'var(--success)'
      : variant === 'error'
        ? 'var(--error)'
        : variant === 'warning'
          ? 'var(--warning)'
          : 'var(--info)';
  const Icon =
    variant === 'success'
      ? CheckCircle2
      : variant === 'error' || variant === 'warning'
        ? AlertTriangle
        : Info;
  return (
    <span className="mt-0.5 shrink-0" style={{ color }}>
      <Icon size={18} />
    </span>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
