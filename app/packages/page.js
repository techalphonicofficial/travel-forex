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
  
  // Fetch packages for this destination
  const packages = await getPackages({ destination });

  return (
    <DestinationClient 
      destinationSlug={destination}
      packages={packages} 
    />
  );
}
