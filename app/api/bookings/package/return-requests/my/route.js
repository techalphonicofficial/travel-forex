const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const backendUrl = new URL('/api/v1/bookings/package/return-requests/my', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));
    const authorization = request.headers.get('authorization');

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        accept: '*/*',
        'ngrok-skip-browser-warning': 'true',
        ...(authorization ? { authorization } : {}),
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, data: { total: 0, rows: [] }, message: response.ok ? 'Return requests found.' : 'Unable to load return requests.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('My package return requests error:', error);

    return Response.json(
      { success: false, data: { total: 0, rows: [] }, message: 'Unable to load return requests.' },
      { status: 502 }
    );
  }
}
