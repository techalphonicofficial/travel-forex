import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { blogsData } from '@/data/blogs';
import { getBlogs, getMediaUrl, getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&q=85&w=2000';

const LIMIT_OPTIONS = [6, 9, 12, 18, 30];

const clampNumber = (value, fallback, min, max) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(number), min), max);
};

const formatDate = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const decodeHtmlEntities = (value = '') =>
  String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');

const stripHtml = (value = '') =>
  decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getFirstTagText = (html = '', tag) => {
  const match = String(html).match(
    new RegExp(
      `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
      'i'
    )
  );

  return match ? stripHtml(match[1]) : '';
};

const getBlogHeroContent = (page) => {
  const heroSection =
    page?.details?.find(
      (item) =>
        item.section === 'story_grid' &&
        item.key === 'hero_key'
    ) ||
    page?.details?.find(
      (item) => item.section === 'story_grid'
    ) ||
    page?.details?.find(
      (item) => item.section === 'standard'
    );

  const storyDesc =
    heroSection?.json_data?.story_desc || '';

  return {
    title:
      getFirstTagText(storyDesc, 'h1') ||
      getFirstTagText(storyDesc, 'h2') ||
      heroSection?.json_data?.heading_content ||
      heroSection?.title ||
      page?.title ||
      'Travel Inspiration & Stories',

    description:
      getFirstTagText(storyDesc, 'p') ||
      heroSection?.description ||
      page?.description ||
      'Discover hidden gems, expert packing guides, and carefully curated itineraries for your next adventure.',

    image:
      getMediaUrl(
        heroSection?.json_data?.media_url ||
          page?.feature_image
      ) || FALLBACK_HERO_IMAGE,

    alt:
      page?.alt_text ||
      heroSection?.title ||
      'Travel stories',
  };
};

const getBlogImage = (blog, index = 0) => (
  getMediaUrl(blog.featured_image) ||
  getMediaUrl(
    blog.details?.find(
      (detail) => detail.image
    )?.image
  ) ||
  blogsData[index % blogsData.length]?.image ||
  FALLBACK_HERO_IMAGE
);

const normalizeApiBlog = (blog, index) => ({
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  excerpt:
    blog.summary ||
    stripHtml(blog.content).slice(0, 160),
  content: blog.content || '',
  author:
    blog.author?.name || 'ITS Travels',
  date: formatDate(
    blog.published_at ||
      blog.created_at
  ),
  category:
    blog.category?.name || 'Travel',
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

const getPageHref = ({
  page,
  limit,
}) => `/blog?page=${page}&limit=${limit}`;

export async function generateMetadata() {
  const page =
    await getPageBySlug('blog');

  const hero =
    getBlogHeroContent(page);

  return {
    title:
      page?.meta_title ||
      hero.title ||
      'Blog',

    description:
      page?.meta_description ||
      hero.description ||
      'Travel inspiration, guides, and stories.',

    keywords: page?.keyword
      ? [page.keyword]
      : undefined,

    openGraph: {
      title:
        page?.meta_title ||
        hero.title ||
        'Blog',

      description:
        page?.meta_description ||
        hero.description ||
        'Travel inspiration, guides, and stories.',

      images: hero.image
        ? [
            {
              url: hero.image,
              width: 1200,
              height: 630,
              alt:
                hero.alt || 'Blog',
            },
          ]
        : undefined,
    },
  };
}

export default async function BlogPage({
  searchParams,
}) {
  const query = await searchParams;

  const currentPage = clampNumber(
    query?.page,
    1,
    1,
    10000
  );

  const limit = clampNumber(
    query?.limit,
    10,
    1,
    50
  );

  const [
    pageContent,
    blogsResponse,
  ] = await Promise.all([
    getPageBySlug('blog'),
    getBlogs({
      page: currentPage,
      limit,
    }),
  ]);

  const hero =
    getBlogHeroContent(pageContent);

  const apiBlogs =
    blogsResponse.data
      .map(normalizeApiBlog)
      .filter(
        (blog) => blog.slug
      );

  const fallbackStart =
    (currentPage - 1) * limit;

  const fallbackBlogs =
    blogsData
      .slice(
        fallbackStart,
        fallbackStart + limit
      )
      .map(normalizeFallbackBlog);

  const blogs =
    apiBlogs.length
      ? apiBlogs
      : fallbackBlogs;

  const totalItems =
    blogsResponse.pagination
      ?.totalItems ||
    blogsData.length;

  const totalPages = Math.max(
    1,
    blogsResponse.pagination
      ?.totalPages ||
      Math.ceil(
        totalItems / limit
      )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  return (
    <main
      style={{
        background: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Navbar */}
      {/* <Navbar /> */}

      {/* =====================================================
          TRAVEL INSPIRATION & STORIES HERO
          ===================================================== */}

      <section className="blog-hero">
        {/* Background Image */}
        <div className="blog-hero-image">
          <Image
            src={
              hero.image ||
              FALLBACK_HERO_IMAGE
            }
            alt={hero.alt}
            fill
            priority
            sizes="100vw"
            quality={90}
            style={{
              objectFit: 'cover',
              objectPosition:
                'center center',
            }}
          />
        </div>

        {/* Light dark overlay removed */}

        {/* Hero Content */}
        <div className="blog-hero-content">
          <h1>
            {hero.title}
          </h1>

          <p>
            {hero.description}
          </p>
        </div>
      </section>

      {/* =====================================================
          BLOG CONTENT
          ===================================================== */}

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '64px 24px',
          width: '100%',
          flex: 1,
        }}
      >
        {/* Results Header */}
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              color: '#64748b',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Showing {blogs.length} of{' '}
            {totalItems.toLocaleString(
              'en-IN'
            )}{' '}
            stories
          </span>

          <span
            style={{
              color: '#10b981',
              fontSize: 13,
              fontWeight: 800,
              textTransform:
                'uppercase',
              letterSpacing: 1,
            }}
          >
            Page {safePage} of{' '}
            {totalPages}
          </span>
        </div>

        {/* =====================================================
            BLOG GRID
            ===================================================== */}

        {blogs.length > 0 ? (
          <div className="blog-grid">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="blog-card"
              >
                {/* Blog Image */}
                <div
                  style={{
                    height: 240,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={
                      blog.image ||
                      FALLBACK_HERO_IMAGE
                    }
                    alt={blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    style={{
                      objectFit: 'cover',
                      objectPosition:
                        'center',
                      transition:
                        'transform 0.5s ease',
                    }}
                  />

                  <div className="blog-card-image-overlay" />

                  {/* Category */}
                  <div
                    style={{
                      position:
                        'absolute',
                      top: 16,
                      left: 16,
                      background:
                        'rgba(255,255,255,0.94)',
                      backdropFilter:
                        'blur(6px)',
                      padding:
                        '4px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#10b981',
                      textTransform:
                        'uppercase',
                    }}
                  >
                    {blog.category}
                  </div>
                </div>

                {/* Blog Content */}
                <div
                  style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection:
                      'column',
                    flex: 1,
                  }}
                >
                  {/* Author / Date */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems:
                        'center',
                      fontSize: 13,
                      color: '#6b7280',
                      marginBottom: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: '#374151',
                      }}
                    >
                      {blog.author}
                    </span>

                    {blog.date && (
                      <span>
                        |
                      </span>
                    )}

                    {blog.date && (
                      <span>
                        {blog.date}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily:
                        'Poppins, sans-serif',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#111827',
                      margin:
                        '0 0 12px',
                      lineHeight: 1.4,
                    }}
                  >
                    {blog.title}
                  </h3>

                  {/* Excerpt */}
                  <p
                    style={{
                      margin:
                        '0 0 24px',
                      fontSize: 15,
                      color: '#4b5563',
                      lineHeight: 1.6,
                      flex: 1,
                    }}
                  >
                    {blog.excerpt}
                  </p>

                  {/* Read Article */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                      borderTop:
                        '1px solid #f3f4f6',
                      paddingTop: 16,
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: '#10b981',
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 4,
                      }}
                    >
                      Read Article

                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              background: 'white',
              border:
                '1px dashed #cbd5e1',
              borderRadius: 16,
              padding:
                '56px 24px',
              color: '#64748b',
              fontWeight: 700,
            }}
          >
            No blog posts are
            available right now.
          </div>
        )}

        {/* =====================================================
            PAGINATION
            ===================================================== */}

        <div
          style={{
            display: 'flex',
            justifyContent:
              'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 64,
            flexWrap: 'wrap',
          }}
        >
          <Link
            className={`pager-link ${
              safePage === 1
                ? 'is-disabled'
                : ''
            }`}
            href={getPageHref({
              page: Math.max(
                1,
                safePage - 1
              ),
              limit,
            })}
          >
            Previous
          </Link>

          {Array.from(
            {
              length: Math.min(
                totalPages,
                5
              ),
            },
            (_, i) => {
              const start =
                Math.max(
                  1,
                  Math.min(
                    safePage - 2,
                    totalPages - 4
                  )
                );

              const pageNumber =
                start + i;

              return (
                <Link
                  key={pageNumber}
                  href={getPageHref({
                    page:
                      pageNumber,
                    limit,
                  })}
                  className={`page-number ${
                    safePage ===
                    pageNumber
                      ? 'is-active'
                      : ''
                  }`}
                >
                  {pageNumber}
                </Link>
              );
            }
          )}

          <Link
            className={`pager-link ${
              safePage ===
              totalPages
                ? 'is-disabled'
                : ''
            }`}
            href={getPageHref({
              page: Math.min(
                totalPages,
                safePage + 1
              ),
              limit,
            })}
          >
            Next
          </Link>
        </div>

        {/* =====================================================
            BLOG LIMIT
            ===================================================== */}

        <form
          action="/blog"
          style={{
            margin:
              '28px auto 0',
            display: 'flex',
            justifyContent:
              'center',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <input
            type="hidden"
            name="page"
            value="1"
          />

          <label
            htmlFor="blog-limit"
            style={{
              color: '#64748b',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Blogs to fetch
          </label>

          <select
            id="blog-limit"
            name="limit"
            defaultValue={limit}
            style={{
              height: 40,
              borderRadius: 8,
              border:
                '1px solid #d1d5db',
              padding: '0 12px',
              color: '#374151',
              fontWeight: 700,
              background:
                'white',
            }}
          >
            {LIMIT_OPTIONS.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
          </select>

          <button
            type="submit"
            style={{
              height: 40,
              borderRadius: 8,
              border: 'none',
              padding:
                '0 16px',
              background:
                '#10b981',
              color: 'white',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Apply
          </button>
        </form>
      </div>

      {/* =====================================================
          STYLES
          ===================================================== */}

      <style>{`
        /* ==========================================
           COMPACT HERO
           ========================================== */

        .blog-hero {
          position: relative;

          /*
           * Compact size as requested.
           * No large/oversized banner.
           */
          height: 280px;
          min-height: 280px;

          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: center;

          text-align: center;

          isolation: isolate;

          background: #172033;
        }

        /* ==========================================
           HERO IMAGE
           ========================================== */

        .blog-hero-image {
          position: absolute;
          inset: 0;

          z-index: -3;

          overflow: hidden;
        }

        .blog-hero-image img {
          object-fit: cover !important;

          /*
           * Keeps the center of the travel
           * photograph visible.
           */
          object-position:
            center center !important;

          transform: scale(1.01);
        }

        /* ==========================================
           HERO OVERLAY
           ========================================== */

        /*
         * The previous code used:
         *
         * opacity: 0.34
         *
         * on the actual image and then another
         * very dark overlay.
         *
         * That made the photograph difficult to see.
         *
         * Now the image stays fully visible and
         * only this light overlay is applied.
         */

        .blog-hero-overlay {
          position: absolute;
          inset: 0;

          z-index: -2;

          pointer-events: none;

          background:
            linear-gradient(
              180deg,
              rgba(
                15,
                23,
                42,
                0.25
              ) 0%,

              rgba(
                15,
                23,
                42,
                0.30
              ) 50%,

              rgba(
                15,
                23,
                42,
                0.48
              ) 100%
            );
        }

        /* ==========================================
           HERO CONTENT
           ========================================== */

        .blog-hero-content {
          position: relative;

          z-index: 2;

          width:
            min(
              900px,
              100%
            );

          padding:
            30px 24px;

          margin: 0 auto;
        }

        .blog-hero-content h1 {
          font-family:
            Poppins,
            sans-serif;

          /*
           * Smaller heading so the compact hero
           * doesn't feel oversized.
           */
          font-size:
            clamp(
              30px,
              4vw,
              46px
            );

          line-height: 1.15;

          font-weight: 900;

          color: #ffffff;

          margin:
            0 0 12px;

          letter-spacing:
            -0.5px;

          text-shadow:
            0 3px 18px
            rgba(
              0,
              0,
              0,
              0.40
            );
        }

        .blog-hero-content p {
          color:
            rgba(
              255,
              255,
              255,
              0.94
            );

          font-size: 16px;

          max-width: 680px;

          margin: 0 auto;

          line-height: 1.6;

          text-shadow:
            0 2px 10px
            rgba(
              0,
              0,
              0,
              0.40
            );
        }

        /* ==========================================
           BLOG GRID
           ========================================== */

        .blog-grid {
          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(
                320px,
                1fr
              )
            );

          gap: 40px;
        }

        /* ==========================================
           BLOG CARD
           ========================================== */

        .blog-card {
          text-decoration: none;

          background: white;

          border-radius: 16px;

          overflow: hidden;

          box-shadow:
            0 4px 20px
            rgba(
              0,
              0,
              0,
              0.05
            );

          display: flex;

          flex-direction: column;

          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        }

        .blog-card:hover {
          transform:
            translateY(-6px);

          box-shadow:
            0 12px 30px
            rgba(
              0,
              0,
              0,
              0.10
            );
        }

        .blog-card:hover img {
          transform:
            scale(1.05);
        }

        .blog-card-image-overlay {
          position: absolute;

          inset: 0;

          background:
            linear-gradient(
              180deg,
              transparent 45%,
              rgba(
                0,
                0,
                0,
                0.38
              )
            );

          pointer-events: none;
        }

        /* ==========================================
           PAGINATION
           ========================================== */

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
          padding:
            0 16px;

          border:
            1px solid
            #e5e7eb;

          background: white;

          color: #374151;

          transition:
            background 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease;
        }

        .pager-link:hover:not(
          .is-disabled
        ) {
          background:
            #f0fdf4;

          border-color:
            #10b981;

          color:
            #059669;
        }

        .page-number {
          width: 40px;

          background: white;

          color: #4b5563;

          box-shadow:
            0 2px 8px
            rgba(
              0,
              0,
              0,
              0.05
            );

          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .page-number:hover {
          transform:
            translateY(-2px);
        }

        .page-number.is-active {
          background:
            #10b981;

          color: white;

          box-shadow:
            0 4px 12px
            rgba(
              16,
              185,
              129,
              0.30
            );
        }

        .is-disabled {
          pointer-events: none;

          color:
            #cbd5e1;

          opacity: 0.7;
        }

        /* ==========================================
           TABLET
           ========================================== */

        @media (max-width: 900px) {
          .blog-hero {
            height: 260px;
            min-height: 260px;
          }

          .blog-hero-content {
            padding:
              26px 20px;
          }

          .blog-grid {
            gap: 28px;
          }
        }

        /* ==========================================
           MOBILE
           ========================================== */

        @media (max-width: 640px) {
          .blog-hero {
            height: 240px;
            min-height: 240px;
          }

          .blog-hero-image img {
            object-position:
              center center !important;
          }

          .blog-hero-overlay {
            background:
              linear-gradient(
                180deg,
                rgba(
                  15,
                  23,
                  42,
                  0.28
                ) 0%,

                rgba(
                  15,
                  23,
                  42,
                  0.48
                ) 100%
              );
          }

          .blog-hero-content {
            padding:
              24px 18px;
          }

          .blog-hero-content h1 {
            font-size: 30px;

            line-height: 1.15;
          }

          .blog-hero-content p {
            font-size: 14px;

            line-height: 1.5;
          }

          .blog-grid {
            grid-template-columns:
              1fr;

            gap: 24px;
          }
        }

        /* ==========================================
           SMALL MOBILE
           ========================================== */

        @media (max-width: 420px) {
          .blog-hero {
            height: 220px;
            min-height: 220px;
          }

          .blog-hero-content h1 {
            font-size: 27px;
          }

          .blog-hero-content p {
            font-size: 13px;
          }
        }
      `}</style>
    </main>
  );
}//ss