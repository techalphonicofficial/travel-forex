const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://admin.travel-forex.com/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  const { slug } = await context.params;
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(`/api/v1/packages/${slug}`, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  incomingUrl.searchParams.forEach((value, key) => {
    if (value !== '' && key !== '_t') {
      backendUrl.searchParams.set(key, value);
    }
  });

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: '*/*',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);

    return Response.json(data || { success: false, data: null }, { status: response.status });
  } catch (error) {
    console.error('Package filters proxy error:', error);

    return Response.json(
      { success: false, data: null, message: 'Unable to fetch package filters' },
      { status: 502 }
    );
  }
}
