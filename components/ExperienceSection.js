'use client';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

const adventures = [
  {
    title: 'Cape Town & Safari',
    subtitle: 'South Africa',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=700&q=80',
    tag: '🦁 Safari',
    tagColor: '#f59e0b',
    href: '/tour?type=Safari',
    duration: '7 Nights',
    from: '₹89,999',
  },
  {
    title: 'Northern Lights',
    subtitle: 'Iceland & Norway',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=700&q=80',
    tag: '✨ Adventure',
    tagColor: '#6366f1',
    href: '/tour?type=Adventure',
    duration: '8 Nights',
    from: '₹1,24,999',
  },
  {
    title: 'Azure Coast Cruise',
    subtitle: 'Mediterranean, Europe',
    image: 'https://images.unsplash.com/photo-1467269204594-f3e4a89fcf87?w=700&q=80',
    tag: '🌊 Luxury',
    tagColor: '#0ea5e9',
    href: '/tour?type=Luxury',
    duration: '10 Nights',
    from: '₹2,19,999',
  },
  {
    title: 'Japan Cherry Blossom',
    subtitle: 'Tokyo & Kyoto, Japan',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=700&q=80',
    tag: '🌸 Cultural',
    tagColor: '#ec4899',
    href: '/tour?type=Cultural',
    duration: '10 Nights',
    from: '₹1,45,999',
  },
  {
    title: 'Bali Tropical Retreat',
    subtitle: 'Seminyak & Ubud, Bali',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=700&q=80',
    tag: '🏖️ Beach',
    tagColor: '#10b981',
    href: '/tour?type=Beach',
    duration: '7 Nights',
    from: '₹75,999',
  },
  {
    title: 'Swiss Alps Winter',
    subtitle: 'Interlaken, Switzerland',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=700&q=80',
    tag: '🏔️ Snow',
    tagColor: '#0284c7',
    href: '/tour?type=Snow',
    duration: '6 Nights',
    from: '₹1,89,999',
  },
];

const handpicked = [
  {
    name: 'Honeymoon Special',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=500&q=80',
    count: 27,
    tag: '💑',
    tagBg: '#fce7f3',
    tagColor: '#be185d',
  },
  {
    name: 'Adventure Seekers',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80',
    count: 35,
    tag: '🏔️',
    tagBg: '#eff6ff',
    tagColor: '#1d4ed8',
  },
  {
    name: 'Cultural Immersion',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=500&q=80',
    count: 42,
    tag: '🏛️',
    tagBg: '#fef3c7',
    tagColor: '#b45309',
  },
  {
    name: 'Beach & Relax',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
    count: 48,
    tag: '🏖️',
    tagBg: '#ecfdf5',
    tagColor: '#047857',
  },
  {
    name: 'Wildlife Safari',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=500&q=80',
    count: 14,
    tag: '🦁',
    tagBg: '#fff7ed',
    tagColor: '#c2410c',
  },
  {
    name: 'City Breaks',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80',
    count: 30,
    tag: '🏙️',
    tagBg: '#f5f3ff',
    tagColor: '#6d28d9',
  },
  {
    name: 'Family Holidays',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&q=80',
    count: 22,
    tag: '👨‍👩‍👧',
    tagBg: '#eff6ff',
    tagColor: '#1d4ed8',
  },
  {
    name: 'Solo Explorer',
    image: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=500&q=80',
    count: 19,
    tag: '🎒',
    tagBg: '#fef2f2',
    tagColor: '#b91c1c',
  },
];

