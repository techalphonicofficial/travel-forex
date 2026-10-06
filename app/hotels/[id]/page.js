import HotelDetailClient from './HotelDetailClient';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://admin.travel-forex.com/api/v1';

const fetchHotel = async ({ id }) => {
  const backendUrl = new URL(`/api/v1/hotels/${id}`, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });
    const payload = await response.json();
    return payload?.success ? payload.data : null;
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
