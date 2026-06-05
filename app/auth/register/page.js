'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { registerCustomer } from '@/utils/api';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerCustomer(data);
      toast.success('Account created! Welcome to ITS TRAVELS AND TOURS!');
      // Previous redirect kept for reference:
      // setTimeout(() => router.push('/dashboard'), 1000);
      setTimeout(() => router.push('/profile'), 1000);
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
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
          <h2 style={{ fontSize: 46, fontWeight: 700, marginBottom: 16, lineHeight: 1.15, letterSpacing: -1 }}>Your Journey<br />Starts Here</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>Create an account to unlock exclusive deals, personalized itineraries, and seamless booking.</p>
        </div>
      </div>

      {/* RIGHT: FORM */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', position: 'relative' }}>

        {/* Mobile Header (only visible on small screens) */}
        <Link href="/" className="d-lg-none" style={{ position: 'absolute', top: 30, left: 24, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>ITS TRAVELS AND TOURS</span>
        </Link>

        <div style={{ width: '100%', maxWidth: 460 }}>
          <div style={{ marginBottom: 32, marginTop: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', marginBottom: 8, letterSpacing: -0.5 }}>Create an account</h1>
            <p style={{ color: '#6b7280', fontSize: 15 }}>Enter your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>

            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>First name</label>
                <input
                  type="text"
                  placeholder="First name"
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12,
                    border: '1px solid #d1d5db', background: '#f9fafb',
                    fontSize: 15, color: '#111827', outline: 'none',
                    borderColor: errors.firstName ? '#ef4444' : undefined,
                    transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; e.currentTarget.style.background = '#ffffff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.firstName ? '#ef4444' : '#d1d5db'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.background = '#f9fafb' }}
                  {...register('firstName', { required: 'Required' })}
                />
                {errors.firstName && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.firstName.message}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Last name</label>
                <input
                  type="text"
                  placeholder="Last name"
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12,
                    border: '1px solid #d1d5db', background: '#f9fafb',
                    fontSize: 15, color: '#111827', outline: 'none',
                    borderColor: errors.lastName ? '#ef4444' : undefined,
                    transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; e.currentTarget.style.background = '#ffffff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.lastName ? '#ef4444' : '#d1d5db'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.background = '#f9fafb' }}
                  {...register('lastName', { required: 'Required' })}
                />
                {errors.lastName && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.lastName.message}</span>}
              </div>
            </div>

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
                  transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; e.currentTarget.style.background = '#ffffff' }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.email ? '#ef4444' : '#d1d5db'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.background = '#f9fafb' }}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                })}
              />
              {errors.email && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.email.message}</span>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Phone</label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  border: '1px solid #d1d5db', background: '#f9fafb',
                  fontSize: 15, color: '#111827', outline: 'none',
                  borderColor: errors.phone ? '#ef4444' : undefined,
                  transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; e.currentTarget.style.background = '#ffffff' }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.phone ? '#ef4444' : '#d1d5db'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.background = '#f9fafb' }}
                {...register('phone', {
                  required: 'Phone is required',
                  pattern: { value: /^[0-9+\-\s()]{7,20}$/, message: 'Invalid phone number' },
                })}
              />
              {errors.phone && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.phone.message}</span>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Password</label>
              <input
                type="password"
                placeholder="Create a password (min. 8 chars)"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  border: '1px solid #d1d5db', background: '#f9fafb',
                  fontSize: 15, color: '#111827', outline: 'none',
                  borderColor: errors.password ? '#ef4444' : undefined,
                  transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; e.currentTarget.style.background = '#ffffff' }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.password ? '#ef4444' : '#d1d5db'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.background = '#f9fafb' }}
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Must be at least 8 characters' } })}
              />
              {errors.password && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.password.message}</span>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  border: '1px solid #d1d5db', background: '#f9fafb',
                  fontSize: 15, color: '#111827', outline: 'none',
                  borderColor: errors.confirmPassword ? '#ef4444' : undefined,
                  transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; e.currentTarget.style.background = '#ffffff' }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.confirmPassword ? '#ef4444' : '#d1d5db'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.background = '#f9fafb' }}
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.confirmPassword.message}</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, margin: '20px 0 24px' }}>
              <input type="checkbox" id="terms" required style={{ accentColor: 'var(--color-primary)', marginTop: 4, width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="terms" style={{ color: '#4b5563', fontSize: 13.5, cursor: 'pointer', lineHeight: 1.5 }}>
                I agree to ITS TRAVELS AND TOURS&apos;s{' '}
                <Link href="#" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>
              </label>
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
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px color-mix(in srgb, var(--color-primary) 30%, transparent)'; e.currentTarget.style.background = 'var(--color-primary)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px color-mix(in srgb, var(--color-primary) 30%, transparent)'; e.currentTarget.style.background = 'var(--color-primary)'; } }}
            >
              {loading ? (
                <>
                  <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Creating account...
                </>
              ) : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: '#6b7280' }}>
            Already have an account? <Link href="/auth/login" style={{ fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>Sign in</Link>
          </p>

        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
