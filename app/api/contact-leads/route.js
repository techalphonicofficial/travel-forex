const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';
const CRM_API_KEY = process.env.CRM_LEADS_API_KEY || process.env.CRM_COMPANY_INFO_API_KEY || 'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const payload = await request.json();
    const backendUrl = new URL('/api/v1/crm/leads/submit', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-key': CRM_API_KEY,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Contact lead submit error:', error);

    return Response.json(
      { success: false, message: 'Unable to submit your enquiry. Please try again.' },
      { status: 502 }
    );
  }
}
