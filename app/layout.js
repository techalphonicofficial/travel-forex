import './globals.css';

import { Inter, Poppins } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BootstrapClient from '@/components/BootstrapClient';
import GlobalInquiryModal from '@/components/GlobalInquiryModal';
import FloatingContactWidget from '@/components/FloatingContactWidget';
import ThemeColoursClient from '@/components/ThemeColoursClient';
import ToastProvider from '@/components/ToastProvider';
import { WishlistProvider } from '@/components/WishlistProvider';
import { getCompanyInfo } from '@/utils/companyInfo';
import { getProjectConfig } from '@/utils/projectConfig';
import { getThemeColours } from '@/utils/themeColours';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const projectConfig = getProjectConfig();

export const dynamic = 'force-dynamic';

export const metadata = {
  metadataBase: new URL('https://wanderlust-tours.com'),
  title: {
    default: `${projectConfig.displayName} - Premium Travel Booking`,
    template: `%s | ${projectConfig.displayName}`,
  },
  description:
    `Discover handcrafted travel experiences. Book luxury tours to the world's most breathtaking destinations with ${projectConfig.legalName}.`,
  keywords: ['travel', 'tours', 'vacation', 'holiday packages', 'adventure travel', 'luxury travel'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wanderlust-tours.com',
    siteName: projectConfig.displayName,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=75',
        width: 1200,
        height: 630,
        alt: projectConfig.displayName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@wanderlusttours',
  },
};

const PIPELINE_ROUND_TRIP = 'https://tourtravel.yber.in/api/v1/crm/pipelines/8/form';
const PIPELINE_ONE_WAY = 'https://tourtravel.yber.in/api/v1/crm/pipelines/9/form';
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

  const hasCustomName = formConfig.fields.some(f => !String(f.id).startsWith('base_') && ['name', 'full_name', 'first_name', 'your_name', 'your_name_'].includes(f.field_key));
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

export default async function RootLayout({ children }) {
  const [companyInfo, themeColours, roundTripData, oneWayData] = await Promise.all([
    getCompanyInfo(),
    getThemeColours(),
    fetchPipeline(PIPELINE_ROUND_TRIP),
    fetchPipeline(PIPELINE_ONE_WAY)
  ]);

  const roundTripConfig = normalizeFormConfig(roundTripData);
  const oneWayConfig = normalizeFormConfig(oneWayData);

  const projectTheme = {
    '--brand-primary': projectConfig.primary,
    '--brand-primary-hover': projectConfig.primaryHover,
    '--brand-primary-light': projectConfig.primaryLight,
    '--brand-primary-border': projectConfig.primaryBorder,
    '--brand-secondary': projectConfig.secondary,
    '--brand-secondary-hover': projectConfig.secondaryHover,
    '--color-primary': 'var(--brand-primary)',
    '--color-primary-hover': 'var(--brand-primary-hover)',
    '--color-primary-light': 'var(--brand-primary-light)',
    '--color-secondary': 'var(--brand-secondary)',
    '--color-secondary-hover': 'var(--brand-secondary-hover)',
    '--bs-primary': 'var(--color-primary)',
    '--bs-secondary': 'var(--color-secondary)',
    '--bs-link-color': 'var(--color-primary)',
    '--bs-link-hover-color': 'var(--color-primary-hover)',
    '--gradient-primary': 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
    '--gradient-warm': 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-hover) 100%)',
  };
  const activeTheme = { ...projectTheme, ...themeColours };

  return (
    <html lang="en" data-theme="light" data-project={projectConfig.key} data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${poppins.variable} bg-light min-h-screen flex flex-col font-sans`} style={activeTheme}>
        <BootstrapClient />
        <ThemeColoursClient initialVariables={activeTheme} />
        <WishlistProvider>
          <Navbar brand={projectConfig} companyInfo={companyInfo} roundTripConfig={roundTripConfig} oneWayConfig={oneWayConfig} />
          <GlobalInquiryModal brand={projectConfig} companyInfo={companyInfo} />
          <FloatingContactWidget />
          <main>{children}</main>
          <Footer brand={projectConfig} companyInfo={companyInfo} />
          <ToastProvider />
        </WishlistProvider>
      </body>
    </html>
  );
}
