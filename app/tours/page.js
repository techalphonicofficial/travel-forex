'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TourCard from '@/components/TourCard';
import { TourCardSkeleton } from '@/components/SkeletonLoader';
import { getMediaUrl, getPackageFilters, getPackages, getCategories, getPackageCategories, getPageBySlug } from '@/utils/api';
import TourItineraryView from './TourItineraryView';

const DEFAULT_TOUR_TYPES = [{ key: 'all', label: 'All', count: 0 }];
const DEFAULT_DURATIONS = [
  { key: 'any', label: 'Any', min: null, max: null, count: 0 },
  { key: '1-3', label: '1-3 days', min: 1, max: 3, count: 0 },
  { key: '4-7', label: '4-7 days', min: 4, max: 7, count: 0 },
  { key: '8-14', label: '8-14 days', min: 8, max: 14, count: 0 },
  { key: '15-plus', label: '15+ days', min: 15, max: null, count: 0 },
];
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'duration-asc', label: 'Shortest First' },
];
const MAX_PRICE = 1000000;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
const formatPriceNumber = (value) => Number(value || 0).toLocaleString('en-IN');

const getFirstDestination = (pkg) => pkg?.destinations?.[0]?.destination || null;

const getLocationParts = (pkg) => {
  const destination = getFirstDestination(pkg);
  const mapping = destination?.mappings?.[0];
  const city = destination?.city?.name || mapping?.city?.name || destination?.name || '';
  const country = destination?.country || mapping?.city?.country?.name || '';
  const continent = destination?.continent || mapping?.city?.country?.continent?.name || '';

  return { city, country, continent, destination };
};

const normalizePackageToTour = (pkg) => {
  const { city, country, continent, destination } = getLocationParts(pkg);
  const destinationsArr = (pkg?.destinations || []).map(item => item?.destination).filter(Boolean);
  const destinationNames = destinationsArr.map(d => d.name).filter(Boolean);
  const location = destinationNames.length ? destinationNames.join(', ') : city || country || 'Destination';
  const price = Number(pkg?.price) || 0;
  const duration = Number(pkg?.duration_days) || 1;

  // Determine if it's International or Domestic by looking at all destinations or travel_type
  const isInternational = destinationsArr.some(d => d.type?.toLowerCase() === 'international');
  const computedType = pkg?.travel_type
    ? (pkg.travel_type.toLowerCase() === 'international' ? 'International' : 'Domestic')
    : (isInternational ? 'International' : 'Domestic');

  return {
    id: pkg?.id,
    slug: pkg?.slug || `package-${pkg?.id}`,
    title: pkg?.name || 'Travel Package',
    location,
    country: country || city || location,
    continent,
    type: computedType,
    duration,
    groupSize: 12,
    rating: Number(pkg?.rating) || 4.6,
    reviews: Number(pkg?.reviews_count) || Number(pkg?.reviews) || 0,
    price,
    originalPrice: price ? Math.round(price * 1.18) : 0,
    image: getMediaUrl(pkg?.main_image) || getMediaUrl(destination?.feature_image) || FALLBACK_IMAGE,
    featured: Boolean(pkg?.show_in_home_page),
    trending: Boolean(destination?.is_trending || pkg?.show_in_home_page),
    description: pkg?.description || destination?.title || '',
  };
};

const buildApiQueryFromFilters = (filters) => {
  const query = {};

  if (filters.search) query.search = filters.search;
  if (filters.type && filters.type !== 'all') {
    query.package_type = filters.type.toLowerCase();
  }
  if (Number(filters.minPrice) > 0) query.minPrice = filters.minPrice;
  if (Number(filters.maxPrice) > 0 && Number(filters.maxPrice) < MAX_PRICE) query.maxPrice = filters.maxPrice;
  if (filters.category) query.category = filters.category;
  if (filters.package_category_slug) query.package_category_slug = filters.package_category_slug;
  if (Number(filters.minRating) > 0) query.minRating = filters.minRating;

  return query;
};

const fetchPackagesFromQuery = async (query) => {
  const packages = await getPackages(query);
  const search = query.search;

  if (packages.length || !search) {
    return packages;
  }

  const { search: _discard, ...otherFilters } = query;

  for (const key of ['country', 'city', 'continent', 'category']) {
    const fallbackPackages = await getPackages({ ...otherFilters, [key]: search });
    if (fallbackPackages.length) {
      return fallbackPackages;
    }
  }

  return packages;
};