function AdventureCard({ item, isMobile }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={item.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: isMobile ? 310 : '100%',
        maxWidth: 410,
        display: 'block',
        position: 'relative', height: 280, borderRadius: 20,
        overflow: 'hidden', textDecoration: 'none',
        // boxShadow: hovered ? '0 20px 50px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.14)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        transition: 'all 0.35s ease',
      }}
    >
      <img
        src={item.image} alt={item.title}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.5s ease',
        }}
        loading="lazy"
      />
      {/* Gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%)',
      }} />

      {/* Tag */}
      <div style={{
        position: 'absolute', top: 14, left: 14,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        color: 'white', borderRadius: 999,
        padding: '5px 14px', fontSize: 11, fontWeight: 700,
        border: '1px solid rgba(255,255,255,0.2)',
      }}>
        {item.tag}
      </div>

      {/* Duration */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        color: 'white', borderRadius: 999,
        padding: '5px 12px', fontSize: 11, fontWeight: 700,
        border: '1px solid rgba(255,255,255,0.2)',
      }}>
        {item.duration}
      </div>

      {/* Bottom info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 18px' }}>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '0 0 3px' }}>
          {item.subtitle}
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h3 style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 700,
            fontSize: 20, color: 'white', margin: 0, lineHeight: 1.2,
          }}>
            {item.title}
          </h3>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>From</div>
            <div style={{
              fontFamily: 'Poppins, sans-serif', fontWeight: 800,
              fontSize: 16, color: 'var(--color-secondary)',
            }}>
              {item.from}
            </div>
          </div>
        </div>
        <div style={{
          marginTop: 12,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 999, padding: '6px 16px',
          color: 'white', fontSize: 12, fontWeight: 700,
          width: 'fit-content',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(6px)',
          transition: 'all 0.3s ease',
        }}>
          Explore Now →
        </div>
      </div>
    </Link>
  );
}

function HandpickedCard({ item }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/tour?search=${item.name}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0, width: 240, textDecoration: 'none', display: 'block',
      }}
    >
      <div style={{
        position: 'relative', height: 200, borderRadius: 18,
        overflow: 'hidden',
        // boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.22)' : '0 4px 16px rgba(0,0,0,0.1)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        transition: 'all 0.35s ease',
      }}>
        <img
          src={item.image} alt={item.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
          loading="lazy"
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.75) 100%)',
        }} />

        {/* Emoji tag */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          width: 36, height: 36, borderRadius: 10,
          background: item.tagBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {item.tag}
        </div>

        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
          <div style={{
            color: 'white', fontFamily: 'Poppins, sans-serif',
            fontWeight: 700, fontSize: 15, lineHeight: 1.3, marginBottom: 4,
          }}>
            {item.name}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(6px)',
            borderRadius: 999, padding: '2px 10px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 600 }}>
              {item.count} packages
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ExperienceSection() {
  const adventureRef = useRef(null);
  const handpickedRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  /* Detect mobile for responsive card width and scroll logic */
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth <= 768);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const scroll = (ref, dir) => {
    if (!ref.current) return;
    const scrollAmount = isMobile ? 326 : 428;
    ref.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  };
  const scroll2 = (ref, dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * 256, behavior: 'smooth' });
  };

  return (
    <>
      {/* ── Plan Your Next Adventure ── */}
      <section style={{ background: '#fff', padding: '56px 0 60px' }}>
        <div className='container' style={{ margin: '0 auto', padding: '0 24px' }}>

          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'space-between', marginBottom: 28,
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 2.5,
                textTransform: 'uppercase', color: 'var(--color-primary)', margin: '0 0 6px',
              }}>
                CURATED EXPERIENCES
              </p>
              <h2 style={{
                fontFamily: 'Poppins, sans-serif', fontWeight: 800,
                fontSize: 26, color: '#111827', margin: 0,
              }}>
                Plan Your Next Adventure
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/tours" style={{
                fontSize: 13, color: 'var(--color-primary)', fontWeight: 700,
                textDecoration: 'none', padding: '8px 18px',
                border: '1.5px solid var(--color-primary)', borderRadius: 999,
                whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-primary)'; }}
              >
                View all →
              </Link>
              {['‹', '›'].map((arrow, i) => (
                <button
                  key={arrow}
                  onClick={() => scroll(adventureRef, i === 0 ? -1 : 1)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '1.5px solid #d1d5db',
                    background: 'white', color: '#374151', fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', lineHeight: 1,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                >
                  {arrow}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={adventureRef}
            style={{
              display: 'flex', gap: 18,
              overflowX: 'auto', paddingBottom: 6,
              paddingTop: '10px',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
            }}
          >
            {adventures.map((item) => (
              <AdventureCard key={item.title} item={item} isMobile={isMobile} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Hand-picked Experiences ── */}
      {/* <section style={{
        background: 'linear-gradient(135deg, var(--color-primary-light) 0%, #ecfdf5 50%, var(--color-primary-light) 100%)',
        padding: '52px 0 60px',
        borderTop: '1px solid var(--brand-primary-border)',
      }}>
        <div className='container' style={{ margin: '0 auto', padding: '0 24px' }}>

          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 28,
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 2.5,
                textTransform: 'uppercase', color: 'var(--color-primary)', margin: '0 0 6px',
              }}>
                TRAVEL YOUR WAY
              </p>
              <h2 style={{
                fontFamily: 'Poppins, sans-serif', fontWeight: 800,
                fontSize: 26, color: '#111827', margin: 0,
              }}>
                Popular Hand-picked Experiences
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/tours" style={{
                fontSize: 13, color: 'var(--color-primary)', fontWeight: 700,
                textDecoration: 'none', padding: '8px 18px',
                border: '1.5px solid var(--color-primary)', borderRadius: 999,
                whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-primary)'; }}
              >
                View all →
              </Link>
              {['‹', '›'].map((arrow, i) => (
                <button
                  key={arrow}
                  onClick={() => scroll2(handpickedRef, i === 0 ? -1 : 1)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '1.5px solid #d1d5db',
                    background: 'white', color: '#374151', fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', lineHeight: 1,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                >
                  {arrow}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={handpickedRef}
            style={{
              display: 'flex', gap: 16,
              overflowX: 'auto', paddingBottom: 6,
              paddingTop: '10px',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
            }}
          >
            {handpicked.map((item) => (
              <HandpickedCard key={item.name} item={item} />
            ))}
          </div>
        </div>
      </section> */}
    </>
  );
}
