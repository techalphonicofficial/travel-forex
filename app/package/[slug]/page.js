import PackagesClient from '../../packages/PackagesClient';
import { DEST_FILTERS } from '../../../data/packages';
import { getPackagesByDestination } from '@/utils/api';

export default async function DestinationPackagePage({ params }) {
  const { slug } = await params;

  console.log("slug", slug);

  const packages = await getPackagesByDestination(slug);
  console.log("packages", packages);

  // Find the matching destination from filters, otherwise default to 'All'
  const destName = DEST_FILTERS.find(d =>
    d.toLowerCase() === (slug || '').toLowerCase().replace(/-/g, ' ')
  ) || 'All';

  return <PackagesClient destParam={destName} packages={packages} />;
}
