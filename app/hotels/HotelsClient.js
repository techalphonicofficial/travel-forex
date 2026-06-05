'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getHotels } from '@/utils/api';

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const getHotelImage = (hotel) =>
  hotel?.image_url ||
  hotel?.gallery?.find((item) => item.is_primary)?.url ||
  hotel?.gallery?.[0]?.url ||
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
  const location = [hotel.destination?.name || city, hotel.destination?.country || country].filter(Boolean).join(', ');
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
          <p className="hotel-desc">{hotel.description}</p>
          <div className="hotel-amenities">
            {(hotel.amenities || []).slice(0, 5).map((amenity) => <span key={amenity}>{amenity}</span>)}
            {(hotel.amenities || []).length > 5 ? <span>+{hotel.amenities.length - 5} more</span> : null}
          </div>
        </div>
        <div className="hotel-price-panel">
          <small>{hotel.provider_name || 'Hotel partner'}</small>
          {discount > 0 ? <del>{formatMoney(price)}</del> : null}
          <strong>{formatMoney(discountedPrice)}</strong>
          <span>per night</span>
          <Link
            href={detailHref}
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

export default function HotelsClient() {
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

  const searchHotels = (event) => {
    event.preventDefault();
    setQuery({ ...draftQuery, page: 1, limit: 20 });
  };

  return (
    <main className="hotels-page">
      <section className="hotels-hero">
        <div className="hotels-container">
          <div>
            <span>Hotel stays</span>
            <h1>{query.city || 'Goa'} Hotels</h1>
            <p>{pagination?.total || hotels.length || 0} stays from verified hotel partners</p>
          </div>
          <form className="hotel-search-bar" onSubmit={searchHotels}>
            <input value={draftQuery.search} onChange={(event) => setDraftQuery((current) => ({ ...current, search: event.target.value }))} placeholder="Search hotels, provider, destination" />
            <input value={draftQuery.country} onChange={(event) => setDraftQuery((current) => ({ ...current, country: event.target.value }))} placeholder="Country" />
            <input value={draftQuery.city} onChange={(event) => setDraftQuery((current) => ({ ...current, city: event.target.value }))} placeholder="City" />
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="hotels-container hotels-layout">
        <aside className="hotels-filters">
          <div className="hotel-filter-head">
            <strong>Filters</strong>
            <button type="button" onClick={() => setFilters({ stars: [], amenities: [], providers: [], minGuestRating: 0, maxPrice: 0, discountedOnly: false })}>Reset</button>
          </div>

          {filterOptions.maxPrice ? (
            <FilterGroup title="Price per night">
              <div className="hotel-range-copy">Up to {formatMoney(effectiveMaxPrice)}</div>
              <input type="range" min="0" max={filterOptions.maxPrice} step="250" value={effectiveMaxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))} />
            </FilterGroup>
          ) : null}

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

          <FilterGroup title="Offers">
            <label><input type="checkbox" checked={filters.discountedOnly} onChange={(event) => setFilters((current) => ({ ...current, discountedOnly: event.target.checked }))} /> Discounted hotels</label>
          </FilterGroup>
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
      </section>
      <HotelStyles />
    </main>
  );
}

