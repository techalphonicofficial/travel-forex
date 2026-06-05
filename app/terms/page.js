import CmsPolicyPage, { generateCmsPolicyMetadata } from '@/components/CmsPolicyPage';

export const dynamic = 'force-dynamic';

const fallback = {
  eyebrow: 'terms',
  title: 'Terms of Service',
  description: 'The legal agreements and operational framework governing your relationship with ITS TRAVELS AND TOURS.',
  html: `
    <h2><strong>1. Agreement to Terms</strong></h2>
    <p>By accessing or using our platform, you confirm your agreement to be bound by these Terms.</p>
    <h2><strong>2. Booking Operations and Third Parties</strong></h2>
    <p>Our company acts as an intermediary connecting clients with airlines, ground handlers, and lodging systems.</p>
    <h2><strong>3. Visas &amp; Documentation</strong></h2>
    <p>The traveler is responsible for securing proper visas, passports, and health declarations for international travel.</p>
  `,
};

export async function generateMetadata() {
  return generateCmsPolicyMetadata('terms', fallback);
}

export default function TermsOfService() {
  return <CmsPolicyPage slug="terms" fallback={fallback} accent="#6d28d9" />;
}
