'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPackages, getMediaUrl } from '@/utils/api';
import InquiryForm from '@/components/InquiryForm';

const FALLBACK_PACKAGE_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80';

const normalizePackage = (pkg) => {
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

  const isDomestic = String(firstDestination?.type || '').toLowerCase() === 'domestic' || 
                     String(firstDestination?.name || '').toLowerCase() === 'india' ||
                     String(firstMapping?.city?.country?.name || '').toLowerCase() === 'india';

  return {
    id: pkg.id,
    slug: pkg.slug || String(pkg.id),
    destination: destinationName,
    title: pkg.name,
    locations,
    image,
    nights,
    price,
    isDomestic,
    rating: 4.7,
  };
};

export default function TabbedPackagesSection() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Primary Tabs: 'domestic' | 'international'
  const [activeRegion, setActiveRegion] = useState('domestic');
  // Secondary Tabs: destination names
  const [activeSubTab, setActiveSubTab] = useState('');
  
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getPackages();
        if (mounted) {
          const mapped = (data || []).map(normalizePackage);
          setPackages(mapped);
        }
      } catch (err) {
        console.warn('Error loading packages:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const domesticList = packages.filter(p => p.isDomestic);
  const internationalList = packages.filter(p => !p.isDomestic);

  const regionPackages = activeRegion === 'domestic' ? domesticList : internationalList;
  
  // Extract unique destinations for sub-tabs
  const subTabs = Array.from(new Set(regionPackages.map(p => p.destination))).filter(Boolean).slice(0, 10); // Top 10 destinations

  useEffect(() => {
    if (subTabs.length > 0 && !subTabs.includes(activeSubTab)) {
      setActiveSubTab(subTabs[0]);
    } else if (subTabs.length === 0) {
      setActiveSubTab('');
    }
  }, [activeRegion, subTabs, activeSubTab]);

  const displayedPackages = activeSubTab 
    ? regionPackages.filter(p => p.destination === activeSubTab).slice(0, 6)
    : regionPackages.slice(0, 6);

  return (
    <section style={{ padding: '0', background: 'transparent' }}>
      <div className="container">
        {/* Title */}
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, textAlign: 'center', color: 'var(--color-primary)' }}>
          Holidays
        </h2>

        {/* Primary Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(12px)',
            borderRadius: 999,
            padding: 6,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid rgba(255, 255, 255, 0.8)'
          }}>
            <button
              onClick={() => setActiveRegion('domestic')}
              style={{
                background: activeRegion === 'domestic' ? 'var(--color-primary)' : 'transparent', 
                border: 'none',
                padding: '12px 32px', borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                color: activeRegion === 'domestic' ? 'white' : 'var(--color-text-primary)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeRegion === 'domestic' ? '0 4px 12px rgba(2, 110, 181, 0.3)' : 'none'
              }}
            >
              India Tour Packages
            </button>
            <button
              onClick={() => setActiveRegion('international')}
              style={{
                background: activeRegion === 'international' ? 'var(--color-primary)' : 'transparent', 
                border: 'none',
                padding: '12px 32px', borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                color: activeRegion === 'international' ? 'white' : 'var(--color-text-primary)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeRegion === 'international' ? '0 4px 12px rgba(2, 110, 181, 0.3)' : 'none'
              }}
            >
              International Tour Packages
            </button>
          </div>
        </div>

        {/* Secondary Sub-tabs */}
        {subTabs.length > 0 && (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none', marginBottom: 24 }}>
            {subTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                style={{
                  padding: '10px 24px', borderRadius: 999, border: '1px solid', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  borderColor: activeSubTab === tab ? 'transparent' : 'rgba(255, 255, 255, 0.6)',
                  background: activeSubTab === tab ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(8px)',
                  color: activeSubTab === tab ? 'white' : 'var(--color-text-primary)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: activeSubTab === tab ? '0 6px 12px rgba(2, 110, 181, 0.3)' : 'none',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Packages Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 280px)', gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} style={{ background: '#e2e8f0', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : displayedPackages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>No packages found for {activeSubTab || 'this region'}.</div>
        ) : (
          <div className="magazine-grid">
            <style>{`
              .magazine-grid {
                display: grid;
                grid-template-columns: repeat(12, 1fr);
                gap: 20px;
                grid-auto-rows: 280px;
              }
              .mag-card {
                position: relative;
                border-radius: 16px;
                overflow: hidden;
                text-decoration: none;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
              }
              .mag-card:hover {
                transform: translateY(-6px);
                box-shadow: 0 16px 32px rgba(0,0,0,0.15);
              }
              
              /* Dynamic Bento Spans */
              .span-12 { grid-column: span 12; grid-row: span 1; }
              .span-6 { grid-column: span 6; grid-row: span 1; }
              .span-4 { grid-column: span 4; grid-row: span 1; }
              .span-3 { grid-column: span 3; grid-row: span 1; }
              .span-8 { grid-column: span 8; grid-row: span 1; }
              .span-2-tall { grid-column: span 6; grid-row: span 2; } /* Only used if needed */
              
              .mag-img-wrap {
                position: absolute;
                inset: 0;
                z-index: 1;
              }
              .mag-img {
                transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .mag-card:hover .mag-img {
                transform: scale(1.08);
              }
              .mag-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%);
                z-index: 2;
              }
              .mag-content {
                position: relative;
                z-index: 3;
                padding: 24px;
              }
              .mag-title {
                font-size: 20px;
                font-weight: 800;
                color: white;
                margin: 0 0 12px;
                line-height: 1.2;
                font-family: 'Poppins', sans-serif;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              .mag-card-0 .mag-title, .mag-card-2 .mag-title {
                font-size: 26px;
              }
              .mag-meta {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .mag-duration {
                font-size: 13px;
                color: rgba(255,255,255,0.9);
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
              }
              .mag-price {
                font-size: 22px;
                font-weight: 800;
                color: var(--color-secondary);
              }

              .explore-btn {
                position: absolute;
                bottom: 24px;
                right: 24px;
                background: var(--color-primary);
                color: white;
                border-radius: 50%;
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transform: translateX(20px);
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: 0 4px 12px rgba(2, 110, 181, 0.4);
              }
              
              .mag-card:hover .explore-btn {
                opacity: 1;
                transform: translateX(0);
              }
              
              @media (max-width: 1024px) {
                .magazine-grid {
                  grid-template-columns: repeat(2, 1fr);
                  grid-template-rows: auto;
                }
                .span-12, .span-6, .span-4, .span-3, .span-8, .span-2-tall {
                  grid-column: span 12;
                  grid-row: span 1;
                }
              }
              @media (max-width: 640px) {
                .magazine-grid {
                  grid-template-columns: 1fr;
                }
              }
            `}</style>
            
            {displayedPackages.map((pkg, index) => {
              const total = displayedPackages.length;
              const getBentoClass = (index, total) => {
                if (total === 1) return 'span-12';
                if (total === 2) return 'span-6';
                if (total === 3) return 'span-4';
                if (total === 4) return 'span-6';
                if (total === 5) return index < 2 ? 'span-6' : 'span-4';
                if (total === 6) return (index === 0 || index === 5) ? 'span-6' : 'span-3';
                return 'span-4';
              };
              const cardClass = getBentoClass(index, total);

              return (
                <Link key={pkg.id} href={`/tours/${pkg.slug}`} className={`mag-card ${cardClass}`}>
                  <div className="mag-img-wrap">
                    <Image 
                      src={pkg.image} 
                      alt={pkg.title} 
                      fill 
                      style={{ objectFit: 'cover' }} 
                      sizes="(max-width: 768px) 100vw, 33vw" 
                      className="mag-img"
                    />
                    <div className="mag-overlay" />
                  </div>
                  
                  <div className="mag-content">
                    <h3 className="mag-title">{pkg.title}</h3>
                    <div className="mag-meta">
                      <div className="mag-duration">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        {pkg.nights}N / {pkg.nights + 1}D
                      </div>
                      <div className="mag-price">
                        ₹{pkg.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="explore-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <InquiryForm
        title="Can't find your destination?"
        subtitle="Tell us where you want to go — we'll build a custom package just for you."
        serviceName="Custom Holiday Package"
        variant="strip"
        showDate
      />
    </section>
  );
}
