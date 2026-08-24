const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { customerId } = await params;
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const backendUrl = new URL(`/api/v1/bookings/customer/${encodeURIComponent(customerId)}${searchParams ? `?${searchParams}` : ''}`, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return Response.json(
        { success: false, message: 'Please login to view bookings.' },
        { status: 401 }
      );
    }

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
      data || { success: response.ok, message: response.ok ? 'Success' : 'Unable to fetch bookings.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Customer bookings fetch error:', error);

    return Response.json(
      { success: false, message: 'Unable to load your bookings. Please contact support.' },
      { status: 502 }
    );
  }
}
