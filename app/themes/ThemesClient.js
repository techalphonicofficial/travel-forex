'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getHomeCategories, getMediaUrl } from '@/utils/api';

export default function ThemesClient() {
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

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
          Loading themes...
        </div>
      </div>
    );
  }

  return (
    <main style={{ padding: '120px 0 80px', background: 'linear-gradient(to bottom, #f8fafc, #ffffff)', minHeight: '100vh' }}>
      <style>{`
        .themes-page-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 40px;
        }

        .theme-card-full {
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 24px;
          height: 320px;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          position: relative;
        }

        .theme-card-full:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .theme-card-img-wrap {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .theme-card-img {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .theme-card-full:hover .theme-card-img {
          transform: scale(1.05);
        }

        .theme-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%);
          z-index: 2;
        }

        .theme-content {
          position: relative;
          z-index: 3;
        }

        .theme-title {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          text-transform: uppercase;
          line-height: 1.2;
          margin-bottom: 6px;
        }

        .theme-subtitle {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#0f172a', marginBottom: '16px', letterSpacing: '-1px' }}>
            Explore All Themes
          </h1>
          <p style={{ fontSize: '18px', color: '#64748b', lineHeight: 1.6 }}>
            Discover our complete collection of hand-picked holiday styles. Whether you're looking for a relaxing beach getaway, an adventurous trek, or a luxurious honeymoon, we have the perfect theme for you.
          </p>
        </div>

        <div className="themes-page-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/tours?category=${category.id}`}
              className="theme-card-full"
            >
              <div className="theme-card-img-wrap">
                <Image 
                  src={category.image} 
                  alt={category.label} 
                  fill 
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  style={{ objectFit: 'cover', objectPosition: 'top' }} 
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
    </main>
  );
}
