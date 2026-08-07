import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Circle,
  GitMerge,
  FileText,
  Search,
  LineChart,
  GitBranch,
  ShieldCheck,
  ScrollText,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { WORKFLOW_NODES, WORKFLOW_EDGES, AGENTS, type WorkflowNode, type AgentStatus } from '@/data/mock';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/theme/ThemeProvider';

const ICONS: Record<string, LucideIcon> = {
  Search,
  LineChart,
  GitBranch,
  ShieldCheck,
  ScrollText,
};

const NODE_W = 220;
const NODE_H = 140;

interface WorkflowBuilderProps {
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onClose: () => void;
  libraryWidth?: number;
  onLibraryResize?: (e: React.PointerEvent) => void;
  nodeStates?: Record<string, string>;
}

export function WorkflowBuilder({ selectedNodeId, onSelectNode, onClose, libraryWidth = 240, onLibraryResize, nodeStates }: WorkflowBuilderProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [autoFit, setAutoFit] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();

  const contentBounds = useMemo(() => {
    const maxX = Math.max(...WORKFLOW_NODES.map((n) => n.x + NODE_W));
    const maxY = Math.max(...WORKFLOW_NODES.map((n) => n.y + NODE_H));
    const minX = Math.min(...WORKFLOW_NODES.map((n) => n.x));
    const minY = Math.min(...WORKFLOW_NODES.map((n) => n.y));
    return { width: maxX - minX, height: maxY - minY, minX, minY };
  }, []);

  const fitToCanvas = () => {
    const el = canvasRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw === 0 || ch === 0) return;
    const padding = 60;
    const scaleX = (cw - padding * 2) / contentBounds.width;
    const scaleY = (ch - padding * 2) / contentBounds.height;
    const z = Math.min(scaleX, scaleY);
    setZoom(z);
    const offsetX = (cw - contentBounds.width * z) / 2 - contentBounds.minX * z;
    const offsetY = (ch - contentBounds.height * z) / 2 - contentBounds.minY * z;
    setPan({ x: offsetX, y: offsetY });
  };

  useLayoutEffect(() => {
    if (autoFit) fitToCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFit]);

  useEffect(() => {
    if (!autoFit) return;
    const t = setTimeout(() => fitToCanvas(), 50);
    const onResize = () => fitToCanvas();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFit]);

  const startPan = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    setAutoFit(false);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };

  const onMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
  };

  const endPan = () => { drag.current = null; };

  const edges = useMemo(() => {
    return WORKFLOW_EDGES.map((e) => {
      const from = WORKFLOW_NODES.find((n) => n.id === e.from)!;
      const to = WORKFLOW_NODES.find((n) => n.id === e.to)!;
      const x1 = from.x + NODE_W / 2;
      const y1 = from.y + NODE_H / 2;
      const x2 = to.x + NODE_W / 2;
      const y2 = to.y + NODE_H / 2;
      const dx = (x2 - x1) * 0.5;
      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
      return { id: e.id, d, active: from.id === selectedNodeId || to.id === selectedNodeId };
    });
  }, [selectedNodeId]);

  const fullscreenStyles: React.CSSProperties = isFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    backgroundColor: '#070b13',
  } : {};

  return (
    <div 
      className="flex h-full min-w-0 flex-1"
      style={{ ...fullscreenStyles }}
    >
      {/* Agent Library */}
      <aside
        className="hidden shrink-0 flex-col border-r sm:flex"
        style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)', width: libraryWidth }}
      >
        <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
            Agent Library
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-2">
            {AGENTS.map((a) => {
              const Icon = ICONS[a.icon] || Circle;
              return (
                <div
                  key={a.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', a.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="flex cursor-grab items-center gap-3 rounded-lg border px-3 py-2.5 transition-all hover:scale-[1.02] active:cursor-grabbing"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--accent-soft)' }}>
                    <Icon size={16} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold" style={{ color: 'var(--heading)' }}>
                      {a.name}
                    </p>
                    <p className="truncate text-[12px] font-mono" style={{ color: 'var(--body-muted)' }}>
                      {a.model}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => push({ title: 'Add Agent', message: 'Mock: agent creation form.', variant: 'info' })}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2.5 text-[14px] font-medium transition-colors hover:bg-[var(--bg-sunken)]"
            style={{ borderColor: 'var(--border-soft)', color: 'var(--body-muted)' }}
          >
            <Plus size={16} />
            Add Agent
          </button>
        </div>
      </aside>

      {onLibraryResize && <div className="resize-handle-x hidden sm:block" onPointerDown={onLibraryResize} />}

      {/* Canvas area */}
      <div className="relative flex min-w-0 flex-1 flex-col" style={{ background: 'var(--bg-sunken)' }}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: 'var(--border)', background: 'var(--bg-elev)' }}>
          <span className="font-[var(--font-heading)] text-[16px] font-semibold" style={{ color: 'var(--heading)' }}>
            Workflow Canvas
          </span>
          <span className="rounded-full border px-2.5 py-0.5 text-[13px] font-mono" style={{ borderColor: 'var(--border-soft)', color: 'var(--body-muted)' }}>
            {WORKFLOW_NODES.length} nodes
          </span>
          <div className="flex-1" />
          <button onClick={() => { setAutoFit(false); setZoom((z) => Math.max(0.3, z - 0.1)); }} className="rounded-md border p-1.5 transition-colors hover:bg-[var(--bg-sunken)]" style={{ borderColor: 'var(--border-soft)', color: 'var(--body-muted)' }}>
            <ZoomOut size={16} />
          </button>
          <span className="w-14 text-center text-[14px] font-mono" style={{ color: 'var(--body-muted)' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => { setAutoFit(false); setZoom((z) => Math.min(2.5, z + 0.1)); }} className="rounded-md border p-1.5 transition-colors hover:bg-[var(--bg-sunken)]" style={{ borderColor: 'var(--border-soft)', color: 'var(--body-muted)' }}>
            <ZoomIn size={16} />
          </button>
          <button 
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setAutoFit(true);
            }} 
            className="rounded-md border p-1.5 transition-colors hover:bg-[var(--bg-sunken)]" 
            style={{ 
              borderColor: isFullscreen ? 'var(--brand)' : 'var(--border-soft)', 
              color: isFullscreen ? 'var(--brand)' : 'var(--body-muted)' 
            }} 
            title={isFullscreen ? "Exit Fullscreen" : "Maximize Graph"}
          >
            <Maximize size={16} />
          </button>
          <button onClick={onClose} className="rounded-md border p-1.5 transition-colors hover:bg-[var(--bg-sunken)]" style={{ borderColor: 'var(--border-soft)', color: 'var(--body-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
          onMouseDown={startPan}
          onMouseMove={onMove}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          onClick={(e) => { if (e.target === e.currentTarget) onSelectNode(null); }}
          style={{
            backgroundImage: 'radial-gradient(circle, var(--border-soft) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <svg className="absolute left-0 top-0 pointer-events-none" width={1700} height={700} style={{ overflow: 'visible' }}>
              {edges.map((e) => (
                <path
                  key={e.id}
                  d={e.d}
                  fill="none"
                  stroke={e.active ? 'var(--brand)' : 'var(--border-strong)'}
                  strokeWidth={e.active ? 3 : 2}
                  className={e.active ? 'edge-flow' : ''}
                  opacity={e.active ? 1 : 0.6}
                />
              ))}
            </svg>

            {WORKFLOW_NODES.map((n) => (
              <NodeCard
                key={n.id}
                node={n}
                selected={n.id === selectedNodeId}
                onSelect={() => onSelectNode(n.id)}
                activeStatus={nodeStates?.[n.id]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeCard({ node, selected, onSelect, activeStatus }: { node: WorkflowNode; selected: boolean; onSelect: () => void; activeStatus?: string }) {
  const { theme } = useTheme();
  const videoSrc = theme === 'dark' ? '/dark_mode_m.mp4' : '/light_mode_m.mp4';
  const agent = node.agentId ? AGENTS.find((a) => a.id === node.agentId) : undefined;
  const Icon = node.type === 'start' ? Play : node.type === 'join' ? GitMerge : node.type === 'report' ? FileText : ICONS[agent?.icon || ''] || Circle;

  const statusColor = (s?: string) =>
    s === 'success' ? 'var(--success)' : s === 'running' ? 'var(--brand)' : s === 'failure' ? 'var(--error)' : s === 'retry' ? 'var(--warning)' : s === 'waiting' || s === 'pending' ? 'var(--body-muted)' : 'var(--accent)';

  return (
    <div
      data-node
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className="absolute rounded-xl border transition-all"
      style={{
        left: node.x,
        top: node.y,
        width: NODE_W,
        height: NODE_H,
        background: selected ? 'var(--node-selected)' : 'var(--node-bg)',
        borderColor: selected ? 'var(--brand)' : 'var(--border)',
        boxShadow: selected ? '0 0 0 2px var(--brand), var(--shadow)' : 'var(--shadow)',
        cursor: 'pointer',
      }}
    >
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center gap-2.5">
          {activeStatus === 'running' ? (
            <video
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              className="h-11 w-11 rounded-md object-cover shrink-0"
              style={{ border: '1.5px solid var(--brand)' }}
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-md shrink-0" style={{ background: 'var(--accent-soft)' }}>
              <Icon size={22} style={{ color: 'var(--brand)' }} />
            </div>
          )}
          <span className="font-[var(--font-heading)] text-[16px] font-semibold tracking-wide" style={{ color: 'var(--heading)' }}>
            {node.label}
          </span>
          {(agent || activeStatus) && (
            <span className="ml-auto h-2.5 w-2.5 rounded-full" style={{ background: statusColor(activeStatus || agent?.status) }} />
          )}
        </div>

        {agent ? (
          <>
            <p className="mt-2 text-[13px] font-mono" style={{ color: 'var(--body-muted)' }}>
              {agent.model}
            </p>
            <div className="mt-auto flex flex-col gap-1 text-[13px]">
              <Row label="in" value={agent.inputType} />
              <Row label="out" value={agent.outputType} />
            </div>
          </>
        ) : (
          <p className="mt-2.5 text-[14px]" style={{ color: 'var(--body-muted)' }}>
            {node.type === 'start' ? 'Task entry' : node.type === 'join' ? 'Merge branches' : 'Final report'}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono opacity-60" style={{ color: 'var(--body-muted)' }}>{label}</span>
      <span className="font-mono font-medium" style={{ color: 'var(--body)' }}>{value}</span>
    </div>
  );
}
