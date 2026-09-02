'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getStoredToken, getHotels, getMediaUrl, searchCountryCityLocations, getPipelineForm } from '@/utils/api';
import InquiryForm from '@/components/InquiryForm';
import HotelInquiryModal from '@/components/HotelInquiryModal';
import ReadMoreText from '@/components/ReadMoreText';
import { useDebounce } from '@/hooks/useDebounce';
import HotDealsMarquee from '@/components/HotDealsMarquee';
import './hotels.css';

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const getHotelImage = (hotel) =>
  getMediaUrl(hotel?.image_url) ||
  getMediaUrl(hotel?.gallery?.find((item) => item.is_primary)?.url) ||
  getMediaUrl(hotel?.gallery?.[0]?.url) ||
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

const getDiscountedPrice = (hotel) => {
  const price = Number(hotel?.price_per_night) || 0;
  const discount = Number(hotel?.discount_percent) || 0;
  return discount > 0 ? Math.max(price - (price * discount) / 100, 0) : price;
};

const uniqueSorted = (items) => [...new Set(items.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

const getHotelDetailHref = (hotel, city, country) => {
  const params = new URLSearchParams();
  const safeCountry = country || hotel?.destination?.country || '';
  const safeCity = city || hotel?.destination?.name || '';

  if (safeCountry) params.set('country', safeCountry);
  if (safeCity) params.set('city', safeCity);

  const query = params.toString();
  return `/hotels/${hotel.id}${query ? `?${query}` : ''}`;
};

function GoldStars({ rating }) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <span className="gold-stars" aria-label={`${safeRating} star rating`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < safeRating ? 'is-filled' : ''}>★</span>
      ))}
    </span>
  );
}

