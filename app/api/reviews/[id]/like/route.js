const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apparel-alternative-derived-lifetime.trycloudflare.com/api/v1';

export const dynamic = 'force-dynamic';

export async function POST(_request, { params }) {
  const { id } = await params;
  const backendUrl = new URL(
    `/api/v1/reviews/${encodeURIComponent(id)}/like`,
    BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, '')
  );

  try {
    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, likes_count: 0 },
      { status: response.status }
    );
  } catch (error) {
    console.warn('Review like proxy unavailable:', error?.message || error);

    return Response.json(
      { success: false, message: 'Unable to like review' },
      { status: 502 }
    );
  }
}
