'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      background: '#f8fafc'
    }}>
      <div style={{
        fontSize: 'clamp(80px, 15vw, 150px)',
        fontWeight: 900,
        color: 'var(--color-primary)',
        lineHeight: 1,
        letterSpacing: '-5px',
        opacity: 0.1,
        marginBottom: '-40px'
      }}>
        404
      </div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ 
          fontSize: 'clamp(28px, 4vw, 42px)', 
          fontWeight: 900, 
          color: '#0f172a',
          marginBottom: '16px',
          fontFamily: 'var(--font-poppins), Poppins, sans-serif'
        }}>
          Lost in transit?
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          color: '#64748b', 
          maxWidth: '500px', 
          margin: '0 auto 32px',
          lineHeight: 1.6
        }}>
          We can't seem to find the page you're looking for. It might have been moved, deleted, or perhaps you just took a wrong turn.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 28px',
            background: 'var(--color-primary)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '999px',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px color-mix(in srgb, var(--color-primary) 30%, transparent)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Return Home
          </Link>

          <Link href="/tours" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 28px',
            background: 'white',
            color: '#334155',
            textDecoration: 'none',
            borderRadius: '999px',
            fontWeight: 700,
            border: '1px solid #e2e8f0',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            Explore Tours
          </Link>
        </div>
      </div>
    </div>
  );
}
