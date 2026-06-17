import './globals.css';

import { Inter, Poppins } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BootstrapClient from '@/components/BootstrapClient';
import GlobalInquiryModal from '@/components/GlobalInquiryModal';
import ThemeColoursClient from '@/components/ThemeColoursClient';
import ToastProvider from '@/components/ToastProvider';
import { WishlistProvider } from '@/components/WishlistProvider';
import { getCompanyInfo } from '@/utils/companyInfo';
import { getProjectConfig } from '@/utils/projectConfig';
import { getThemeColours } from '@/utils/themeColours';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
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

export default async function RootLayout({ children }) {
  const [companyInfo, themeColours] = await Promise.all([
    getCompanyInfo(),
    getThemeColours(),
  ]);
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
      <body
        className={`${inter.variable} ${poppins.variable}`}
        style={activeTheme}
      >
        <BootstrapClient />
        <ThemeColoursClient initialVariables={activeTheme} />
        <WishlistProvider>
          <Navbar brand={projectConfig} companyInfo={companyInfo} />
          <GlobalInquiryModal brand={projectConfig} companyInfo={companyInfo} />
          <main>{children}</main>
          <Footer brand={projectConfig} companyInfo={companyInfo} />
          <ToastProvider />
        </WishlistProvider>
      </body>
    </html>
  );
}
