import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      push({ title: 'Enter credentials', message: 'Email and password are required.', variant: 'warning' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      push({ title: 'Welcome back', message: 'Signed in to Maestro (mock).', variant: 'success' });
      onLogin();
    }, 1100);
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center overflow-y-auto p-5" style={{ background: 'var(--bg)' }}>
      {/* ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, var(--accent-soft), transparent 60%)' }}
      />

      <div className="maestro-fade-in relative w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'var(--accent-soft)', border: '1.5px solid var(--border)' }}
          >
            <span style={{ color: 'var(--brand)' }} className="font-[var(--font-brand)] text-2xl font-bold leading-none">
              M
            </span>
          </div>
          <span className="mt-3 font-[var(--font-brand)] text-2xl font-semibold tracking-wide" style={{ color: 'var(--brand)' }}>
            Maestro
          </span>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card)' }}>
            <Sparkles size={12} style={{ color: 'var(--brand)' }} />
            <span className="text-[12px] font-medium" style={{ color: 'var(--body-muted)' }}>
              Unified Multi-Agent Orchestrator
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl border p-7"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <h1 className="font-[var(--font-heading)] text-2xl font-semibold" style={{ color: 'var(--heading)' }}>
            Welcome back
          </h1>
          <p className="mt-1 text-[15px]" style={{ color: 'var(--body-muted)' }}>
            Sign in to orchestrate your agents.
          </p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
                Email
              </span>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg)' }}>
                <Mail size={16} style={{ color: 'var(--body-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@maestro.dev"
                  className="w-full bg-transparent text-[15px] outline-none"
                  style={{ color: 'var(--body)' }}
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
                Password
              </span>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg)' }}>
                <Lock size={16} style={{ color: 'var(--body-muted)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-[15px] outline-none"
                  style={{ color: 'var(--body)' }}
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="shrink-0 transition-colors" style={{ color: 'var(--body-muted)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setRemember((r) => !r)} className="flex items-center gap-2">
                <span
                  className="flex h-4 w-4 items-center justify-center rounded border transition-colors"
                  style={{
                    background: remember ? 'var(--accent-strong)' : 'transparent',
                    borderColor: remember ? 'var(--accent-strong)' : 'var(--border-soft)',
                  }}
                >
                  {remember && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-[14px]" style={{ color: 'var(--body)' }}>Remember me</span>
              </button>
              <button type="button" onClick={() => push({ title: 'Password reset', message: 'Mock: reset link sent.', variant: 'info' })} className="text-[14px] font-medium transition-colors hover:underline" style={{ color: 'var(--brand)' }}>
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold transition-all hover:scale-[1.01] disabled:opacity-70"
              style={{ background: 'var(--brand)', color: 'var(--bg)' }}
            >
              {loading ? <Loader2 size={16} className="maestro-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'var(--border-soft)' }} />
            <span className="text-[12px]" style={{ color: 'var(--body-muted)' }}>or</span>
            <div className="h-px flex-1" style={{ background: 'var(--border-soft)' }} />
          </div>

          <button
            onClick={() => push({ title: 'Google sign-in', message: 'Mock: not connected.', variant: 'info' })}
            className="flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-[14px] font-medium transition-colors hover:bg-[var(--bg-sunken)]"
            style={{ borderColor: 'var(--border)', color: 'var(--body)', background: 'var(--bg)' }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-5 text-center text-[14px]" style={{ color: 'var(--body-muted)' }}>
            Don't have an account?{' '}
            <button onClick={() => push({ title: 'Sign up', message: 'Mock: sign-up flow.', variant: 'info' })} className="font-semibold transition-colors hover:underline" style={{ color: 'var(--brand)' }}>
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}
