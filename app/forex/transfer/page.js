import ForexBasePage from '@/components/forex/ForexBasePage';
import { getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const pageData = await getPageBySlug('forex/transfer');
  if (pageData) {
    return {
      title: pageData.meta_title || 'International Money Transfer | Secure Remittance',
      description: pageData.meta_description || 'Fast, secure, and transparent international money transfers for tuition, medical, and business.',
    };
  }
  return {
    title: 'International Money Transfer | Secure Remittance',
    description: 'Fast, secure, and transparent international money transfers for tuition, medical, and business.',
  };
}

export default async function TransferPage() {
  const pageData = await getPageBySlug('forex/transfer');

  return <ForexBasePage pageType="transfer" pageData={pageData} />;
}
