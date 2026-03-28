'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';

const destinations = [
  { name: 'Vietnam', subtitle: 'LAND OF ASCENDING DRAGON', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=500&q=80' },
  { name: 'Bali', subtitle: 'CULTURAL PARADISE', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&q=80' },
  { name: 'Thailand', subtitle: 'THE KINGDOM OF', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=500&q=80' },
  { name: 'Japan', subtitle: 'LAND OF RISING SUN', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80' },
  { name: 'Maldives', subtitle: 'CREATE MEMORIES IN', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&q=80' },
  { name: 'Australia', subtitle: 'LAND OF DOWN UNDER', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=500&q=80' },
  { name: 'Singapore', subtitle: 'THE LION CITY', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=500&q=80' },
  { name: 'New Zealand', subtitle: 'THE ADVENTURE CAPITAL', image: 'https://images.unsplash.com/photo-1469521669194-b785a2711eca?w=500&q=80' },
];

export default function DestinationPicker({ onPick }) {
  const scrollRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const scrollBy = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 400, behavior: 'smooth' });
    }
  };

  const renderCardContent = (dest, index) => {
    const isHovered = hoveredIndex === index;

    return (
      <div style={{ position: 'relative', width: '100%', paddingBottom: '40px' }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}>

        <div style={{
          height: '300px',
          borderRadius: '150px 150px 10px 10px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: isHovered ? '0 30px 60px rgba(0,0,0,0.3)' : '0 20px 40px rgba(0,0,0,0.15)',
          transition: 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
          transform: isHovered ? 'scale(1.05) translateY(-20px)' : 'scale(1) translateY(0)',
          zIndex: isHovered ? 10 : 1
        }}>
          <img
            src={dest.image}
            alt={dest.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.8s ease'
            }}
          />
          {/* Heavy Bottom Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 30%, transparent 60%)'
          }} />
          {/* Info */}
          <div style={{ position: 'absolute', bottom: '24px', width: '100%', textAlign: 'center', padding: '0 10px' }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', margin: '0 0 4px', textTransform: 'uppercase' }}>
              {dest.subtitle}
            </p>
            <h3 style={{
              color: 'white',
              fontSize: '26px',
              fontWeight: 700,
              margin: 0,
              fontFamily: "'Playfair Display', serif"
            }}>
              {dest.name}
            </h3>
          </div>
        </div>

        {/* Hover Badges Block */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            background: '#ffebf0',
            color: '#e11d48',
            fontSize: '8px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase'
          }}>In Season</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#6b7280', fontSize: '9px', fontWeight: 600 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Booked 4 hr ago</span>
          </div>
        </div>

      </div>
    );
  };

  return (
    <section style={{
      padding: '40px 0 60px',
      background: '#fff',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      {/* World Map Background Icon (Faint) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120%',
        opacity: 0.04,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/e/ec/World_Map_Blank_Draft5.svg" alt="World Map" style={{ width: '100%' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Heading & Search - Inside Container */}
        <div className="container" style={{ maxWidth: '1400px', marginBottom: '40px' }}>
          <div className="text-center">
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', fontFamily: "'Poppins', sans-serif" }}>
              What's <span style={{ color: '#026eb5', fontStyle: 'italic', fontWeight: 500 }}> your pick </span> for your next vacation
            </h2>

            <div className="mx-auto mt-4" style={{ maxWidth: '620px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Pick your destination"
                style={{
                  width: '100%',
                  padding: '18px 24px 18px 60px',
                  borderRadius: '50px',
                  border: '1.5px solid #f59e0b',
                  fontSize: '16px',
                  outline: 'none',
                  background: 'white',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.08)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Full-Width Slider Area */}
        <div style={{ position: 'relative' }}>

          {/* Controls - Floating (Kept within 1400px bounds if possible visually) */}
          <div className="container" style={{ maxWidth: '1400px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', height: '100%', pointerEvents: 'none', zIndex: 20 }}>
            <button
              onClick={() => scrollBy(-1)}
              style={{
                position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%', background: 'white',
                border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            <button
              onClick={() => scrollBy(1)}
              style={{
                position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%', background: 'white',
                border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              padding: '60px 0 50px', // Increased top padding to 60px to prevent clipping
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
            }}
            className="hide-scrollbar"
          >
            {/* Invisble spacers to center initial/final items if needed, or just let it flow */}
            <div style={{ flex: '0 0 calc((100vw - 1400px) / 2)', minWidth: 40 }} />

            {destinations.map((dest, i) => (
              <div key={i} style={{
                flex: '0 0 auto',
                width: '240px',
                scrollSnapAlign: 'center'
              }}>
                {onPick ? (
                  <div onClick={() => onPick(dest.name)} style={{ cursor: 'pointer' }}>
                    {renderCardContent(dest, i)}
                  </div>
                ) : (
                  <Link href={`/tours?search=${dest.name}`} style={{ textDecoration: 'none' }}>
                    {renderCardContent(dest, i)}
                  </Link>
                )}
              </div>
            ))}

            <div style={{ flex: '0 0 calc((100vw - 1400px) / 2)', minWidth: 40 }} />
          </div>
        </div>

      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        section :global(.container) {
          overflow: visible;
        }
      `}</style>
    </section>
  );
}
