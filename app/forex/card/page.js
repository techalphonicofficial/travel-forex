import ForexBasePage from '@/components/forex/ForexBasePage';
import { getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const pageData = await getPageBySlug('forex/card');
  if (pageData) {
    return {
      title: pageData.meta_title || 'Apply for Multi-Currency Forex Card',
      description: pageData.meta_description || 'Secure and load multiple currencies with zero markup fees. Accepted worldwide.',
    };
  }
  return {
    title: 'Apply for Multi-Currency Forex Card',
    description: 'Secure and load multiple currencies with zero markup fees. Accepted worldwide.',
  };
}

export default async function CardPage() {
  let pageData = await getPageBySlug('forex/card');
  const currencyPageData = await getPageBySlug('forex/currency');

  // Borrow missing sections from forex/currency
  if (currencyPageData && currencyPageData.details) {
    if (!pageData) pageData = { details: [] };
    if (!pageData.details) pageData.details = [];
    
    currencyPageData.details.forEach(currencyBlock => {
      const exists = pageData.details.some(d => d.key === currencyBlock.key);
      if (!exists) {
        pageData.details.push(currencyBlock);
      }
    });
  }

  return <ForexBasePage pageType="card" pageData={pageData} />;
}
