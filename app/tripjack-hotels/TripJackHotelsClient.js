'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import './hotels-booking.css';
import HotelLanding from './HotelLanding';
import HotelSearchForm from './HotelSearchForm';
import HotelFilters, { DEFAULT_HOTEL_FILTERS } from './HotelFilters';
import TripJackHotelCard from './TripJackHotelCard';
import { useStickyHeaderOffset } from '../flights/BookingTopBar';
import SelectionShareBar from '@/components/share/SelectionShareBar';
import {
    RESULTS_KEY,
    memorySearchResults,
    SELECTED_HOTEL_KEY,
    formatDate,
    freeCancellationUntil,
    guestCount,
    isFreeCancellation,
    mealLabel,
    money,
    nightsBetween,
    roomNames,
    sortOptions,
    titleCase,
} from './hotelUtils';

const PAGE_SIZE = 20;

// hotels a user can pick to send on WhatsApp / email
const MAX_SHARE = 5;

/* Plain text for WhatsApp / email (cheapest matching room of each hotel) */
const buildHotelShareText = (hotels, search) => {
    const nights = nightsBetween(search.checkIn, search.checkOut) || 1;
    const guests = guestCount(search.rooms || []);
    const roomCount = (search.rooms || []).length || 1;
    const lines = [
        `Hotel options in ${titleCase(search.destination?.cityName) || 'your destination'}`,
        `${formatDate(search.checkIn)} – ${formatDate(search.checkOut)} · ${nights} night${nights > 1 ? 's' : ''} · ${roomCount} room${roomCount > 1 ? 's' : ''}, ${guests.adults + guests.children} guest${guests.adults + guests.children > 1 ? 's' : ''}`,
        '',
    ];
    hotels.forEach((hotel, index) => {
        const option = sortOptions(hotel.options)[0];
        const total = Number(option?.pricing?.totalPrice || 0);
        const until = freeCancellationUntil(option);
        const stars = Math.round(hotel.starRating || 0);
        const place = hotel.address?.locality || hotel.address?.city;
        lines.push(`${index + 1}) ${hotel.name}${stars ? ` ${'★'.repeat(stars)}` : ''}${place ? ` – ${titleCase(place)}` : ''}`);
        if (option) {
            lines.push(`   ${roomNames(option)} · ${mealLabel(option.mealBasis)} · ${isFreeCancellation(option) ? `Free cancellation${until ? ` till ${formatDate(until)}` : ''}` : 'Non-refundable'}`);
            lines.push(`   ${money(total)} total (${money(total / nights)} per night), taxes included`);
        }
        if (hotel.coordinates?.lat) lines.push(`   Map: https://maps.google.com/?q=${hotel.coordinates.lat},${hotel.coordinates.long}`);
        lines.push('');
    });
    lines.push('Prices are live at the time of sharing and can change until the booking is made.');
    if (typeof window !== 'undefined') lines.push(`Search & book: ${window.location.origin}/hotel-booking`);
    return lines.join('\n');
};

const SORTS = [
    ['recommended', 'Recommended'],
    ['priceLow', 'Price: low to high'],
    ['priceHigh', 'Price: high to low'],
    ['stars', 'Star rating'],
];

const count = (list) => {
    const map = new Map();
    list.forEach((value) => {
        if (value) map.set(value, (map.get(value) || 0) + 1);
    });
    return [...map.entries()]
        .map(([value, n]) => ({ value, label: value, count: n }))
        .sort((a, b) => b.count - a.count);
};

/* price per night quick ranges */
const PRICE_BUCKETS = [
    { value: '0-2000', label: 'Up to ₹2,000', min: 0, max: 2000 },
    { value: '2000-4000', label: '₹2,000 – ₹4,000', min: 2000, max: 4000 },
    { value: '4000-7000', label: '₹4,000 – ₹7,000', min: 4000, max: 7000 },
    { value: '7000-12000', label: '₹7,000 – ₹12,000', min: 7000, max: 12000 },
    { value: '12000+', label: '₹12,000 & above', min: 12000, max: Infinity },
];

const inBucket = (price, bucket) => price >= bucket.min && price < bucket.max;

