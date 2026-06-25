'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHomeDestinations, getMediaUrl } from '@/utils/api';
import { getDestinationHref } from '@/utils/destinationLinks';

const fallbackImages = [
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
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

function DestinationMosaicCard({ item, type, index, isMirrored }) {
  // Pattern 1 (Trending): Large on Left (index 0 is large)
  // Pattern 2 (Visa Free): Large on Right (index 4 is large)
  const isLarge = isMirrored ? index === 4 : index === 0;

  return (
    <Link
      href={item.href || getDestinationHref(item)}
      className={`dest-card ${isLarge ? 'dest-large' : 'dest-small'}`}
    >
      <div className="dest-img-wrap">
        <img
          src={item.image}
          alt={item.alt || item.name}
          className="dest-img"
          loading="lazy"
        />
        <div className="dest-overlay" />
      </div>

      <div className="dest-badge">
        {type === 'trending' ? 'Trending' : 'Visa Free'}
      </div>

      <div className="dest-content">
        <div className="dest-subtitle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="12" height="12" strokeWidth="2.5" style={{ color: 'var(--color-secondary)', marginRight: 4 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.subtitle}
          </span>
        </div>
        <h3 className="dest-title">
          {item.name}
        </h3>
      </div>
    </Link>
  );
}

export default function PopularDestinationRows() {
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
          items: trending?.length ? trending.slice(0, 5).map(mapDestination) : [],
        },
        {
          id: 'visafree',
          title: 'VISA FREE DESTINATIONS',
          items: visaFree?.length ? visaFree.slice(0, 5).map(mapDestination) : [],
        },
      ]);
      setLoading(false);
    };

    loadDestinations();

    return () => {
      mounted = false;
    };
  }, []);

  const rowEyebrows = {
    trending: 'POPULAR ESCAPES',
    visafree: 'HASSLE-FREE TRAVEL',
  };

  const rowSubtitles = {
    trending: 'Discover the hottest destinations that travelers are flocking to right now.',
    visafree: 'Pack your bags and go! No visa approvals required for these popular getaways.',
  };

  return (
    <section style={{
      background: 'linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-soft) 100%)',
      padding: '68px 0 72px',
      borderTop: '1px solid var(--color-border)',
    }}>
      <style>{`
        .dest-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(2, 200px);
          gap: 16px;
        }

        .dest-grid.mirrored .dest-large {
          grid-column: span 2;
          grid-row: span 2;
          order: 10; /* Force it to the end logically if needed, but CSS Grid places by source order. We'll rely on source order handling or explicit placement. */
        }
        
        /* If mirrored, we want index 4 to be large, and it's at the end. It naturally falls into the last 2x2 cells. */

        .dest-card {
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          text-decoration: none;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }

        .dest-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.15);
        }

        .dest-large {
          grid-column: span 2;
          grid-row: span 2;
        }

        .dest-small {
          grid-column: span 1;
          grid-row: span 1;
        }

        .dest-img-wrap {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .dest-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dest-card:hover .dest-img {
          transform: scale(1.08);
        }

        .dest-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%);
          z-index: 2;
        }

        .dest-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 999px;
          padding: 6px 12px;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          z-index: 4;
        }

        .dest-content {
          position: relative;
          z-index: 3;
          padding: 20px;
        }

        .dest-subtitle {
          display: flex;
          align-items: center;
          color: rgba(255, 255, 255, 0.85);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .dest-title {
          color: white;
          font-size: 20px;
          font-weight: 800;
          font-family: 'Poppins', sans-serif;
          margin: 0;
          line-height: 1.1;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }

        .dest-large .dest-title {
          font-size: 32px;
        }

        @media (max-width: 1024px) {
          .dest-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: auto;
          }
          .dest-large, .dest-small {
            grid-column: span 1;
            grid-row: span 1;
            height: 220px;
          }
          .dest-large .dest-title {
            font-size: 24px;
          }
        }

        @media (max-width: 640px) {
          .dest-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="container" style={{ margin: '0 auto' }}>
        {rows.map((row) => (
          <div key={row.id} style={{ marginBottom: row.id === 'visafree' ? 0 : 64 }}>
            <div style={{ marginBottom: 28 }}>
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
                fontSize: 30,
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

            <div className={`dest-grid ${row.id === 'visafree' ? 'mirrored' : ''}`}>
              {row.items.map((item, index) => (
                <DestinationMosaicCard key={`${row.id}-${item.name}-${index}`} item={item} type={row.id} index={index} isMirrored={row.id === 'visafree'} />
              ))}
              {!loading && row.items.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
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
                  We are refreshing these destinations. Please check back soon.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
