import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  width?: string;
  align?: 'left' | 'right';
  children?: (open: boolean) => ReactNode;
}

export function Dropdown({ value, options, onChange, width = 'w-full', align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className={`relative ${width}`} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[13px] transition-colors hover:bg-[var(--bg-sunken)]"
        style={{ background: 'var(--bg)', borderColor: 'var(--border-soft)', color: 'var(--body)' }}
      >
        <span className="truncate font-mono">{value}</span>
        <ChevronDown
          size={14}
          style={{ color: 'var(--body-muted)' }}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          className={`maestro-fade-in absolute z-50 mt-1.5 max-h-60 min-w-full overflow-auto rounded-lg border py-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-[13px] font-mono transition-colors hover:bg-[var(--accent-soft)]"
              style={{ color: opt === value ? 'var(--heading)' : 'var(--body)' }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