function FilterGroup({ title, children }) {
  return (
    <section className="hotel-filter-group">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function HotelCard({ hotel, city, country }) {
  const price = Number(hotel.price_per_night) || 0;
  const discountedPrice = getDiscountedPrice(hotel);
  const discount = Number(hotel.discount_percent) || 0;
  const cityName = hotel.city?.name || city;
  const countryName = hotel.city?.country?.name || country;
  const location = [hotel.destination?.name || cityName, hotel.destination?.country || countryName].filter(Boolean).join(', ');
  const detailHref = getHotelDetailHref(hotel, city, country);

  return (
    <article className="hotel-card">
      <Link
        href={detailHref}
        className="hotel-card-media"
        onClick={() => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`hotel:${hotel.id}`, JSON.stringify(hotel));
          }
        }}
      >
        <Image src={getHotelImage(hotel)} alt={hotel.name} width={320} height={230} />
        {discount > 0 ? <span>{discount.toFixed(0)}% OFF</span> : null}
      </Link>
      <div className="hotel-card-body">
        <div className="hotel-card-main">
          <div className="hotel-card-title-row">
            <div>
              <Link href={detailHref}>
                <h2>{hotel.name}</h2>
              </Link>
              <p>{location || 'Hotel destination'}</p>
            </div>
            <div className="hotel-rating-badge">
              <strong>{Number(hotel.guest_rating || 0).toFixed(1)}</strong>
              <span>Guest</span>
            </div>
          </div>
          <div className="hotel-stars"><GoldStars rating={hotel.star_rating} /> <span>{hotel.star_rating || 0}-star property</span></div>
          <div className="hotel-desc">
            <ReadMoreText text={hotel.description} lines={3} />
          </div>
          <div className="hotel-amenities">
            {(hotel.amenities || []).slice(0, 5).map((amenity) => <span key={amenity}>{amenity}</span>)}
            {(hotel.amenities || []).length > 5 ? <span>+{hotel.amenities.length - 5} more</span> : null}
          </div>
        </div>
        <div className="hotel-price-panel" style={{ justifyContent: 'center', alignContent: 'center', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(`hotel:${hotel.id}`, JSON.stringify(hotel));
                window.dispatchEvent(new CustomEvent('openHotelInquiry', { detail: { hotel } }));
              }
            }}
            className="send-inquiry-btn"
          >
            Send Inquiry
          </button>
          <Link
            href={detailHref}
            className="view-details-link"
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(`hotel:${hotel.id}`, JSON.stringify(hotel));
              }
            }}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function HotelsClient({ initialHeroData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialQuery = {
    search: searchParams.get('search') || '',
    country: searchParams.get('country') || '',
    city: searchParams.get('city') || '',
    page: Number(searchParams.get('page')) || 1,
    limit: 20,
  };
  const [query, setQuery] = useState(initialQuery);
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    stars: [],
    amenities: [],
    providers: [],
    minGuestRating: 0,
    maxPrice: 0,
    discountedOnly: false,
  });
  const [formConfig, setFormConfig] = useState(null);
  const [heroData, setHeroData] = useState(initialHeroData);

  useEffect(() => {
    let mounted = true;
    getPipelineForm(23).then(config => {
      if (mounted && config) {
        if (config.fields) {
          config.fields = config.fields.map(f => {
            if (['phone', 'mobile_number', 'contact_number'].includes(f.field_key || f.fieldKey) || f.id === 'base_phone') {
              return { ...f, is_required: true, isRequired: true };
            }
            return f;
          });
        }
        setFormConfig(config);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadHotels = async () => {
      const isFirstPage = Number(query.page) <= 1;
      setLoading(isFirstPage);
      setLoadingMore(!isFirstPage);
      const result = await getHotels(query);
      if (!mounted) return;
      setHotels((current) => {
        if (isFirstPage) return result.rows;

        const seen = new Set(current.map((hotel) => hotel.id));
        const nextRows = result.rows.filter((hotel) => !seen.has(hotel.id));
        return [...current, ...nextRows];
      });
      setPagination(result.pagination);
      setLoading(false);
      setLoadingMore(false);
    };

    loadHotels();

    return () => {
      mounted = false;
    };
  }, [query]);

  useEffect(() => {
    const onScroll = () => {
      if (loading || loadingMore) return;

      const currentPage = Number(pagination?.page || query.page || 1);
      const totalPages = Number(pagination?.totalPages || 1);
      const hasNextPage = currentPage < totalPages;
      const distanceFromBottom = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);

      if (hasNextPage && distanceFromBottom < 520) {
        setQuery((current) => ({ ...current, page: currentPage + 1 }));
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading, loadingMore, pagination, query.page]);

  const filterOptions = useMemo(() => {
    const prices = hotels.map((hotel) => Number(hotel.price_per_night) || 0);
    return {
      stars: [...new Set(hotels.map((hotel) => Number(hotel.star_rating)).filter(Boolean))].sort((a, b) => b - a),
      amenities: uniqueSorted(hotels.flatMap((hotel) => hotel.amenities || [])),
      providers: uniqueSorted(hotels.map((hotel) => hotel.provider_name)),
      maxPrice: prices.length ? Math.max(...prices) : 0,
      cities: uniqueSorted(hotels.map((hotel) => hotel.destination?.name)),
      countries: uniqueSorted(hotels.map((hotel) => hotel.destination?.country)),
    };
  }, [hotels]);

  const effectiveMaxPrice = filters.maxPrice || filterOptions.maxPrice;
  const filteredHotels = useMemo(() => hotels.filter((hotel) => {
    const price = Number(hotel.price_per_night) || 0;
    const starsMatch = !filters.stars.length || filters.stars.includes(Number(hotel.star_rating));
    const amenitiesMatch = !filters.amenities.length || filters.amenities.every((amenity) => (hotel.amenities || []).includes(amenity));
    const providerMatch = !filters.providers.length || filters.providers.includes(hotel.provider_name);
    const ratingMatch = Number(hotel.guest_rating) >= Number(filters.minGuestRating || 0);
    const priceMatch = !effectiveMaxPrice || price <= effectiveMaxPrice;
    const discountMatch = !filters.discountedOnly || Number(hotel.discount_percent) > 0;
    return starsMatch && amenitiesMatch && providerMatch && ratingMatch && priceMatch && discountMatch;
  }), [hotels, filters, effectiveMaxPrice]);

  const toggleArrayFilter = (key, value) => {
    setFilters((current) => {
      const existing = current[key];
      return {
        ...current,
        [key]: existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value],
      };
    });
  };

  
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedSearch = useDebounce(draftQuery.search, 300);
  const debouncedCity = useDebounce(draftQuery.city, 300);
  const debouncedCountry = useDebounce(draftQuery.country, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!activeDropdown) {
        setSuggestions([]);
        return;
      }
      
      try {
        if (activeDropdown === 'hotel' && debouncedSearch.length >= 2) {
          const res = await getHotels({ search: debouncedSearch, limit: 5 });
          // Get unique hotel names up to 3
          const uniqueHotels = [];
          const seen = new Set();
          for (const h of (res.rows || [])) {
            if (!seen.has(h.name) && uniqueHotels.length < 3) {
              seen.add(h.name);
              uniqueHotels.push(h);
            }
          }
          if (uniqueHotels.length > 0) {
            setSuggestions(uniqueHotels.map(h => ({ type: 'hotel', text: h.name, data: h })));
          } else {
            setSuggestions([{ type: 'none', text: 'No hotels found' }]);
          }
        } 
        else if (activeDropdown === 'city' && debouncedCity.length >= 2) {
          const { cities } = await searchCountryCityLocations({ search: debouncedCity, limit: 3 });
          if (cities && cities.length > 0) {
            setSuggestions(cities.slice(0, 3).map(c => ({ type: 'city', text: c.name, data: c })));
          } else {
            setSuggestions([{ type: 'none', text: 'No cities found' }]);
          }
        } 
        else if (activeDropdown === 'country' && debouncedCountry.length >= 2) {
          const { countries } = await searchCountryCityLocations({ search: debouncedCountry, limit: 3 });
          if (countries && countries.length > 0) {
            setSuggestions(countries.slice(0, 3).map(c => ({ type: 'country', text: c.name, data: c })));
          } else {
            setSuggestions([{ type: 'none', text: 'No countries found' }]);
          }
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.warn('Suggestion fetch error', err);
      }
    };
    
    fetchSuggestions();
  }, [debouncedSearch, debouncedCity, debouncedCountry, activeDropdown]);

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'none') return;
    if (suggestion.type === 'hotel') {
      const h = suggestion.data;
      setDraftQuery((curr) => ({
        ...curr,
        search: h.name,
        city: h.city?.name || curr.city,
        country: h.city?.country?.name || curr.country
      }));
    } else if (suggestion.type === 'city') {
      const c = suggestion.data;
      setDraftQuery((curr) => ({
        ...curr,
        city: c.name,
        country: c.country?.name || curr.country
      }));
    } else if (suggestion.type === 'country') {
      setDraftQuery((curr) => ({ ...curr, country: suggestion.text }));
    }
    setActiveDropdown(null);
  };
