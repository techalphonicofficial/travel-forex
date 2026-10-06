const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://admin.travel-forex.com/api/v1';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { bookingId } = await params;
    const payload = await request.json();
    const backendUrl = new URL(`/api/v1/bookings/package/${encodeURIComponent(bookingId)}/pay-remaining`, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return Response.json(
        { success: false, message: 'Please login to pay the remaining amount.' },
        { status: 401 }
      );
    }

    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, message: response.ok ? 'Remaining amount paid successfully.' : 'Unable to record remaining payment.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Remaining payment proxy error:', error);

    return Response.json(
      { success: false, message: 'Unable to process remaining payment. Please contact support.' },
      { status: 502 }
    );
  }
}
