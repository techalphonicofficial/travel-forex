const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const backendUrl = new URL('/api/v1/bookings/hotel', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  try {
    const payload = await request.json();
    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, data: null, message: response.ok ? undefined : 'Unable to submit hotel booking' },
      { status: response.status }
    );
  } catch (error) {
    console.warn('Hotel booking proxy unavailable:', error?.message || error);

    return Response.json(
      { success: false, data: null, message: 'Unable to submit hotel booking' },
      { status: 502 }
    );
  }
}
