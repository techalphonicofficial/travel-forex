import HotelDetailClient from './HotelDetailClient';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

const fetchHotel = async ({ id, country, city }) => {
  const backendUrl = new URL('/api/v1/hotels', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));
  backendUrl.searchParams.set('country', country || 'india');
  backendUrl.searchParams.set('city', city || 'Goa');
  backendUrl.searchParams.set('page', '1');
  backendUrl.searchParams.set('limit', '100');

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: '*/*',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });
    const payload = await response.json();
    const rows = payload?.data?.rows || [];
    return rows.find((hotel) => String(hotel.id) === String(id)) || null;
  } catch {
    return null;
  }
};

export default async function HotelDetailPage({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const hotel = await fetchHotel({
    id,
    country: query?.country,
    city: query?.city,
  });

  return <HotelDetailClient city={query?.city || 'Goa'} country={query?.country || 'india'} hotel={hotel} hotelId={id} />;
}
