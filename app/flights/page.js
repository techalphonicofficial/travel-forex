import FlightsClient from './FlightsClient';

export const dynamic = 'force-dynamic';

const PIPELINE_ROUND_TRIP = 'https://tourtravel.yber.in/api/v1/crm/pipelines/28/form';
const PIPELINE_ONE_WAY = 'https://tourtravel.yber.in/api/v1/crm/pipelines/9/form';
const PIPELINE_MULTI_CITY = 'https://tourtravel.yber.in/api/v1/crm/pipelines/27/form';
const CRM_API_KEY = process.env.CRM_PIPELINE_FORM_API_KEY || process.env.CRM_COMPANY_INFO_API_KEY || 'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

const fetchPipeline = async (endpoint) => {
  try {
    const response = await fetch(endpoint, {
      headers: { accept: 'application/json', 'x-api-key': CRM_API_KEY },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.success ? payload.data : null;
  } catch (error) {
    console.error('Error fetching pipeline form:', error);
    return null;
  }
};

const normalizeFieldOptions = (options) => {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (typeof option === 'string') return { label: option, value: option };
      if (option && typeof option === 'object') {
        const label = option.label || option.name || option.title || option.value;
        const value = option.value || option.id || label;
        return label ? { label: String(label), value: String(value) } : null;
      }
      return null;
    })
    .filter(Boolean);
};

const normalizeFormConfig = (formConfig) => {
  if (!formConfig?.fields?.length) return null;

  const hasCustomName = formConfig.fields.some(f => !String(f.id).startsWith('base_') && ['name', 'full_name', 'first_name', 'your_name_'].includes(f.field_key));
  const hasCustomEmail = formConfig.fields.some(f => !String(f.id).startsWith('base_') && ['email', 'email_address'].includes(f.field_key));
  const hasCustomPhone = formConfig.fields.some(f => !String(f.id).startsWith('base_') && ['phone', 'mobile_number', 'contact_number'].includes(f.field_key));

  return {
    id: formConfig.id,
    name: formConfig.name,
    stages: formConfig.stages || [],
    fields: [...formConfig.fields]
      .filter(field => {
        if (field.id === 'base_name' && hasCustomName) return false;
        if (field.id === 'base_email' && hasCustomEmail) return false;
        if (field.id === 'base_phone' && hasCustomPhone) return false;
        // Also hide the internal CRM "Trip Type" field since we use our custom React tabs now
        if (field.field_key === 'trip_type') return false; 
        return true;
      })
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      .map((field) => ({
        id: field.id,
        label: field.label,
        fieldKey: field.field_key,
        fieldType: String(field.field_type || 'text').toLowerCase(),
        options: normalizeFieldOptions(field.options),
        isRequired: Boolean(field.is_required),
        order: field.order,
      }))
      .filter((field) => field.label && field.fieldKey),
  };
};


const fetchPage = async () => {
  try {
    const res = await fetch('https://tourtravel.yber.in/api/v1/pages/slug/Flights', {
      headers: { accept: '*/*' },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    console.error('Error fetching Flights page:', error);
    return null;
  }
};

export const metadata = {
  title: 'Book International & Domestic Flights | Best Flight Deals & Airline Tickets',
  description:
    'Search and book domestic and international flights at the lowest prices. Enjoy exclusive airline deals, zero convenience fees, and 24/7 travel assistance.',
  keywords:
    'flight booking, buy flight tickets, cheap flights, international flight tickets, domestic flights India, air ticket booking deals',
};

export default async function FlightsPage() {
  const [pageData, roundTripData, oneWayData, multiCityData] = await Promise.all([
    fetchPage(),
    fetchPipeline(PIPELINE_ROUND_TRIP),
    fetchPipeline(PIPELINE_ONE_WAY),
    fetchPipeline(PIPELINE_MULTI_CITY)
  ]);
  
  return (
    <FlightsClient
      pageData={pageData} 
      roundTripConfig={normalizeFormConfig(roundTripData)}
      oneWayConfig={normalizeFormConfig(oneWayData)}
      multiCityConfig={normalizeFormConfig(multiCityData)}
    />
  );
}
