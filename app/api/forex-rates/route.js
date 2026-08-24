const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

const ALLOWED_FILTERS = ['country_id', 'country', 'code', 'base_code'];

export async function GET(request) {
  try {
    const requestUrl = new URL(request.url);
    const backendUrl = new URL('/api/v1/forex-rates', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    ALLOWED_FILTERS.forEach((key) => {
      const value = requestUrl.searchParams.get(key);
      if (value) backendUrl.searchParams.set(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        accept: '*/*',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, data: [], message: response.ok ? 'Forex rates found.' : 'Unable to load forex rates.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Forex rates error:', error);

    return Response.json(
      { success: false, data: [], message: 'Unable to load forex rates.' },
      { status: 502 }
    );
  }
}
