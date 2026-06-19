'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getHomeDestinations, getMediaUrl } from '@/utils/api';
import { getDestinationHref } from '@/utils/destinationLinks';

const fallbackImages = [
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&q=80',
  'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80',
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=500&q=80',
];

const getDestinationSubtitle = (destination) => {
  if (destination.title) return destination.title;
  const city = destination.mappings?.[0]?.city;
  const country = city?.country?.name;
  if (city?.name && country) return `${city.name}, ${country}`;
  return destination.type || 'Explore more';
};

const mapDestination = (destination, index) => ({
  name: destination.name,
  subtitle: getDestinationSubtitle(destination),
  image: getMediaUrl(destination.feature_image) || fallbackImages[index % fallbackImages.length],
  alt: destination.feature_image_alt || destination.name,
  href: getDestinationHref(destination),
});

function DestinationCard({ item, type }) {
  const [hovered, setHovered] = useState(false);

  const isTrending = type === 'trending';

  return (
    <Link
      href={item.href || getDestinationHref(item)}
      style={{ flexShrink: 0, width: 260, textDecoration: 'none', display: 'block' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 260,
          height: 340,
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-8px)' : 'none',
          boxShadow: hovered 
            ? '0 20px 35px rgba(2, 110, 181, 0.18)' 
            : '0 8px 16px rgba(0,0,0,0.06)',
          transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        <img
          src={item.image}
          alt={item.alt || item.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transform: hovered ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          loading="lazy"
        />

        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 999,
          padding: '6px 12px',
          color: '#fff',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 2,
        }}>
          {isTrending ? '🔥 Trending' : '⚡ Visa Free'}
        </div>

        <div style={{
          position: 'absolute',
          inset: 0,
          background: hovered
            ? 'linear-gradient(180deg, rgba(10, 15, 30, 0.1) 0%, rgba(10, 15, 30, 0.5) 50%, rgba(10, 15, 30, 0.88) 100%)'
            : 'linear-gradient(180deg, rgba(10, 15, 30, 0.05) 0%, rgba(10, 15, 30, 0.4) 50%, rgba(10, 15, 30, 0.8) 100%)',
          transition: 'all 0.4s ease',
          zIndex: 1,
        }} />

        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 18,
          right: 18,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          zIndex: 2,
        }}>
          <div style={{ flex: 1, paddingRight: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 4,
              lineHeight: 1.2,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="12" height="12" strokeWidth="2.5" style={{ color: 'var(--color-secondary)' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.subtitle}
              </span>
            </div>
            <p style={{
              color: 'white',
              fontSize: item.name.length > 14 ? 18 : 22,
              fontWeight: 800,
              fontFamily: 'Poppins, sans-serif',
              margin: 0,
              lineHeight: 1.1,
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>
              {item.name}
            </p>
          </div>

          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: hovered ? 'var(--color-secondary)' : 'rgba(255, 255, 255, 0.25)',
            backdropFilter: hovered ? 'none' : 'blur(4px)',
            WebkitBackdropFilter: hovered ? 'none' : 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: hovered ? '#111827' : '#fff',
            transform: hovered ? 'scale(1.1) translateX(2px)' : 'scale(1)',
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" strokeWidth="3">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PopularDestinationRows() {
  const scrollRefs = useRef({});
  const [rows, setRows] = useState([
    { id: 'trending', title: 'TRENDING DESTINATIONS', items: [] },
    { id: 'visafree', title: 'VISA FREE DESTINATIONS', items: [] },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDestinations = async () => {
      const [trending, visaFree] = await Promise.all([
        getHomeDestinations('trending'),
        getHomeDestinations('visa-free'),
      ]);

      if (!mounted) return;

      setRows([
        {
          id: 'trending',
          title: 'TRENDING DESTINATIONS',
          items: trending?.length ? trending.map(mapDestination) : [],
        },
        {
          id: 'visafree',
          title: 'VISA FREE DESTINATIONS',
          items: visaFree?.length ? visaFree.map(mapDestination) : [],
        },
      ]);
      setLoading(false);
    };

    loadDestinations();

    return () => {
      mounted = false;
    };
  }, []);

  const scroll = (rowId, dir) => {
    const el = scrollRefs.current[rowId];
    if (el) el.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  const rowEyebrows = {
    trending: '🔥 POPULAR ESCAPES',
    visafree: '✈️ HASSLE-FREE TRAVEL',
  };

  const rowSubtitles = {
    trending: 'Explore the most loved and highly recommended places by global travelers.',
    visafree: 'Pack your bags and go! No visa approvals required for these popular getaways.',
  };

  return (
    <section style={{
      background: 'linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-soft) 100%)',
      padding: '72px 0 80px',
      borderTop: '1px solid var(--color-border)',
    }}>
      <div className="container" style={{ margin: '0 auto', padding: '0 24px' }}>
        {rows.map((row) => (
          <div key={row.id} style={{ marginBottom: 64 }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 28,
            }}>
              <div>
                <p style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  letterSpacing: '1.8px',
                  textTransform: 'uppercase',
                  margin: '0 0 6px 0',
                }}>
                  {rowEyebrows[row.id]}
                </p>
                <h2 style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 900,
                  fontSize: 28,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  lineHeight: 1.1,
                }}>
                  {row.title}
                </h2>
                <p style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: 14,
                  margin: '8px 0 0 0',
                  maxWidth: 580,
                }}>
                  {rowSubtitles[row.id]}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {['left', 'right'].map((dir, i) => (
                  <button
                    key={dir}
                    onClick={() => scroll(row.id, dir === 'left' ? -1 : 1)}
                    aria-label={`Scroll ${dir}`}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: '1.5px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--color-primary-light)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.color = 'var(--color-primary)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--color-bg)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                    }}
                  >
                    {dir === 'left' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={el => { scrollRefs.current[row.id] = el; }}
              style={{
                display: 'flex',
                gap: 20,
                overflowX: 'auto',
                paddingBottom: '24px',
                paddingTop: '12px',
                paddingLeft: '4px',
                paddingRight: '4px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              className="scroll-container-hide"
            >
              <style>{`
                .scroll-container-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {row.items.map((item, index) => (
                <DestinationCard key={`${row.id}-${item.name}-${index}`} item={item} type={row.id} />
              ))}
              {!loading && row.items.length === 0 && (
                <div style={{
                  flex: '1 0 100%',
                  minHeight: 160,
                  display: 'grid',
                  placeItems: 'center',
                  border: '1.5px dashed var(--color-border)',
                  borderRadius: 16,
                  color: 'var(--color-text-muted)',
                  fontSize: 14,
                  fontWeight: 600,
                  background: 'var(--color-bg-soft)',
                }}>
                  No live destinations returned.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
