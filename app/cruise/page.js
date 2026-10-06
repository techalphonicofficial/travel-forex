import CruiseClient from './CruiseClient';
import { getPageBySlug } from '@/utils/api';

export const revalidate = 60;

const PIPELINE_FORM_ENDPOINT = 'https://admin.travel-forex.com/api/v1/crm/pipelines/7/form';
const CRM_API_KEY = process.env.CRM_PIPELINE_FORM_API_KEY || process.env.CRM_COMPANY_INFO_API_KEY || 'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

const getPipelineForm = async () => {
  try {
    const response = await fetch(PIPELINE_FORM_ENDPOINT, {
      headers: {
        accept: 'application/json',
        'x-api-key': CRM_API_KEY,
      },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.success ? payload.data : null;
  } catch (error) {
    console.error('Error fetching cruise pipeline form:', error);
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

  const hasCustomName = formConfig.fields.some(f => !String(f.id).startsWith('base_') && ['name', 'full_name', 'first_name'].includes(f.field_key));
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

export async function generateMetadata() {
  const page = await getPageBySlug('cruise');
  return {
    title: page?.meta_title || page?.title || 'Luxury Cruise Packages & Ocean Cruises Booking | Cruise Deals',
    description: page?.meta_description || page?.description || 'Explore premium ocean and river cruises worldwide. Book Singapore, Maldives, Goa, European, and Caribbean cruise packages at best-guaranteed prices.',
    keywords: page?.keyword || 'cruise booking, ocean cruise packages, luxury cruises, Cordelia Cruises, Royal Caribbean India, Singapore cruise booking, cruise holiday packages',
  };
}

export default async function CruisePage() {
  const [pageData, pipelineForm] = await Promise.all([
    getPageBySlug('cruise'),
    getPipelineForm(),
  ]);
  const formConfig = normalizeFormConfig(pipelineForm);
  return <CruiseClient pageData={pageData} formConfig={formConfig} />;
}
