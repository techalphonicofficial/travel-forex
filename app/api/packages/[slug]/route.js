const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apparel-alternative-derived-lifetime.trycloudflare.com/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { slug } = await params;
  const backendUrl = new URL(
    `/api/v1/packages/${encodeURIComponent(slug)}`,
    BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, '')
  );

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: '*/*',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error(`Package detail proxy error for "${slug}":`, error);

    return Response.json(
      { success: false, data: null, message: 'Unable to fetch package detail' },
      {
        status: 502,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}
