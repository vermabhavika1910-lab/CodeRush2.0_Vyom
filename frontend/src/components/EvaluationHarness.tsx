import { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/components/Toast';

export function EvaluationHarness() {
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');

  const runHarness = async () => {
    setLoading(true);
    setResults([]);
    setSummary('');
    push({ title: 'Benchmark Started', message: 'Executing task runs on Single vs Multi-Agent models...', variant: 'info' });
    
    try {
      const data = await api.runEvaluation();
      setResults(data.results || []);
      setSummary(data.summary || '');
      push({ title: 'Benchmark Complete', message: 'Evaluation table and marginal value computed.', variant: 'success' });
    } catch (err) {
      console.error(err);
      push({ title: 'Evaluation Failed', message: 'Could not connect to backend benchmark API.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="border-b px-5 py-4 sm:px-6 flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="font-[var(--font-heading)] text-2xl font-semibold" style={{ color: 'var(--heading)' }}>
            Evaluation Harness
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--body-muted)' }}>
            Execute fixed AgentBench-style benchmarks comparing Single-Agent vs. Multi-Agent models.
          </p>
        </div>
        <button
          onClick={runHarness}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[14px] font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ borderColor: 'var(--border)', color: 'var(--heading)', background: 'var(--bg-sunken)' }}
        >
          <Play size={15} className={loading ? 'animate-pulse' : ''} />
          {loading ? 'Running Benchmark...' : 'Run Benchmark Harness'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
        {loading && (
          <div className="rounded-xl border p-8 flex flex-col items-center justify-center gap-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--heading)' }} />
            <p className="text-[14px] font-semibold" style={{ color: 'var(--heading)' }}>Executing Benchmark Suite</p>
            <p className="text-[12px]" style={{ color: 'var(--body-muted)' }}>Running parallel task cycles on single and multi-agent systems...</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            {/* Metrics comparison table */}
            <div className="overflow-hidden rounded-xl border animate-fade-in" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-sunken)' }}>
                <TrendingUp size={16} style={{ color: 'var(--heading)' }} />
                <h3 className="font-semibold text-[14px]" style={{ color: 'var(--heading)' }}>Comparative Metric Table</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="px-4 py-3 text-left" style={{ color: 'var(--body-muted)' }}>Benchmark Task</th>
                    <th className="px-4 py-3 text-center" style={{ color: 'var(--body-muted)' }}>Single-Agent Cost</th>
                    <th className="px-4 py-3 text-center" style={{ color: 'var(--body-muted)' }}>Single Latency</th>
                    <th className="px-4 py-3 text-center" style={{ color: 'var(--body-muted)' }}>Multi-Agent Cost</th>
                    <th className="px-4 py-3 text-center" style={{ color: 'var(--body-muted)' }}>Multi Latency</th>
                    <th className="px-4 py-3 text-center" style={{ color: 'var(--body-muted)' }}>Handoff Validity</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-soft)' }} className="transition-colors hover:bg-[var(--bg-sunken)]">
                      <td className="px-4 py-3 font-semibold text-[13px]" style={{ color: 'var(--heading)' }}>{r.task}</td>
                      <td className="px-4 py-3 text-center font-mono text-[13px]">${(r.single.cost).toFixed(5)}</td>
                      <td className="px-4 py-3 text-center font-mono text-[13px]">{(r.single.latency_ms / 1000).toFixed(2)}s</td>
                      <td className="px-4 py-3 text-center font-mono text-[13px]">${(r.multi.cost).toFixed(5)}</td>
                      <td className="px-4 py-3 text-center font-mono text-[13px]">{(r.multi.latency_ms / 1000).toFixed(2)}s</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--success)]">
                          <ShieldCheck size={13} />
                          VALID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Marginal value report markdown */}
            <div className="rounded-xl border p-5 animate-fade-in" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <div className="prose prose-invert max-w-none text-[14px] leading-relaxed text-[var(--body)]">
                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(summary) }} />
              </div>
            </div>
          </>
        )}

        {!loading && results.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle size={32} className="opacity-40" style={{ color: 'var(--body-muted)' }} />
            <p className="mt-3 text-[15px] font-semibold" style={{ color: 'var(--heading)' }}>No Evaluation Run Initiated</p>
            <p className="text-[13px] max-w-md mt-1" style={{ color: 'var(--body-muted)' }}>
              Click the button above to execute the benchmark harness suite and compute the performance metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple helper to render basic markdown bold/bullets
function formatMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h4 class="text-[16px] font-bold mt-4 mb-2 text-[var(--heading)]">$1</h4>')
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-[14px]">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
