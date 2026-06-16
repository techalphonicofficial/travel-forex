const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';
const AIRPORTS_API_KEY = process.env.CRM_COMPANY_INFO_API_KEY;

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const incomingUrl = new URL(request.url);
  const backendBase = BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const backendUrl = new URL('/api/v1/airports/search', backendBase);

  ['page', 'limit', 'search', 'lat', 'lng'].forEach((key) => {
    const value = incomingUrl.searchParams.get(key);
    if (value) backendUrl.searchParams.set(key, value);
  });

  if (!backendUrl.searchParams.has('page')) {
    backendUrl.searchParams.set('page', '1');
  }

  if (!backendUrl.searchParams.has('limit')) {
    backendUrl.searchParams.set('limit', '20');
  }

  if (!AIRPORTS_API_KEY) {
    return Response.json(
      { success: false, data: [], message: 'Airport API key is missing' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: 'application/json',
        'x-api-key': AIRPORTS_API_KEY,
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Airport search proxy error:', error);

    return Response.json(
      { success: false, data: [], message: 'Unable to fetch airports' },
      { status: 502 }
    );
  }
}
