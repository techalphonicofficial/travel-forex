'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const tourTypes = ['All', 'Beach', 'Adventure', 'Cultural', 'Luxury', 'Safari'];
const tabs = [
  { id: 'holidays', label: 'Holidays', icon: '🌴' },
  { id: 'forex', label: 'Forex', icon: '💱' },
  { id: 'flights', label: 'Flights', icon: '✈️' },
  { id: 'hotels', label: 'Hotels', icon: '🏨' },
];

export default function HeroSearchBar() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('holidays');
  
  const [form, setForm] = useState({
    destination: '',
    date: '',
    travelers: '2',
    type: 'All',
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'holidays') {
      const params = new URLSearchParams();
      if (form.destination) params.set('destination', form.destination);
      if (form.date) params.set('date', form.date);
      if (form.travelers) params.set('travelers', form.travelers);
      if (form.type && form.type !== 'All') params.set('type', form.type);
      router.push(`/tour?${params.toString()}`);
    } else if (activeTab === 'forex') {
      router.push(`/forex`);
    } else if (activeTab === 'flights') {
       window.location.hash = '#flight';
    } else if (activeTab === 'hotels') {
      router.push(`/hotels`);
    }
  };

  return (
    <div className="hero-search-widget-container" style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      maxWidth: '1000px',
      margin: '0 auto',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', background: '#fafafa', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '16px 12px',
              border: 'none',
              background: activeTab === tab.id ? 'white' : 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : '#64748b',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSearch} className="hero-search-card" style={{ boxShadow: 'none', margin: 0, borderRadius: 0, padding: '24px' }} noValidate>
        {activeTab === 'holidays' && (
          <>
            {/* Destination */}
            <div className="search-field" style={{ flex: 2 }}>
              <label className="search-field-label" htmlFor="search-destination">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" style={{ color: 'var(--color-primary)' }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  Destination
                </span>
              </label>
              <input
                id="search-destination"
                className="search-field-input"
                type="text"
                placeholder="Where do you want to go?"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
              />
            </div>

            <div className="search-divider" />

            {/* Date */}
            <div className="search-field">
              <label className="search-field-label" htmlFor="search-date">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" style={{ color: 'var(--color-primary)' }}>
                    <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" />
                  </svg>
                  Date
                </span>
              </label>
              <input
                id="search-date"
                className="search-field-input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="search-divider" />

            {/* Travelers */}
            <div className="search-field">
              <label className="search-field-label" htmlFor="search-travelers">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" style={{ color: 'var(--color-primary)' }}>
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  Travelers
                </span>
              </label>
              <select
                id="search-travelers"
                className="search-field-input"
                value={form.travelers}
                onChange={(e) => setForm({ ...form, travelers: e.target.value })}
                style={{ cursor: 'pointer' }}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Person' : 'People'}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-divider" />

            {/* Tour Type */}
            <div className="search-field">
              <label className="search-field-label" htmlFor="search-type">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" style={{ color: 'var(--color-primary)' }}>
                    <path d="M21 6.5l-4-4-10 10-3 1 1-3 10-10zM5 16H3v5h5v-2H5v-3zm1-1l1.5-1.5L9 15l-1.5 1.5L6 15zm13 0l-1.5-1.5L16 15l1.5 1.5L19 15z" />
                  </svg>
                  Tour Type
                </span>
              </label>
              <select
                id="search-type"
                className="search-field-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ cursor: 'pointer' }}
              >
                {tourTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            
            {/* CTA Button */}
            <button type="submit" className="btn-warm btn-lg" style={{ minWidth: 160, flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              Search Holidays
            </button>
          </>
        )}

        {activeTab === 'forex' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '20px' }}>
             <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Get the Best Forex Rates</h3>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>Convert currencies at live market rates with doorstep delivery.</p>
             </div>
             <button type="button" onClick={() => router.push('/forex')} className="btn-warm btn-lg" style={{ minWidth: 160, flexShrink: 0 }}>
                Explore Forex
             </button>
          </div>
        )}

        {activeTab === 'flights' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '20px' }}>
             <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Book International & Domestic Flights</h3>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>Find the best connections and deals for your next journey.</p>
             </div>
             <button type="button" onClick={() => window.location.hash = '#flight'} className="btn-warm btn-lg" style={{ minWidth: 160, flexShrink: 0 }}>
                Inquire Flights
             </button>
          </div>
        )}

        {activeTab === 'hotels' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '20px' }}>
             <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Find Premium Stays Anywhere</h3>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>Book luxury resorts, cozy villas, and comfortable hotels.</p>
             </div>
             <button type="button" onClick={() => router.push('/hotels')} className="btn-warm btn-lg" style={{ minWidth: 160, flexShrink: 0 }}>
                Search Hotels
             </button>
          </div>
        )}
      </form>
    </div>
  );
}
