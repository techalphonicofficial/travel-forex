import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Inter, Poppins } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BootstrapClient from '@/components/BootstrapClient';
import GlobalInquiryModal from '@/components/GlobalInquiryModal';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata = {
  metadataBase: new URL('https://wanderlust-tours.com'),
  title: {
    default: 'ITS TRAVELS AND TOURS — Premium Travel booking',
    template: '%s | ITS TRAVELS AND TOURS',
  },
  description:
    'Discover handcrafted travel experiences. Book luxury tours to the world\'s most breathtaking destinations with ITS TRAVELS AND TOURS.',
  keywords: ['travel', 'tours', 'vacation', 'holiday packages', 'adventure travel', 'luxury travel'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wanderlust-tours.com',
    siteName: 'ITS TRAVELS AND TOURS',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=75',
        width: 1200,
        height: 630,
        alt: 'ITS TRAVELS AND TOURS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@wanderlusttours',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${inter.variable} ${poppins.variable}`}>
        <BootstrapClient />
        <Navbar />
        <GlobalInquiryModal />
        <main>{children}</main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              fontWeight: '500',
            },
          }}
        />
      </body>
    </html>
  );
}
