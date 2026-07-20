'use client';

import React from 'react';

const partnersMap = {
  default: [
    { id: 'vfs', name: 'VFS Global', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/VFS_Global_logo.svg' },
    { id: 'bls', name: 'BLS International', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/BLS_International_Logo.svg/1024px-BLS_International_Logo.svg.png' },
    { id: 'emirates', name: 'Emirates', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg' },
    { id: 'indigo', name: 'IndiGo', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/IndiGo_Airlines_logo.svg' },
    { id: 'airindia', name: 'Air India', logo: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Air_India_Logo.svg' }
  ],
  insurance: [
    { id: 'bajaj', name: 'BAJAJ ALLIANZ', logo: 'https://logo.clearbit.com/bajajallianz.com' },
    { id: 'icici', name: 'ICICI', logo: 'https://logo.clearbit.com/icicilombard.com' },
    { id: 'tataaig', name: 'TATA AIG', logo: 'https://logo.clearbit.com/tataaig.com' },
    { id: 'reliance', name: 'RELIANCE', logo: 'https://logo.clearbit.com/reliancegeneral.co.in' }
  ],
  airlines: [
    { id: 'airindia', name: 'Air India', logo: 'https://logo.clearbit.com/airindia.in' },
    { id: 'indigo', name: 'IndiGo', logo: 'https://logo.clearbit.com/goindigo.in' },
    { id: 'vistara', name: 'Vistara', logo: 'https://logo.clearbit.com/airvistara.com' },
    { id: 'spicejet', name: 'SpiceJet', logo: 'https://logo.clearbit.com/spicejet.com' },
    { id: 'akasa', name: 'Akasa Air', logo: 'https://logo.clearbit.com/akasaair.com' },
    { id: 'emirates', name: 'Emirates', logo: 'https://logo.clearbit.com/emirates.com' },
    { id: 'singapore', name: 'Singapore Airlines', logo: 'https://logo.clearbit.com/singaporeair.com' },
    { id: 'qatar', name: 'Qatar Airways', logo: 'https://logo.clearbit.com/qatarairways.com' },
    { id: 'etihad', name: 'Etihad Airways', logo: 'https://logo.clearbit.com/etihad.com' },
    { id: 'lufthansa', name: 'Lufthansa', logo: 'https://logo.clearbit.com/lufthansa.com' },
    { id: 'british', name: 'British Airways', logo: 'https://logo.clearbit.com/britishairways.com' },
    { id: 'thai', name: 'Thai Airways', logo: 'https://logo.clearbit.com/thaiairways.com' },
    { id: 'cathay', name: 'Cathay Pacific', logo: 'https://logo.clearbit.com/cathaypacific.com' },
    { id: 'turkish', name: 'Turkish Airlines', logo: 'https://logo.clearbit.com/turkishairlines.com' },
    { id: 'malaysia', name: 'Malaysia Airlines', logo: 'https://logo.clearbit.com/malaysiaairlines.com' },
    { id: 'airfrance', name: 'Air France', logo: 'https://logo.clearbit.com/airfrance.com' },
    { id: 'klm', name: 'KLM Royal Dutch', logo: 'https://logo.clearbit.com/klm.com' },
    { id: 'virgin', name: 'Virgin Atlantic', logo: 'https://logo.clearbit.com/virginatlantic.com' },
    { id: 'ryanair', name: 'Ryanair', logo: 'https://logo.clearbit.com/ryanair.com' },
    { id: 'easyjet', name: 'EasyJet', logo: 'https://logo.clearbit.com/easyjet.com' },
    { id: 'ana', name: 'All Nippon Airways (ANA)', logo: 'https://logo.clearbit.com/ana.co.jp' },
    { id: 'vietnam', name: 'Vietnam Airlines', logo: 'https://logo.clearbit.com/vietnamairlines.com' },
    { id: 'philippine', name: 'Philippine Airlines', logo: 'https://logo.clearbit.com/philippineairlines.com' },
    { id: 'egyptair', name: 'EgyptAir', logo: 'https://logo.clearbit.com/egyptair.com' },
    { id: 'ethiopian', name: 'Ethiopian Airlines', logo: 'https://logo.clearbit.com/ethiopianairlines.com' },
    { id: 'airindiaexpress', name: 'Air India Express', logo: 'https://logo.clearbit.com/airindiaexpress.in' },
    { id: 'allianceair', name: 'Alliance Air', logo: 'https://logo.clearbit.com/allianceair.in' }
  ]
};

export default function TrustedPartners({ category = 'default' }) {
  const currentPartners = partnersMap[category] || partnersMap.default;

  return (
    <section className="trusted-partners-container" style={{ margin: '60px 0' }}>
      <div className="container">
        <h3 style={{ textAlign: 'center', fontSize: 16, color: '#64748b', marginBottom: 32, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          Our Trusted {category === 'insurance' ? 'Insurance' : category === 'airlines' ? 'Airline' : 'Travel'} Partners
        </h3>
      </div>
      
      <div className="marquee-wrapper">
        <div className="marquee-track" style={{ animationDuration: category === 'airlines' ? '80s' : '35s' }}>
          {/* We duplicate the array to ensure smooth infinite scrolling */}
          {[...currentPartners, ...currentPartners, ...currentPartners, ...currentPartners].map((partner, index) => (
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
          font-size: 16px;
          color: #94a3b8;
          text-transform: uppercase;
          white-space: nowrap;
        }
        @keyframes scrollMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 4));
          }
        }
        @media (max-width: 768px) {
          .marquee-track {
            gap: 40px;
          }
        }
      `}</style>
    </section>
  );
}
