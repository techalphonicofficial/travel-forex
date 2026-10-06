const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://admin.travel-forex.com/api/v1';

export const dynamic = 'force-dynamic';

const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export async function GET() {
  const backendBase = BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const url = new URL('/api/v1/package-categories/get-package-category', backendBase);
  url.searchParams.set('_t', String(Date.now()));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        accept: 'application/json',
      },
      next: { revalidate: 0 },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return Response.json(
        { success: false, message: data?.message || `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error('Package Categories proxy error:', error);
    return Response.json(
      { success: false, message: 'Internal server error while fetching package categories' },
      { status: 500 }
    );
  }
}
