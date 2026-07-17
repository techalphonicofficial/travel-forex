const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL('/api/v1/trip-inquiries', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  ['page', 'limit', 'search', 'status'].forEach((key) => {
    const value = incomingUrl.searchParams.get(key);
    if (value) backendUrl.searchParams.set(key, value);
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
      data || { success: response.ok, data: { rows: [] }, message: response.ok ? undefined : 'Unable to fetch trip inquiries' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Trip inquiries proxy error:', error);

    return Response.json(
      { success: false, data: { rows: [] }, message: 'Unable to fetch trip inquiries' },
      { status: 502 }
    );
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const backendUrl = new URL('/api/v1/trip-inquiries', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, message: response.ok ? 'Inquiry submitted successfully.' : 'Unable to submit inquiry.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Trip inquiry submit proxy error:', error);

    return Response.json(
      { success: false, message: 'Unable to submit inquiry. Please try again.' },
      { status: 502 }
    );
  }
}
