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
<<<<<<< HEAD
=======
  const [generatedOtp, setGeneratedOtp] = useState('');
>>>>>>> f336e1836d0ac740bc713fd4fbe149f30f5bc8ec
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

<<<<<<< HEAD
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
=======
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      push({ title: 'Enter Email', message: 'Email address is required to receive OTP.', variant: 'warning' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockOtp);
      setLoading(false);
      setOtpSent(true);
      push({ 
        title: 'OTP Sent', 
        message: `A verification code has been sent. (Mock Code: ${mockOtp})`, 
        variant: 'success' 
      });
    }, 900);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      push({ title: 'Enter OTP', message: 'Please enter the 6-digit OTP code.', variant: 'warning' });
      return;
    }
    if (otp !== generatedOtp && otp !== '123456') { // Allow 123456 as bypass back-door
      push({ title: 'Invalid OTP', message: 'The verification code is incorrect.', variant: 'error' });
>>>>>>> f336e1836d0ac740bc713fd4fbe149f30f5bc8ec
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
<<<<<<< HEAD
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
=======
      push({ title: 'Welcome back', message: 'Signed in to Maestro (mock).', variant: 'success' });
      onLogin();
    }, 1000);
>>>>>>> f336e1836d0ac740bc713fd4fbe149f30f5bc8ec
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
<<<<<<< HEAD
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
=======
          <h1 className="font-[var(--font-heading)] text-2xl font-semibold" style={{ color: 'var(--heading)' }}>
            {otpSent ? 'Enter OTP Code' : 'Sign In'}
          </h1>
          <p className="mt-1 text-[15px]" style={{ color: 'var(--body-muted)' }}>
            {otpSent ? `Verification code sent to ${email}` : 'Secure sign-in using email OTP.'}
          </p>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
                  Email Address
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

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold transition-all hover:scale-[1.01] disabled:opacity-70 mt-2"
                style={{ background: 'var(--brand)', color: 'var(--bg)' }}
              >
                {loading ? <Loader2 size={16} className="maestro-spin" /> : <ArrowRight size={16} />}
                {loading ? 'Sending OTP…' : 'Send Verification OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--body-muted)' }}>
                  Enter 6-Digit OTP
                </span>
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg)' }}>
                  <Lock size={16} style={{ color: 'var(--body-muted)' }} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full bg-transparent text-[15px] outline-none tracking-widest text-center font-bold"
                    style={{ color: 'var(--body)' }}
>>>>>>> f336e1836d0ac740bc713fd4fbe149f30f5bc8ec
                  />
                </div>
              </label>

<<<<<<< HEAD
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
=======
              <div className="flex items-center justify-between">
                <button 
                  type="button" 
                  onClick={() => setOtpSent(false)} 
                  className="text-[14px] font-medium transition-colors hover:underline" 
                  style={{ color: 'var(--brand)' }}
                >
                  Change Email
                </button>
                <button 
                  type="button" 
                  onClick={handleSendOtp} 
                  className="text-[14px] font-medium transition-colors hover:underline" 
                  style={{ color: 'var(--body-muted)' }}
                >
                  Resend OTP
>>>>>>> f336e1836d0ac740bc713fd4fbe149f30f5bc8ec
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
<<<<<<< HEAD
                className="flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold transition-all hover:scale-[1.01] active:scale-100 disabled:opacity-70"
=======
                className="flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold transition-all hover:scale-[1.01] disabled:opacity-70 mt-2"
>>>>>>> f336e1836d0ac740bc713fd4fbe149f30f5bc8ec
                style={{ background: 'var(--brand)', color: 'var(--bg)' }}
              >
                {loading ? <Loader2 size={16} className="maestro-spin" /> : <ArrowRight size={16} />}
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
            </form>
          )}

<<<<<<< HEAD
          <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--body-muted)' }}>
            Maestro security handles passkeys and multi-factor validation by default.
=======
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
>>>>>>> f336e1836d0ac740bc713fd4fbe149f30f5bc8ec
          </p>
        </div>
      </div>
    </div>
  );
}
