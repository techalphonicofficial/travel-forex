import 'server-only';

import { normalizeThemePayload } from '@/utils/themeVariables';

const THEME_COLOURS_ENDPOINT = 'https://tourtravel.yber.in/api/v1/crm/settings/theme-colours';
const THEME_COLOURS_API_KEY =
  process.env.CRM_THEME_COLOURS_API_KEY ||
  process.env.CRM_COMPANY_INFO_API_KEY ||
  process.env.CRM_API_KEY ||
  process.env.NEXT_PUBLIC_CRM_API_KEY ||
  'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

export const getThemeColours = async () => {
  try {
    const response = await fetch(THEME_COLOURS_ENDPOINT, {
      headers: {
        accept: 'application/json',
        'x-api-key': THEME_COLOURS_API_KEY,
      },
      cache: 'no-store',
    });

    if (!response.ok) return {};

    const payload = await response.json();

    return normalizeThemePayload(payload);
  } catch (error) {
    console.error('Error fetching theme colours:', error);
    return {};
  }
};
