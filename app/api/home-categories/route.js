const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';

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
  const homeCategoriesUrl = new URL('/api/v1/categories/home', backendBase);
  homeCategoriesUrl.searchParams.set('_t', String(Date.now()));

  try {
    const response = await fetch(homeCategoriesUrl.toString(), {
      headers: {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await parseJsonResponse(response);
    if (response.ok) {
      if (data) {
        return Response.json(data, { status: 200 });
      }
    }

    const categoriesUrl = new URL('/api/v1/categories', backendBase);
    categoriesUrl.searchParams.set('_t', String(Date.now()));

    const fallbackResponse = await fetch(categoriesUrl.toString(), {
      headers: {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const fallbackData = await parseJsonResponse(fallbackResponse);
    const categories = Array.isArray(fallbackData?.data) ? fallbackData.data : [];
    const homeCategories = categories.filter((category) => category.show_in_home === true);

    return Response.json(
      {
        success: fallbackResponse.ok,
        data: homeCategories.length ? homeCategories : categories,
        message: fallbackResponse.ok ? undefined : 'Unable to fetch home categories',
      },
      { status: 200 }
    );
  } catch (error) {
    console.warn('Home categories proxy unavailable:', error?.message || error);

    return Response.json(
      { success: false, data: [], message: 'Unable to fetch home categories' },
      { status: 200 }
    );
  }
}
