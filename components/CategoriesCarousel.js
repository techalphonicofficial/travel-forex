'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPackageCategories, getMediaUrl } from '@/utils/api';

export default function CategoriesCarousel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      try {
        const res = await getPackageCategories();
        if (mounted && Array.isArray(res)) {
          setCategories(res.map(c => ({
            id: c.id,
            label: c.title,
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

  // Duplicate items to ensure smooth infinite scrolling
  const marqueeItems = [...categories, ...categories, ...categories, ...categories];

  return (
    <section className="CategoriesSection" style={{ background: 'transparent', padding: '40px 0', overflow: 'hidden' }}>
      <style>{`
        .marquee-wrapper {
          position: relative;
          width: 100vw;
          margin-left: calc(-50vw + 50%);
          margin-right: calc(-50vw + 50%);
          overflow: hidden;
          padding: 20px 0 40px;
        }
        
        .marquee-track {
          display: flex;
          gap: 24px;
          width: max-content;
          animation: marquee 30s linear infinite;
        }

        .marquee-wrapper:hover .marquee-track {
          animation-play-state: paused;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-50% - 12px));
          }
        }
        
        .theme-card {
          width: 360px;
          height: 260px;
          border-radius: 24px;
          overflow: hidden;
          text-decoration: none;
          display: flex;
          position: relative;
          flex-shrink: 0;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
        
        .theme-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          z-index: 10;
        }

        .theme-card-img-wrap { 
          position: absolute; 
          inset: 0; 
          z-index: 1; 
        }
        
        .theme-card-img { 
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        
        .theme-card:hover .theme-card-img { 
          transform: scale(1.1); 
        }
        
        .theme-overlay { 
          position: absolute; 
          inset: 0; 
          background: linear-gradient(to top, rgba(15, 58, 117, 0.95) 0%, rgba(15, 58, 117, 0.4) 40%, rgba(0,0,0,0) 100%); 
          z-index: 2; 
        }
        
        .theme-content { 
          position: relative; 
          z-index: 3; 
          display: flex; 
          flex-direction: column; 
          justify-content: flex-end; 
          padding: 28px; 
          height: 100%; 
          width: 100%; 
        }
        
        .theme-title { 
          font-size: 26px; 
          font-weight: 800; 
          color: #ffffff; 
          line-height: 1.2; 
          margin-bottom: 8px; 
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .theme-subtitle { 
          font-size: 13px; 
          font-weight: 700; 
          color: rgba(255, 255, 255, 0.9); 
          text-transform: uppercase; 
          letter-spacing: 1px; 
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .theme-subtitle::before {
          content: "";
          display: block;
          width: 24px;
          height: 2px;
          background: #3b82f6;
          border-radius: 2px;
        }

        .view-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: #ffffff;
          text-decoration: none;
          background: #0f3a75;
          padding: 14px 32px;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(15, 58, 117, 0.2);
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .view-all-btn:hover {
          background: #0c2d5c;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15, 58, 117, 0.3);
        }

        .view-all-btn svg {
          transition: transform 0.3s ease;
        }

        .view-all-btn:hover svg {
          transform: translateX(4px);
        }

        @media (max-width: 768px) {
          .theme-card {
            width: 280px;
            height: 340px;
          }
          .theme-title { font-size: 22px; }
        }
      `}</style>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            Travel by Theme
          </h2>
          <p style={{ margin: '12px 0 0', color: 'var(--color-text-secondary)', fontSize: 17, maxWidth: 500 }}>
            Explore our hand-picked holiday collections and find the perfect getaway tailored for you.
          </p>
        </div>
      </div>

      <div className="marquee-wrapper">
        <div className="marquee-track">
          {marqueeItems.map((category, index) => (
            <Link key={`${category.id}-${index}`} href={`/tours?category=${category.slug || category.id}`} className="theme-card">
              <div className="theme-card-img-wrap">
                <Image 
                  src={category.image} 
                  alt={category.label} 
                  fill 
                  sizes="(max-width: 768px) 280px, 360px" 
                  style={{ objectFit: 'cover', objectPosition: 'center' }} 
                  className="theme-card-img" 
                />
                <div className="theme-overlay" />
              </div>
              <div className="theme-content">
                <h3 className="theme-title">{category.label}</h3>
                <div className="theme-subtitle">Theme Collection</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
          <Link href="/themes" className="view-all-btn">
            View All Themes
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
