import ForexBasePage from '@/components/forex/ForexBasePage';

export const metadata = {
  title: 'Buy/Sell Foreign Currency | Best Exchange Rates',
  description: 'Get genuine foreign currency notes delivered to your doorstep. Buy or sell forex at live competitive exchange rates.',
};

export default function CurrencyPage() {
  return <ForexBasePage pageType="currency" />;
}
