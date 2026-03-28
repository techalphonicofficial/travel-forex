'use client';

import HeroSearchBar from '@/components/HeroSearchBar';

const popularTags = ['🏖️ Bali', '🗻 Switzerland', '🌸 Japan', '🦁 Safari', '🏛️ Europe'];

export default function HeroSection() {
  return (
    <section className="hero-section" style={{ minHeight: '100vh' }}>
      {/* Inline server-safe background via CSS */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=75)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Overlay */}
      <div className="hero-overlay" />

      {/* Floating badges */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          right: '8%',
          zIndex: 2,
          animation: 'float 6s ease-in-out infinite',
        }}
      >
        <div className="card-glass" style={{ padding: '12px 16px', color: 'white', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>⭐</span>
          <div>
            <div style={{ fontWeight: 700 }}>4.9/5 Rating</div>
            <div style={{ opacity: 0.7, fontSize: 11 }}>50K+ Reviews</div>
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '30%',
          left: '5%',
          zIndex: 2,
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      >
        <div className="card-glass" style={{ padding: '12px 16px', color: 'white', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>✈️</span>
          <div>
            <div style={{ fontWeight: 700 }}>120+ Destinations</div>
            <div style={{ opacity: 0.7, fontSize: 11 }}>Worldwide</div>
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div
        className="hero-content"
        style={{ width: '100%', maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}
      >
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 999,
            padding: '6px 18px',
            fontSize: 13,
            fontWeight: 600,
            color: 'white',
            marginBottom: 20,
            letterSpacing: 0.5,
          }}
        >
          🌍 &nbsp;Explore The World With Us
        </span>

        <h1 className="hero-title">
          Your Dream Journey
          <br />
          <span style={{ color: '#ffd700' }}>Starts Here</span>
        </h1>
        <p className="hero-subtitle">
          Handcrafted travel experiences to 120+ destinations. Luxury tours, beach escapes, cultural adventures — tailored just for you.
        </p>

        {/* Search Bar */}
        <HeroSearchBar />

        {/* Quick Tags */}
        <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap mt-5">
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Popular:</span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 999,
                padding: '6px 14px',
                color: 'white',
                fontSize: 13,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          animation: 'bounce 2s infinite',
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>Scroll</span>
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </section>
  );
}
