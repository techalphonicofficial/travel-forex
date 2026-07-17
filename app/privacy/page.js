import CmsPolicyPage, { generateCmsPolicyMetadata } from '@/components/CmsPolicyPage';

export const dynamic = 'force-dynamic';

const fallback = {
  eyebrow: 'privacy',
  title: 'Privacy Policy',
  description: 'Transparency and security are at the core of ITS TRAVELS AND TOURS. Learn how we handle and protect your personal data.',
  html: `
    <h2><strong>1. Information We Collect</strong></h2>
    <p>We collect information you provide directly to us when you create an account, initiate a booking, sign up for our newsletter, or communicate with us.</p>
    <h2><strong>2. How We Use Your Information</strong></h2>
    <p>We use your information to facilitate bookings, send transactional updates, respond to requests, and personalize your experience.</p>
    <h2><strong>3. Data Security</strong></h2>
    <p>We take reasonable measures to protect your information from loss, theft, misuse, and unauthorized access.</p>
  `,
};

export async function generateMetadata() {
  return generateCmsPolicyMetadata('privacy', fallback);
}

export default function PrivacyPolicy() {
  return <CmsPolicyPage slug="privacy" fallback={fallback} accent="#047857" />;
}
