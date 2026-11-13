'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import hotelService from '../services/hotelService';
import { saveRecent } from '@/components/travel-landing/LandingSections';
import {
    INDIA_NATIONALITY,
    saveSearchResults,
    SEARCH_KEY,
    addDays,
    formatDate,
    generateCorrelationId,
    guestCount,
    mergeDestinationSuggestions,
    nightsBetween,
    placeSubtitle,
    slimHotel,
    titleCase,
    toApiRooms,
    toISODate,
} from './hotelUtils';

const MAX_ROOMS = 6;
const MAX_ADULTS = 8;
const MAX_CHILDREN = 4;

const emptyRoom = () => ({ adults: 2, children: 0, childAges: [] });

const apiError = (error, fallback) =>
    error?.response?.data?.message || error?.message || fallback;

/* hotel ids from the region API (several possible shapes) */
const extractHids = (response) => {
    const hotels = response?.data?.hotels || response?.hotels || [];
    return [...new Set(
        (Array.isArray(hotels) ? hotels : [])
            .map((hotel) => hotel?.tjHotelId || hotel?.hotelId || hotel?.hid || hotel?.id)
            .filter(Boolean)
            .map(String)
    )];
};

/*
 * Search form used on the hotel page and in "Modify search".
 * Saves the search + slim results to sessionStorage and reports back.
 */
export const HOTEL_RECENT_KEY = 'tf_hotel_recent_searches';

/*
 * preset (from the landing page): { nonce, destination } fills the place,
 * { nonce, query } types a hotel/brand name and opens the suggestions,
 * { nonce, search } refills a recent search (dates only when still ahead).
 */
