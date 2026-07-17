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
            image: getMediaUrl(c.feature_image) || '/images/banners/banner1.png',
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

  const bentoItems = categories.slice(0, 7);
  const total = bentoItems.length;

  const getBentoClass = (index, total) => {
    if (total === 1) return 'span-12';
    if (total === 2) return 'span-6';
    if (total === 3) return 'span-4';
    if (total === 4) return 'span-6';
    if (total === 5) return index < 2 ? 'span-6' : 'span-4';
    if (total === 6) return (index === 0 || index === 5) ? 'span-6' : 'span-3';
    if (total === 7) return index === 0 ? 'span-6' : 'span-3';
    return 'span-4';
  };

  return (
    <section className="CategoriesSection" style={{ background: 'transparent' }}>
      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
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

        .view-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: var(--color-primary);
          text-decoration: none;
          background: white;
          padding: 12px 28px;
          border-radius: 999px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .view-all-btn:hover {
          background: var(--color-primary);
          color: white;
          transform: scale(1.05);
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }

        .view-all-btn svg {
          transition: transform 0.3s ease;
        }

        .view-all-btn:hover svg {
          transform: translateX(4px);
        }
        
        .span-12 { grid-column: span 12; height: 320px; }
        .span-6 { grid-column: span 6; height: 260px; }
        .span-4 { grid-column: span 4; height: 260px; }
        .span-3 { grid-column: span 3; height: 260px; }
        
        .bento-card-img-wrap { position: absolute; inset: 0; z-index: 1; }
        .bento-card-img { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .bento-card:hover .bento-card-img { transform: scale(1.05); }
        .bento-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%); z-index: 2; }
        .bento-content { position: relative; z-index: 3; display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; height: 100%; width: 100%; }
        .bento-title { font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.2; margin-bottom: 6px; }
        .bento-subtitle { font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 0.5px; }

        @media (max-width: 1024px) {
          .span-12 { grid-column: span 12; height: 300px; }
          .span-6, .span-4, .span-3 { grid-column: span 6; height: 260px; }
        }

        @media (max-width: 640px) {
          .bento-grid { gap: 12px; }
          .span-12, .span-6, .span-4, .span-3 { grid-column: span 12; height: 220px; }
        }
      `}</style>
      
      <div className="container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30, textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            Travel by Theme
          </h2>
          <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)', fontSize: 16 }}>
            Explore our hand-picked holiday collections.
          </p>
        </div>

        <div className="bento-grid">
          {bentoItems.map((category, index) => {
            const cardClass = getBentoClass(index, total);
            return (
              <Link key={category.id} href={`/tours?category=${category.slug || category.id}`} className={`bento-card ${cardClass}`}>
                <div className="bento-card-img-wrap">
                  <Image src={category.image} alt={category.label} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover', objectPosition: 'top' }} className="bento-card-img" />
                  <div className="bento-overlay" />
                </div>
                <div className="bento-content">
                  <h3 className="bento-title">{category.label}</h3>
                  <div className="bento-subtitle">Theme Collection</div>
                </div>
              </Link>
            );
          })}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
          <Link href="/themes" className="view-all-btn">
            View All Themes
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
