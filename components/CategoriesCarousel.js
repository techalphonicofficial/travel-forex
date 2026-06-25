'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getHomeCategories, getMediaUrl } from '@/utils/api';

export default function CategoriesCarousel() {
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

  if (loading || categories.length === 0) return null;

  const bentoItems = categories.slice(0, 6);

  return (
    <section style={{ padding: '60px 0', background: 'transparent' }}>
      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          width: 100%;
        }
        
        .bento-card {
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          display: flex;
          position: relative;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .bento-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.2);
        }
        
        .bento-card-large {
          grid-column: span 2;
          height: 320px;
        }
        
        .bento-card-small {
          grid-column: span 1;
          height: 320px;
        }
        
        .bento-card-img-wrap {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .bento-card-img {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .bento-card:hover .bento-card-img {
          transform: scale(1.05);
        }

        .bento-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%);
          z-index: 2;
        }

        .bento-content {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 24px;
          height: 100%;
          width: 100%;
        }

        .bento-title {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.2;
          margin-bottom: 6px;
        }
        
        .bento-card-small .bento-title {
          font-size: 20px;
        }
        
        .bento-subtitle {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 1024px) {
          .bento-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .bento-card-large, .bento-card-small {
            grid-column: span 1;
            height: 280px;
          }
        }

        @media (max-width: 640px) {
          .bento-grid {
            grid-template-columns: 1fr;
          }
          .bento-card-large, .bento-card-small {
            height: 240px;
          }
        }
      `}</style>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
              Travel by Theme
            </h2>
            <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)', fontSize: 16 }}>
              Explore our hand-picked holiday collections.
            </p>
          </div>
          <Link href="/themes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', background: 'white', padding: '10px 20px', borderRadius: 999, boxShadow: 'var(--shadow-sm)' }}>
            View All Themes
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        <div className="bento-grid">
          {bentoItems.map((category, index) => {
            const isLarge = index === 0 || index === 5;
            const cardClass = isLarge ? 'bento-card-large' : 'bento-card-small';

            return (
              <Link
                key={category.id}
                href={`/tours?category=${category.id}`}
                className={`bento-card ${cardClass}`}
              >
                <div className="bento-card-img-wrap">
                  <Image 
                    src={category.image} 
                    alt={category.label} 
                    fill 
                    style={{ objectFit: 'cover', objectPosition: 'top' }} 
                    className="bento-card-img"
                  />
                  <div className="bento-overlay" />
                </div>
                <div className="bento-content">
                  <h3 className="bento-title">
                    {category.label}
                  </h3>
                  <div className="bento-subtitle">Theme Collection</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

