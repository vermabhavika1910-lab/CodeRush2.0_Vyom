import { useState } from 'react';
import { X, Cpu, Clock, Coins, Lock, Wrench, Brain, MousePointerClick, ShieldCheck } from 'lucide-react';
import { Dropdown } from '@/components/Dropdown';
import { AGENTS, MODELS, type AgentDef } from '@/data/mock';

interface AgentInspectorProps {
  agent: AgentDef | null;
  onClose: () => void;
  width?: number;
  drawer?: boolean;
  drawerOpen?: boolean;
  onCloseDrawer?: () => void;
}

type Tab = 'config' | 'schema' | 'tools';

export function AgentInspector({ agent, onClose, width = 360, drawer = false, drawerOpen = false, onCloseDrawer }: AgentInspectorProps) {
  const [tab, setTab] = useState<Tab>('config');
  const [model, setModel] = useState(agent?.model || MODELS[0]);
  const [memory, setMemory] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    (agent?.permissions || []).reduce((acc, p) => ({ ...acc, [p]: true }), {} as Record<string, boolean>),
  );

  const body = (
    <>
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
            Agent Inspector
          </p>
          <h3 className="font-[var(--font-heading)] text-[19px] font-semibold truncate" style={{ color: 'var(--heading)' }}>
            {agent ? agent.name : 'No Selection'}
          </h3>
        </div>
        {agent && (
          <button onClick={drawer ? onCloseDrawer : onClose} className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-[var(--bg-sunken)]" style={{ color: 'var(--body-muted)' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {agent ? (
        <>
          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            {(['config', 'schema', 'tools'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 text-[14px] font-medium capitalize transition-colors"
                style={{
                  color: tab === t ? 'var(--heading)' : 'var(--body-muted)',
                  borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {tab === 'config' && (
              <div className="flex flex-col gap-5">
                <Field label="Name">
                  <input
                    defaultValue={agent.name}
                    className="w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-[15px] outline-none focus:border-[var(--accent-strong)]"
                    style={{ borderColor: 'var(--border-soft)', color: 'var(--body)' }}
                  />
                </Field>
                <Field label="Role">
                  <p className="text-[15px]" style={{ color: 'var(--body)' }}>{agent.role}</p>
                </Field>
                <Field label="Model">
                  <Dropdown value={model} options={MODELS} onChange={setModel} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Token budget">
                    <Metric icon={Coins} value={agent.tokenBudget.toLocaleString()} />
                  </Field>
                  <Field label="Timeout">
                    <Metric icon={Clock} value={`${agent.timeout}s`} />
                  </Field>
                </div>
                <Field label="Memory">
                  <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5" style={{ borderColor: 'var(--border-soft)' }}>
                    <span className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--body)' }}>
                      <Brain size={16} style={{ color: 'var(--accent-strong)' }} />
                      {agent.memory}
                    </span>
                    <Toggle on={memory} onToggle={() => setMemory((m) => !m)} />
                  </div>
                </Field>
                <Field label="Permissions">
                  <div className="flex flex-col gap-2">
                    {['network:read', 'storage:read', 'compute:exec', 'read:all'].map((p) => (
                      <div key={p} className="flex items-center justify-between rounded-lg border px-3.5 py-2" style={{ borderColor: 'var(--border-soft)' }}>
                        <span className="flex items-center gap-2 text-[14px] font-mono" style={{ color: 'var(--body)' }}>
                          <Lock size={14} style={{ color: 'var(--body-muted)' }} />
                          {p}
                        </span>
                        <Toggle on={!!permissions[p]} onToggle={() => setPermissions((prev) => ({ ...prev, [p]: !prev[p] }))} />
                      </div>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {tab === 'schema' && (
              <div className="flex flex-col gap-5">
                <SchemaBlock title="Input schema" rows={agent.inputSchema} />
                <SchemaBlock title="Output schema" rows={agent.outputSchema} />
              </div>
            )}

            {tab === 'tools' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Wrench size={16} style={{ color: 'var(--accent-strong)' }} />
                  <span className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
                    Available tools
                  </span>
                </div>
                {agent.tools.map((t) => (
                  <div key={t} className="flex items-center justify-between rounded-lg border px-3.5 py-2.5" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card)' }}>
                    <span className="font-mono text-[14px]" style={{ color: 'var(--body)' }}>{t}</span>
                    <span className="rounded-full px-2.5 py-0.5 text-[12px] font-mono" style={{ background: 'var(--accent-soft)', color: 'var(--success)' }}>
                      enabled
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <DefaultInspector />
      )}
    </>
  );

  if (drawer) {
    return (
      <>
        <div
          className="fixed inset-0 z-[140]"
          style={{ background: 'rgba(0,0,0,0.5)', opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? 'auto' : 'none', transition: 'opacity 0.25s' }}
          onClick={onCloseDrawer}
        />
        <div
          className="fixed right-0 top-0 z-[150] h-full"
          style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', maxWidth: '90vw' }}
        >
          <div className="flex h-full flex-col border-l" style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)', width: '100%' }}>
            {body}
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="maestro-slide-in flex h-full shrink-0 flex-col border-l"
      style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)', width }}
    >
      {body}
    </div>
  );
}

function DefaultInspector() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-soft)' }}
      >
        <MousePointerClick size={24} style={{ color: 'var(--brand)' }} />
      </div>
      <p className="mt-4 font-[var(--font-heading)] text-[17px] font-semibold" style={{ color: 'var(--heading)' }}>
        Select a workflow node
      </p>
      <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: 'var(--body-muted)' }}>
        Click any node on the canvas to inspect its agent configuration, schema, and tools.
      </p>

      <div className="mt-6 w-full rounded-xl border p-4 text-left" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
          Agents in workflow
        </p>
        <div className="flex flex-col gap-2">
          {AGENTS.map((a) => (
            <div key={a.id} className="flex items-center gap-2.5">
              <ShieldCheck size={15} style={{ color: 'var(--accent-strong)' }} />
              <span className="text-[14px] font-medium" style={{ color: 'var(--body)' }}>{a.name}</span>
              <span className="ml-auto text-[13px] font-mono" style={{ color: 'var(--body-muted)' }}>{a.model}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Metric({ icon: Icon, value }: { icon: typeof Cpu; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3.5 py-2.5" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card)' }}>
      <Icon size={16} style={{ color: 'var(--accent-strong)' }} />
      <span className="text-[15px] font-mono font-semibold" style={{ color: 'var(--body)' }}>{value}</span>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative h-6 w-11 rounded-full transition-colors"
      style={{ background: on ? 'var(--accent-strong)' : 'var(--border-soft)' }}
    >
      <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: on ? '22px' : '2px' }} />
    </button>
  );
}

function SchemaBlock({
  title,
  rows,
}: {
  title: string;
  rows: { field: string; type: string; required: boolean }[];
}) {
  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card)' }}>
      <div className="border-b px-4 py-2.5" style={{ borderColor: 'var(--border-soft)' }}>
        <span className="text-[14px] font-semibold" style={{ color: 'var(--heading)' }}>{title}</span>
      </div>
      <div className="flex flex-col">
        {rows.map((r, i) => (
          <div
            key={r.field}
            className="flex items-center gap-2 px-4 py-2 text-[14px] font-mono"
            style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-soft)' : 'none' }}
          >
            <span style={{ color: 'var(--body)' }}>{r.field}</span>
            <span style={{ color: 'var(--body-muted)' }}>:</span>
            <span style={{ color: 'var(--accent-strong)' }}>{r.type}</span>
            {r.required && (
              <span className="ml-auto rounded px-2 py-0.5 text-[11px]" style={{ background: 'var(--accent-soft)', color: 'var(--brand)' }}>
                required
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
