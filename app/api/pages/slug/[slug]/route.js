const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://admin.travel-forex.com/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const backendUrl = new URL(`/api/v1/pages/slug/${slug}`, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    const incomingUrl = new URL(request.url);
    incomingUrl.searchParams.forEach((value, key) => {
      if (value !== '' && key !== '_t') {
        backendUrl.searchParams.set(key, value);
      }
    });

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
    console.error(`Page ${slug} proxy error:`, error);
    return Response.json(
      { success: false, data: null, message: 'Unable to fetch page' },
      { status: 502 }
    );
  }
}
