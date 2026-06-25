'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const DEFAULT_BANNERS = [
  '/images/banners/banner1.jpg',
  '/images/banners/banner2.jpg',
  '/images/banners/banner3.png'
];

export default function BannerCarousel({ banners = DEFAULT_BANNERS }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (banners.length <= 1) return;

    if (!isHovered) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 4000);
    }

    return () => clearInterval(timerRef.current);
  }, [banners.length, isHovered]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (!banners || banners.length === 0) return null;

  return (
    <div className="banner-carousel-section">
      <div 
        className="banner-carousel-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className="banner-carousel-track" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((src, idx) => (
            <div className="banner-slide" key={`banner-${idx}`}>
              <Image 
                src={src} 
                alt={`Banner ${idx + 1}`} 
                fill
                sizes="100vw"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                priority={idx === 0}
              />
            </div>
          ))}
        </div>

        {banners.length > 1 && (
          <>
            <button className="banner-btn prev" onClick={handlePrev} aria-label="Previous Banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="banner-btn next" onClick={handleNext} aria-label="Next Banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="banner-indicators">
              {banners.map((_, idx) => (
                <button 
                  key={`dot-${idx}`}
                  className={`banner-dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .banner-carousel-section {
          width: 100%;
          max-width: 1800px;
          margin: 40px auto;
          padding: 0 15px;
        }
        
        .banner-carousel-wrapper {
          position: relative;
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          height: 50vh;
        }

        @media (max-width: 768px) {
          .banner-carousel-wrapper {
            height: 40vh;
          }
          .banner-carousel-section {
            margin: 20px auto;
            padding: 0 10px;
          }
        }
        
        @media (max-width: 480px) {
          .banner-carousel-wrapper {
            height: 35vh;
          }
        }

        .banner-carousel-track {
          display: flex;
          height: 100%;
          width: 100%;
          transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .banner-slide {
          flex: 0 0 100%;
          height: 100%;
          position: relative;
        }

        .banner-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(4px);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1f2937;
          opacity: 0;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 10;
        }

        .banner-carousel-wrapper:hover .banner-btn {
          opacity: 1;
        }

        .banner-btn:hover {
          background: #fff;
          color: var(--color-primary, #026eb5);
        }

        .banner-btn.prev {
          left: 20px;
        }

        .banner-btn.next {
          right: 20px;
        }

        @media (max-width: 768px) {
          .banner-btn {
            width: 36px;
            height: 36px;
            opacity: 1; /* Always visible on mobile */
          }
          .banner-btn.prev { left: 10px; }
          .banner-btn.next { right: 10px; }
        }

        .banner-indicators {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .banner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .banner-dot.active {
          background: #fff;
          width: 24px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
