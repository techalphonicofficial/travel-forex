import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { notFound } from 'next/navigation';
import { blogsData } from '@/data/blogs';
import { getBlogBySlug, getMediaUrl, getRelatedBlogs } from '@/utils/api';

export const dynamic = 'force-dynamic';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&q=80&w=1600';

const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getBlogImage = (blog, fallbackIndex = 0) => (
  getMediaUrl(blog?.featured_image)
  || getMediaUrl(blog?.details?.find((detail) => detail.image)?.image)
  || blogsData[fallbackIndex % blogsData.length]?.image
  || FALLBACK_IMAGE
);

const normalizeApiBlog = (blog, fallbackIndex = 0) => ({
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  excerpt: blog.summary || stripHtml(blog.content).slice(0, 160),
  summary: blog.summary,
  content: blog.content || '',
  author: blog.author?.name || 'ITS Travels',
  date: formatDate(blog.published_at || blog.created_at),
  category: blog.category?.name || 'Travel',
  image: getBlogImage(blog, fallbackIndex),
  details: blog.details || [],
  metaTitle: blog.meta_title,
  metaDescription: blog.meta_description,
  metaKeywords: blog.meta_keywords,
  schemaMarkup: blog.schema_markup,
});

const normalizeFallbackBlog = (blog) => ({
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  excerpt: blog.excerpt,
  summary: blog.excerpt,
  content: blog.content,
  author: blog.author,
  date: blog.date,
  category: blog.category,
  image: blog.image,
  details: [],
  related: blog.related || [],
});

const findFallbackBlog = (slug) => {
  const blog = blogsData.find((item) => item.slug === slug);
  return blog ? normalizeFallbackBlog(blog) : null;
};

const getBlog = async (slug) => {
  const apiBlog = await getBlogBySlug(slug);
  return apiBlog ? normalizeApiBlog(apiBlog) : findFallbackBlog(slug);
};

const parseSchemaMarkup = (schemaMarkup) => {
  if (!schemaMarkup) return null;
  try {
    return JSON.stringify(JSON.parse(schemaMarkup));
  } catch {
    return null;
  }
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    return {
      title: 'Blog Not Found',
    };
  }

  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt || stripHtml(blog.content).slice(0, 160),
    keywords: blog.metaKeywords ? blog.metaKeywords.split(',').map((keyword) => keyword.trim()).filter(Boolean) : undefined,
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt || stripHtml(blog.content).slice(0, 160),
      images: [{ url: blog.image, width: 1200, height: 630, alt: blog.title }],
    },
  };
}

