import 'server-only';

const COMPANY_INFO_ENDPOINT = 'https://tourtravel.yber.in/api/v1/crm/settings/company-info';
const COMPANY_INFO_API_KEY = process.env.CRM_COMPANY_INFO_API_KEY || 'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

export const getCompanyInfo = async () => {
  try {
    const response = await fetch(COMPANY_INFO_ENDPOINT, {
      headers: {
        accept: 'application/json',
        'x-api-key': COMPANY_INFO_API_KEY,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const payload = await response.json();
    return payload?.success ? payload.data : null;
  } catch (error) {
    console.error('Error fetching company info:', error);
    return null;
  }
};
