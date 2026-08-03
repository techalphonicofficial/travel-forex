import EurorailClient from './EurorailClient';
import { getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

const PIPELINE_FORM_ENDPOINT = 'https://tourtravel.yber.in/api/v1/crm/pipelines/21/form';
const CRM_API_KEY = process.env.CRM_PIPELINE_FORM_API_KEY || process.env.CRM_COMPANY_INFO_API_KEY || 'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

const getPipelineForm = async () => {
  try {
    const response = await fetch(PIPELINE_FORM_ENDPOINT, {
      headers: {
        accept: 'application/json',
        'x-api-key': CRM_API_KEY,
      },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.success ? payload.data : null;
  } catch (error) {
    console.error('Error fetching eurorail pipeline form:', error);
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
        return true;
      })
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      .map((field) => ({
        id: field.id,
        label: field.label,
        fieldKey: field.field_key,
        fieldType: String(field.field_type || 'text').toLowerCase(),
        options: normalizeFieldOptions(field.options),
        isRequired: Boolean(field.is_required) || ['phone', 'mobile_number', 'contact_number'].includes(field.field_key),
        order: field.order,
      }))
      .filter((field) => field.label && field.fieldKey),
  };
};

export async function generateMetadata() {
  const pageData = await getPageBySlug('eurorail');
  if (pageData) {
    return {
      title: pageData.meta_title || pageData.title || 'Euro Rails',
      description: pageData.meta_description || pageData.description || 'Euro Rails',
      keywords: pageData.keyword || '',
    };
  }
  return {
    title: 'Book European Train Tickets & Eurail Passes | Euro Rails',
    description:
      'Plan your European train journeys. Book high-speed train tickets and Eurail passes for France, Switzerland, Italy, Germany, and beyond with 24/7 support.',
    keywords:
      'Euro Rails, Eurail pass, European train tickets, book TGV tickets, ICE trains Europe, Switzerland train pass, scenic rail Europe',
  };
}

export default async function EurorailPage() {
  const pipelineForm = await getPipelineForm();
  const formConfig = normalizeFormConfig(pipelineForm);
  const pageData = await getPageBySlug('eurorail');
  return <EurorailClient formConfig={formConfig} pageData={pageData} />;
}
