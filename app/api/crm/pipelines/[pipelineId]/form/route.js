const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';
const CRM_API_KEY =
  process.env.CRM_PIPELINE_FORM_API_KEY ||
  process.env.CRM_COMPANY_INFO_API_KEY ||
  'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { pipelineId } = await params;

  try {
    const backendUrl = new URL(
      `/api/v1/crm/pipelines/${encodeURIComponent(pipelineId)}/form`,
      BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, '')
    );

    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: 'application/json',
        'x-api-key': CRM_API_KEY,
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: response.ok, data: null, message: response.ok ? 'Pipeline form loaded.' : 'Unable to load pipeline form.' },
      { status: response.status }
    );
  } catch (error) {
    console.error(`Pipeline form "${pipelineId}" proxy error:`, error);

    return Response.json(
      { success: false, data: null, message: 'Unable to load pipeline form.' },
      { status: 502 }
    );
  }
}
