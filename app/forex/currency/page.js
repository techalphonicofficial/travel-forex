import ForexBasePage from '@/components/forex/ForexBasePage';
import { getPageBySlug } from '@/utils/api';

export async function generateMetadata() {
  const pageData = await getPageBySlug('forex/currency');
  if (pageData?.success && pageData?.data) {
    return {
      title: pageData.data.meta_title || 'Buy/Sell Foreign Currency | Best Exchange Rates',
      description: pageData.data.meta_description || 'Get genuine foreign currency notes delivered to your doorstep. Buy or sell forex at live competitive exchange rates.',
    };
  }
  return {
    title: 'Buy/Sell Foreign Currency | Best Exchange Rates',
    description: 'Get genuine foreign currency notes delivered to your doorstep. Buy or sell forex at live competitive exchange rates.',
  };
}

export default async function CurrencyPage() {
  const pageDataResponse = await getPageBySlug('forex/currency');
  const pageData = pageDataResponse?.success ? pageDataResponse.data : null;

  return <ForexBasePage pageType="currency" pageData={pageData} />;
}