export default async function BlogArticle({ params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) return notFound();

  const apiRelated = (await getRelatedBlogs(blog.slug, 3))
    .filter((item) => item.slug !== blog.slug)
    .map((item, index) => normalizeApiBlog(item, index))
    .slice(0, 3);
  const fallbackRelated = blog.related
    ? blogsData.filter((item) => blog.related.includes(item.slug)).map(normalizeFallbackBlog).slice(0, 3)
    : [];
  const relatedArticles = apiRelated.length ? apiRelated : fallbackRelated;
  const schemaMarkup = parseSchemaMarkup(blog.schemaMarkup);

  return (
    <main className="blog-detail-page">
      {schemaMarkup && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaMarkup }}
        />
      )}
      <Navbar />

      <section className="blog-hero">
        <div className="blog-hero-bg" />
        <div className="blog-hero-inner">
          <div className="blog-hero-copy">
            <Link href="/blog" className="blog-back-link">Blog</Link>
            <h1>{blog.title}</h1>
            {(blog.summary || blog.excerpt) && <p>{blog.summary || blog.excerpt}</p>}
            <div className="blog-meta-grid">
              <div>
                <span>Author</span>
                <strong>{blog.author}</strong>
              </div>
              {blog.date && (
                <div>
                  <span>Updated On</span>
                  <strong>{blog.date}</strong>
                </div>
              )}
            </div>
          </div>
          <div className="blog-hero-image">
            <Image
              src={blog.image}
              alt={blog.title}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 520px"
              style={{ objectFit: 'cover' }}
            />
            <span>{blog.category}</span>
          </div>
        </div>
      </section>

      <div className="blog-shell">
        <article className="blog-article">
          {blog.content && (
            <div
              className="blog-body"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          )}

          {blog.details.map((detail, index) => (
            <section key={detail.id} className="blog-detail-section">
              {detail.image && index === 0 && (
                <figure className="blog-inline-image">
                  <Image
                    src={getMediaUrl(detail.image)}
                    alt={detail.alt_text || blog.title}
                    fill
                    sizes="(max-width: 900px) 100vw, 760px"
                    style={{ objectFit: 'cover' }}
                  />
                </figure>
              )}
              {detail.content && (
                <div
                  className="blog-body"
                  dangerouslySetInnerHTML={{ __html: detail.content }}
                />
              )}
              {detail.image && index !== 0 && (
                <figure className="blog-inline-image">
                  <Image
                    src={getMediaUrl(detail.image)}
                    alt={detail.alt_text || blog.title}
                    fill
                    sizes="(max-width: 900px) 100vw, 760px"
                    style={{ objectFit: 'cover' }}
                  />
                </figure>
              )}
            </section>
          ))}
        </article>

        <aside className="blog-sidebar">
          <div className="inquiry-card">
            <h2>Get in touch</h2>
            <p>Want help planning a trip around this story?</p>
            <input placeholder="Name" aria-label="Name" />
            <input placeholder="Mobile number" aria-label="Mobile number" />
            <button>WhatsApp enquiry</button>
          </div>
          <div className="planner-card">
            <span>Customise your trip</span>
            <h2>Your perfect holiday starts here</h2>
            <Link href="/customize">Start Planning</Link>
          </div>
        </aside>
      </div>

      {relatedArticles.length > 0 && (
        <section className="related-section">
          <div className="related-heading">
            <h2>Recommended Articles For You</h2>
            <Link href="/blog">View all</Link>
          </div>
          <div className="related-grid">
            {relatedArticles.map((relatedBlog) => (
              <Link key={relatedBlog.id} href={`/blog/${relatedBlog.slug}`} className="related-card">
                <div className="related-image">
                  <Image
                    src={relatedBlog.image}
                    alt={relatedBlog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 340px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <span>{relatedBlog.category}</span>
                  <h3>{relatedBlog.title}</h3>
                  <p>{relatedBlog.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* <section className="app-banner">
        <div>
          <span>Explore better</span>
          <h2>Your best way to plan a holiday</h2>
          <p>Build a custom itinerary with destination experts and local experiences.</p>
        </div>
        <Link href="/customize">Download app</Link>
      </section> */}

      <style>{`
        .blog-detail-page {
          background: #ffffff;
          min-height: 100vh;
        }
        .blog-hero {
          position: relative;
          background: #fff3e6;
          overflow: hidden;
          border-bottom: 1px solid #f1e0cc;
        }
        .blog-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 8% 58%, rgba(16,185,129,0.14), transparent 18%),
            linear-gradient(90deg, rgba(255,255,255,0.56), rgba(255,255,255,0.16));
        }
        .blog-hero-inner {
          position: relative;
          max-width: 1180px;
          margin: 0 auto;
          padding: 102px 24px 34px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 520px);
          gap: 42px;
          align-items: center;
        }
        .blog-hero-copy h1 {
          font-family: Poppins, sans-serif;
          color: #111827;
          font-size: clamp(30px, 4.2vw, 52px);
          line-height: 1.08;
          font-weight: 900;
          margin: 10px 0 18px;
          max-width: 700px;
        }
        .blog-hero-copy p {
          color: #475569;
          line-height: 1.7;
          font-size: 17px;
          max-width: 680px;
          margin: 0;
        }
        .blog-back-link {
          color: #047857;
          font-weight: 800;
          font-size: 13px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .blog-meta-grid {
          display: flex;
          gap: 34px;
          margin-top: 28px;
          flex-wrap: wrap;
        }
        .blog-meta-grid div {
          min-width: 92px;
        }
        .blog-meta-grid span {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .blog-meta-grid strong {
          color: #111827;
          font-size: 13px;
          font-weight: 800;
        }
        .blog-hero-image {
          position: relative;
          min-height: 292px;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          box-shadow: 0 16px 44px rgba(15, 23, 42, 0.18);
          background: #0f172a;
        }
        .blog-hero-image span {
          position: absolute;
          left: 16px;
          bottom: 16px;
          background: rgba(255,255,255,0.92);
          color: #047857;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .blog-shell {
          max-width: 1180px;
          margin: 0 auto;
          padding: 34px 24px 26px;
          display: grid;
          grid-template-columns: minmax(0, 760px) 300px;
          gap: 42px;
          align-items: start;
        }
        .blog-article {
          min-width: 0;
        }
        .blog-detail-section {
          margin-top: 30px;
        }
        .blog-inline-image {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          margin: 0 0 24px;
          background: #eef2f7;
        }
        .blog-body {
          color: #334155;
          font-size: 16px;
          line-height: 1.82;
        }
        .blog-body h2,
        .blog-body h3 {
          font-family: Poppins, sans-serif;
          color: #111827;
          line-height: 1.25;
          margin: 30px 0 12px;
          font-weight: 900;
        }
        .blog-body h2 {
          font-size: 24px;
        }
        .blog-body h3 {
          font-size: 20px;
        }
        .blog-body p {
          margin: 0 0 18px;
        }
        .blog-body a {
          color: #059669;
          font-weight: 800;
          text-decoration: none;
        }
        .blog-body ul,
        .blog-body ol {
          margin: 0 0 22px 21px;
          padding: 0;
        }
        .blog-body li {
          margin-bottom: 8px;
          padding-left: 4px;
        }
        .blog-body strong {
          color: #111827;
        }
        .blog-body figure.table {
          width: 100%;
          overflow-x: auto;
          margin: 28px 0;
          border: 1px solid #dbe3ee;
          background: white;
        }
        .blog-body table {
          width: 100%;
          border-collapse: collapse;
          min-width: 620px;
          font-size: 14px;
          line-height: 1.55;
        }
        .blog-body td,
        .blog-body th {
          border: 1px solid #dbe3ee;
          padding: 13px 15px;
          vertical-align: top;
        }
        .blog-body tr:first-child td,
        .blog-body th {
          background: #f8fafc;
          color: #111827;
          font-weight: 900;
        }
        .blog-body tr:nth-child(even) td {
          background: #fbfdff;
        }
        .blog-sidebar {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .inquiry-card,
        .planner-card {
          border-radius: 8px;
          padding: 18px;
          box-shadow: 0 10px 28px rgba(15,23,42,0.08);
        }
        .inquiry-card {
          background: #e8fff6;
          border: 1px solid #b9f4dc;
        }
        .inquiry-card h2,
        .planner-card h2 {
          font-family: Poppins, sans-serif;
          margin: 0;
          line-height: 1.2;
          font-weight: 900;
        }
        .inquiry-card h2 {
          color: #064e3b;
          font-size: 20px;
        }
        .inquiry-card p {
          color: #047857;
          font-size: 13px;
          line-height: 1.5;
          margin: 8px 0 14px;
        }
        .inquiry-card input {
          width: 100%;
          height: 40px;
          border: 1px solid #a7f3d0;
          border-radius: 6px;
          padding: 0 10px;
          margin-bottom: 10px;
          outline: none;
          color: #111827;
          background: white;
        }
        .inquiry-card button {
          width: 100%;
          height: 42px;
          border: none;
          border-radius: 6px;
          background: #10b981;
          color: white;
          font-weight: 900;
          cursor: pointer;
        }
        .planner-card {
          background: #003c2f;
          color: white;
          overflow: hidden;
          position: relative;
        }
        .planner-card span {
          color: #99f6e4;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .planner-card h2 {
          color: white;
          font-size: 22px;
          margin: 8px 0 18px;
        }
        .planner-card a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          border-radius: 6px;
          padding: 0 15px;
          background: #10b981;
          color: white;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
        }
        .related-section {
          max-width: 1180px;
          margin: 26px auto 0;
          padding: 0 24px 40px;
        }
        .related-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }
        .related-heading h2 {
          font-family: Poppins, sans-serif;
          font-size: 22px;
          color: #111827;
          margin: 0;
          font-weight: 900;
        }
        .related-heading a {
          color: #059669;
          font-weight: 900;
          text-decoration: none;
          font-size: 13px;
        }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        .related-card {
          text-decoration: none;
          color: inherit;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.24s, box-shadow 0.24s;
        }
        .related-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 26px rgba(15,23,42,0.1);
        }
        .related-image {
          position: relative;
          height: 150px;
          width: 100%;
          background: #eef2f7;
        }
        .related-card div:last-child {
          padding: 14px;
        }
        .related-card span {
          color: #059669;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .related-card h3 {
          font-family: Poppins, sans-serif;
          color: #111827;
          font-size: 15px;
          line-height: 1.35;
          margin: 6px 0 7px;
          font-weight: 900;
        }
        .related-card p {
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .app-banner {
          max-width: 1180px;
          margin: 0 auto 60px;
          padding: 30px 34px;
          border-radius: 8px;
          background: linear-gradient(135deg, #064e3b, #0f766e);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .app-banner span {
          color: #bbf7d0;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .app-banner h2 {
          font-family: Poppins, sans-serif;
          font-size: 28px;
          margin: 5px 0 6px;
          font-weight: 900;
        }
        .app-banner p {
          color: rgba(255,255,255,0.78);
          margin: 0;
        }
        .app-banner a {
          flex-shrink: 0;
          background: #22c55e;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          padding: 0 18px;
          font-weight: 900;
        }
        @media (max-width: 980px) {
          .blog-hero-inner,
          .blog-shell {
            grid-template-columns: 1fr;
          }
          .blog-sidebar {
            position: static;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .related-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .blog-hero-inner {
            padding-top: 88px;
          }
          .blog-meta-grid {
            gap: 18px;
          }
          .blog-shell {
            padding-left: 18px;
            padding-right: 18px;
          }
          .blog-sidebar,
          .related-grid {
            grid-template-columns: 1fr;
          }
          .blog-body {
            font-size: 15px;
          }
          .app-banner {
            margin-left: 18px;
            margin-right: 18px;
            padding: 24px;
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
