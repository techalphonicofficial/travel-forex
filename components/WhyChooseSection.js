'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHomePage, getMediaUrl } from '@/utils/api';

const statIcons = ['01', '02', '03'];

const fallbackStats = [
  { number: '3400+', label: 'Holidays\nCustomized', icon: statIcons[0] },
  { number: '98%', label: 'Customer\nSatisfaction', icon: statIcons[1] },
  { number: '4.9/5', label: 'Average App\nRating', icon: statIcons[2] },
];

const fallbackFeatures = [
  { icon: '1', title: '100% Customized', desc: 'Every holiday built from scratch - no templates.' },
  { icon: '2', title: 'Best Price Guarantee', desc: "We'll match any verified cheaper quote, plus 5% off." },
  { icon: '3', title: 'Zero Hidden Charges', desc: 'Pay exactly what we quote. No surprises, ever.' },
  { icon: '4', title: '24/7 Expert Support', desc: 'Your dedicated travel expert is always reachable.' },
];

const fallbackGallery = [
  { src: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=500&q=80', span: true, label: 'Swiss Alps' },
  { src: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=500&q=80', span: false, label: 'Thailand' },
  { src: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&q=80', span: false, label: 'Maldives' },
  { src: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=500&q=80', span: false, label: 'Serengeti' },
  { src: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80', span: false, label: 'Japan' },
];

export default function WhyChooseSection() {
  const [previewImage, setPreviewImage] = useState(null);
  const [content, setContent] = useState({
    title: 'Why Choose ITS TRAVELS AND TOURS?',
    stats: fallbackStats,
    features: fallbackFeatures,
    gallery: fallbackGallery,
  });

  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewImage]);

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      const page = await getHomePage();
      const section = page?.details?.find((item) => item.key === 'why-choose-us-home' || item.section === 'why_choose_us');
      const data = section?.json_data || {};

      if (!mounted || !section) return;

      setContent({
        title: section.title || 'Why Choose ITS TRAVELS AND TOURS?',
        stats: data.stats?.length
          ? data.stats.map((item, index) => ({
            number: item.value,
            label: item.label,
            icon: statIcons[index] || statIcons[0],
          }))
          : fallbackStats,
        features: data.features?.length
          ? data.features.map((item, index) => ({
            icon: String(index + 1),
            title: item.title,
            desc: item.desc || item.description,
          }))
          : fallbackFeatures,
        gallery: data.gallery?.length
          ? data.gallery.map((item, index) => ({
            src: getMediaUrl(item.img || item.image),
            span: index === 0,
            label: item.lbl || item.label || '',
          })).filter((item) => item.src)
          : fallbackGallery,
      });
    };

    loadContent();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section style={{ background: 'transparent', padding: '80px 0' }}>
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
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--color-primary)', margin: '0 0 8px' }}>OUR TRACK RECORD</p>
            <h2 className="section-title" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 30, color: 'var(--color-primary)', lineHeight: 1.2, margin: '0 0 28px' }}>
              {content.title}
            </h2>

            <div className="stats-grid">
              {content.stats.map(({ number, label, icon }) => (
                <div key={`${number}-${label}`} style={{ textAlign: 'center', padding: '18px 10px', background: 'color-mix(in srgb, var(--color-primary-light) 64%, white)', borderRadius: 12, border: '1px solid var(--brand-primary-border)' }}>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--color-primary)', lineHeight: 1 }}>{number}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 5, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{label}</div>
                </div>
              ))}
            </div>

            {content.features.map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: 'var(--color-primary-light)', border: '1px solid var(--brand-primary-border)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}

            <Link
              href="/tours"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: 'white', borderRadius: 999, padding: '12px 28px', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginTop: 8, boxShadow: '0 6px 20px color-mix(in srgb, var(--color-primary) 30%, transparent)' }}
            >
              Plan Your Holiday Now
            </Link>
          </div>

          <div className="image-grid">
            {content.gallery.map(({ src, span, label }, i) => (
              <div
                key={`${src}-${i}`}
                onClick={() => setPreviewImage({ src, label })}
                style={{ 
                  gridColumn: span ? '1 / -1' : undefined, 
                  height: span ? 195 : 150, 
                  borderRadius: 14, 
                  overflow: 'hidden', 
                  position: 'relative', 
                  boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                  cursor: 'pointer',
                  transition: 'transform 0.25s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="Click to view full image"
              >
                <img src={src} alt={label || 'Travel gallery'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                {label && (
                  <div style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: 'white', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                    {label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Pop-up Modal */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(5, 10, 20, 0.92)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Close / Cross Button */}
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            aria-label="Close preview"
            style={{
              position: 'fixed',
              top: '1.25rem',
              right: '1.25rem',
              zIndex: 1000002,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255, 255, 255, 0.5)',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>

          {/* Media Content Box */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: 'min(92vw, 1000px)',
              maxHeight: 'min(86vh, 800px)',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            <img
              src={previewImage.src}
              alt={previewImage.label || 'Enlarged gallery view'}
              style={{
                maxWidth: '100%',
                maxHeight: 'min(82vh, 760px)',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '12px',
                userSelect: 'none',
              }}
            />
            {previewImage.label && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                textAlign: 'center',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)'
              }}>
                {previewImage.label}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

