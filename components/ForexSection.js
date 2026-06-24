'use client';

import Link from 'next/link';

export default function ForexSection() {
  return (
    <section style={{ padding: '68px 0 76px', background: 'var(--color-bg-soft)', color: 'var(--color-text-primary)', position: 'relative', overflow: 'hidden' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 38 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 10 }}>
            TRAVELER'S FIRST CHOICE
          </p>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 32, color: 'var(--color-text-primary)', marginBottom: 12 }}>
            Why buy Forex from us?
          </h2>
        </div>

        <div className="row g-4 align-items-stretch">
          {/* Card 1 */}
          <div className="col-12 col-md-6">
            <Link href="/forex" style={{ display: 'block', textDecoration: 'none', color: 'inherit', height: '100%' }}>
              <div style={{
                background: 'var(--color-bg-card)', borderRadius: 16, overflow: 'hidden',
                position: 'relative', height: '100%', minHeight: 280, border: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 32,
                boxShadow: 'var(--shadow-md)', transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' }}>
                  <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Buy Forex Card" />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--color-bg-card) 0%, rgba(255,255,255,0) 100%)' }} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, maxWidth: '60%' }}>
                  <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, color: 'var(--color-text-primary)' }}>Buy Forex Card</h3>
                  <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
                    Get a forex card with the best exchange rates and zero cross-currency charges.
                  </p>
                  <span style={{ padding: '10px 24px', background: 'var(--color-primary)', color: 'white', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
                    Buy Forex Card
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Card 2 */}
          <div className="col-12 col-md-6">
            <Link href="/forex" style={{ display: 'block', textDecoration: 'none', color: 'inherit', height: '100%' }}>
              <div style={{
                background: 'var(--color-bg-card)', borderRadius: 16, overflow: 'hidden',
                position: 'relative', height: '100%', minHeight: 280, border: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 32,
                boxShadow: 'var(--shadow-md)', transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' }}>
                  <img src="https://images.unsplash.com/photo-1580519542036-ed4768589f46?w=500&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Send Money Abroad" />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--color-bg-card) 0%, rgba(255,255,255,0) 100%)' }} />
                </div>
                <div style={{ position: 'relative', zIndex: 2, maxWidth: '60%' }}>
                  <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, color: 'var(--color-text-primary)' }}>Send Money Abroad</h3>
                  <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
                    Transfer money abroad safely and securely for education, medical or leisure.
                  </p>
                  <span style={{ padding: '10px 24px', background: 'var(--color-primary)', color: 'white', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
                    Send Money
                  </span>
                </div>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
