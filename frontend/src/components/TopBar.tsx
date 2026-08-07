import { Sun, Moon, Save, GitPullRequest, Play, ChevronDown, Check, Menu, AlertTriangle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { useToast } from '@/components/Toast';
import { MaestroLogo } from './MaestroLogo';

interface TopBarProps {
  workflowName: string;
  version: string;
  onRun: () => void;
  onToggleWorkflow: () => void;
  workflowOpen: boolean;
  onOpenMobileSidebar?: () => void;
  isRunning?: boolean;
  onStopOrchestration?: () => void;
}

export function TopBar({ 
  workflowName, 
  version, 
  onRun, 
  onToggleWorkflow, 
  workflowOpen, 
  onOpenMobileSidebar,
  isRunning = false,
  onStopOrchestration
}: TopBarProps) {
  const { theme, toggle } = useTheme();
  const { push } = useToast();
  const [saved, setSaved] = useState(false);
  const [approved, setApproved] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const vRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!versionOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (vRef.current && !vRef.current.contains(e.target as Node)) setVersionOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [versionOpen]);

  const handleSave = () => {
    setSaved(true);
    push({ title: 'Workflow saved', message: `${workflowName} · ${version}`, variant: 'success' });
    setTimeout(() => setSaved(false), 1800);
  };

  const handleApprove = () => {
    setApproved(true);
    push({ title: 'Workflow approved', message: 'Locked for production runs', variant: 'success' });
  };

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-3 border-b px-4"
      style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)' }}
    >
      {onOpenMobileSidebar && (
        <button
          onClick={onOpenMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--bg-sunken)] lg:hidden"
          style={{ borderColor: 'var(--border)', color: 'var(--body)', background: 'var(--bg-card)' }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <MaestroLogo height={36} className="text-[var(--brand)]" />
      </div>

      <div className="mx-1 h-6 w-px hidden sm:block" style={{ background: 'var(--border-soft)' }} />

      {/* Workflow name + version */}
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-[var(--font-heading)] text-[16px] font-semibold" style={{ color: 'var(--heading)' }}>
          {workflowName}
        </span>
        <div className="relative" ref={vRef}>
          <button
            onClick={() => setVersionOpen((o) => !o)}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-[13px] font-mono transition-colors hover:bg-[var(--bg-sunken)]"
            style={{ borderColor: 'var(--border-soft)', color: 'var(--body-muted)' }}
          >
            {version}
            <ChevronDown size={13} />
          </button>
          {versionOpen && (
            <div
              className="maestro-fade-in absolute left-0 top-8 z-50 w-44 rounded-lg border py-1"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
            >
              {['v1.0.0', 'v0.9.3', 'v0.9.2', 'v0.8.0'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVersionOpen(false)}
                  className="flex w-full items-center justify-between px-3.5 py-2 text-left text-[14px] font-mono transition-colors hover:bg-[var(--accent-soft)]"
                  style={{ color: v === version ? 'var(--heading)' : 'var(--body)' }}
                >
                  {v}
                  {v === version && <Check size={14} style={{ color: 'var(--accent-strong)' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="hidden items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[14px] font-medium transition-all hover:scale-[1.02] sm:flex"
          style={{
            borderColor: saved ? 'var(--success)' : 'var(--border)',
            color: saved ? 'var(--success)' : 'var(--body)',
            background: 'var(--bg-card)',
          }}
        >
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saved ? 'Saved' : 'Save'}
        </button>

        <button
          onClick={handleApprove}
          disabled={approved}
          className="hidden items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[14px] font-medium transition-all hover:scale-[1.02] disabled:opacity-60 md:flex"
          style={{
            borderColor: approved ? 'var(--success)' : 'var(--border)',
            color: approved ? 'var(--success)' : 'var(--body)',
            background: 'var(--bg-card)',
          }}
        >
          <GitPullRequest size={15} />
          {approved ? 'Approved' : 'Approve'}
        </button>

        <button
          onClick={onToggleWorkflow}
          className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[14px] font-medium transition-all hover:scale-[1.02]"
          style={{
            borderColor: workflowOpen ? 'var(--accent-strong)' : 'var(--border)',
            color: workflowOpen ? 'var(--heading)' : 'var(--body)',
            background: 'var(--bg-card)',
          }}
        >
          Workflow
        </button>

        {isRunning && (
          <button
            onClick={() => setShowEditConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[14px] font-semibold transition-all hover:scale-[1.02]"
            style={{ borderColor: 'var(--border)', color: 'var(--body)', background: 'var(--bg-card)' }}
          >
            Edit Prompt
          </button>
        )}

        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[14px] font-semibold transition-all hover:scale-[1.02] disabled:opacity-40"
          style={{ background: 'var(--brand)', color: 'var(--bg)' }}
        >
          <Play size={15} fill="currentColor" />
          <span className="hidden sm:inline">Run</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--bg-sunken)]"
          style={{ borderColor: 'var(--border)', color: 'var(--body)', background: 'var(--bg-card)' }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {showEditConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/35 backdrop-blur-md maestro-fade-in font-sans">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl maestro-scale-in text-left"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-[var(--font-heading)] text-lg font-semibold" style={{ color: 'var(--heading)' }}>
                  Stop Orchestration?
                </h3>
                <p className="text-[12px]" style={{ color: 'var(--body-muted)' }}>
                  Confirm stopping the active agent session
                </p>
              </div>
            </div>

            <div className="my-5">
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--body)' }}>
                Editing the prompt will stop the current project. Do you want to continue?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <button
                onClick={() => setShowEditConfirm(false)}
                className="rounded-lg px-4 py-2 text-[14px] font-semibold transition-all hover:bg-[var(--bg-sunken)] active:scale-95 border"
                style={{ borderColor: 'var(--border)', color: 'var(--body-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onStopOrchestration) {
                    onStopOrchestration();
                  }
                  setShowEditConfirm(false);
                  push({ title: 'Project Stopped', message: 'Project stopped. You can now edit your prompt.', variant: 'success' });
                }}
                className="rounded-lg px-5 py-2 text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--error)', color: '#fff' }}
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
