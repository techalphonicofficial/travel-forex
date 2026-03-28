'use client';
import React from 'react';
import { useState } from 'react';
import Link from 'next/link';

function PytExclusiveCard({ title, oldPrice, newPrice, images, subTitle, listItems }) {
  const [idx, setIdx] = useState(0);

  const nextImg = (e) => {
    e.preventDefault();
    setIdx((i) => (i + 1) % images.length);
  };

  const prevImg = (e) => {
    e.preventDefault();
    setIdx((i) => (i - 1 + images.length) % images.length);
  };

  return (
    <div style={{
      width: 340, background: '#1c222e', borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid #2d3748'
    }}>
      {/* Image Block */}
      <div style={{ width: '100%', height: 200, position: 'relative' }}>
        <img src={images[idx]} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s ease' }} alt={title} />
        <div onClick={prevImg} style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', width: 28, height: 28, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', color: '#111827', fontSize: 12 }}>❮</div>
        <div onClick={nextImg} style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', width: 28, height: 28, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', color: '#111827', fontSize: 12 }}>❯</div>
      </div>

      {/* Content Block */}
      <div style={{ padding: '20px 16px', flex: 1 }}>
        <h4 style={{ color: 'white', margin: '0 0 8px', fontSize: 16, fontWeight: 700, textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
          {title}
        </h4>
        <div style={{ color: '#9ca3af', fontSize: 11, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          <span>⚲</span> {subTitle}
        </div>

        <div style={{ color: '#d1d5db', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {listItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: '#fbbf24' }}>✨</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Divider */}
      <div style={{ position: 'relative', borderTop: '1px dashed #4b5563', margin: '0 16px' }}>
        <div style={{ position: 'absolute', left: -24, top: -8, width: 16, height: 16, background: '#0a0a0a', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: -24, top: -8, width: 16, height: 16, background: '#0a0a0a', borderRadius: '50%' }} />
      </div>

      {/* Footer / Price */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#222938' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            {oldPrice && <span style={{ color: '#6b7280', fontSize: 11, textDecoration: 'line-through' }}>{oldPrice}</span>}
            <span style={{ color: 'white', fontSize: 18, fontWeight: 800 }}>{newPrice}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {oldPrice && <span style={{ background: '#ef4444', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>16% OFF</span>}
            <span style={{ color: '#9ca3af', fontSize: 10 }}>5 nights / person</span>
          </div>
        </div>
        <button style={{ background: '#a3e635', color: '#111827', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = '#84cc16'} onMouseLeave={e => e.target.style.background = '#a3e635'}>
          View Itinerary
        </button>
      </div>
    </div>
  );
}

/* 1. PYT Exclusive Section */
export function PytExclusive() {
  return (
    <div style={{ background: '#0a0a0a', padding: '60px 24px', position: 'relative', zIndex: 10 }}>
      <div className='container' style={{ margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center', alignItems: 'center' }}>

        {/* PYT TITLE column */}
        <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', color: '#fbbf24', fontSize: 36, fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, margin: 0, textAlign: 'center' }}>
            PYT<br />EXCLUSIVES<span style={{ fontSize: 20, verticalAlign: 'super' }}>✨</span>
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '20px 0 16px' }}>
            <div style={{ width: 15, height: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ width: 6, height: 6, background: 'rgba(255,255,255,0.2)', transform: 'rotate(45deg)' }} />
            <div style={{ width: 15, height: 1, background: 'rgba(255,255,255,0.2)' }} />
          </div>

          <p style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            Featuring our sooper hit itineraries<br />just for you
          </p>

          <div style={{ width: '100%', marginTop: 40, display: 'flex', justifyContent: 'flex-start' }}>
            <svg width="200" height="80" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 70 C30 80, 40 40, 50 60 C60 80, 70 70, 80 50 C100 0, 150 70, 200 10" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className='col-xl-8 col-md-12 col-sm-12 col-12'>
          <div className='d-flex flex-wrap gap-4'>
            <PytExclusiveCard
              title="Sooper hit Bali Getaway: Ubud & Kuta"
              oldPrice="₹38,941"
              newPrice="₹32,122"
              subTitle="5 nights: Ubud (2N) › Kuta (3N)"
              images={['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=500&q=80', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&q=80', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&q=80']}
              listItems={['West Nusa Penida Private Tour with Retur...', 'West Nusa Penida - 3 Point Snorkeling & 2 ...']}
            />

            <PytExclusiveCard
              title="Best of Bali - 5 Nights"
              newPrice="₹36,531"
              subTitle="5 nights: Ubud (2N) › Kuta (3N)"
              images={['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=500&q=80', 'https://images.unsplash.com/photo-1551183053-ec9180cbd78e?w=500&q=80']}
              listItems={['West Nusa Penida Private Tour with Retur...', 'Bali ATV Tandem Ride Adventure with Priva...']}
            />

          </div>

        </div>


      </div>
    </div>
  );
}

/* 2. Trust Banner (Mint green background with traveler avatars) */
export function TrustBanner() {
  return (
    <div style={{ background: 'linear-gradient(to right, #ecfdf5, #f0fdfa, #f8fafc)', padding: '24px 0', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>

        {/* Excellence Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28 }}>🏆</span>
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#111827', fontSize: 20, fontWeight: 800, fontFamily: 'Poppins, sans-serif' }}>No.1</h3>
            <p style={{ margin: 0, color: '#059669', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customized Holiday Planner</p>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 11 }}>in India & globally</p>
          </div>
        </div>

        {/* Traveler 1 */}
        <div style={{ display: 'flex', gap: 12, background: 'white', padding: '12px 16px', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 44, height: 44, background: '#f97316', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>A</div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#111827' }}>Anjali S.</p>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>"Perfectly planned Bali honeymoon!"</p>
            <div style={{ display: 'flex', gap: 2, marginTop: 4, color: '#fbbf24', fontSize: 10 }}>★★★★★</div>
          </div>
        </div>

        {/* Traveler 2 */}
        <div style={{ display: 'flex', gap: 12, background: 'white', padding: '12px 16px', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 44, height: 44, background: '#8b5cf6', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>R</div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#111827' }}>Rahul V.</p>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>"Seamless Europe family trip."</p>
            <div style={{ display: 'flex', gap: 2, marginTop: 4, color: '#fbbf24', fontSize: 10 }}>★★★★★</div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* 3. Brands Row */
export function BrandsRow() {
  const brands = ['Tourism Australia', 'Saudi', 'Visit Dubai', 'Singapore', 'VFS Global', 'Emirates', 'Marriott', 'Qatar Airways'];
  return (
    <div style={{ background: '#fff', padding: '40px 0', borderTop: '1px dashed #e5e7eb', borderBottom: '1px dashed #e5e7eb' }}>
      <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6b7280', marginBottom: 24 }}>
        Brands we've partnered with
      </p>
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', padding: '0 24px', opacity: 0.5, filter: 'grayscale(100%)' }}>
        {brands.map(b => (
          <div key={b} style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>{b}</div>
        ))}
      </div>
    </div>
  );
}

/* 4. Google Reviews Block */
export function BottomReviews({ destination }) {
  return (
    <div style={{ background: '#f8fafc', padding: '64px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 40, flexWrap: 'wrap' }}>

        {/* Left Side: Summary */}
        <div style={{ flex: '1 1 300px' }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', color: '#111827', fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
            Reviews for {destination} packages
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#111827', lineHeight: 1 }}>4.9</span>
            <div>
              <div style={{ color: '#fbbf24', fontSize: 16, marginBottom: 4 }}>★★★★★</div>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Based on 4,289 reviews</p>
            </div>
          </div>
          <div style={{ height: 16, width: 100, background: 'url(https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg) no-repeat left center/contain', marginTop: 12 }} />
        </div>

        {/* Right Side: Scrollable Reviews */}
        <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e40af', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>R</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Ramanathan Iyer</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>3 days ago</p>
                  </div>
                </div>
                <div style={{ color: '#fbbf24', fontSize: 12 }}>★★★★★</div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                "The entire {destination} trip was orchestrated perfectly by the ITS TRAVELS AND TOURS team. From airport transfers to the stunning resort stay and daily activities, everything was seamless. Highly recommend their app for real-time concierge support!"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Small utility to handle link props
const getCustomLink = (dest, trav) => {
  const params = new URLSearchParams();
  if (dest) params.set('dest', dest === 'Worldwide' ? '' : dest);
  if (trav) params.set('traveller', trav);
  return `/customize?${params.toString()}`;
};

/* 5. Custom PYT Grid Component (for Budget & Duration Sections) */
function PytPackageCard({ pkg }) {
  const [imgIdx, setImgIdx] = React.useState(0);

  // We mock a few extra images for the slider if the package only has one
  const images = [
    pkg.img,
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80",
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80"
  ];

  const handlePrev = (e) => {
    e.stopPropagation();
    setImgIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setImgIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div style={{
      borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', background: '#fff',
      display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s'
    }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

      {/* Image Section */}
      <div style={{ height: 200, position: 'relative' }}>
        <img src={images[imgIdx]} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Prev/Next arrows mock */}
        <div onClick={handlePrev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, background: 'rgba(255,255,255,0.8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, userSelect: 'none' }}>❮</div>
        <div onClick={handleNext} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, background: 'rgba(255,255,255,0.8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, userSelect: 'none' }}>❯</div>

        {/* Dots */}
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
          {images.map((_, dotIdx) => (
            <div key={dotIdx} style={{ width: 6, height: 6, borderRadius: '50%', background: dotIdx === imgIdx ? 'white' : 'rgba(255,255,255,0.5)' }} />
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div style={{ padding: '16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {pkg.title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pkg.location}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#047857" stroke="#047857" style={{ marginTop: 2, flexShrink: 0 }}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
          <p style={{ margin: 0, fontSize: 13, color: '#374151', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
            <b style={{ color: '#047857' }}>Picks: </b>{pkg.picks}
          </p>
        </div>
      </div>

      {/* Price & Action Section */}
      <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          {pkg.oldPrice && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{pkg.oldPrice}</span>
              <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{pkg.discount}</span>
            </div>
          )}
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{pkg.price}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{pkg.nights} nights / person</div>
        </div>
        <Link
          href={getCustomLink(pkg.location.split('(')[0].trim(), pkg.isFamily ? 'Family' : null)}
          style={{ textDecoration: 'none' }}
        >
          <button style={{ background: '#fbbf24', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Customize Itinerary
          </button>
        </Link>
      </div>

    </div>
  );
}

function PytPackageGrid({ title, tabs, defaultActiveTab, packages, isFamily, destName }) {
  const [activeTab, setActiveTab] = React.useState(defaultActiveTab || 0);

  // We mock the filtering effect by shifting the packages order so the UI naturally updates
  const displayPackages = React.useMemo(() => {
    if (activeTab === 0) return packages.slice(0, 5);
    if (activeTab === 1) return [...packages].reverse().slice(0, 5);
    return [...packages.slice(2, 5), ...packages.slice(0, 2)];
  }, [activeTab, packages]);

  return (
    <div style={{ marginBottom: 64 }}>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
        {title}
      </h2>

      {/* Pills Container */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((tab, idx) => {
          const isActive = idx === activeTab;
          return (
            <div key={idx} onClick={() => setActiveTab(idx)} style={{
              padding: '6px 16px', borderRadius: 24, border: isActive ? '1px solid #026eb5' : '1px solid #e5e7eb',
              background: isActive ? '#026eb5' : 'white', color: isActive ? 'white' : '#4b5563',
              fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none'
            }}>
              {tab}
            </div>
          );
        })}
      </div>

      {/* Grid Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {displayPackages.map((pkg, i) => (
          <PytPackageCard key={`${activeTab}-${i}`} pkg={{ ...pkg, isFamily }} />
        ))}

        {/* 6th Card: Build Your Own */}
        <div style={{
          borderRadius: 12, border: '1px dashed #f59e0b', background: '#fffbeb', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤔</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8, fontFamily: 'Poppins, sans-serif' }}>Don't see the perfect fit?</h3>
          <p style={{ fontSize: 15, color: '#4b5563', marginBottom: 24, lineHeight: 1.5 }}>Build your perfect trip, your way.</p>
          <Link href={getCustomLink(destName)} style={{ textDecoration: 'none' }}>
            <button style={{ background: 'transparent', border: '1px solid #fbbf24', color: '#fbbf24', padding: '10px 24px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = 'white' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#10b981' }}>
              Start Building your Itinerary →
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}

/* 6. Main Exported Wrap */
export function CategoryBlocks({ destination }) {
  const destName = destination === 'All' ? 'Worldwide' : destination;

  // Mock Data identical to the PYT screenshot
  const familyPackages = [
    { img: "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=400&q=80", title: `7 Nights ${destName} Family Adrenaline & Theme Parks`, location: "Kuta (4N), Ubud (3N)", picks: "Bali Safari and Marine Park, Waterbom Bali, Monkey Forest...", price: "₹68,450", oldPrice: "₹75,000", discount: "8% OFF", nights: 7 },
    { img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", title: `5 Nights ${destName} Relaxing Resort Stay`, location: "Nusa Dua (5N)", picks: "Private Beach Access, Kids Club full day pass, Glass Bottom Boat...", price: "₹85,100", oldPrice: null, discount: null, nights: 5 },
    { img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80", title: `4 Nights ${destName} Quick Family Break`, location: "Seminyak (4N)", picks: "Tanah Lot Sunset Tour, Family Photoshoot at the Beach...", price: "₹42,300", oldPrice: "₹50,000", discount: "15% OFF", nights: 4 },
    { img: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=400&q=80", title: `6 Nights ${destName} Culture & Fun Tour`, location: "Ubud (2N), Kuta (4N)", picks: "Bali Bird Park, Gianyar Night Market Food Tour, Silver making class...", price: "₹56,200", oldPrice: null, discount: null, nights: 6 },
    { img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80", title: `The Ultimate ${destName} Family Experience`, location: "Ubud (4N), Nusa Dua (3N)", picks: "Elephant Cave Tour, VIP Airport Transfer, Private Chef for 1 dinner...", price: "₹95,000", oldPrice: null, discount: null, nights: 7 },
  ];
  const budgetPackages = [
    { img: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=400&q=80", title: "Bali Complete Story: Wellness & Wonders - 6N", location: "Ubud (3N), Kuta (3N)", picks: "West Nusa Penida Tour with One point snorkelling and complimentary Indian Lunch...", price: "₹50,148", oldPrice: null, discount: null, nights: 6 },
    { img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80", title: "Romantic Tropical Getaway to Bali for 7N - Say #OhYes", location: "Ubud (3N), Nusa Penida (1N), Kuta (3N)", picks: "Guided Nature Tour: Kintamani Volcano View Spot, Coffee Plantation...", price: "₹64,229", oldPrice: "₹85,638", discount: "25% OFF", nights: 7 },
    { img: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&q=80", title: `Fantastic 7 Nights ${destName} Package From Hyderabad`, location: "Ubud (2N), Kuta (3N), Nusa Dua (2N)", picks: "Kintamani Volcano Viewpoint, Tegenungan Water Fall, Coffee Plantation...", price: "₹57,134", oldPrice: null, discount: null, nights: 7 },
    { img: "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=400&q=80", title: `Epic 7 Nights Delhi To ${destName} Package`, location: "Ubud (3N), Gili Trawangan (1N), Seminyak (3N)", picks: "Kintamani Volcano Viewpoint, Tegenungan Water Fall, Coffee Plantation...", price: "₹65,355", oldPrice: null, discount: null, nights: 7 },
    { img: "https://images.unsplash.com/photo-1513581166358-b66d2e64ca39?w=400&q=80", title: `Amazing 7 Nights Delhi To ${destName} Package`, location: "Ubud (3N), Gili Trawangan (1N), Seminyak (3N)", picks: "Kintamani Volcano Viewpoint, Tegenungan Water Fall, Coffee Plantation...", price: "₹70,388", oldPrice: null, discount: null, nights: 7 },
  ];

  const durationPackages = [
    { img: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&q=80", title: "The Epic Bali Story: Kuta & Ubud - 6N", location: "Kuta (4N), Ubud (2N)", picks: "West Nusa Penida Tour with One point snorkelling and complimentary Indian Lunch...", price: "₹51,860", oldPrice: null, discount: null, nights: 6 },
    { img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80", title: "Bali Thrills Serenity Adventure Relaxation", location: "Ubud (3N), Kuta (3N)", picks: "West Nusa Penida (Angle Billabong, Crystal Bay, Broken Beach, Kelingking Beach)...", price: "₹43,520", oldPrice: "₹51,810", discount: "16% OFF", nights: 6 },
    { img: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=400&q=80", title: "Bali Thrills & Serenity: Kuta to Ubud Adventure", location: "Kuta (3N), Ubud (3N)", picks: "West Nusa Penida Private Tour with Return Boat Tickets and Lunch, West Nusa...", price: "₹41,112", oldPrice: null, discount: null, nights: 6 },
    { img: "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=400&q=80", title: "Bali Thrills & Serenity: A Perfect Blend of Adventure...", location: "Ubud (3N), Kuta (3N)", picks: "West Nusa Penida Private Tour with Return Boat Tickets and Lunch, West Nusa...", price: "₹44,050", oldPrice: null, discount: null, nights: 6 },
    { img: "https://images.unsplash.com/photo-1513581166358-b66d2e64ca39?w=400&q=80", title: `Popular 6 Nights ${destName} Tour Packages from...`, location: "Ubud (2N), Gili Trawangan (1N), Kuta (3N)", picks: "Combo: Ayung River Rafting, Kintamani Village Tour and Coffee Plantation Visit...", price: "₹48,220", oldPrice: null, discount: null, nights: 6 },
  ];

  return (
    <div style={{ background: '#fff', padding: '64px 0px' }}>
      <div className='container' style={{ margin: '0 auto' }}>

        {/* Family Section */}
        <PytPackageGrid
          title={`👨‍👩‍👧 Family packages to ${destName}`}
          tabs={['Toddler Friendly', 'Teens Recommended', 'Multi-Generation']}
          activeTab={0}
          packages={familyPackages}
          isFamily={true}
          destName={destName}
        />

        {/* Budget Section */}
        <PytPackageGrid
          title="Packages by Budget"
          tabs={['₹50,000 - ₹75,000', '₹75,000 - ₹1,00,000', '₹0 - ₹50,000']}
          activeTab={0}
          packages={budgetPackages}
          destName={destName}
        />

        {/* Duration Section */}
        <PytPackageGrid
          title="Packages by Duration"
          tabs={['4 Days', '5 Days', '6 Days']}
          activeTab={2}
          packages={durationPackages}
          destName={destName}
        />

      </div>
    </div>
  );
}
