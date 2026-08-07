import { useEffect, useState } from 'react';

interface IntroAnimationProps {
  onDone: () => void;
}

export function IntroAnimation({ onDone }: IntroAnimationProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHidden(true), 1600);
    const t2 = setTimeout(onDone, 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  if (hidden) return null;

  return (
    <div
      className="maestro-intro-overlay fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div className="maestro-intro-logo flex flex-col items-center" style={{ position: 'absolute', left: '50%', top: '50%' }}>
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent-soft)', border: '1.5px solid var(--border)' }}
        >
          <span style={{ color: 'var(--brand)' }} className="font-[var(--font-brand)] text-3xl font-bold leading-none">
            M
          </span>
        </div>
        <span
          className="mt-4 font-[var(--font-brand)] text-3xl font-semibold tracking-wide"
          style={{ color: 'var(--brand)' }}
        >
          Maestro
        </span>
        <span className="mt-1 text-[14px] font-medium tracking-[0.18em] uppercase" style={{ color: 'var(--body-muted)' }}>
          Unified Multi-Agent Orchestrator
        </span>
      </div>
    </div>
  );
}
