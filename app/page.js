import HomeHero from '@/components/HomeHero';
import RecommendedPackages from '@/components/FeaturedToursRow';
import WhyChooseSection from '@/components/WhyChooseSection';
import PopularDestinationRows from '@/components/PopularDestinationRows';
import GramSection from '@/components/GramSection';
import TrustSection from '@/components/TrustSection';
import NewsletterForm from '@/components/NewsletterForm';
import { getHomePage } from '@/utils/api';
import DomesticInternationalPackages from '@/components/DomesticInternationalPackages';
import ForexSection from '@/components/ForexSection';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ITS TRAVELS AND TOURS - Create Your Sooper Hit Holiday!',
  description:
    'Fully personalized international holidays crafted by experts. Book Bali, Maldives, Europe, Japan & 120+ destinations. 50K+ happy travelers. Best price guarantee.',
  keywords: 'travel packages, holiday packages, international tours, customized holidays, Bali, Maldives, Europe tours',
};

export default async function HomePage() {
  const homePage = await getHomePage();
  const trustSection = homePage?.details?.find(
    (detail) => detail?.section === 'gallery' && detail?.key === 'our_trusted_partner'
  );

  return (
    <>
      {/* Dark video hero — outside warm ivory wrapper */}
      <HomeHero />

      {/* ═══════════════════════════════════════════
          WARM IVORY SECTIONS — cream luxury theme
          ═══════════════════════════════════════════ */}
      <div className="hp-ivory">
        <DomesticInternationalPackages />

        <PopularDestinationRows />

        <WhyChooseSection />

        <RecommendedPackages />

        <TrustSection section={trustSection} />
      </div>

      {/* Dark-themed sections — own explicit backgrounds, unaffected */}
      <ForexSection />

      <GramSection />

      <section style={{ background: 'var(--color-primary)', padding: '48px 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 420, width: '40%' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            STAY IN THE LOOP
          </p>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 26, color: 'white', marginBottom: 10, lineHeight: 1.2 }}>
            Get Exclusive Deals & Travel Inspiration
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 24 }}>
            Early-bird discounts, curated guides & weekly travel ideas.
          </p>
          <NewsletterForm />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 10 }}>
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </>
  );
}
