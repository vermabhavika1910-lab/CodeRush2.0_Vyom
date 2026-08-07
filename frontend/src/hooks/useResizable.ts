import { useCallback, useEffect, useRef, useState } from 'react';

export function useResizable(initial: number, min: number, max: number, axis: 'x' | 'y' = 'x') {
  const [size, setSize] = useState(initial);
  const startRef = useRef<{ pos: number; size: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      startRef.current = { pos: axis === 'x' ? e.clientX : e.clientY, size };
      const move = (ev: PointerEvent) => {
        if (!startRef.current) return;
        const current = axis === 'x' ? ev.clientX : ev.clientY;
        const delta = current - startRef.current.pos;
        const next = Math.max(min, Math.min(max, startRef.current.size + delta));
        setSize(next);
      };
      const up = () => {
        startRef.current = null;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize';
    },
    [size, min, max, axis],
  );

  return { size, setSize, onPointerDown };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