const getUrlSearchValue = (searchParams) =>
  searchParams.get('search') ||
  searchParams.get('destination') ||
  searchParams.get('city') ||
  searchParams.get('country') ||
  searchParams.get('continent') ||
  searchParams.get('category') ||
  '';

const formatHeadingValue = (value) =>
  String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeFilterOptions = (data) => {
  const tourTypes = Array.isArray(data?.tour_types) && data.tour_types.length
    ? data.tour_types.map((item) => ({
      key: item.key || item.slug || item.name || String(item.id || ''),
      label: item.label || item.name || item.key || 'Type',
      count: Number(item.count) || 0,
    }))
    : DEFAULT_TOUR_TYPES;

  const durations = Array.isArray(data?.durations) && data.durations.length
    ? data.durations.map((item) => ({
      key: item.key || item.label,
      label: item.label || item.key,
      min: item.min,
      max: item.max,
      count: Number(item.count) || 0,
    }))
    : DEFAULT_DURATIONS;

  const priceRange = data?.price_range || {};
  const maxPrice = Number(priceRange.max ?? priceRange.selected_max ?? MAX_PRICE) || MAX_PRICE;

  return {
    search: data?.search || { query: '', placeholder: 'Destination, country...' },
    total: Number(data?.total) || 0,
    tourTypes,
    durations,
    priceRange: {
      min: Number(priceRange.min ?? priceRange.selected_min ?? 0) || 0,
      max: maxPrice,
      selectedMin: Number(priceRange.selected_min ?? priceRange.min ?? 0) || 0,
      selectedMax: Number(priceRange.selected_max ?? priceRange.max ?? maxPrice) || maxPrice,
    },
  };
};

const getTourTypeLabel = (filterOptions, selectedKey) =>
  filterOptions.tourTypes.find((item) => item.key === selectedKey)?.label || 'All';

const getDurationMeta = (filterOptions, selectedKey) =>
  filterOptions.durations.find((item) => item.key === selectedKey) || DEFAULT_DURATIONS[0];

