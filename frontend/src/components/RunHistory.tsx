import { useEffect, useState } from 'react';
import { RotateCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { type RunRecord } from '@/data/mock';
import { useToast } from '@/components/Toast';
import { api } from '@/services/api';

export function RunHistory() {
  const { push } = useToast();
  const [runs, setRuns] = useState<RunRecord[]>([]);

  useEffect(() => {
    // Run history is disabled in stateless backend execution mode.
    setRuns([]);
  }, []);

  const replay = (r: RunRecord) => {
    push({ title: 'Replaying run', message: `${r.name} · ${r.id}`, variant: 'info' });
    setTimeout(() => push({ title: 'Replay complete', message: r.name, variant: 'success' }), 1400);
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="border-b px-5 py-4 sm:px-6" style={{ borderColor: 'var(--border)' }}>
        <h1 className="font-[var(--font-heading)] text-2xl font-semibold" style={{ color: 'var(--heading)' }}>
          Run History
        </h1>
        <p className="text-[14px]" style={{ color: 'var(--body-muted)' }}>
          Previous orchestration runs and their verification outcomes.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden flex-1 overflow-y-auto p-5 sm:p-6 md:block">
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <Th>Run</Th>
                <Th>When</Th>
                <Th>Status</Th>
                <Th>Cost</Th>
                <Th>Latency</Th>
                <Th>Retries</Th>
                <Th>Verification</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-soft)' }} className="transition-colors hover:bg-[var(--bg-sunken)]">
                  <td>
                    <div className="flex flex-col">
                      <span className="font-[var(--font-heading)] text-[15px] font-semibold" style={{ color: 'var(--heading)' }}>
                        {r.name}
                      </span>
                      <span className="text-[12px] font-mono" style={{ color: 'var(--body-muted)' }}>{r.id}</span>
                    </div>
                  </td>
                  <td><span className="text-[14px]" style={{ color: 'var(--body-muted)' }}>{r.timestamp}</span></td>
                  <td><StatusPill status={r.status} /></td>
                  <td><span className="text-[14px] font-mono" style={{ color: 'var(--body)' }}>${r.cost.toFixed(2)}</span></td>
                  <td><span className="text-[14px] font-mono" style={{ color: 'var(--body)' }}>{r.latency}s</span></td>
                  <td>
                    <span className="text-[14px] font-mono" style={{ color: r.retries > 0 ? 'var(--warning)' : 'var(--body-muted)' }}>
                      {r.retries}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full" style={{ background: 'var(--border-soft)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${r.verification}%`,
                            background: r.verification >= 90 ? 'var(--success)' : r.verification >= 70 ? 'var(--warning)' : 'var(--error)',
                          }}
                        />
                      </div>
                      <span className="text-[14px] font-mono font-semibold" style={{ color: 'var(--body)' }}>{r.verification}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => replay(r)}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all hover:scale-[1.03]"
                      style={{ borderColor: 'var(--border)', color: 'var(--body)', background: 'var(--bg)' }}
                    >
                      <RotateCw size={13} />
                      Replay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex-1 overflow-y-auto p-4 md:hidden">
        <div className="flex flex-col gap-3">
          {runs.map((r) => (
            <div key={r.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-[var(--font-heading)] text-[16px] font-semibold" style={{ color: 'var(--heading)' }}>
                    {r.name}
                  </span>
                  <p className="text-[12px] font-mono" style={{ color: 'var(--body-muted)' }}>{r.id} · {r.timestamp}</p>
                </div>
                <StatusPill status={r.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniMetric label="Cost" value={`$${r.cost.toFixed(2)}`} />
                <MiniMetric label="Latency" value={`${r.latency}s`} />
                <MiniMetric label="Retries" value={`${r.retries}`} valueColor={r.retries > 0 ? 'var(--warning)' : undefined} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full" style={{ background: 'var(--border-soft)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${r.verification}%`,
                      background: r.verification >= 90 ? 'var(--success)' : r.verification >= 70 ? 'var(--warning)' : 'var(--error)',
                    }}
                  />
                </div>
                <span className="text-[14px] font-mono font-semibold" style={{ color: 'var(--body)' }}>{r.verification}</span>
              </div>
              <button
                onClick={() => replay(r)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-[14px] font-medium transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--body)', background: 'var(--bg)' }}
              >
                <RotateCw size={14} />
                Replay
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
      {children}
    </th>
  );
}

function MiniMetric({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-sunken)' }}>
      <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>{label}</p>
      <p className="text-[14px] font-mono font-semibold" style={{ color: valueColor || 'var(--body)' }}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: RunRecord['status'] }) {
  const map = {
    success: { icon: CheckCircle2, color: 'var(--success)', label: 'Success' },
    failure: { icon: XCircle, color: 'var(--error)', label: 'Failure' },
    partial: { icon: AlertCircle, color: 'var(--warning)', label: 'Partial' },
  } as const;
  const { icon: Icon, color, label } = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium"
      style={{ background: 'var(--bg-sunken)', color }}
    >
      <Icon size={13} />
      {label}
    </span>
  );
}
