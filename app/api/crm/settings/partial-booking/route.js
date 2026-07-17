const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';
const PARTIAL_BOOKING_API_KEY =
  process.env.CRM_PARTIAL_BOOKING_API_KEY ||
  process.env.CRM_COMPANY_INFO_API_KEY ||
  'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = new URL('/api/v1/crm/settings/partial-booking', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: '*/*',
        'x-api-key': PARTIAL_BOOKING_API_KEY,
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);

    return Response.json(data || { success: false, data: null }, { status: response.status });
  } catch (error) {
    console.error('Partial booking settings proxy error:', error);

    return Response.json(
      { success: false, data: null, message: 'Unable to fetch partial booking settings' },
      { status: 502 }
    );
  }
}
