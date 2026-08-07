import { useEffect, useState } from 'react';
import { MaestroLogo } from './MaestroLogo';

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
      <div className="maestro-intro-logo flex flex-col items-center">
        <MaestroLogo height={76} className="text-[var(--brand)] animate-pulse" />
        <span className="mt-4 text-[13px] font-medium tracking-[0.18em] uppercase" style={{ color: 'var(--body-muted)' }}>
          Unified Multi-Agent Orchestrator
        </span>
      </div>
    </div>
  );
}