const searchHotels = (event) => {
    event.preventDefault();
    setQuery({ ...draftQuery, page: 1, limit: 20 });
  };

  return (
    <main className="hotels-page">
      <section 
        className="hotels-hero"
        style={(heroData?.image || heroData?.json_data?.gallery?.[0]?.img) ? { backgroundImage: `url(${getMediaUrl(heroData.image || heroData.json_data.gallery[0].img)})` } : {}}
      >
        <div className="hotels-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span>{heroData?.json_data?.heading_content || 'Hotel stays'}</span>
              <h1>{query.city ? `${query.city} Hotels` : (heroData?.title || 'Explore Hotels')}</h1>
              <p>
                {pagination?.total || hotels.length || 0}{' '}
                {(heroData?.json_data?.story_desc || heroData?.description) ? (heroData.json_data?.story_desc || heroData.description).replace(/<[^>]*>?/gm, '') : 'stays from verified hotel partners'}
              </p>
            </div>
            <div>
              <button 
                className="get-inquiry-hero-btn" 
                onClick={() => window.dispatchEvent(new CustomEvent('openHotelInquiry', { detail: { hotel: null } }))}
              >
                Get Inquiry
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="hotels-container hotels-layout">
        <aside className="hotels-filters">
          <div className="hotel-filter-head">
            <strong>Filters</strong>
            <button type="button" onClick={() => setFilters({ stars: [], amenities: [], providers: [], minGuestRating: 0, maxPrice: 0, discountedOnly: false })}>Reset</button>
          </div>



          {filterOptions.stars.length ? (
            <FilterGroup title="Star category">
              {filterOptions.stars.map((star) => (
                <label key={star}><input type="checkbox" checked={filters.stars.includes(star)} onChange={() => toggleArrayFilter('stars', star)} /> {star} Star</label>
              ))}
            </FilterGroup>
          ) : null}

          <FilterGroup title="Guest rating">
            {[4.5, 4.0, 3.5].map((rating) => (
              <button key={rating} type="button" className={filters.minGuestRating === rating ? 'active' : ''} onClick={() => setFilters((current) => ({ ...current, minGuestRating: current.minGuestRating === rating ? 0 : rating }))}>{rating}+ Rating</button>
            ))}
          </FilterGroup>

          {filterOptions.amenities.length ? (
            <FilterGroup title="Amenities">
              {filterOptions.amenities.map((amenity) => (
                <label key={amenity}><input type="checkbox" checked={filters.amenities.includes(amenity)} onChange={() => toggleArrayFilter('amenities', amenity)} /> {amenity}</label>
              ))}
            </FilterGroup>
          ) : null}

          {filterOptions.providers.length ? (
            <FilterGroup title="Provider">
              {filterOptions.providers.map((provider) => (
                <label key={provider}><input type="checkbox" checked={filters.providers.includes(provider)} onChange={() => toggleArrayFilter('providers', provider)} /> {provider}</label>
              ))}
            </FilterGroup>
          ) : null}


        </aside>

        <div className="hotels-results">
          <div className="hotels-result-head">
            <div>
              <strong>{filteredHotels.length} hotels found</strong>
              <span>{[query.city, query.country].filter(Boolean).join(', ') || 'All destinations'}</span>
            </div>
          </div>
          {loading ? (
            <div className="hotel-loading">Loading hotels...</div>
          ) : filteredHotels.length ? (
            <>
              {filteredHotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} city={query.city} country={query.country} />)}
              {loadingMore ? <div className="hotel-loading">Loading more hotels...</div> : null}
              {!loadingMore && pagination && Number(pagination.page) >= Number(pagination.totalPages) ? (
                <div className="hotel-loading">You have reached the end of the hotel list.</div>
              ) : null}
            </>
          ) : (
            <div className="hotel-loading">No hotels match the selected filters.</div>
          )}
        </div>

        <HotDealsMarquee />
      </section>

      <InquiryForm
        title="Can't find the perfect hotel?"
        subtitle="Our hotel specialists will handpick the best options for your destination, budget and travel dates."
        serviceName="Hotel Booking"
        variant="strip"
        showDate
        showMessage
        formConfig={formConfig}
      />

      <HotelInquiryModal formConfig={formConfig} />
    </main>
  );
}

