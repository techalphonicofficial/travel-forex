'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const skeletonCards = Array.from({ length: 6 }, (_, index) => index);

export default function DestinationPicker({ onPick, destinations: apiDestinations = [], loading = false, error = '' }) {
  const scrollRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [search, setSearch] = useState('');
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });
  const visibleDestinations = useMemo(() => {
    const rows = Array.isArray(apiDestinations) ? apiDestinations : [];
    const query = search.trim().toLowerCase();

    if (!query) return rows;

    return rows.filter((dest) => (
      String(dest.name || '').toLowerCase().includes(query) ||
      String(dest.subtitle || '').toLowerCase().includes(query) ||
      String(dest.type || '').toLowerCase().includes(query) ||
      String(dest.categories || '').toLowerCase().includes(query)
    ));
  }, [apiDestinations, search]);

  const updateScrollState = useCallback(() => {
    const row = scrollRef.current;
    if (!row) return;

    const maxLeft = Math.max(0, row.scrollWidth - row.clientWidth);
    setCanScroll({
      prev: row.scrollLeft > 4,
      next: row.scrollLeft < maxLeft - 4,
    });
  }, []);

  const scrollBy = (direction) => {
    const row = scrollRef.current;
    if (!row) return;

    const maxLeft = Math.max(0, row.scrollWidth - row.clientWidth);
    if (maxLeft <= 0) {
      updateScrollState();
      return;
    }

    const card = row.querySelector('.destination-scroll-card');
    const cardWidth = card ? card.getBoundingClientRect().width + 24 : 300;
    const distance = Math.max(cardWidth * 2, row.clientWidth * 0.68);
    const nextLeft = Math.max(0, Math.min(row.scrollLeft + (direction * distance), maxLeft));

    row.scrollTo({ left: nextLeft, behavior: 'smooth' });
    window.setTimeout(updateScrollState, 360);
  };

  useEffect(() => {
    const row = scrollRef.current;
    if (!row) return undefined;

    updateScrollState();
    row.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      row.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, visibleDestinations.length, loading, error]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateScrollState);
    const timer = window.setTimeout(updateScrollState, 250);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [updateScrollState, visibleDestinations.length, search]);

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
          {dest.image ? (
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
          ) : (
            <div className="destination-image-missing" aria-hidden="true" />
          )}
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
      width: '100%',
      maxWidth: '100vw',
      minWidth: 0
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
              What&apos;s <span style={{ color: 'var(--color-primary)', fontStyle: 'italic', fontWeight: 500 }}> your pick </span> for your next vacation
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
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={!canScroll.prev}
              style={{
                position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%', background: 'white',
                border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', cursor: canScroll.prev ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto',
                opacity: canScroll.prev ? 1 : 0.38
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={!canScroll.next}
              style={{
                position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%', background: 'white',
                border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', cursor: canScroll.next ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto',
                opacity: canScroll.next ? 1 : 0.38
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
              overflowY: 'visible',
              width: '100%',
              maxWidth: '100vw',
              minWidth: 0,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              padding: '60px 0 50px', // Increased top padding to 60px to prevent clipping
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
            }}
            className="hide-scrollbar"
            onWheel={(event) => {
              if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
              event.preventDefault();
              event.currentTarget.scrollLeft += event.deltaY;
              window.requestAnimationFrame(updateScrollState);
            }}
          >
            {/* Invisble spacers to center initial/final items if needed, or just let it flow */}
            <div style={{ flex: '0 0 calc((100vw - 1400px) / 2)', minWidth: 40 }} />

            {loading ? skeletonCards.map((item) => (
              <div key={`destination-skeleton-${item}`} className="destination-scroll-card destination-skeleton-card">
                <span className="destination-skeleton-arch" />
                <span className="destination-skeleton-line is-short" />
                <span className="destination-skeleton-line" />
              </div>
            )) : error ? (
              <div style={{ padding: '40px 24px', color: '#b91c1c', fontWeight: 800 }}>
                {error}
              </div>
            ) : visibleDestinations.length ? visibleDestinations.map((dest, i) => (
              <div key={dest.id || dest.slug || dest.name || i} className="destination-scroll-card" style={{
                flex: '0 0 auto',
                width: '240px',
                scrollSnapAlign: 'center'
              }}>
                {onPick ? (
                  <button
                    type="button"
                    onClick={() => onPick(dest.name)}
                    style={{ width: '100%', border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'inherit' }}
                  >
                    {renderCardContent(dest, i)}
                  </button>
                ) : (
                  <Link href={`/tour?search=${dest.name}`} style={{ textDecoration: 'none' }}>
                    {renderCardContent(dest, i)}
                  </Link>
                )}
              </div>
            )) : (
              <div style={{ padding: '40px 24px', color: '#6b7280', fontWeight: 800 }}>
                No destinations found.
              </div>
            )}

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
        .destination-image-missing {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #dbeafe 0%, #ecfeff 52%, #f8fafc 100%);
        }
        .destination-skeleton-card {
          flex: 0 0 auto;
          width: 240px;
          scroll-snap-align: center;
          padding-bottom: 40px;
        }
        .destination-skeleton-arch,
        .destination-skeleton-line {
          position: relative;
          display: block;
          overflow: hidden;
          background: #e5e7eb;
        }
        .destination-skeleton-arch {
          height: 300px;
          border-radius: 150px 150px 10px 10px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
        }
        .destination-skeleton-line {
          width: 74%;
          height: 14px;
          margin: 18px auto 0;
          border-radius: 999px;
        }
        .destination-skeleton-line.is-short {
          width: 46%;
          height: 10px;
          margin-top: 16px;
        }
        .destination-skeleton-arch::after,
        .destination-skeleton-line::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.72), transparent);
          animation: destinationSkeleton 1.25s infinite;
        }
        @keyframes destinationSkeleton {
          to { transform: translateX(100%); }
        }
        section :global(.container) {
          overflow: visible;
        }
      `}</style>
    </section>
  );
}
