'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import './review.css';
import flightService from '@/app/services/flightBookingService';
import BookingTopBar, { getSessionExpiry, useSessionTimer } from '../BookingTopBar';

/* =========================================================
   CONSTANTS
========================================================= */

const SEARCH_KEY = 'tripjack_flight_search';
const SELECTED_KEY = 'tripjack_selected_flight';
const FLOW_KEY = 'tripjack_passenger_flow';
const UNAVAILABLE_KEY = 'tripjack_unavailable_flights';
const NEXT_ROUTE = '/flights/passenger-details';

const PAX_TYPES = [
    ['ADULT', 'Adult'],
    ['CHILD', 'Child'],
    ['INFANT', 'Infant'],
];

/* TripJack fd.ADULT.rT */
const REFUND_TYPES = {
    0: { label: 'Non-Refundable', tone: 'danger' },
    1: { label: 'Refundable', tone: 'success' },
    2: { label: 'Partially Refundable', tone: 'warning' },
};

/* TripJack totalPriceInfo.totalFareDetail.afC.TAF */
const TAX_LABELS = {
    AGST: 'Airline GST',
    YQ: 'Fuel surcharge',
    YR: 'Carrier surcharge',
    OT: 'Other taxes',
    MF: 'Service fee',
    MFT: 'GST on service fee',
    WO: 'Airport charges',
    PSF: 'Passenger service fee',
    UDF: 'User development fee',
};

/* =========================================================
   HELPERS
========================================================= */

