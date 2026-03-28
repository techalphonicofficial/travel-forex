'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';

const destinationRows = [
  {
    id: 'trending',
    title: 'TRENDING DESTINATIONS',
    items: [
      {
        name: 'Vietnam',
        subtitle: 'Land of Ascending Dragon',
        image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=500&q=80',
      },
      {
        name: 'Bali',
        subtitle: 'Cultural Paradise',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&q=80',
      },
      {
        name: 'Thailand',
        subtitle: 'The Kingdom Of',
        image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=500&q=80',
      },
      {
        name: 'Japan',
        subtitle: 'Land of Rising Sun',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80',
      },
      {
        name: 'Singapore',
        subtitle: 'The Lion City',
        image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=500&q=80',
      },
      {
        name: 'Dubai',
        subtitle: 'City of Gold',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&q=80',
      },
      {
        name: 'Switzerland',
        subtitle: 'Land of Alps',
        image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=500&q=80',
      },
      {
        name: 'Japan',
        subtitle: 'Land of Rising Sun',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80',
      },
      {
        name: 'Singapore',
        subtitle: 'The Lion City',
        image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=500&q=80',
      },
      {
        name: 'Dubai',
        subtitle: 'City of Gold',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&q=80',
      },
      {
        name: 'Switzerland',
        subtitle: 'Land of Alps',
        image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=500&q=80',
      },

    ],
  },
  {
    id: 'visafree',
    title: 'VISA FREE DESTINATIONS',
    items: [
      {
        name: 'Maldives',
        subtitle: 'Create Memories In',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&q=80',
      },
      {
        name: 'Seychelles',
        subtitle: 'The Charming Islands',
        image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=500&q=80',
      },
      {
        name: 'Malaysia',
        subtitle: 'The Hidden Gem of Asia',
        image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=500&q=80',
      },
      {
        name: 'Thailand',
        subtitle: 'The Kingdom Of',
        image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=500&q=80',
      },
      {
        name: 'Mauritius',
        subtitle: 'The Incredible Island',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
      },
      {
        name: 'Indonesia',
        subtitle: 'Archipelago of Wonders',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80',
      },
      {
        name: 'Nepal',
        subtitle: 'Roof of the World',
        image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&q=80',
      },
    ],
  },
];

function DestinationCard({ item }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/tours?search=${item.name}`}
      style={{ flexShrink: 0, width: 200, textDecoration: 'none', display: 'block' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 200,
          height: 210,
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-5px)' : 'none',
          // boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.28)' : '0 4px 16px rgba(0,0,0,0.16)',
          transition: 'all 0.35s ease',
        }}
      >
        {/* Background image */}
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.45s ease',
          }}
          loading="lazy"
        />

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.72) 100%)',
        }} />

        {/* Text — bottom left */}
        <div style={{
          position: 'absolute', bottom: 14, left: 12, right: 12,
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            margin: '0 0 2px',
            lineHeight: 1.3,
          }}>
            {item.subtitle}
          </p>
          <p style={{
            color: 'white',
            fontSize: item.name.length > 8 ? 20 : 24,
            fontWeight: 800,
            fontFamily: 'Poppins, sans-serif',
            margin: 0,
            lineHeight: 1.1,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            letterSpacing: item.name === 'Bali' ? 2 : 0,
          }}>
            {item.name}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function PopularDestinationRows() {
  const scrollRefs = useRef({});

  const scroll = (rowId, dir) => {
    const el = scrollRefs.current[rowId];
    if (el) el.scrollBy({ left: dir * 214, behavior: 'smooth' });
  };

  return (
    <section style={{ background: '#fff', padding: '52px 0 64px' }}>
      <div className='container' style={{ margin: '0 auto', padding: '0 24px' }}>
        {destinationRows.map((row) => (
          <div key={row.id} style={{ marginBottom: 52 }}>

            {/* Row header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <h2 style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 900,
                fontSize: 18,
                color: '#111827',
                margin: 0,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                {row.title}
              </h2>

              {/* Arrows */}
              <div style={{ display: 'flex', gap: 8 }}>
                {['‹', '›'].map((arrow, i) => (
                  <button
                    key={arrow}
                    onClick={() => scroll(row.id, i === 0 ? -1 : 1)}
                    style={{
                      width: 34, height: 34,
                      borderRadius: '50%',
                      border: '1.5px solid #d1d5db',
                      background: 'white',
                      color: '#374151',
                      fontSize: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      lineHeight: 1,
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                  >
                    {arrow}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards scroll */}
            <div
              ref={el => { scrollRefs.current[row.id] = el; }}
              style={{
                display: 'flex',
                gap: 14,
                overflowX: 'auto',
                paddingBottom: 4,
                paddingTop: '10px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {row.items.map((item, index) => (
                <DestinationCard key={item.name + index} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
