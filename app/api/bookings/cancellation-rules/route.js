const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apparel-alternative-derived-lifetime.trycloudflare.com/api/v1';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backendUrl = new URL('/api/v1/bookings/cancellation-rules', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        accept: '*/*',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, data: [], message: response.ok ? 'Cancellation rules found.' : 'Unable to load cancellation rules.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Cancellation rules error:', error);

    return Response.json(
      { success: false, data: [], message: 'Unable to load cancellation rules.' },
      { status: 502 }
    );
  }
}
