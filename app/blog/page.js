import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { blogsData } from '@/data/blogs';
import { getBlogs, getMediaUrl, getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

const FALLBACK_HERO_IMAGE = 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&q=80&w=1600';
const LIMIT_OPTIONS = [6, 9, 12, 18, 30];

const clampNumber = (value, fallback, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(Math.floor(number), min), max);
};

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

const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const getBlogImage = (blog, index = 0) => (
  getMediaUrl(blog.featured_image)
  || getMediaUrl(blog.details?.find((detail) => detail.image)?.image)
  || blogsData[index % blogsData.length]?.image
  || FALLBACK_HERO_IMAGE
);

const normalizeApiBlog = (blog, index) => ({
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  excerpt: blog.summary || stripHtml(blog.content).slice(0, 160),
  content: blog.content || '',
  author: blog.author?.name || 'ITS Travels',
  date: formatDate(blog.published_at || blog.created_at),
  category: blog.category?.name || 'Travel',
  image: getBlogImage(blog, index),
});

const normalizeFallbackBlog = (blog) => ({
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  excerpt: blog.excerpt,
  content: blog.content,
  author: blog.author,
  date: blog.date,
  category: blog.category,
  image: blog.image,
});

const getPageHref = ({ page, limit }) => `/blog?page=${page}&limit=${limit}`;

export async function generateMetadata() {
  const page = await getPageBySlug('blog');
  const image = getMediaUrl(page?.feature_image);

  return {
    title: page?.meta_title || page?.title || 'Blog',
    description: page?.meta_description || page?.description || 'Travel inspiration, guides, and stories.',
    keywords: page?.keyword ? [page.keyword] : undefined,
    openGraph: {
      title: page?.meta_title || page?.title || 'Blog',
      description: page?.meta_description || page?.description || 'Travel inspiration, guides, and stories.',
      images: image ? [{ url: image, width: 1200, height: 630, alt: page?.alt_text || page?.title || 'Blog' }] : undefined,
    },
  };
}

export default async function BlogPage({ searchParams }) {
  const query = await searchParams;
  const currentPage = clampNumber(query?.page, 1, 1, 10000);
  const limit = clampNumber(query?.limit, 10, 1, 50);
  const [pageContent, blogsResponse] = await Promise.all([
    getPageBySlug('blog'),
    getBlogs({ page: currentPage, limit }),
  ]);

  const standardSection = pageContent?.details?.find((item) => item.section === 'standard');
  const apiBlogs = blogsResponse.data.map(normalizeApiBlog).filter((blog) => blog.slug);
  const fallbackStart = (currentPage - 1) * limit;
  const fallbackBlogs = blogsData.slice(fallbackStart, fallbackStart + limit).map(normalizeFallbackBlog);
  const blogs = apiBlogs.length ? apiBlogs : fallbackBlogs;
  const totalItems = blogsResponse.pagination?.totalItems || blogsData.length;
  const totalPages = Math.max(1, blogsResponse.pagination?.totalPages || Math.ceil(totalItems / limit));
  const safePage = Math.min(currentPage, totalPages);
  const heroImage = getMediaUrl(pageContent?.feature_image) || FALLBACK_HERO_IMAGE;

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ position: 'relative', overflow: 'hidden', padding: '112px 24px 72px', textAlign: 'center', background: '#111827' }}>
        <Image
          src={heroImage}
          alt={pageContent?.alt_text || standardSection?.title || 'Travel stories'}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', opacity: 0.34 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(17,24,39,0.58), rgba(17,24,39,0.92))' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
            {standardSection?.title || 'Travel Inspiration & Stories'}
          </h1>
          <p style={{ color: '#d1d5db', fontSize: 18, maxWidth: 680, margin: '0 auto', lineHeight: 1.7 }}>
            {standardSection?.description || pageContent?.description || 'Discover hidden gems, expert packing guides, and carefully curated itineraries for your next adventure.'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px', width: '100%', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <span style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>
            Showing {blogs.length} of {totalItems.toLocaleString('en-IN')} stories
          </span>
          <span style={{ color: '#10b981', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
            Page {safePage} of {totalPages}
          </span>
        </div>

        {blogs.length > 0 ? (
          <div className="blog-grid">
            {blogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="blog-card">
                <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    style={{ objectFit: 'cover', transition: 'transform 0.5s' }}
                  />
                  <div className="blog-card-image-overlay" />
                  <div style={{
                    position: 'absolute', top: 16, left: 16,
                    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
                    padding: '4px 12px', borderRadius: 20,
                    fontSize: 12, fontWeight: 800, color: '#10b981', textTransform: 'uppercase',
                  }}>
                    {blog.category}
                  </div>
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: '#6b7280', marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#374151' }}>{blog.author}</span>
                    {blog.date && <span>|</span>}
                    {blog.date && <span>{blog.date}</span>}
                  </div>

                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 12px', lineHeight: 1.4 }}>
                    {blog.title}
                  </h3>

                  <p style={{ margin: '0 0 24px', fontSize: 15, color: '#4b5563', lineHeight: 1.6, flex: 1 }}>
                    {blog.excerpt}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 16, gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Read Article
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', background: 'white', border: '1px dashed #cbd5e1', borderRadius: 16, padding: '56px 24px', color: '#64748b', fontWeight: 700 }}>
            No blog posts are available right now.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 64, flexWrap: 'wrap' }}>
          <Link className={`pager-link ${safePage === 1 ? 'is-disabled' : ''}`} href={getPageHref({ page: Math.max(1, safePage - 1), limit })}>
            Previous
          </Link>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
            const pageNumber = start + i;
            return (
              <Link
                key={pageNumber}
                href={getPageHref({ page: pageNumber, limit })}
                className={`page-number ${safePage === pageNumber ? 'is-active' : ''}`}
              >
                {pageNumber}
              </Link>
            );
          })}

          <Link className={`pager-link ${safePage === totalPages ? 'is-disabled' : ''}`} href={getPageHref({ page: Math.min(totalPages, safePage + 1), limit })}>
            Next
          </Link>
        </div>

        <form action="/blog" style={{ margin: '28px auto 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input type="hidden" name="page" value="1" />
          <label htmlFor="blog-limit" style={{ color: '#64748b', fontSize: 13, fontWeight: 800 }}>
            Blogs to fetch
          </label>
          <select
            id="blog-limit"
            name="limit"
            defaultValue={limit}
            style={{ height: 40, borderRadius: 8, border: '1px solid #d1d5db', padding: '0 12px', color: '#374151', fontWeight: 700, background: 'white' }}
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button type="submit" style={{ height: 40, borderRadius: 8, border: 'none', padding: '0 16px', background: '#10b981', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
            Apply
          </button>
        </form>
      </div>

      <style>{`
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 40px;
        }
        .blog-card {
          text-decoration: none;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .blog-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.1);
        }
        .blog-card:hover img {
          transform: scale(1.05);
        }
        .blog-card-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.38));
        }
        .pager-link,
        .page-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 800;
        }
        .pager-link {
          padding: 0 16px;
          border: 1px solid #e5e7eb;
          background: white;
          color: #374151;
        }
        .page-number {
          width: 40px;
          background: white;
          color: #4b5563;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .page-number.is-active {
          background: #10b981;
          color: white;
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
        }
        .is-disabled {
          pointer-events: none;
          color: #cbd5e1;
        }
      `}</style>
    </main>
  );
}
