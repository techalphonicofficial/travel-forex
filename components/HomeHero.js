'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/*
  CORS-safe video sources from Google's public CDN
  With beautiful travel poster images shown instantly while video loads
*/
const VIDEO_SOURCES = [
  {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=85',
  },
  {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    poster: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=85',
  },
  {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=85',
  },
  {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1920&q=85',
  },
];

const travelerTypes = [
  { id: 'couple', label: 'Couple', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&q=80' },
  { id: 'family', label: 'Family', image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=300&q=80' },
  { id: 'friends', label: 'Friends', image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=300&q=80' },
  { id: 'solo', label: 'Solo', image: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=300&q=80' },
];

export default function HomeHero() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [vidIdx, setVidIdx] = useState(0);
  const [destination, setDestination] = useState('');
  const [activeTraveler, setActiveTraveler] = useState(null);
  const [heroHeight, setHeroHeight] = useState('100vh');

  /* Handle dynamic hero height for responsive devices */
  useEffect(() => {
    const updateHeight = () => {
      const w = window.innerWidth;
      if (w <= 767) {         // Mobile
        setHeroHeight('180vh');
      } else if (w <= 1024) {  // Tablet
        setHeroHeight('100vh');
      } else {                // Desktop
        setHeroHeight('100vh');
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  /* When video ends → advance to next */
  const handleEnded = useCallback(() => {
    setVidIdx(i => (i + 1) % VIDEO_SOURCES.length);
  }, []);

  /* Reload video element when source changes */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    const p = v.play();
    if (p) p.catch(() => { });
  }, [vidIdx]);

  const handleSearch = () => {
    if (destination) {
      router.push(`/tours?search=${encodeURIComponent(destination)}`);
    } else {
      router.push('/tours');
    }
  };

  const { src, poster } = VIDEO_SOURCES[vidIdx];

  return (
    <section>

      {/* ══════════════════════════════════
          FULL-SCREEN VIDEO HERO
      ══════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: heroHeight,
          minHeight: 560,
          overflow: 'hidden',
          background: '#041a0c',
        }}
      >

        {/* ── VIDEO background ── */}
        <video
          ref={videoRef}
          key={src}
          autoPlay
          muted
          playsInline
          onEnded={handleEnded}
          poster={poster}
          preload="auto"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
          }}
        >
          <source src={src} type="video/mp4" />
          {/* Fallback: poster image already shows via the poster prop */}
        </video>

        {/* ── Dark gradient overlay ── */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.32) 48%, rgba(4,26,12,0.92) 100%)',
          }}
        />

        {/* ── Skip video button ── */}
        <button
          onClick={() => setVidIdx(i => (i + 1) % VIDEO_SOURCES.length)}
          title="Next video"
          aria-label="Switch to next video"
          style={{
            position: 'absolute', bottom: 192, right: 20, zIndex: 5,
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

        {/* ── Centered hero content ── */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '0 16px',
            paddingBottom: 180,
          }}
        >

          {/* Google review badge */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999,
              padding: '7px 20px', marginBottom: 22,
            }}
          >
            <svg viewBox="0 0 48 48" width="16" height="16">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.2 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z" />
              <path fill="#FBBC05" d="M24 46c5.4 0 10.5-1.8 14.4-4.9l-6.7-5.5C29.6 37.6 26.9 38.5 24 38.5c-6 0-10.5-3.8-12.2-8.9l-7.1 5.5C8.8 42.2 15.8 46 24 46z" />
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.6 2.8-2.2 5.2-4.5 6.8l6.7 5.5C42.4 37.2 45 31 45 24c0-1.3-.2-2.7-.5-4z" />
            </svg>
            <span style={{ color: '#fbbf24', fontSize: 14, fontWeight: 700 }}>★ 4.6</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>From 8,250 reviews</span>
          </div>

          {/* Main headline */}
          <h1
            style={{
              fontFamily: 'Poppins, sans-serif', fontWeight: 900,
              fontSize: 'clamp(20px, 3.2vw, 44px)', color: 'white',
              margin: '0 0 30px', lineHeight: 1.0,
              textTransform: 'uppercase', letterSpacing: 2,
              textShadow: '0 3px 28px rgba(0,0,0,0.55)',
            }}
          >
            CREATE YOUR SOOPER HIT HOLIDAY
          </h1>

          {/* ── Green-border search bar — exact PickYourTrail style ── */}
          <div style={{ width: '100%', maxWidth: 600 }}>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.97)',
                border: '2.5px solid #fdce2e',
                borderRadius: 999,
                overflow: 'hidden',
                boxShadow: '0 0 0 5px rgba(253, 206, 46, 0.18), 0 12px 40px rgba(0,0,0,0.45)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px 0 20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" width="20" height="20">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search countries, cities"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 16, color: '#111827',
                  padding: '12px 8px', background: 'transparent',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  background: '#fea309', color: 'white',
                  border: 'none', padding: '0 28px',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  letterSpacing: 0.3, transition: 'background 0.2s',
                  fontFamily: 'Poppins, sans-serif',
                  borderRadius: '0 999px 999px 0',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fab847ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#fea309'}
              >
                Search
              </button>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════
            "OR PICK WHO'S JOINING" PANEL
        ══════════════════════════════════ */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
            background: '#026eb5',
            borderRadius: '40px 40px 0 0',
            paddingTop: 24,
            paddingBottom: 16,
          }}
        >
          <p
            style={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.72)',
              fontSize: 28, fontWeight: 600,
              margin: '0 0 20px',
              letterSpacing: 0.2,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Or pick who&apos;s joining
          </p>

          <div
            style={{
              display: 'flex', justifyContent: 'center',
              gap: 32, flexWrap: 'wrap', padding: '0 40px',
            }}
          >
            {travelerTypes.map(({ id, label, image }) => {
              const active = activeTraveler === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    const tMap = { couple: 'Couple', family: 'Family', friends: 'Friends', solo: 'Solo' };
                    let url = `/customize?traveller=${tMap[id]}`;
                    if (destination) {
                      url += `&dest=${encodeURIComponent(destination)}`;
                    }
                    router.push(url);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    gap: 8, padding: 0, transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div
                    style={{
                      width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                      border: active ? '3px solid #22c55e' : '3px solid rgba(255,255,255,0.2)',
                      boxShadow: active
                        ? '0 0 0 4px rgba(34,197,94,0.28), 0 6px 20px rgba(0,0,0,0.35)'
                        : '0 4px 16px rgba(0,0,0,0.35)',
                      transition: 'all 0.25s',
                    }}
                  >
                    <img
                      src={image} alt={label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <span
                    style={{
                      color: active ? '#fdce2e' : 'rgba(255,255,255,0.82)',
                      fontSize: 18, fontWeight: active ? 700 : 500,
                      fontFamily: 'Inter, sans-serif',
                      transition: 'color 0.2s',
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
