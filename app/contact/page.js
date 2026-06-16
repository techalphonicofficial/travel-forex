import ContactClient from './ContactClient';
import { getMediaUrl, getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

const PIPELINE_FORM_ENDPOINT = 'https://tourtravel.yber.in/api/v1/crm/pipelines/3/form';
const COMPANY_INFO_ENDPOINT = 'https://tourtravel.yber.in/api/v1/crm/settings/company-info';
const CRM_API_KEY = process.env.CRM_PIPELINE_FORM_API_KEY || process.env.CRM_COMPANY_INFO_API_KEY || 'pt_4135380196590f3b81d68d8b5acbc883b3ee46ccbb77e73e';

const fallbackHero = {
  label: 'Get In Touch',
  title: 'Contact Us',
  description: "Have questions? We'd love to hear from you. Send us a message and we'll respond within 24 hours.",
};

const fallbackFaqContent = {
  label: 'Common Questions',
  title: 'Frequently Asked Questions',
  description: "Can't find what you're looking for? Contact our support team.",
  faqs: [],
};

const findSection = (page, section) => page?.details?.find((item) => item.section === section);

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
    console.error('Error fetching contact pipeline form:', error);
    return null;
  }
};

const getCompanyInfo = async () => {
  try {
    const response = await fetch(COMPANY_INFO_ENDPOINT, {
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
    console.error('Error fetching contact company info:', error);
    return null;
  }
};

const normalizeFormConfig = (formConfig) => {
  if (!formConfig?.fields?.length) return null;

  return {
    id: formConfig.id,
    name: formConfig.name,
    stages: formConfig.stages || [],
    fields: [...formConfig.fields]
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

const normalizeFieldOptions = (options) => {
  if (!Array.isArray(options)) return [];

  return options
    .map((option) => {
      if (typeof option === 'string') {
        return { label: option, value: option };
      }

      if (option && typeof option === 'object') {
        const label = option.label || option.name || option.title || option.value;
        const value = option.value || option.id || label;
        return label ? { label: String(label), value: String(value) } : null;
      }

      return null;
    })
    .filter(Boolean);
};

const buildContactContent = (page) => {
  const standard = findSection(page, 'standard');
  const faqAccordion = findSection(page, 'faq_accordion');

  return {
    hero: {
      label: standard?.title || fallbackHero.label,
      title: standard?.json_data?.heading_content || page?.title || fallbackHero.title,
      description: standard?.description || page?.description || fallbackHero.description,
    },
    faqContent: {
      label: faqAccordion?.title || fallbackFaqContent.label,
      title: faqAccordion?.json_data?.heading_content || fallbackFaqContent.title,
      description: faqAccordion?.json_data?.block_desc || fallbackFaqContent.description,
      faqs: Array.isArray(faqAccordion?.json_data?.faqs) ? faqAccordion.json_data.faqs : [],
    },
    heroImage: getMediaUrl(page?.feature_image),
  };
};

export async function generateMetadata() {
  const page = await getPageBySlug('contact');
  const image = getMediaUrl(page?.feature_image);

  return {
    title: page?.meta_title || page?.title || 'Contact Us',
    description: page?.meta_description || page?.description || fallbackHero.description,
    keywords: page?.keyword ? [page.keyword] : undefined,
    openGraph: {
      title: page?.meta_title || page?.title || 'Contact Us',
      description: page?.meta_description || page?.description || fallbackHero.description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: page?.alt_text || page?.title || 'Contact Us' }] : undefined,
    },
  };
}

export default async function ContactPage() {
  const [page, pipelineForm, companyInfo] = await Promise.all([
    getPageBySlug('contact'),
    getPipelineForm(),
    getCompanyInfo(),
  ]);
  const content = buildContactContent(page);

  return <ContactClient {...content} formConfig={normalizeFormConfig(pipelineForm)} companyInfo={companyInfo} />;
}
