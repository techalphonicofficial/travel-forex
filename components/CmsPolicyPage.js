import Image from 'next/image';
import { getMediaUrl, getPageBySlug } from '@/utils/api';

const FALLBACK_HERO_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=75';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const plainTextToHtml = (value = '') => {
  const lines = String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return '';

  return lines.map((line) => {
    if (/^\d+\.\s+/.test(line)) {
      return `<h2><strong>${escapeHtml(line)}</strong></h2>`;
    }

    return `<p>${escapeHtml(line)}</p>`;
  }).join('');
};

const findRichTextSection = (page) => page?.details?.find((item) => item.section === 'rich_text');

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

const getPolicyContent = (page, fallback) => {
  const richText = findRichTextSection(page);
  const body = richText?.json_data?.body || plainTextToHtml(page?.meta_description) || fallback.html;

  return {
    eyebrow: page?.title || fallback.eyebrow,
    title: richText?.title || fallback.title,
    description: richText?.json_data?.heading_content || page?.description || fallback.description,
    image: getMediaUrl(page?.feature_image) || fallback.image || FALLBACK_HERO_IMAGE,
    imageAlt: page?.alt_text || richText?.title || fallback.title,
    html: body,
    updatedAt: formatDate(page?.updated_at || page?.created_at),
  };
};

export const generateCmsPolicyMetadata = async (slug, fallback) => {
  const page = await getPageBySlug(slug);
  const richText = findRichTextSection(page);
  const image = getMediaUrl(page?.feature_image);
  const title = page?.meta_title || richText?.title || fallback.title;
  const description = page?.meta_description || page?.description || fallback.description;

  return {
    title,
    description,
    keywords: page?.keyword ? [page.keyword] : undefined,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: page?.alt_text || title }] : undefined,
    },
  };
};

export default async function CmsPolicyPage({ slug, fallback, accent = '#0f766e' }) {
  const page = await getPageBySlug(slug);
  const content = getPolicyContent(page, fallback);

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 }}>
      <section style={{ position: 'relative', minHeight: 360, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <Image
          src={content.image}
          alt={content.imageAlt}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          priority
        />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(17,24,39,0.92), rgba(17,24,39,0.78), ${accent}cc)` }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 130, paddingBottom: 80, textAlign: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
            {content.eyebrow}
          </span>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 900, color: 'white', margin: '12px auto 16px', maxWidth: 820, lineHeight: 1.08 }}>
            {content.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 18, maxWidth: 780, margin: '0 auto', lineHeight: 1.7 }}>
            {content.description}
          </p>
        </div>
      </section>

      <section className="container" style={{ marginTop: -48, position: 'relative', zIndex: 2 }}>
        <article style={{ maxWidth: 920, margin: '0 auto', background: 'white', padding: 'clamp(28px, 6vw, 60px)', borderRadius: 24, boxShadow: '0 18px 60px rgba(15,23,42,0.12)', border: '1px solid rgba(226,232,240,0.9)' }}>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 36, fontWeight: 700 }}>
            Last Updated: {content.updatedAt}
          </p>
          <div className="cms-policy-content" dangerouslySetInnerHTML={{ __html: content.html }} />
        </article>
      </section>

      <style>{`
        .cms-policy-content {
          color: #4b5563;
          font-size: 16px;
          line-height: 1.85;
        }

        .cms-policy-content h2 {
          color: #1f2937;
          font-size: clamp(22px, 3vw, 28px);
          line-height: 1.25;
          margin: 38px 0 14px;
        }

        .cms-policy-content h2:first-child {
          margin-top: 0;
        }

        .cms-policy-content h2 strong,
        .cms-policy-content h3 strong,
        .cms-policy-content h4 strong {
          font-weight: 800;
        }

        .cms-policy-content p {
          margin: 0 0 20px;
        }

        .cms-policy-content ul,
        .cms-policy-content ol {
          margin: 0 0 28px;
          padding-left: 22px;
        }

        .cms-policy-content li {
          margin-bottom: 12px;
          padding-left: 4px;
        }

        .cms-policy-content li::marker {
          color: ${accent};
        }

        .cms-policy-content li strong {
          color: ${accent};
          font-weight: 800;
        }

        .cms-policy-content a {
          color: ${accent};
          font-weight: 700;
          text-decoration: none;
          border-bottom: 1px solid color-mix(in srgb, ${accent} 35%, transparent);
        }

        .cms-policy-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0 32px;
          overflow: hidden;
          border-radius: 12px;
          box-shadow: 0 0 0 1px #e5e7eb;
        }

        .cms-policy-content td,
        .cms-policy-content th {
          border: 1px solid #e5e7eb;
          padding: 14px 16px;
          vertical-align: top;
        }

        .cms-policy-content tr:nth-child(even) {
          background: #f9fafb;
        }
      `}</style>
    </main>
  );
}
