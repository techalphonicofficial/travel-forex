'use client';

import React from 'react';

const trustedPartners = [
  { id: 'vfs', name: 'VFS Global', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/VFS_Global_logo.svg' },
  { id: 'bls', name: 'BLS International', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/BLS_International_Logo.svg/1024px-BLS_International_Logo.svg.png' },
  { id: 'emirates', name: 'Emirates', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg' },
  { id: 'indigo', name: 'IndiGo', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/IndiGo_Airlines_logo.svg' },
  { id: 'airindia', name: 'Air India', logo: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Air_India_Logo.svg' },
  { id: 'etihad', name: 'Etihad Airways', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Etihad_Airways_Logo.svg' },
  { id: 'qatar', name: 'Qatar Airways', logo: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Qatar_Airways_Logo.svg' },
];

export default function TrustedPartners() {
  return (
    <section className="trusted-partners-container" style={{ margin: '60px 0' }}>
      <div className="container">
        <h3 style={{ textAlign: 'center', fontSize: 16, color: '#64748b', marginBottom: 32, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          Our Trusted Travel Partners
        </h3>
      </div>
      
      <div className="marquee-wrapper">
        <div className="marquee-track">
          {/* We duplicate the array 3 times to ensure smooth infinite scrolling */}
          {[...trustedPartners, ...trustedPartners, ...trustedPartners].map((partner, index) => (
            <div key={`${partner.id}-${index}`} className="marquee-item">
              <img 
                src={partner.logo} 
                alt={partner.name} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="marquee-fallback">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .trusted-partners-container {
          overflow: hidden;
          background: transparent;
        }
        .marquee-wrapper {
          position: relative;
          display: flex;
          overflow: hidden;
          user-select: none;
          width: 100%;
          mask-image: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%);
        }
        .marquee-track {
          display: flex;
          gap: 60px;
          align-items: center;
          padding: 10px 0;
          animation: scrollMarquee 35s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .marquee-item {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          min-width: 120px;
        }
        .marquee-item img {
          max-height: 100%;
          max-width: 140px;
          object-fit: contain;
          filter: grayscale(100%) opacity(0.65);
          transition: filter 0.3s ease;
        }
        .marquee-item:hover img {
          filter: grayscale(0%) opacity(1);
        }
        .marquee-fallback {
          display: none;
          font-weight: 800;
          font-size: 18px;
          color: #94a3b8;
          text-transform: uppercase;
        }
        @keyframes scrollMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 3));
          }
        }
        @media (max-width: 768px) {
          .marquee-track {
            gap: 40px;
            animation: scrollMarquee 25s linear infinite;
          }
        }
      `}</style>
    </section>
  );
}
