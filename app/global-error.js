'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, unstable_retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', background: '#f8faff', color: '#0a0f1e' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div
            style={{
              maxWidth: 640,
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
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
            <p style={{ margin: '0 0 8px', color: 'var(--color-primary)', fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
              Application Error
            </p>
            <h1 style={{ fontSize: 38, lineHeight: 1.15, margin: '0 0 12px', fontWeight: 900 }}>
              We hit an unexpected issue
            </h1>
            <p style={{ color: '#4a5568', fontSize: 16, lineHeight: 1.7, margin: '0 auto 28px', maxWidth: 500 }}>
              Try refreshing this screen. If the issue continues, open the home page again.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => unstable_retry()}
                style={{ padding: '14px 28px', borderRadius: 12, background: 'var(--color-primary)', color: '#ffffff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
              >
                Try Again
              </button>
              <Link
                href="/"
                style={{ padding: '13px 28px', borderRadius: 12, background: 'transparent', color: 'var(--color-primary)', border: '2px solid var(--color-primary)', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
              >
                Go Home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
