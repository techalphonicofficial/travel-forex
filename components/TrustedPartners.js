'use client';

import React from 'react';

const partnersMap = {
  default: [
    { id: 'emirates', name: 'Emirates', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg' },
    { id: 'indigo', name: 'IndiGo', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/IndiGo_Airlines_logo.svg' },
    { id: 'airindia', name: 'Air India', logo: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Air_India_Logo.svg' },
    { id: 'tataaig', name: 'TATA AIG', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Tata_AIG_General_Insurance_Logo.svg/1024px-Tata_AIG_General_Insurance_Logo.svg.png' },
    { id: 'singapore', name: 'Singapore Airlines', logo: 'https://upload.wikimedia.org/wikipedia/en/1/18/Singapore_Airlines_logo.svg' },
    { id: 'bajaj', name: 'BAJAJ ALLIANZ', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bajaj_Allianz_Life_Insurance_Company_Limited_Logo.svg' },
    { id: 'vistara', name: 'Vistara', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Vistara_Logo.svg' }
  ],
  insurance: [
    { id: 'bajaj', name: 'BAJAJ ALLIANZ', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bajaj_Allianz_Life_Insurance_Company_Limited_Logo.svg' },
    { id: 'icici', name: 'ICICI', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/07/ICICI_Lombard_logo.svg' },
    { id: 'tataaig', name: 'TATA AIG', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Tata_AIG_General_Insurance_Logo.svg/1024px-Tata_AIG_General_Insurance_Logo.svg.png' },
    { id: 'reliance', name: 'RELIANCE', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Reliance_General_Insurance_Logo.svg/1024px-Reliance_General_Insurance_Logo.svg.png' }
  ],
  airlines: [
    { id: 'airindia', name: 'Air India', logo: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Air_India_Logo.svg' },
    { id: 'indigo', name: 'IndiGo', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/IndiGo_Airlines_logo.svg' },
    { id: 'vistara', name: 'Vistara', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Vistara_Logo.svg' },
    { id: 'spicejet', name: 'SpiceJet', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/SpiceJet_logo.svg' },
    { id: 'akasa', name: 'Akasa Air', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Akasa_Air_logo.svg/1024px-Akasa_Air_logo.svg.png' },
    { id: 'emirates', name: 'Emirates', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg' },
    { id: 'singapore', name: 'Singapore Airlines', logo: 'https://upload.wikimedia.org/wikipedia/en/1/18/Singapore_Airlines_logo.svg' },
    { id: 'qatar', name: 'Qatar Airways', logo: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Qatar_Airways_Logo.svg' },
    { id: 'etihad', name: 'Etihad Airways', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Etihad_Airways_logo.svg' },
    { id: 'lufthansa', name: 'Lufthansa', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lufthansa_Logo_2018.svg' },
    { id: 'british', name: 'British Airways', logo: 'https://upload.wikimedia.org/wikipedia/en/4/42/British_Airways_Logo.svg' }
  ]
};

export default function TrustedPartners({ category = 'default', customPartners = null, title = null }) {
  const currentPartners = customPartners || partnersMap[category] || partnersMap.default;

  return (
    <section className="trusted-partners-container" style={{ margin: '60px 0' }}>
      <div className="container">
        <h3 style={{ textAlign: 'center', fontSize: 16, color: '#64748b', marginBottom: 32, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          {title || `Our Trusted ${category === 'insurance' ? 'Insurance' : category === 'airlines' ? 'Airline' : 'Travel'} Partners`}
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
          height: 75px;
          min-width: 180px;
        }
        .marquee-item img {
          max-height: 100%;
          max-width: 180px;
          object-fit: contain;
          transition: opacity 0.3s ease;
        }
        .marquee-item:hover img {
          opacity: 0.8;
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
