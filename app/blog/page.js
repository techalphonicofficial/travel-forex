'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { blogsData } from '@/data/blogs';

export default function BlogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const totalPages = Math.ceil(blogsData.length / itemsPerPage);
  const currentBlogs = blogsData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: 'smooth' }); // Scroll back gracefully
  };

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      {/* Blog Hero Container */}
      <div style={{ background: '#111827', padding: '100px 24px 60px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 48, fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
          Travel Inspiration & Stories
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Discover hidden gems, expert packing guides, and carefully curated itineraries for your next adventure.
        </p>
      </div>

      {/* Blog Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px', width: '100%', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
          {currentBlogs.map((blog) => (
            <Link 
              key={blog.id} 
              href={`/blog/${blog.slug}`}
              style={{ 
                textDecoration: 'none', 
                background: 'white', 
                borderRadius: 16, 
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
              }}
            >
              {/* Image */}
              <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={blog.image} 
                  alt={blog.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div style={{ 
                  position: 'absolute', top: 16, left: 16, 
                  background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
                  padding: '4px 12px', borderRadius: 20, 
                  fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' 
                }}>
                  {blog.category}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>{blog.author}</span>
                  <span>•</span>
                  <span>{blog.date}</span>
                </div>
                
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 12px', lineHeight: 1.4 }}>
                  {blog.title}
                </h3>
                
                <p style={{ margin: '0 0 24px', fontSize: 15, color: '#4b5563', lineHeight: 1.6, flex: 1 }}>
                  {blog.excerpt}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{blog.readTime}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Read Article 
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 64 }}>
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white',
                color: currentPage === 1 ? '#cbd5e1' : '#374151', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              Previous
            </button>
            
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{
                    width: 40, height: 40, borderRadius: 8, border: 'none',
                    background: currentPage === page ? '#10b981' : 'white',
                    color: currentPage === page ? 'white' : '#4b5563',
                    fontWeight: 700, cursor: 'pointer',
                    boxShadow: currentPage === page ? '0 4px 12px rgba(16,185,129,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>

            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white',
                color: currentPage === totalPages ? '#cbd5e1' : '#374151', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
