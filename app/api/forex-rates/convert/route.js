const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

const REQUIRED_PARAMS = ['customer_id', 'from_currency', 'to_currency', 'amount'];

export async function GET(request) {
  try {
    const requestUrl = new URL(request.url);
    const missingParams = REQUIRED_PARAMS.filter((key) => !requestUrl.searchParams.get(key));

    if (missingParams.length) {
      return Response.json(
        { success: false, message: `${missingParams.join(', ')} required.` },
        { status: 400 }
      );
    }

    const backendUrl = new URL('/api/v1/forex-rates/convert', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    REQUIRED_PARAMS.forEach((key) => {
      backendUrl.searchParams.set(key, requestUrl.searchParams.get(key));
    });

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
      data || { success: response.ok, message: response.ok ? 'Forex conversion created.' : 'Unable to convert forex amount.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Forex conversion error:', error);

    return Response.json(
      { success: false, message: 'Unable to convert forex amount.' },
      { status: 502 }
    );
  }
}
