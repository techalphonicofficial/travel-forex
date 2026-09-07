import { getPackages } from '@/utils/api';
import DestinationClient from './DestinationClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Destination Packages - ITS TRAVELS AND TOURS',
  description: 'Browse handpicked holiday packages for your favorite destinations.',
};

export default async function PackagesPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const destination = resolvedParams?.destination || '';
  const type = resolvedParams?.type || '';
  
  // Build filter object: map URL `type` param to API `travel_type` filter
  const filters = { destination };
  if (type) {
    filters.travel_type = type.toLowerCase();
  }

  // Fetch packages for this destination and type
  let packages = await getPackages(filters);

  // Since backend API returns all packages regardless of query params,
  // filter by type when type parameter is provided and filter out test packages.
  packages = (packages || []).filter(pkg => {
    const name = String(pkg?.name || '').toLowerCase();
    const slug = String(pkg?.slug || '').toLowerCase();
    if (name.includes('test package') || slug.includes('test-package') || pkg?.id === 60) {
      return false;
    }
    if (type) {
      const targetType = type.toLowerCase();
      const isPkgInternational = pkg?.destinations?.some(
        d => d.destination?.type?.toLowerCase() === 'international'
      );
      const pkgType = pkg?.travel_type
        ? pkg.travel_type.toLowerCase()
        : (isPkgInternational ? 'international' : 'domestic');
      return pkgType === targetType;
    }
    return true;
  });

  return (
    <DestinationClient 
      destinationSlug={destination}
      packages={packages}
      travelType={type}
    />
  );
}


