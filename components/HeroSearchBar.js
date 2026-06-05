'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const tourTypes = ['All', 'Beach', 'Adventure', 'Cultural', 'Luxury', 'Safari'];

export default function HeroSearchBar() {
  const router = useRouter();
  const [form, setForm] = useState({
    destination: '',
    date: '',
    travelers: '2',
    type: 'All',
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.destination) params.set('destination', form.destination);
    if (form.date) params.set('date', form.date);
    if (form.travelers) params.set('travelers', form.travelers);
    if (form.type && form.type !== 'All') params.set('type', form.type);
    router.push(`/tour?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="hero-search-card" noValidate>
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
        Plan My Trip
      </button>
    </form>
  );
}
