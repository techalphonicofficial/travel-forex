'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { packageData, DEST_FILTERS, PRICE_FILTERS } from '@/data/packages';
import RecommendedPackages from '@/components/FeaturedToursRow';
import { PytExclusive, TrustBanner, BrandsRow, CategoryBlocks, BottomReviews } from '@/components/PackagePageSections';

/* ── Video clips per "scene" ──────────────────────────── */
const SCENES = [
  {
    label: 'Bali Temple',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=85',
    dest: 'Bali',
  },
  {
    label: 'Maldives Reef',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1920&q=85',
    dest: 'Maldives',
  },
  {
    label: 'Japan Sakura',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    poster: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920&q=85',
    dest: 'Japan',
  },
  {
    label: 'Greece Sunset',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1920&q=85',
    dest: 'Greece',
  },
  {
    label: 'Dubai Skyline',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=85',
    dest: 'Dubai',
  },
];

/* ── Package card ─────────────────────────────────────── */
function PackageCard({ pkg }) {
  const [hovered, setHovered] = useState(false);
  const stars = Math.round(pkg.rating);

  return (
    <Link
      href={`/tours/${pkg.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', textDecoration: 'none',
        background: 'white', borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        boxShadow: hovered ? '0 16px 48px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-5px)' : 'none',
        transition: 'all 0.32s ease',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img
          src={pkg.image} alt={pkg.title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: hovered ? 'scale(1.07)' : 'scale(1)',
            transition: 'transform 0.45s ease',
          }}
          loading="lazy"
        />
        {/* Gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.55) 100%)',
        }} />
        {/* Nights badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          color: 'white', borderRadius: 999,
          padding: '4px 12px', fontSize: 11, fontWeight: 700,
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          {pkg.nights}N
        </div>
        {/* Destination tag */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: '#fea309d9', backdropFilter: 'blur(6px)',
          color: 'white', borderRadius: 999,
          padding: '4px 12px', fontSize: 10, fontWeight: 800,
          border: '1px solid rgba(255,255,255,0.2)',
          letterSpacing: 0.5, textTransform: 'uppercase',
        }}>
          {pkg.destination}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        <p style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 700,
          fontSize: 14, color: '#111827', margin: '0 0 6px', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {pkg.title}
        </p>

        {/* Locations */}
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg viewBox="0 0 24 24" fill="#6b7280" width="11" height="11">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          {pkg.locations.join(' · ')}
        </p>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{
            background: pkg.typeColor + '18', color: pkg.typeColor,
            border: `1px solid ${pkg.typeColor}40`,
            borderRadius: 6, padding: '2px 9px',
            fontSize: 10, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase',
          }}>{pkg.type}</span>
          <span style={{
            background: '#f3f4f6', color: '#4b5563',
            borderRadius: 6, padding: '2px 9px',
            fontSize: 10, fontWeight: 700,
          }}>
            {'★'.repeat(stars)} {pkg.rating}
          </span>
          <span style={{
            background: '#f3f4f6', color: '#6b7280',
            borderRadius: 6, padding: '2px 9px',
            fontSize: 10, fontWeight: 600,
          }}>
            {pkg.reviews} reviews
          </span>
        </div>

        {/* Price + CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid #f3f4f6', paddingTop: 12, gap: 8,
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>Starting from</div>
            <div style={{
              fontFamily: 'Poppins, sans-serif', fontWeight: 800,
              fontSize: 20, color: '#111827', lineHeight: 1,
            }}>
              {'\u20b9'}{pkg.price.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{pkg.nights} nights / person</div>
          </div>
          <div style={{
            background: '#026eb5', color: 'white',
            borderRadius: 10, padding: '10px 18px',
            fontWeight: 700, fontSize: 12,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 10px rgba(20,83,45,0.3)',
          }}>
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Main packages page logic ───────────────────────────── */
function PackagesContent() {
  const searchParams = useSearchParams();
  const initialDest = searchParams?.get('dest') || 'All';
  const initialType = searchParams?.get('type') || 'All';
  // Banner state
  const videoRef = useRef(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);

  // Filter state
  const [destFilter, setDestFilter] = useState(DEST_FILTERS.includes(initialDest) ? initialDest : 'All');
  const [priceFilter, setPriceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [visible, setVisible] = useState(true);
  const [sortBy, setSortBy] = useState('popular');

  const scene = SCENES[sceneIdx];

  /* ── Video auto-advance ───────────────────────────────── */
  const handleEnded = useCallback(() => {
    setSceneIdx(i => (i + 1) % SCENES.length);
    setProgress(0);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    if (!paused) {
      v.play().catch(() => { });
    }
  }, [sceneIdx, paused]);

  /* Progress bar from <video> timeupdate */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (v.duration) setProgress((v.currentTime / v.duration) * 100);
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [sceneIdx]);

  const togglePause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) { v.play().catch(() => { }); setPaused(false); }
    else { v.pause(); setPaused(true); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const goScene = (idx) => {
    setSceneIdx(idx);
    setProgress(0);
  };

  /* ── Filtering ────────────────────────────────────────── */
  const applyFilter = (dest, price, type = 'All') => {
    setVisible(false);
    setTimeout(() => {
      setDestFilter(dest);
      setPriceFilter(price);
      setTypeFilter(type);
      setVisible(true);
    }, 180);
  };

  let filtered = packageData;
  if (destFilter !== 'All') filtered = filtered.filter(p => p.destination === destFilter);
  if (priceFilter !== 'all') filtered = filtered.filter(p => p.priceCategory === priceFilter);
  if (typeFilter !== 'All') filtered = filtered.filter(p => p.type === typeFilter);
  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .pkg-card-grid { animation: fadeUp 0.32s ease; }
        .scene-tab:hover { background: rgba(255,255,255,0.18) !important; }
        .ctrl-btn:hover { background: rgba(255,255,255,0.22) !important; }
        .filter-chip:hover { border-color: #026eb5 !important; }
      `}</style>

      {/* ══════════════════════════════════════════════════════
          HERO VIDEO BANNER
      ══════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', width: '100%',
        height: '100vh', minHeight: 560,
        overflow: 'hidden', background: '#041a0c',
        marginTop: 0, paddingTop: 64,
      }}>

        {/* Video */}
        <video
          ref={videoRef}
          key={scene.video}
          autoPlay muted={muted} playsInline
          onEnded={handleEnded}
          poster={scene.poster}
          preload="auto"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
          }}
        >
          <source src={scene.video} type="video/mp4" />
        </video>

        {/* Dark vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.7) 85%, rgba(0,0,0,0.92) 100%)',
        }} />

        {/* ── Centered hero text ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '0 20px',
          paddingBottom: 200,
        }}>
          {/* Breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 20,
            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
            borderRadius: 999, padding: '6px 18px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>Home</Link>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>›</span>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>Packages</span>
          </div>

          <h1 style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 900, fontSize: 'clamp(28px, 4.5vw, 64px)',
            color: 'white', margin: 0, lineHeight: 1.05,
            textTransform: 'uppercase', letterSpacing: 2,
            textShadow: '0 4px 30px rgba(0,0,0,0.6)',
          }}>
            Holiday Tour Packages
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)', fontSize: 17,
            margin: '14px 0 0', fontWeight: 500,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}>
            {filtered.length > 0 ? `${packageData.length} curated packages across ${DEST_FILTERS.length - 1} destinations` : ''}
          </p>
        </div>

        {/* ── Progress bars (one per scene, top) ── */}
        <div style={{
          position: 'absolute', top: 104, left: 0, right: 0, zIndex: 5,
          display: 'flex', gap: 4, padding: '0 20px',
        }}>
          {SCENES.map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 3, borderRadius: 3,
                background: 'rgba(255,255,255,0.25)',
                overflow: 'hidden', cursor: 'pointer',
              }}
              onClick={() => goScene(i)}
            >
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'white',
                width: i < sceneIdx ? '100%' : i === sceneIdx ? `${progress}%` : '0%',
                transition: i === sceneIdx ? 'none' : 'width 0.3s ease',
              }} />
            </div>
          ))}
        </div>

        {/* ── Controls: Mute + Pause (bottom right) ── */}
        <div style={{
          position: 'absolute', bottom: 160, right: 20, zIndex: 5,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <button
            className="ctrl-btn"
            onClick={toggleMute}
            title={muted ? 'Unmute' : 'Mute'}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'background 0.2s',
            }}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>

          <button
            className="ctrl-btn"
            onClick={togglePause}
            title={paused ? 'Play' : 'Pause'}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'background 0.2s',
            }}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Scene tab strip (bottom) ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* Breadcrumb info bar */}
          <div style={{
            padding: '8px 24px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textDecoration: 'none' }}>Home</Link>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>›</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Packages</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>›</span>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{scene.dest} Packages</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 48 48" width="13" height="13">
                <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
              </svg>
              <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>★ 4.6</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>8,250 reviews</span>
            </div>
          </div>

          {/* Scene tabs */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px 12px', gap: 4, overflowX: 'auto' }}>
            {SCENES.map((s, i) => (
              <button
                key={i}
                className="scene-tab"
                onClick={() => goScene(i)}
                style={{
                  flexShrink: 0,
                  padding: '7px 18px',
                  borderRadius: 999,
                  border: i === sceneIdx
                    ? '1.5px solid white'
                    : '1.5px solid rgba(255,255,255,0.2)',
                  background: i === sceneIdx
                    ? 'rgba(255,255,255,0.18)'
                    : 'rgba(255,255,255,0.06)',
                  color: 'white', fontWeight: i === sceneIdx ? 700 : 500,
                  fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(6px)',
                  outline: 'none',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          2. PYT EXCLUSIVE & TRUST BANNER
      ══════════════════════════════════════════════════════ */}
      <PytExclusive />
      <TrustBanner />

      {/* ══════════════════════════════════════════════════════
          3. RECENTLY BOOKED ITINERARIES (Horizontal Slider)
      ══════════════════════════════════════════════════════ */}
      <RecommendedPackages />

      {/* ══════════════════════════════════════════════════════
          4. BRANDS LOGO CLOUD
      ══════════════════════════════════════════════════════ */}
      <BrandsRow />

      {/* ══════════════════════════════════════════════════════
          5. PACKAGE GRID SECTION WITH ADVANCED FILTERS
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: '#f8fafc', padding: '48px 0 64px' }}>
        <div className='container' style={{ margin: '0 auto', padding: '0 24px' }}>

          {/* ── Filter bar ── */}
          <div style={{
            background: 'white', borderRadius: 18,
            border: '1px solid #e5e7eb',
            padding: '20px 24px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            marginBottom: 32,
          }}>
            {/* Row 1: Destination chips */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 10px' }}>
                Destination
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DEST_FILTERS.map(d => (
                  <button
                    key={d}
                    className="filter-chip"
                    onClick={() => applyFilter(d, priceFilter, typeFilter)}
                    style={{
                      padding: '6px 16px', borderRadius: 999,
                      border: destFilter === d ? '2px solid #026eb5' : '1.5px solid #d1d5db',
                      background: destFilter === d ? '#026eb5' : 'white',
                      color: destFilter === d ? 'white' : '#374151',
                      fontWeight: destFilter === d ? 700 : 500,
                      fontSize: 13, cursor: 'pointer', transition: 'all 0.18s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Price chips + Sort */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 10px' }}>
                  Budget
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PRICE_FILTERS.map(f => (
                    <button
                      key={f.key}
                      className="filter-chip"
                      onClick={() => applyFilter(destFilter, f.key, typeFilter)}
                      style={{
                        padding: '6px 16px', borderRadius: 999,
                        border: priceFilter === f.key ? '2px solid #026eb5' : '1.5px solid #d1d5db',
                        background: priceFilter === f.key ? '#c5e5fb' : 'white',
                        color: priceFilter === f.key ? '#026eb5' : '#374151',
                        fontWeight: priceFilter === f.key ? 700 : 500,
                        fontSize: 13, cursor: 'pointer', transition: 'all 0.18s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '8px 14px', borderRadius: 10,
                  border: '1.5px solid #d1d5db', outline: 'none',
                  fontSize: 13, color: '#374151', fontWeight: 600,
                  background: 'white', cursor: 'pointer',
                }}
              >
                <option value="popular">Sort: Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* ── Result count ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <span style={{
              background: '#c5e5fb', border: '1px solid #7abfee',
              color: '#026eb5', borderRadius: 999,
              padding: '4px 14px', fontSize: 13, fontWeight: 700,
            }}>
              {filtered.length} packages found
            </span>
            {(destFilter !== 'All' || priceFilter !== 'all' || typeFilter !== 'All') && (
              <button
                onClick={() => applyFilter('All', 'all', 'All')}
                style={{
                  background: 'none', border: 'none', color: '#6b7280',
                  fontSize: 12, cursor: 'pointer', fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* ── Package grid ── */}
          {filtered.length > 0 ? (
            <div
              className="pkg-card-grid"
              key={`${destFilter}-${priceFilter}-${typeFilter}-${sortBy}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 22,
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.18s ease',
              }}
            >
              {filtered.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '64px 24px',
              background: 'white', borderRadius: 18,
              border: '1px dashed #d1d5db',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                No packages found
              </h3>
              <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 20px' }}>
                Try adjusting your destination or budget filter
              </p>
              <button
                onClick={() => applyFilter('All', 'all', 'All')}
                style={{
                  background: '#026eb5', color: 'white', border: 'none',
                  borderRadius: 10, padding: '12px 28px',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                View All Packages
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. CATEGORY BLOCKS (Family, Budget, Duration)
      ══════════════════════════════════════════════════════ */}
      <CategoryBlocks destination={destFilter} />

      {/* ══════════════════════════════════════════════════════
          7. GOOGLE REVIEWS BLOCK
      ══════════════════════════════════════════════════════ */}
      <BottomReviews destination={destFilter !== 'All' ? destFilter : 'Worldwide'} />
    </>
  );
}

export default function PackagesClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PackagesContent />
    </Suspense>
  );
}
