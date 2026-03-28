import HomeHero from '@/components/HomeHero';
import RecommendedPackages from '@/components/FeaturedToursRow';
import WhyChooseSection from '@/components/WhyChooseSection';
import PopularDestinationRows from '@/components/PopularDestinationRows';
import GramSection from '@/components/GramSection';
import ExperienceSection from '@/components/ExperienceSection';
import AppBanner from '@/components/AppBanner';
import TrustSection from '@/components/TrustSection';
import NewsletterForm from '@/components/NewsletterForm';

export const metadata = {
  title: 'ITS TRAVELS AND TOURS — Create Your Sooper Hit Holiday!',
  description:
    'Fully personalized international holidays crafted by experts. Book Bali, Maldives, Europe, Japan & 120+ destinations. 50K+ happy travelers. Best price guarantee.',
  keywords: 'travel packages, holiday packages, international tours, customized holidays, Bali, Maldives, Europe tours',
};

export default function HomePage() {
  return (
    <>
      {/* 1. HERO — dark bg image, traveler type, search */}
      <HomeHero />

      {/* 2. RECOMMENDED PACKAGES — horizontal scroll cards */}
      <RecommendedPackages />

      {/* 3. WHY CHOOSE — stats + features + image collage */}
      <WhyChooseSection />

      {/* 4. POPULAR DESTINATIONS — 2 horizontal scroll rows */}
      <PopularDestinationRows />

      {/* 5. LOVE FROM THE GRAM — dark, Instagram photo strip */}
      <GramSection />

      {/* 6. PLAN ADVENTURES + POPULAR HAND-PICKED */}
      <ExperienceSection />

      {/* 7. APP BANNER — dark green */}
      {/* <AppBanner /> */}

      {/* 8. TRUST LOGOS + AWARDS */}
      <TrustSection />

      {/* 9. NEWSLETTER */}
      <section style={{ background: '#026eb5', padding: '48px 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 600 }}>
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
