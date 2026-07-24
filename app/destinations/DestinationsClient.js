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
  image: getMediaUrl(destination.feature_image) || 
         getMediaUrl(destination.gallery?.find((item) => item.is_primary)?.url) || 
         getMediaUrl(destination.gallery?.[0]?.url) || 
         fallbackImages[index % fallbackImages.length],
  alt: destination.feature_image_alt || destination.gallery?.[0]?.alt_text || destination.name,
  href: getDestinationHref(destination),
});

export default function DestinationsClient({ type }) {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchDest = async () => {
      try {
        const data = await getHomeDestinations(type);
        if (mounted) {
          setDestinations(data?.length ? data.map(mapDestination) : []);
        }
      } catch (err) {
        console.error('Failed to load destinations:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDest();
    return () => { mounted = false; };
  }, [type]);

  const displayTitle = type === 'visafree' ? 'Visa Free Destinations' : 'Trending Destinations';
  const displaySubtitle = type === 'visafree' 
    ? 'Pack your bags and go! No visa approvals required for these popular getaways.'
    : 'Discover the hottest destinations that travelers are flocking to right now.';

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
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
          height: 250px;
        }

        .dest-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.15);
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
      `}</style>
      
      {/* Header */}
      <div 
        style={{ 
          height: '250px', 
          background: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '0 20px',
          paddingTop: '60px'
        }}
      >
        <div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.5px' }}>
            {displayTitle}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            {displaySubtitle}
          </p>
          <nav aria-label="breadcrumb" style={{ marginTop: '20px' }}>
            <ol className="breadcrumb mb-0" style={{ background: 'none', padding: 0, justifyContent: 'center' }}>
              <li className="breadcrumb-item"><Link href="/" style={{ color: 'rgba(255,255,255,0.7)' }}>Home</Link></li>
              <li className="breadcrumb-item active" style={{ color: 'white' }}>{displayTitle}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="container" style={{ padding: '60px 0 100px' }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {destinations.length} {destinations.length === 1 ? 'Destination' : 'Destinations'} Found
          </h2>
        </div>

        {loading ? (
          <div className="row g-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="col-12 col-md-6 col-lg-4">
                <div style={{ height: 250, background: '#e2e8f0', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
              </div>
            ))}
          </div>
        ) : destinations.length > 0 ? (
          <div className="row g-4">
            {destinations.map((item, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-4">
                <Link
                  href={item.href}
                  className="dest-card"
                >
                  <div className="dest-img-wrap">
                    <img
                      src={item.image}
                      alt={item.alt}
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
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>No destinations found</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Try checking back later.</p>
          </div>
        )}
      </div>
    </main>
  );
}
