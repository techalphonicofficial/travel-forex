'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function generateBookingId() {
  return 'TT-' + new Date().getFullYear() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

export default function ConfirmationPage() {
  const [bookingId] = useState(generateBookingId);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    setConfetti(true);
    const t = setTimeout(() => setConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh', background: 'var(--color-bg-soft)' }}>
      <div className="container" style={{ maxWidth: 700 }}>
        {/* Success Card */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-2xl)',
            padding: 56,
            textAlign: 'center',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Check Circle */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00b894, #00cec9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 30px rgba(0,184,148,0.35)',
              animation: 'pulse-success 2s ease-in-out infinite',
            }}
          >
            <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(28px, 4vw, 38px)',
              color: 'var(--color-text-primary)',
              marginBottom: 12,
            }}
          >
            🎉 Booking Confirmed!
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 460, margin: '0 auto 32px' }}>
            Your adventure awaits! A confirmation email with all details has been sent to your inbox.
          </p>

          {/* Booking ID */}
          <div
            style={{
              background: 'var(--color-bg-soft)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px 32px',
              border: '2px dashed var(--color-border)',
              marginBottom: 36,
              display: 'inline-block',
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 600, letterSpacing: 1 }}>
              BOOKING REFERENCE
            </div>
            <div
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 800,
                fontSize: 28,
                color: 'var(--color-primary)',
                letterSpacing: 2,
              }}
            >
              {bookingId}
            </div>
          </div>

          {/* Info cards */}
          {/* <div className="row g-3 mb-5 text-start">
            {[
              { icon: '📧', title: 'Email Confirmation', desc: 'Sent to your registered email' },
              { icon: '📱', title: 'SMS Notification', desc: 'Details sent to your phone' },
              { icon: '📄', title: 'E-ticket', desc: 'Available in your dashboard' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="col-sm-4">
                <div
                  style={{
                    background: 'var(--color-bg-soft)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 16,
                    height: '100%',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div> */}

          {/* Action Buttons */}
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button
              className="btn-secondary d-flex align-items-center gap-2"
              onClick={() => window.print()}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
              </svg>
              Download PDF
            </button>
            <button
              className="btn-secondary d-flex align-items-center gap-2"
              onClick={() => {
                const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=ITS TRAVELS AND TOURS+Tour+${bookingId}&details=Your+tour+booking+ref:+${bookingId}`;
                window.open(url, '_blank');
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V8h16v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zM9 14H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
              </svg>
              Add to Calendar
            </button>
            <Link href="/dashboard" className="btn-primary d-flex align-items-center gap-2">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              Go to Dashboard
            </Link>
          </div>

          <div className="mt-4">
            <Link href="/tours" style={{ color: 'var(--color-text-muted)', fontSize: 14, textDecoration: 'underline' }}>
              Book Another Tour
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-success {
          0%, 100% { box-shadow: 0 8px 30px rgba(0,184,148,0.35); }
          50% { box-shadow: 0 8px 50px rgba(0,184,148,0.6); }
        }
      `}</style>
    </div>
  );
}
