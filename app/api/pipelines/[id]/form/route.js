const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';
const CRM_API_KEY = process.env.CRM_LEADS_API_KEY || process.env.CRM_COMPANY_INFO_API_KEY || 'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    const backendUrl = new URL(`/api/v1/crm/pipelines/${id}/form`, BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-key': CRM_API_KEY,
      },
      cache: 'no-store',
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error(`Pipeline form fetch error for ${params?.id}:`, error);

    return Response.json(
      { success: false, message: 'Unable to fetch pipeline form.' },
      { status: 502 }
    );
  }
}
