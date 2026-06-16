const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';
const ALLOWED_TYPES = new Set(['trending', 'visa-free']);

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { type } = await params;

  if (!ALLOWED_TYPES.has(type)) {
    return Response.json(
      { success: false, data: [], message: 'Unknown destination list' },
      { status: 404 }
    );
  }

  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(`/api/v1/destinations/${type}`, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

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
      data || { success: response.ok, data: [], message: response.ok ? undefined : 'Unable to fetch destinations' },
      { status: response.status }
    );
  } catch (error) {
    console.error(`${type} destinations proxy error:`, error);

    return Response.json(
      { success: false, data: [], message: 'Unable to fetch destinations' },
      { status: 502 }
    );
  }
}
