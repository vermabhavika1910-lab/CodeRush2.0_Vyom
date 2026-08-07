import { useEffect, useState } from 'react';
import { RotateCw, CheckCircle2, XCircle, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { api } from '@/services/api';

export function RunHistory() {
  const { push } = useToast();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<any | null>(null);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const data = await api.listRuns();
      setRuns(data || []);
    } catch (err) {
      console.error(err);
      push({ title: 'Error', message: 'Failed to load runs history.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const replay = async (r: any) => {
    setIsReplaying(true);
    push({ title: 'Replaying Run', message: `Executing scenario config for run ${r.id}`, variant: 'info' });
    try {
      const result = await api.replayRun(r.id);
      setReplayResult(result);
      push({ title: 'Replay Complete', message: `Original vs Replayed deltas computed.`, variant: 'success' });
    } catch (err) {
      console.error(err);
      push({ title: 'Replay Failed', message: 'Error executing backend replay.', variant: 'error' });
    } finally {
      setIsReplaying(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed' || status === 'success') return 'var(--success)';
    if (status === 'blocked') return 'var(--error)';
    return 'var(--error)';
  };

  return (
    <div className="flex h-full min-w-0 flex-col relative">
      <div className="border-b px-5 py-4 sm:px-6 flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="font-[var(--font-heading)] text-2xl font-semibold" style={{ color: 'var(--heading)' }}>
            Run History
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--body-muted)' }}>
            Previous database-persisted runs and their execution outputs.
          </p>
        </div>
        <button 
          onClick={fetchRuns} 
          className="rounded-lg border px-3 py-1.5 text-[13px] transition-all hover:bg-[var(--bg-sunken)]"
          style={{ borderColor: 'var(--border)', color: 'var(--body)' }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[14px]" style={{ color: 'var(--body-muted)' }}>Loading histories...</span>
        </div>
      ) : runs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[14px]" style={{ color: 'var(--body-muted)' }}>No runs found in database.</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="overflow-hidden rounded-xl border animate-fade-in" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <Th>Run ID</Th>
                  <Th>Goal</Th>
                  <Th>Status</Th>
                  <Th>Cost</Th>
                  <Th>Latency</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-soft)' }} className="transition-colors hover:bg-[var(--bg-sunken)]">
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: 'var(--body-muted)' }}>{r.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[14px]" style={{ color: 'var(--heading)' }}>
                        {r.goal.length > 50 ? `${r.goal.slice(0, 50)}...` : r.goal}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-4 py-3 font-mono text-[13px]">${(r.total_cost || 0).toFixed(5)}</td>
                    <td className="px-4 py-3 font-mono text-[13px]">{((r.total_latency_ms || 0) / 1000).toFixed(2)}s</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => replay(r)}
                        disabled={isReplaying}
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all hover:scale-[1.03] disabled:opacity-50"
                        style={{ borderColor: 'var(--border)', color: 'var(--body)', background: 'var(--bg)' }}
                      >
                        <RotateCw size={13} className={isReplaying ? 'animate-spin' : ''} />
                        Replay Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side-by-Side Replay Comparison Modal */}
      {replayResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col w-full max-w-4xl h-[85%] rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-elev)' }}>
            <div className="flex justify-between items-center px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--heading)' }}>Run Replay Comparative Analysis</h3>
                <p className="text-xs" style={{ color: 'var(--body-muted)' }}>Comparing original run configuration against the replayed execution trace.</p>
              </div>
              <button 
                onClick={() => setReplayResult(null)} 
                className="p-1.5 rounded-lg hover:bg-[var(--bg-sunken)] transition-colors"
                style={{ color: 'var(--body-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Original Run Summary */}
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card)' }}>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>Original Run ({replayResult.original.id})</span>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <MiniMetric label="Status" value={replayResult.original.status.toUpperCase()} valueColor={getStatusColor(replayResult.original.status)} />
                    <MiniMetric label="Cost" value={`$${replayResult.original.total_cost.toFixed(5)}`} />
                    <MiniMetric label="Latency" value={`${(replayResult.original.total_latency_ms / 1000).toFixed(2)}s`} />
                  </div>
                </div>

                {/* Replayed Run Summary */}
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card)' }}>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>Replayed Run ({replayResult.replayed.id})</span>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <MiniMetric label="Status" value={replayResult.replayed.status.toUpperCase()} valueColor={getStatusColor(replayResult.replayed.status)} />
                    <MiniMetric label="Cost" value={`$${replayResult.replayed.total_cost.toFixed(5)}`} />
                    <MiniMetric label="Latency" value={`${(replayResult.replayed.total_latency_ms / 1000).toFixed(2)}s`} />
                  </div>
                </div>
              </div>

              {/* Handoff Steps Comparative table */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--heading)' }}>Step Trace Comparison</h4>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th className="px-4 py-2 text-left" style={{ color: 'var(--body-muted)' }}>Node ID</th>
                      <th className="px-4 py-2 text-left" style={{ color: 'var(--body-muted)' }}>Agent</th>
                      <th className="px-4 py-2 text-center" style={{ color: 'var(--body-muted)' }}>Orig. Latency</th>
                      <th className="px-4 py-2 text-center" style={{ color: 'var(--body-muted)' }}>Repl. Latency</th>
                      <th className="px-4 py-2 text-center" style={{ color: 'var(--body-muted)' }}>Latency Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {replayResult.original.steps.map((origStep: any, idx: number) => {
                      const replStep = replayResult.replayed.steps.find((s: any) => s.node_id === origStep.node_id) || {};
                      const origLat = origStep.execution_time_ms || 0;
                      const replLat = replStep.execution_time_ms || 0;
                      const delta = replLat - origLat;
                      const deltaColor = delta > 0 ? 'var(--error)' : 'var(--success)';
                      
                      return (
                        <tr key={origStep.node_id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td className="px-4 py-2.5 font-mono">{origStep.node_id}</td>
                          <td className="px-4 py-2.5 font-semibold">{origStep.node_label}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{origLat.toFixed(0)}ms</td>
                          <td className="px-4 py-2.5 text-center font-mono">{replLat.toFixed(0)}ms</td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold" style={{ color: deltaColor }}>
                            {delta >= 0 ? `+${delta.toFixed(0)}ms` : `${delta.toFixed(0)}ms`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
              <button 
                onClick={() => setReplayResult(null)} 
                className="rounded-lg border px-5 py-2 text-[14px] font-semibold transition-colors hover:bg-[var(--bg-sunken)]"
                style={{ borderColor: 'var(--border)', color: 'var(--body)' }}
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="rounded-lg border px-2.5 py-2 flex-1" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-sunken)' }}>
      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--body-muted)' }}>{label}</p>
      <p className="text-[13px] font-mono font-bold mt-0.5" style={{ color: valueColor || 'var(--body)' }}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map = {
    success: { icon: CheckCircle2, color: 'var(--success)', label: 'Success' },
    completed: { icon: CheckCircle2, color: 'var(--success)', label: 'Success' },
    running: { icon: RotateCw, color: 'var(--warning)', label: 'Running' },
    pending: { icon: AlertCircle, color: 'var(--body-muted)', label: 'Pending' },
    blocked: { icon: ShieldAlert, color: 'var(--error)', label: 'Blocked' },
    failed: { icon: XCircle, color: 'var(--error)', label: 'Failed' },
  } as const;
  
  const state = (map[status as keyof typeof map] || map.failed);
  const Icon = state.icon;
  
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium"
      style={{ background: 'var(--bg-sunken)', color: state.color }}
    >
      <Icon size={12} className={status === 'running' ? 'animate-spin' : ''} />
      {state.label}
    </span>
  );
}
