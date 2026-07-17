const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const payload = await request.json();
    const backendUrl = new URL('/api/v1/bookings/create-booking', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return Response.json(
        { success: false, message: 'Please login before booking this package.' },
        { status: 401 }
      );
    }

    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, message: response.ok ? 'Booking created successfully.' : 'Unable to create booking.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Package booking create error:', error);

    return Response.json(
      { success: false, message: 'Unable to create your package booking. Please contact support.' },
      { status: 502 }
    );
  }
}
