'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getHomeCategories, getHomePage, getMediaUrl } from '@/utils/api';

/*
  CORS-safe video sources from Google's public CDN
  With beautiful travel poster images shown instantly while video loads
*/
const VIDEO_SOURCES = [
  {
    src: 'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/elephants.mp4',
    poster: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=85',
  },
  {
    src: 'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/sea_turtle.mp4',
    poster: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=85',
  },
  {
    src: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    poster: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=85',
  },
  {
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    poster: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1920&q=85',
  },
];

const travelerTypes = [
  { id: 'couple', label: 'Couple', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&q=80' },
  { id: 'family', label: 'Family', image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=300&q=80' },
  { id: 'friends', label: 'Friends', image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=300&q=80' },
  { id: 'solo', label: 'Solo', image: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=300&q=80' },
];

const getFallbackCategoryImage = (name) => {
  const match = travelerTypes.find((item) => item.label.toLowerCase() === String(name || '').toLowerCase());
  return match?.image || travelerTypes[0].image;
};

const getHomeSection = (page, key, section) => {
  return page?.details?.find((item) => item.key === key || item.section === section);
};

const getVideoType = (src) => {
  return src?.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';
};

const getLocationLabel = (location) => {
  return location?.label || [location?.name, location?.country_name].filter(Boolean).join(', ') || '';
};

const getLocationMeta = (location) => {
  if (location?.type === 'country') return 'Country';
  return location?.country_name || 'City';
};

const DEFAULT_CUSTOMIZE_ROOMS = [
  {
    id: 1,
    adults: 2,
    children: 0,
    childAges: [],
  },
];

const getCategoryHref = ({ label, destination }) => {
  const params = new URLSearchParams();
  const traveller = String(label || '').trim();
  const selectedDestination = String(destination || '').trim();

  params.set('step', selectedDestination ? '1' : '0');
  params.set('subStep', 'room-config');
  if (selectedDestination) params.set('dest', selectedDestination);
  if (traveller) params.set('traveller', traveller);
  params.set('rooms', JSON.stringify(DEFAULT_CUSTOMIZE_ROOMS));

  return `/customize?${params.toString()}`;
};

export default function HomeHero() {
  const router = useRouter();
  const videoRef = useRef(null);
  const travellerRowRef = useRef(null);
  const [vidIdx, setVidIdx] = useState(0);
  const [activeTraveler, setActiveTraveler] = useState(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [heroHeight, setHeroHeight] = useState('50vh');
  const [isMobile, setIsMobile] = useState(false);
  const [videos, setVideos] = useState(VIDEO_SOURCES);
  const [homeTravelerTypes, setHomeTravelerTypes] = useState([]);
  const [homeCategoriesLoading, setHomeCategoriesLoading] = useState(true);
  const [canScrollCategories, setCanScrollCategories] = useState({ prev: false, next: false });
  const [heroMediaType, setHeroMediaType] = useState('video'); // 'video' | 'image'
  const [carouselImages, setCarouselImages] = useState([]);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const updateCategoryScrollState = useCallback(() => {
    const row = travellerRowRef.current;
    if (!row) return;

    const maxScrollLeft = Math.max(0, row.scrollWidth - row.clientWidth);
    setCanScrollCategories({
      prev: row.scrollLeft > 4,
      next: row.scrollLeft < maxScrollLeft - 4,
    });
  }, []);

  /* Handle dynamic hero height for responsive devices */
  useEffect(() => {
    const updateHeight = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 767);
      if (w <= 767) {         // Mobile
        setHeroHeight('85svh');
      } else {                // Desktop/Tablet
        setHeroHeight('85vh');
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Auto-play image carousel
  useEffect(() => {
    if (heroMediaType !== 'image' || carouselImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImgIdx((idx) => (idx + 1) % carouselImages.length);
    }, 4500); // 4.5 seconds per slide

    return () => clearInterval(timer);
  }, [heroMediaType, carouselImages.length]);

  useEffect(() => {
    let mounted = true;

    const loadHomeHero = async () => {
      const [page, categories] = await Promise.all([
        getHomePage(),
        getHomeCategories(),
      ]);

      if (!mounted) return;

      const header = getHomeSection(page, 'header_key', 'image_text');
      const mediaUrl = getMediaUrl(header?.json_data?.media_url || header?.image);

      if (mediaUrl) {
        const isVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(mediaUrl);
        if (isVideo) {
          setHeroMediaType('video');
          setVideos([{ src: mediaUrl, poster: getMediaUrl(page?.feature_image) || VIDEO_SOURCES[0].poster }]);
          setVidIdx(0);
        } else {
          setHeroMediaType('image');
          setCarouselImages([
            mediaUrl,
            'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=85',
            'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=85',
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=85',
            'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1920&q=85',
          ]);
          setCurrentImgIdx(0);
        }
      } else {
        setHeroMediaType('video');
        setVideos(VIDEO_SOURCES);
        setVidIdx(0);
      }

      if (categories?.length) {
        setHomeTravelerTypes(
          categories
            .slice()
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((category) => ({
              id: category.id || category.slug || category.name?.toLowerCase(),
              slug: category.slug,
              label: category.name,
              image: (category.slug === 'luxury' || String(category.name).toLowerCase() === 'luxury')
                ? '/luxury_transparent.png'
                : (getMediaUrl(category.feature_image) || getFallbackCategoryImage(category.name)),
              alt: category.feature_image_alt || category.name,
              category,
            }))
        );
      } else {
        setHomeTravelerTypes([]);
      }

      setHomeCategoriesLoading(false);
    };

    loadHomeHero().catch((error) => {
      console.warn('Home hero API unavailable:', error?.message || error);
      if (mounted) {
        setHomeTravelerTypes([]);
        setHomeCategoriesLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    updateCategoryScrollState();
  }, [homeTravelerTypes, updateCategoryScrollState]);

  useEffect(() => {
    const row = travellerRowRef.current;
    if (!row) return;

    row.addEventListener('scroll', updateCategoryScrollState, { passive: true });
    window.addEventListener('resize', updateCategoryScrollState);
    updateCategoryScrollState();

    return () => {
      row.removeEventListener('scroll', updateCategoryScrollState);
      window.removeEventListener('resize', updateCategoryScrollState);
    };
  }, [homeTravelerTypes, updateCategoryScrollState]);

  const scrollTravellerRow = (direction) => {
    const row = travellerRowRef.current;
    if (!row) return;

    const cards = Array.from(row.querySelectorAll('.traveller-option'));
    if (!cards.length) return;

    const currentLeft = row.scrollLeft;
    const maxLeft = Math.max(0, row.scrollWidth - row.clientWidth);
    if (maxLeft <= 0) {
      updateCategoryScrollState();
      return;
    }

    const scrollAmount = Math.max(row.clientWidth * 0.72, 260);
    const targetLeft = currentLeft + (direction * scrollAmount);

    row.scrollTo({
      left: Math.max(0, Math.min(targetLeft, maxLeft)),
      behavior: 'smooth',
    });

    window.setTimeout(updateCategoryScrollState, 360);
  };

  /* When video ends → advance to next */
  const handleEnded = useCallback(() => {
    setVidIdx(i => (i + 1) % videos.length);
  }, [videos.length]);

  /* Reload video element when source changes */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    const p = v.play();
    if (p) p.catch(() => { });
  }, [vidIdx, videos]);

  const { src, poster } = videos[vidIdx] || VIDEO_SOURCES[0];

  return (
    <section>

      {/* ══════════════════════════════════
          HALF-SCREEN VIDEO HERO
      ══════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: heroHeight,
          minHeight: isMobile ? 430 : 540,
          overflow: 'visible',
          background: '#041a0c',
        }}
        className="home-hero-container"
      >






        {/* ── Media clip container (keeps video + overlays within bounds) ── */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>

          {/* ── IMAGE background (slideshow) ── */}
          {heroMediaType === 'image' && carouselImages.length > 0 && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
              {carouselImages.map((imgUrl, i) => (
                <div
                  key={imgUrl}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${imgUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: i === currentImgIdx ? 1 : 0,
                    transition: 'opacity 1.2s ease-in-out',
                    zIndex: i === currentImgIdx ? 1 : 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* ── VIDEO background ── */}
          {heroMediaType === 'video' && (
            <video
              ref={videoRef}
              key={src}
              autoPlay
              loop
              muted={isVideoMuted}
              playsInline
              onEnded={handleEnded}
              poster={poster}
              preload="auto"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'fill',
                objectPosition: 'center',
                zIndex: 0,
              }}
            >
              <source src={src} type={getVideoType(src)} />
            </video>
          )}

          {/* ── Dark gradient overlay ── */}
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background:
                'linear-gradient(180deg, rgba(2,8,23,0.3) 0%, rgba(2,8,23,0.1) 42%, rgba(2,8,23,0.5) 100%)',
              pointerEvents: 'none',
            }}
          />

        </div>



        {/* ── Skip button ── */}
        <button
          onClick={() => {
            if (heroMediaType === 'image') {
              setCurrentImgIdx((i) => (i + 1) % carouselImages.length);
            } else {
              setVidIdx(i => (i + 1) % videos.length);
            }
          }}
          title={heroMediaType === 'image' ? 'Next image' : 'Next video'}
          aria-label={heroMediaType === 'image' ? 'Switch to next image' : 'Switch to next video'}
          style={{
            position: 'absolute', bottom: isMobile ? 36 : 48, right: 20, zIndex: 5,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.22)', borderRadius: '50%',
            width: 38, height: 38, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'white',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
        >
          {/* skip-forward icon */}
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        {/* ── Mute/Unmute button (only if video) ── */}
        {heroMediaType === 'video' && (
          <button
            type="button"
            onClick={() => setIsVideoMuted((muted) => !muted)}
            title={isVideoMuted ? 'Unmute video' : 'Mute video'}
            aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}
            aria-pressed={!isVideoMuted}
            style={{
              position: 'absolute',
              bottom: isMobile ? 36 : 48,
              left: 20,
              zIndex: 5,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
          >
            {isVideoMuted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                <path d="m22 9-6 6" />
                <path d="m16 9 6 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 5.5a9 9 0 0 1 0 13" />
              </svg>
            )}
          </button>
        )}



      </div>

    </section>
  );
}
