'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, unstable_retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-soft)', display: 'flex', alignItems: 'center', padding: '120px 24px 80px' }}>
      <div className="container">
        <div
          style={{
            maxWidth: 680,
            margin: '0 auto',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            padding: '42px 34px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: '50%',
              background: 'rgba(229,57,53,0.12)',
              color: '#d32f2f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              fontWeight: 900,
              margin: '0 auto 22px',
            }}
          >
            !
          </div>

          <span className="section-label">Something went wrong</span>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: 12 }}>
            We could not load this page
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 28px' }}>
            Please try again. If it still happens, return home and continue browsing packages from there.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary" onClick={() => unstable_retry()}>
              Try Again
            </button>
            <Link href="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
