const DEFAULT_API_BASE_URL = 'https://tourtravel.yber.in/api/v1';

const getBackendBaseUrl = () => {
  const configuredBase = process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_API_BASE_URL;
  return configuredBase.replace(/\/$/, '');
};

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(`${getBackendBaseUrl()}/locations/country-city`);

  incomingUrl.searchParams.forEach((value, key) => {
    if (key !== '_t' && value !== '') {
      backendUrl.searchParams.set(key, value);
    }
  });

  if (!backendUrl.searchParams.has('limit')) {
    backendUrl.searchParams.set('limit', '20');
  }

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        accept: '*/*',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);

    return Response.json(
      data || { success: false, data: { countries: [], cities: [], suggestions: [] } },
      { status: response.status }
    );
  } catch (error) {
    console.error('Location country-city proxy failed:', error);
    return Response.json(
      {
        success: false,
        message: 'Unable to fetch location suggestions',
        data: { countries: [], cities: [], suggestions: [] },
      },
      { status: 502 }
    );
  }
}
