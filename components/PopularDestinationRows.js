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

function DestinationCard({ item }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={item.href || getDestinationHref(item)}
      style={{ flexShrink: 0, width: 200, textDecoration: 'none', display: 'block' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 200,
          height: 210,
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-5px)' : 'none',
          transition: 'all 0.35s ease',
        }}
      >
        <img
          src={item.image}
          alt={item.alt || item.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.45s ease',
          }}
          loading="lazy"
        />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.72) 100%)',
        }} />

        <div style={{
          position: 'absolute', bottom: 14, left: 12, right: 12,
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            margin: '0 0 2px',
            lineHeight: 1.3,
          }}>
            {item.subtitle}
          </p>
          <p style={{
            color: 'white',
            fontSize: item.name.length > 12 ? 18 : item.name.length > 8 ? 20 : 24,
            fontWeight: 800,
            fontFamily: 'Poppins, sans-serif',
            margin: 0,
            lineHeight: 1.1,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            {item.name}
          </p>
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
    if (el) el.scrollBy({ left: dir * 214, behavior: 'smooth' });
  };

  return (
    <section style={{ background: '#fff', padding: '52px 0 64px' }}>
      <div className="container" style={{ margin: '0 auto', padding: '0 24px' }}>
        {rows.map((row) => (
          <div key={row.id} style={{ marginBottom: 52 }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <h2 style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 900,
                fontSize: 18,
                color: '#111827',
                margin: 0,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                {row.title}
              </h2>

              <div style={{ display: 'flex', gap: 8 }}>
                {['‹', '›'].map((arrow, i) => (
                  <button
                    key={arrow}
                    onClick={() => scroll(row.id, i === 0 ? -1 : 1)}
                    style={{
                      width: 34, height: 34,
                      borderRadius: '50%',
                      border: '1.5px solid #d1d5db',
                      background: 'white',
                      color: '#374151',
                      fontSize: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      lineHeight: 1,
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                  >
                    {arrow}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={el => { scrollRefs.current[row.id] = el; }}
              style={{
                display: 'flex',
                gap: 14,
                overflowX: 'auto',
                paddingBottom: 4,
                paddingTop: '10px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {row.items.map((item, index) => (
                <DestinationCard key={`${row.id}-${item.name}-${index}`} item={item} />
              ))}
              {!loading && row.items.length === 0 && (
                <div style={{
                  flex: '1 0 100%',
                  minHeight: 120,
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px dashed #d1d5db',
                  borderRadius: 12,
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 700,
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