function HotelStyles() {
  return (
    <style jsx global>{`
      .hotels-page { background: #f4f6f8; min-height: 100vh; color: #172033; padding-bottom: 70px; }
      .hotels-container { width: min(100%, 1600px); margin: 0 auto; padding: 0 20px; }
      .hotels-hero { padding: 48px 0 30px; background-color: #0A192F; background-size: cover; background-position: center; color: #fff; }
      .hotels-hero .hotels-container { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; }
      .hotels-hero span { color: #b7ddff; font-size: 12px; font-weight: 900; letter-spacing: .8px; text-transform: uppercase; }
      .hotels-hero h1 { margin: 8px 0 6px; font-family: var(--font-poppins), Poppins, sans-serif; font-size: clamp(32px, 5vw, 52px); font-weight: 900; }
      .hotels-hero p { margin: 0; color: rgba(255,255,255,.78); }
      .get-inquiry-hero-btn { background: #0A3D84; color: white; border: none; padding: 12px 28px; border-radius: 8px; font-weight: 800; font-size: 16px; cursor: pointer; transition: transform 0.2s, background 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      .get-inquiry-hero-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
      .hotel-search-bar { display: grid; grid-template-columns: 1.4fr .7fr .7fr auto; gap: 10px; padding: 12px; border-radius: 8px; background: #fff; box-shadow: 0 18px 45px rgba(7, 18, 34, .25); }
      .hotel-search-bar input { min-height: 46px; border: 1px solid #d8dee8; border-radius: 8px; padding: 0 13px; color: #111827; font-size: 14px; outline: none; }
      .hotel-search-bar button { border-radius: 8px; padding: 0 22px; background: var(--color-primary); color: #fff; font-weight: 900; }
      .hotels-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr) 350px; gap: 24px; align-items: start; margin-top: 24px; }
      .hotels-filters, .hotel-card, .hotel-loading, .hotels-result-head { border: 1px solid #e1e7ef; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, .05); }
      .hotels-filters { position: sticky; top: 92px; padding: 18px; }
      .hotel-filter-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid #edf1f5; }
      .hotel-filter-head strong { font-size: 18px; font-weight: 900; }
      .hotel-filter-head button { color: var(--color-primary); background: transparent; font-weight: 800; }
      .hotel-filter-group { padding: 16px 0; border-bottom: 1px solid #edf1f5; display: grid; gap: 10px; }
      .hotel-filter-group:last-child { border-bottom: 0; }
      .hotel-filter-group h3 { margin: 0; color: #263445; font-size: 13px; font-weight: 900; }
      .hotel-filter-group label { display: flex; gap: 8px; align-items: center; color: #475569; font-size: 13px; font-weight: 700; }
      .hotel-filter-group button { justify-self: start; padding: 7px 10px; border: 1px solid #d7dee8; border-radius: 999px; background: #fff; color: #475569; font-size: 12px; font-weight: 800; }
      .hotel-filter-group button.active { border-color: var(--color-primary); background: #eaf6ff; color: var(--color-primary); }
      .hotel-range-copy { color: #475569; font-size: 13px; font-weight: 800; }
      .hotels-results { display: grid; gap: 14px; }
      .hotels-result-head { padding: 16px 18px; }
      .hotels-result-head strong { display: block; font-size: 18px; font-weight: 900; }
      .hotels-result-head span { color: #64748b; font-size: 13px; font-weight: 700; text-transform: capitalize; }
      .hotel-loading { padding: 30px; text-align: center; color: #64748b; font-weight: 800; }
      .hotel-card { display: grid; grid-template-columns: 250px minmax(0, 1fr); overflow: hidden; align-items: start; }
      .hotel-card-media { position: relative; height: 260px; display: block; overflow: hidden; border-radius: 8px 0 0 8px; }
      .hotel-card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
      .hotel-card:hover .hotel-card-media img { transform: scale(1.04); }
      .hotel-card-media span { position: absolute; left: 12px; top: 12px; padding: 5px 9px; border-radius: 999px; background: #16a34a; color: #fff; font-size: 11px; font-weight: 900; }
      .hotel-card-body { display: flex; flex-direction: column; gap: 16px; padding: 18px; }
      .hotel-card-title-row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .hotel-card h2 { margin: 0 0 5px; color: #111827; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 21px; font-weight: 900; line-height: 1.2; }
      .hotel-card p { margin: 0; color: #64748b; font-size: 13px; font-weight: 700; }
      .hotel-rating-badge { min-width: 58px; align-self: start; border-radius: 8px; padding: 7px; background: #0f7b4f; color: #fff; text-align: center; flex-shrink: 0; }
      .hotel-rating-badge strong { display: block; font-size: 17px; line-height: 1; }
      .hotel-rating-badge span { font-size: 10px; font-weight: 800; }
      .hotel-stars { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-weight: 900; }
      .gold-stars { display: inline-flex; align-items: center; gap: 1px; color: #d7dde6; font-size: 14px; line-height: 1; letter-spacing: 0; }
      .gold-stars .is-filled { color: #f6b51e; text-shadow: 0 1px 0 rgba(120, 74, 0, .12); }
      .hotel-stars > span:not(.gold-stars) { color: #475569; font-size: 12px; margin-left: 0; }
      .hotel-desc { margin-top: 12px !important; color: #3f4f63 !important; font-weight: 500 !important; line-height: 1.55; }
      .hotel-amenities { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; }
      .hotel-amenities span { padding: 5px 8px; border-radius: 999px; background: #f1f5f9; color: #334155; font-size: 11px; font-weight: 800; }
      .hotel-price-panel { border-top: 1px solid #edf1f5; padding-top: 16px; display: flex; flex-direction: row; align-items: center; justify-content: flex-end; gap: 12px; margin-top: auto; }
      .send-inquiry-btn { padding: 10px 24px; border-radius: 8px; background: #111827; color: #fff; font-size: 14px; font-weight: 900; border: none; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
      .send-inquiry-btn:hover { background: #000; }
      .view-details-link { padding: 10px 24px; border-radius: 8px; background: #f1f5f9; color: #334155; font-size: 13px; font-weight: 800; text-decoration: none; transition: background 0.2s; white-space: nowrap; }
      .view-details-link:hover { background: #e2e8f0; }
      @media (max-width: 991px) {
        .hotels-hero { padding: 36px 0 20px; }
        .hotels-layout { grid-template-columns: 1fr; }
        .hotels-filters { position: static; }
        .hotel-card { grid-template-columns: 1fr; }
        .hotel-card-body { grid-template-columns: 1fr; }
        .hotel-price-panel { border-left: 0; border-top: 1px solid #edf1f5; padding: 16px 0 0; }
        .hotel-search-bar { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}
