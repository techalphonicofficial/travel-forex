'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getHomeCategories, getMediaUrl } from '@/utils/api';

export default function CategoriesCarousel() {
  const scrollRef = useRef(null);
  const [canScroll, setCanScroll] = useState({ prev: false, next: true });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      try {
        const res = await getHomeCategories();
        if (mounted && Array.isArray(res)) {
          setCategories(res.map(c => ({
            id: c.id,
            label: c.name,
            image: c.slug === 'luxury' || String(c.name).toLowerCase() === 'luxury'
              ? '/luxury_transparent.png'
              : getMediaUrl(c.feature_image),
            slug: c.slug
          })));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCategories();
    return () => { mounted = false; };
  }, []);

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

  if (loading || categories.length === 0) return null;

  return (
    <section style={{ padding: '60px 0 0', background: 'transparent' }}>
      <style>{`
        .theme-card {
          flex: 0 0 auto;
          width: 340px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          overflow: hidden;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-card-hover);
          border-color: rgba(2, 110, 181, 0.3);
        }
        .theme-card-img {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-card:hover .theme-card-img {
          transform: scale(1.05);
        }
        .theme-card-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--color-text-primary);
          transition: color 0.3s ease;
        }
        .theme-card:hover .theme-card-title {
          color: var(--color-primary);
        }
        .nav-btn {
          width: 44px; height: 44px; 
          border-radius: 50%; 
          border: 1px solid var(--color-border); 
          background: var(--color-bg-card);
          display: flex; align-items: center; justify-content: center; 
          transition: all 0.3s ease;
          box-shadow: var(--shadow-xs);
        }
        .nav-btn:hover:not(:disabled) {
          background: var(--color-primary);
          color: #ffffff;
          border-color: var(--color-primary);
          transform: scale(1.05);
          box-shadow: var(--shadow-md);
        }
        .nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #f8fafc;
        }
      `}</style>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            Travel by Theme
          </h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => scroll(-1)}
              disabled={!canScroll.prev}
              className="nav-btn"
              style={{ cursor: canScroll.prev ? 'pointer' : 'not-allowed' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScroll.next}
              className="nav-btn"
              style={{ cursor: canScroll.next ? 'pointer' : 'not-allowed' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          style={{
            display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 24, scrollbarWidth: 'none', scrollBehavior: 'smooth',
            msOverflowStyle: 'none'
          }}
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/tours?category=${category.id}`}
              className="theme-card"
            >
              <div style={{ position: 'relative', width: '100%', height: 260, overflow: 'hidden' }}>
                <Image 
                  src={category.image} 
                  alt={category.label} 
                  fill 
                  style={{ objectFit: 'cover', objectPosition: 'top' }} 
                  className="theme-card-img"
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.05) 100%)' }} />
              </div>
              <div style={{ padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <h3 className="theme-card-title" style={{ marginBottom: 8 }}>
                  {category.label}
                </h3>
                <div style={{ width: 40, height: 3, background: 'var(--color-primary)', borderRadius: 2, opacity: 0.5, marginTop: 4 }}></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
