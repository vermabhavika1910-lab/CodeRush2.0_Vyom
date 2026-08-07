import { useState } from 'react';
import {
  Search,
  LineChart,
  ShieldCheck,
  ScrollText,
  Plus,
  Library,
  FolderPlus,
  Folder,
  History,
  type LucideIcon,
  X,
  Sparkles,
  Gauge,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  kind: 'agent' | 'action' | 'nav';
  badge?: string;
}

const AGENT_ITEMS: SidebarItem[] = [
  { id: 'researcher', label: 'Researcher', icon: Search, kind: 'agent' },
  { id: 'analyst', label: 'Analyst', icon: LineChart, kind: 'agent' },
  { id: 'verifier', label: 'Verifier', icon: ShieldCheck, kind: 'agent' },
  { id: 'summarizer', label: 'Summarizer', icon: ScrollText, kind: 'agent' },
];

const ACTION_ITEMS: SidebarItem[] = [
  { id: 'add-agent', label: 'Add Agent', icon: Plus, kind: 'action' },
  { id: 'library', label: 'Library', icon: Library, kind: 'action' },
  { id: 'add-work', label: 'Add Work', icon: FolderPlus, kind: 'action' },
];

const NAV_ITEMS: SidebarItem[] = [
  { id: 'projects', label: 'Projects', icon: Folder, kind: 'nav', badge: '4' },
  { id: 'history', label: 'History', icon: History, kind: 'nav' },
  { id: 'eval', label: 'Evaluation', icon: Gauge, kind: 'nav' },
];

interface SidebarProps {
  selected: string;
  onSelect: (id: string) => void;
  width?: number;
  drawer?: boolean;
  drawerOpen?: boolean;
  onCloseDrawer?: () => void;
}

export function Sidebar({ selected, onSelect, width = 260, drawer = false, drawerOpen = false, onCloseDrawer }: SidebarProps) {
  const { push } = useToast();
  const [addOpen, setAddOpen] = useState(false);

  const handleSelect = (id: string) => {
    if (id === 'add-agent') {
      setAddOpen(true);
      return;
    }
    onSelect(id);
    if (drawer && onCloseDrawer) onCloseDrawer();
  };

  const content = (
    <aside
      className="flex h-full flex-col border-r"
      style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)', width: drawer ? '100%' : width }}
    >
      {drawer && (
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <span className="font-[var(--font-heading)] text-[17px] font-semibold" style={{ color: 'var(--heading)' }}>
            Navigation
          </span>
          <button onClick={onCloseDrawer} className="rounded-md p-1.5 transition-colors hover:bg-[var(--bg-sunken)]" style={{ color: 'var(--body-muted)' }}>
            <X size={18} />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SectionLabel>Agents</SectionLabel>
        <div className="mt-2 flex flex-col gap-1">
          {AGENT_ITEMS.map((it) => (
            <SidebarRow key={it.id} item={it} active={selected === it.id} onClick={() => handleSelect(it.id)} />
          ))}
        </div>

        <SectionLabel className="mt-6">Actions</SectionLabel>
        <div className="mt-2 flex flex-col gap-1">
          {ACTION_ITEMS.map((it) => (
            <SidebarRow key={it.id} item={it} active={selected === it.id} onClick={() => handleSelect(it.id)} />
          ))}
        </div>

        <SectionLabel className="mt-6">Workspace</SectionLabel>
        <div className="mt-2 flex flex-col gap-1">
          {NAV_ITEMS.map((it) => (
            <SidebarRow key={it.id} item={it} active={selected === it.id} onClick={() => handleSelect(it.id)} />
          ))}
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-xl border p-3.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--brand)' }} />
          <span className="text-[14px] font-semibold" style={{ color: 'var(--heading)' }}>
            Mock Mode
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-snug" style={{ color: 'var(--body-muted)' }}>
          All execution is simulated. No backend connected.
        </p>
      </div>

      {addOpen && <AddAgentModal onClose={() => setAddOpen(false)} onAdd={(n) => push({ title: `Agent "${n}" added`, variant: 'success' })} />}
    </aside>
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
          className="fixed left-0 top-0 z-[150] h-full"
          style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', maxWidth: '85vw' }}
        >
          {content}
        </div>
      </>
    );
  }

  return content;
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${className}`} style={{ color: 'var(--body-muted)' }}>
      {children}
    </p>
  );
}

function SidebarRow({ item, active, onClick }: { item: SidebarItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] transition-all"
      style={{
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--heading)' : 'var(--body)',
        boxShadow: active ? 'inset 0 0 0 1px var(--border)' : 'none',
      }}
    >
      <Icon size={18} className="shrink-0 transition-colors" style={{ color: active ? 'var(--brand)' : 'var(--body-muted)' }} />
      <span className="flex-1 truncate font-medium">{item.label}</span>
      {item.badge && (
        <span className="rounded-full px-2 py-0.5 text-[12px] font-mono" style={{ background: 'var(--bg-sunken)', color: 'var(--body-muted)' }}>
          {item.badge}
        </span>
      )}
    </button>
  );
}

function AddAgentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string) => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Analyst');

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="maestro-fade-in w-full max-w-md rounded-2xl border p-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-[var(--font-heading)] text-xl font-semibold" style={{ color: 'var(--heading)' }}>
            Add Agent
          </h3>
          <button onClick={onClose} className="rounded-md p-1.5 transition-colors hover:bg-[var(--bg-sunken)]" style={{ color: 'var(--body-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-[14px]" style={{ color: 'var(--body-muted)' }}>
          Register a new agent in the library.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <Field label="Agent name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Critic"
              className="w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-[15px] outline-none focus:border-[var(--accent-strong)]"
              style={{ borderColor: 'var(--border-soft)', color: 'var(--body)' }}
            />
          </Field>
          <Field label="Role">
            <div className="flex flex-wrap gap-2">
              {['Analyst', 'Researcher', 'Verifier', 'Summarizer', 'Custom'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="rounded-lg border px-3 py-1.5 text-[13px] transition-colors"
                  style={{
                    borderColor: role === r ? 'var(--accent-strong)' : 'var(--border-soft)',
                    background: role === r ? 'var(--accent-soft)' : 'transparent',
                    color: role === r ? 'var(--heading)' : 'var(--body)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-[var(--bg-sunken)]" style={{ borderColor: 'var(--border)', color: 'var(--body)' }}>
            Cancel
          </button>
          <button
            onClick={() => { onAdd(name || 'New Agent'); onClose(); }}
            className="rounded-lg px-4 py-2.5 text-[14px] font-semibold transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--brand)', color: 'var(--bg)' }}
          >
            Add Agent
          </button>
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
