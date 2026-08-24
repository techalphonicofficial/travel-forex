import ForexBasePage from '@/components/forex/ForexBasePage';
import { getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const pageData = await getPageBySlug('forex/currency');
  if (pageData) {
    return {
      title: pageData.meta_title || 'Buy/Sell Foreign Currency | Best Exchange Rates',
      description: pageData.meta_description || 'Get genuine foreign currency notes delivered to your doorstep. Buy or sell forex at live competitive exchange rates.',
    };
  }
  return {
    title: 'Buy/Sell Foreign Currency | Best Exchange Rates',
    description: 'Get genuine foreign currency notes delivered to your doorstep. Buy or sell forex at live competitive exchange rates.',
  };
}

export default async function CurrencyPage() {
  const pageData = await getPageBySlug('forex/currency');

  return <ForexBasePage pageType="currency" pageData={pageData} />;
}
