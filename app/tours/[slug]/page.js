import { notFound } from 'next/navigation';
import tours from '@/data/tours.json';
import { packageData } from '@/data/packages';
import TourDetailClient from './TourDetailClient';

const transformPackage = (pkg) => ({
  ...pkg,
  gallery: [pkg.image, pkg.image, pkg.image, pkg.image],
  highlights: ["Inclusive Breakfast", "Expert Local Guide", "Airport Transfers", "Premium Stay", "Taxes & Fees"],
  included: ["3-star/4-star Accommodation", "Daily Breakfast", "Sightseeing as per itinerary", "Round-trip airport transfers"],
  excluded: ["Round-trip airfare", "Travel insurance", "Tips and gratuities", "Personal expenses"],
  itinerary: [
    { day: 1, title: "Arrival", description: "Arrive and check in." },
    { day: 2, title: "Sightseeing", description: "Explore the city." },
    { day: 3, title: "Culture", description: "Learn traditions." },
    { day: 4, title: "Leisure", description: "Relax." },
    { day: 5, title: "Departure", description: "Transfer to airport." }
  ],
  groupSize: 12,
  duration: (pkg.nights || 0) + 1,
  location: pkg.destination,
});

const findEntity = (slug) => {
  // 1. Try in standard tours by SLUG
  const tourBySlug = tours.find((t) => t.slug === slug);
  if (tourBySlug) return tourBySlug;

  // 2. Try in standard tours by ID
  const tourById = tours.find((t) => String(t.id) === String(slug));
  if (tourById) return tourById;

  // 3. Try in packages by SLUG
  const pkgBySlug = packageData.find((p) => p.slug === slug);
  if (pkgBySlug) return transformPackage(pkgBySlug);

  // 4. Try in packages by ID
  const pkgById = packageData.find((p) => String(p.id) === String(slug));
  if (pkgById) return transformPackage(pkgById);

  return null;
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entity = findEntity(slug);
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

export function generateStaticParams() {
  const tourSlugs = tours.map((t) => ({ slug: t.slug }));
  const pkgSlugs = packageData.map((p) => ({ slug: p.slug }));
  return [...tourSlugs, ...pkgSlugs];
}

export default async function TourDetailPage({ params }) {
  const { slug } = await params;
  console.log("TourDetailPage - Received Slug:", slug);
  const entity = findEntity(slug);
  console.log("TourDetailPage - Found Entity:", entity ? entity.title : "NULL");
  if (!entity) notFound();

  const similarEntities = tours
    .filter((t) => t.slug !== slug && (t.type === entity.type || t.country === entity.country))
    .slice(0, 3);

  return (
    <>
      {/* Breadcrumb */}
      {/* <div style={{ background: 'var(--color-bg-soft)', borderBottom: '1px solid var(--color-border)', marginTop: 140 }}>
        <div className="container py-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0" style={{ fontSize: 14 }}>
              <li className="breadcrumb-item"><a href="/" style={{ color: 'var(--color-primary)' }}>Home</a></li>
              <li className="breadcrumb-item"><a href="/tours" style={{ color: 'var(--color-primary)' }}>Tours</a></li>
              <li className="breadcrumb-item active" style={{ color: 'var(--color-text-muted)' }}>{entity.title}</li>
            </ol>
          </nav>
        </div>
      </div> */}

      <TourDetailClient tour={entity} similarTours={similarEntities} />
    </>
  );
}
