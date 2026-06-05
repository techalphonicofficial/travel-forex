'use client';
import Link from 'next/link';

const destinations = [
  {
    name: 'Bali', country: 'Indonesia', packages: 24,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
    slug: 'bali'
  },
  {
    name: 'Thailand', country: 'Thailand', packages: 32,
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&q=80',
    slug: 'thailand'
  },
  {
    name: 'Japan', country: 'Japan', packages: 18,
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
    slug: 'kyoto'
  },
  {
    name: 'Dubai', country: 'UAE', packages: 15,
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
    slug: 'dubai'
  },
  {
    name: 'Maldives', country: 'Maldives', packages: 10,
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=80',
    slug: 'maldives'
  },
  {
    name: 'Europe', country: 'Multi-Country', packages: 45,
    image: 'https://images.unsplash.com/photo-1467269204594-f3e4a89fcf87?w=400&q=80',
    slug: 'europe'
  },
  {
    name: 'Switzerland', country: 'Switzerland', packages: 12,
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=400&q=80',
    slug: 'swiss-alps-adventure'
  },
  {
    name: 'Australia', country: 'Australia', packages: 9,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
    slug: 'australia'
  },
];

export default function DestinationPills() {
  return (
    <section style={{ padding: '0 0 20px', background: 'var(--color-bg)' }}>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--color-text-primary)', margin: 0 }}>
            Explore Popular Destinations
          </h2>
          <Link href="/tours" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}>View all</Link>
        </div>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
          {destinations.map((dest) => (
            <Link
              key={dest.name}
              href={`/tour?search=${dest.name}`}
              style={{
                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 8, textDecoration: 'none', cursor: 'pointer',
              }}
            >
              <div style={{
                width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                border: '3px solid transparent',
                background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, var(--color-primary), var(--color-secondary)) border-box',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transition: 'all 0.25s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(20,83,45,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
              >
                <img src={dest.image} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{dest.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{dest.packages} packages</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
