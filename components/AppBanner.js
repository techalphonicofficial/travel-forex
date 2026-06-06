'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AppBanner() {
  const [email, setEmail] = useState('');

  return (
    <section style={{ background: '#0d1f15', padding: '52px 0 56px', position: 'relative', overflow: 'hidden' }}>
      {/* BG circles */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 450, height: 450, borderRadius: '50%', background: 'rgba(255,255,255,0.025)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(134,239,172,0.04)', pointerEvents: 'none' }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="app-banner-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center' }}>

          {/* LEFT: text */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--color-secondary)', margin: '0 0 10px' }}>
              📱 MOBILE APP
            </p>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 34, color: 'white', lineHeight: 1.15, margin: '0 0 14px' }}>
              Your Best Way<br />to Plan a Trip!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, margin: '0 0 28px', maxWidth: 480 }}>
              Chat with your travel expert, track your itinerary, get exclusive app-only deals and 24/7 support — all in one place.
            </p>

            {/* Features */}
            <div className="app-banner-features" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 30, maxWidth: 460 }}>
              {[
                '✅ Chat with expert 24/7',
                '✅ Offline trip documents',
                '✅ Real-time updates',
                '✅ App-only deals up to 25%',
              ].map(f => (
                <div key={f} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{f}</div>
              ))}
            </div>

            {/* Email form */}
            <form
              className="app-banner-form"
              onSubmit={e => { e.preventDefault(); toast.success('App link sent! Check your email 📱'); setEmail(''); }}
              style={{ display: 'flex', gap: 8, maxWidth: 420, marginBottom: 20 }}
            >
              <input
                type="email" placeholder="Enter your email"
                value={email} onChange={e => setEmail(e.target.value)} required
                style={{ flex: 1, padding: '12px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 14, outline: 'none', backdropFilter: 'blur(8px)' }}
              />
              <button
                type="submit"
                style={{ background: 'var(--color-secondary)', color: '#0d2f1e', border: 'none', borderRadius: 999, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background = '#4ade80'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-secondary)'}
              >
                Get App Link
              </button>
            </form>

            {/* Store badges */}
            <div className="app-banner-stores" style={{ display: 'flex', gap: 10 }}>
              {[
                { icon: '🍎', store: 'App Store', sub: 'Download on the' },
                { icon: '▶️', store: 'Google Play', sub: 'Get it on' },
              ].map(({ icon, store, sub }) => (
                <button key={store} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '10px 16px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{sub}</div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{store}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Phone mockup */}
          <div className="app-banner-phone-wrap" style={{ position: 'relative', flexShrink: 0 }}>
            <div className="app-banner-phone" style={{ width: 260, height: 500, background: '#111827', borderRadius: 38, border: '6px solid rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', position: 'relative' }}>
              {/* Top notch */}
              <div style={{ background: 'var(--color-primary)', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 70, height: 18, background: '#111827', borderRadius: 999 }} />
              </div>
              {/* Hero image */}
              <img src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80" alt="Bali" style={{ width: '100%', height: 185, objectFit: 'cover', display: 'block' }} />
              {/* App content */}
              <div style={{ background: 'white', padding: '14px 14px 8px', flex: 1 }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 3 }}>Bali Paradise Escape</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>7 Days · 4★ Hotels</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-primary)' }}>₹1,51,920</span>
                </div>
                <div style={{ background: 'var(--color-primary)', borderRadius: 8, padding: '8px', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 12, marginBottom: 12 }}>Enquire Now</div>
                {/* Bottom nav */}
                <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 6, borderTop: '1px solid #f3f4f6' }}>
                  {['🏠', '🔍', '❤️', '👤'].map((ic, i) => (
                    <span key={i} style={{ fontSize: 18, opacity: i === 0 ? 1 : 0.35 }}>{ic}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div style={{ position: 'absolute', top: 30, right: -28, background: 'white', borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>25%</div>
              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>APP DEAL</div>
            </div>
            <div style={{ position: 'absolute', bottom: 60, left: -28, background: 'white', borderRadius: 14, padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>⭐</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#111827', lineHeight: 1 }}>4.9 Rating</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>12K reviews</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 860px) {
          .app-banner-grid {
            grid-template-columns: 1fr !important;
            gap: 34px !important;
            text-align: center;
          }
          .app-banner-features,
          .app-banner-form,
          .app-banner-stores {
            margin-left: auto;
            margin-right: auto;
          }
          .app-banner-phone-wrap {
            justify-self: center;
          }
        }

        @media (max-width: 560px) {
          .app-banner-features {
            grid-template-columns: 1fr !important;
            text-align: left;
          }
          .app-banner-form {
            display: grid !important;
          }
          .app-banner-stores {
            display: grid !important;
          }
          .app-banner-stores button,
          .app-banner-form button {
            width: 100%;
            justify-content: center;
          }
          .app-banner-phone {
            width: min(250px, 78vw) !important;
            height: auto !important;
            min-height: 430px;
          }
        }
      `}</style>
    </section>
  );
}
