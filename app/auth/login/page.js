'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wl_auth', JSON.stringify({ name: 'Alex Johnson', email: data.email }));
    }
    toast.success('Welcome back! Redirecting...');
    setTimeout(() => router.push('/dashboard'), 1500);
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
          <h2 style={{ fontSize: 46, fontWeight: 700, marginBottom: 16, lineHeight: 1.15, letterSpacing: -1 }}>Discover the<br />World's Best Destinations</h2>
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
                <a href="#" style={{ fontSize: 13, fontWeight: 600, color: '#026eb5', textDecoration: 'none' }}>Forgot password?</a>
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
                width: '100%', padding: '16px', background: '#026eb5', color: 'white',
                border: 'none', borderRadius: 999, fontSize: 16, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px #026eb54d',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px #026eb54d'; e.currentTarget.style.background = '#026eb5'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px #026eb54d'; e.currentTarget.style.background = '#026eb5'; } }}
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

          <div style={{ display: 'flex', gap: 16 }}>
            <button style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #d1d5db', borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: '#374151', transition: 'background 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" width={20} alt="Google" /> Google
            </button>
            <button style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #d1d5db', borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: '#374151', transition: 'background 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <svg viewBox="0 0 24 24" fill="black" width="20" height="20"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" /></svg> Apple
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: '#6b7280' }}>
            Don't have an account? <Link href="/auth/register" style={{ fontWeight: 600, color: '#026eb5', textDecoration: 'none' }}>Sign up</Link>
          </p>

        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
