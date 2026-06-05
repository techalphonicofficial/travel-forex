'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { forgotCustomerPassword, loginCustomer, resetCustomerPassword } from '@/utils/api';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState('email');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await loginCustomer(data);
      toast.success('Welcome back! Redirecting...');
      // Previous redirect kept for reference:
      // setTimeout(() => router.push('/dashboard'), 1000);
      const redirectUrl = searchParams.get('redirect') || '/profile';
      setTimeout(() => router.push(redirectUrl), 1000);
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your email and password.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const closeForgotModal = () => {
    setForgotOpen(false);
    setForgotStep('email');
    setForgotLoading(false);
    setForgotEmail('');
    setForgotOtp('');
    setForgotToken('');
    setForgotPassword('');
    setForgotConfirmPassword('');
  };

  const handleForgotEmailSubmit = async (event) => {
    event.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);

    try {
      const response = await forgotCustomerPassword({ email: forgotEmail });
      setForgotToken(response.data?.token || '');
      toast.success(response.message || 'OTP sent to your email.');
      setForgotStep('otp');
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to send OTP. Please try again.';
      toast.error(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotOtpSubmit = async (event) => {
    event.preventDefault();

    if (forgotOtp.trim().length < 4) {
      toast.error('Please enter the OTP sent to your email.');
      return;
    }

    if (forgotToken && forgotOtp.trim() !== forgotToken) {
      toast.error('Invalid OTP. Please check your email and try again.');
      return;
    }

    if (forgotPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (forgotPassword !== forgotConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setForgotLoading(true);

    try {
      const response = await resetCustomerPassword({
        email: forgotEmail,
        token: forgotOtp.trim(),
        password: forgotPassword,
      });
      toast.success(response.message || 'Password reset successfully. Please login with your new password.');
      setValue('email', forgotEmail);
      closeForgotModal();
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to reset password. Please try again.';
      toast.error(message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
      {/* LEFT: IMAGE */}
      <div
        className="d-none d-lg-flex"
        style={{
          flex: 1.2,
          position: 'relative',
          backgroundImage: 'url("https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?q=80&w=2000&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)' }} />

        {/* Top Logo overlaid on image */}
        <Link href="/" style={{ position: 'absolute', top: 40, left: 60, zIndex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="https://i.ibb.co/wNt195HZ/Whats-App-Image-2026-03-27-at-1-12-46-AM-1-copy-2.webp" alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
        </Link>

        {/* Bottom Text overlaid on image */}
        <div style={{ position: 'relative', zIndex: 1, color: 'white', maxWidth: 460 }}>
          <h2 style={{ fontSize: 46, fontWeight: 700, marginBottom: 16, lineHeight: 1.15, letterSpacing: -1 }}>Discover the<br />World&apos;s Best Destinations</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>Join thousands of travelers who have found their dream vacation with us. Book your next adventure today.</p>
        </div>
      </div>

      {/* RIGHT: FORM */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', position: 'relative' }}>

        {/* Mobile Header (only visible on small screens) */}
        <Link href="/" className="d-lg-none" style={{ position: 'absolute', top: 30, left: 24, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="https://i.ibb.co/6cV4xWbm/Whats-App-Image-2026-03-27-at-1-12-46-AM-1-copy.webp" alt="Logo" style={{ width: 80, height: 80 }} />
        </Link>

        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 40, marginTop: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', marginBottom: 8, letterSpacing: -0.5 }}>Welcome back</h1>
            <p style={{ color: '#6b7280', fontSize: 15 }}>Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  border: '1px solid #d1d5db', background: '#f9fafb',
                  fontSize: 15, color: '#111827', outline: 'none',
                  borderColor: errors.email ? '#ef4444' : undefined,
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; e.currentTarget.style.background = '#ffffff' }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.email ? '#ef4444' : '#d1d5db'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.background = '#f9fafb' }}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                })}
              />
              {errors.email && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.email.message}</span>}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</label>
                {/* Previous anchor kept for reference:
                <a href="#" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>Forgot password?</a>
                */}
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', background: 'transparent', border: 'none', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  border: '1px solid #d1d5db', background: '#f9fafb',
                  fontSize: 15, color: '#111827', outline: 'none',
                  borderColor: errors.password ? '#ef4444' : undefined,
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; e.currentTarget.style.background = '#ffffff' }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.password ? '#ef4444' : '#d1d5db'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.background = '#f9fafb' }}
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Must be at least 6 characters' } })}
              />
              {errors.password && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px', background: 'var(--color-primary)', color: 'white',
                border: 'none', borderRadius: 999, fontSize: 16, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px color-mix(in srgb, var(--color-primary) 30%, transparent)',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px color-mix(in srgb, var(--color-primary) 30%, transparent)'; e.currentTarget.style.background = 'var(--color-primary)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px color-mix(in srgb, var(--color-primary) 30%, transparent)'; e.currentTarget.style.background = 'var(--color-primary)'; } }}
            >
              {loading ? (
                <>
                  <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ padding: '0 16px', fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Or continue with</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          <div>
            <button
              type="button"
              onClick={() => toast.error('Google OAuth needs a backend OAuth endpoint and Google client ID first.')}
              style={{ width: '100%', padding: '15px 18px', background: 'white', border: '1px solid #d1d5db', borderRadius: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, color: '#374151', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontSize: 15 }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" width={22} alt="Google" /> Continue with Google
            </button>
            {/* Previous Apple button removed from UI and kept for reference:
            <button>Apple</button>
            */}
          </div>

          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: '#6b7280' }}>
            Don&apos;t have an account? <Link href="/auth/register" style={{ fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>Sign up</Link>
          </p>

        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {forgotOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(10,15,30,0.68)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{ width: '100%', maxWidth: 440, background: 'white', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.28)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 26px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <h2 id="forgot-password-title" style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
                  Reset password
                </h2>
                <p style={{ color: '#6b7280', fontSize: 14, margin: '6px 0 0', lineHeight: 1.5 }}>
                  {forgotStep === 'email' ? 'Enter your email to receive an OTP.' : `Enter the OTP sent to ${forgotEmail} and choose a new password.`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                aria-label="Close"
                style={{ width: 34, height: 34, borderRadius: 10, background: '#f3f4f6', color: '#374151', border: 'none', fontSize: 20, lineHeight: 1 }}
              >
                x
              </button>
            </div>

            {forgotStep === 'email' ? (
              <form onSubmit={handleForgotEmailSubmit} style={{ padding: 26 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  placeholder="Enter your registered email"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 15, color: '#111827', outline: 'none' }}
                  required
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{ width: '100%', marginTop: 20, padding: 15, borderRadius: 999, background: 'var(--color-primary)', color: 'white', fontWeight: 700, border: 'none', opacity: forgotLoading ? 0.7 : 1 }}
                >
                  {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotOtpSubmit} style={{ padding: 26 }}>
                {forgotToken && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                    Development OTP: {forgotToken}
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>OTP</label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(event) => setForgotOtp(event.target.value)}
                    placeholder="Enter OTP received on email"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 15, color: '#111827', outline: 'none' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>New password</label>
                  <input
                    type="password"
                    value={forgotPassword}
                    onChange={(event) => setForgotPassword(event.target.value)}
                    placeholder="Create new password"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 15, color: '#111827', outline: 'none' }}
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Confirm password</label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(event) => setForgotConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 15, color: '#111827', outline: 'none' }}
                    required
                    minLength={8}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{ width: '100%', marginTop: 20, padding: 15, borderRadius: 999, background: 'var(--color-primary)', color: 'white', fontWeight: 700, border: 'none', opacity: forgotLoading ? 0.7 : 1 }}
                >
                  {forgotLoading ? 'Resetting password...' : 'Reset Password'}
                </button>
                <button type="button" onClick={() => setForgotStep('email')} style={{ width: '100%', marginTop: 10, padding: 12, color: 'var(--color-primary)', fontWeight: 700, background: 'transparent', border: 'none' }}>
                  Change email
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
