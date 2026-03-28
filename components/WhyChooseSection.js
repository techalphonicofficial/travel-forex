'use client';
import Link from 'next/link';

export default function WhyChooseSection() {
  return (
    <section style={{ background: 'white', padding: '52px 0 56px' }}>
      <style>{`
        .why-choose-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .image-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 1024px) {
          .why-choose-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .section-title {
            font-size: 24px !important;
          }
        }
      `}</style>

      <div className="container">
        <div className="why-choose-grid">

          {/* LEFT: Stats + features */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: '#026eb5', margin: '0 0 8px' }}>OUR TRACK RECORD</p>
            <h2 className="section-title" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 28, color: '#111827', lineHeight: 1.2, margin: '0 0 28px' }}>
              Why Choose<br />
              <span style={{ color: '#026eb5' }}>ITS TRAVELS AND TOURS?</span>
            </h2>

            {/* 3 big stats */}
            <div className="stats-grid">
              {[
                { number: '3400+', label: 'Holidays\nCustomized', icon: '✈️' },
                { number: '98%', label: 'Customer\nSatisfaction', icon: '😊' },
                { number: '4.9★', label: 'Average App\nRating', icon: '⭐' },
              ].map(({ number, label, icon }) => (
                <div key={number} style={{ textAlign: 'center', padding: '18px 8px', background: '#c5e5fb', borderRadius: 14, border: '1px solid #7abfee' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 24, color: '#026eb5', lineHeight: 1 }}>{number}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 5, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Feature bullets */}
            {[
              { icon: '🎯', title: '100% Customized', desc: 'Every holiday built from scratch — no templates.' },
              { icon: '💰', title: 'Best Price Guarantee', desc: "We'll match any verified cheaper quote, plus 5% off." },
              { icon: '🛡️', title: 'Zero Hidden Charges', desc: "Pay exactly what we quote. No surprises, ever." },
              { icon: '📞', title: '24/7 Expert Support', desc: 'Your dedicated travel expert is always reachable.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: '#c5e5fb', border: '1px solid #7abfee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}

            <Link
              href="/tours"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#026eb5', color: 'white', borderRadius: 999, padding: '12px 28px', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginTop: 8, boxShadow: '0 6px 20px #026eb54d' }}
            >
              Plan Your Holiday Now →
            </Link>
          </div>

          {/* RIGHT: Image grid */}
          <div className="image-grid">
            {[
              { src: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=500&q=80', span: true, label: 'Swiss Alps' },
              { src: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=500&q=80', span: false, label: 'Thailand' },
              { src: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&q=80', span: false, label: 'Maldives' },
              { src: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=500&q=80', span: false, label: 'Serengeti' },
              { src: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80', span: false, label: 'Japan' },
            ].map(({ src, span, label }, i) => (
              <div
                key={i}
                style={{ gridColumn: span ? '1 / -1' : undefined, height: span ? 195 : 150, borderRadius: 14, overflow: 'hidden', position: 'relative', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
              >
                <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                <div style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: 'white', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
