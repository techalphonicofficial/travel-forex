'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { gramReels } from '@/data/gramReels';

export default function ReelsViewer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const startIdx = parseInt(searchParams.get('idx') || '0', 10);

  const [current, setCurrent] = useState(
    isNaN(startIdx) || startIdx < 0 || startIdx >= gramReels.length ? 0 : startIdx
  );
  const [animDir, setAnimDir] = useState(null); // 'up' | 'down'
  const [liked, setLiked] = useState({});
  const [shared, setShared] = useState(false);
  const touchStartY = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const mobileRefs = useRef([]);

  /* Detect mobile state */
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth <= 768);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  /* Sync 'current' state with scroll position on mobile */
  useEffect(() => {
    if (!isMobile) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-idx'), 10);
            setCurrent(idx);
            setExpandedIdx(null);
          }
        });
      },
      { threshold: 0.6 }
    );

    mobileRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [isMobile]);

  const reel = gramReels[current];
  const total = gramReels.length;

  /* ── Navigation helpers ────────────────────────────── */
  const goTo = useCallback((idx, dir) => {
    if (idx < 0 || idx >= total) return;
    setExpandedIdx(null);
    if (isMobile) {
      const target = mobileRefs.current[idx];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    setAnimDir(dir);
    setTimeout(() => {
      setCurrent(idx);
      setAnimDir(null);
      setShared(false);
    }, 260);
  }, [total, isMobile]);

  const goPrev = useCallback(() => goTo(current - 1, 'down'), [current, goTo]);
  const goNext = useCallback(() => goTo(current + 1, 'up'), [current, goTo]);

  /* ── Keyboard navigation ───────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowUp') goPrev();
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, router]);

  /* ── Mouse wheel navigation ────────────────────────── */
  useEffect(() => {
    if (isMobile) return;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.deltaY > 30) goNext();
      if (e.deltaY < -30) goPrev();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [goNext, goPrev, isMobile]);

  /* ── Touch swipe navigation ────────────────────────── */
  const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 40) goNext();
    if (diff < -40) goPrev();
    touchStartY.current = null;
  };

  /* ── Slide animation style ─────────────────────────── */
  const slideStyle = animDir === 'up'
    ? { opacity: 0, transform: 'translateY(40px)' }
    : animDir === 'down'
      ? { opacity: 0, transform: 'translateY(-40px)' }
      : { opacity: 1, transform: 'translateY(0)' };

  /* ──────────────────────────────────────────────────────────
     MOBILE VIEW RENDERING
     ────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div
        className="mobile-reels-root"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#000', color: 'white',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <style>{`
          .mobile-reels-root::-webkit-scrollbar { display: none; }
          .reel-item { scroll-snap-align: start; scroll-snap-stop: always; }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translate(-50%, -40%); }
            to   { opacity: 1; transform: translate(-50%, -50%); }
          }
        `}</style>

        {gramReels.map((r, idx) => {
          const isActive = current === idx;
          return (
            <div
              key={r.id}
              data-idx={idx}
              ref={(el) => (mobileRefs.current[idx] = el)}
              className="reel-item"
              style={{
                height: '100vh', width: '100%',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Full-screen background content */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <img
                  src={r.src}
                  alt={r.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(rgba(0,0,0,0.3) 0%, transparent 25%, transparent 60%, rgba(0,0,0,0.8) 100%)'
                }} />
              </div>

              {/* TOP OVERLAY: Logo, Badge, Close */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
                padding: '16px 16px 60px', borderRadius: '0 0 24px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src="https://i.ibb.co/wNt195HZ/Whats-App-Image-2026-03-27-at-1-12-46-AM-1-copy-2.webp" alt="logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    background: '#00b894', padding: '12px 10px',
                    borderRadius: '0 0 4px 4px', fontSize: 10, fontWeight: 700,
                    textAlign: 'center', color: 'white', lineHeight: 1.2,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)', width: 60
                  }}>
                    Best Holiday Brand <span style={{ display: 'block', fontSize: 14 }}>🏆</span>
                  </div>

                  <button
                    onClick={() => router.back()}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.4)', color: 'white',
                      border: 'none', fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* MIDDLE OVERLAY: Caption */}
              {/* {isActive && (
                <div style={{
                  position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)',
                  zIndex: 10, animation: 'fadeSlideIn 0.3s'
                }}>
                  <div style={{
                    background: '#16a34a', color: 'white',
                    padding: '4px 12px', borderRadius: 4,
                    fontWeight: 700, fontSize: 16
                  }}>
                    and have a
                  </div>
                </div>
              )} */}

              {/* RIGHT OVERLAY: Actions */}
              <div style={{
                position: 'absolute', right: 16, bottom: 120,
                zIndex: 10, display: 'flex', flexDirection: 'column', gap: 20
              }}>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
                    border: 'none', color: 'white', fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>

                <button
                  onClick={() => { setShared(true); setTimeout(() => setShared(false), 2000); }}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
                    border: 'none', color: 'white', fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {shared && isActive ? '✅' : '📤'}
                </button>
              </div>

              {/* BOTTOM OVERLAY: Content + CTA */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
                <div style={{ padding: '0 20px 20px' }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {r.title}
                  </h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: '0 0 10px', lineHeight: 1.4 }}>
                    {expandedIdx === idx ? r.description : `${r.description.substring(0, 80)}... `}
                    <span
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                      style={{ fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', marginLeft: 4 }}
                    >
                      {expandedIdx === idx ? 'Read Less' : 'Read More'}
                    </span>
                  </p>
                  <div style={{
                    display: 'inline-block', background: 'rgba(255,255,255,0.15)',
                    padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700
                  }}>
                    {r.tag}
                  </div>
                </div>

                <div style={{ padding: '0 16px 16px' }}>
                  <Link
                    href={r.tour}
                    style={{
                      display: 'block', background: '#00b894',
                      color: 'white', textDecoration: 'none',
                      textAlign: 'center', padding: '16px',
                      borderRadius: 8, fontWeight: 800, fontSize: 16
                    }}
                  >
                    View Packages
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     DESKTOP VIEW (Original Style)
     ────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes heartPop {
          0%   { transform: scale(0); opacity:0; }
          60%  { transform: scale(1.3); opacity:1; }
          100% { transform: scale(1); opacity:1; }
        }
        .reel-content { transition: opacity 0.26s ease, transform 0.26s ease; }
        .like-btn:hover { transform: scale(1.15) !important; }
        .nav-btn:hover  { background: rgba(255,255,255,0.15) !important; }
      `}</style>

      {/* ── Close button ── */}
      <button
        onClick={() => router.back()}
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 10,
          width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          color: 'white', fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
        title="Close (Esc)"
      >
        ✕
      </button>

      {/* ── Progress dots (left side) ── */}
      <div style={{
        position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10,
      }}>
        {gramReels.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 'up' : 'down')}
            style={{
              width: i === current ? 8 : 6,
              height: i === current ? 28 : 6,
              borderRadius: 999,
              background: i === current ? '#fff' : 'rgba(255,255,255,0.25)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* ── Main reel content ── */}
      <div
        className="reel-content"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 60, maxWidth: 960, width: '100%', padding: '0 80px',
          ...slideStyle,
        }}
      >

        {/* ── LEFT: Phone frame with image ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {/* Phone outer shell */}
          <div style={{
            width: 300, height: 560,
            borderRadius: 36,
            background: '#111',
            border: '3px solid rgba(255,255,255,0.12)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.05)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Image */}
            <img
              src={reel.src}
              alt={reel.title}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
              }}
            />

            {/* Bottom gradient overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.75) 100%)',
            }} />

            {/* Bottom user info */}
            <div style={{ position: 'absolute', bottom: 16, left: 14, right: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  🌍
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{reel.user}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{reel.location}</div>
                </div>
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.9)', fontSize: 12,
                fontWeight: 500, lineHeight: 1.5, margin: 0,
              }}>
                {reel.caption}
              </p>
            </div>

            {/* Like counter */}
            <div style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              borderRadius: 999, padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: 12 }}>❤️</span>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{reel.likes}</span>
            </div>

            {/* Notch */}
            <div style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              width: 80, height: 20, background: '#111',
              borderRadius: 999,
            }} />
          </div>

          {/* Action buttons side-shifted for desktop */}
          <div style={{
            position: 'absolute', right: -52, bottom: 0, transform: 'translateY(-25%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          }}>
            {/* Like */}
            <button
              className="like-btn"
              onClick={() => setLiked(p => ({ ...p, [current]: !p[current] }))}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'transform 0.2s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: liked[current] ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)',
                border: `1.5px solid ${liked[current] ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
                animation: liked[current] ? 'heartPop 0.35s ease' : 'none',
                transition: 'all 0.2s',
              }}>
                {liked[current] ? '❤️' : '🤍'}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>
                {liked[current] ? 'Liked' : 'Like'}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={() => { setShared(true); setTimeout(() => setShared(false), 2000); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'transform 0.2s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: shared ? 'rgba(20,83,45,0.3)' : 'rgba(255,255,255,0.1)',
                border: `1.5px solid ${shared ? '#026eb5' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
                transition: 'all 0.2s',
              }}>
                {shared ? '✅' : '📤'}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>
                {shared ? 'Copied!' : 'Share'}
              </span>
            </button>
          </div>
        </div>

        {/* ── RIGHT: Info panel ── */}
        <div style={{
          flex: 1, maxWidth: 320,
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>

          {/* Counter */}
          <div style={{
            color: 'rgba(255,255,255,0.35)', fontSize: 12,
            fontWeight: 600, letterSpacing: 1.5,
            textTransform: 'uppercase', marginBottom: 14,
          }}>
            {current + 1} / {total}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 800, fontSize: 28,
            color: 'white', margin: '0 0 12px',
            lineHeight: 1.2,
          }}>
            {reel.title}
          </h1>

          {/* Location tag */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: reel.tagColor + '22',
            border: `1px solid ${reel.tagColor}50`,
            color: reel.tagColor === '#10b981' ? '#34d399' : reel.tagColor,
            borderRadius: 999, padding: '5px 14px',
            fontSize: 12, fontWeight: 700,
            marginBottom: 20, width: 'fit-content',
          }}>
            📍 {reel.tag}
          </span>

          {/* Description */}
          <p style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 14.5, lineHeight: 1.75,
            margin: '0 0 28px',
          }}>
            {reel.description}
          </p>

          {/* User + Likes */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 28,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>🌍</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{reel.user}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>❤️ {reel.likes} likes · {reel.location}</div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href={reel.tour}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#026eb5', color: 'white',
              borderRadius: 12, padding: '14px 28px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(20,83,45,0.5)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#166534'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(20,83,45,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#026eb5'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(20,83,45,0.5)'; }}
          >
            View Packages →
          </Link>

          {/* Navigation hint */}
          <p style={{
            color: 'rgba(255,255,255,0.25)', fontSize: 11,
            marginTop: 16, textAlign: 'center',
          }}>
            ↑↓ arrow keys, scroll, or swipe to navigate
          </p>
        </div>
      </div>

      {/* ── Up / Down navigation buttons (right side) ── */}
      <div style={{
        position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 12, zIndex: 10,
      }}>
        <button
          className="nav-btn"
          onClick={goPrev}
          disabled={current === 0}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            color: current === 0 ? 'rgba(255,255,255,0.2)' : 'white',
            fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: current === 0 ? 'default' : 'pointer',
            transition: 'all 0.2s',
          }}
          title="Previous (↑)"
        >
          ↑
        </button>
        <button
          className="nav-btn"
          onClick={goNext}
          disabled={current === total - 1}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            color: current === total - 1 ? 'rgba(255,255,255,0.2)' : 'white',
            fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: current === total - 1 ? 'default' : 'pointer',
            transition: 'all 0.2s',
          }}
          title="Next (↓)"
        >
          ↓
        </button>
      </div>

      {/* ── Keyboard hint bar at bottom ── */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {gramReels.map((r, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 'up' : 'down')}
            style={{
              width: 36, height: 36, borderRadius: 8,
              overflow: 'hidden', border: i === current
                ? '2px solid white'
                : '2px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', padding: 0,
              transition: 'all 0.2s',
              opacity: i === current ? 1 : 0.5,
              transform: i === current ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <img
              src={r.src}
              alt={r.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