const money = (value) =>
    `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatTime = (value) => {
    const match = String(value || '').match(/T(\d{2}:\d{2})/);
    return match ? match[1] : '--';
};

const formatDate = (value, withYear = false) => {
    if (!value) return '--';
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        ...(withYear ? { year: 'numeric' } : {}),
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

const humanize = (value) =>
    String(value || '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

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

const getTrips = (review) => {
    const value = review?.tripInfos || review?.data?.tripInfos || [];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
        return Object.values(value).filter(Array.isArray).flat();
    }
    return [];
};

const getSegments = (trip) => (Array.isArray(trip?.sI) ? trip.sI : []);

const getTripFare = (trip) =>
    trip?.totalPriceList?.[0] || trip?.priceList?.[0] || null;

const RULE_LABELS = {
    CANCELLATION: 'Cancellation',
    DATECHANGE: 'Date change',
    DATE_CHANGE: 'Date change',
    NO_SHOW: 'No-show',
    SEAT_CHARGEABLE: 'Seat',
    REISSUE: 'Reissue',
};

const RULE_ORDER = ['CANCELLATION', 'DATECHANGE', 'DATE_CHANGE', 'NO_SHOW', 'SEAT_CHARGEABLE'];

/* Rule types that actually have entries, in TripJack order */
const getRuleTypes = (tfr) =>
    Object.keys(tfr || {})
        .filter((type) => Array.isArray(tfr[type]) && tfr[type].length)
        .sort((a, b) => {
            const ia = RULE_ORDER.indexOf(a);
            const ib = RULE_ORDER.indexOf(b);
            return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        });

/* Plain text only: airline rule text can contain HTML, never render it as HTML */
const toPlainText = (value) =>
    String(value ?? '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|tr)>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim();

/* Detailed airline rules (fareRuleInformation.fr) → [{ title, text }] */
const getDetailedRules = (fr) => {
    const sections = [];
    const walk = (value, title) => {
        if (value == null) return;
        if (typeof value === 'string' || typeof value === 'number') {
            const text = toPlainText(value);
            if (text) sections.push({ title, text });
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => walk(item, title));
            return;
        }
        if (typeof value === 'object') {
            const text = value.policyInfo || value.fareRuleText || value.text || value.miscInfo || value.description;
            if (typeof text === 'string') {
                walk(text, title);
                return;
            }
            Object.entries(value).forEach(([key, child]) =>
                walk(child, title ? `${title} – ${RULE_LABELS[key] || humanize(key)}` : RULE_LABELS[key] || humanize(key))
            );
        }
    };
    walk(fr, '');
    return sections;
};

const TERMS = [
    'Fares are subject to availability and are guaranteed only after the ticket is issued.',
    'Names must match the government ID / passport. Name changes are not allowed after ticketing.',
    'Cancellation and date change charges are as per the airline rules shown above, plus our service fee. Fare difference, if any, is payable on date change.',
    'Refunds are processed to the original payment mode after the airline refunds the amount, usually within 7–14 working days.',
    'Some airlines charge for airport check-in. Complete web check-in where available.',
    'Seats, meals and extra baggage are subject to airline confirmation. Add-on charges are non-refundable unless the airline refunds them.',
];

const getFareRules = (trip) =>
    getTripFare(trip)?.fareRuleInformation?.tfr || {};

/*
 * COMBO review (international round trip / multi city) has every
 * journey inside one sI list. Split it back using the searched routes.
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

        if (next && routeIndex < routes.length - 1 && (reachedTarget || returnStarts)) {
            journeys.push([]);
            routeIndex += 1;
        }
    });

    return journeys.filter((journey) => journey.length);
};

const getJourneySummary = (segments) => {
    const first = segments[0];
    const last = segments[segments.length - 1];
    const flying = segments.reduce((sum, segment) => sum + Number(segment?.duration || 0), 0);
    const layover = segments.slice(0, -1).reduce(
        (sum, segment, index) => sum + minutesBetween(segment?.at, segments[index + 1]?.dt),
        0
    );
    const technicalStops = segments.reduce(
        (sum, segment) => sum + (Array.isArray(segment?.so) ? segment.so.length : 0),
        0
    );

    return {
        first,
        last,
        duration: flying + layover,
        stops: segments.length - 1 + technicalStops,
        via: segments.slice(0, -1).map((segment) => segment?.aa?.code).filter(Boolean),
        nextDay: dayDiff(first?.dt, last?.at),
    };
};

/* Rule window from TripJack st/et (hours before departure) */
const ruleWindow = (st, et) => {
    if (st === undefined && et === undefined) return 'Any time';
    const start = Number(st) || 0;
    const end = Number(et);
    const label = (hours) => {
        if (hours >= 8760) return '1 year';
        if (hours >= 48 && hours % 24 === 0) return `${hours / 24} days`;
        return `${hours} hrs`;
    };

    if (!Number.isFinite(end) || end >= 8760) {
        return start ? `More than ${label(start)} before departure` : 'Any time before departure';
    }
    if (!start) return `Less than ${label(end)} before departure`;
    return `${label(start)} – ${label(end)} before departure`;
};

const getLowestAmount = (items) => {
    const amounts = (Array.isArray(items) ? items : [])
        .map((item) => Number(item?.amount))
        .filter((amount) => Number.isFinite(amount) && amount > 0);
    return amounts.length ? Math.min(...amounts) : null;
};

const getAlerts = (review) => {
    const alerts = Array.isArray(review?.alerts) ? review.alerts : [];

    return alerts.flatMap((alert) => {
        const misc = alert?.miscAlert;
        if (!misc || typeof misc !== 'object') return [];

        return Object.entries(misc).flatMap(([route, changes]) =>
            (Array.isArray(changes) ? changes : [])
                .filter((change) => change?.oldValue != null || change?.newValue != null)
                .map((change) => ({
                    route: route.replace('-', ' → '),
                    key: humanize(change?.key || 'Fare'),
                    oldValue: String(change?.oldValue ?? ''),
                    newValue: String(change?.newValue ?? ''),
                }))
        );
    });
};

/* Price the customer saw on the results page for the same selection */
const getSearchedTotal = (selections, paxInfo) =>
    (Array.isArray(selections) ? selections : []).reduce(
        (sum, selection) =>
            sum +
            PAX_TYPES.reduce(
                (paxSum, [type]) =>
                    paxSum +
                    Number(selection?.fare?.fd?.[type]?.fC?.TF || 0) *
                        Number(paxInfo?.[type] || 0),
                0
            ),
        0
    );

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function AirlineLogo({ code, name, size = 34 }) {
    const [failed, setFailed] = useState(false);

    if (!code || failed) {
        return (
            <span className="rv-logo rv-logo-fallback" style={{ width: size, height: size }}>
                {code || '✈'}
            </span>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            className="rv-logo"
            src={`https://pics.avs.io/120/120/${code}.png`}
            alt={name || code}
            width={size}
            height={size}
            onError={() => setFailed(true)}
        />
    );
}

