'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import './results.css';
import './flight-results-filters.css';
import './flight-results-mobile.css';
import flightService from '@/app/services/flightBookingService';
import { FlightSearchForm } from '../FlightsClient';
import { useStickyHeaderOffset } from '../BookingTopBar';
import SelectionShareBar from '@/components/share/SelectionShareBar';

/* =========================================================
   CONSTANTS
========================================================= */

const SEARCH_KEY = 'tripjack_flight_search';
const SELECTED_KEY = 'tripjack_selected_flight';
const UNAVAILABLE_KEY = 'tripjack_unavailable_flights';
const DATE_PRICES_KEY = 'tripjack_flight_date_prices';
const DATE_PRICE_TTL = 20 * 60 * 1000;

const PAX_TYPES = [
    ['ADULT', 'adults', 'Adult'],
    ['CHILD', 'children', 'Child'],
    ['INFANT', 'infants', 'Infant'],
];

const TIME_SLOTS = [
    { value: '00-06', label: 'Before 6 AM', icon: '🌙' },
    { value: '06-12', label: '6 AM - 12 PM', icon: '🌅' },
    { value: '12-18', label: '12 PM - 6 PM', icon: '☀️' },
    { value: '18-24', label: 'After 6 PM', icon: '🌆' },
];

const STOP_OPTIONS = [
    { value: '0', label: 'Non-stop' },
    { value: '1', label: '1 Stop' },
    { value: '2+', label: '2+ Stops' },
];

/* TripJack fd.ADULT.rT */
const REFUND_TYPES = {
    0: { value: 'NON_REFUNDABLE', label: 'Non-Refundable', tone: 'danger' },
    1: { value: 'REFUNDABLE', label: 'Refundable', tone: 'success' },
    2: { value: 'PARTIAL', label: 'Partially Refundable', tone: 'warning' },
};

const RULE_LABELS = {
    CANCELLATION: 'Cancellation',
    DATECHANGE: 'Date Change',
    DATE_CHANGE: 'Date Change',
    NO_SHOW: 'No Show',
    SEAT_CHARGEABLE: 'Seat Chargeable',
};

const DEFAULT_FILTERS = {
    minPrice: '',
    maxPrice: '',
    stops: [],
    departureSlots: [],
    arrivalSlots: [],
    airlines: [],
    fareTypes: [],
    refundTypes: [],
    layoverAirports: [],
    freeMeal: false,
    checkInBaggage: false,
    hideNearbyAirports: false,
    maxDuration: '',
    maxLayover: '',
    flightNumber: '',
};

/* =========================================================
   HELPERS
========================================================= */

const money = (value) =>
    `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

const formatTime = (value) => {
    if (!value) return '--';
    const match = String(value).match(/T(\d{2}:\d{2})/);
    return match ? match[1] : String(value).slice(11, 16) || '--';
};

const formatDate = (value) => {
    if (!value) return '--';
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
    });
};

const formatDuration = (minutes = 0) => {
    const total = Number(minutes) || 0;
    const hrs = Math.floor(total / 60);
    const mins = total % 60;
    if (!hrs) return `${mins}m`;
    if (!mins) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
};

const formatISODate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const humanize = (value) =>
    String(value || '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const getHour = (value) => {
    const match = String(value || '').match(/T(\d{2}):(\d{2})/);
    return match ? Number(match[1]) + Number(match[2]) / 60 : null;
};

const getSlot = (hour) => {
    if (hour === null) return null;
    if (hour < 6) return '00-06';
    if (hour < 12) return '06-12';
    if (hour < 18) return '12-18';
    return '18-24';
};

const minutesBetween = (from, to) => {
    const start = new Date(from).getTime();
    const end = new Date(to).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
    return Math.round((end - start) / 60000);
};

const dayDiff = (from, to) => {
    const start = new Date(`${String(from).slice(0, 10)}T00:00:00`).getTime();
    const end = new Date(`${String(to).slice(0, 10)}T00:00:00`).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
    return Math.round((end - start) / 86400000);
};

/* ---------- TripJack search result ---------- */

const getTripInfos = (response) =>
    response?.searchResult?.tripInfos ||
    response?.data?.searchResult?.tripInfos ||
    {};

const getSegments = (flight) => (Array.isArray(flight?.sI) ? flight.sI : []);

const getFares = (flight) =>
    Array.isArray(flight?.totalPriceList)
        ? flight.totalPriceList
        : Array.isArray(flight?.priceList)
            ? flight.priceList
            : [];

const getAdultFare = (fare) => fare?.fd?.ADULT || {};

const getFarePrice = (fare) =>
    Number(getAdultFare(fare)?.fC?.TF ?? getAdultFare(fare)?.fC?.NF ?? 0) || 0;

/* lowest adult fare across a list of flights (0 when none) */
const cheapestFare = (flights) =>
    flights.reduce((min, flight) => {
        getFares(flight).forEach((fare) => {
            const price = getFarePrice(fare);
            if (price && (!min || price < min)) min = price;
        });
        return min;
    }, 0);

const getFareName = (fare) =>
    humanize(fare?.fareIdentifier || fare?.fareType || 'PUBLISHED');

const getRefundType = (fare) => {
    const rT = getAdultFare(fare)?.rT;
    return REFUND_TYPES[rT] || null;
};

const getBaggage = (fare, type = 'ADULT') => {
    const bI = fare?.fd?.[type]?.bI || {};
    return {
        checkIn: bI.iB || null,
        cabin: bI.cB || null,
    };
};

const hasCheckInBaggage = (fare) => {
    const value = String(getBaggage(fare).checkIn || '');
    return /[1-9]/.test(value);
};

const hasFreeMeal = (fare) => getAdultFare(fare)?.mI === true;

const getSeatsLeft = (fare) => {
    const seats = Number(getAdultFare(fare)?.sR);
    return Number.isFinite(seats) && seats > 0 ? seats : null;
};

const getFareBreakup = (fare, search) =>
    PAX_TYPES.map(([type, key, label]) => {
        const count = Number(search?.[key] ?? (type === 'ADULT' ? 1 : 0)) || 0;
        const fC = fare?.fd?.[type]?.fC || {};
        return {
            type,
            label,
            count,
            base: Number(fC.BF || 0),
            taxes: Number(fC.TAF || 0),
            total: Number(fC.TF || 0),
        };
    }).filter((row) => row.count > 0);

const getFareTotal = (fare, search) =>
    getFareBreakup(fare, search).reduce(
        (sum, row) => sum + row.total * row.count,
        0
    );

const getFlightId = (flight) =>
    getSegments(flight)
        .map((segment) =>
            [segment?.fD?.aI?.code, segment?.fD?.fN, segment?.dt].join('-')
        )
        .join('|') || getFares(flight)?.[0]?.id || '';

const getAirlines = (flight) => {
    const map = new Map();
    getSegments(flight).forEach((segment) => {
        const airline = segment?.fD?.aI;
        if (airline?.code) map.set(airline.code, airline);
    });
    return [...map.values()];
};

const getFlightNumbers = (flight) =>
    getSegments(flight)
        .map((segment) =>
            segment?.fD?.aI?.code && segment?.fD?.fN
                ? `${segment.fD.aI.code}-${segment.fD.fN}`
                : null
        )
        .filter(Boolean);

/*
 * COMBO results (international round trip / multi city)
 * contain all journeys in one sI list. Split them back into
 * journeys using the searched routes (or the isRs flag).
 */
const splitJourneys = (segments, routes) => {
    if (!segments.length) return [];
    if (!Array.isArray(routes) || routes.length < 2) return [segments];

    const journeys = [[]];
    let routeIndex = 0;

    segments.forEach((segment, index) => {
        journeys[journeys.length - 1].push(segment);

        const next = segments[index + 1];
        const target = routes[routeIndex]?.toCityOrAirport?.code;
        const reachedTarget = target && segment?.aa?.code === target;
        const returnStarts = next?.isRs && !segment?.isRs;

        if (
            next &&
            routeIndex < routes.length - 1 &&
            (reachedTarget || returnStarts)
        ) {
            journeys.push([]);
            routeIndex += 1;
        }
    });

    return journeys.filter((journey) => journey.length);
};

const getJourneySummary = (segments) => {
    const first = segments[0];
    const last = segments[segments.length - 1];

    const flying = segments.reduce(
        (sum, segment) => sum + Number(segment?.duration || 0),
        0
    );

    const layover = segments.slice(0, -1).reduce(
        (sum, segment, index) =>
            sum + minutesBetween(segment?.at, segments[index + 1]?.dt),
        0
    );

    const stopovers = segments.reduce(
        (sum, segment) => sum + (Array.isArray(segment?.so) ? segment.so.length : Number(segment?.stops || 0)),
        0
    );

    return {
        first,
        last,
        duration: flying + layover,
        layover,
        stops: segments.length - 1 + stopovers,
        via: segments.slice(0, -1).map((segment) => segment?.aa?.code).filter(Boolean),
        nextDay: dayDiff(first?.dt, last?.at),
    };
};

const getLayovers = (segments) =>
    segments.slice(0, -1).map((segment, index) => ({
        airport: segment?.aa?.code,
        city: segment?.aa?.city,
        minutes: minutesBetween(segment?.at, segments[index + 1]?.dt),
        terminalChange:
            segment?.aa?.terminal &&
            segments[index + 1]?.da?.terminal &&
            segment.aa.terminal !== segments[index + 1].da.terminal,
    }));

/* =========================================================
   COMPARE + SHARE (picked flights)
========================================================= */

const MAX_PICKS = 4;

const stopsText = (summary) =>
    summary.stops === 0
        ? 'Non-stop'
        : `${summary.stops} stop${summary.stops > 1 ? 's' : ''}${summary.via.length ? ` via ${summary.via.join(', ')}` : ''}`;

const journeyText = (summary) =>
    `${formatTime(summary.first?.dt)} ${summary.first?.da?.code || ''} → ${formatTime(summary.last?.at)} ${summary.last?.aa?.code || ''}` +
    `${summary.nextDay > 0 ? ` (+${summary.nextDay} day)` : ''} · ${formatDuration(summary.duration)} · ${stopsText(summary)}`;

/* Plain text for WhatsApp / email (no supplier names, only what the customer sees) */
const buildFlightShareText = ({ rows, search, routeLabel, dateLabel }) => {
    const adults = Number(search.adults) || 1;
    const children = Number(search.children) || 0;
    const infants = Number(search.infants) || 0;
    const travellers = [
        `${adults} adult${adults > 1 ? 's' : ''}`,
        children && `${children} child${children > 1 ? 'ren' : ''}`,
        infants && `${infants} infant${infants > 1 ? 's' : ''}`,
    ].filter(Boolean).join(', ');

    const lines = [
        `Flight options: ${routeLabel}`,
        `${dateLabel} · ${travellers} · ${humanize(search.cabinClass || 'ECONOMY')}`,
        '',
    ];
    rows.forEach(({ item, fare }, index) => {
        const baggage = getBaggage(fare);
        const refund = getRefundType(fare);
        lines.push(`${index + 1}) ${item.airlines.map((a) => a.name || a.code).join(' + ')} (${item.flightNumbers.join(', ')})`);
        item.summaries.forEach((summary) => lines.push(`   ${journeyText(summary)}`));
        lines.push(`   ${money(getFarePrice(fare))} per adult · ${getFareName(fare)} fare${baggage.checkIn ? ` · Check-in ${baggage.checkIn}` : ''}${refund ? ` · ${refund.label}` : ''}`);
        lines.push('');
    });
    lines.push('Fares are live at the time of sharing and can change until the booking is made.');
    if (typeof window !== 'undefined') lines.push(`Search & book: ${window.location.origin}/flights`);
    return lines.join('\n');
};

function FlightCompare({ rows, onClose, onRemove, onSelect, multiLeg }) {
    useEffect(() => {
        const onKey = (event) => event.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // "Cheapest" / "Fastest" only when the flights actually differ
    const prices = rows.map(({ fare }) => getFarePrice(fare));
    const durations = rows.map(({ item }) => item.summaries.reduce((sum, s) => sum + s.duration, 0));
    const cheapest = new Set(prices).size > 1 ? Math.min(...prices) : null;
    const fastest = new Set(durations).size > 1 ? Math.min(...durations) : null;
    const attributes = [
        ['Departure', ({ item }) => item.summaries.map((s, i) => <div key={i}><b>{formatTime(s.first?.dt)}</b> {s.first?.da?.code} · {formatDate(s.first?.dt)}</div>)],
        ['Arrival', ({ item }) => item.summaries.map((s, i) => <div key={i}><b>{formatTime(s.last?.at)}</b> {s.last?.aa?.code}{s.nextDay > 0 ? ` (+${s.nextDay})` : ''}</div>)],
        ['Duration', ({ item }) => {
            const total = item.summaries.reduce((sum, s) => sum + s.duration, 0);
            return <>{item.summaries.map((s, i) => <div key={i}>{formatDuration(s.duration)}</div>)}{total === fastest && rows.length > 1 && <em className="fr-cmp-best">Fastest</em>}</>;
        }],
        ['Stops', ({ item }) => item.summaries.map((s, i) => <div key={i}>{stopsText(s)}</div>)],
        ['Fare', ({ fare }) => <>{getFareName(fare)}{hasFreeMeal(fare) && <div className="fr-cmp-muted">Free meal</div>}</>],
        ['Check-in bag', ({ fare }) => getBaggage(fare).checkIn || '—'],
        ['Cabin bag', ({ fare }) => getBaggage(fare).cabin || '—'],
        ['Cancellation', ({ fare }) => {
            const refund = getRefundType(fare);
            return refund ? <span className={`fr-tag ${refund.tone}`}>{refund.label}</span> : '—';
        }],
        ['Seats left', ({ fare }) => getSeatsLeft(fare) || '—'],
    ];

    return (
        <div className="fr-cmp-backdrop" role="presentation" onClick={onClose}>
            <div className="fr-cmp" role="dialog" aria-modal="true" aria-label="Compare flights" onClick={(event) => event.stopPropagation()}>
                <div className="fr-cmp-head">
                    <strong>Compare flights ({rows.length})</strong>
                    <button type="button" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className="fr-cmp-scroll">
                    <table className="fr-cmp-table">
                        <thead>
                            <tr>
                                <th scope="col" />
                                {rows.map(({ item, fare }) => (
                                    <th scope="col" key={item.id}>
                                        <AirlineLogo code={item.airlines[0]?.code} name={item.airlines[0]?.name} size={30} />
                                        <strong>{item.airlines.map((a) => a.name || a.code).join(' + ')}</strong>
                                        <small>{item.flightNumbers.join(', ')}</small>
                                        <span className="fr-cmp-price">{money(getFarePrice(fare))}<small> /adult</small></span>
                                        {getFarePrice(fare) === cheapest && rows.length > 1 && <em className="fr-cmp-best">Cheapest</em>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {attributes.map(([label, render]) => (
                                <tr key={label}>
                                    <th scope="row">{label}</th>
                                    {rows.map((row) => <td key={row.item.id}>{render(row)}</td>)}
                                </tr>
                            ))}
                            <tr className="fr-cmp-actions">
                                <th scope="row" />
                                {rows.map((row) => (
                                    <td key={row.item.id}>
                                        <button type="button" className="fr-select-btn" onClick={() => onSelect(row)}>
                                            {multiLeg ? 'Select' : 'Book Now'}
                                        </button>
                                        <button type="button" className="fr-cmp-remove" onClick={() => onRemove(row.item.id)}>Remove</button>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function AirlineLogo({ code, name, size = 36 }) {
    const [failed, setFailed] = useState(false);

    if (!code || failed) {
        return (
            <span
                className="fr-logo fr-logo-fallback"
                style={{ width: size, height: size }}
            >
                {code || '✈'}
            </span>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            className="fr-logo"
            src={`https://pics.avs.io/120/120/${code}.png`}
            alt={name || code}
            width={size}
            height={size}
            loading="lazy"
            onError={() => setFailed(true)}
        />
    );
}

