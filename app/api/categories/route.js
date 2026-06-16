const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL('/api/v1/categories', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  incomingUrl.searchParams.forEach((value, key) => {
    if (key !== '_t') backendUrl.searchParams.set(key, value);
  });
  backendUrl.searchParams.set('_t', String(Date.now()));

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, data: [], message: response.ok ? undefined : 'Unable to fetch categories' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Categories proxy error:', error);

    return Response.json(
      { success: false, data: [], message: 'Unable to fetch categories' },
      { status: 502 }
    );
  }
}
