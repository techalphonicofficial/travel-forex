import { normalizeThemePayload } from '@/utils/themeVariables';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tourtravel.yber.in/api/v1';
const THEME_COLOURS_API_KEY =
  process.env.CRM_THEME_COLOURS_API_KEY ||
  process.env.CRM_COMPANY_INFO_API_KEY ||
  process.env.CRM_API_KEY ||
  process.env.NEXT_PUBLIC_CRM_API_KEY ||
  'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = new URL('/api/v1/crm/settings/theme-colours', BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, ''));

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: 'application/json',
        'x-api-key': THEME_COLOURS_API_KEY,
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);

    return Response.json(
      {
        ...(payload || { success: false, data: null }),
        theme_variables: normalizeThemePayload(payload),
      },
      { status: response.status }
    );
  } catch (error) {
    console.error('Theme colours proxy error:', error);

    return Response.json(
      { success: false, data: null, theme_variables: {}, message: 'Unable to fetch theme colours' },
      { status: 502 }
    );
  }
}