function RuleTable({ items, emptyText }) {
    if (!Array.isArray(items) || !items.length) {
        return <p className="rv-muted">{emptyText}</p>;
    }

    return (
        <div className="rv-table-wrap">
            <table className="rv-table">
                <thead>
                    <tr>
                        <th>Time frame</th>
                        <th>Airline fee</th>
                        <th>Service fee</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td>
                                {ruleWindow(item?.st, item?.et)}
                                {item?.policyInfo && <small>{item.policyInfo}</small>}
                            </td>
                            <td>{item?.amount != null ? money(item.amount) : 'As per airline'}</td>
                            <td>{item?.additionalFee != null ? money(item.additionalFee) : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* =========================================================
   PAGE
========================================================= */

export default function FlightReviewPage() {
    const router = useRouter();

    /* null => not hydrated yet, '' => nothing saved */
    const stored = useSyncExternalStore(
        () => () => {},
        () => sessionStorage.getItem(SELECTED_KEY) || '',
        () => null
    );

    const bookingData = useMemo(() => {
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }, [stored]);

    const review = bookingData?.review || null;

    useEffect(() => {
        if (stored === '' || (stored && !review)) {
            router.replace('/flights');
        }
    }, [stored, review, router]);

    const [openTrip, setOpenTrip] = useState({});
    const [ruleTab, setRuleTab] = useState({});
    const [showTaxes, setShowTaxes] = useState(false);
    const [showPax, setShowPax] = useState(false);
    const [priceAccepted, setPriceAccepted] = useState(false);
    const [searching, setSearching] = useState(false);

    /* =====================================================
       DERIVED DATA
    ===================================================== */

    const trips = useMemo(() => getTrips(review), [review]);
    const searchQuery = useMemo(
        () => review?.searchQuery || bookingData?.request?.searchQuery || {},
        [review, bookingData]
    );
    const routeInfos = useMemo(
        () => searchQuery?.routeInfos || bookingData?.request?.searchQuery?.routeInfos || [],
        [searchQuery, bookingData]
    );
    const paxInfo = searchQuery?.paxInfo || bookingData?.request?.searchQuery?.paxInfo || {};
    const conditions = useMemo(() => review?.conditions || {}, [review]);
    const tripType = bookingData?.tripType || 'ONE_WAY';
    const isDomestic = searchQuery?.isDomestic !== false;

    const paxCounts = PAX_TYPES
        .map(([type, label]) => ({ type, label, count: Number(paxInfo?.[type] || 0) }))
        .filter((row) => row.count > 0);

    const travellerCount = paxCounts.reduce((sum, row) => sum + row.count, 0) || 1;

    /* One entry per journey, each linked to its priced trip */
    const journeys = useMemo(() => {
        const list = trips.flatMap((trip) => {
            const segments = getSegments(trip);
            const parts = trips.length === 1 && routeInfos.length > 1
                ? splitJourneys(segments, routeInfos)
                : [segments];
            return parts.map((part) => ({ trip, segments: part }));
        });

        return list.map((journey, index) => {
            let title = 'Onward';
            if (tripType === 'ROUND_TRIP') title = index === 0 ? 'Onward' : 'Return';
            if (tripType === 'MULTI_CITY') title = `Flight ${index + 1}`;
            return { ...journey, index, title, summary: getJourneySummary(journey.segments) };
        });
    }, [trips, routeInfos, tripType]);

    const totalFare = review?.totalPriceInfo?.totalFareDetail?.fC || {};
    const totalTaxes = review?.totalPriceInfo?.totalFareDetail?.afC?.TAF || {};
    const grandTotal = Number(totalFare.TF || 0);

    const paxBreakup = paxCounts.map((row) => {
        const perPerson = trips.reduce(
            (acc, trip) => {
                const fC = getTripFare(trip)?.fd?.[row.type]?.fC || {};
                return {
                    base: acc.base + Number(fC.BF || 0),
                    taxes: acc.taxes + Number(fC.TAF || 0),
                    total: acc.total + Number(fC.TF || 0),
                };
            },
            { base: 0, taxes: 0, total: 0 }
        );
        return { ...row, ...perPerson };
    });

    const searchedTotal = getSearchedTotal(bookingData?.selections, paxInfo);
    const priceDiff = searchedTotal && grandTotal ? Math.round(grandTotal - searchedTotal) : 0;

    const alerts = getAlerts(review);

    /* Add-ons offered by the airline (booked in the next steps) */
    const addOns = useMemo(() => {
        const all = trips.flatMap((trip) => getSegments(trip).map((segment) => segment?.ssrInfo || {}));
        const pick = (key) => all.flatMap((info) => (Array.isArray(info?.[key]) ? info[key] : []));
        const meals = pick('MEAL');
        const baggage = pick('BAGGAGE');
        const seatPaid = trips.some((trip) => (getFareRules(trip)?.SEAT_CHARGEABLE || []).length);

        return [
            meals.length && { icon: '🍽', title: 'Meals', text: getLowestAmount(meals) ? `From ${money(getLowestAmount(meals))}` : 'Available' },
            baggage.length && { icon: '🧳', title: 'Extra baggage', text: getLowestAmount(baggage) ? `From ${money(getLowestAmount(baggage))}` : 'Available' },
            (conditions?.fsc?.issi !== false) && { icon: '💺', title: 'Seats', text: seatPaid ? 'Paid seats available' : 'Seat selection available' },
        ].filter(Boolean);
    }, [trips, conditions]);

    const importantInfo = useMemo(() => {
        const list = [];
        const dob = conditions?.dob || {};

        list.push(
            isDomestic
                ? 'Carry a valid government-issued photo ID (Aadhaar, Passport, Driving Licence, Voter ID) for every traveller.'
                : 'Carry a passport valid for at least 6 months from the date of travel, along with the required visas.'
        );
        list.push(
            isDomestic
                ? 'Reach the airport at least 2 hours before departure. Check-in usually closes 45–60 minutes before departure.'
                : 'Reach the airport at least 3 hours before departure. Check-in usually closes 60–75 minutes before departure.'
        );

        const dobTypes = [dob.adobr && 'adults', dob.cdobr && 'children', dob.idobr && 'infants'].filter(Boolean);
        if (dobTypes.length) list.push(`Date of birth is mandatory for ${dobTypes.join(', ')}.`);

        if (conditions?.pcs?.pped || conditions?.pcs?.pid) {
            list.push('Passport details are mandatory for all travellers on this booking.');
        }
        if (conditions?.gst?.gstappl) {
            list.push('You can add your company GST details in the next step to claim GST credit.');
        }
        if (journeys.some((journey) => journey.segments.length > 1)) {
            list.push('For connecting flights, please check whether you need to re-check your baggage at the transit airport.');
        }

        trips.forEach((trip) =>
            (getTripFare(trip)?.messages || []).forEach((message) => {
                const text = typeof message === 'string' ? message : message?.message || message?.msg;
                if (text) list.push(text);
            })
        );

        return [...new Set(list)];
    }, [conditions, isDomestic, journeys, trips]);

    /* =====================================================
       SESSION TIMER (conditions.st seconds from review)
    ===================================================== */

    /*
     * Fare rules come with the review. If the airline did not send
     * them there, load them from the fare-rule API (REVIEW flow).
     */
    const [fetchedRules, setFetchedRules] = useState(null);
    const needsRuleFetch = useMemo(
        () => trips.length > 0 && trips.some((trip) => !Object.keys(getFareRules(trip)).length),
        [trips]
    );

    useEffect(() => {
        if (!needsRuleFetch || !review?.bookingId) return undefined;
        let active = true;
        flightService
            .fareRule({ id: review.bookingId, flowType: 'REVIEW' })
            .then((data) => { if (active) setFetchedRules(data?.fareRule || {}); })
            .catch(() => { if (active) setFetchedRules({}); });
        return () => { active = false; };
    }, [needsRuleFetch, review]);

    const rulesLoading = needsRuleFetch && fetchedRules === null;

    const expiresAt = getSessionExpiry(bookingData);
    const secondsLeft = useSessionTimer(expiresAt);
    const sessionExpired = secondsLeft === 0;

    /* =====================================================
       ACTIONS
    ===================================================== */

    const searchAgain = async () => {
        try {
            setSearching(true);
            const saved = JSON.parse(sessionStorage.getItem(SEARCH_KEY) || 'null');
            const request = saved?.request || bookingData?.request;
            if (!request) {
                router.push('/flights');
                return;
            }
            const response = await flightService.search(request);
            sessionStorage.setItem(
                SEARCH_KEY,
                JSON.stringify({ ...(saved || {}), request, response, searchedAt: new Date().toISOString() })
            );
            sessionStorage.removeItem(UNAVAILABLE_KEY);
            router.push('/flights/results');
        } catch (error) {
            toast.error(error?.message || 'Unable to search flights. Please try again.');
            setSearching(false);
        }
    };

    const handleContinue = () => {
        if (sessionExpired) return;

        try {
            let existingPassengers = [];
            let existingContact = { email: '', mobile: '', countryCode: '+91' };

            // Keep traveller details if the user comes back to review
            try {
                const previous = JSON.parse(sessionStorage.getItem(FLOW_KEY) || 'null');
                if (Array.isArray(previous?.passengers)) existingPassengers = previous.passengers;
                if (previous?.contact) existingContact = { ...existingContact, ...previous.contact };
            } catch {
                /* ignore broken previous flow */
            }

            const passengerFlow = {
                version: 2,
                bookingId: review?.bookingId || null,
                tripType: bookingData?.tripType || null,
                search: bookingData?.search || null,
                request: bookingData?.request || null,
                selections: bookingData?.selections || [],
                priceIds: bookingData?.priceIds || [],
                review,
                selectedFare: bookingData?.selections || [],
                passengers: existingPassengers,
                contact: existingContact,
                payment: { status: 'PENDING', transactionId: null },
                booking: { status: 'NOT_STARTED', pnr: null, bookingId: null },
                reviewedAt: bookingData?.reviewedAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            sessionStorage.setItem(FLOW_KEY, JSON.stringify(passengerFlow));
            router.push(NEXT_ROUTE);
        } catch (error) {
            console.error('Unable to save passenger flow:', error);
            toast.error('Unable to continue. Please try again.');
        }
    };

    /* =====================================================
       STATES
    ===================================================== */

    if (!bookingData || !review) {
        return (
            <main className="flight-review-page">
                <div className="rv-container">
                    <div className="rv-empty">
                        <span className="rv-spinner" />
                        <p>Loading your itinerary…</p>
                    </div>
                </div>
            </main>
        );
    }

    if (!journeys.length) {
        return (
            <main className="flight-review-page">
                <div className="rv-container">
                    <div className="rv-empty">
                        <h2>Itinerary not available</h2>
                        <p>We could not load the selected flight. Please search again.</p>
                        <button type="button" className="rv-btn" onClick={() => router.push('/flights')}>
                            Search flights
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const firstRoute = routeInfos[0];
    const lastRoute = routeInfos[routeInfos.length - 1];

    /* =====================================================
       RENDER
    ===================================================== */

    const renderJourney = (journey) => {
        const { trip, segments, summary, index, title } = journey;
        const fare = getTripFare(trip);
        const adult = fare?.fd?.ADULT || {};
        const refund = REFUND_TYPES[adult?.rT];
        const isOpen = openTrip[index] !== false;
        const mainAirline = segments[0]?.fD?.aI || {};

        return (
            <article className="rv-card rv-journey" key={index}>
                <button
                    type="button"
                    className="rv-journey-head"
                    onClick={() => setOpenTrip((prev) => ({ ...prev, [index]: !isOpen }))}
                    aria-expanded={isOpen}
                >
                    <div className="rv-journey-title">
                        <span className="rv-badge">{title}</span>
                        <strong>
                            {summary.first?.da?.city || summary.first?.da?.code} → {summary.last?.aa?.city || summary.last?.aa?.code}
                        </strong>
                        <small>
                            {formatDate(summary.first?.dt, true)} • {summary.stops === 0 ? 'Non-stop' : `${summary.stops} stop${summary.stops > 1 ? 's' : ''}`} • {formatDuration(summary.duration)}
                        </small>
                    </div>
                    <div className="rv-journey-tags">
                        {refund && <span className={`rv-tag ${refund.tone}`}>{refund.label}</span>}
                        {fare?.fareIdentifier && <span className="rv-tag">{humanize(fare.fareIdentifier)}</span>}
                        <span className="rv-chevron">{isOpen ? '−' : '+'}</span>
                    </div>
                </button>

                {!isOpen && (
                    <div className="rv-journey-compact">
                        <AirlineLogo code={mainAirline.code} name={mainAirline.name} size={26} />
                        <span>{formatTime(summary.first?.dt)} {summary.first?.da?.code}</span>
                        <i />
                        <span>
                            {formatTime(summary.last?.at)} {summary.last?.aa?.code}
                            {summary.nextDay > 0 && <sup>+{summary.nextDay}</sup>}
                        </span>
                    </div>
                )}

                {isOpen && (
                    <div className="rv-segments">
                        {segments.map((segment, segmentIndex) => {
                            const next = segments[segmentIndex + 1];
                            const layover = next ? minutesBetween(segment?.at, next?.dt) : 0;
                            const terminalChange =
                                next && segment?.aa?.terminal && next?.da?.terminal &&
                                segment.aa.terminal !== next.da.terminal;
                            const airline = segment?.fD?.aI || {};
                            const segmentNextDay = dayDiff(segment?.dt, segment?.at);

                            return (
                                <div key={segment?.id || segmentIndex}>
                                    <div className="rv-segment">
                                        <div className="rv-seg-airline">
                                            <AirlineLogo code={airline.code} name={airline.name} />
                                            <div>
                                                <strong>{airline.name}</strong>
                                                <span>{airline.code}-{segment?.fD?.fN}</span>
                                                <small>
                                                    {[
                                                        segment?.fD?.eT && `Aircraft ${segment.fD.eT}`,
                                                        humanize(adult?.cc || searchQuery?.cabinClass || 'ECONOMY'),
                                                        adult?.cB && `Class ${adult.cB}`,
                                                    ].filter(Boolean).join(' • ')}
                                                </small>
                                                {segment?.fD?.oB?.code && segment.fD.oB.code !== airline.code && (
                                                    <small>Operated by {segment.fD.oB.name || segment.fD.oB.code}</small>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rv-seg-point">
                                            <strong>{formatTime(segment?.dt)} <b>{segment?.da?.code}</b></strong>
                                            <span>{formatDate(segment?.dt, true)}</span>
                                            <small>{segment?.da?.name}{segment?.da?.city ? `, ${segment.da.city}` : ''}</small>
                                            {segment?.da?.terminal && <em>{segment.da.terminal}</em>}
                                        </div>

                                        <div className="rv-seg-duration">
                                            <span>{formatDuration(segment?.duration)}</span>
                                            <i />
                                            {Array.isArray(segment?.so) && segment.so.length > 0 && (
                                                <small>Technical stop: {segment.so.map((stop) => stop?.code).join(', ')}</small>
                                            )}
                                        </div>

                                        <div className="rv-seg-point rv-seg-end">
                                            <strong>
                                                {formatTime(segment?.at)} <b>{segment?.aa?.code}</b>
                                                {segmentNextDay > 0 && <sup>+{segmentNextDay}</sup>}
                                            </strong>
                                            <span>{formatDate(segment?.at, true)}</span>
                                            <small>{segment?.aa?.name}{segment?.aa?.city ? `, ${segment.aa.city}` : ''}</small>
                                            {segment?.aa?.terminal && <em>{segment.aa.terminal}</em>}
                                        </div>
                                    </div>

                                    {next && (
                                        <div className="rv-layover">
                                            <span>
                                                Change of planes • <b>{formatDuration(layover)}</b> layover in {segment?.aa?.city || segment?.aa?.code} ({segment?.aa?.code})
                                            </span>
                                            {terminalChange && <em>Terminal change: {segment.aa.terminal} → {next.da.terminal}</em>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="rv-baggage">
                            <div className="rv-baggage-head">
                                <span>Traveller</span>
                                <span>Check-in baggage</span>
                                <span>Cabin baggage</span>
                            </div>
                            {paxCounts.map((row) => {
                                const bI = fare?.fd?.[row.type]?.bI || {};
                                return (
                                    <div className="rv-baggage-row" key={row.type}>
                                        <span>{row.label}</span>
                                        <span>{bI.iB || (row.type === 'INFANT' ? 'Nil' : 'As per airline')}</span>
                                        <span>{bI.cB || 'As per airline'}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </article>
        );
    };

    /* Fare rules are attached to each priced trip */
    const ruleSources = trips.map((trip, index) => {
        const tripJourneys = journeys.filter((journey) => journey.trip === trip);
        const first = tripJourneys[0]?.summary?.first;
        const last = tripJourneys[tripJourneys.length - 1]?.summary?.last;
        return {
            index,
            trip,
            label: tripJourneys.length > 1
                ? tripJourneys.map((journey) => `${journey.summary.first?.da?.code}-${journey.summary.last?.aa?.code}`).join(', ')
                : `${first?.da?.code} → ${last?.aa?.code}`,
            routeKey: `${first?.da?.code}-${last?.aa?.code}`,
        };
    });

    const getRulesFor = (source) => {
        const info = getTripFare(source?.trip)?.fareRuleInformation || {};
        if (Object.keys(info?.tfr || {}).length) return { tfr: info.tfr, fr: info.fr };
        const fetched = fetchedRules?.[source?.routeKey] || Object.values(fetchedRules || {})[source?.index] || {};
        return { tfr: fetched?.tfr || {}, fr: fetched?.fr || info?.fr };
    };

    return (
        <>
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

            <main className="flight-review-page">

                <BookingTopBar
                    step={0}
                    onBack={() => router.push('/flights/results')}
                    backLabel="Flights"
                    secondsLeft={secondsLeft}
                    total={grandTotal}
                    totalLabel={`Total (${travellerCount} traveller${travellerCount > 1 ? 's' : ''})`}
                    onContinue={handleContinue}
                    continueDisabled={sessionExpired}
                />

                <div className="rv-container rv-layout">

                    {/* LEFT */}
                    <section className="rv-main">
                        <div className="rv-page-head">
                            <div>
                                <h1>Review your booking</h1>
                                <p>
                                    {tripType === 'MULTI_CITY'
                                        ? routeInfos.map((route) => route?.fromCityOrAirport?.code).concat(lastRoute?.toCityOrAirport?.code).join(' → ')
                                        : `${firstRoute?.fromCityOrAirport?.city || firstRoute?.fromCityOrAirport?.code} → ${firstRoute?.toCityOrAirport?.city || firstRoute?.toCityOrAirport?.code}`}
                                    {' • '}
                                    {tripType === 'ROUND_TRIP' ? 'Round trip' : tripType === 'MULTI_CITY' ? 'Multi city' : 'One way'}
                                    {' • '}
                                    {travellerCount} traveller{travellerCount > 1 ? 's' : ''}
                                </p>
                            </div>
                            <button type="button" className="rv-link" onClick={() => router.push('/flights/results')}>
                                Change flight
                            </button>
                        </div>

                        {priceDiff !== 0 && (
                            <div className={`rv-notice ${priceDiff > 0 ? 'warning' : 'success'}`}>
                                <strong>
                                    {priceDiff > 0 ? 'Fare increased by the airline' : 'Good news! The fare has dropped'}
                                </strong>
                                <span>
                                    Total fare changed from {money(searchedTotal)} to <b>{money(grandTotal)}</b> ({priceDiff > 0 ? '+' : '−'}{money(Math.abs(priceDiff))}).
                                </span>
                            </div>
                        )}

                        {alerts.length > 0 && (
                            <div className="rv-notice info">
                                <strong>The airline has updated some details of this fare</strong>
                                <ul>
                                    {alerts.map((alert, index) => (
                                        <li key={index}>
                                            <b>{alert.key} ({alert.route}):</b> {alert.newValue || 'Updated'}
                                            {alert.oldValue && <s>{alert.oldValue}</s>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {journeys.map(renderJourney)}

                        {/* FARE RULES */}
                        <section className="rv-card">
                            <div className="rv-card-head">
                                <h2>Cancellation &amp; date change policy</h2>
                                {ruleSources.length > 1 && (
                                    <div className="rv-pills">
                                        {ruleSources.map((source) => (
                                            <button
                                                key={source.index}
                                                type="button"
                                                className={(ruleTab.trip ?? 0) === source.index ? 'active' : ''}
                                                onClick={() => setRuleTab((prev) => ({ ...prev, trip: source.index }))}
                                            >
                                                {source.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {(() => {
                                const source = ruleSources[ruleTab.trip ?? 0] || ruleSources[0];
                                const { tfr: rules, fr } = getRulesFor(source);
                                const adult = getTripFare(source?.trip)?.fd?.ADULT || {};
                                const nonRefundable = Number(adult?.rT) === 0;
                                const detailed = getDetailedRules(fr);
                                const tabs = [
                                    ...new Set(['CANCELLATION', 'DATECHANGE', ...getRuleTypes(rules).filter((type) => type !== 'DATE_CHANGE')]),
                                    ...(detailed.length ? ['DETAILED'] : []),
                                ];
                                const activeType = tabs.includes(ruleTab.type) ? ruleTab.type : 'CANCELLATION';
                                const items = rules?.[activeType] || (activeType === 'DATECHANGE' ? rules?.DATE_CHANGE : null);
                                const textOnly = Array.isArray(items) && items.every((item) => item?.amount == null && item?.additionalFee == null);

                                return (
                                    <>
                                        <div className="rv-tabs">
                                            {tabs.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    className={activeType === type ? 'active' : ''}
                                                    onClick={() => setRuleTab((prev) => ({ ...prev, type }))}
                                                >
                                                    {type === 'DETAILED' ? 'Airline fare rules' : RULE_LABELS[type] || humanize(type)}
                                                </button>
                                            ))}
                                        </div>

                                        {rulesLoading && !Object.keys(rules || {}).length ? (
                                            <p className="rv-muted">Loading fare rules…</p>
                                        ) : activeType === 'DETAILED' ? (
                                            <div className="rv-rule-text">
                                                {detailed.map((section, index) => (
                                                    <div key={index}>
                                                        {section.title && <strong>{section.title}</strong>}
                                                        <p>{section.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : textOnly ? (
                                            <ul className="rv-rule-list">
                                                {items.map((item, index) => (
                                                    <li key={index}>
                                                        <span>{ruleWindow(item?.st, item?.et)}</span>
                                                        <b>{item?.policyInfo || 'As per airline policy'}</b>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <RuleTable
                                                items={items}
                                                emptyText={
                                                    activeType === 'CANCELLATION' && nonRefundable
                                                        ? 'This fare is non-refundable. Only statutory taxes may be refunded on cancellation.'
                                                        : 'Charges will be applied as per the airline policy.'
                                                }
                                            />
                                        )}

                                        {activeType !== 'NO_SHOW' && (rules?.NO_SHOW || []).map((item, index) => (
                                            <p className="rv-rule-note" key={`ns-${index}`}>
                                                <b>No-show:</b> {item?.policyInfo || 'No-show charges apply as per airline policy.'}
                                            </p>
                                        ))}

                                        <p className="rv-muted rv-small">
                                            Charges are per traveller per sector. Airline fees are indicative and may change at the time of cancellation or rescheduling.
                                        </p>
                                    </>
                                );
                            })()}
                        </section>

                        {/* ADD-ONS */}
                        {addOns.length > 0 && (
                            <section className="rv-card">
                                <div className="rv-card-head">
                                    <h2>Add-ons for your trip</h2>
                                    <small>You can add these in the next steps</small>
                                </div>
                                <div className="rv-addons">
                                    {addOns.map((addOn) => (
                                        <div className="rv-addon" key={addOn.title}>
                                            <span>{addOn.icon}</span>
                                            <div>
                                                <strong>{addOn.title}</strong>
                                                <small>{addOn.text}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* IMPORTANT INFO */}
                        <section className="rv-card">
                            <div className="rv-card-head">
                                <h2>Important information</h2>
                            </div>
                            <ul className="rv-info-list">
                                {importantInfo.map((text) => <li key={text}>{text}</li>)}
                            </ul>
                        </section>

                        {/* TERMS */}
                        <section className="rv-card">
                            <div className="rv-card-head">
                                <h2>Terms &amp; conditions</h2>
                            </div>
                            <ul className="rv-info-list">
                                {TERMS.map((text) => <li key={text}>{text}</li>)}
                            </ul>
                            <p className="rv-muted rv-small">
                                Read our full{' '}
                                <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of use</a>
                                {' '}and{' '}
                                <a href="/cancellation" target="_blank" rel="noopener noreferrer">Cancellation &amp; refund policy</a>.
                            </p>
                        </section>
                    </section>

                    {/* RIGHT: FARE SUMMARY */}
                    <aside className="rv-sidebar">
                        <section className="rv-card rv-fare">
                            <h2>Fare summary</h2>
                            <small className="rv-muted">
                                {paxCounts.map((row) => `${row.count} ${row.label}${row.count > 1 ? (row.type === 'CHILD' ? 'ren' : 's') : ''}`).join(', ')}
                            </small>

                            <button type="button" className="rv-fare-row rv-fare-toggle" onClick={() => setShowPax((value) => !value)}>
                                <span>Base fare <i>{showPax ? '−' : '+'}</i></span>
                                <strong>{money(totalFare.BF)}</strong>
                            </button>
                            {showPax && (
                                <div className="rv-fare-sub">
                                    {paxBreakup.map((row) => (
                                        <div key={row.type}>
                                            <span>{row.label} × {row.count} ({money(row.base)} each)</span>
                                            <span>{money(row.base * row.count)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button type="button" className="rv-fare-row rv-fare-toggle" onClick={() => setShowTaxes((value) => !value)}>
                                <span>Taxes &amp; fees <i>{showTaxes ? '−' : '+'}</i></span>
                                <strong>{money(totalFare.TAF)}</strong>
                            </button>
                            {showTaxes && (
                                <div className="rv-fare-sub">
                                    {Object.entries(totalTaxes)
                                        .filter(([, value]) => Number(value))
                                        .map(([key, value]) => (
                                            <div key={key}>
                                                <span>{TAX_LABELS[key] || humanize(key)}</span>
                                                <span>{money(value)}</span>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {Number(totalFare.TF) - Number(totalFare.BF || 0) - Number(totalFare.TAF || 0) > 1 && (
                                <div className="rv-fare-row">
                                    <span>Other charges</span>
                                    <strong>{money(Number(totalFare.TF) - Number(totalFare.BF || 0) - Number(totalFare.TAF || 0))}</strong>
                                </div>
                            )}

                            <div className="rv-fare-total">
                                <div>
                                    <strong>Total amount</strong>
                                    <small>Inclusive of all taxes</small>
                                </div>
                                <strong>{money(grandTotal)}</strong>
                            </div>

                            <p className="rv-secure">🔒 Secure booking • Fare confirmed with the airline</p>
                        </section>

                        <section className="rv-card rv-trip-summary">
                            <h2>Your trip</h2>
                            {journeys.map((journey) => (
                                <div className="rv-trip-row" key={journey.index}>
                                    <AirlineLogo code={journey.segments[0]?.fD?.aI?.code} name={journey.segments[0]?.fD?.aI?.name} size={26} />
                                    <div>
                                        <strong>{journey.summary.first?.da?.code} → {journey.summary.last?.aa?.code}</strong>
                                        <small>
                                            {formatDate(journey.summary.first?.dt)} • {formatTime(journey.summary.first?.dt)} – {formatTime(journey.summary.last?.at)}
                                        </small>
                                    </div>
                                </div>
                            ))}
                            <div className="rv-trip-meta">
                                <span>Cabin</span>
                                <strong>{humanize(searchQuery?.cabinClass || 'ECONOMY')}</strong>
                            </div>
                        </section>
                    </aside>
                </div>

                {/* PRICE INCREASE CONFIRMATION */}
                {priceDiff > 0 && !priceAccepted && !sessionExpired && (
                    <div className="rv-modal" role="dialog" aria-modal="true">
                        <div className="rv-modal-card">
                            <h3>Fare has changed</h3>
                            <p>
                                The airline has increased the fare for your selected flight.
                            </p>
                            <div className="rv-modal-prices">
                                <div><small>Previous fare</small><s>{money(searchedTotal)}</s></div>
                                <div><small>New fare</small><strong>{money(grandTotal)}</strong></div>
                            </div>
                            <div className="rv-modal-actions">
                                <button type="button" className="rv-btn rv-btn-outline" onClick={() => router.push('/flights/results')}>
                                    Choose another flight
                                </button>
                                <button type="button" className="rv-btn" onClick={() => setPriceAccepted(true)}>
                                    Continue with new fare
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SESSION EXPIRED */}
                {sessionExpired && (
                    <div className="rv-modal" role="dialog" aria-modal="true">
                        <div className="rv-modal-card">
                            <h3>Your session has expired</h3>
                            <p>
                                Flight prices and availability change frequently. Please search again to get the latest fares.
                            </p>
                            <div className="rv-modal-actions">
                                <button type="button" className="rv-btn rv-btn-outline" onClick={() => router.push('/flights')}>
                                    Go to flight search
                                </button>
                                <button type="button" className="rv-btn" disabled={searching} onClick={searchAgain}>
                                    {searching ? 'Searching…' : 'Search again'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
