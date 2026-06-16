const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  const backendUrl = new URL(`/api/v1/trip-inquiries/${encodeURIComponent(id)}`, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: '*/*',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, data: null, message: response.ok ? undefined : 'Unable to fetch itinerary' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Trip inquiry detail proxy error:', error);

    return Response.json(
      { success: false, data: null, message: 'Unable to fetch itinerary' },
      { status: 502 }
    );
  }
}
