'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TourCard from '@/components/TourCard';
import { TourCardSkeleton } from '@/components/SkeletonLoader';
import toursData from '@/data/tours.json';

const TOUR_TYPES = ['All', 'Beach', 'Adventure', 'Cultural', 'Luxury', 'Safari'];
const DURATIONS = ['Any', '1-3 days', '4-7 days', '8-14 days', '15+ days'];
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'duration-asc', label: 'Shortest First' },
];

function ToursContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'All',
    minPrice: 0,
    maxPrice: 6000,
    duration: 'Any',
    minRating: 0,
    sort: 'featured',
    search: searchParams.get('destination') || '',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filteredTours = useMemo(() => {
    let result = [...toursData];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.country.toLowerCase().includes(q)
      );
    }

    if (filters.type !== 'All') {
      result = result.filter((t) => t.type === filters.type);
    }

    result = result.filter(
      (t) => t.price >= filters.minPrice && t.price <= filters.maxPrice
    );

    if (filters.duration !== 'Any') {
      const ranges = { '1-3 days': [1, 3], '4-7 days': [4, 7], '8-14 days': [8, 14], '15+ days': [15, 999] };
      const [min, max] = ranges[filters.duration];
      result = result.filter((t) => t.duration >= min && t.duration <= max);
    }

    if (filters.minRating > 0) {
      result = result.filter((t) => t.rating >= filters.minRating);
    }

    switch (filters.sort) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'duration-asc': result.sort((a, b) => a.duration - b.duration); break;
      default: result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [filters]);

  const resetFilters = () => {
    setFilters({ type: 'All', minPrice: 0, maxPrice: 6000, duration: 'Any', minRating: 0, sort: 'featured', search: '' });
  };

  const Sidebar = () => (
    <div className="filter-sidebar">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Filters
        </h3>
        <button
          onClick={resetFilters}
          style={{ fontSize: 13, color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, border: 'none', background: 'none' }}
        >
          Reset All
        </button>
      </div>

      {/* Search */}
      <div className="filter-group">
        <div className="filter-group-title">Search</div>
        <div style={{ position: 'relative' }}>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            width="16"
            height="16"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            className="form-input"
            style={{ paddingLeft: 40 }}
            placeholder="Destination, country..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Tour Type */}
      <div className="filter-group">
        <div className="filter-group-title">Tour Type</div>
        <div className="d-flex flex-column gap-2">
          {TOUR_TYPES.map((type) => (
            <label
              key={type}
              className="d-flex align-items-center gap-2"
              style={{ cursor: 'pointer', fontSize: 14, color: 'var(--color-text-secondary)' }}
            >
              <input
                type="radio"
                name="tourType"
                value={type}
                checked={filters.type === type}
                onChange={() => setFilters({ ...filters, type })}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              {type}
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 12,
                  background: 'var(--color-bg-soft)',
                  padding: '1px 8px',
                  borderRadius: 999,
                  color: 'var(--color-text-muted)',
                }}
              >
                {type === 'All' ? toursData.length : toursData.filter((t) => t.type === type).length}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="filter-group">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="filter-group-title" style={{ marginBottom: 0 }}>Price Range</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
            ${filters.minPrice} – ${filters.maxPrice}
          </span>
        </div>
        <input
          type="range"
          className="range-slider"
          min={0}
          max={6000}
          step={100}
          value={filters.maxPrice}
          onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
          style={{ '--value': `${(filters.maxPrice / 6000) * 100}%` }}
        />
        <div className="d-flex justify-content-between mt-1" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          <span>$0</span>
          <span>$6,000</span>
        </div>
      </div>

      {/* Duration */}
      <div className="filter-group">
        <div className="filter-group-title">Duration</div>
        <div className="d-flex flex-column gap-2">
          {DURATIONS.map((dur) => (
            <label
              key={dur}
              className="d-flex align-items-center gap-2"
              style={{ cursor: 'pointer', fontSize: 14, color: 'var(--color-text-secondary)' }}
            >
              <input
                type="radio"
                name="duration"
                value={dur}
                checked={filters.duration === dur}
                onChange={() => setFilters({ ...filters, duration: dur })}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              {dur}
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="filter-group">
        <div className="filter-group-title">Minimum Rating</div>
        <div className="d-flex flex-wrap gap-2">
          {[0, 3, 3.5, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setFilters({ ...filters, minRating: r })}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                border: '1.5px solid',
                borderColor: filters.minRating === r ? 'var(--color-primary)' : 'var(--color-border)',
                background: filters.minRating === r ? 'var(--color-primary-light)' : 'transparent',
                color: filters.minRating === r ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {r === 0 ? 'Any' : `${r}+`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
      {/* Mobile Filter Toggle */}
      <div className="d-lg-none mb-4">
        <button
          className="btn-secondary w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
          </svg>
          {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
        {sidebarOpen && (
          <div className="mt-3">
            <Sidebar />
          </div>
        )}
      </div>

      <div className="row g-5">
        {/* Sidebar – desktop */}
        <div className="col-lg-3 d-none d-lg-block">
          <div style={{ position: 'sticky', top: 100 }}>
            <Sidebar />
          </div>
        </div>

        {/* Tours Grid */}
        <div className="col-lg-9">
          {/* Top bar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
            <div>
              <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-text-primary)' }}>
                {filteredTours.length} Tours Found
              </span>
              {filters.type !== 'All' && (
                <span style={{ color: 'var(--color-text-muted)', fontSize: 14, marginLeft: 8 }}>
                  in {filters.type}
                </span>
              )}
            </div>
            <div className="d-flex align-items-center gap-2">
              <label style={{ fontSize: 13, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Sort by:</label>
              <select
                className="form-input"
                style={{ width: 'auto', padding: '8px 14px', fontSize: 14 }}
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.type !== 'All' || filters.search || filters.minRating > 0 || filters.maxPrice < 6000) && (
            <div className="d-flex flex-wrap gap-2 mb-4">
              {filters.type !== 'All' && (
                <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 13 }}>
                  {filters.type}
                  <button onClick={() => setFilters({ ...filters, type: 'All' })} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4, color: 'inherit' }}>×</button>
                </span>
              )}
              {filters.maxPrice < 6000 && (
                <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 13 }}>
                  Max ${filters.maxPrice}
                  <button onClick={() => setFilters({ ...filters, maxPrice: 6000 })} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4, color: 'inherit' }}>×</button>
                </span>
              )}
              {filters.minRating > 0 && (
                <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 13 }}>
                  ⭐ {filters.minRating}+
                  <button onClick={() => setFilters({ ...filters, minRating: 0 })} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4, color: 'inherit' }}>×</button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          <div className="row g-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="col-lg-4 col-md-6">
                  <TourCardSkeleton />
                </div>
              ))
              : filteredTours.length > 0
                ? filteredTours.map((tour) => (
                  <div key={tour.id} className="col-lg-4 col-md-6">
                    <TourCard tour={tour} />
                  </div>
                ))
                : (
                  <div className="col-12 text-center py-5">
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                    <h3 style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>No tours found</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
                      Try adjusting your filters or search term
                    </p>
                    <button className="btn-primary" onClick={resetFilters}>
                      Clear All Filters
                    </button>
                  </div>
                )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ToursPage() {
  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <span className="section-label" style={{ color: 'rgba(255,255,255,0.6)' }}>✨ Handcrafted Experiences</span>
          <h1 className="section-title" style={{ color: 'white', fontSize: 'clamp(32px, 5vw, 52px)' }}>
            All Tours & Packages
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, maxWidth: 500 }}>
            Explore our curated collection of premium travel packages across 120+ destinations worldwide.
          </p>
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" style={{ marginTop: 16 }}>
            <ol className="breadcrumb mb-0" style={{ background: 'none', padding: 0 }}>
              <li className="breadcrumb-item"><a href="/" style={{ color: 'rgba(255,255,255,0.6)' }}>Home</a></li>
              <li className="breadcrumb-item active" style={{ color: 'white' }}>Tours</li>
            </ol>
          </nav>
        </div>
      </div>

      <Suspense fallback={
        <div style={{ padding: '80px 0' }}>
          <div className="container">
            <div className="row g-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="col-lg-4 col-md-6"><TourCardSkeleton /></div>
              ))}
            </div>
          </div>
        </div>
      }>
        <ToursContent />
      </Suspense>
    </>
  );
}
