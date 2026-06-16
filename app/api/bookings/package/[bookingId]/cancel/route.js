const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { bookingId } = await params;
    const payload = await request.json().catch(() => ({}));
    const backendUrl = new URL(
      `/api/v1/bookings/package/${encodeURIComponent(bookingId)}/cancel`,
      BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, '')
    );
    const authorization = request.headers.get('authorization');

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
      data || { success: response.ok, message: response.ok ? 'Cancellation request submitted.' : 'Unable to cancel booking.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Package cancellation error:', error);

    return Response.json(
      { success: false, message: 'Unable to submit cancellation request. Please contact support.' },
      { status: 502 }
    );
  }
}
