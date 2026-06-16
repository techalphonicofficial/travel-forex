const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const { code } = await params;
    const backendUrl = new URL(`/api/v1/forex-rates/${encodeURIComponent(code)}`, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

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
      data || { success: response.ok, data: null, message: response.ok ? 'Forex rate found.' : 'Unable to load forex rate.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Forex rate error:', error);

    return Response.json(
      { success: false, data: null, message: 'Unable to load forex rate.' },
      { status: 502 }
    );
  }
}
