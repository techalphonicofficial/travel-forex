const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL('/api/v1/hotels', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  incomingUrl.searchParams.forEach((value, key) => {
    if (key !== '_t') {
      backendUrl.searchParams.set(key, value);
    }
  });

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
      data || { success: response.ok, data: { rows: [], count: 0, pagination: null } },
      { status: response.status }
    );
  } catch (error) {
    console.warn('Hotels proxy unavailable:', error?.message || error);

    return Response.json(
      { success: false, data: { rows: [], count: 0, pagination: null }, message: 'Unable to fetch hotels' },
      { status: 502 }
    );
  }
}
