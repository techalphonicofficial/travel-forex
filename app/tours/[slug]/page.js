import { notFound } from 'next/navigation';
import TourDetailClient from './TourDetailClient';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';

const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://tourtravel.yber.in${path.startsWith('/') ? '' : '/'}${path}`;
};

const transformApiPackageToTourDetail = (pkg) => {
  const mainImage = getMediaUrl(pkg.main_image) || FALLBACK_IMAGE;
  const gallery = [mainImage, ...(pkg.gallery || []).map(g => getMediaUrl(g.image))];

  const highlights = pkg.highlights && pkg.highlights.length > 0 
    ? pkg.highlights.map(h => h.content || h.text || h)
    : (pkg.inclusions || []).map(inc => inc.text);
  const included = (pkg.inclusions || []).map(inc => inc.text);
  const excluded = (pkg.exclusions || []).map(exc => exc.text);

  let itinerary = [];
  if (pkg.destinations && Array.isArray(pkg.destinations)) {
    pkg.destinations.forEach(d => {
      const activities = d.activities ? Object.values(d.activities).flat() : [];
      activities.forEach(act => {
        itinerary.push({
          day: d.order, // or you can use a running counter if you want unique days
          title: act.name,
          description: act.description?.replace(/<[^>]+>/g, '') || '', // strip HTML tags for simple view
        });
      });
    });
  }

  if (itinerary.length === 0) {
    itinerary = [
      { day: 1, title: "Arrival", description: "Arrive and check in." },
      { day: 2, title: "Sightseeing", description: "Explore the destination." },
    ];
  }

  const location = pkg.destinations?.[0]?.destination?.name || 'Multiple Destinations';
  const country = pkg.destinations?.[0]?.destination?.country || '';

  return {
    id: pkg.id,
    slug: pkg.slug,
    title: pkg.name,
    description: pkg.description || pkg.name,
    price: Number(pkg.price) || 0,
    gallery,
    highlights: highlights.length > 0 ? highlights : ["Inclusive Breakfast", "Expert Local Guide", "Airport Transfers"],
    included: included.length > 0 ? included : ["Accommodation", "Daily Breakfast"],
    excluded: excluded.length > 0 ? excluded : ["Round-trip airfare", "Personal expenses"],
    itinerary,
    groupSize: 12,
    duration: pkg.duration_days || 1,
    location,
    country,
    type: pkg.travel_type ? (pkg.travel_type.toLowerCase() === 'international' ? 'International' : 'Domestic') : 'Domestic'
  };
};

const transformApiPackageToCard = (pkg) => {
  const mainImage = getMediaUrl(pkg.main_image) || FALLBACK_IMAGE;
  const location = pkg.destinations?.[0]?.destination?.name || 'Multiple Destinations';
  const country = pkg.destinations?.[0]?.destination?.country || '';

  return {
    id: pkg.id,
    slug: pkg.slug,
    title: pkg.name,
    location,
    country,
    type: pkg.travel_type ? (pkg.travel_type.toLowerCase() === 'international' ? 'International' : 'Domestic') : 'Domestic',
    duration: pkg.duration_days || 1,
    groupSize: 12,
    rating: Number(pkg.rating) || 4.6,
    reviews: Number(pkg.reviews_count) || 0,
    price: Number(pkg.price) || 0,
    originalPrice: Number(pkg.price) ? Math.round(Number(pkg.price) * 1.18) : 0,
    image: mainImage,
    featured: Boolean(pkg.show_in_home_page),
    trending: Boolean(pkg.show_in_home_page),
    description: pkg.description || ''
  };
};

const fetchPackage = async (slug) => {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/packages/${slug}`, {
      headers: { 'accept': '*/*', 'ngrok-skip-browser-warning': 'true' },
      cache: 'no-store'
    });
    const data = await res.json();
    if (data && data.success && data.data) {
      return transformApiPackageToTourDetail(data.data);
    }
  } catch (e) {
    console.error("Error fetching package:", e);
  }
  return null;
};

const fetchRelatedPackages = async (country, currentSlug) => {
  if (!country) return [];
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/packages?country=${encodeURIComponent(country)}`, {
      headers: { 'accept': '*/*', 'ngrok-skip-browser-warning': 'true' },
      cache: 'no-store'
    });
    const data = await res.json();
    if (data && data.success && Array.isArray(data.data)) {
      return data.data
        .filter(p => p.slug !== currentSlug)
        .slice(0, 3)
        .map(transformApiPackageToCard);
    }
  } catch (e) {
    console.error("Error fetching related packages:", e);
  }
  return [];
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entity = await fetchPackage(slug);
  if (!entity) return { title: 'Tour Not Found' };

  return {
    title: entity.title,
    description: entity.description || entity.title,
    openGraph: {
      title: entity.title,
      description: entity.description || entity.title,
      images: [{ url: entity.gallery?.[0] || entity.image, width: 1200, height: 630 }],
    },
  };
}

export default async function TourDetailPage({ params }) {
  const { slug } = await params;
  const entity = await fetchPackage(slug);
  
  if (!entity) notFound();

  const similarEntities = await fetchRelatedPackages(entity.country, slug);

  return (
    <>
      <TourDetailClient tour={entity} similarTours={similarEntities} />
    </>
  );
}
