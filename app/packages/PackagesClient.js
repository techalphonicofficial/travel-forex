'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEST_FILTERS, PRICE_FILTERS } from '@/data/packages';
import RecommendedPackages from '@/components/FeaturedToursRow';
import { PytExclusive, TrustBanner, BrandsRow, CategoryBlocks, BottomReviews } from '@/components/PackagePageSections';
import { useWishlist } from '@/components/WishlistProvider';
import { getMediaUrl, getPackages } from '@/utils/api';

/* ── Video clips per "scene" ──────────────────────────── */
const SCENES = [
  {
    label: 'Bali Temple',
    video: 'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/elephants.mp4',
    poster: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=85',
    dest: 'Bali',
  },
  {
    label: 'Maldives Reef',
    video: 'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/sea_turtle.mp4',
    poster: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1920&q=85',
    dest: 'Maldives',
  },
  {
    label: 'Japan Sakura',
    video: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    poster: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920&q=85',
    dest: 'Japan',
  },
  {
    label: 'Greece Sunset',
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    poster: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1920&q=85',
    dest: 'Greece',
  },
  {
    label: 'Dubai Skyline',
    video: 'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/dog.mp4',
    poster: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=85',
    dest: 'Dubai',
  },
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_IMAGE_URL;
const FALLBACK_PACKAGE_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80';
const ADVANCED_FILTER_KEYS = ['minPrice', 'maxPrice', 'duration', 'startDate', 'endDate', 'city', 'country', 'continent', 'destination', 'category'];
const PRICE_FILTER_QUERY = {
  under50: { minPrice: 1, maxPrice: 49999 },
  '50to150': { minPrice: 50000, maxPrice: 149999 },
  '150to250': { minPrice: 150000, maxPrice: 249999 },
  luxury: { minPrice: 250000 },
};

const getPriceCategory = (price) => {
  if (price < 50000) return 'under50';
  if (price < 150000) return '50to150';
  if (price < 250000) return '150to250';
  return 'luxury';
};

const toSlug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const normalizeApiPackage = (pkg) => {
  const destinationItems = pkg.destinations || [];
  const firstDestinationItem = destinationItems[0];
  const firstDestination = firstDestinationItem?.destination;
  const firstMapping = firstDestination?.mappings?.[0];
  const destinationName = firstDestination?.name || 'Worldwide';
  const nights = destinationItems.reduce((total, item) => total + (Number(item.nights) || 0), 0) || Math.max((Number(pkg.duration_days) || 1) - 1, 1);
  const locations = destinationItems.length
    ? destinationItems.map((item) => {
      const name = item.destination?.name || destinationName;
      return `${name}${item.nights ? ` (${item.nights}N)` : ''}`;
    })
    : [destinationName];
  const price = Number(pkg.price) || 0;
  const image = getMediaUrl(pkg.main_image) || getMediaUrl(firstDestination?.feature_image) || FALLBACK_PACKAGE_IMAGE;

  return {
    id: pkg.id,
    slug: pkg.slug || String(pkg.id),
    destination: destinationName,
    destinationSlug: firstDestination?.slug || destinationName,
    city: firstMapping?.city?.name || destinationName,
    country: firstMapping?.city?.country?.name || '',
    continent: firstMapping?.city?.country?.continent?.name || '',
    title: pkg.name,
    locations,
    image,
    nights,
    durationDays: Number(pkg.duration_days) || nights + 1,
    price,
    priceCategory: getPriceCategory(price),
    type: firstDestination?.type?.toUpperCase() || 'PACKAGE',
    typeColor: firstDestination?.type === 'domestic' ? '#10b981' : '#6366f1',
    rating: 4.6,
    reviews: 0,
    description: pkg.description,
  };
};

const buildPackageQuery = ({ destFilter, priceFilter, typeFilter, advancedFilters }) => {
  const query = {};

  ADVANCED_FILTER_KEYS.forEach((key) => {
    const value = advancedFilters?.[key];
    if (value) query[key] = value;
  });

  if (destFilter && destFilter !== 'All') query.destination = toSlug(destFilter);
  if (priceFilter && priceFilter !== 'all') {
    Object.assign(query, PRICE_FILTER_QUERY[priceFilter]);
  }
  if (typeFilter && typeFilter !== 'All') query.category = typeFilter;

  return query;
};

const getInitialAdvancedFilters = (searchParams) => {
  return ADVANCED_FILTER_KEYS.reduce((filters, key) => {
    filters[key] = searchParams?.get(key) || '';
    return filters;
  }, {});
};
/* ── Package card ─────────────────────────────────────── */
function PackageCard({ pkg }) {
  const [hovered, setHovered] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const packageHref = `/tours?destination=${encodeURIComponent(pkg.destination)}`;
  const wishlistItem = {
    id: pkg.slug || pkg.id || pkg.title,
    type: 'package',
    title: pkg.title,
    location: Array.isArray(pkg.locations) ? pkg.locations.join(' - ') : pkg.destination,
    image: pkg.image,
    price: pkg.price,
    href: packageHref,
    slug: pkg.slug,
    duration: pkg.nights ? `${pkg.nights}N` : '',
    badge: pkg.type,
  };
  const wishlisted = isWishlisted(wishlistItem);
  const stars = Math.round(pkg.rating);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
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
        <Image
          src={pkg.image}
          alt={pkg.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{
            objectFit: 'cover',
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
          background: 'color-mix(in srgb, var(--color-secondary) 85%, transparent)', backdropFilter: 'blur(6px)',
          color: 'white', borderRadius: 999,
          padding: '4px 12px', fontSize: 10, fontWeight: 800,
          border: '1px solid rgba(255,255,255,0.2)',
          letterSpacing: 0.5, textTransform: 'uppercase',
        }}>
          {pkg.destination}
        </div>
        <button
          type="button"
          className="tour-card-wishlist"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist(wishlistItem);
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          style={{ top: 52, right: 12, color: 'white', background: wishlisted ? 'rgba(255,87,34,0.9)' : 'rgba(255,255,255,0.22)' }}
        >
          <svg viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
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
          <Link href={packageHref} style={{
            background: 'var(--color-primary)', color: 'white',
            borderRadius: 10, padding: '10px 18px',
            fontWeight: 700, fontSize: 12,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 10px rgba(20,83,45,0.3)',
            textDecoration: 'none',
          }}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ─────────── Main packages page logic ───────────── */
function PackagesContent({ destParam, packages, basePath = '/packages' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDest = destParam || searchParams?.get('destination') || searchParams?.get('dest') || searchParams?.get('search') || 'All';
  const initialType = searchParams?.get('category') || searchParams?.get('type') || 'All';
  // Banner state
  const videoRef = useRef(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);

  // Filter state
  const [destFilter, setDestFilter] = useState(initialDest || 'All');
  const [priceFilter, setPriceFilter] = useState(searchParams?.get('price') || 'all');
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [visible, setVisible] = useState(true);
  const [sortBy, setSortBy] = useState('popular');
  const [advancedFilters, setAdvancedFilters] = useState(() => getInitialAdvancedFilters(searchParams));
  const [apiPackages, setApiPackages] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const heroScenes = packages?.gallery?.length ? packages.gallery : SCENES;
  const scene = heroScenes[sceneIdx % heroScenes.length];
  const sceneVideoSrc = scene?.url ? getMediaUrl(scene.url) : scene?.video;
  const scenePosterSrc = scene?.poster_url ? getMediaUrl(scene.poster_url) : scene?.poster;
  const sceneLabel = scene?.dest || scene?.label || 'Holiday';

  /* ── Video auto-advance ───────────────────────────────── */
  const handleEnded = useCallback(() => {
    setSceneIdx(i => (i + 1) % heroScenes.length);
    setProgress(0);
  }, [heroScenes.length]);

  /* Handle scene change (loading) */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    if (!paused) {
      v.play().catch(() => { });
    }
  }, [paused, sceneIdx]);

  /* Handle manual play/pause toggle */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => { });
  }, [paused]);

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
    setPaused(prev => !prev);
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

  const updateAdvancedFilter = (key, value) => {
    setAdvancedFilters((filters) => ({ ...filters, [key]: value }));
  };

  const clearAllFilters = () => {
    applyFilter('All', 'all', 'All');
    setAdvancedFilters(getInitialAdvancedFilters());
  };

  const activePackageQuery = useMemo(
    () => buildPackageQuery({ destFilter, priceFilter, typeFilter, advancedFilters }),
    [destFilter, priceFilter, typeFilter, advancedFilters]
  );

  useEffect(() => {
    const params = new URLSearchParams(activePackageQuery);
    const queryString = params.toString();
    router.replace(queryString ? `${basePath}?${queryString}` : basePath, { scroll: false });
  }, [router, activePackageQuery, basePath]);

  useEffect(() => {
    let mounted = true;

    const loadPackages = async () => {
      setApiLoading(true);
      setApiError('');
      const data = await getPackages(activePackageQuery);

      if (!mounted) return;

      setApiPackages(data.map(normalizeApiPackage));
      if (!data.length) {
        setApiError('No API packages returned for the current filters.');
      }
      setApiLoading(false);
    };

    loadPackages();

    return () => {
      mounted = false;
    };
  }, [activePackageQuery]);

  const apiDestinationFilters = Array.from(new Set(apiPackages.map((pkg) => pkg.destination).filter(Boolean)));
  const destinationFilters = Array.from(new Set([...DEST_FILTERS, ...apiDestinationFilters]));
  let filtered = apiPackages;
  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  const activeQueryEntries = Object.entries(activePackageQuery);
  const activeQueryString = new URLSearchParams(activePackageQuery).toString();

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .pkg-card-grid { animation: fadeUp 0.32s ease; }
        .scene-tab:hover { background: rgba(255,255,255,0.18) !important; }
        .ctrl-btn:hover { background: rgba(255,255,255,0.22) !important; }
        .filter-chip:hover { border-color: var(--color-primary) !important; }
        .api-filter-input {
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 13px;
          color: #374151;
          outline: none;
          min-width: 126px;
          background: white;
        }
        .api-filter-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }
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
        {sceneVideoSrc ? (
          <video
            ref={videoRef}
            key={sceneVideoSrc}
            autoPlay muted={muted} playsInline
            onEnded={handleEnded}
            poster={scenePosterSrc}
            preload="auto"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 0,
            }}
          >
            <source src={sceneVideoSrc} type={scene.media_type === 'video' || scene.video ? 'video/mp4' : undefined} />
          </video>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#111827' }} />
        )}

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
            {apiLoading ? 'Loading live packages...' : `${filtered.length} curated packages from our live inventory`}
          </p>
        </div>

        {/* ── Progress bars (one per scene, top) ── */}
        <div style={{
          position: 'absolute', top: 104, left: 0, right: 0, zIndex: 5,
          display: 'flex', gap: 4, padding: '0 20px',
        }}>
          {heroScenes.map((s, i) => (
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
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{sceneLabel} Packages</span>
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
            {heroScenes.map((s, i) => (
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
                {destinationFilters.map(d => (
                  <button
                    key={d}
                    className="filter-chip"
                    onClick={() => applyFilter(d, priceFilter, typeFilter)}
                    style={{
                      padding: '6px 16px', borderRadius: 999,
                      border: destFilter === d ? '2px solid var(--color-primary)' : '1.5px solid #d1d5db',
                      background: destFilter === d ? 'var(--color-primary)' : 'white',
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
                        border: priceFilter === f.key ? '2px solid var(--color-primary)' : '1.5px solid #d1d5db',
                        background: priceFilter === f.key ? 'var(--color-primary-light)' : 'white',
                        color: priceFilter === f.key ? 'var(--color-primary)' : '#374151',
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

            <div style={{
              marginTop: 20,
              borderTop: '1px solid #e5e7eb',
              paddingTop: 18,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 12,
              }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: 1.5, textTransform: 'uppercase', margin: 0 }}>
                    API Package Filters
                  </p>
                  <p style={{ fontSize: 12, color: '#8a94a6', margin: '3px 0 0' }}>
                    Matches backend query keys like destination, country, maxPrice, and duration.
                  </p>
                </div>
                {activeQueryString && (
                  <code style={{
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--brand-primary-border)',
                    borderRadius: 8,
                    padding: '7px 10px',
                    fontSize: 12,
                    maxWidth: '100%',
                    overflowX: 'auto',
                  }}>
                    ?{activeQueryString}
                  </code>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                <input className="api-filter-input" type="number" min="0" placeholder="minPrice" value={advancedFilters.minPrice} onChange={e => updateAdvancedFilter('minPrice', e.target.value)} />
                <input className="api-filter-input" type="number" min="0" placeholder="maxPrice" value={advancedFilters.maxPrice} onChange={e => updateAdvancedFilter('maxPrice', e.target.value)} />
                <input className="api-filter-input" type="number" min="1" placeholder="duration" value={advancedFilters.duration} onChange={e => updateAdvancedFilter('duration', e.target.value)} />
                <input className="api-filter-input" type="date" aria-label="startDate" value={advancedFilters.startDate} onChange={e => updateAdvancedFilter('startDate', e.target.value)} />
                <input className="api-filter-input" type="date" aria-label="endDate" value={advancedFilters.endDate} onChange={e => updateAdvancedFilter('endDate', e.target.value)} />
                <input className="api-filter-input" placeholder="city" value={advancedFilters.city} onChange={e => updateAdvancedFilter('city', e.target.value)} />
                <input className="api-filter-input" placeholder="country" value={advancedFilters.country} onChange={e => updateAdvancedFilter('country', e.target.value)} />
                <input className="api-filter-input" placeholder="continent" value={advancedFilters.continent} onChange={e => updateAdvancedFilter('continent', e.target.value)} />
                <input className="api-filter-input" placeholder="destination" value={advancedFilters.destination} onChange={e => updateAdvancedFilter('destination', e.target.value)} />
                <input className="api-filter-input" placeholder="category" value={advancedFilters.category} onChange={e => updateAdvancedFilter('category', e.target.value)} />
              </div>

              {activeQueryEntries.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                  {activeQueryEntries.map(([key, value]) => (
                    <span key={key} style={{
                      background: '#f8fafc',
                      border: '1px solid #e5e7eb',
                      borderRadius: 999,
                      padding: '5px 10px',
                      color: '#374151',
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Result count ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <span style={{
              background: 'var(--color-primary-light)', border: '1px solid var(--brand-primary-border)',
              color: 'var(--color-primary)', borderRadius: 999,
              padding: '4px 14px', fontSize: 13, fontWeight: 700,
            }}>
              {apiLoading ? 'Loading packages...' : `${filtered.length} packages found`}
            </span>
            {apiError && !apiLoading && (
              <span style={{ color: '#9ca3af', fontSize: 12 }}>
                {apiError}
              </span>
            )}
            {(destFilter !== 'All' || priceFilter !== 'all' || typeFilter !== 'All' || Object.values(advancedFilters).some(Boolean)) && (
              <button
                onClick={clearAllFilters}
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
          {apiLoading ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              background: 'white', borderRadius: 18,
              border: '1px solid #e5e7eb',
              color: '#6b7280',
              fontWeight: 600,
            }}>
              Loading packages...
            </div>
          ) : filtered.length > 0 ? (
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
                onClick={clearAllFilters}
                style={{
                  background: 'var(--color-primary)', color: 'white', border: 'none',
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

export default function PackagesClient({ destParam, packages, basePath = '/packages' }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PackagesContent destParam={destParam} packages={packages} basePath={basePath} />
    </Suspense>
  );
}
