import { Workflow, Sparkles, Activity, Cpu, Clock, DollarSign } from 'lucide-react';

interface RightSidebarProps {
  onOpenWorkflow: () => void;
}

export function RightSidebar({ onOpenWorkflow }: RightSidebarProps) {
  return (
    <aside
      className="hidden w-72 shrink-0 flex-col gap-4 border-l p-4 lg:flex"
      style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)' }}
    >
      <button
        onClick={onOpenWorkflow}
        className="group flex w-full items-center gap-3 rounded-xl border p-3.5 transition-all hover:scale-[1.01]"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--accent-strong)',
          boxShadow: '0 0 0 1px var(--accent-soft)',
        }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
          style={{ background: 'var(--accent-soft)' }}
        >
          <Workflow size={20} style={{ color: 'var(--brand)' }} />
        </div>
        <div className="text-left">
          <p className="font-[var(--font-heading)] text-[16px] font-semibold" style={{ color: 'var(--heading)' }}>
            Visual Workflow
          </p>
          <p className="text-[13px]" style={{ color: 'var(--body-muted)' }}>
            Open the canvas builder
          </p>
        </div>
      </button>

      <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={15} style={{ color: 'var(--brand)' }} />
          <p className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
            Active Workflow
          </p>
        </div>
        <p className="mt-2 font-[var(--font-heading)] text-[17px] font-semibold" style={{ color: 'var(--heading)' }}>
          Market Entry Brief
        </p>
        <p className="text-[13px]" style={{ color: 'var(--body-muted)' }}>
          7 nodes · 2 parallel branches
        </p>
      </div>

      <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
          Last Run
        </p>
        <div className="flex flex-col gap-2.5">
          <Stat icon={Activity} label="Status" value="VERIFIED" valueColor="var(--success)" />
          <Stat icon={Cpu} label="Tokens" value="50.8k" />
          <Stat icon={Clock} label="Latency" value="23.4s" />
          <Stat icon={DollarSign} label="Cost" value="$1.43" />
        </div>
      </div>

      <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
          Agents Online
        </p>
        <div className="flex flex-col gap-1.5">
          {['Researcher', 'Analyst', 'Verifier', 'Summarizer'].map((a, i) => (
            <div key={a} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: i === 3 ? 'var(--body-muted)' : 'var(--success)' }} />
              <span className="text-[14px]" style={{ color: 'var(--body)' }}>
                {a}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color: 'var(--body-muted)' }} />
        <span className="text-[13px]" style={{ color: 'var(--body-muted)' }}>
          {label}
        </span>
      </div>
      <span className="text-[14px] font-mono font-semibold" style={{ color: valueColor || 'var(--body)' }}>
        {value}
      </span>
    </div>
  );
}
