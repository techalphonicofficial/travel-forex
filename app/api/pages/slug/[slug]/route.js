const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { slug } = await params;
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(`/api/v1/pages/slug/${encodeURIComponent(slug)}`, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

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
      data || { success: response.ok, data: null, message: response.ok ? undefined : 'Unable to fetch page' },
      { status: response.status }
    );
  } catch (error) {
    console.error(`Page "${slug}" proxy error:`, error);

    return Response.json(
      { success: false, data: null, message: 'Unable to fetch page' },
      { status: 502 }
    );
  }
}