export default function TripJackHotelsClient() {
    const router = useRouter();
    useStickyHeaderOffset();

    /* last search from this tab (null on the server) */
    const stored = useSyncExternalStore(
        () => () => {},
        () => sessionStorage.getItem(RESULTS_KEY) || '',
        () => null
    );
    const [override, setOverride] = useState(null);

    const results = useMemo(() => {
        if (override) return override;
        if (stored === null) return null; // server render
        // full results kept in memory (the stored copy may be trimmed for big cities)
        const memory = memorySearchResults();
        if (memory) return memory;
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }, [override, stored]);

    const [filters, setFilters] = useState(DEFAULT_HOTEL_FILTERS);
    const [sortBy, setSortBy] = useState('recommended');
    const [visible, setVisible] = useState(PAGE_SIZE);
    const [modifyOpen, setModifyOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    // destination / hotel name picked on the landing page
    const [landingPreset, setLandingPreset] = useState(null);
    // hotels picked to send on WhatsApp / email
    const [pickedIds, setPickedIds] = useState([]);

    const search = results?.search || null;
    const hotels = useMemo(() => results?.hotels || [], [results]);

    const stayNights = nightsBetween(search?.checkIn, search?.checkOut) || 1;

    /* ---------- facets from all results ---------- */
    const facets = useMemo(() => {
        const perNight = (hotel) => Number(sortOptions(hotel.options)[0]?.pricing?.totalPrice || 0) / stayNights;
        const prices = hotels.map(perNight).filter(Boolean);
        const stars = {};
        hotels.forEach((hotel) => {
            const star = Math.round(hotel.starRating || 0);
            if (star) stars[star] = (stars[star] || 0) + 1;
        });
        const amenityCounts = count(hotels.flatMap((hotel) => hotel.amenities || []));
        return {
            minPrice: prices.length ? Math.floor(Math.min(...prices)) : 0,
            maxPrice: prices.length ? Math.ceil(Math.max(...prices)) : 0,
            priceBuckets: PRICE_BUCKETS.map((bucket) => ({
                ...bucket,
                count: hotels.filter((hotel) => hotel.options.some((o) => inBucket(Number(o.pricing?.totalPrice || 0) / stayNights, bucket))).length,
            })),
            stars,
            refund: [
                { value: 'REFUNDABLE', label: 'Refundable (free cancellation)', count: hotels.filter((hotel) => hotel.options.some(isFreeCancellation)).length },
                { value: 'NON_REFUNDABLE', label: 'Non-refundable', count: hotels.filter((hotel) => hotel.options.some((o) => !isFreeCancellation(o))).length },
            ],
            meals: count(hotels.flatMap((hotel) => [...new Set(hotel.options.map((o) => mealLabel(o.mealBasis)))])),
            propertyTypes: count(hotels.map((hotel) => hotel.propertyType)),
            localities: count(hotels.map((hotel) => hotel.address?.locality)),
            amenities: amenityCounts.slice(0, 30),
        };
    }, [hotels, stayNights]);

    /* ---------- filter + sort ---------- */
    const filtered = useMemo(() => {
        const f = filters;
        const name = f.name.trim().toLowerCase();
        const perNight = (option) => Number(option?.pricing?.totalPrice || 0) / stayNights;
        const buckets = PRICE_BUCKETS.filter((bucket) => f.priceBuckets.includes(bucket.value));

        const list = hotels
            .map((hotel, index) => {
                // room options that satisfy the room-level filters (meal, refund, price)
                const options = sortOptions(hotel.options).filter((option) =>
                    (!f.meals.length || f.meals.includes(mealLabel(option.mealBasis))) &&
                    (!f.refund.length || f.refund.includes(isFreeCancellation(option) ? 'REFUNDABLE' : 'NON_REFUNDABLE')) &&
                    (!buckets.length || buckets.some((bucket) => inBucket(perNight(option), bucket))) &&
                    (f.minPrice === '' || perNight(option) >= Number(f.minPrice)) &&
                    (f.maxPrice === '' || perNight(option) <= Number(f.maxPrice))
                );
                return { ...hotel, options, allOptions: hotel.options, rank: index };
            })
            .filter((hotel) => {
                if (!hotel.options.length) return false;
                if (name && !hotel.name.toLowerCase().includes(name)) return false;
                if (f.stars.length && !f.stars.includes(Math.round(hotel.starRating || 0))) return false;
                if (f.propertyTypes.length && !f.propertyTypes.includes(hotel.propertyType)) return false;
                if (f.localities.length && !f.localities.includes(hotel.address?.locality)) return false;
                if (f.amenities.length && !f.amenities.every((a) => (hotel.amenities || []).includes(a))) return false;
                return true;
            });

        const price = (hotel) => Number(hotel.options[0]?.pricing?.totalPrice || 0);
        const sorters = {
            recommended: (a, b) => a.rank - b.rank,
            priceLow: (a, b) => price(a) - price(b),
            priceHigh: (a, b) => price(b) - price(a),
            stars: (a, b) => (b.starRating || 0) - (a.starRating || 0) || price(a) - price(b),
        };
        return [...list].sort(sorters[sortBy] || sorters.recommended);
    }, [hotels, filters, sortBy, stayNights]);

    const chips = [
        ...(filters.name ? [{ key: 'name', label: `“${filters.name}”` }] : []),
        ...(filters.minPrice !== '' ? [{ key: 'minPrice', label: `Min ${money(filters.minPrice)}/night` }] : []),
        ...(filters.maxPrice !== '' ? [{ key: 'maxPrice', label: `Max ${money(filters.maxPrice)}/night` }] : []),
        ...filters.priceBuckets.map((value) => ({ key: 'priceBuckets', value, label: PRICE_BUCKETS.find((b) => b.value === value)?.label })),
        ...filters.stars.map((value) => ({ key: 'stars', value, label: `${value}★` })),
        ...filters.refund.map((value) => ({ key: 'refund', value, label: value === 'REFUNDABLE' ? 'Refundable' : 'Non-refundable' })),
        ...filters.meals.map((value) => ({ key: 'meals', value, label: value })),
        ...filters.propertyTypes.map((value) => ({ key: 'propertyTypes', value, label: value })),
        ...filters.localities.map((value) => ({ key: 'localities', value, label: value })),
        ...filters.amenities.map((value) => ({ key: 'amenities', value, label: value })),
    ];

    const removeChip = (chip) =>
        setFilters((prev) => ({
            ...prev,
            [chip.key]: Array.isArray(prev[chip.key])
                ? prev[chip.key].filter((v) => v !== chip.value)
                : DEFAULT_HOTEL_FILTERS[chip.key],
        }));

    const applyNewSearch = (saved) => {
        // a hotel picked by name: straight to its rooms
        if (saved?.search?.destination?.type === 'HOTEL' && saved.hotels?.length) {
            openHotel(saved.hotels[0], saved);
            return;
        }
        setOverride(saved);
        setFilters(DEFAULT_HOTEL_FILTERS);
        setSortBy('recommended');
        setVisible(PAGE_SIZE);
        setModifyOpen(false);
        setPickedIds([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // picked hotels as shown in the list (room options follow the filters)
    const pickedHotels = pickedIds
        .map((id) => filtered.find((hotel) => String(hotel.hotelId) === id) || hotels.find((hotel) => String(hotel.hotelId) === id))
        .filter((hotel) => hotel?.options?.length);

    const togglePick = (hotel) => {
        const id = String(hotel.hotelId);
        if (pickedIds.includes(id)) {
            setPickedIds(pickedIds.filter((value) => value !== id));
        } else if (pickedIds.length >= MAX_SHARE) {
            window.alert(`You can share up to ${MAX_SHARE} hotels at a time.`);
        } else {
            setPickedIds([...pickedIds, id]);
        }
    };

    const openHotel = (hotel, from = results) => {
        const fromSearch = from?.search || search;
        const original = (from?.hotels || hotels).find((h) => h.hotelId === hotel.hotelId) || hotel;
        try {
            sessionStorage.setItem(SELECTED_HOTEL_KEY, JSON.stringify({ ...original, search: fromSearch }));
        } catch {
            // storage full: free the stored results copy (the list stays in memory)
            try {
                sessionStorage.removeItem(RESULTS_KEY);
                sessionStorage.setItem(SELECTED_HOTEL_KEY, JSON.stringify({ ...original, images: (original.images || []).slice(0, 10), search: fromSearch }));
            } catch {
                window.alert('Unable to open this hotel. Please close some browser tabs and try again.');
                return;
            }
        }
        const params = new URLSearchParams({
            hotelId: String(original.hotelId),
            checkIn: fromSearch.checkIn,
            checkOut: fromSearch.checkOut,
            currency: fromSearch.currency || 'INR',
            nationality: String(fromSearch.nationality || ''),
            correlationId: original.correlationId || from?.correlationId || '',
        });
        router.push(`/hotel-booking/details?${params.toString()}`);
    };

    /* ---------- no search yet ---------- */
    if (!results || !search) {
        return (
            <main className="hb-page">
                <section className="hb-hero">
                    <div className="hb-container">
                        <p>Compare live prices across hotels, resorts and homestays. Free cancellation on many stays.</p>
                    </div>
                </section>
                <div className="hb-container hb-search-wrap">
                    {stored === null
                        ? <div className="hb-skeleton" style={{ height: 96 }} />
                        : <HotelSearchForm onSearched={applyNewSearch} preset={landingPreset} />}
                </div>
                <HotelLanding onPreset={setLandingPreset} />
            </main>
        );
    }

    const totals = guestCount(search.rooms);
    const nights = nightsBetween(search.checkIn, search.checkOut);

    return (
        <main className={`hb-page ${pickedHotels.length ? 'hb-has-picks' : ''}`}>
            {/* SEARCH SUMMARY + MODIFY */}
            <div className="hb-summary-bar">
                <div className="hb-container">
                    <div className="hb-summary">
                        <div>
                            <small>Destination</small>
                            <strong>{search.destination?.cityName || 'Hotels'}</strong>
                        </div>
                        <div>
                            <small>Stay</small>
                            <strong>{formatDate(search.checkIn)} – {formatDate(search.checkOut)} · {nights} night{nights > 1 ? 's' : ''}</strong>
                        </div>
                        <div>
                            <small>Rooms & guests</small>
                            <strong>{search.rooms.length} room{search.rooms.length > 1 ? 's' : ''}, {totals.adults + totals.children} guest{totals.adults + totals.children > 1 ? 's' : ''}</strong>
                        </div>
                        <button type="button" className="hb-modify" onClick={() => setModifyOpen((value) => !value)}>
                            {modifyOpen ? 'Close' : 'Modify search'}
                        </button>
                    </div>
                    {modifyOpen && (
                        <div className="hb-modify-panel">
                            <HotelSearchForm key={results.searchedAt} initialData={search} onSearched={applyNewSearch} />
                        </div>
                    )}
                </div>
            </div>

            <div className="hb-container hb-results">
                <HotelFilters
                    filters={filters}
                    setFilters={(updater) => {
                        setFilters(updater);
                        setVisible(PAGE_SIZE);
                    }}
                    facets={facets}
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    resultCount={filtered.length}
                />

                <section className="hb-content">
                    <div className="hb-toolbar">
                        <div className="hb-count">
                            <b>{filtered.length}</b> of {hotels.length} properties in {search.destination?.cityName}
                        </div>
                        <div className="hb-sort">
                            {SORTS.map(([value, label]) => (
                                <button
                                    type="button"
                                    key={value}
                                    className={sortBy === value ? 'active' : ''}
                                    onClick={() => setSortBy(value)}
                                >
                                    {label}
                                </button>
                            ))}
                            <button type="button" className="hb-chip hb-filter-trigger" onClick={() => setFiltersOpen(true)}>
                                Filters{chips.length ? ` (${chips.length})` : ''}
                            </button>
                        </div>
                    </div>

                    {chips.length > 0 && (
                        <div className="hb-chips">
                            {chips.map((chip) => (
                                <button type="button" className="hb-chip" key={`${chip.key}-${chip.value ?? ''}`} onClick={() => removeChip(chip)}>
                                    {chip.label} ×
                                </button>
                            ))}
                            <button type="button" className="hb-link" onClick={() => setFilters(DEFAULT_HOTEL_FILTERS)}>Clear all</button>
                        </div>
                    )}

                    {filtered.length === 0 ? (
                        <div className="hb-empty">
                            <strong>{hotels.length ? 'No hotels match your filters' : 'No hotels available for these dates'}</strong>
                            <span>{hotels.length ? 'Try removing some filters.' : 'Try different dates or a nearby destination.'}</span>
                            {hotels.length ? (
                                <button type="button" className="hb-btn hb-btn-outline" onClick={() => setFilters(DEFAULT_HOTEL_FILTERS)}>Reset filters</button>
                            ) : (
                                <button type="button" className="hb-btn hb-btn-outline" onClick={() => setModifyOpen(true)}>Modify search</button>
                            )}
                        </div>
                    ) : (
                        <>
                            {filtered.slice(0, visible).map((hotel) => (
                                <TripJackHotelCard
                                    key={hotel.hotelId}
                                    hotel={hotel}
                                    search={search}
                                    onSelect={openHotel}
                                    picked={pickedIds.includes(String(hotel.hotelId))}
                                    onTogglePick={togglePick}
                                />
                            ))}
                            {visible < filtered.length && (
                                <button type="button" className="hb-btn hb-btn-outline hb-more" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                                    Show more hotels ({filtered.length - visible} left)
                                </button>
                            )}
                        </>
                    )}
                </section>
            </div>

            {/* SHARE PICKED HOTELS */}
            <SelectionShareBar
                count={pickedHotels.length}
                max={MAX_SHARE}
                title={`${pickedHotels.length} hotel${pickedHotels.length > 1 ? 's' : ''} selected · ${titleCase(search.destination?.cityName) || 'Hotels'}`}
                hint={`Send on WhatsApp or email · up to ${MAX_SHARE}`}
                onClear={() => setPickedIds([])}
                getShare={() => ({
                    subject: `Hotel options in ${titleCase(search.destination?.cityName) || 'your destination'} · ${formatDate(search.checkIn)} – ${formatDate(search.checkOut)}`,
                    text: buildHotelShareText(pickedHotels, search),
                })}
            />
        </main>
    );
}
