const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const email = String(payload.email || '').trim();

    if (!email) {
      return Response.json(
        { success: false, message: 'Email address is required.' },
        { status: 400 }
      );
    }

    const backendUrl = new URL('/api/v1/newsletter', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        email,
        source: payload.source || 'website',
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, message: response.ok ? 'Newsletter subscription created' : 'Unable to subscribe right now.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);

    return Response.json(
      { success: false, message: 'Unable to subscribe right now.' },
      { status: 502 }
    );
  }
}