export default function HotelSearchForm({ initialData, onSearched, preset = null }) {
    const today = toISODate(new Date());
    const initialSearch = initialData || {};

    const [destination, setDestination] = useState(initialSearch.destination || null);
    const [query, setQuery] = useState(
        initialSearch.destination?.label || initialSearch.destination?.hotelName || initialSearch.destination?.cityName || ''
    );
    const [suggestions, setSuggestions] = useState([]);
    const [suggestOpen, setSuggestOpen] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const [checkIn, setCheckIn] = useState(
        initialSearch.checkIn && initialSearch.checkIn >= today ? initialSearch.checkIn : addDays(today, 7)
    );
    const [checkOut, setCheckOut] = useState(
        initialSearch.checkOut && initialSearch.checkOut > (initialSearch.checkIn || today) && initialSearch.checkIn >= today
            ? initialSearch.checkOut
            : addDays(today, 8)
    );
    const [rooms, setRooms] = useState(
        Array.isArray(initialSearch.rooms) && initialSearch.rooms.length ? initialSearch.rooms : [emptyRoom()]
    );
    const [paxOpen, setPaxOpen] = useState(false);
    const [nationality, setNationality] = useState(String(initialSearch.nationality || INDIA_NATIONALITY));
    const [residence, setResidence] = useState(String(initialSearch.residence || initialSearch.nationality || INDIA_NATIONALITY));
    const [nationalities, setNationalities] = useState([]);

    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState('');
    const [error, setError] = useState('');

    const destRef = useRef(null);
    const destInputRef = useRef(null);
    const paxRef = useRef(null);

    const nights = nightsBetween(checkIn, checkOut);
    const totals = guestCount(rooms);

    /* nationalities (default India) */
    useEffect(() => {
        let active = true;
        hotelService
            .getNationalities()
            .then((response) => {
                const list = response?.data?.nationalityInfos || response?.nationalityInfos || [];
                if (active && Array.isArray(list)) {
                    setNationalities(
                        [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)))
                    );
                }
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    /* destination suggestions (debounced) */
    useEffect(() => {
        const text = query.trim();
        if (!suggestOpen || text.length < 2 || (destination && text === destination.label)) return undefined;

        let active = true;
        const timer = setTimeout(async () => {
            setSuggestLoading(true);
            // cities and hotels by name together; one failing does not hide the other
            const [cities, hotels] = await Promise.allSettled([
                hotelService.citySearch(text),
                text.length >= 3 ? hotelService.hotelNameSearch(text) : Promise.resolve({ data: [] }),
            ]);
            const cityList = cities.status === 'fulfilled' && Array.isArray(cities.value?.data) ? cities.value.data : [];
            const hotelList = hotels.status === 'fulfilled' && Array.isArray(hotels.value?.data) ? hotels.value.data : [];
            // "noida" -> Noida, Greater Noida, then Noida hotels; "hyatt" -> hotels only
            const list = mergeDestinationSuggestions(cityList, hotelList);
            if (active) {
                setSuggestions(list);
                setActiveIndex(list.length ? 0 : -1);
                setSuggestLoading(false);
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [query, suggestOpen, destination]);

    /* landing page picks */
    useEffect(() => {
        if (!preset?.nonce) return;
        const pick = preset.search?.destination || preset.destination;
        if (pick) {
            setDestination(pick);
            setQuery(pick.label || pick.hotelName || pick.cityName || '');
            setSuggestOpen(false);
        } else if (preset.query) {
            setDestination(null);
            setQuery(preset.query);
            setSuggestOpen(true);
        }
        const previous = preset.search;
        if (previous) {
            if (previous.checkIn >= today && previous.checkOut > previous.checkIn) {
                setCheckIn(previous.checkIn);
                setCheckOut(previous.checkOut);
            }
            if (Array.isArray(previous.rooms) && previous.rooms.length) setRooms(previous.rooms);
            if (previous.nationality) setNationality(String(previous.nationality));
            if (previous.residence) setResidence(String(previous.residence));
        }
        setError('');
        destInputRef.current?.focus({ preventScroll: true });
        // only a new pick (nonce) applies the preset
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset?.nonce]);

    /* close popovers on outside click */
    useEffect(() => {
        const close = (event) => {
            if (destRef.current && !destRef.current.contains(event.target)) setSuggestOpen(false);
            if (paxRef.current && !paxRef.current.contains(event.target)) setPaxOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const pickDestination = (item) => {
        if (item.kind === 'HOTEL') {
            // one hotel: search goes straight to its rooms
            setDestination({
                type: 'HOTEL',
                tjHotelId: String(item.tjHotelId),
                hotelName: item.name,
                cityName: titleCase(item.cityName) || item.name,
                countryName: item.countryName,
                fullRegionName: [titleCase(item.cityName), item.stateName, item.countryName].filter(Boolean).join(', '),
                label: item.name,
            });
            setQuery(item.name);
            setSuggestOpen(false);
            setError('');
            return;
        }
        setDestination({
            type: 'CITY',
            cityRegionId: String(item.cityRegionId),
            cityName: item.cityName,
            regionName: item.regionName,
            fullRegionName: item.fullRegionName,
            countryName: item.countryName,
            regionType: item.regionType,
            label: item.cityName,
        });
        setQuery(item.cityName);
        setSuggestOpen(false);
        setError('');
    };

    const onDestKey = (event) => {
        if (!suggestOpen || !suggestions.length) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((i) => Math.max(0, i - 1));
        } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            pickDestination(suggestions[activeIndex]);
        } else if (event.key === 'Escape') {
            setSuggestOpen(false);
        }
    };

    /* rooms & guests */
    const updateRoom = (index, patch) =>
        setRooms((prev) => prev.map((room, i) => {
            if (i !== index) return room;
            const next = { ...room, ...patch };
            const count = Number(next.children) || 0;
            next.childAges = Array.from({ length: count }, (_, k) => (next.childAges || [])[k] ?? 5);
            return next;
        }));

    const paxLabel = `${totals.adults} Adult${totals.adults > 1 ? 's' : ''}${totals.children ? `, ${totals.children} Child${totals.children > 1 ? 'ren' : ''}` : ''}`;

    const nationalityName = useMemo(
        () => nationalities.find((item) => String(item.countryId) === String(nationality))?.name || 'Indian',
        [nationalities, nationality]
    );

    /* ---------- search ---------- */
    const handleSearch = async (event) => {
        event?.preventDefault();
        if (loading) return;

        if (!destination?.cityRegionId && !destination?.tjHotelId) {
            setError('Select a city, area or hotel from the list.');
            setSuggestOpen(true);
            return;
        }
        if (!checkIn || checkIn < today) {
            setError('Check-in date cannot be in the past.');
            return;
        }
        if (!checkOut || checkOut <= checkIn) {
            setError('Check-out must be after check-in.');
            return;
        }
        if (nights > 30) {
            setError('Stays longer than 30 nights cannot be booked online.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const isHotel = destination.type === 'HOTEL';
            let hids = [destination.tjHotelId];
            if (!isHotel) {
                setStage('Finding hotels in this area…');
                const hidsResponse = await hotelService.hotelIdsByRegion({
                    regionIds: [destination.cityRegionId],
                    countryName: destination.countryName,
                    page: 0,
                    size: 2000,
                });
                hids = extractHids(hidsResponse);
                if (!hids.length) throw new Error('No hotels found for this destination. Try a nearby city.');
            }

            setStage('Checking live prices and availability…');
            const correlationId = generateCorrelationId();
            const response = await hotelService.listing({
                checkIn,
                checkOut,
                rooms: toApiRooms(rooms),
                currency: 'INR',
                correlationId,
                nationality: String(nationality),
                timeoutMs: 13000,
                hids,
            });

            const body = response?.data || {};
            const usedCorrelationId = body.correlationId || correlationId;
            const rawHotels = body.data?.hotels || body.hotels || [];
            const hotels = (Array.isArray(rawHotels) ? rawHotels : [])
                .filter((hotel) => Array.isArray(hotel?.options) && hotel.options.length)
                .map((hotel) => slimHotel(hotel, usedCorrelationId));
            if (isHotel && !hotels.length) {
                throw new Error(`${destination.hotelName} has no rooms available for these dates. Try other dates or search the city instead.`);
            }

            const search = {
                destination,
                checkIn,
                checkOut,
                rooms,
                nationality: String(nationality),
                // country of residence: kept with the search and the booking
                // (the supplier prices by nationality)
                residence: String(residence),
                currency: 'INR',
                correlationId: usedCorrelationId,
                searchedAt: new Date().toISOString(),
            };
            const saved = { search, hotels, correlationId: usedCorrelationId, searchedAt: search.searchedAt };

            try {
                sessionStorage.setItem(SEARCH_KEY, JSON.stringify(search));
            } catch {
                // storage blocked / full: the results still open from memory
            }
            // big cities do not fit in storage: kept in memory, stored copy trimmed
            saveSearchResults(saved);

            // "Your recent searches" on the landing page (this browser only)
            saveRecent(HOTEL_RECENT_KEY, {
                key: `${destination.tjHotelId || destination.cityRegionId}|${checkIn}|${checkOut}|${JSON.stringify(toApiRooms(rooms))}`,
                destination,
                checkIn,
                checkOut,
                rooms,
                nationality: String(nationality),
                residence: String(residence),
            });

            onSearched?.(saved);
        } catch (err) {
            setError(apiError(err, 'Unable to search hotels right now. Please try again.'));
        } finally {
            setLoading(false);
            setStage('');
        }
    };

    return (
        <form className="hb-search" onSubmit={handleSearch} noValidate>
            <div className="hb-search-grid">
                {/* destination */}
                <div className="hb-field hb-dest" ref={destRef} onClick={() => setSuggestOpen(true)}>
                    <small>City, area or hotel name</small>
                    <input
                        ref={destInputRef}
                        type="text"
                        value={query}
                        placeholder="Where are you going? City or hotel"
                        autoComplete="off"
                        onFocus={() => setSuggestOpen(true)}
                        onKeyDown={onDestKey}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setDestination(null);
                            setSuggestOpen(true);
                        }}
                    />
                    <em>{destination?.fullRegionName ? `${destination.fullRegionName}` : 'Type a city, area or hotel name'}</em>

                    {suggestOpen && query.trim().length >= 2 && !destination && (
                        <div className="hb-dropdown" role="listbox">
                            {suggestLoading && <div className="hb-dropdown-head">Searching…</div>}
                            {!suggestLoading && !suggestions.length && <div className="hb-dropdown-head">No matching city or hotel</div>}
                            {suggestions.map((item, index) => (
                                <button
                                    type="button"
                                    key={item.kind === 'HOTEL' ? `h-${item.tjHotelId}` : `c-${item.cityRegionId}-${index}`}
                                    className={`hb-option hb-option-${item.kind === 'HOTEL' ? 'hotel' : 'city'} ${index === activeIndex ? 'active' : ''}`}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => pickDestination(item)}
                                >
                                    <i aria-hidden="true">{item.kind === 'HOTEL' ? '🏨' : '📍'}</i>
                                    <span>
                                        <strong>{item.kind === 'HOTEL' ? item.name : item.displayName || item.cityName}</strong>
                                        <small>
                                            {item.kind === 'HOTEL'
                                                // "(Greater Noida)", country only outside India: "(Swat, Pakistan)"
                                                ? `(${[
                                                    titleCase(item.cityName) || item.stateName,
                                                    String(item.countryName || '').toUpperCase() !== 'INDIA' && titleCase(item.countryName),
                                                ].filter(Boolean).join(', ')})`
                                                : placeSubtitle(item)}
                                        </small>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* dates */}
                <label className="hb-field">
                    <small>Check-in</small>
                    <input
                        type="date"
                        value={checkIn}
                        min={today}
                        onChange={(event) => {
                            const value = event.target.value;
                            setCheckIn(value);
                            if (!checkOut || checkOut <= value) setCheckOut(addDays(value, 1));
                        }}
                    />
                    <em>{formatDate(checkIn)}</em>
                </label>
                <label className="hb-field">
                    <small>Check-out</small>
                    <input
                        type="date"
                        value={checkOut}
                        min={checkIn ? addDays(checkIn, 1) : today}
                        onChange={(event) => setCheckOut(event.target.value)}
                    />
                    <em>{nights ? `${nights} night${nights > 1 ? 's' : ''}` : 'Select date'}</em>
                </label>

                {/* rooms & guests */}
                <div className="hb-field hb-pax" ref={paxRef}>
                    <small>Rooms & guests</small>
                    <button type="button" className="hb-field-btn" onClick={() => setPaxOpen((value) => !value)}>
                        {rooms.length} Room{rooms.length > 1 ? 's' : ''}, {totals.adults + totals.children} Guest{totals.adults + totals.children > 1 ? 's' : ''}
                    </button>
                    <em>{paxLabel}</em>

                    {paxOpen && (
                        <div className="hb-dropdown hb-pax-pop">
                            {rooms.map((room, index) => (
                                <div className="hb-room-block" key={index}>
                                    <div className="hb-room-head">
                                        <span>Room {index + 1}</span>
                                        {rooms.length > 1 && (
                                            <button type="button" onClick={() => setRooms((prev) => prev.filter((_, i) => i !== index))}>Remove</button>
                                        )}
                                    </div>
                                    <div className="hb-counter">
                                        <span>Adults<small>12+ years</small></span>
                                        <span className="hb-stepper">
                                            <button type="button" disabled={room.adults <= 1} onClick={() => updateRoom(index, { adults: room.adults - 1 })}>−</button>
                                            <span>{room.adults}</span>
                                            <button type="button" disabled={room.adults >= MAX_ADULTS} onClick={() => updateRoom(index, { adults: room.adults + 1 })}>+</button>
                                        </span>
                                    </div>
                                    <div className="hb-counter">
                                        <span>Children<small>0–17 years</small></span>
                                        <span className="hb-stepper">
                                            <button type="button" disabled={room.children <= 0} onClick={() => updateRoom(index, { children: room.children - 1 })}>−</button>
                                            <span>{room.children}</span>
                                            <button type="button" disabled={room.children >= MAX_CHILDREN} onClick={() => updateRoom(index, { children: room.children + 1 })}>+</button>
                                        </span>
                                    </div>
                                    {room.children > 0 && (
                                        <div className="hb-child-ages">
                                            {room.childAges.map((age, k) => (
                                                <label key={k}>
                                                    Child {k + 1} age
                                                    <select
                                                        value={age}
                                                        onChange={(event) => {
                                                            const ages = [...room.childAges];
                                                            ages[k] = Number(event.target.value);
                                                            updateRoom(index, { childAges: ages });
                                                        }}
                                                    >
                                                        {Array.from({ length: 18 }, (_, n) => <option key={n} value={n}>{n < 1 ? '< 1' : n}</option>)}
                                                    </select>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="hb-pax-actions">
                                <button
                                    type="button"
                                    className="hb-link"
                                    disabled={rooms.length >= MAX_ROOMS}
                                    onClick={() => setRooms((prev) => [...prev, emptyRoom()])}
                                >
                                    + Add room
                                </button>
                                <button type="button" className="hb-btn hb-btn-sm" onClick={() => setPaxOpen(false)}>Done</button>
                            </div>
                        </div>
                    )}
                </div>

                <button type="submit" className="hb-search-btn" disabled={loading}>
                    {loading ? 'Searching…' : 'Search'}
                </button>
            </div>

            <div className="hb-search-extra">
                <label>
                    <span>Nationality</span>
                    <select value={nationality} onChange={(event) => setNationality(event.target.value)} disabled={!nationalities.length}>
                        {nationalities.length
                            ? nationalities.map((item) => (
                                <option key={item.countryId} value={String(item.countryId)}>{item.name}</option>
                            ))
                            : <option value={nationality}>{nationalityName}</option>}
                    </select>
                </label>
                <label>
                    <span>Country of residence</span>
                    <select value={residence} onChange={(event) => setResidence(event.target.value)} disabled={!nationalities.length}>
                        {nationalities.length
                            ? nationalities.map((item) => (
                                <option key={item.countryId} value={String(item.countryId)}>{item.name}</option>
                            ))
                            : <option value={residence}>{nationalityName}</option>}
                    </select>
                </label>
                <small>Room prices depend on the guest&apos;s nationality.</small>
            </div>

            {(error || stage) && <p className={error ? 'hb-error' : 'hb-muted hb-small'} style={{ margin: '10px 2px 0' }}>{error || stage}</p>}
        </form>
    );
}
