import ForexBasePage from '@/components/forex/ForexBasePage';

export const metadata = {
  title: 'International Money Transfer | Secure Remittance',
  description: 'Fast, secure, and transparent international money transfers for tuition, medical, and business.',
};

export default function TransferPage() {
  return <ForexBasePage pageType="transfer" />;
}
