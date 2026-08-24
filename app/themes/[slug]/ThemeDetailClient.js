'use client';

import Link from 'next/link';
import TourCard from '@/components/TourCard';
import { getMediaUrl } from '@/utils/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';

const getFirstDestination = (pkg) => pkg?.destinations?.[0]?.destination || null;

const getLocationParts = (pkg) => {
  const destination = getFirstDestination(pkg);
  const mapping = destination?.mappings?.[0];
  const city = mapping?.city?.name || destination?.name || '';
  const country = mapping?.city?.country?.name || '';
  const continent = mapping?.city?.country?.continent?.name || '';
  return { city, country, continent, destination };
};

const normalizePackageToTour = (pkg) => {
  const { city, country, continent, destination } = getLocationParts(pkg);
  const destinationsArr = (pkg?.destinations || []).map(item => item?.destination).filter(Boolean);
  const destinationNames = destinationsArr.map(d => d.name).filter(Boolean);
  const location = destinationNames.length ? destinationNames.join(', ') : city || country || 'Destination';
  const price = Number(pkg?.price) || 0;
  const duration = Number(pkg?.duration_days) || 1;
  
  const isInternational = destinationsArr.some(d => d.type?.toLowerCase() === 'international');
  const computedType = pkg?.travel_type 
    ? (pkg.travel_type.toLowerCase() === 'international' ? 'International' : 'Domestic') 
    : (isInternational ? 'International' : 'Domestic');

  return {
    id: pkg?.id,
    slug: pkg?.slug || `package-${pkg?.id}`,
    title: pkg?.name || 'Travel Package',
    location,
    country: country || city || location,
    continent,
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

export default function ThemeDetailClient({ slug, category, packages = [] }) {
  const displayTitle = category?.title || slug.replace(/-/g, ' ').toUpperCase();
  const displayImage = category?.feature_image 
    ? getMediaUrl(category.feature_image) 
    : 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80';

  const tours = (packages || []).map(normalizePackageToTour);

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero Banner */}
      <div 
        style={{ 
          height: '400px', 
          background: `url(${displayImage}) center/cover no-repeat`,
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
            {category?.description || `Explore our handpicked collection of ${displayTitle} tours designed for the perfect getaway.`}
          </p>
          <nav aria-label="breadcrumb" style={{ marginTop: '24px' }}>
            <ol className="breadcrumb mb-0" style={{ background: 'none', padding: 0, justifyContent: 'center' }}>
              <li className="breadcrumb-item"><Link href="/" style={{ color: 'rgba(255,255,255,0.7)' }}>Home</Link></li>
              <li className="breadcrumb-item"><Link href="/themes" style={{ color: 'rgba(255,255,255,0.7)' }}>Themes</Link></li>
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
            {tours.map(tour => (
              <div key={tour.id} className="col-12 col-md-6 col-lg-4">
                <TourCard tour={tour} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>
              No Packages Available
            </h3>
            <p style={{ color: '#64748b', margin: 0 }}>
              We currently don't have any active packages for this theme. Check back later!
            </p>
            <Link href="/themes" className="btn btn-primary mt-4" style={{ borderRadius: '99px', padding: '10px 24px', fontWeight: 600 }}>
              Browse Other Themes
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
