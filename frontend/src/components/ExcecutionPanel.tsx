import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCw,
  Loader2,
  Clock,
  Coins,
  Cpu,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { VERIFICATION, type AgentStatus } from '@/data/mock';
import { useToast } from '@/components/Toast';
import { api } from '@/services/api';

interface ExecutionPanelProps {
  collapsed: boolean;
  onToggle: () => void;
  height?: number;
  activeRunId?: string | null;
}

export function ExecutionPanel({ collapsed, onToggle, height, activeRunId }: ExecutionPanelProps) {
  const { push } = useToast();
  const [steps, setSteps] = useState<any[]>([]);

  useEffect(() => {
    if (!activeRunId) return;
    const interval = setInterval(() => {
      api.getRun(activeRunId).then((data) => {
        // Transform backend events into steps format
        const events = data.events || [];
        const newSteps: any[] = [];
        const nodeMap: Record<string, any> = {};

        events.forEach((e: any) => {
          if (!nodeMap[e.node_id]) {
            nodeMap[e.node_id] = {
              nodeId: e.node_id,
              agent: e.node_id,
              status: 'running',
              latency: 0,
              tokens: 0,
              cost: 0,
              retries: 0,
            };
            newSteps.push(nodeMap[e.node_id]);
          }
          if (e.type === 'start') {
            nodeMap[e.node_id].status = 'running';
          } else if (e.type === 'end') {
            nodeMap[e.node_id].status = 'success';
            nodeMap[e.node_id].cost = e.data?.cost || 0;
            nodeMap[e.node_id].latency = e.data?.latency_ms || 0;
            nodeMap[e.node_id].tokens = e.data?.tokens || 0;
          }
        });
        setSteps(newSteps);
      }).catch(console.error);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRunId]);

  const retry = (nodeId: string) => {
    setSteps((s) => s.map((st) => (st.nodeId === nodeId ? { ...st, status: 'running' as AgentStatus } : st)));
    push({ title: 'Retrying agent', message: nodeId, variant: 'info' });
    setTimeout(() => {
      setSteps((s) => s.map((st) => (st.nodeId === nodeId ? { ...st, status: 'success' as AgentStatus, retries: st.retries + 1 } : st)));
      push({ title: 'Retry succeeded', message: nodeId, variant: 'success' });
    }, 1600);
  };

  return (
    <div
      className="shrink-0 border-t overflow-hidden"
      style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)', height: collapsed ? 'auto' : height }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-2.5 transition-colors hover:bg-[var(--bg-sunken)]"
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--brand)' }} />
        <span className="text-[14px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
          Execution
        </span>
        <span className="text-[13px] font-mono" style={{ color: 'var(--body-muted)' }}>
          {steps.filter((s) => s.status === 'success').length}/{steps.length} complete
        </span>
        <div className="flex-1" />
        {collapsed ? <ChevronUp size={16} style={{ color: 'var(--body-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--body-muted)' }} />}
      </button>

      {!collapsed && (
        <div className="grid grid-cols-1 gap-3 px-4 pb-4 overflow-y-auto" style={{ maxHeight: height ? height - 50 : undefined, gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
          {/* Steps */}
          <div className="flex flex-col gap-2">
            {steps.map((s) => (
              <div
                key={s.nodeId}
                className="flex items-center gap-3 rounded-lg border px-3.5 py-2.5"
                style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card)' }}
              >
                <StatusIcon status={s.status} />
                <span className="font-[var(--font-heading)] text-[15px] font-semibold" style={{ color: 'var(--heading)' }}>
                  {s.agent}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[12px] font-mono uppercase"
                  style={{ background: 'var(--bg-sunken)', color: statusColor(s.status) }}
                >
                  {s.status}
                </span>
                <div className="flex-1" />
                <MiniStat icon={Clock} value={`${(s.latency / 1000).toFixed(1)}s`} />
                <MiniStat icon={Cpu} value={`${(s.tokens / 1000).toFixed(1)}k`} />
                <MiniStat icon={Coins} value={`$${s.cost.toFixed(2)}`} />
                {s.retries > 0 && (
                  <span className="text-[13px] font-mono" style={{ color: 'var(--warning)' }}>
                    {s.retries}↻
                  </span>
                )}
                {(s.status === 'failure' || s.status === 'retry') && (
                  <button
                    onClick={() => retry(s.nodeId)}
                    className="rounded-md border p-1.5 transition-colors hover:bg-[var(--bg-sunken)]"
                    style={{ borderColor: 'var(--border-soft)', color: 'var(--warning)' }}
                    title="Retry"
                  >
                    <RotateCw size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Verification */}
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
              <span className="text-[14px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
                Verification
              </span>
              <span
                className="ml-auto rounded-full px-3 py-0.5 text-[13px] font-bold"
                style={{ background: 'var(--accent-soft)', color: 'var(--success)' }}
              >
                {VERIFICATION.status}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <ScoreRing score={VERIFICATION.score} />
              <div className="flex-1 flex flex-col gap-2">
                <CheckRow label="Schema valid" ok={VERIFICATION.schemaValid} />
                <CheckRow label="Evidence checked" ok={VERIFICATION.evidenceChecked} />
                <CheckRow label="Consistency checked" ok={VERIFICATION.consistencyChecked} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function statusColor(s: AgentStatus) {
  return s === 'success' ? 'var(--success)' : s === 'running' ? 'var(--brand)' : s === 'failure' ? 'var(--error)' : s === 'retry' ? 'var(--warning)' : 'var(--body-muted)';
}

function StatusIcon({ status }: { status: AgentStatus }) {
  const color = statusColor(status);
  if (status === 'running') return <Loader2 size={18} className="maestro-spin" style={{ color }} />;
  if (status === 'success') return <CheckCircle2 size={18} style={{ color }} />;
  if (status === 'failure') return <XCircle size={18} style={{ color }} />;
  if (status === 'retry') return <RotateCw size={18} style={{ color }} />;
  return <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />;
}

function MiniStat({ icon: Icon, value }: { icon: typeof Clock; value: string }) {
  return (
    <span className="hidden items-center gap-1 text-[13px] font-mono sm:flex" style={{ color: 'var(--body-muted)' }}>
      <Icon size={13} />
      {value}
    </span>
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ background: ok ? 'var(--success)' : 'var(--error)' }}
      >
        {ok ? <Check size={12} color="white" /> : <X size={12} color="white" />}
      </span>
      <span className="text-[14px]" style={{ color: 'var(--body)' }}>{label}</span>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border-soft)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--success)"
          strokeWidth="5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-[var(--font-heading)] text-[20px] font-bold" style={{ color: 'var(--heading)' }}>
          {score}
        </span>
      </div>
    </div>
  );
}
