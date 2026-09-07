'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getMediaUrl } from '@/utils/api';

export default function GalleryClient({ pageData }) {
  const [activeIdx, setActiveIdx] = useState(null);

  const galleryBlock = pageData?.details?.find(d => d.key === 'our _travel_gallery');
  const galleryBlock2 = pageData?.details?.find(d => d.key === 'our _travel_gallery2');
  const centerSectionBlock = pageData?.details?.find(d => d.key === 'center_section');

  const heroTitle = galleryBlock?.title || pageData?.title || 'Our Travel Gallery';
  const heroDesc = galleryBlock?.json_data?.block_desc || galleryBlock?.description || pageData?.description || 'Explore our beautiful travel destinations and packages.';
  const heroBg = pageData?.feature_image ? getMediaUrl(pageData.feature_image) : 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1920&q=80';

  const masonryImages = galleryBlock?.json_data?.images || [];
  
  const ctaTitle = centerSectionBlock?.title || galleryBlock2?.description || galleryBlock2?.json_data?.block_desc || 'Best holiday package for you';
  const ctaDesc = centerSectionBlock?.description || heroDesc;
  const collageImages = galleryBlock2?.json_data?.images || [];
  const collageImage1 = collageImages[0]?.img ? getMediaUrl(collageImages[0].img) : 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=400&q=80';
  const collageImage2 = collageImages[1]?.img ? getMediaUrl(collageImages[1].img) : 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80';
  const testimonialTag = galleryBlock2?.title || 'Testimonial';
  const testimonialHeading = galleryBlock2?.description || 'Travel Agency provides beautiful Dream Place for you';
  const testimonialDesc = galleryBlock2?.json_data?.block_desc || 'Lorem ipsum dolor sit amet consectetur. Urna nibh sem morbi interdum habitant. Porttitor augue enim turpis maecenas et adipiscing. Dis ipsum vitae ultrices vulputate sem quis eu eu. Amet tincidunt est elementum.';

  // Build full list of all gallery media for lightbox navigation
  const allMediaList = useMemo(() => {
    const list = [];
    masonryImages.forEach((img, idx) => {
      const url = getMediaUrl(img.img);
      const isVideo = Boolean(url.match(/\.(mp4|webm|ogg|mov)$/i));
      list.push({ url, isVideo, alt: img.lbl || `Gallery image ${idx + 1}` });
    });
    if (collageImage2) {
      list.push({ url: collageImage2, isVideo: Boolean(collageImage2.match(/\.(mp4|webm|ogg|mov)$/i)), alt: 'Travel Destination' });
    }
    if (collageImage1) {
      list.push({ url: collageImage1, isVideo: Boolean(collageImage1.match(/\.(mp4|webm|ogg|mov)$/i)), alt: 'Travel Experience' });
    }
    return list;
  }, [masonryImages, collageImage1, collageImage2]);

  // Lock body scroll when popup is open
  useEffect(() => {
    if (activeIdx !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeIdx]);

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
  const handleKeyDown = useCallback((e) => {
    if (activeIdx === null) return;
    if (e.key === 'Escape') {
      setActiveIdx(null);
    } else if (e.key === 'ArrowLeft') {
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : allMediaList.length - 1));
    } else if (e.key === 'ArrowRight') {
      setActiveIdx((prev) => (prev < allMediaList.length - 1 ? prev + 1 : 0));
    }
  }, [activeIdx, allMediaList.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentMedia = activeIdx !== null ? allMediaList[activeIdx] : null;

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      
      {/* 1. Hero Section */}
      <section style={{
        position: 'relative',
        padding: '6rem 1rem',
        backgroundColor: 'var(--color-primary)',
        backgroundImage: `url("${heroBg}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: 'white',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, marginBottom: '1rem', fontFamily: 'var(--font-playfair), serif' }}>
            {heroTitle}
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            {heroDesc}
          </p>
        </div>
      </section>

      {/* 2. Masonry Grid Section */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          columnCount: 3,
          columnGap: '1.5rem',
        }} className="masonry-grid">
          <style dangerouslySetInnerHTML={{__html: `
            .masonry-grid { column-count: 3; column-gap: 1.5rem; }
            @media (max-width: 900px) { .masonry-grid { column-count: 2; } }
            @media (max-width: 600px) { .masonry-grid { column-count: 1; } }
            .masonry-item { 
              break-inside: avoid; 
              margin-bottom: 1.5rem; 
              border-radius: 0.75rem; 
              overflow: hidden; 
              position: relative; 
              cursor: pointer; 
              transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s ease; 
              background: #f8fafc;
            }
            .masonry-item:hover { 
              transform: translateY(-6px); 
              box-shadow: 0 16px 32px rgba(15, 23, 42, 0.15); 
            }
            .masonry-item .zoom-badge {
              position: absolute;
              bottom: 12px;
              right: 12px;
              background: rgba(15, 23, 42, 0.65);
              backdrop-filter: blur(6px);
              color: #ffffff;
              width: 34px;
              height: 34px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transform: scale(0.8);
              transition: all 0.25s ease;
              pointer-events: none;
            }
            .masonry-item:hover .zoom-badge {
              opacity: 1;
              transform: scale(1);
            }
          `}} />
          
          {masonryImages.map((img, idx) => {
            const url = getMediaUrl(img.img);
            const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
            return (
              <div 
                key={idx} 
                className="masonry-item"
                onClick={() => setActiveIdx(idx)}
                title="Click to view full image"
              >
                {isVideo ? (
                  <video 
                    src={url} 
                    playsInline
                    muted
                    style={{ width: '100%', display: 'block', height: 'auto', borderRadius: '0.75rem' }} 
                  />
                ) : (
                  <img 
                    src={url} 
                    alt={img.lbl || `Gallery image ${idx + 1}`} 
                    style={{ width: '100%', display: 'block', height: 'auto', borderRadius: '0.75rem' }} 
                  />
                )}
                <div className="zoom-badge" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Split Testimonial / Collage Section */}
      <section style={{ padding: '6rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          
          {/* Left Text */}
          <div>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '1rem' }}>
              {testimonialTag}
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2, marginBottom: '1.5rem', fontFamily: 'var(--font-playfair), serif' }}>
              {testimonialHeading}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '1.5rem', fontSize: '1rem' }}>
              {testimonialDesc}
            </p>
            <div style={{ display: 'flex', gap: '0.25rem', color: '#fbbf24', fontSize: '1.25rem' }}>
              {'★★★★★'.split('').map((star, i) => <span key={i}>{star}</span>)}
            </div>
          </div>

          {/* Right Collage */}
          <div style={{ position: 'relative', width: '100%' }}>
            
            {/* Background image/video (relative to expand container height) */}
            <div 
              onClick={() => setActiveIdx(masonryImages.length)}
              style={{ 
                position: 'relative',
                width: '75%',
                marginLeft: 'auto',
                zIndex: 1,
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Click to view full image"
            >
              {collageImage2.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <video src={collageImage2} playsInline style={{ width: '100%', display: 'block' }} />
              ) : (
                <img src={collageImage2} alt="Villa pool" style={{ width: '100%', display: 'block' }} />
              )}
            </div>

            {/* Foreground image (absolute to overlap) */}
            <div 
              onClick={() => setActiveIdx(masonryImages.length + 1)}
              style={{ 
                position: 'absolute', 
                bottom: '10%', 
                left: '0', 
                width: '55%', 
                zIndex: 2,
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Click to view full image"
            >
              {collageImage1.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <video src={collageImage1} playsInline style={{ width: '100%', display: 'block' }} />
              ) : (
                <img src={collageImage1} alt="Traveler" style={{ width: '100%', display: 'block' }} />
              )}
            </div>

          </div>
          
        </div>
      </section>

      {/* 4. Lightbox Pop-up Modal */}
      {currentMedia && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setActiveIdx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(5, 10, 20, 0.92)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Floating Close / Cross Button on top right */}
          <button
            type="button"
            onClick={() => setActiveIdx(null)}
            aria-label="Close preview"
            style={{
              position: 'fixed',
              top: '1.25rem',
              right: '1.25rem',
              zIndex: 1000002,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255, 255, 255, 0.5)',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>

          {/* Navigation Prev Button */}
          {allMediaList.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx((prev) => (prev > 0 ? prev - 1 : allMediaList.length - 1));
              }}
              aria-label="Previous image"
              style={{
                position: 'fixed',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000002,
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ❮
            </button>
          )}

          {/* Navigation Next Button */}
          {allMediaList.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx((prev) => (prev < allMediaList.length - 1 ? prev + 1 : 0));
              }}
              aria-label="Next image"
              style={{
                position: 'fixed',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000002,
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ❯
            </button>
          )}

          {/* Media Content Box */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: 'min(92vw, 1100px)',
              maxHeight: 'min(86vh, 850px)',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            {currentMedia.isVideo ? (
              <video
                src={currentMedia.url}
                controls
                autoPlay
                playsInline
                style={{
                  maxWidth: '100%',
                  maxHeight: 'min(82vh, 800px)',
                  display: 'block',
                  borderRadius: '12px',
                  outline: 'none',
                }}
              />
            ) : (
              <img
                src={currentMedia.url}
                alt={currentMedia.alt || 'Enlarged gallery view'}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'min(82vh, 800px)',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: '12px',
                  userSelect: 'none',
                }}
              />
            )}

            {currentMedia.alt && currentMedia.alt !== 'Travel Destination' && currentMedia.alt !== 'Travel Experience' && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                textAlign: 'center',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)'
              }}>
                {currentMedia.alt}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
