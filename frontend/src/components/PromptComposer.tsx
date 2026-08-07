import { useRef, useState } from 'react';
import { Paperclip, Image, X, ArrowUp, Sparkles, Mic, Globe } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Attachment {
  id: string;
  name: string;
  kind: 'file' | 'image';
  size: string;
}

interface PromptComposerProps {
  onSubmitPrompt?: (prompt: string) => void;
}

export function PromptComposer({ onSubmitPrompt }: PromptComposerProps) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  const addFake = (kind: 'file' | 'image') => {
    const id = Math.random().toString(36).slice(2);
    const name =
      kind === 'image'
        ? `screenshot-${Math.floor(Math.random() * 900 + 100)}.png`
        : `brief-${Math.floor(Math.random() * 900 + 100)}.pdf`;
    const size = kind === 'image' ? `${Math.floor(Math.random() * 800 + 200)} KB` : `${Math.floor(Math.random() * 4 + 1)} MB`;
    setAttachments((a) => [...a, { id, name, kind, size }]);
  };

  const send = () => {
    if (!value.trim() && attachments.length === 0) return;
    push({ title: 'Task dispatched', message: 'Maestro is orchestrating your agents…', variant: 'info' });
    if (onSubmitPrompt) {
      onSubmitPrompt(value);
    }
    setValue('');
    setAttachments([]);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card)' }}>
          <Sparkles size={14} style={{ color: 'var(--brand)' }} />
          <span className="text-[14px] font-medium" style={{ color: 'var(--body-muted)' }}>
            Unified Multi-Agent Orchestrator
          </span>
        </div>
        <h1 className="font-[var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: 'var(--heading)' }}>
          Orchestrate intelligence,
          <br />
          <span style={{ color: 'var(--brand)' }}>not just prompts.</span>
        </h1>
        <p className="mt-4 text-[16px]" style={{ color: 'var(--body-muted)' }}>
          Describe a complex task — Maestro routes it across specialized agents, verifies the result, and ships a report.
        </p>
      </div>

      <div
        className="rounded-2xl border transition-all"
        style={{
          background: 'var(--bg-card)',
          borderColor: focused ? 'var(--accent-strong)' : 'var(--border)',
          boxShadow: focused ? '0 0 0 3px var(--accent-soft), var(--shadow)' : 'var(--shadow)',
        }}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b p-3.5" style={{ borderColor: 'var(--border-soft)' }}>
            {attachments.map((a) => (
              <div
                key={a.id}
                className="maestro-fade-in flex items-center gap-2 rounded-lg border px-3 py-2"
                style={{ background: 'var(--bg-sunken)', borderColor: 'var(--border-soft)' }}
              >
                {a.kind === 'image' ? <Image size={15} style={{ color: 'var(--accent-strong)' }} /> : <Paperclip size={15} style={{ color: 'var(--accent-strong)' }} />}
                <span className="text-[14px] font-medium" style={{ color: 'var(--body)' }}>
                  {a.name}
                </span>
                <span className="text-[13px] font-mono" style={{ color: 'var(--body-muted)' }}>
                  {a.size}
                </span>
                <button
                  onClick={() => setAttachments((arr) => arr.filter((x) => x.id !== a.id))}
                  className="rounded p-0.5 transition-colors hover:bg-[var(--bg)]"
                  style={{ color: 'var(--body-muted)' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          rows={3}
          placeholder="Describe the task you want Maestro to orchestrate…"
          className="w-full resize-none bg-transparent px-4 py-4 text-[17px] leading-relaxed outline-none placeholder:opacity-60"
          style={{ color: 'var(--body)' }}
        />

        <div className="flex items-center gap-2 border-t px-3.5 py-3" style={{ borderColor: 'var(--border-soft)' }}>
          <ComposerBtn onClick={() => fileRef.current?.click()} icon={Paperclip} label="Attach file" />
          <ComposerBtn onClick={() => imgRef.current?.click()} icon={Image} label="Attach image" />
          <ComposerBtn icon={Globe} label="Web search" />
          <ComposerBtn icon={Mic} label="Voice" />
          <div className="flex-1" />
          <span className="mr-1 hidden text-[13px] font-mono sm:inline" style={{ color: 'var(--body-muted)' }}>
            ⌘↵ to run
          </span>
          <button
            onClick={send}
            disabled={!value.trim() && attachments.length === 0}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: 'var(--brand)', color: 'var(--bg)' }}
            aria-label="Run task"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={() => addFake('file')}
      />
      <input
        ref={imgRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={() => addFake('image')}
      />

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {[
          'Analyze competitor pricing across 3 regions',
          'Synthesize Q3 earnings into an exec brief',
          'Audit our GDPR compliance gaps',
        ].map((s) => (
          <button
            key={s}
            onClick={() => setValue(s)}
            className="rounded-full border px-3.5 py-2 text-[14px] transition-all hover:scale-[1.02]"
            style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card)', color: 'var(--body-muted)' }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ComposerBtn({ onClick, icon: Icon, label }: { onClick?: () => void; icon: typeof Paperclip; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[14px] transition-colors hover:bg-[var(--bg-sunken)]"
      style={{ color: 'var(--body-muted)' }}
      title={label}
    >
      <Icon size={17} />
    </button>
  );
}