function FilterSidebar({ filters, setFilters, resetFilters, filterOptions, sidebarCategoryList = [] }) {
  const priceMax = filterOptions.priceRange.max || MAX_PRICE;

  return (
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
            placeholder={filterOptions.search.placeholder || 'Destination, country...'}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-group-title">Categories</div>
        <div className="d-flex flex-column gap-2">
          {[{ slug: '', title: 'All Categories' }, ...sidebarCategoryList.map(cat => ({ slug: cat.slug, title: cat.title || cat.name }))].map((cat) => (
            <label
              key={cat.slug}
              className="d-flex align-items-center gap-2"
              style={{ cursor: 'pointer', fontSize: 14, color: 'var(--color-text-secondary)' }}
            >
              <input
                type="radio"
                name="category"
                value={cat.slug}
                checked={filters.package_category_slug === cat.slug || (cat.slug === '' && !filters.package_category_slug)}
                onChange={() => setFilters({ ...filters, package_category_slug: cat.slug })}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              {cat.title}
            </label>
          ))}
        </div>
      </div>



      <div className="filter-group">
        <div className="filter-group-title">Duration</div>
        <div className="d-flex flex-column gap-2">
          {filterOptions.durations.map((dur) => (
            <label
              key={dur.key}
              className="d-flex align-items-center gap-2"
              style={{ cursor: 'pointer', fontSize: 14, color: 'var(--color-text-secondary)' }}
            >
              <input
                type="radio"
                name="duration"
                value={dur.key}
                checked={filters.duration === dur.key}
                onChange={() => setFilters({ ...filters, duration: dur.key })}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              {dur.label}
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
                {dur.count}
              </span>
            </label>
          ))}
        </div>
      </div>

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
}

function ToursContent() {
  const searchParams = useSearchParams();
  const itineraryDestination = searchParams.get('destination');
  const isItineraryView = searchParams.get('view') === 'itinerary';
  const packageSlug = searchParams.get('package') || searchParams.get('slug');
  const initialSearch = getUrlSearchValue(searchParams);
  const destinationHeading = searchParams.get('destination') ? `${formatHeadingValue(searchParams.get('destination'))} Tour Packages` : 'All Tours & Packages';
  const [loading, setLoading] = useState(true);
  const [apiTours, setApiTours] = useState([]);
  const [filterOptions, setFilterOptions] = useState(() => normalizeFilterOptions(null));
  const [filters, setFilters] = useState({
    type: searchParams.get('tour_type') || searchParams.get('type') || 'all',
    minPrice: 0,
    maxPrice: Number(searchParams.get('maxPrice')) || MAX_PRICE,
    duration: searchParams.get('duration') || 'any',
    minRating: 0,
    sort: 'featured',
    search: initialSearch,
    category: searchParams.get('category') || '',
    package_category_slug: searchParams.get('package_category_slug') || '',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [sidebarCategoryList, setSidebarCategoryList] = useState([]);
  const [heroData, setHeroData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHeroData = async () => {
      const typeParam = searchParams.get('tour_type') || searchParams.get('type');
      
      try {
        let heroDetail = null;
        
        if (typeParam && typeParam.toLowerCase() !== 'all') {
          const slug = typeParam.toLowerCase();
          const pageData = await getPageBySlug(slug);
          heroDetail = pageData?.details?.find(d => d.key === `${slug}-hero`);
        }
        
        if (!heroDetail) {
           const pageData = await getPageBySlug('home');
           heroDetail = pageData?.details?.find(d => d.key === 'all-tours-packages');
        }

        if (isMounted) {
           setHeroData(heroDetail || null);
        }
      } catch (error) {
        console.error("Failed to fetch hero data:", error);
      }
    };
    fetchHeroData();
    return () => { isMounted = false; };
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    getCategories().then(cats => {
      if (isMounted && cats && Array.isArray(cats)) {
        setCategoryList(cats);
      }
    });
    getPackageCategories().then(cats => {
      if (isMounted && cats && Array.isArray(cats)) {
        setSidebarCategoryList(cats);
      }
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    setFilters((prev) => {
      const newType = searchParams.get('tour_type') || searchParams.get('type') || 'all';
      const newSearch = getUrlSearchValue(searchParams);
      const newCategory = searchParams.get('category') || '';
      const newPackageCategory = searchParams.get('package_category_slug') || '';

      if (prev.type !== newType || prev.search !== newSearch || prev.category !== newCategory || prev.package_category_slug !== newPackageCategory) {
        return {
          ...prev,
          type: newType,
          search: newSearch,
          category: newCategory,
          package_category_slug: newPackageCategory
        };
      }
      return prev;
    });
  }, [searchParams]);

  const { search, type, minPrice, maxPrice, duration, category, package_category_slug, minRating } = filters;
  const activePackageQuery = useMemo(
    () => buildApiQueryFromFilters({ search, type, minPrice, maxPrice, duration, category, package_category_slug, minRating }),
    [search, type, minPrice, maxPrice, duration, category, package_category_slug, minRating]
  );

  useEffect(() => {
    let isMounted = true;
    const loadPackages = async () => {
      setLoading(true);
      const packages = await fetchPackagesFromQuery(activePackageQuery);

      if (isMounted) {
        setApiTours(packages.map(normalizePackageToTour));
        setLoading(false);
      }
    };

    loadPackages();

    return () => {
      isMounted = false;
    };
  }, [activePackageQuery]);

  useEffect(() => {
    let isMounted = true;

    const loadFilterOptions = async () => {
      const data = await getPackageFilters(activePackageQuery);
      if (!isMounted) return;

      const nextOptions = normalizeFilterOptions(data);
      setFilterOptions(nextOptions);

      setFilters((current) => (
        current.maxPrice === MAX_PRICE && nextOptions.priceRange.max
          ? { ...current, maxPrice: nextOptions.priceRange.selectedMax || nextOptions.priceRange.max }
          : current
      ));
    };

    loadFilterOptions();

    return () => {
      isMounted = false;
    };
  }, [activePackageQuery]);

  const filteredTours = useMemo(() => {
    let result = [...apiTours];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.country.toLowerCase().includes(q) ||
          t.continent.toLowerCase().includes(q)
      );
    }

    if (filters.type === 'DOMESTIC' || filters.type === 'INTERNATIONAL') {
      result = result.filter(t => t.type?.toUpperCase() === filters.type);
    }



    result = result.filter(
      (t) => t.price >= filters.minPrice && t.price <= filters.maxPrice
    );

    if (filters.duration !== 'any') {
      const durationMeta = getDurationMeta(filterOptions, filters.duration);
      const min = Number(durationMeta.min) || 0;
      const max = durationMeta.max === null || durationMeta.max === undefined ? 999 : Number(durationMeta.max);
      result = result.filter((t) => t.duration >= min && t.duration <= max);
    }

    if (filters.minRating > 0) {
      result = result.filter((t) => t.rating >= filters.minRating);
    }

    switch (filters.sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'duration-asc':
        result.sort((a, b) => a.duration - b.duration);
        break;
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [apiTours, filters, filterOptions]);

  const resetFilters = () => {
    setFilters({
      type: 'all',
      minPrice: filterOptions.priceRange.min || 0,
      maxPrice: MAX_PRICE,
      duration: 'any',
      minRating: 0,
      sort: 'featured',
      search: '',
      category: searchParams.get('category') || '',
      package_category_slug: searchParams.get('package_category_slug') || '',
    });
  };

  let heroLabel = 'Handcrafted Experiences';
  let heroTitle = destinationHeading;
  let heroDesc = 'Explore our curated collection of premium travel packages across 120+ destinations worldwide.';
  
  if (heroData?.json_data?.body) {
    const lines = heroData.json_data.body.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length >= 3) {
      heroLabel = lines[0];
      heroTitle = lines[1];
      heroDesc = lines.slice(2).join('\n');
    } else if (lines.length === 2) {
      heroTitle = lines[0];
      heroDesc = lines[1];
    } else if (lines.length === 1) {
      heroTitle = lines[0];
    }
  } else if (heroData) {
    if (heroData.json_data?.heading_content) heroLabel = heroData.json_data.heading_content;
    if (heroData.title) {
       heroTitle = searchParams.get('destination') ? destinationHeading : heroData.title;
    }
    if (heroData.json_data?.story_desc) {
      heroDesc = heroData.json_data.story_desc.replace(/<[^>]+>/g, '');
    } else if (heroData.description) {
      heroDesc = heroData.description;
    }
  }

  const mediaUrl = heroData?.json_data?.media_url || heroData?.json_data?.gallery?.[0]?.img || heroData?.image;
  const pageHeaderStyle = mediaUrl 
    ? {
        backgroundImage: `url(${getMediaUrl(mediaUrl)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } 
    : {};

  if (itineraryDestination && isItineraryView) {
    return <TourItineraryView destination={itineraryDestination} packageSlug={packageSlug} />;
  }

  return (
    <>
      <div className="page-header" style={pageHeaderStyle}>
        <div className="container">
          <span className="section-label" style={{ color: 'rgba(255,255,255,0.8)' }}>{heroLabel}</span>
          <h1 className="section-title" style={{ color: 'white', fontSize: 'clamp(32px, 5vw, 52px)' }}>
            {heroTitle}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, maxWidth: 500, whiteSpace: 'pre-line' }}>
            {heroDesc}
          </p>
          <nav aria-label="breadcrumb" style={{ marginTop: 16 }}>
            <ol className="breadcrumb mb-0" style={{ background: 'none', padding: 0 }}>
              {heroData?.json_data?.stats?.[0]?.value ? (
                heroData.json_data.stats[0].value.split('/').map((part, idx, arr) => (
                  <li 
                    key={idx} 
                    className={`breadcrumb-item ${idx === arr.length - 1 ? 'active' : ''}`}
                    style={{ color: idx === arr.length - 1 ? 'white' : 'rgba(255,255,255,0.6)' }}
                  >
                    {idx === arr.length - 1 ? part : <Link href="/" style={{ color: 'inherit' }}>{part}</Link>}
                  </li>
                ))
              ) : (
                <>
                  <li className="breadcrumb-item"><Link href="/" style={{ color: 'rgba(255,255,255,0.6)' }}>Home</Link></li>
                  <li className="breadcrumb-item active" style={{ color: 'white' }}>Tours</li>
                </>
              )}
            </ol>
          </nav>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
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
              <FilterSidebar filters={filters} setFilters={setFilters} resetFilters={resetFilters} filterOptions={filterOptions} sidebarCategoryList={sidebarCategoryList} />
            </div>
          )}
        </div>

        <div className="row g-5">
          <div className="col-lg-3 d-none d-lg-block">
            <div style={{ position: 'sticky', top: 100 }}>
              <FilterSidebar filters={filters} setFilters={setFilters} resetFilters={resetFilters} filterOptions={filterOptions} sidebarCategoryList={sidebarCategoryList} />
            </div>
          </div>

          <div className="col-lg-9">
            {categoryList && categoryList.length > 0 && (
              <div className="d-flex overflow-auto gap-2 mb-4 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                  .category-pill {
                    white-space: nowrap;
                    padding: 8px 16px;
                    border-radius: 99px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid var(--color-border);
                    background: white;
                    color: var(--color-text-secondary);
                  }
                  .category-pill:hover {
                    background: var(--color-bg-soft);
                  }
                  .category-pill.active {
                    background: var(--color-primary);
                    color: white;
                    border-color: var(--color-primary);
                  }
                `}</style>
                <button
                  className={`category-pill ${!filters.category ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, category: '' })}
                >
                  All Categories
                </button>
                {categoryList.map(cat => (
                  <button
                    key={cat.slug}
                    className={`category-pill ${filters.category === cat.slug ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, category: cat.slug })}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
              <div>
                <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-text-primary)' }}>
                  {filteredTours.length} Tours Found
                </span>
                {filters.type !== 'all' && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 14, marginLeft: 8 }}>
                    in {getTourTypeLabel(filterOptions, filters.type)}
                  </span>
                )}
              </div>
            </div>

            {(filters.type !== 'all' || filters.search || filters.package_category_slug || filters.minRating > 0 || filters.maxPrice < (filterOptions.priceRange.max || MAX_PRICE) || filters.duration !== 'any') && (
              <div className="d-flex flex-wrap gap-2 mb-4">
                {filters.type !== 'all' && (
                  <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 13 }}>
                    {filters.type === 'DOMESTIC' ? 'Domestic' : filters.type === 'INTERNATIONAL' ? 'International' : getTourTypeLabel(filterOptions, filters.type)}
                    <button onClick={() => setFilters({ ...filters, type: 'all' })} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4, color: 'inherit' }}>x</button>
                  </span>
                )}
                {filters.package_category_slug && (
                  <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 13, textTransform: 'capitalize' }}>
                    {filters.package_category_slug} Tour
                    <button onClick={() => setFilters({ ...filters, package_category_slug: '' })} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4, color: 'inherit' }}>x</button>
                  </span>
                )}
                {filters.search && (
                  <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 13 }}>
                    {filters.search}
                    <button onClick={() => setFilters({ ...filters, search: '' })} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4, color: 'inherit' }}>x</button>
                  </span>
                )}
                {filters.maxPrice < (filterOptions.priceRange.max || MAX_PRICE) && (
                  <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 13 }}>
                    Max {formatPriceNumber(filters.maxPrice)}
                    <button onClick={() => setFilters({ ...filters, maxPrice: filterOptions.priceRange.max || MAX_PRICE })} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4, color: 'inherit' }}>x</button>
                  </span>
                )}
                {filters.duration !== 'any' && (
                  <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 13 }}>
                    {getDurationMeta(filterOptions, filters.duration).label}
                    <button onClick={() => setFilters({ ...filters, duration: 'any' })} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4, color: 'inherit' }}>x</button>
                  </span>
                )}
                {filters.minRating > 0 && (
                  <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 13 }}>
                    Rating {filters.minRating}+
                    <button onClick={() => setFilters({ ...filters, minRating: 0 })} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4, color: 'inherit' }}>x</button>
                  </span>
                )}
              </div>
            )}

            <div className="row g-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="col-xl-4 col-lg-6 col-md-6 d-flex">
                    <TourCardSkeleton />
                  </div>
                ))
                : filteredTours.length > 0
                  ? filteredTours.map((tour) => (
                    <div key={tour.id} className="col-xl-4 col-lg-6 col-md-6 d-flex">
                      <TourCard tour={tour} />
                    </div>
                  ))
                  : (
                    <div className="col-12 text-center py-5">
                      <div style={{ fontSize: 48, marginBottom: 16 }}>No results</div>
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
    </>
  );
}

export default function ToursPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="row g-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="col-xl-4 col-lg-6 col-md-6 d-flex"><TourCardSkeleton /></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ToursContent />
    </Suspense>
  );
}
