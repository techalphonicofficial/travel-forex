'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import './review.css';

/* =========================================================
   HELPERS
========================================================= */

const money = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
    })}`;
};

const formatTime = (value) => {
    if (!value) return '--';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(11, 16) || '--';
    }

    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

const formatDate = (value) => {
    if (!value) return '--';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
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

const getTripInfos = (review) => {
    const value =
        review?.tripInfos ||
        review?.searchResult?.tripInfos ||
        review?.data?.tripInfos ||
        review?.data?.searchResult?.tripInfos ||
        [];

    if (Array.isArray(value)) {
        return value;
    }

    if (value && typeof value === 'object') {
        return Object.values(value)
            .filter(Array.isArray)
            .flat();
    }

    return [];
};

const getSegments = (trip) =>
    Array.isArray(trip?.sI) ? trip.sI : [];

const getFirstSegment = (trip) =>
    getSegments(trip)[0];

const getLastSegment = (trip) => {
    const segments = getSegments(trip);

    return segments[segments.length - 1];
};

const getFare = (trip) =>
    trip?.totalPriceList?.[0] ||
    trip?.priceList?.[0] ||
    null;

const getFareDetail = (trip) =>
    getFare(trip)?.fd?.ADULT?.fC || {};

const getAirline = (trip) =>
    getFirstSegment(trip)?.fD?.aI || {};

const getStops = (trip) =>
    Math.max(0, getSegments(trip).length - 1);

const getDuration = (trip) =>
    getSegments(trip).reduce(
        (sum, segment) =>
            sum + Number(segment?.duration || 0),
        0
    );

const getTotalFare = (review, trips) => {
    const total =
        review?.totalPriceInfo?.totalFareDetail?.fC?.TF ??
        review?.data?.totalPriceInfo?.totalFareDetail?.fC?.TF;

    if (total != null) {
        return Number(total);
    }

    return trips.reduce(
        (sum, trip) =>
            sum + Number(getFareDetail(trip)?.TF || 0),
        0
    );
};

const getSearchQuery = (review) =>
    review?.searchQuery ||
    review?.data?.searchQuery ||
    review?.request?.searchQuery ||
    null;

const getAlerts = (review) => {
    const alerts =
        review?.alerts ||
        review?.data?.alerts ||
        [];

    if (!Array.isArray(alerts)) {
        return [];
    }

    return alerts.flatMap((alert) => {
        const miscAlert = alert?.miscAlert;

        if (
            !miscAlert ||
            typeof miscAlert !== 'object' ||
            Array.isArray(miscAlert)
        ) {
            return [];
        }

        return Object.entries(miscAlert).flatMap(
            ([route, changes]) => {
                if (!Array.isArray(changes)) {
                    return [];
                }

                return changes
                    .filter(
                        (change) =>
                            change?.oldValue != null ||
                            change?.newValue != null
                    )
                    .map((change) => ({
                        route,
                        key:
                            change?.key ||
                            'Fare update',
                        oldValue:
                            String(
                                change?.oldValue ?? ''
                            ),
                        newValue:
                            String(
                                change?.newValue ?? ''
                            ),
                    }));
            }
        );
    });
};

const getFareRuleGroups = (trip) => {
    const rules = getFareRules(trip);

    if (!rules || typeof rules !== 'object') {
        return [];
    }

    const labels = {
        CANCELLATION: 'Cancellation',
        DATECHANGE: 'Date Change',
        NO_SHOW: 'No Show',
        SEAT_CHARGEABLE: 'Seat',
        REISSUE: 'Reissue',
        BAGGAGE: 'Baggage',
        MEAL: 'Meal',
    };

    return Object.entries(rules)
        .filter(
            ([, policies]) =>
                Array.isArray(policies) &&
                policies.length > 0
        )
        .map(([type, policies]) => ({
            type,
            title:
                labels[type] ||
                type
                    .replaceAll('_', ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (char) =>
                        char.toUpperCase()
                    ),
            policies,
        }));
};

const getRule = (trip, type) => {
    const rules = getFareRules(trip);

    const value = rules?.[type];

    return Array.isArray(value) && value.length
        ? value[0]
        : null;
};

const getLowestRuleAmount = (trip, type) => {
    const rules = getFareRules(trip);
    const values = rules?.[type];

    if (!Array.isArray(values) || !values.length) {
        return null;
    }

    const amounts = values
        .map((item) => Number(item?.amount))
        .filter((amount) => Number.isFinite(amount));

    if (!amounts.length) {
        return null;
    }

    return Math.min(...amounts);
};

const getBaggageText = (trip) => {
    const baggage = getBaggage(trip);

    if (!baggage || typeof baggage !== 'object') {
        return {
            cabin: 'As per fare',
            checkIn: 'As per fare',
        };
    }

    return {
        cabin:
            baggage?.cabin ||
            baggage?.cB ||
            baggage?.CABIN ||
            'As per fare',

        checkIn:
            baggage?.checkIn ||
            baggage?.iB ||
            baggage?.CHECK_IN ||
            'As per fare',
    };
};

const getMealText = (trip) => {
    const rules = getFareRules(trip);

    if (rules?.MEAL?.length) {
        return 'Paid Meal';
    }

    if (rules?.MEAL_CHARGEABLE?.length) {
        return 'Paid Meal';
    }

    return 'Meal as per fare';
};

const getSeatText = (trip) => {
    const rules = getFareRules(trip);

    if (rules?.SEAT_CHARGEABLE?.length) {
        return 'Paid Seat';
    }

    return 'Seat selection available';
};

const getFareDisplayName = (trip) => {
    const fare = getFare(trip);
    const detail = getFareDetail(trip);

    return (
        fare?.fareIdentifier ||
        detail?.cB ||
        detail?.fareClass ||
        'Selected fare'
    );
};

const getFareHighlights = (trip) => {
    const baggage = getBaggageText(trip);

    const dateChangeAmount =
        getLowestRuleAmount(
            trip,
            'DATECHANGE'
        );

    const cancellationAmount =
        getLowestRuleAmount(
            trip,
            'CANCELLATION'
        );

    return {
        dateChange:
            dateChangeAmount != null
                ? `From ${money(dateChangeAmount)}`
                : 'As per fare rules',

        cancellation:
            cancellationAmount != null
                ? `From ${money(cancellationAmount)}`
                : 'As per fare rules',

        cabin: baggage.cabin,

        checkIn: baggage.checkIn,

        meal: getMealText(trip),

        seat: getSeatText(trip),
    };
};

const getBookingId = (review) =>
    review?.bookingId ||
    review?.data?.bookingId ||
    null;

const getFareRules = (trip) =>
    getFare(trip)?.fareRuleInformation?.tfr || {};

const getBaggage = (trip) =>
    getFareDetail(trip)?.bI || {};

const getCabin = (trip) =>
    getFareDetail(trip)?.cc || 'ECONOMY';

const getFareCode = (trip) =>
    getFareDetail(trip)?.cB || '--';

const getRefundText = (trip) => {
    const cancellation =
        getFareRules(trip)?.CANCELLATION || [];

    if (!cancellation.length) {
        return 'Fare rules available';
    }

    const first = cancellation[0];

    if (first?.policyInfo) {
        return first.policyInfo;
    }

    if (
        first?.amount != null ||
        first?.additionalFee != null
    ) {
        return `Cancellation fee ${money(
            Number(first?.amount || 0) +
            Number(first?.additionalFee || 0)
        )}`;
    }

    return 'Cancellation terms apply';
};

const getRouteFromTrip = (trip) => {
    const first = getFirstSegment(trip);
    const last = getLastSegment(trip);

    return {
        from: first?.da?.code || '--',
        to: last?.aa?.code || '--',

        fromCity:
            first?.da?.city ||
            first?.da?.name ||
            '',

        toCity:
            last?.aa?.city ||
            last?.aa?.name ||
            '',

        date: first?.dt,
    };
};

/* =========================================================
   PAGE
========================================================= */

export default function FlightReviewPage() {
    const router = useRouter();

    const [bookingData, setBookingData] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [expandedTrip, setExpandedTrip] =
        useState(null);

    const [showRules, setShowRules] =
        useState(false);

    const [showFareBreakup, setShowFareBreakup] =
        useState(false);

    /*
     * Change this only if your passenger-details
     * page has another pathname.
     */
    const NEXT_ROUTE =
        '/flights/passenger-details';

    /* =====================================================
       LOAD REVIEW DATA
    ===================================================== */

    useEffect(() => {
        try {
            const stored =
                sessionStorage.getItem(
                    'tripjack_selected_flight'
                );

            if (!stored) {
                router.replace('/flights');
                return;
            }

            const parsed =
                JSON.parse(stored);

            if (!parsed?.review) {
                toast.error(
                    'Flight review data is missing.'
                );

                router.replace('/flights');
                return;
            }

            setBookingData(parsed);
        } catch (error) {
            console.error(
                'Unable to load reviewed flight:',
                error
            );

            toast.error(
                'Unable to load flight review.'
            );

            router.replace('/flights');
        } finally {
            setLoading(false);
        }
    }, [router]);

    const review =
        bookingData?.review;

    const trips = useMemo(
        () => getTripInfos(review),
        [review]
    );

    const searchQuery = useMemo(
        () => getSearchQuery(review),
        [review]
    );

    const routeInfos =
        searchQuery?.routeInfos ||
        bookingData?.request?.searchQuery
            ?.routeInfos ||
        [];

    const totalFare = useMemo(
        () => getTotalFare(review, trips),
        [review, trips]
    );

    const fareDetail =
        review?.totalPriceInfo
            ?.totalFareDetail?.fC ||
        review?.data?.totalPriceInfo
            ?.totalFareDetail?.fC ||
        {};

    const alerts = getAlerts(review);

    const isRoundTrip =
        bookingData?.tripType ===
        'ROUND_TRIP';

    const isMultiCity =
        bookingData?.tripType ===
        'MULTI_CITY';

    const isOneWay =
        !isRoundTrip &&
        !isMultiCity;

    const passengerCount =
        Number(
            searchQuery?.paxInfo?.ADULT || 0
        ) +
        Number(
            searchQuery?.paxInfo?.CHILD || 0
        ) +
        Number(
            searchQuery?.paxInfo?.INFANT || 0
        );

    const totalPassengers =
        passengerCount || 1;

    /* =====================================================
       CONTINUE
    ===================================================== */

    const handleContinue = () => {
        try {
            const existingFlow = sessionStorage.getItem(
                'tripjack_passenger_flow'
            );

            let existingPassengers = [];
            let existingContact = {
                email: '',
                mobile: '',
                countryCode: '+91',
            };

            // Preserve passenger data if user comes back to review
            if (existingFlow) {
                try {
                    const parsed = JSON.parse(existingFlow);

                    if (
                        Array.isArray(parsed?.passengers)
                    ) {
                        existingPassengers =
                            parsed.passengers;
                    }

                    if (parsed?.contact) {
                        existingContact = {
                            ...existingContact,
                            ...parsed.contact,
                        };
                    }
                } catch (error) {
                    console.error(
                        'Unable to restore passenger flow:',
                        error
                    );
                }
            }

            const passengerFlow = {
                version: 2,

                bookingId:
                    getBookingId(review) || null,

                tripType:
                    bookingData?.tripType || null,

                search:
                    bookingData?.search || null,

                request:
                    bookingData?.request || null,

                selections:
                    bookingData?.selections || [],

                priceIds:
                    bookingData?.priceIds || [],

                review,

                selectedFare:
                    bookingData?.selections || [],

                passengers:
                    existingPassengers,

                contact:
                    existingContact,

                payment: {
                    status: 'PENDING',
                    transactionId: null,
                },

                booking: {
                    status: 'NOT_STARTED',
                    pnr: null,
                    bookingId: null,
                },

                reviewedAt:
                    bookingData?.reviewedAt ||
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString(),
            };

            sessionStorage.setItem(
                'tripjack_passenger_flow',
                JSON.stringify(passengerFlow)
            );

            router.push(
                '/flights/passenger-details'
            );
        } catch (error) {
            console.error(
                'Unable to save passenger flow:',
                error
            );

            toast.error(
                'Unable to continue. Please try again.'
            );
        }
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <main className="flight-review-page">
                <div className="review-shell">
                    <div className="review-loading">
                        <div className="loading-spinner" />

                        <h2>
                            Preparing your flight review
                        </h2>

                        <p>
                            We are loading the latest
                            fare and itinerary details.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    /* =====================================================
       EMPTY
    ===================================================== */

    if (
        !bookingData ||
        !review ||
        !trips.length
    ) {
        return (
            <main className="flight-review-page">
                <div className="review-shell">
                    <div className="empty-review">
                        <div className="empty-icon">
                            ✈
                        </div>

                        <h2>
                            Flight review unavailable
                        </h2>

                        <p>
                            Your selected flight review
                            could not be loaded.
                        </p>

                        <button
                            type="button"
                            className="primary-btn"
                            onClick={() =>
                                router.push('/flights')
                            }
                        >
                            Back to flights
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3500,

                    style: {
                        fontSize: '14px',
                        borderRadius: '12px',
                    },
                }}
            />

            <main className="flight-review-page">

                <div className="review-shell">

                    {/* =====================================
                        HEADER
                    ===================================== */}

                    <header className="review-header">

                        <div>
                            <div className="section-kicker">
                                REVIEW & PAY
                            </div>

                            <h1>
                                Review your trip
                            </h1>

                            <p>
                                Check your itinerary,
                                baggage and fare before
                                continuing.
                            </p>
                        </div>

                        <div className="verified-badge">
                            <span>✓</span>
                            Fare verified
                        </div>

                    </header>

                    {/* =====================================
                        FARE ALERTS
                    ===================================== */}

                    {alerts.length > 0 && (
                        <section className="fare-alerts">

                            <div className="fare-alert-header">

                                <div className="fare-alert-icon">
                                    !
                                </div>

                                <div className="fare-alert-heading">

                                    <strong>
                                        Fare updated
                                    </strong>

                                    <span>
                                        Some fare details changed while
                                        verifying your flight.
                                    </span>

                                </div>

                            </div>

                            <div className="fare-alert-grid">

                                {alerts.map((alert, index) => (

                                    <div
                                        className="fare-alert-card"
                                        key={`${alert.route}-${alert.key}-${index}`}
                                    >

                                        {/* ROUTE + TYPE */}

                                        <div className="fare-alert-card-top">

                                            <span className="fare-alert-route">
                                                {alert.route}
                                            </span>

                                            <strong>
                                                {alert.key}
                                            </strong>

                                        </div>

                                        {/* CHANGE */}

                                        <div className="fare-alert-change">

                                            <div className="fare-alert-old">

                                                <small>
                                                    Previous
                                                </small>

                                                <span>
                                                    {alert.oldValue ||
                                                        'Not specified'}
                                                </span>

                                            </div>

                                            <span className="fare-alert-arrow">
                                                →
                                            </span>

                                            <div className="fare-alert-new">

                                                <small>
                                                    Updated
                                                </small>

                                                <span>
                                                    {alert.newValue ||
                                                        'Not specified'}
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        </section>
                    )}

                    {/* =====================================
                        PROGRESS
                    ===================================== */}

                    <div className="review-progress">

                        <div className="progress-item active">
                            <span>1</span>
                            <strong>
                                Review
                            </strong>
                        </div>

                        <div className="progress-line active" />

                        <div className="progress-item">
                            <span>2</span>
                            <strong>
                                Passenger details
                            </strong>
                        </div>

                        <div className="progress-line" />

                        <div className="progress-item">
                            <span>3</span>
                            <strong>
                                Payment
                            </strong>
                        </div>

                    </div>

                    {/* =====================================
                        CONTENT
                    ===================================== */}

                    <div className="review-layout">

                        {/* =================================
                            LEFT
                        ================================= */}

                        <section className="review-main">

                            {/* =============================
                                TRIP CARDS
                            ============================= */}

                            {trips.map(
                                (trip, tripIndex) => {

                                    const segments =
                                        getSegments(trip);

                                    const first =
                                        getFirstSegment(trip);

                                    const last =
                                        getLastSegment(trip);

                                    const airline =
                                        getAirline(trip);

                                    const route =
                                        getRouteFromTrip(trip);

                                    const fare =
                                        getFareDetail(trip);

                                    const baggage =
                                        getBaggage(trip);

                                    const stops =
                                        getStops(trip);

                                    const duration =
                                        getDuration(trip);

                                    const isExpanded =
                                        expandedTrip ===
                                        tripIndex;

                                    let tripLabel =
                                        `Flight ${tripIndex + 1}`;

                                    if (isOneWay) {
                                        tripLabel =
                                            'Onward journey';
                                    }

                                    if (
                                        isRoundTrip &&
                                        tripIndex === 0
                                    ) {
                                        tripLabel =
                                            'Onward journey';
                                    }

                                    if (
                                        isRoundTrip &&
                                        tripIndex === 1
                                    ) {
                                        tripLabel =
                                            'Return journey';
                                    }

                                    if (isMultiCity) {
                                        tripLabel =
                                            `Sector ${tripIndex + 1
                                            }`;
                                    }

                                    return (
                                        <article
                                            className="trip-card"
                                            key={tripIndex}
                                        >

                                            {/* CARD HEADER */}

                                            <div className="trip-card-header">

                                                <div>
                                                    <span className="trip-label">
                                                        {tripLabel}
                                                    </span>

                                                    <h2>
                                                        {route.from}
                                                        <span>
                                                            →
                                                        </span>
                                                        {route.to}
                                                    </h2>

                                                    <p>
                                                        {route.fromCity}
                                                        {route.fromCity &&
                                                            route.toCity
                                                            ? ' to '
                                                            : ''}
                                                        {route.toCity}
                                                    </p>
                                                </div>

                                                <div className="trip-date">
                                                    {formatDate(
                                                        first?.dt
                                                    )}
                                                </div>

                                            </div>

                                            {/* MAIN FLIGHT */}

                                            <div className="flight-summary">

                                                {/* AIRLINE */}

                                                <div className="airline-block">

                                                    <div className="airline-logo">
                                                        {airline?.code
                                                            ?.slice(
                                                                0,
                                                                2
                                                            ) ||
                                                            '✈'}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                airline?.name ||
                                                                'Airline'
                                                            }
                                                        </strong>

                                                        <span>
                                                            {first?.fD?.fN
                                                                ? `${first.fD.fN}`
                                                                : '--'}
                                                        </span>
                                                    </div>

                                                </div>

                                                {/* DEPARTURE */}

                                                <div className="time-block">

                                                    <strong>
                                                        {formatTime(
                                                            first?.dt
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {first?.da
                                                            ?.code ||
                                                            '--'}
                                                    </span>

                                                    <small>
                                                        {first?.da
                                                            ?.city ||
                                                            first?.da
                                                                ?.name ||
                                                            ''}
                                                    </small>

                                                </div>

                                                {/* DURATION */}

                                                <div className="flight-middle">

                                                    <span>
                                                        {formatDuration(
                                                            duration
                                                        )}
                                                    </span>

                                                    <div className="flight-line">
                                                        <i />
                                                    </div>

                                                    <small>
                                                        {stops === 0
                                                            ? 'Non-stop'
                                                            : `${stops} stop${stops >
                                                                1
                                                                ? 's'
                                                                : ''
                                                            }`}
                                                    </small>

                                                </div>

                                                {/* ARRIVAL */}

                                                <div className="time-block arrival">

                                                    <strong>
                                                        {formatTime(
                                                            last?.at
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {last?.aa
                                                            ?.code ||
                                                            '--'}
                                                    </span>

                                                    <small>
                                                        {last?.aa
                                                            ?.city ||
                                                            last?.aa
                                                                ?.name ||
                                                            ''}
                                                    </small>

                                                </div>

                                            </div>

                                            {/* METADATA */}

                                            <div className="trip-meta">

                                                <div>
                                                    <span>
                                                        Baggage
                                                    </span>

                                                    <strong>
                                                        {baggage?.checkIn ||
                                                            baggage?.cB ||
                                                            'As per fare'}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Cabin
                                                    </span>

                                                    <strong>
                                                        {baggage?.cabin ||
                                                            getCabin(
                                                                trip
                                                            )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Fare
                                                    </span>

                                                    <strong>
                                                        {getFare(
                                                            trip
                                                        )
                                                            ?.fareIdentifier ||
                                                            'PUBLISHED'}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Fare code
                                                    </span>

                                                    <strong>
                                                        {getFareCode(
                                                            trip
                                                        )}
                                                    </strong>
                                                </div>

                                            </div>

                                            {/* EXPAND */}

                                            <button
                                                type="button"
                                                className="details-toggle"
                                                onClick={() =>
                                                    setExpandedTrip(
                                                        isExpanded
                                                            ? null
                                                            : tripIndex
                                                    )
                                                }
                                            >
                                                <span>
                                                    {isExpanded
                                                        ? 'Hide flight details'
                                                        : 'View flight details'}
                                                </span>

                                                <span>
                                                    {isExpanded
                                                        ? '⌃'
                                                        : '⌄'}
                                                </span>
                                            </button>

                                            {/* SEGMENTS */}

                                            {isExpanded && (
                                                <div className="segment-details">

                                                    {segments.map(
                                                        (
                                                            segment,
                                                            segmentIndex
                                                        ) => {

                                                            const segmentAirline =
                                                                segment
                                                                    ?.fD
                                                                    ?.aI;

                                                            return (
                                                                <div
                                                                    className="segment-row"
                                                                    key={
                                                                        segmentIndex
                                                                    }
                                                                >

                                                                    <div className="segment-number">
                                                                        {segmentIndex +
                                                                            1}
                                                                    </div>

                                                                    <div className="segment-content">

                                                                        <div className="segment-top">

                                                                            <strong>
                                                                                {
                                                                                    segmentAirline?.name
                                                                                }
                                                                            </strong>

                                                                            <span>
                                                                                {
                                                                                    segment
                                                                                        ?.fD
                                                                                        ?.fN
                                                                                }
                                                                            </span>

                                                                        </div>

                                                                        <div className="segment-route">

                                                                            <div>
                                                                                <strong>
                                                                                    {formatTime(
                                                                                        segment?.dt
                                                                                    )}
                                                                                </strong>

                                                                                <span>
                                                                                    {
                                                                                        segment
                                                                                            ?.da
                                                                                            ?.code
                                                                                    }
                                                                                </span>

                                                                                <small>
                                                                                    {
                                                                                        segment
                                                                                            ?.da
                                                                                            ?.city
                                                                                    }
                                                                                </small>
                                                                            </div>

                                                                            <div className="segment-duration">
                                                                                <span>
                                                                                    {formatDuration(
                                                                                        segment?.duration
                                                                                    )}
                                                                                </span>

                                                                                <div className="mini-line" />

                                                                                <small>
                                                                                    {
                                                                                        segment?.stops ===
                                                                                            0
                                                                                            ? 'Non-stop'
                                                                                            : `${segment?.stops || 0} stop`
                                                                                    }
                                                                                </small>
                                                                            </div>

                                                                            <div>
                                                                                <strong>
                                                                                    {formatTime(
                                                                                        segment?.at
                                                                                    )}
                                                                                </strong>

                                                                                <span>
                                                                                    {
                                                                                        segment
                                                                                            ?.aa
                                                                                            ?.code
                                                                                    }
                                                                                </span>

                                                                                <small>
                                                                                    {
                                                                                        segment
                                                                                            ?.aa
                                                                                            ?.city
                                                                                    }
                                                                                </small>
                                                                            </div>

                                                                        </div>

                                                                    </div>

                                                                </div>
                                                            );
                                                        }
                                                    )}

                                                </div>
                                            )}

                                            {/* FARE RULE */}

                                            <div className="trip-rule">

                                                <span>
                                                    Cancellation
                                                </span>

                                                <strong>
                                                    {getRefundText(
                                                        trip
                                                    )}
                                                </strong>

                                            </div>

                                        </article>
                                    );
                                }
                            )}

                            {/* =====================================================
    SELECTED FARE
===================================================== */}

                            <section className="selected-fare-card">

                                {/* HEADER */}

                                <div className="selected-fare-header">

                                    <div>

                                        <div className="section-kicker">
                                            SELECTED FARE
                                        </div>

                                        <h3>
                                            Selected fare
                                        </h3>

                                    </div>

                                    <span className="selected-fare-badge">
                                        ✓ Selected
                                    </span>

                                </div>

                                {trips.map((trip, tripIndex) => {

                                    const route =
                                        getRouteFromTrip(trip);

                                    const airline =
                                        getAirline(trip);

                                    const highlights =
                                        getFareHighlights(trip);

                                    const fareName =
                                        getFareDisplayName(trip);

                                    return (
                                        <div
                                            className="selected-fare-trip"
                                            key={tripIndex}
                                        >

                                            {/* ROUTE */}

                                            <div className="selected-fare-route">

                                                <div className="fare-airline-mini">

                                                    <div className="fare-airline-logo">
                                                        {airline?.code
                                                            ?.slice(0, 2) ||
                                                            '✈'}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {airline?.name ||
                                                                'Airline'}
                                                        </strong>

                                                        <span>
                                                            {isRoundTrip
                                                                ? tripIndex === 0
                                                                    ? 'Onward'
                                                                    : 'Return'
                                                                : isMultiCity
                                                                    ? `Sector ${tripIndex + 1
                                                                    }`
                                                                    : 'Onward'}
                                                        </span>

                                                    </div>

                                                </div>

                                                <div className="fare-route-main">

                                                    <strong>
                                                        {route.from}
                                                    </strong>

                                                    <span>→</span>

                                                    <strong>
                                                        {route.to}
                                                    </strong>

                                                    <em>
                                                        {fareName}
                                                    </em>

                                                </div>

                                                <div className="fare-date">
                                                    {formatDate(
                                                        route.date
                                                    )}
                                                </div>

                                            </div>

                                            {/* FEATURES */}

                                            <div className="fare-features">

                                                <div className="fare-feature">

                                                    <span className="fare-feature-icon">
                                                        ↻
                                                    </span>

                                                    <div>
                                                        <small>
                                                            Date change
                                                        </small>

                                                        <strong>
                                                            {highlights.dateChange}
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="fare-feature">

                                                    <span className="fare-feature-icon">
                                                        ↩
                                                    </span>

                                                    <div>
                                                        <small>
                                                            Cancellation
                                                        </small>

                                                        <strong>
                                                            {highlights.cancellation}
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="fare-feature">

                                                    <span className="fare-feature-icon">
                                                        ▣
                                                    </span>

                                                    <div>
                                                        <small>
                                                            Cabin baggage
                                                        </small>

                                                        <strong>
                                                            {highlights.cabin}
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="fare-feature">

                                                    <span className="fare-feature-icon">
                                                        ▤
                                                    </span>

                                                    <div>
                                                        <small>
                                                            Check-in baggage
                                                        </small>

                                                        <strong>
                                                            {highlights.checkIn}
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="fare-feature">

                                                    <span className="fare-feature-icon">
                                                        ♧
                                                    </span>

                                                    <div>
                                                        <small>
                                                            Meal
                                                        </small>

                                                        <strong>
                                                            {highlights.meal}
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="fare-feature">

                                                    <span className="fare-feature-icon">
                                                        ◫
                                                    </span>

                                                    <div>
                                                        <small>
                                                            Seat
                                                        </small>

                                                        <strong>
                                                            {highlights.seat}
                                                        </strong>
                                                    </div>

                                                </div>

                                            </div>

                                            {/* POLICY ACCORDIONS */}

                                            <div className="fare-policy-list">

                                                {/* CANCELLATION */}

                                                <details className="fare-policy">

                                                    <summary>

                                                        <span>
                                                            Cancellation policy
                                                        </span>

                                                        <b>
                                                            ›
                                                        </b>

                                                    </summary>

                                                    <div className="fare-policy-content">

                                                        {(() => {

                                                            const rules =
                                                                getFareRules(
                                                                    trip
                                                                );

                                                            const cancellation =
                                                                rules?.CANCELLATION ||
                                                                [];

                                                            if (
                                                                !cancellation.length
                                                            ) {
                                                                return (
                                                                    <p>
                                                                        Cancellation
                                                                        policy is
                                                                        subject to the
                                                                        selected fare.
                                                                    </p>
                                                                );
                                                            }

                                                            return cancellation.map(
                                                                (
                                                                    rule,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        className="policy-row"
                                                                        key={index}
                                                                    >

                                                                        <div>
                                                                            <strong>
                                                                                {
                                                                                    rule?.policyInfo ||
                                                                                    'Cancellation charges apply.'
                                                                                }
                                                                            </strong>
                                                                        </div>

                                                                        {(rule?.amount !=
                                                                            null ||
                                                                            rule?.additionalFee !=
                                                                            null) && (
                                                                                <div className="policy-price">

                                                                                    {rule?.amount !=
                                                                                        null && (
                                                                                            <span>
                                                                                                Charge{' '}
                                                                                                <b>
                                                                                                    {money(
                                                                                                        rule.amount
                                                                                                    )}
                                                                                                </b>
                                                                                            </span>
                                                                                        )}

                                                                                    {rule?.additionalFee !=
                                                                                        null &&
                                                                                        Number(
                                                                                            rule.additionalFee
                                                                                        ) >
                                                                                        0 && (
                                                                                            <span>
                                                                                                Additional{' '}
                                                                                                <b>
                                                                                                    {money(
                                                                                                        rule.additionalFee
                                                                                                    )}
                                                                                                </b>
                                                                                            </span>
                                                                                        )}

                                                                                </div>
                                                                            )}

                                                                    </div>
                                                                )
                                                            );

                                                        })()}

                                                    </div>

                                                </details>

                                                {/* DATE CHANGE */}

                                                <details className="fare-policy">

                                                    <summary>

                                                        <span>
                                                            Date change policy
                                                        </span>

                                                        <b>
                                                            ›
                                                        </b>

                                                    </summary>

                                                    <div className="fare-policy-content">

                                                        {(() => {

                                                            const rules =
                                                                getFareRules(
                                                                    trip
                                                                );

                                                            const dateChange =
                                                                rules?.DATECHANGE ||
                                                                [];

                                                            if (
                                                                !dateChange.length
                                                            ) {
                                                                return (
                                                                    <p>
                                                                        Date change
                                                                        policy is
                                                                        subject to the
                                                                        selected fare.
                                                                    </p>
                                                                );
                                                            }

                                                            return dateChange.map(
                                                                (
                                                                    rule,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        className="policy-row"
                                                                        key={index}
                                                                    >

                                                                        <div>
                                                                            <strong>
                                                                                {
                                                                                    rule?.policyInfo ||
                                                                                    'Date change charges apply.'
                                                                                }
                                                                            </strong>
                                                                        </div>

                                                                        {(rule?.amount !=
                                                                            null ||
                                                                            rule?.additionalFee !=
                                                                            null) && (
                                                                                <div className="policy-price">

                                                                                    {rule?.amount !=
                                                                                        null && (
                                                                                            <span>
                                                                                                Charge{' '}
                                                                                                <b>
                                                                                                    {money(
                                                                                                        rule.amount
                                                                                                    )}
                                                                                                </b>
                                                                                            </span>
                                                                                        )}

                                                                                    {rule?.additionalFee !=
                                                                                        null &&
                                                                                        Number(
                                                                                            rule.additionalFee
                                                                                        ) >
                                                                                        0 && (
                                                                                            <span>
                                                                                                Additional{' '}
                                                                                                <b>
                                                                                                    {money(
                                                                                                        rule.additionalFee
                                                                                                    )}
                                                                                                </b>
                                                                                            </span>
                                                                                        )}

                                                                                </div>
                                                                            )}

                                                                    </div>
                                                                )
                                                            );

                                                        })()}

                                                    </div>

                                                </details>

                                                {/* NO SHOW */}

                                                {getRule(
                                                    trip,
                                                    'NO_SHOW'
                                                ) && (
                                                        <details className="fare-policy">

                                                            <summary>

                                                                <span>
                                                                    No-show policy
                                                                </span>

                                                                <b>
                                                                    ›
                                                                </b>

                                                            </summary>

                                                            <div className="fare-policy-content">

                                                                <p>
                                                                    {getRule(
                                                                        trip,
                                                                        'NO_SHOW'
                                                                    )?.policyInfo ||
                                                                        'No-show charges may apply.'}
                                                                </p>

                                                            </div>

                                                        </details>
                                                    )}

                                            </div>

                                        </div>
                                    );
                                })}

                            </section>

                        </section>

                        {/* =================================
                            RIGHT SIDEBAR
                        ================================= */}

                        <aside className="review-sidebar">

                            {/* PRICE */}

                            <section className="price-card">

                                <div className="price-heading">

                                    <div>
                                        <span className="section-kicker">
                                            TOTAL FARE
                                        </span>

                                        <h3>
                                            Price summary
                                        </h3>
                                    </div>

                                    <span className="price-lock">
                                        🔒
                                    </span>

                                </div>

                                <div className="price-passenger">
                                    For{' '}
                                    {totalPassengers}{' '}
                                    passenger
                                    {totalPassengers >
                                        1
                                        ? 's'
                                        : ''}
                                </div>

                                <div className="price-breakup">

                                    <div>
                                        <span>
                                            Base fare
                                        </span>

                                        <strong>
                                            {money(
                                                fareDetail
                                                    ?.BF
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Taxes & fees
                                        </span>

                                        <strong>
                                            {money(
                                                fareDetail
                                                    ?.TAF
                                            )}
                                        </strong>
                                    </div>

                                    {fareDetail?.TF &&
                                        Number(
                                            fareDetail.TF
                                        ) !==
                                        totalFare && (
                                            <div>
                                                <span>
                                                    Fare
                                                    adjustment
                                                </span>

                                                <strong>
                                                    {money(
                                                        Number(
                                                            fareDetail.TF
                                                        ) -
                                                        Number(
                                                            fareDetail.BF ||
                                                            0
                                                        ) -
                                                        Number(
                                                            fareDetail.TAF ||
                                                            0
                                                        )
                                                    )}
                                                </strong>
                                            </div>
                                        )}

                                </div>

                                <button
                                    type="button"
                                    className="breakup-toggle"
                                    onClick={() =>
                                        setShowFareBreakup(
                                            !showFareBreakup
                                        )
                                    }
                                >
                                    <span>
                                        View fare breakup
                                    </span>

                                    <span>
                                        {showFareBreakup
                                            ? '⌃'
                                            : '⌄'}
                                    </span>
                                </button>

                                {showFareBreakup && (
                                    <div className="fare-breakup-detail">

                                        {Object.entries(
                                            fareDetail
                                        ).map(
                                            (
                                                [
                                                    key,
                                                    value,
                                                ]
                                            ) => (
                                                <div
                                                    key={
                                                        key
                                                    }
                                                >
                                                    <span>
                                                        {
                                                            key
                                                        }
                                                    </span>

                                                    <strong>
                                                        {typeof value ===
                                                            'number'
                                                            ? money(
                                                                value
                                                            )
                                                            : String(
                                                                value
                                                            )}
                                                    </strong>
                                                </div>
                                            )
                                        )}

                                    </div>
                                )}

                                <div className="total-row">

                                    <div>
                                        <span>
                                            Total amount
                                        </span>

                                        <small>
                                            Inclusive of
                                            applicable
                                            taxes
                                        </small>
                                    </div>

                                    <strong>
                                        {money(
                                            totalFare
                                        )}
                                    </strong>

                                </div>

                                <button
                                    type="button"
                                    className="continue-btn"
                                    onClick={
                                        handleContinue
                                    }
                                >
                                    Continue to passenger
                                    details

                                    <span>
                                        →
                                    </span>
                                </button>

                                <div className="trust-row">

                                    <span>
                                        🔒
                                    </span>

                                    <p>
                                        Your fare was
                                        verified against
                                        the latest
                                        TripJack response.
                                    </p>

                                </div>

                            </section>

                            {/* =================================
                                SEARCH SUMMARY
                            ================================= */}

                            <section className="summary-card">

                                <div className="summary-heading">

                                    <span className="section-kicker">
                                        SEARCH
                                    </span>

                                    <h3>
                                        Trip summary
                                    </h3>

                                </div>

                                {routeInfos.length >
                                    0
                                    ? routeInfos.map(
                                        (
                                            route,
                                            index
                                        ) => (
                                            <div
                                                className="search-route"
                                                key={
                                                    index
                                                }
                                            >

                                                <div>
                                                    <strong>
                                                        {
                                                            route
                                                                ?.fromCityOrAirport
                                                                ?.code
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            route
                                                                ?.fromCityOrAirport
                                                                ?.city
                                                        }
                                                    </span>
                                                </div>

                                                <div className="route-arrow">
                                                    →
                                                </div>

                                                <div>
                                                    <strong>
                                                        {
                                                            route
                                                                ?.toCityOrAirport
                                                                ?.code
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            route
                                                                ?.toCityOrAirport
                                                                ?.city
                                                        }
                                                    </span>
                                                </div>

                                            </div>
                                        )
                                    )
                                    : trips.map(
                                        (
                                            trip,
                                            index
                                        ) => {

                                            const route =
                                                getRouteFromTrip(
                                                    trip
                                                );

                                            return (
                                                <div
                                                    className="search-route"
                                                    key={
                                                        index
                                                    }
                                                >

                                                    <div>
                                                        <strong>
                                                            {
                                                                route.from
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                route.fromCity
                                                            }
                                                        </span>
                                                    </div>

                                                    <div className="route-arrow">
                                                        →
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                route.to
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                route.toCity
                                                            }
                                                        </span>
                                                    </div>

                                                </div>
                                            );
                                        }
                                    )}

                                <div className="summary-bottom">

                                    <span>
                                        Cabin
                                    </span>

                                    <strong>
                                        {searchQuery?.cabinClass ||
                                            'ECONOMY'}
                                    </strong>

                                </div>

                                <div className="summary-bottom">

                                    <span>
                                        Passengers
                                    </span>

                                    <strong>
                                        {totalPassengers}
                                    </strong>

                                </div>

                                {getBookingId(
                                    review
                                ) && (
                                        <div className="booking-ref">

                                            <span>
                                                Review reference
                                            </span>

                                            <strong>
                                                {
                                                    getBookingId(
                                                        review
                                                    )
                                                }
                                            </strong>

                                        </div>
                                    )}

                            </section>

                        </aside>

                    </div>

                    {/* =====================================
                        MOBILE CTA
                    ===================================== */}

                    <div className="mobile-continue">

                        <div>

                            <span>
                                Total
                            </span>

                            <strong>
                                {money(totalFare)}
                            </strong>

                        </div>

                        <button
                            type="button"
                            onClick={handleContinue}
                        >
                            Continue
                            <span>
                                →
                            </span>
                        </button>

                    </div>

                </div>

            </main>
        </>
    );
}