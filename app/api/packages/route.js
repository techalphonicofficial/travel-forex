const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const incomingUrl = new URL(request.url);
  const accept = request.headers.get('accept') || '';
  const wantsHtml = accept.includes('text/html') && !accept.includes('application/json');

  if (wantsHtml) {
    const uiUrl = new URL('/tour', incomingUrl.origin);
    incomingUrl.searchParams.forEach((value, key) => {
      uiUrl.searchParams.set(key, value);
    });

    return Response.redirect(uiUrl, 307);
  }

  const backendUrl = new URL('/api/v1/packages', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  incomingUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Package proxy error:', error);

    return Response.json(
      { success: false, data: [], message: 'Unable to fetch packages' },
      { status: 502 }
    );
  }
}
