import HomeHero from '@/components/HomeHero';
import BannerCarousel from '@/components/BannerCarousel';
import WhyChooseSection from '@/components/WhyChooseSection';
import PopularDestinationRows from '@/components/PopularDestinationRows';
import GramSection from '@/components/GramSection';
import TrustSection from '@/components/TrustSection';
import NewsletterForm from '@/components/NewsletterForm';
import { getHomePage } from '@/utils/api';
import TabbedPackagesSection from '@/components/TabbedPackagesSection';
import ForexSection from '@/components/ForexSection';
import OffersCarousel from '@/components/OffersCarousel';
import CategoriesCarousel from '@/components/CategoriesCarousel';
import TestimonialSlider from '@/components/TestimonialSlider';
import FadeInSection from '@/components/FadeInSection';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ITS TRAVELS AND TOURS - Create Your Sooper Hit Holiday!',
  description:
    'Fully personalized international holidays crafted by experts. Book Bali, Maldives, Europe, Japan & 120+ destinations. 50K+ happy travelers. Best price guarantee.',
  keywords: 'travel packages, holiday packages, international tours, customized holidays, Bali, Maldives, Europe tours',
};

const PIPELINE_15_ENDPOINT = 'https://admin.travel-forex.com/api/v1/crm/pipelines/15/form';
const CRM_API_KEY = process.env.CRM_PIPELINE_FORM_API_KEY || process.env.CRM_COMPANY_INFO_API_KEY || 'pt_dc9eae82075b27c1408392fa7d7e0e632ef9e846f6e4e33e';

const getPipelineForm = async () => {
  try {
    const response = await fetch(PIPELINE_15_ENDPOINT, {
      headers: {
        accept: 'application/json',
        'x-api-key': CRM_API_KEY,
      },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.success ? payload.data : null;
  } catch (error) {
    console.error('Error fetching Pipeline 15 form:', error);
    return null;
  }
};

const normalizeFieldOptions = (options) => {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (typeof option === 'string') return { label: option, value: option };
      if (option && typeof option === 'object') {
        const label = option.label || option.name || option.title || option.value;
        const value = option.value || option.id || label;
        return label ? { label: String(label), value: String(value) } : null;
      }
      return null;
    })
    .filter(Boolean);
};

const normalizeFormConfig = (formConfig) => {
  if (!formConfig?.fields?.length) return null;

  const hasCustomName = formConfig.fields.some(f => !String(f.id).startsWith('base_') && ['name', 'full_name', 'first_name', 'your_name', 'your_name_'].includes(f.field_key));
  const hasCustomEmail = formConfig.fields.some(f => !String(f.id).startsWith('base_') && ['email', 'email_address', 'corporate_email'].includes(f.field_key));
  const hasCustomPhone = formConfig.fields.some(f => !String(f.id).startsWith('base_') && ['phone', 'mobile_number', 'contact_number', 'phone_number'].includes(f.field_key));

  return {
    id: formConfig.id,
    name: formConfig.name,
    stages: formConfig.stages || [],
    fields: [...formConfig.fields]
      .filter(field => {
        if (field.id === 'base_name' && hasCustomName) return false;
        if (field.id === 'base_email' && hasCustomEmail) return false;
        if (field.id === 'base_phone' && hasCustomPhone) return false;
        return true;
      })
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      .map((field) => ({
        id: field.id,
        label: field.label,
        fieldKey: field.field_key,
        fieldType: String(field.field_type || 'text').toLowerCase(),
        options: normalizeFieldOptions(field.options),
        isRequired: Boolean(field.is_required),
        order: field.order,
      }))
      .filter((field) => field.label && field.fieldKey),
  };
};

export default async function HomePage() {
  const homePage = await getHomePage();
  const pipeline15Data = await getPipelineForm();
  const formConfig15 = normalizeFormConfig(pipeline15Data);

  const trustSection = homePage?.details?.find(
    (detail) => detail?.section === 'gallery' && detail?.key === 'our_trusted_partner'
  );

  const bannerSection = homePage?.details?.find(
    (detail) => detail?.section === 'gallery' && detail?.key === 'banner_key'
  );
  const banners = bannerSection?.json_data?.images || [];

  const offerSection = homePage?.details?.find(
    (detail) => detail?.section === 'offer_grid' && detail?.key === 'offer_key'
  );
  const offersData = offerSection?.json_data || null;

  const testimonialSection = homePage?.details?.find(
    (detail) => detail?.section === 'testimonial_grid' && detail?.key === 'Happy Travelers'
  );
  const testimonialsData = testimonialSection?.json_data || null;

  const forexSectionData = homePage?.details?.find(
    (detail) => detail?.section === 'tabs_section' && detail?.key === 'Why_buy_Forex_from_us?'
  );

  return (
    <>
      {/* Dark video hero — outside warm ivory wrapper */}
      <HomeHero />

      {/* ═══════════════════════════════════════════
          WARM IVORY SECTIONS — cream luxury theme
          ═══════════════════════════════════════════ */}
      <div className="hp-ivory section-padding" style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
        <FadeInSection>
          <CategoriesCarousel />
        </FadeInSection>

        <FadeInSection delay={100}>
          <OffersCarousel offersData={offersData} />
        </FadeInSection>

        <FadeInSection delay={100}>
          <TabbedPackagesSection formConfig={formConfig15} />
        </FadeInSection>

        <FadeInSection delay={100}>
          <PopularDestinationRows />
        </FadeInSection>

        <FadeInSection delay={100}>
          <BannerCarousel banners={banners} />
        </FadeInSection>

        <FadeInSection delay={100}>
          <WhyChooseSection />
        </FadeInSection>

        <FadeInSection delay={100}>
          <TrustSection section={trustSection} />
        </FadeInSection>
      </div>

      {/* Dark-themed sections — own explicit backgrounds, unaffected */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', paddingBottom: '60px' }}>
        <FadeInSection delay={100}>
          <ForexSection section={forexSectionData} />
        </FadeInSection>

        <FadeInSection delay={100}>
          <TestimonialSlider section={testimonialSection} />
        </FadeInSection>

        <FadeInSection delay={100}>
          <GramSection />
        </FadeInSection>
      </div>

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
