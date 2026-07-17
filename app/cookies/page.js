import CmsPolicyPage, { generateCmsPolicyMetadata } from '@/components/CmsPolicyPage';

export const dynamic = 'force-dynamic';

const fallback = {
  eyebrow: 'cookies',
  title: 'Cookie Policy',
  description: 'Transparency in how we use digital trackers to optimize your online booking experience.',
  html: `
    <h2><strong>1. Information We Collect</strong></h2>
    <p>We collect information you provide directly to us when you create an account, initiate a booking, sign up for our newsletter, or communicate with us.</p>
    <h2><strong>2. How We Use Your Information</strong></h2>
    <ul>
      <li>To facilitate your travel bookings and manage your itinerary.</li>
      <li>To send transactional messages, including confirmations, updates, and security alerts.</li>
      <li>To personalize your experience and provide tailored travel recommendations.</li>
    </ul>
    <h2><strong>3. Data Security</strong></h2>
    <p>We use reasonable measures and industry-standard protocols to help protect your information.</p>
  `,
};

export async function generateMetadata() {
  return generateCmsPolicyMetadata('cookies', fallback);
}

export default function CookiePolicy() {
  return <CmsPolicyPage slug="cookies" fallback={fallback} accent="#b45309" />;
}