function FilterSection({ title, onClear, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="fr-filter-section">
            <div className="fr-filter-head">
                <button
                    type="button"
                    className="fr-filter-toggle"
                    onClick={() => setOpen((value) => !value)}
                >
                    {title}
                    <span>{open ? '−' : '+'}</span>
                </button>
                {onClear && (
                    <button type="button" className="fr-link" onClick={onClear}>
                        Clear
                    </button>
                )}
            </div>
            {open && <div className="fr-filter-body">{children}</div>}
        </div>
    );
}

function FareRules({ state }) {
    if (!state || state.loading) {
        return <p className="fr-muted">Loading fare rules…</p>;
    }

    if (state.error) {
        return <p className="fr-error-text">{state.error}</p>;
    }

    const fareRule =
        state.data?.fareRule ||
        state.data?.data?.fareRule ||
        {};

    const routes = Object.entries(fareRule);

    if (!routes.length) {
        return <p className="fr-muted">Fare rules are not available for this fare.</p>;
    }

    return (
        <div className="fr-rules">
            {routes.map(([route, rule]) => {
                const groups = Object.entries(rule?.tfr || {});

                return (
                    <div className="fr-rule-route" key={route}>
                        <h6>{route.replace('_', ' → ')}</h6>

                        {groups.length ? (
                            <table className="fr-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Time frame</th>
                                        <th>Airline fee + Service fee</th>
                                        <th>Policy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.flatMap(([type, items]) =>
                                        (Array.isArray(items) ? items : []).map((item, index) => (
                                            <tr key={`${type}-${index}`}>
                                                <td>{RULE_LABELS[type] || humanize(type)}</td>
                                                <td>
                                                    {item?.st !== undefined || item?.et !== undefined
                                                        ? `${item?.st ?? 0} – ${item?.et ?? '∞'} hrs before departure`
                                                        : '—'}
                                                </td>
                                                <td>
                                                    {item?.amount !== undefined
                                                        ? `${money(item.amount)}${item?.additionalFee ? ` + ${money(item.additionalFee)}` : ''}`
                                                        : '—'}
                                                </td>
                                                <td>{item?.policyInfo || '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <p className="fr-muted">
                                {typeof rule?.miscInfo === 'string'
                                    ? rule.miscInfo
                                    : 'Detailed rules not provided by the airline.'}
                            </p>
                        )}
                    </div>
                );
            })}
            <p className="fr-muted fr-small">
                Fees are indicative and charged per passenger per sector, as provided by the airline.
            </p>
        </div>
    );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function FlightResultsPage() {
    const router = useRouter();
    useStickyHeaderOffset();

    /*
     * Session read without setState-in-effect:
     *   null => not hydrated yet, '' => no saved search.
     */
    const storedSearch = useSyncExternalStore(
        () => () => {},
        () => sessionStorage.getItem(SEARCH_KEY) || '',
        () => null
    );

    const [searchOverride, setSearchOverride] = useState(null);

    const searchData = useMemo(() => {
        if (searchOverride) return searchOverride;
        if (!storedSearch) return null;
        try {
            return JSON.parse(storedSearch);
        } catch {
            return null;
        }
    }, [searchOverride, storedSearch]);

    useEffect(() => {
        if (storedSearch === '' && !searchOverride) {
            router.replace('/flights');
        }
    }, [storedSearch, searchOverride, router]);

    const [unavailableFlights, setUnavailableFlights] = useState(() => {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(sessionStorage.getItem(UNAVAILABLE_KEY) || '[]');
        } catch {
            return [];
        }
    });

    const [modifyOpen, setModifyOpen] = useState(false);
    const [selectedFlights, setSelectedFlights] = useState({});
    const [activeLegKey, setActiveLegKey] = useState(null);
    const [fareChoice, setFareChoice] = useState({});
    const [showAllFares, setShowAllFares] = useState({});
    const [detailsOpen, setDetailsOpen] = useState({});
    const [fareRules, setFareRules] = useState({});
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [sortBy, setSortBy] = useState('price');
    const [airlineQuery, setAirlineQuery] = useState('');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [dateSearchLoading, setDateSearchLoading] = useState(false);
    const [dateError, setDateError] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    // flights picked to compare / share, per leg: { [legKey]: [{ id, fareId }] }
    const [picked, setPicked] = useState({});
    const [compareOpen, setCompareOpen] = useState(false);

    /* =====================================================
       SEARCH CONTEXT
    ===================================================== */

    const search = searchData?.search || {};
    const tripType = searchData?.tripType || 'ONE_WAY';
    const routeInfos = useMemo(
        () => searchData?.request?.searchQuery?.routeInfos || [],
        [searchData]
    );
    const tripInfos = useMemo(
        () => getTripInfos(searchData?.response),
        [searchData]
    );

    const travellerCount =
        (Number(search.adults) || 1) +
        (Number(search.children) || 0) +
        (Number(search.infants) || 0);

    /* =====================================================
       LEGS (ONWARD / RETURN / multi-city / COMBO)
    ===================================================== */

    const flightLegs = useMemo(() => {
        const list = (value) => (Array.isArray(value) ? value : []);

        if (list(tripInfos.COMBO).length) {
            return [{
                key: 'COMBO',
                title: tripType === 'MULTI_CITY' ? 'Multi City' : 'Round Trip',
                route: routeInfos[0] || null,
                routes: routeInfos,
                isCombo: true,
                flights: list(tripInfos.COMBO),
            }];
        }

        if (tripType === 'ROUND_TRIP') {
            return [
                { key: 'ONWARD', title: 'Onward', route: routeInfos[0] || null, flights: list(tripInfos.ONWARD) },
                { key: 'RETURN', title: 'Return', route: routeInfos[1] || null, flights: list(tripInfos.RETURN) },
            ].filter((leg) => leg.flights.length);
        }

        const numericKeys = Object.keys(tripInfos)
            .filter((key) => /^\d+$/.test(key))
            .sort((a, b) => Number(a) - Number(b));

        if (tripType === 'MULTI_CITY' && numericKeys.length) {
            return numericKeys.map((key, index) => ({
                key,
                title: `Flight ${index + 1}`,
                route: routeInfos[index] || null,
                flights: list(tripInfos[key]),
            }));
        }

        const flights = list(tripInfos.ONWARD).length
            ? tripInfos.ONWARD
            : list(tripInfos[numericKeys[0]]);

        return [{ key: 'ONWARD', title: 'Flight', route: routeInfos[0] || null, flights }];
    }, [tripInfos, tripType, routeInfos]);

    const activeLeg =
        flightLegs.find((leg) => leg.key === activeLegKey) || flightLegs[0] || null;

    const activeLegIndex = Math.max(
        0,
        flightLegs.findIndex((leg) => leg.key === activeLeg?.key)
    );

    const legRoutes = useMemo(
        () => (activeLeg?.isCombo ? activeLeg.routes : [activeLeg?.route].filter(Boolean)),
        [activeLeg]
    );

    /* =====================================================
       FILTERING (flight level + fare level)
    ===================================================== */

    const fareMatches = (fare) => {
        const f = filters;
        if (f.fareTypes.length && !f.fareTypes.includes(getFareName(fare))) return false;
        if (f.refundTypes.length && !f.refundTypes.includes(getRefundType(fare)?.value)) return false;
        if (f.freeMeal && !hasFreeMeal(fare)) return false;
        if (f.checkInBaggage && !hasCheckInBaggage(fare)) return false;
        const price = getFarePrice(fare);
        if (f.minPrice !== '' && price < Number(f.minPrice)) return false;
        if (f.maxPrice !== '' && price > Number(f.maxPrice)) return false;
        return true;
    };

    /*
     * TripJack returns the same flight several times (one entry per
     * supplier). Merge them into one card with all fares, like TripJack,
     * so every card has a unique key and filters re-render correctly.
     */
    const sourceFlights = useMemo(() => {
        const merged = new Map();

        (activeLeg?.flights || []).forEach((flight) => {
            const id = getFlightId(flight);
            const existing = merged.get(id);

            if (!existing) {
                merged.set(id, { ...flight, totalPriceList: [...getFares(flight)] });
                return;
            }

            const fareIds = new Set(existing.totalPriceList.map((fare) => fare?.id));
            getFares(flight).forEach((fare) => {
                if (!fareIds.has(fare?.id)) existing.totalPriceList.push(fare);
            });
        });

        return [...merged.values()];
    }, [activeLeg]);

    const enrichedFlights = useMemo(
        () =>
            sourceFlights.map((flight, index) => {
                const segments = getSegments(flight);
                const journeys = activeLeg?.isCombo
                    ? splitJourneys(segments, activeLeg.routes)
                    : [segments];
                const fares = [...getFares(flight)].sort(
                    (a, b) => getFarePrice(a) - getFarePrice(b)
                );

                return {
                    flight,
                    index,
                    id: getFlightId(flight),
                    segments,
                    journeys,
                    summaries: journeys.map(getJourneySummary),
                    fares,
                    airlines: getAirlines(flight),
                    flightNumbers: getFlightNumbers(flight),
                };
            }),
        [sourceFlights, activeLeg]
    );

    const visibleFlights = useMemo(() => {
        const f = filters;
        const flightNumberQuery = f.flightNumber.replace(/[^a-z0-9]/gi, '').toLowerCase();

        const list = enrichedFlights
            .map((item) => ({ ...item, visibleFares: item.fares.filter(fareMatches) }))
            .filter((item) => {
                if (!item.visibleFares.length) return false;

                const main = item.summaries[0] || {};
                const maxStops = Math.max(...item.summaries.map((s) => s.stops));
                const stopKey = maxStops >= 2 ? '2+' : String(maxStops);

                if (f.stops.length && !f.stops.includes(stopKey)) return false;
                if (f.departureSlots.length && !f.departureSlots.includes(getSlot(getHour(main.first?.dt)))) return false;
                if (f.arrivalSlots.length && !f.arrivalSlots.includes(getSlot(getHour(main.last?.at)))) return false;
                if (f.airlines.length && !item.airlines.some((airline) => f.airlines.includes(airline.code))) return false;
                if (f.layoverAirports.length && !item.summaries.some((s) => s.via.some((code) => f.layoverAirports.includes(code)))) return false;
                if (f.maxDuration !== '' && item.summaries.some((s) => s.duration > Number(f.maxDuration))) return false;
                if (f.maxLayover !== '' && item.summaries.some((s) => s.layover > Number(f.maxLayover))) return false;
                if (flightNumberQuery && !item.flightNumbers.some((num) => num.replace(/[^a-z0-9]/gi, '').toLowerCase().includes(flightNumberQuery))) return false;

                if (f.hideNearbyAirports) {
                    const mismatch = item.journeys.some((journey, index) => {
                        const route = legRoutes[index];
                        const from = route?.fromCityOrAirport?.code;
                        const to = route?.toCityOrAirport?.code;
                        return (
                            (from && journey[0]?.da?.code !== from) ||
                            (to && journey[journey.length - 1]?.aa?.code !== to)
                        );
                    });
                    if (mismatch) return false;
                }

                return true;
            });

        const price = (item) => getFarePrice(item.visibleFares[0]);
        const duration = (item) => item.summaries.reduce((sum, s) => sum + s.duration, 0);
        const depart = (item) => getHour(item.summaries[0]?.first?.dt) ?? 99;
        const arrive = (item) => new Date(item.summaries[0]?.last?.at).getTime() || 0;

        const sorters = {
            price: (a, b) => price(a) - price(b),
            duration: (a, b) => duration(a) - duration(b),
            departure: (a, b) => depart(a) - depart(b),
            departureLate: (a, b) => depart(b) - depart(a),
            arrival: (a, b) => arrive(a) - arrive(b),
            priceHigh: (a, b) => price(b) - price(a),
        };

        return sorters[sortBy] ? [...list].sort(sorters[sortBy]) : list;
        // fareMatches only depends on filters
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enrichedFlights, filters, sortBy, legRoutes]);

    /* =====================================================
       FILTER OPTIONS (from current leg results)
    ===================================================== */

    const filterOptions = useMemo(() => {
        const airlines = new Map();
        const fareTypes = new Map();
        const refundTypes = new Map();
        const layovers = new Map();
        const stops = new Map();
        let min = Infinity;
        let max = 0;

        const setMin = (map, key, data, value) => {
            const current = map.get(key);
            map.set(key, {
                ...data,
                count: (current?.count || 0) + 1,
                price: Math.min(current?.price ?? Infinity, value),
            });
        };

        enrichedFlights.forEach((item) => {
            const cheapest = getFarePrice(item.fares[0]);
            if (!cheapest) return;

            item.fares.forEach((fare) => {
                const value = getFarePrice(fare);
                if (value) {
                    min = Math.min(min, value);
                    max = Math.max(max, value);
                }
            });

            item.airlines.forEach((airline) =>
                setMin(airlines, airline.code, { code: airline.code, name: airline.name || airline.code }, cheapest)
            );

            [...new Set(item.fares.map(getFareName))].forEach((name) =>
                setMin(fareTypes, name, { name }, cheapest)
            );

            [...new Set(item.fares.map((fare) => getRefundType(fare)?.value).filter(Boolean))].forEach((value) => {
                const type = Object.values(REFUND_TYPES).find((t) => t.value === value);
                setMin(refundTypes, value, type, cheapest);
            });

            [...new Set(item.summaries.flatMap((s) => s.via))].forEach((code) =>
                setMin(layovers, code, { code }, cheapest)
            );

            const maxStops = Math.max(...item.summaries.map((s) => s.stops));
            setMin(stops, maxStops >= 2 ? '2+' : String(maxStops), {}, cheapest);
        });

        return {
            airlines: [...airlines.values()].sort((a, b) => a.price - b.price),
            fareTypes: [...fareTypes.values()].sort((a, b) => a.price - b.price),
            refundTypes: [...refundTypes.values()],
            layovers: [...layovers.values()].sort((a, b) => a.code.localeCompare(b.code)),
            stops,
            minPrice: Number.isFinite(min) ? Math.floor(min) : 0,
            maxPrice: Math.ceil(max),
        };
    }, [enrichedFlights]);

    /* =====================================================
       FILTER ACTIONS
    ===================================================== */

    const updateFilter = (key, value) =>
        setFilters((prev) => ({ ...prev, [key]: value }));

    const toggleFilter = (key, value) =>
        setFilters((prev) => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter((item) => item !== value)
                : [...prev[key], value],
        }));

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setAirlineQuery('');
    };

    const activeChips = [
        ...filters.stops.map((value) => ({ key: 'stops', value, label: STOP_OPTIONS.find((s) => s.value === value)?.label })),
        ...filters.departureSlots.map((value) => ({ key: 'departureSlots', value, label: `Dep ${TIME_SLOTS.find((s) => s.value === value)?.label}` })),
        ...filters.arrivalSlots.map((value) => ({ key: 'arrivalSlots', value, label: `Arr ${TIME_SLOTS.find((s) => s.value === value)?.label}` })),
        ...filters.airlines.map((value) => ({ key: 'airlines', value, label: filterOptions.airlines.find((a) => a.code === value)?.name || value })),
        ...filters.fareTypes.map((value) => ({ key: 'fareTypes', value, label: value })),
        ...filters.refundTypes.map((value) => ({ key: 'refundTypes', value, label: Object.values(REFUND_TYPES).find((t) => t.value === value)?.label })),
        ...filters.layoverAirports.map((value) => ({ key: 'layoverAirports', value, label: `Via ${value}` })),
        ...(filters.freeMeal ? [{ key: 'freeMeal', label: 'Free meal' }] : []),
        ...(filters.checkInBaggage ? [{ key: 'checkInBaggage', label: 'Check-in baggage' }] : []),
        ...(filters.hideNearbyAirports ? [{ key: 'hideNearbyAirports', label: 'No nearby airports' }] : []),
        ...(filters.minPrice !== '' ? [{ key: 'minPrice', label: `Min ${money(filters.minPrice)}` }] : []),
        ...(filters.maxPrice !== '' ? [{ key: 'maxPrice', label: `Max ${money(filters.maxPrice)}` }] : []),
        ...(filters.maxDuration !== '' ? [{ key: 'maxDuration', label: `Duration ≤ ${formatDuration(filters.maxDuration)}` }] : []),
        ...(filters.maxLayover !== '' ? [{ key: 'maxLayover', label: `Layover ≤ ${formatDuration(filters.maxLayover)}` }] : []),
        ...(filters.flightNumber ? [{ key: 'flightNumber', label: `Flight ${filters.flightNumber}` }] : []),
    ];

    const removeChip = (chip) => {
        if (Array.isArray(filters[chip.key])) toggleFilter(chip.key, chip.value);
        else updateFilter(chip.key, DEFAULT_FILTERS[chip.key]);
    };

    /* =====================================================
       NEW SEARCH (modify / date strip)
    ===================================================== */

    const applyNewSearch = (saved) => {
        setSearchOverride(saved);
        setSelectedFlights({});
        setPicked({});
        setCompareOpen(false);
        setActiveLegKey(null);
        setFareChoice({});
        setShowAllFares({});
        setDetailsOpen({});
        setUnavailableFlights([]);
        resetFilters();
        setModifyOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const activeDateIndex = activeLeg?.isCombo ? 0 : activeLegIndex;
    const activeDate = routeInfos[activeDateIndex]?.travelDate || search.departureDate;

    const dateStrip = useMemo(() => {
        if (!activeDate) return [];
        const base = new Date(`${activeDate}T12:00:00`);
        if (Number.isNaN(base.getTime())) return [];
        const today = formatISODate(new Date());
        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(base);
            date.setDate(base.getDate() + index - 3);
            return formatISODate(date);
        }).filter((date) => date >= today);
    }, [activeDate]);

    /*
     * Lowest fare per date in the strip (like other apps). The searched
     * date comes from the results; the others from a one-way search of
     * the active sector, run in the background and cached for a while.
     */
    const activeRoute = searchData?.request?.searchQuery?.routeInfos?.[activeDateIndex] || null;
    const datePriceBase = activeRoute && !activeLeg?.isCombo
        ? [
            activeRoute.fromCityOrAirport?.code,
            activeRoute.toCityOrAirport?.code,
            searchData?.request?.searchQuery?.cabinClass,
            JSON.stringify(searchData?.request?.searchQuery?.paxInfo || {}),
        ].join('|')
        : '';
    const [datePrices, setDatePrices] = useState(() => {
        if (typeof window === 'undefined') return {};
        try {
            const cached = JSON.parse(sessionStorage.getItem(DATE_PRICES_KEY) || '{}');
            const fresh = Date.now() - DATE_PRICE_TTL;
            return Object.fromEntries(Object.entries(cached).filter(([, entry]) => entry?.at > fresh));
        } catch {
            return {};
        }
    });

    const currentDatePrice = useMemo(() => cheapestFare(activeLeg?.flights || []), [activeLeg]);

    useEffect(() => {
        if (!datePriceBase || !searchData?.request) return undefined;
        const pending = dateStrip.filter((date) => date !== activeDate && !datePrices[`${datePriceBase}|${date}`]);
        if (!pending.length) return undefined;

        let cancelled = false;
        const save = (date, entry) => {
            if (cancelled) return;
            setDatePrices((prev) => {
                const next = { ...prev, [`${datePriceBase}|${date}`]: entry };
                try {
                    // failed lookups stay in memory only, so a later visit retries them
                    const keep = Object.fromEntries(Object.entries(next).filter(([, value]) => !value.failed));
                    sessionStorage.setItem(DATE_PRICES_KEY, JSON.stringify(keep));
                } catch { /* storage full: keep in memory */ }
                return next;
            });
        };

        const run = async (date) => {
            const request = {
                ...searchData.request,
                searchQuery: {
                    ...searchData.request.searchQuery,
                    routeInfos: [{ ...activeRoute, travelDate: date }],
                },
            };
            try {
                const response = await flightService.search(request);
                const infos = getTripInfos(response);
                const flights = Object.values(infos).flatMap((list) => (Array.isArray(list) ? list : []));
                save(date, { price: cheapestFare(flights), at: Date.now() });
                return true;
            } catch {
                save(date, { price: 0, failed: true, at: Date.now() });
                return false;
            }
        };

        // one at a time: the supplier rate-limits searches. On a failure
        // stop and leave the remaining dates without a price.
        (async () => {
            for (let index = 0; index < pending.length && !cancelled; index++) {
                if (!(await run(pending[index]))) {
                    pending.slice(index + 1).forEach((date) => save(date, { price: 0, failed: true, at: Date.now() }));
                    break;
                }
            }
        })();

        return () => {
            cancelled = true;
        };
        // datePrices is read only to skip dates already known
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [datePriceBase, dateStrip, activeDate]);

    const priceForDate = (date) => {
        if (date === activeDate) return currentDatePrice || null;
        const entry = datePrices[`${datePriceBase}|${date}`];
        if (!entry) return undefined;
        if (entry.failed) return 'failed';
        return entry.price || null;
    };

    // highlight the cheapest date only when the dates actually differ
    const stripPrices = dateStrip.map(priceForDate).filter((price) => price > 0);
    const lowestStripPrice = new Set(stripPrices).size > 1 ? Math.min(...stripPrices) : null;

    const searchDate = async (date) => {
        const oldRoutes = searchData?.request?.searchQuery?.routeInfos;
        if (!oldRoutes?.[activeDateIndex]) return;

        if (oldRoutes[activeDateIndex + 1]?.travelDate && date > oldRoutes[activeDateIndex + 1].travelDate) {
            toast.error('This date is after your next flight date.');
            return;
        }
        if (activeDateIndex > 0 && date < oldRoutes[activeDateIndex - 1]?.travelDate) {
            toast.error('This date is before your previous flight date.');
            return;
        }

        const request = {
            ...searchData.request,
            searchQuery: {
                ...searchData.request.searchQuery,
                routeInfos: oldRoutes.map((route, index) =>
                    index === activeDateIndex ? { ...route, travelDate: date } : route
                ),
            },
        };

        const nextSearch = { ...searchData.search };
        const nextSegments = [...(searchData.segments || [])];

        if (tripType === 'MULTI_CITY') {
            if (nextSegments[activeDateIndex]) {
                nextSegments[activeDateIndex] = { ...nextSegments[activeDateIndex], date };
            }
        } else if (activeDateIndex === 0) {
            nextSearch.departureDate = date;
        } else {
            nextSearch.returnDate = date;
        }

        try {
            setDateSearchLoading(true);
            setDateError('');
            const response = await flightService.search(request);
            const saved = {
                ...searchData,
                search: nextSearch,
                segments: nextSegments,
                request,
                response,
                searchedAt: new Date().toISOString(),
            };
            sessionStorage.setItem(SEARCH_KEY, JSON.stringify(saved));
            applyNewSearch(saved);
            toast.success('Flights updated for selected date.');
        } catch (error) {
            const message = error?.message || 'Unable to fetch flights for this date.';
            setDateError(message);
            toast.error(message);
        } finally {
            setDateSearchLoading(false);
        }
    };

    /* =====================================================
       FARE RULES (TripJack /fare-rule)
    ===================================================== */

    const loadFareRules = async (fareId) => {
        if (!fareId || fareRules[fareId]?.data || fareRules[fareId]?.loading) return;

        setFareRules((prev) => ({ ...prev, [fareId]: { loading: true } }));

        try {
            const data = await flightService.fareRule({ id: fareId, flowType: 'SEARCH' });
            setFareRules((prev) => ({ ...prev, [fareId]: { data } }));
        } catch (error) {
            setFareRules((prev) => ({
                ...prev,
                [fareId]: { error: error?.message || 'Unable to load fare rules.' },
            }));
        }
    };

    const openDetails = (flightId, tab, fareId) => {
        setDetailsOpen((prev) => ({
            ...prev,
            [flightId]: prev[flightId] === tab ? null : tab,
        }));
        if (tab === 'rules') loadFareRules(fareId);
    };

    /* =====================================================
       SELECT FLIGHT + FARE
    ===================================================== */

    const selectFlight = (item, fare) => {
        if (unavailableFlights.includes(item.id)) {
            toast.error('Flight no longer available. Please choose another flight.');
            return;
        }

        if (!fare?.id) {
            const updated = [...new Set([...unavailableFlights, item.id])];
            setUnavailableFlights(updated);
            sessionStorage.setItem(UNAVAILABLE_KEY, JSON.stringify(updated));
            toast.error('Fare is no longer available. Please choose another flight.');
            return;
        }

        const leg = activeLeg;

        const nextSelected = {
            ...selectedFlights,
            [leg.key]: {
                flight: item.flight,
                fare,
                flightId: item.id,
                fareId: fare.id,
                legKey: leg.key,
                route: leg.route,
            },
        };

        setSelectedFlights(nextSelected);

        // Every sector picked: go straight to fare review (Continue stays as a fallback)
        if (flightLegs.every((l) => nextSelected[l.key])) {
            toast.success(`${getFareName(fare)} fare selected`, { duration: 1500 });
            continueToReview(nextSelected);
            return;
        }

        // otherwise move on to the next sector still to choose
        const nextLeg = flightLegs.find((l, index) => index > activeLegIndex && !nextSelected[l.key])
            || flightLegs.find((l) => !nextSelected[l.key]);
        if (nextLeg) {
            setActiveLegKey(nextLeg.key);
            resetFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        toast.success(`${getFareName(fare)} fare selected`, { duration: 1500 });
    };

    const allLegsSelected =
        flightLegs.length > 0 &&
        flightLegs.every((leg) => selectedFlights[leg.key]);

    const selectedTotal = flightLegs.reduce(
        (sum, leg) =>
            sum + (selectedFlights[leg.key] ? getFareTotal(selectedFlights[leg.key].fare, search) : 0),
        0
    );

    /* =====================================================
       CONTINUE -> REVIEW (one priceId per leg)
    ===================================================== */

    const continueToReview = async (selectedMap = selectedFlights) => {
        if (!flightLegs.every((leg) => selectedMap[leg.key])) {
            toast.error('Please select a flight for every sector.');
            return;
        }

        const selections = flightLegs.map((leg) => ({
            legKey: leg.key,
            title: leg.title,
            route: leg.route,
            ...selectedMap[leg.key],
        }));

        const priceIds = selections.map((selection) => selection.fareId).filter(Boolean);

        if (priceIds.length !== flightLegs.length) {
            toast.error('Please select a valid fare for every sector.');
            return;
        }

        try {
            setReviewLoading(true);

            const reviewResponse = await flightService.review({ priceIds });

            const ok =
                reviewResponse?.success === true ||
                reviewResponse?.status?.success === true;

            if (!ok) {
                toast.error(
                    reviewResponse?.message ||
                    reviewResponse?.error?.errors?.[0]?.message ||
                    'Selected fare is no longer available. Please choose another flight.',
                    { duration: 5000 }
                );
                return;
            }

            sessionStorage.setItem(
                SELECTED_KEY,
                JSON.stringify({
                    version: 2,
                    tripType,
                    search,
                    request: searchData?.request || null,
                    selections,
                    priceIds,
                    review: reviewResponse,
                    reviewedAt: new Date().toISOString(),
                })
            );

            router.push('/flights/review');
        } catch (error) {
            toast.error(error?.message || 'We could not confirm this fare. Please try again or choose another flight.', { duration: 5000 });
        } finally {
            setReviewLoading(false);
        }
    };

    /* =====================================================
       RENDER HELPERS
    ===================================================== */

    const renderJourneyRow = (summary, journeyIndex, item) => {
        const { first, last } = summary;
        const route = legRoutes[journeyIndex];

        return (
            <div className="fr-journey" key={journeyIndex}>
                {item.journeys.length > 1 && (
                    <span className="fr-journey-tag">
                        {tripType === 'ROUND_TRIP' ? (journeyIndex === 0 ? 'Onward' : 'Return') : `Flight ${journeyIndex + 1}`}
                    </span>
                )}

                <div className="fr-point">
                    <strong>{formatTime(first?.dt)}</strong>
                    <span>{first?.da?.code}</span>
                    <small>{formatDate(first?.dt)}</small>
                </div>

                <div className="fr-path">
                    <span>{formatDuration(summary.duration)}</span>
                    <div className={`fr-line ${summary.stops ? 'has-stops' : ''}`}>
                        {summary.via.map((code) => <i key={code} title={code} />)}
                    </div>
                    <small>
                        {summary.stops === 0
                            ? 'Non-stop'
                            : `${summary.stops} stop${summary.stops > 1 ? 's' : ''}${summary.via.length ? ` via ${summary.via.join(', ')}` : ''}`}
                    </small>
                </div>

                <div className="fr-point fr-point-end">
                    <strong>
                        {formatTime(last?.at)}
                        {summary.nextDay > 0 && <sup>+{summary.nextDay}</sup>}
                    </strong>
                    <span>{last?.aa?.code}</span>
                    <small>
                        {formatDate(last?.at)}
                        {route?.toCityOrAirport?.code && last?.aa?.code !== route.toCityOrAirport.code && (
                            <em className="fr-nearby"> • Nearby airport</em>
                        )}
                    </small>
                </div>
            </div>
        );
    };

    const renderSegmentDetails = (item, chosenFare) => (
        <div className="fr-segments">
            {item.journeys.map((journey, journeyIndex) => {
                const layovers = getLayovers(journey);
                return (
                    <div className="fr-segment-journey" key={journeyIndex}>
                        <div className="fr-segment-title">
                            {journey[0]?.da?.city || journey[0]?.da?.code} → {journey[journey.length - 1]?.aa?.city || journey[journey.length - 1]?.aa?.code}
                            <span>{formatDate(journey[0]?.dt)}</span>
                        </div>

                        {journey.map((segment, index) => (
                            <div key={segment?.id || index}>
                                <div className="fr-segment">
                                    <div className="fr-segment-airline">
                                        <AirlineLogo code={segment?.fD?.aI?.code} name={segment?.fD?.aI?.name} size={28} />
                                        <div>
                                            <strong>{segment?.fD?.aI?.name}</strong>
                                            <span>{segment?.fD?.aI?.code}-{segment?.fD?.fN}</span>
                                            <small>
                                                {[segment?.fD?.eT && `Aircraft ${segment.fD.eT}`, humanize(getAdultFare(chosenFare)?.cc || search.cabinClass), getAdultFare(chosenFare)?.cB && `Class ${getAdultFare(chosenFare).cB}`].filter(Boolean).join(' • ')}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="fr-segment-point">
                                        <strong>{formatTime(segment?.dt)} {segment?.da?.code}</strong>
                                        <span>{formatDate(segment?.dt)}</span>
                                        <small>{segment?.da?.name}{segment?.da?.terminal ? `, ${segment.da.terminal}` : ''}</small>
                                    </div>

                                    <div className="fr-segment-duration">
                                        {formatDuration(segment?.duration)}
                                        {Array.isArray(segment?.so) && segment.so.length > 0 && (
                                            <small>Technical stop at {segment.so.map((stop) => stop?.code).join(', ')}</small>
                                        )}
                                    </div>

                                    <div className="fr-segment-point">
                                        <strong>{formatTime(segment?.at)} {segment?.aa?.code}</strong>
                                        <span>{formatDate(segment?.at)}</span>
                                        <small>{segment?.aa?.name}{segment?.aa?.terminal ? `, ${segment.aa.terminal}` : ''}</small>
                                    </div>
                                </div>

                                {layovers[index] && (
                                    <div className="fr-layover">
                                        Layover at {layovers[index].city || layovers[index].airport} ({layovers[index].airport}) • {formatDuration(layovers[index].minutes)}
                                        {layovers[index].terminalChange && <b> • Terminal change</b>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );

    const renderFareSummary = (fare) => {
        const rows = getFareBreakup(fare, search);
        const total = getFareTotal(fare, search);

        return (
            <table className="fr-table">
                <thead>
                    <tr>
                        <th>Traveller</th>
                        <th>Base fare</th>
                        <th>Taxes &amp; fees</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.type}>
                            <td>{row.label} × {row.count}</td>
                            <td>{money(row.base * row.count)}</td>
                            <td>{money(row.taxes * row.count)}</td>
                            <td>{money(row.total * row.count)}</td>
                        </tr>
                    ))}
                    <tr className="fr-table-total">
                        <td colSpan={3}>Total ({travellerCount} traveller{travellerCount > 1 ? 's' : ''})</td>
                        <td>{money(total)}</td>
                    </tr>
                </tbody>
            </table>
        );
    };

    const renderBaggage = (fare) => (
        <table className="fr-table">
            <thead>
                <tr>
                    <th>Traveller</th>
                    <th>Check-in</th>
                    <th>Cabin</th>
                </tr>
            </thead>
            <tbody>
                {getFareBreakup(fare, search).map((row) => {
                    const baggage = getBaggage(fare, row.type);
                    return (
                        <tr key={row.type}>
                            <td>{row.label}</td>
                            <td>{baggage.checkIn || 'As per airline'}</td>
                            <td>{baggage.cabin || 'As per airline'}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    const legPicks = picked[activeLeg?.key] || [];
    const pickedRows = legPicks
        .map((pick) => {
            const item = enrichedFlights.find((flight) => flight.id === pick.id);
            const fare = item && (item.fares.find((f) => f.id === pick.fareId) || item.fares[0]);
            return item && fare ? { item, fare } : null;
        })
        .filter(Boolean);

    const togglePick = (item, fare) => {
        const key = activeLeg.key;
        const list = picked[key] || [];
        if (list.some((pick) => pick.id === item.id)) {
            setPicked({ ...picked, [key]: list.filter((pick) => pick.id !== item.id) });
            return;
        }
        if (list.length >= MAX_PICKS) {
            toast.error(`You can compare or share up to ${MAX_PICKS} flights at a time.`);
            return;
        }
        setPicked({ ...picked, [key]: [...list, { id: item.id, fareId: fare?.id }] });
    };

    const shareRouteLabel = activeLeg?.isCombo
        ? routeInfos.map((route) => `${route?.fromCityOrAirport?.code} → ${route?.toCityOrAirport?.code}`).join(', ')
        : `${activeLeg?.route?.fromCityOrAirport?.code || search.fromCode} → ${activeLeg?.route?.toCityOrAirport?.code || search.toCode}`;
    const shareDateLabel = activeLeg?.isCombo
        ? routeInfos.map((route) => formatDate(route?.travelDate)).join(' – ')
        : formatDate(activeLeg?.route?.travelDate || search.departureDate);

    const renderFlightCard = (item) => {
        const selected = selectedFlights[activeLeg.key];
        const isSelected = selected?.flightId === item.id;
        const isUnavailable = unavailableFlights.includes(item.id);
        const fares = item.visibleFares;
        const chosenFare =
            fares.find((fare) => fare.id === fareChoice[item.id]) ||
            (isSelected && fares.find((fare) => fare.id === selected.fareId)) ||
            fares[0];
        const openTab = detailsOpen[item.id];
        const faresToShow = showAllFares[item.id] ? fares : fares.slice(0, 3);
        const mainAirline = item.airlines[0] || {};
        const seatsLeft = getSeatsLeft(chosenFare);

        return (
            <article
                key={item.id || item.index}
                className={`fr-card ${isSelected ? 'is-selected' : ''} ${isUnavailable ? 'is-unavailable' : ''}`}
            >
                <div className="fr-card-main">
                    <div className="fr-airline">
                        <AirlineLogo code={mainAirline.code} name={mainAirline.name} />
                        <div>
                            <strong>
                                {item.airlines.map((airline) => airline.name || airline.code).join(' + ')}
                            </strong>
                            <span>{item.flightNumbers.join(', ')}</span>
                            {mainAirline.isLcc !== undefined && (
                                <small>{mainAirline.isLcc ? 'Low cost carrier' : 'Full service'}</small>
                            )}
                        </div>
                    </div>

                    <div className="fr-journeys">
                        {item.summaries.map((summary, index) => renderJourneyRow(summary, index, item))}
                    </div>

                    <div className="fr-price-col">
                        <span className="fr-price-from">{fares.length > 1 ? 'Starts from' : 'Price'}</span>
                        <strong>{money(getFarePrice(fares[0]))}</strong>
                        <small>per adult</small>
                        {seatsLeft && seatsLeft <= 9 && (
                            <em className="fr-seats">{seatsLeft} seat{seatsLeft > 1 ? 's' : ''} left</em>
                        )}
                    </div>
                </div>

                {/* FARE OPTIONS */}
                <div className="fr-fares">
                    {faresToShow.map((fare) => {
                        const refund = getRefundType(fare);
                        const baggage = getBaggage(fare);
                        const active = chosenFare?.id === fare.id;
                        const seats = getSeatsLeft(fare);

                        return (
                            <label
                                key={fare.id}
                                className={`fr-fare ${active ? 'active' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name={`fare-${item.id}`}
                                    checked={active}
                                    onChange={() =>
                                        setFareChoice((prev) => ({ ...prev, [item.id]: fare.id }))
                                    }
                                />
                                <div className="fr-fare-info">
                                    <div className="fr-fare-top">
                                        <strong>{money(getFarePrice(fare))}</strong>
                                        <span className="fr-fare-name">{getFareName(fare)}</span>
                                    </div>
                                    <div className="fr-tags">
                                        {refund && <span className={`fr-tag ${refund.tone}`}>{refund.label}</span>}
                                        {hasFreeMeal(fare) && <span className="fr-tag success">Free Meal</span>}
                                        {fares.length > 1 && seats && seats <= 9 && <span className="fr-tag warning">{seats} left</span>}
                                    </div>
                                    <small>
                                        Check-in: {baggage.checkIn || 'N/A'} • Cabin: {baggage.cabin || 'N/A'}
                                    </small>
                                </div>
                            </label>
                        );
                    })}

                    {fares.length > 3 && (
                        <button
                            type="button"
                            className="fr-more-fares"
                            onClick={() =>
                                setShowAllFares((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                            }
                        >
                            {showAllFares[item.id] ? 'Show less' : `+${fares.length - 3} more fares`}
                        </button>
                    )}
                </div>

                <div className="fr-card-foot">
                    <div className="fr-tabs">
                        {[
                            ['flight', 'Flight Details'],
                            ['fare', 'Fare Summary'],
                            ['baggage', 'Baggage'],
                            ['rules', 'Fare Rules'],
                        ].map(([tab, label]) => (
                            <button
                                key={tab}
                                type="button"
                                className={openTab === tab ? 'active' : ''}
                                onClick={() => openDetails(item.id, tab, chosenFare?.id)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        className={`ssb-toggle ${legPicks.some((pick) => pick.id === item.id) ? 'active' : ''}`}
                        onClick={() => togglePick(item, chosenFare)}
                        aria-pressed={legPicks.some((pick) => pick.id === item.id)}
                    >
                        {legPicks.some((pick) => pick.id === item.id) ? '✓ Added' : '＋ Compare & share'}
                    </button>

                    <button
                        type="button"
                        className="fr-select-btn"
                        disabled={isUnavailable || reviewLoading}
                        onClick={() => selectFlight(item, chosenFare)}
                    >
                        {isUnavailable
                            ? 'Unavailable'
                            : isSelected && selected.fareId === chosenFare?.id
                                ? '✓ Selected'
                                : flightLegs.length > 1
                                    ? 'Select'
                                    : 'Book Now'}
                    </button>
                </div>

                {openTab && (
                    <div className="fr-details">
                        {openTab === 'flight' && renderSegmentDetails(item, chosenFare)}
                        {openTab === 'fare' && renderFareSummary(chosenFare)}
                        {openTab === 'baggage' && renderBaggage(chosenFare)}
                        {openTab === 'rules' && <FareRules state={fareRules[chosenFare?.id]} />}
                        {(chosenFare?.messages || []).length > 0 && (
                            <ul className="fr-messages">
                                {chosenFare.messages.map((message, index) => (
                                    <li key={index}>{typeof message === 'string' ? message : message?.message || message?.msg}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </article>
        );
    };

    /* =====================================================
       STATES
    ===================================================== */

    if (!searchData) {
        return (
            <main className="flight-results-page">
                <div className="results-container">
                    <div className="fr-empty">Loading flights…</div>
                </div>
            </main>
        );
    }

    const firstRoute = routeInfos[0];
    const lastRoute = routeInfos[routeInfos.length - 1];
    const fareTypeLabel =
        search.fareType && search.fareType !== 'REGULAR' ? humanize(search.fareType) : null;

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

            <main className={`flight-results-page ${Object.keys(selectedFlights).length ? 'has-bar' : ''} ${pickedRows.length ? 'has-picks' : ''}`}>

                {/* SEARCH SUMMARY + MODIFY */}
                <div className="fr-summary-bar">
                    <div className="results-container">
                        <div className="fr-summary">
                            <button
                                type="button"
                                className="fr-back-btn"
                                onClick={() => router.push('/flights')}
                                aria-label="Back to flight search"
                            >
                                ← <span>Back</span>
                            </button>
                            <div className="fr-summary-item">
                                <small>{tripType === 'ROUND_TRIP' ? 'Round Trip' : tripType === 'MULTI_CITY' ? 'Multi City' : 'One Way'}</small>
                                <strong>
                                    {tripType === 'MULTI_CITY'
                                        ? routeInfos.map((route) => route?.fromCityOrAirport?.code).concat(lastRoute?.toCityOrAirport?.code).join(' → ')
                                        : `${firstRoute?.fromCityOrAirport?.code || search.fromCode} → ${firstRoute?.toCityOrAirport?.code || search.toCode}`}
                                </strong>
                            </div>
                            <div className="fr-summary-item">
                                <small>Departure{tripType === 'ROUND_TRIP' ? ' / Return' : ''}</small>
                                <strong>
                                    {formatDate(firstRoute?.travelDate)}
                                    {tripType === 'ROUND_TRIP' && routeInfos[1] && ` – ${formatDate(routeInfos[1].travelDate)}`}
                                </strong>
                            </div>
                            <div className="fr-summary-item">
                                <small>Travellers &amp; Class</small>
                                <strong>
                                    {travellerCount} Traveller{travellerCount > 1 ? 's' : ''}, {humanize(search.cabinClass || 'ECONOMY')}
                                    {fareTypeLabel && ` • ${fareTypeLabel}`}
                                </strong>
                            </div>
                            <button
                                type="button"
                                className="fr-modify-btn"
                                onClick={() => setModifyOpen((value) => !value)}
                            >
                                {modifyOpen ? 'Close' : 'Modify Search'}
                            </button>
                        </div>
                    </div>

                    {modifyOpen && (
                        <div className="fr-modify-panel">
                            <div className="results-container">
                                <FlightSearchForm
                                    key={searchData.searchedAt || 'current'}
                                    initialData={searchData}
                                    onSearched={applyNewSearch}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* SELECTION BAR (sticky, top) */}
                {Object.keys(selectedFlights).length > 0 && (
                    <div className="fr-bottom-bar">
                        <div className="results-container fr-bottom-inner">
                            <div className="fr-bottom-legs">
                                {flightLegs.map((leg) => {
                                    const selection = selectedFlights[leg.key];
                                    if (!selection) {
                                        return (
                                            <div className="fr-bottom-leg pending" key={leg.key}>
                                                <small>{leg.title}</small>
                                                <strong>Select flight</strong>
                                            </div>
                                        );
                                    }
                                    const segments = getSegments(selection.flight);
                                    const airline = segments[0]?.fD?.aI || {};
                                    return (
                                        <button
                                            type="button"
                                            className="fr-bottom-leg"
                                            key={leg.key}
                                            onClick={() => setActiveLegKey(leg.key)}
                                        >
                                            <AirlineLogo code={airline.code} name={airline.name} size={26} />
                                            <div>
                                                <small>{leg.title} • {getFareName(selection.fare)}</small>
                                                <strong>
                                                    {formatTime(segments[0]?.dt)} → {formatTime(segments[segments.length - 1]?.at)}
                                                </strong>
                                                <span>{money(getFarePrice(selection.fare))}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="fr-bottom-total">
                                <small>Total for {travellerCount} traveller{travellerCount > 1 ? 's' : ''}</small>
                                <strong>{money(selectedTotal)}</strong>
                            </div>

                            <button
                                type="button"
                                className="fr-continue-btn"
                                disabled={!allLegsSelected || reviewLoading}
                                onClick={() => continueToReview()}
                            >
                                {reviewLoading ? 'Please wait…' : 'Continue'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="results-container flight-results-workspace">

                    {/* FILTERS */}
                    {mobileFiltersOpen && (
                        <button
                            type="button"
                            className="fr-backdrop"
                            aria-label="Close filters"
                            onClick={() => setMobileFiltersOpen(false)}
                        />
                    )}

                    <aside className={`fr-sidebar ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
                        <div className="fr-sidebar-head">
                            <strong>Filters</strong>
                            <button type="button" className="fr-link" onClick={resetFilters}>Reset all</button>
                            <button type="button" className="fr-close" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">×</button>
                        </div>

                        <FilterSection title="Stops" onClear={filters.stops.length ? () => updateFilter('stops', []) : null}>
                            <div className="fr-box-grid">
                                {STOP_OPTIONS.map((option) => {
                                    const data = filterOptions.stops.get(option.value);
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            disabled={!data}
                                            className={filters.stops.includes(option.value) ? 'active' : ''}
                                            onClick={() => toggleFilter('stops', option.value)}
                                        >
                                            <strong>{option.label}</strong>
                                            <small>{data ? money(data.price) : '—'}</small>
                                        </button>
                                    );
                                })}
                            </div>
                        </FilterSection>

                        <FilterSection title="Price (per adult)" onClear={filters.minPrice !== '' || filters.maxPrice !== '' ? () => setFilters((prev) => ({ ...prev, minPrice: '', maxPrice: '' })) : null}>
                            <input
                                type="range"
                                className="fr-range"
                                min={filterOptions.minPrice}
                                max={Math.max(filterOptions.maxPrice, filterOptions.minPrice + 1)}
                                value={filters.maxPrice === '' ? filterOptions.maxPrice : filters.maxPrice}
                                onChange={(event) => updateFilter('maxPrice', event.target.value)}
                            />
                            <div className="fr-price-inputs">
                                <label>Min<input type="number" min="0" placeholder={String(filterOptions.minPrice)} value={filters.minPrice} onChange={(event) => updateFilter('minPrice', event.target.value)} /></label>
                                <label>Max<input type="number" min="0" placeholder={String(filterOptions.maxPrice)} value={filters.maxPrice} onChange={(event) => updateFilter('maxPrice', event.target.value)} /></label>
                            </div>
                        </FilterSection>

                        {[
                            ['departureSlots', `Departure from ${legRoutes[0]?.fromCityOrAirport?.code || ''}`],
                            ['arrivalSlots', `Arrival at ${legRoutes[0]?.toCityOrAirport?.code || ''}`],
                        ].map(([key, title]) => (
                            <FilterSection key={key} title={title} onClear={filters[key].length ? () => updateFilter(key, []) : null}>
                                <div className="fr-box-grid fr-box-grid-2">
                                    {TIME_SLOTS.map((slot) => (
                                        <button
                                            key={slot.value}
                                            type="button"
                                            className={filters[key].includes(slot.value) ? 'active' : ''}
                                            onClick={() => toggleFilter(key, slot.value)}
                                        >
                                            <span>{slot.icon}</span>
                                            <small>{slot.label}</small>
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>
                        ))}

                        {filterOptions.refundTypes.length > 0 && (
                            <FilterSection title="Refundability" onClear={filters.refundTypes.length ? () => updateFilter('refundTypes', []) : null}>
                                {filterOptions.refundTypes.map((type) => (
                                    <label className="fr-check" key={type.value}>
                                        <input type="checkbox" checked={filters.refundTypes.includes(type.value)} onChange={() => toggleFilter('refundTypes', type.value)} />
                                        <span>{type.label}</span>
                                        <b>{type.count}</b>
                                    </label>
                                ))}
                            </FilterSection>
                        )}

                        <FilterSection title="Airlines" onClear={filters.airlines.length ? () => updateFilter('airlines', []) : null}>
                            {filterOptions.airlines.length > 6 && (
                                <input
                                    className="fr-input"
                                    placeholder="Search airline"
                                    value={airlineQuery}
                                    onChange={(event) => setAirlineQuery(event.target.value)}
                                />
                            )}
                            {filterOptions.airlines
                                .filter((airline) => `${airline.name} ${airline.code}`.toLowerCase().includes(airlineQuery.toLowerCase()))
                                .map((airline) => (
                                    <label className="fr-check fr-check-airline" key={airline.code}>
                                        <input type="checkbox" checked={filters.airlines.includes(airline.code)} onChange={() => toggleFilter('airlines', airline.code)} />
                                        <AirlineLogo code={airline.code} name={airline.name} size={22} />
                                        <span>{airline.name} <small>({airline.count})</small></span>
                                        <b>{money(airline.price)}</b>
                                    </label>
                                ))}
                        </FilterSection>

                        {filterOptions.fareTypes.length > 0 && (
                            <FilterSection title="Fare Type" onClear={filters.fareTypes.length ? () => updateFilter('fareTypes', []) : null}>
                                {filterOptions.fareTypes.map((type) => (
                                    <label className="fr-check" key={type.name}>
                                        <input type="checkbox" checked={filters.fareTypes.includes(type.name)} onChange={() => toggleFilter('fareTypes', type.name)} />
                                        <span>{type.name} <small>({type.count})</small></span>
                                        <b>{money(type.price)}</b>
                                    </label>
                                ))}
                            </FilterSection>
                        )}

                        <FilterSection title="More filters">
                            <label className="fr-check">
                                <input type="checkbox" checked={filters.checkInBaggage} onChange={(event) => updateFilter('checkInBaggage', event.target.checked)} />
                                <span>Check-in baggage included</span>
                            </label>
                            <label className="fr-check">
                                <input type="checkbox" checked={filters.freeMeal} onChange={(event) => updateFilter('freeMeal', event.target.checked)} />
                                <span>Free meal</span>
                            </label>
                            <label className="fr-check">
                                <input type="checkbox" checked={filters.hideNearbyAirports} onChange={(event) => updateFilter('hideNearbyAirports', event.target.checked)} />
                                <span>Hide nearby airports</span>
                            </label>
                        </FilterSection>

                        {filterOptions.layovers.length > 0 && (
                            <FilterSection title="Layover airports" defaultOpen={false} onClear={filters.layoverAirports.length ? () => updateFilter('layoverAirports', []) : null}>
                                {filterOptions.layovers.map((layover) => (
                                    <label className="fr-check" key={layover.code}>
                                        <input type="checkbox" checked={filters.layoverAirports.includes(layover.code)} onChange={() => toggleFilter('layoverAirports', layover.code)} />
                                        <span>{layover.code} <small>({layover.count})</small></span>
                                        <b>{money(layover.price)}</b>
                                    </label>
                                ))}
                            </FilterSection>
                        )}

                        <FilterSection title="Duration" defaultOpen={false}>
                            <label className="fr-select-label">
                                Max journey time
                                <select value={filters.maxDuration} onChange={(event) => updateFilter('maxDuration', event.target.value)}>
                                    <option value="">Any</option>
                                    {[120, 180, 300, 480, 720, 960, 1440].map((min) => <option key={min} value={min}>{formatDuration(min)}</option>)}
                                </select>
                            </label>
                            <label className="fr-select-label">
                                Max layover
                                <select value={filters.maxLayover} onChange={(event) => updateFilter('maxLayover', event.target.value)}>
                                    <option value="">Any</option>
                                    {[60, 120, 180, 240, 360, 720].map((min) => <option key={min} value={min}>{formatDuration(min)}</option>)}
                                </select>
                            </label>
                        </FilterSection>

                        <FilterSection title="Flight number" defaultOpen={false}>
                            <input
                                className="fr-input"
                                placeholder="e.g. 6E-2131"
                                value={filters.flightNumber}
                                onChange={(event) => updateFilter('flightNumber', event.target.value)}
                            />
                        </FilterSection>

                        <div className="fr-mobile-apply">
                            <button type="button" onClick={() => setMobileFiltersOpen(false)}>
                                Show {visibleFlights.length} flights
                            </button>
                        </div>
                    </aside>

                    {/* RESULTS */}
                    <section className="fr-content">

                        {/* SECTOR STEPPER (domestic round trip / multi city) */}
                        {flightLegs.length > 1 && (
                            <div className="fr-steps">
                                {flightLegs.map((leg, index) => {
                                    const done = selectedFlights[leg.key];
                                    const unlocked = index === 0 || selectedFlights[flightLegs[index - 1].key] || done;
                                    return (
                                        <button
                                            key={leg.key}
                                            type="button"
                                            disabled={!unlocked}
                                            className={`${leg.key === activeLeg?.key ? 'active' : ''} ${done ? 'done' : ''}`}
                                            onClick={() => {
                                                setActiveLegKey(leg.key);
                                                resetFilters();
                                            }}
                                        >
                                            <small>{done ? '✓ ' : ''}{leg.title}</small>
                                            <strong>{leg.route?.fromCityOrAirport?.code} → {leg.route?.toCityOrAirport?.code}</strong>
                                            <span>{formatDate(leg.route?.travelDate)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* DATE STRIP */}
                        {!activeLeg?.isCombo && dateStrip.length > 0 && (
                            <div
                                className="fr-dates"
                                ref={(node) => {
                                    // keep the searched date in view on small screens
                                    // (once per date, so a later re-render does not undo the user's scroll)
                                    const active = node?.querySelector('button.active');
                                    if (!active || node.dataset.centered === activeDate) return;
                                    node.dataset.centered = activeDate;
                                    node.scrollLeft = active.offsetLeft - (node.clientWidth - active.offsetWidth) / 2;
                                }}
                            >
                                {dateStrip.map((date) => {
                                    const price = priceForDate(date);
                                    return (
                                        <button
                                            key={date}
                                            type="button"
                                            className={`${date === activeDate ? 'active' : ''} ${price && price === lowestStripPrice ? 'lowest' : ''}`}
                                            disabled={dateSearchLoading}
                                            onClick={() => date !== activeDate && searchDate(date)}
                                        >
                                            <span>{formatDate(date)}</span>
                                            <strong>
                                                {price === undefined && <i className="fr-date-loading" aria-label="Loading price" />}
                                                {price === 'failed' && <small>View fares</small>}
                                                {price === null && '—'}
                                                {typeof price === 'number' && money(price)}
                                            </strong>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {dateSearchLoading && <div className="fr-info">Searching flights for the selected date…</div>}
                        {dateError && <div className="fr-error">{dateError}</div>}

                        {/* SORT */}
                        <div className="fr-toolbar">
                            <div className="fr-sort">
                                {[
                                    ['price', 'Cheapest'],
                                    ['duration', 'Fastest'],
                                    ['departure', 'Early Departure'],
                                    ['departureLate', 'Late Departure'],
                                    ['arrival', 'Early Arrival'],
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={sortBy === value ? 'active' : ''}
                                        onClick={() => setSortBy(value)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <button type="button" className="fr-filter-trigger" onClick={() => setMobileFiltersOpen(true)}>
                                Filters{activeChips.length ? ` (${activeChips.length})` : ''}
                            </button>
                        </div>

                        {activeChips.length > 0 && (
                            <div className="fr-chips">
                                {activeChips.map((chip) => (
                                    <button type="button" key={`${chip.key}-${chip.value ?? ''}`} onClick={() => removeChip(chip)}>
                                        {chip.label} ×
                                    </button>
                                ))}
                                <button type="button" className="fr-link" onClick={resetFilters}>Clear all</button>
                            </div>
                        )}

                        <div className="fr-count">
                            Showing {visibleFlights.length} of {enrichedFlights.length} flights
                            {activeLeg && flightLegs.length > 1 && ` • ${activeLeg.title}`}
                        </div>

                        {visibleFlights.length === 0 ? (
                            <div className="fr-empty">
                                {enrichedFlights.length
                                    ? 'No flights match the selected filters.'
                                    : 'No flights found for this search.'}
                                <div>
                                    {enrichedFlights.length ? (
                                        <button type="button" className="fr-modify-btn" onClick={resetFilters}>Reset filters</button>
                                    ) : (
                                        <button type="button" className="fr-modify-btn" onClick={() => setModifyOpen(true)}>Modify search</button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="fr-list">
                                {visibleFlights.map(renderFlightCard)}
                            </div>
                        )}
                    </section>
                </div>

                {/* COMPARE & SHARE */}
                <SelectionShareBar
                    count={pickedRows.length}
                    max={MAX_PICKS}
                    title={`${pickedRows.length} flight${pickedRows.length > 1 ? 's' : ''} selected · ${shareRouteLabel}`}
                    hint={pickedRows.length < 2 ? 'Add one more to compare, or share it now' : `Compare or share · up to ${MAX_PICKS}`}
                    onCompare={() => setCompareOpen(true)}
                    onClear={() => {
                        setPicked({ ...picked, [activeLeg.key]: [] });
                        setCompareOpen(false);
                    }}
                    getShare={() => ({
                        subject: `Flight options ${shareRouteLabel} · ${shareDateLabel}`,
                        text: buildFlightShareText({ rows: pickedRows, search, routeLabel: shareRouteLabel, dateLabel: shareDateLabel }),
                    })}
                />
                {compareOpen && pickedRows.length > 0 && (
                    <FlightCompare
                        rows={pickedRows}
                        multiLeg={flightLegs.length > 1}
                        onClose={() => setCompareOpen(false)}
                        onRemove={(id) => setPicked({ ...picked, [activeLeg.key]: legPicks.filter((pick) => pick.id !== id) })}
                        onSelect={({ item, fare }) => {
                            setCompareOpen(false);
                            selectFlight(item, fare);
                        }}
                    />
                )}

                {reviewLoading && (
                    <div className="fr-overlay" role="status" aria-live="polite">
                        <div className="fr-overlay-card">
                            <span className="fr-spinner" />
                            <strong>Confirming your fare</strong>
                            <p>We are confirming the latest price and seat availability with the airline. This may take a few seconds.</p>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
