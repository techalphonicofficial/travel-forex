import Navbar from '@/components/Navbar';
import { blogsData } from '@/data/blogs';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return blogsData.map((b) => ({ slug: b.slug }));
}

export default async function BlogArticle(props) {
  const params = await props.params;
  const blog = blogsData.find((b) => b.slug === params.slug);

  if (!blog) return notFound();

  // Find related articles
  const relatedArticles = blog.related
    ? blogsData.filter(b => blog.related.includes(b.slug))
    : [];

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Navbar with dark background integration */}
      <div style={{ background: '#111827', width: '100%' }}>
        <Navbar />
      </div>

      {/* Hero Image Section */}
      <div style={{ position: 'relative', width: '100%', height: '50vh', minHeight: 400 }}>
        <img
          src={blog.image}
          alt={blog.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Gradient Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(17,24,39,0.2) 0%, rgba(17,24,39,0.8) 100%)' }} />

        {/* Title Container over hero */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '64px 24px' }}>
          <div className='container' style={{ margin: '0 auto', textAlign: 'center' }}>
            <span style={{
              background: '#10b981', color: 'white', padding: '6px 14px', borderRadius: 20,
              fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20, display: 'inline-block'
            }}>
              {blog.category}
            </span>
            <h1 style={{
              fontFamily: 'Poppins, sans-serif', fontSize: 32, fontWeight: 900, color: 'white',
              margin: '0 0 24px', lineHeight: 1.2
            }}>
              {blog.title}
            </h1>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 14 }}>
              <span style={{ color: 'white', fontWeight: 600 }}>By {blog.author}</span>
              <span>•</span>
              <span>{blog.date}</span>
              <span>•</span>
              <span>{blog.readTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className='container' style={{ margin: '-24px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'white', borderRadius: 24, padding: '48px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
          margin: '0 auto',
          position: 'relative'
        }}>
          {/* Main Typography content */}
          {/* We inject HTML since blogs typically come from CMS (and mock data is HTML) */}
          <div
            style={{ fontSize: 18, color: '#374151', lineHeight: 1.8, fontFamily: 'serif' }}
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* Related Articles Strip */}
        {relatedArticles.length > 0 && (
          <div style={{ marginTop: 80 }}>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 32, textAlign: 'center' }}>
              Related Reads
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, margin: '0 auto' }}>
              {relatedArticles.slice(0, 3).map((relatedBlog) => (
                <Link
                  key={relatedBlog.id}
                  href={`/blog/${relatedBlog.slug}`}
                  style={{
                    textDecoration: 'none', background: 'white', borderRadius: 16, overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column'
                  }}
                >
                  <img src={relatedBlog.image} alt={relatedBlog.title} style={{ height: 200, width: '100%', objectFit: 'cover' }} />
                  <div style={{ padding: 24 }}>
                    <div style={{ color: '#10b981', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{relatedBlog.category}</div>
                    <h4 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 18, fontWeight: 700, margin: 0, color: '#111827', lineHeight: 1.4 }}>{relatedBlog.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

    </main>
  );
}
