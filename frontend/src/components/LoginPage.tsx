import { useState, useEffect } from 'react';
import { Mail, ArrowRight, Loader2, Sparkles, KeyRound, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { MaestroLogo } from './MaestroLogo';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      push({ title: 'Invalid Email', message: 'Please enter a valid email address.', variant: 'warning' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setCountdown(30);
      push({ title: 'OTP Sent', message: 'Verification code sent! For demo, use code: 4812', variant: 'info' });
    }, 900);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 4) {
      push({ title: 'Enter Code', message: 'Please enter the 4-digit verification code.', variant: 'warning' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (otp === '4812') {
        push({ title: 'Welcome back', message: 'Signed in to Maestro.', variant: 'success' });
        onLogin();
      } else {
        push({ title: 'Invalid OTP', message: 'The verification code you entered is incorrect.', variant: 'error' });
      }
    }, 1000);
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCountdown(30);
      push({ title: 'OTP Resent', message: 'New code sent! Use code: 4812', variant: 'success' });
    }, 800);
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center overflow-y-auto p-5" style={{ background: 'var(--bg)' }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, var(--accent-soft), transparent 60%)' }}
      />

      <div className="maestro-fade-in relative w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <MaestroLogo height={64} className="text-[var(--brand)]" />
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card)' }}>
            <Sparkles size={12} style={{ color: 'var(--brand)' }} />
            <span className="text-[12px] font-medium" style={{ color: 'var(--body-muted)' }}>
              Unified Multi-Agent Orchestrator
            </span>
          </div>
        </div>

        {/* Login Form Card */}
        <div
          className="rounded-2xl border p-7 transition-all"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
        >
          {!otpSent ? (
            /* Phase 1: Email Input Form */
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <div>
                <h1 className="font-[var(--font-heading)] text-2xl font-semibold" style={{ color: 'var(--heading)' }}>
                  Passwordless Sign In
                </h1>
                <p className="mt-1 text-[14px]" style={{ color: 'var(--body-muted)' }}>
                  Enter your email to receive a temporary one-time password (OTP).
                </p>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
                  Email Address
                </span>
                <div className="flex items-center gap-2 rounded-lg border px-3.5 py-2.5" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg)' }}>
                  <Mail size={16} style={{ color: 'var(--body-muted)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@maestro.dev"
                    className="w-full bg-transparent text-[15px] outline-none"
                    style={{ color: 'var(--body)' }}
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold transition-all hover:scale-[1.01] active:scale-100 disabled:opacity-70"
                style={{ background: 'var(--brand)', color: 'var(--bg)' }}
              >
                {loading ? <Loader2 size={16} className="maestro-spin" /> : <ArrowRight size={16} />}
                {loading ? 'Sending OTP…' : 'Send Code'}
              </button>
            </form>
          ) : (
            /* Phase 2: OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); }}
                  className="rounded-md p-1 transition-colors hover:bg-[var(--bg-sunken)]"
                  style={{ color: 'var(--body-muted)' }}
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-[14px] font-medium" style={{ color: 'var(--body-muted)' }}>
                  Back to email
                </span>
              </div>

              <div>
                <h1 className="font-[var(--font-heading)] text-2xl font-semibold" style={{ color: 'var(--heading)' }}>
                  Enter Verification Code
                </h1>
                <p className="mt-1 text-[14px] leading-relaxed" style={{ color: 'var(--body-muted)' }}>
                  We sent a 4-digit OTP code to <strong style={{ color: 'var(--heading)' }}>{email}</strong>.
                </p>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
                  OTP Code
                </span>
                <div className="flex items-center gap-2 rounded-lg border px-3.5 py-2.5" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg)' }}>
                  <KeyRound size={16} style={{ color: 'var(--body-muted)' }} />
                  <input
                    type="text"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-transparent text-[16px] font-mono tracking-[0.4em] outline-none"
                    style={{ color: 'var(--body)' }}
                    required
                    autoFocus
                  />
                </div>
              </label>

              <div className="flex items-center justify-between text-[14px]">
                <span style={{ color: 'var(--body-muted)' }}>Didn't receive it?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || loading}
                  className="flex items-center gap-1 font-semibold transition-colors hover:underline disabled:opacity-50"
                  style={{ color: 'var(--brand)' }}
                >
                  <RefreshCw size={13} className={loading ? 'maestro-spin' : ''} />
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold transition-all hover:scale-[1.01] active:scale-100 disabled:opacity-70"
                style={{ background: 'var(--brand)', color: 'var(--bg)' }}
              >
                {loading ? <Loader2 size={16} className="maestro-spin" /> : <ArrowRight size={16} />}
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--body-muted)' }}>
            Maestro security handles passkeys and multi-factor validation by default.
          </p>
        </div>
      </div>
    </div>
  );
}
