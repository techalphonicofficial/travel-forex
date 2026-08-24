const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const requestApiKey = request.headers.get('x-api-key');
    const configuredApiKey = process.env.CRM_API_KEY || process.env.FOREX_API_KEY || process.env.NEXT_PUBLIC_CRM_API_KEY;
    const backendUrl = new URL('/api/v1/crm/settings/forex-service-charge', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        accept: '*/*',
        'ngrok-skip-browser-warning': 'true',
        ...((requestApiKey || configuredApiKey) ? { 'x-api-key': requestApiKey || configuredApiKey } : {}),
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, data: null, message: response.ok ? 'Forex service charge found.' : 'Unable to load forex service charge.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Forex service charge error:', error);

    return Response.json(
      { success: false, data: null, message: 'Unable to load forex service charge.' },
      { status: 502 }
    );
  }
}
