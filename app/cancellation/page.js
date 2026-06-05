import Image from 'next/image';
import { getMediaUrl, getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

const FALLBACK_HERO_IMAGE = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1920&q=75';

const FALLBACK_POLICY_HTML = `
  <h2><strong>General Philosophy</strong></h2>
  <p>We believe in flexibility for all our travelers. While some bookings are strictly non-refundable due to airline and hotel policies, our flexible management fee ensures you only pay for what cannot be salvaged from third-party vendor partners.</p>
  <h2><strong>Standard Schedule</strong></h2>
  <ul>
    <li><strong>60+ days before departure:</strong> 100% refund of base tour price, minus non-refundable airline fees.</li>
    <li><strong>30 to 59 days before departure:</strong> 50% refund on hotels and tour, minus non-refundable airfare.</li>
    <li><strong>Less than 30 days before departure:</strong> 0% refund on package unless standard travel insurance logic applies.</li>
  </ul>
  <h2><strong>Force Majeure</strong></h2>
  <p>In cases of natural disasters, global pandemics, or extreme political unrest, standard cancellation policies are overridden, and ITS TRAVELS AND TOURS will attempt to issue 100% credits immediately usable towards any future booking.</p>
  <h4><strong>Have Questions?</strong></h4>
  <p>Contact our support team 24/7 if you need immediate assistance regarding a cancellation.</p>
`;

const findSection = (page, section) => page?.details?.find((item) => item.section === section);

const formatDate = (value) => {
  if (!value) return 'January 2026';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return 'January 2026';
  }
};

const buildCancellationContent = (page) => {
  const storyGrid = findSection(page, 'story_grid');
  const heroImage = getMediaUrl(page?.feature_image) || FALLBACK_HERO_IMAGE;

  return {
    eyebrow: page?.title || 'Cancellation Policy',
    title: page?.description || page?.title || 'Cancellation & Refund Policy',
    description:
      storyGrid?.json_data?.heading_content ||
      'Stuff happens. We completely understand. Here is everything you need to know about modifying or canceling your trips.',
    image: heroImage,
    imageAlt: page?.alt_text || page?.title || 'Cancellation policy',
    html: storyGrid?.json_data?.story_desc || FALLBACK_POLICY_HTML,
    updatedAt: formatDate(page?.updated_at || page?.created_at),
  };
};

export async function generateMetadata() {
  const page = await getPageBySlug('cancellation');
  const image = getMediaUrl(page?.feature_image);

  return {
    title: page?.meta_title || page?.title || 'Cancellation Policy',
    description: page?.meta_description || page?.description || 'Cancellation and refund policy for ITS TRAVELS AND TOURS.',
    keywords: page?.keyword ? [page.keyword] : undefined,
    openGraph: {
      title: page?.meta_title || page?.title || 'Cancellation Policy',
      description: page?.meta_description || page?.description || 'Cancellation and refund policy.',
      images: image ? [{ url: image, width: 1200, height: 630, alt: page?.alt_text || page?.title || 'Cancellation Policy' }] : undefined,
    },
  };
}

export default async function CancellationPolicy() {
  const page = await getPageBySlug('cancellation');
  const content = buildCancellationContent(page);

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 }}>
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 360, display: 'flex', alignItems: 'center' }}>
        <Image
          src={content.image}
          alt={content.imageAlt}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          priority
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(17,24,39,0.92), rgba(31,41,55,0.82), rgba(153,27,27,0.72))' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 130, paddingBottom: 80, textAlign: 'center' }}>
          <span style={{ color: '#fecaca', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
            {content.eyebrow}
          </span>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 900, color: 'white', margin: '12px auto 16px', maxWidth: 780, lineHeight: 1.08 }}>
            {content.title}
          </h1>
          <p style={{ color: '#fee2e2', fontSize: 18, maxWidth: 740, margin: '0 auto', lineHeight: 1.7 }}>
            {content.description}
          </p>
        </div>
      </section>

      <section className="container" style={{ marginTop: -48, position: 'relative', zIndex: 2 }}>
        <article style={{ maxWidth: 880, margin: '0 auto', background: 'white', padding: 'clamp(28px, 6vw, 60px)', borderRadius: 24, boxShadow: '0 18px 60px rgba(15,23,42,0.12)', border: '1px solid rgba(226,232,240,0.9)' }}>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 36, fontWeight: 700 }}>
            Last Updated: {content.updatedAt}
          </p>

          <div className="policy-content" dangerouslySetInnerHTML={{ __html: content.html }} />
        </article>
      </section>

      <style>{`
        .policy-content {
          color: #4b5563;
          font-size: 16px;
          line-height: 1.85;
        }

        .policy-content h2 {
          color: #1f2937;
          font-size: clamp(22px, 3vw, 28px);
          line-height: 1.25;
          margin: 38px 0 14px;
        }

        .policy-content h2:first-child {
          margin-top: 0;
        }

        .policy-content h2 strong,
        .policy-content h4 strong {
          font-weight: 800;
        }

        .policy-content p {
          margin: 0 0 20px;
        }

        .policy-content ul,
        .policy-content ol {
          margin: 0 0 28px;
          padding-left: 22px;
        }

        .policy-content li {
          margin-bottom: 12px;
          padding-left: 4px;
        }

        .policy-content li::marker {
          color: #ef4444;
        }

        .policy-content li strong {
          color: #dc2626;
          font-weight: 800;
        }

        .policy-content a {
          color: #0f766e;
          font-weight: 700;
          text-decoration: none;
          border-bottom: 1px solid rgba(15,118,110,0.28);
        }

        .policy-content h4 {
          color: #047857;
          margin: 42px 0 8px;
          font-size: 18px;
        }

        .policy-content h4 + p {
          background: #ecfdf5;
          border-left: 4px solid #10b981;
          padding: 20px 22px;
          border-radius: 10px;
          color: #065f46;
          margin-top: 0;
        }

        .policy-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0 32px;
          overflow: hidden;
          border-radius: 12px;
          box-shadow: 0 0 0 1px #e5e7eb;
        }

        .policy-content td,
        .policy-content th {
          border: 1px solid #e5e7eb;
          padding: 14px 16px;
          vertical-align: top;
        }

        .policy-content tr:nth-child(even) {
          background: #f9fafb;
        }
      `}</style>
    </main>
  );
}
