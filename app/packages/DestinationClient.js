'use client';

import Link from 'next/link';
import TourCard from '@/components/TourCard';
import { getMediaUrl } from '@/utils/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80';

const getFirstDestination = (pkg, targetSlug) => {
  if (!pkg?.destinations) return null;
  const match = pkg.destinations.find(d => d.destination?.slug === targetSlug || d.destination?.name?.toLowerCase() === targetSlug?.toLowerCase());
  return match?.destination || pkg.destinations[0]?.destination || null;
};

const getLocationParts = (pkg, targetSlug) => {
  const destination = getFirstDestination(pkg, targetSlug);
  const city = destination?.city?.name || destination?.name || '';
  const country = destination?.country || '';
  return { city, country, destination };
};

const normalizePackageToTour = (pkg, targetSlug) => {
  const { city, country, destination } = getLocationParts(pkg, targetSlug);
  const destinationsArr = (pkg?.destinations || []).map(item => item?.destination).filter(Boolean);
  const destinationNames = destinationsArr.map(d => d.name).filter(Boolean);
  const location = destinationNames.length ? destinationNames.join(', ') : city || country || 'Destination';
  const price = Number(pkg?.price) || 0;
  const duration = Number(pkg?.duration_days) || 1;
  
  const isInternational = pkg?.travel_type?.toLowerCase() === 'international';
  const computedType = isInternational ? 'International' : 'Domestic';

  return {
    id: pkg?.id,
    slug: pkg?.slug || `package-${pkg?.id}`,
    title: pkg?.name || 'Travel Package',
    location,
    country: country || city || location,
    type: computedType,
    duration,
    groupSize: 12,
    rating: Number(pkg?.rating) || 4.6,
    reviews: Number(pkg?.reviews_count) || Number(pkg?.reviews) || 0,
    price,
    originalPrice: price ? Math.round(price * 1.18) : 0,
    image: getMediaUrl(pkg?.main_image) || getMediaUrl(destination?.feature_image) || FALLBACK_IMAGE,
    featured: Boolean(pkg?.show_in_home_page),
    trending: Boolean(destination?.is_trending || pkg?.show_in_home_page),
    description: pkg?.description || destination?.title || '',
  };
};

export default function DestinationClient({ destinationSlug, packages = [] }) {
  // Extract destination info from the first package that has this destination
  let destInfo = null;
  for (const pkg of packages) {
    const d = getFirstDestination(pkg, destinationSlug);
    if (d) {
      destInfo = d;
      break;
    }
  }

  const displayTitle = destInfo?.name || (destinationSlug ? destinationSlug.replace(/-/g, ' ').toUpperCase() : 'All Packages');
  const displayImage = destInfo?.feature_image 
    ? getMediaUrl(destInfo.feature_image) 
    : (packages[0]?.main_image ? getMediaUrl(packages[0].main_image) : FALLBACK_IMAGE);

  const displayDescription = destInfo?.title || `Explore our handpicked collection of ${displayTitle} tours designed for the perfect getaway.`;

  const tours = (packages || []).map(pkg => normalizePackageToTour(pkg, destinationSlug));

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero Banner */}
      <div 
        style={{ 
          height: '400px', 
          background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${displayImage}) center/cover no-repeat`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '0 20px',
          paddingTop: '80px'
        }}
      >
        <div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: '16px', letterSpacing: '-1px' }}>
            {displayTitle}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            {displayDescription}
          </p>
          <nav aria-label="breadcrumb" style={{ marginTop: '24px' }}>
            <ol className="breadcrumb mb-0" style={{ background: 'none', padding: 0, justifyContent: 'center' }}>
              <li className="breadcrumb-item"><Link href="/" style={{ color: 'rgba(255,255,255,0.7)' }}>Home</Link></li>
              <li className="breadcrumb-item"><Link href="/tours" style={{ color: 'rgba(255,255,255,0.7)' }}>Tours</Link></li>
              <li className="breadcrumb-item active" style={{ color: 'white' }}>{displayTitle}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="container" style={{ padding: '60px 0 100px' }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {tours.length} {tours.length === 1 ? 'Package' : 'Packages'} Found
          </h2>
        </div>
        
        {tours.length > 0 ? (
          <div className="row g-4">
            {tours.map((tour) => (
              <div key={tour.id} className="col-12 col-md-6 col-lg-4">
                <TourCard tour={tour} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌴</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>No packages found</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Try exploring other destinations or themes.</p>
            <Link href="/tours" className="btn btn-primary mt-4" style={{ borderRadius: '8px', padding: '10px 24px' }}>
              View All Tours
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
