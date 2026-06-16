const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const payload = await request.json();
    const backendUrl = new URL('/api/v1/bookings/coupons/validate', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, message: response.ok ? 'Coupon validated.' : 'Unable to validate coupon.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Coupon validation error:', error);

    return Response.json(
      { success: false, message: 'Unable to validate coupon. Please try again.' },
      { status: 502 }
    );
  }
}
