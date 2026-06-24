'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const mockOffers = [
  {
    id: 1,
    title: 'Flat 10% Off on International Flights',
    code: 'INTL10',
    validity: 'Valid till 30th Nov',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80',
    tag: 'Flight Offer',
  },
  {
    id: 2,
    title: 'Up to ₹5,000 Cashback with HDFC Cards',
    code: 'HDFC5K',
    validity: 'Valid till 15th Dec',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=80',
    tag: 'Bank Offer',
  },
  {
    id: 3,
    title: 'Zero Convenience Fee on Domestic Hotels',
    code: 'ZEROFEE',
    validity: 'Valid till 31st Oct',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
    tag: 'Hotel Offer',
  },
  {
    id: 4,
    title: 'Get 5% Extra Forex on Forex Cards',
    code: 'FOREX5',
    validity: 'Valid on Forex Cards',
    image: 'https://images.unsplash.com/photo-1580519542036-ed4768589f46?w=500&q=80',
    tag: 'Forex Offer',
  },
];

export default function OffersCarousel() {
  const scrollRef = useRef(null);
  const [canScroll, setCanScroll] = useState({ prev: false, next: true });

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScroll({
        prev: scrollLeft > 0,
        next: scrollLeft < scrollWidth - clientWidth - 10,
      });
    }
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: direction * amount, behavior: 'smooth' });
      setTimeout(updateScrollState, 300);
    }
  };

  return (
    <section style={{ padding: '60px 0', background: 'transparent' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Exclusive Offers
          </h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => scroll(-1)}
              disabled={!canScroll.prev}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canScroll.prev ? 'pointer' : 'not-allowed',
                opacity: canScroll.prev ? 1 : 0.5, transition: 'all 0.2s',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScroll.next}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canScroll.next ? 'pointer' : 'not-allowed',
                opacity: canScroll.next ? 1 : 0.5, transition: 'all 0.2s',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          style={{
            display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none', scrollBehavior: 'smooth',
            msOverflowStyle: 'none'
          }}
        >
          {mockOffers.map((offer) => (
            <div
              key={offer.id}
              style={{
                flex: '0 0 auto', width: 340, background: 'var(--color-bg-card)', border: `1px solid var(--color-border)`,
                borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ position: 'relative', width: '100%', height: 140 }}>
                <Image src={offer.image} alt={offer.title} fill style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {offer.tag}
                </div>
              </div>
              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16, lineHeight: 1.4 }}>
                  {offer.title}
                </h3>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {offer.validity}
                    </div>
                    <div style={{ border: '1px dashed var(--color-text-primary)', padding: '6px 12px', borderRadius: 8, fontWeight: 800, fontSize: 13, color: 'var(--color-primary)', background: 'rgba(255,255,255,0.3)', display: 'inline-block' }}>
                      USE CODE: {offer.code}
                    </div>
                  </div>
                  <button style={{ background: 'var(--color-primary)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.9} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
