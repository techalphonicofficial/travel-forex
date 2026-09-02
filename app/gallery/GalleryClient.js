'use client';

import React from 'react';
import { getMediaUrl } from '@/utils/api';

export default function GalleryClient({ pageData }) {
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
            .masonry-item { break-inside: avoid; margin-bottom: 1.5rem; border-radius: 0.5rem; overflow: hidden; position: relative; transition: transform 0.3s ease; }
            .masonry-item:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          `}} />
          
          {masonryImages.map((img, idx) => {
            const url = getMediaUrl(img.img);
            const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
            return (
              <div key={idx} className="masonry-item">
                {isVideo ? (
                  <video 
                    src={url} 
                    controls 
                    playsInline
                    style={{ width: '100%', display: 'block', height: 'auto', borderRadius: '0.5rem' }} 
                  />
                ) : (
                  <img 
                    src={url} 
                    alt={img.lbl || `Gallery image ${idx + 1}`} 
                    style={{ width: '100%', display: 'block', height: 'auto', borderRadius: '0.5rem' }} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>


      {/* 4. Split Testimonial / Collage Section */}
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
            <div style={{ 
              position: 'relative',
              width: '75%',
              marginLeft: 'auto',
              zIndex: 1,
              borderRadius: '0.5rem',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}>
              {collageImage2.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <video src={collageImage2} controls playsInline style={{ width: '100%', display: 'block' }} />
              ) : (
                <img src={collageImage2} alt="Villa pool" style={{ width: '100%', display: 'block' }} />
              )}
            </div>

            {/* Foreground image (absolute to overlap) */}
            <div style={{ 
              position: 'absolute', 
              bottom: '10%', 
              left: '0', 
              width: '55%', 
              zIndex: 2,
              borderRadius: '0.5rem',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
              {collageImage1.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <video src={collageImage1} controls playsInline style={{ width: '100%', display: 'block' }} />
              ) : (
                <img src={collageImage1} alt="Traveler" style={{ width: '100%', display: 'block' }} />
              )}
            </div>

          </div>
          
        </div>
      </section>

    </div>
  );
}
