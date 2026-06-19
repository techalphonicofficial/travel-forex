/* GramSection Redesign */
'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { gramReels } from '@/data/gramReels';
import { getReviews, getMediaUrl } from '@/utils/api';

const FALLBACK_VIDEO_SOURCES = [
  'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/elephants.mp4',
  'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/sea_turtle.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
];

const getVideoType = (src) => {
  if (!src) return undefined;
  return src.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';
};

const getReviewVideoUrl = (review) => {
  const mediaUrl = review.media_url || review.mediaUrl || review.media?.url;
  const mediaType = review.media_type || review.mediaType || review.media?.type || '';
  const looksLikeVideo = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(mediaUrl || ''));
  const directVideo =
    review.video ||
    review.video_url ||
    review.videoUrl ||
    review.reel ||
    review.reel_url ||
    review.media_video;

  const video = directVideo || (/video/i.test(mediaType) || looksLikeVideo ? mediaUrl : '');
  return video ? getMediaUrl(video) : '';
};

function GramCard({ photo, index }) {
  const [hovered, setHovered] = useState(false);
  const videoSrc = photo.videoSrc || FALLBACK_VIDEO_SOURCES[index % FALLBACK_VIDEO_SOURCES.length];
  const posterSrc = photo.posterSrc || photo.src;

  return (
    <Link
      href={`/reels?idx=${index}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Play ${photo.title || photo.user || 'travel reel'}`}
      style={{
        flexShrink: 0,
        width: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        textDecoration: 'none',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Arched Image Container */}
      <div style={{
        width: '100%',
        height: 380,
        borderRadius: '110px 110px 16px 16px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: hovered ? '0 10px 30px rgba(255,255,255,0.05)' : 'none',
        transition: 'box-shadow 0.3s ease'
      }}>
        {videoSrc ? (
            <video
              key={`${videoSrc}-preview`}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              poster={posterSrc}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.5s ease',
                background: '#000',
              }}
            >
              <source src={videoSrc} type={getVideoType(videoSrc)} />
            </video>
        ) : (
          <img
            src={posterSrc}
            alt={photo.user}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.5s ease',
            }}
            loading="lazy"
          />
        )}
        {/* Play Icon overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.3s'
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', border: '2px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
          }}>
            <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <h4 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 8px', fontFamily: 'Poppins, sans-serif' }}>
          {photo.user} {photo.location} Holiday
        </h4>
        <div style={{ 
          background: '#1e293b', color: '#cbd5e1', fontSize: 10, fontWeight: 600,
          padding: '4px 12px', borderRadius: 12, display: 'inline-block'
        }}>
          {photo.location}
        </div>
      </div>
    </Link>
  );
}

export default function GramSection() {
  const scrollRef = useRef(null);
  const [reels, setReels] = useState(gramReels);

  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      const reviews = await getReviews();

      if (!mounted || !reviews.length) return;

      setReels(reviews.map((review, index) => {
        const fallback = gramReels[index % gramReels.length];
        const packageName = review.package?.name || review.title || fallback.tag;

        return {
          ...fallback,
          id: review.id ?? fallback.id,
          src: fallback.src,
          posterSrc: getMediaUrl(review.thumbnail || review.poster || review.image) || fallback.src,
          userAvatar: getMediaUrl(review.user_avatar),
          user: review.user_handle || review.user_name || fallback.user,
          likes: review.likes_count ? String(review.likes_count) : fallback.likes,
          caption: review.description || review.title || fallback.caption,
          location: review.location || fallback.location,
          title: review.title || packageName,
          description: review.description || fallback.description,
          videoSrc: getReviewVideoUrl(review) || fallback.videoSrc,
          tag: packageName,
          tour: review.package_id ? `/booking/${review.package_id}` : fallback.tour,
        };
      }));
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, []);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 500, behavior: 'smooth' });
  };

  return (
    <section style={{
      background: '#0a0a0a',
      padding: '80px 0 100px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 900,
            fontSize: 40, color: 'white', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 1
          }}>
            LOVE FROM THE GRAM
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
            {/* Google Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Google SVG */}
              <svg width="24" height="24" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  4.6<span style={{ fontSize: 10, color: '#9ca3af', marginRight: 4 }}>/5</span> 
                  <span style={{ color: '#fbbf24', fontSize: 14 }}>star</span>
                </div>
                <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 500, letterSpacing: 0.5 }}>8250 reviews</div>
              </div>
            </div>

            {/* Facebook Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Facebook Logo via SVG */}
              <div style={{ 
                width: 24, height: 24, background: '#1877f2', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  4.8<span style={{ fontSize: 10, color: '#9ca3af', marginRight: 4 }}>/5</span> 
                  <span style={{ color: '#fbbf24', fontSize: 14 }}>star</span>
                </div>
                <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 500, letterSpacing: 0.5 }}>1440 reviews</div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Section */}
        <div style={{ position: 'relative' }}>
          {/* Navigation Arrows */}
          <button 
            onClick={() => scroll(-1)}
            style={{ 
              position: 'absolute', left: 40, top: '45%', transform: 'translateY(-50%)', zIndex: 10,
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              color: '#111827', fontSize: 18, paddingBottom: 2
            }}
          >❮</button>

          <button 
            onClick={() => scroll(1)}
            style={{ 
              position: 'absolute', right: 40, top: '45%', transform: 'translateY(-50%)', zIndex: 10,
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              color: '#111827', fontSize: 18, paddingBottom: 2
            }}
          >❯</button>

          {/* Cards Wrapper */}
          <div
            ref={scrollRef}
            style={{
              display: 'flex', gap: 24, padding: '0 80px',
              overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
              scrollSnapType: 'x mandatory'
            }}
          >
            {reels.map((photo, i) => (
              <div key={i} style={{ scrollSnapAlign: 'start' }}>
                <GramCard
                  photo={photo}
                  index={i}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
