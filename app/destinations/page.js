import DestinationsClient from './DestinationsClient';

export const metadata = {
  title: 'Destinations - ITS TRAVELS AND TOURS',
  description: 'Explore our popular and visa-free travel destinations.',
};

export default async function DestinationsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const type = resolvedParams?.type || 'trending';

  return <DestinationsClient type={type} />;
}