function HotelStyles() {
  return (
    <style jsx global>{`
      .hotels-page { background: #f4f6f8; min-height: 100vh; color: #172033; padding-bottom: 70px; }
      .hotels-container { width: min(100%, 1180px); margin: 0 auto; padding: 0 22px; }
      .hotels-hero { padding: 124px 0 30px; background: linear-gradient(135deg, #0b1d35, #0d5c93); color: #fff; }
      .hotels-hero .hotels-container { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; }
      .hotels-hero span { color: #b7ddff; font-size: 12px; font-weight: 900; letter-spacing: .8px; text-transform: uppercase; }
      .hotels-hero h1 { margin: 8px 0 6px; font-family: var(--font-poppins), Poppins, sans-serif; font-size: clamp(32px, 5vw, 52px); font-weight: 900; }
      .hotels-hero p { margin: 0; color: rgba(255,255,255,.78); }
      .hotel-search-bar { display: grid; grid-template-columns: 1.4fr .7fr .7fr auto; gap: 10px; padding: 12px; border-radius: 8px; background: #fff; box-shadow: 0 18px 45px rgba(7, 18, 34, .25); }
      .hotel-search-bar input { min-height: 46px; border: 1px solid #d8dee8; border-radius: 8px; padding: 0 13px; color: #111827; font-size: 14px; outline: none; }
      .hotel-search-bar button { border-radius: 8px; padding: 0 22px; background: var(--color-primary); color: #fff; font-weight: 900; }
      .hotels-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 22px; align-items: start; margin-top: 24px; }
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
      .hotel-card { display: grid; grid-template-columns: 250px minmax(0, 1fr); overflow: hidden; }
      .hotel-card-media { position: relative; min-height: 220px; display: block; overflow: hidden; }
      .hotel-card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
      .hotel-card:hover .hotel-card-media img { transform: scale(1.04); }
      .hotel-card-media span { position: absolute; left: 12px; top: 12px; padding: 5px 9px; border-radius: 999px; background: #16a34a; color: #fff; font-size: 11px; font-weight: 900; }
      .hotel-card-body { display: grid; grid-template-columns: minmax(0, 1fr) 178px; gap: 16px; padding: 18px; }
      .hotel-card-title-row { display: flex; justify-content: space-between; gap: 16px; }
      .hotel-card h2 { margin: 0 0 5px; color: #111827; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 21px; font-weight: 900; line-height: 1.2; }
      .hotel-card p { margin: 0; color: #64748b; font-size: 13px; font-weight: 700; }
      .hotel-rating-badge { min-width: 58px; align-self: start; border-radius: 8px; padding: 7px; background: #0f7b4f; color: #fff; text-align: center; }
      .hotel-rating-badge strong { display: block; font-size: 17px; line-height: 1; }
      .hotel-rating-badge span { font-size: 10px; font-weight: 800; }
      .hotel-stars { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-weight: 900; }
      .gold-stars { display: inline-flex; align-items: center; gap: 1px; color: #d7dde6; font-size: 14px; line-height: 1; letter-spacing: 0; }
      .gold-stars .is-filled { color: #f6b51e; text-shadow: 0 1px 0 rgba(120, 74, 0, .12); }
      .hotel-stars > span:not(.gold-stars) { color: #475569; font-size: 12px; margin-left: 0; }
      .hotel-desc { margin-top: 12px !important; color: #3f4f63 !important; font-weight: 500 !important; line-height: 1.55; }
      .hotel-amenities { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
      .hotel-amenities span { padding: 5px 8px; border-radius: 999px; background: #f1f5f9; color: #334155; font-size: 11px; font-weight: 800; }
      .hotel-price-panel { border-left: 1px solid #edf1f5; padding-left: 16px; display: grid; align-content: end; justify-items: end; text-align: right; }
      .hotel-price-panel small { color: #64748b; font-size: 12px; font-weight: 800; }
      .hotel-price-panel del { color: #94a3b8; font-size: 13px; }
      .hotel-price-panel strong { color: #111827; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 24px; font-weight: 900; }
      .hotel-price-panel span { color: #64748b; font-size: 12px; font-weight: 700; }
      .hotel-price-panel a { margin-top: 12px; padding: 10px 16px; border-radius: 8px; background: var(--color-primary); color: #fff; font-size: 13px; font-weight: 900; text-decoration: none; }
      @media (max-width: 991px) {
        .hotels-layout { grid-template-columns: 1fr; }
        .hotels-filters { position: static; }
        .hotel-card { grid-template-columns: 1fr; }
        .hotel-card-body { grid-template-columns: 1fr; }
        .hotel-price-panel { border-left: 0; border-top: 1px solid #edf1f5; padding: 16px 0 0; justify-items: start; text-align: left; }
        .hotel-search-bar { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}
