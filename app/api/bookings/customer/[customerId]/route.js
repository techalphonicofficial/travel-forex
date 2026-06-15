const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apparel-alternative-derived-lifetime.trycloudflare.com/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { customerId } = await params;
    const requestUrl = new URL(request.url);
    const backendUrl = new URL(
      `/api/v1/bookings/customer/${encodeURIComponent(customerId)}`,
      BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, '')
    );
    const authorization = request.headers.get('authorization');

    ['status', 'page', 'limit'].forEach((key) => {
      const value = requestUrl.searchParams.get(key);
      if (value) backendUrl.searchParams.set(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(authorization ? { authorization } : {}),
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, message: response.ok ? 'Bookings loaded successfully.' : 'Unable to load bookings.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Customer bookings fetch error:', error);

    return Response.json(
      { success: false, message: 'Unable to load your bookings. Please try again.' },
      { status: 502 }
    );
  }
}
