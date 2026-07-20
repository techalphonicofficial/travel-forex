import ForexBasePage from '@/components/forex/ForexBasePage';

export const metadata = {
  title: 'Apply for Multi-Currency Forex Card',
  description: 'Secure and load multiple currencies with zero markup fees. Accepted worldwide.',
};

export default function CardPage() {
  return <ForexBasePage pageType="card" />;
}
