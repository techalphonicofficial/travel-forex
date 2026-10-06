'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import './results.css';
import flightService from '@/app/services/flightBookingService';

/* =========================================================
   HELPERS
========================================================= */

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
        day: '2-digit',
        month: 'short',
        year: '2-digit',
    });
};

const formatDuration = (minutes = 0) => {
    const totalMinutes = Number(minutes) || 0;

    const hrs = Math.floor(
        totalMinutes / 60
    );

    const mins =
        totalMinutes % 60;

    if (!hrs) {
        return `${mins}m`;
    }

    if (!mins) {
        return `${hrs}h`;
    }

    return `${hrs}h ${mins}m`;
};

const getTripInfos = (response) => {
    return (
        response?.searchResult
            ?.tripInfos ||
        response?.data?.searchResult
            ?.tripInfos ||
        {}
    );
};

const getSegments = (flight) => {
    return Array.isArray(
        flight?.sI
    )
        ? flight.sI
        : [];
};

const getFirstSegment = (flight) => {
    return getSegments(flight)?.[0];
};

const getLastSegment = (flight) => {
    const segments =
        getSegments(flight);

    return segments[
        segments.length - 1
    ];
};

const getFlightFare = (flight) => {
    return (
        flight?.totalPriceList?.[0] ||
        flight?.priceList?.[0] ||
        null
    );
};

const getFlightPrice = (flight) => {
    const fare =
        getFlightFare(flight);

    return (
        fare?.fd?.ADULT?.fC?.TF ||
        fare?.fd?.ADULT?.fC?.NF ||
        0
    );
};

const getFlightRoute = (
    flight,
    routeInfo
) => {
    const first =
        getFirstSegment(flight);

    const last =
        getLastSegment(flight);

    return {
        from:
            routeInfo
                ?.fromCityOrAirport
                ?.code ||
            first?.da?.code ||
            '--',

        to:
            routeInfo
                ?.toCityOrAirport
                ?.code ||
            last?.aa?.code ||
            '--',

        fromCity:
            first?.da?.city ||
            first?.da?.name ||
            '',

        toCity:
            last?.aa?.city ||
            last?.aa?.name ||
            '',
    };
};

const getFlightDuration = (
    flight
) => {
    const segments =
        getSegments(flight);

    /*
     * For a connecting flight,
     * sum all segment durations.
     */
    const total =
        segments.reduce(
            (sum, segment) =>
                sum +
                Number(
                    segment?.duration ||
                    0
                ),
            0
        );

    /*
     * If API gives only one segment,
     * this still works.
     */
    return total;
};

const getFlightStops = (
    flight
) => {
    const segments =
        getSegments(flight);

    if (!segments.length) {
        return 0;
    }

    /*
     * Number of connections.
     */
    return Math.max(
        0,
        segments.length - 1
    );
};

const getFlightNumbers = (
    flight
) => {
    return getSegments(flight)
        .map((segment) => {
            const airlineCode =
                segment
                    ?.fD
                    ?.aI
                    ?.code;

            const flightNumber =
                segment
                    ?.fD
                    ?.fN;

            if (
                !airlineCode ||
                !flightNumber
            ) {
                return null;
            }

            return `${airlineCode} ${flightNumber}`;
        })
        .filter(Boolean);
};

const getFlightUniqueId = (
    flight
) => {
    const fare =
        getFlightFare(flight);

    const first =
        getFirstSegment(flight);

    return (
        fare?.id ||
        [
            first?.fD?.aI?.code,
            first?.fD?.fN,
            first?.da?.code,
            first?.aa?.code,
            first?.dt,
        ]
            .filter(Boolean)
            .join('_')
    );
};

const getAirline = (
    flight
) => {
    return (
        getFirstSegment(flight)
            ?.fD?.aI || {}
    );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function FlightResultsPage() {
    const router = useRouter();

    const [
        searchData,
        setSearchData,
    ] = useState(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        unavailableFlights,
        setUnavailableFlights,
    ] = useState(() => {
        if (
            typeof window ===
            'undefined'
        ) {
            return [];
        }

        try {
            const stored =
                sessionStorage.getItem(
                    'tripjack_unavailable_flights'
                );

            return stored
                ? JSON.parse(stored)
                : [];
        } catch (error) {
            console.error(
                'Unable to load unavailable flights:',
                error
            );

            return [];
        }
    });

    const [
        checkingFlightId,
        setCheckingFlightId,
    ] = useState(null);

    /*
     * Selected flight per sector.
     *
     * Example:
     *
     * {
     *   ONWARD: {...},
     *   RETURN: {...}
     * }
     *
     * Multi-city:
     *
     * {
     *   "0": {...},
     *   "1": {...},
     *   "2": {...}
     * }
     */
    const [
        selectedFlights,
        setSelectedFlights,
    ] = useState({});

    /*
     * Flight details expanded state.
     */
    const [
        expandedFlight,
        setExpandedFlight,
    ] = useState(null);

    /*
     * Only one sector is shown at a time for ROUND_TRIP / MULTI_CITY.
     * The user can switch back to any already-selected sector from the
     * sector stepper, while the next sector is unlocked only after the
     * current sector has been selected.
     */
    const [activeLegKey, setActiveLegKey] = useState(null);

    /* =========================================================
       LOAD SEARCH DATA
    ========================================================= */

    useEffect(() => {
        try {
            const stored =
                sessionStorage.getItem(
                    'tripjack_flight_search'
                );

            if (!stored) {
                router.replace(
                    '/flights'
                );

                return;
            }

            const parsed =
                JSON.parse(stored);

            setSearchData(parsed);
        } catch (error) {
            console.error(
                'Unable to load flight search:',
                error
            );

            router.replace(
                '/flights'
            );
        } finally {
            setLoading(false);
        }
    }, [router]);

    /* =========================================================
       SEARCH / REQUEST DATA
    ========================================================= */

    const search =
        searchData?.search;

    const tripType =
        searchData?.tripType ||
        'ONE_WAY';

    const tripInfos =
        useMemo(
            () =>
                getTripInfos(
                    searchData?.response
                ),
            [searchData]
        );

    const routeInfos =
        searchData
            ?.request
            ?.searchQuery
            ?.routeInfos || [];

    /* =========================================================
       BUILD SECTORS
    ========================================================= */

    const flightLegs =
        useMemo(() => {
            /*
             * ================================================
             * ROUND TRIP
             * ================================================
             */

            if (
                tripType ===
                'ROUND_TRIP'
            ) {
                const onward =
                    Array.isArray(
                        tripInfos?.ONWARD
                    )
                        ? tripInfos.ONWARD
                        : [];

                const returnFlights =
                    Array.isArray(
                        tripInfos?.RETURN
                    )
                        ? tripInfos.RETURN
                        : [];

                return [
                    {
                        key: 'ONWARD',

                        title:
                            'Onward Flight',

                        route:
                            routeInfos?.[0] ||
                            null,

                        flights:
                            onward,
                    },

                    {
                        key: 'RETURN',

                        title:
                            'Return Flight',

                        route:
                            routeInfos?.[1] ||
                            null,

                        flights:
                            returnFlights,
                    },
                ].filter(
                    (leg) =>
                        leg.flights
                            .length > 0
                );
            }

            /*
             * ================================================
             * MULTI CITY
             * ================================================
             */

            if (
                tripType ===
                'MULTI_CITY'
            ) {
                const numericKeys =
                    Object.keys(
                        tripInfos
                    )
                        .filter(
                            (key) =>
                                /^\d+$/.test(
                                    key
                                )
                        )
                        .sort(
                            (a, b) =>
                                Number(a) -
                                Number(b)
                        );

                return numericKeys.map(
                    (
                        key,
                        index
                    ) => ({
                        key,

                        title:
                            `Flight ${index + 1
                            }`,

                        route:
                            routeInfos?.[
                            index
                            ] || null,

                        flights:
                            Array.isArray(
                                tripInfos[
                                key
                                ]
                            )
                                ? tripInfos[
                                key
                                ]
                                : [],
                    })
                );
            }

            /*
             * ================================================
             * ONE WAY
             * ================================================
             */

            let flights = [];

            if (
                Array.isArray(
                    tripInfos?.ONWARD
                )
            ) {
                flights =
                    tripInfos.ONWARD;
            } else {
                const numericKey =
                    Object.keys(
                        tripInfos
                    ).find((key) =>
                        /^\d+$/.test(
                            key
                        )
                    );

                flights =
                    numericKey &&
                        Array.isArray(
                            tripInfos[
                            numericKey
                            ]
                        )
                        ? tripInfos[
                        numericKey
                        ]
                        : [];
            }

            return [
                {
                    key: 'ONWARD',

                    title:
                        'Flight',

                    route:
                        routeInfos?.[0] ||
                        null,

                    flights,
                },
            ];
        }, [
            tripInfos,
            tripType,
            routeInfos,
        ]);

    /* =========================================================
       ACTIVE SECTOR / STEP-BY-STEP FLOW
    ========================================================= */

    useEffect(() => {
        if (!flightLegs.length) {
            setActiveLegKey(null);
            return;
        }

        setActiveLegKey((currentKey) => {
            const currentIndex = flightLegs.findIndex(
                (leg) => leg.key === currentKey
            );

            // Keep the user's current sector if it still exists.
            if (currentIndex >= 0) {
                return currentKey;
            }

            // On first load, always start from the first sector.
            return flightLegs[0].key;
        });
    }, [flightLegs]);

    const activeLegIndex = Math.max(
        0,
        flightLegs.findIndex((leg) => leg.key === activeLegKey)
    );

    const activeLeg =
        flightLegs[activeLegIndex] || flightLegs[0] || null;

    const visibleFlightLegs =
        flightLegs.length <= 1
            ? flightLegs
            : activeLeg
                ? [activeLeg]
                : flightLegs.slice(0, 1);

    const firstUnselectedLegIndex = flightLegs.findIndex(
        (leg) => !selectedFlights[leg.key]
    );

    const canOpenLeg = (legIndex) => {
        if (legIndex === activeLegIndex) return true;

        // Already-selected sectors are always clickable so the user can
        // switch back and review/change them.
        if (selectedFlights[flightLegs[legIndex]?.key]) return true;

        // Only the immediate next unselected sector is unlocked.
        return (
            legIndex === firstUnselectedLegIndex &&
            legIndex <= activeLegIndex + 1
        );
    };

    const openLeg = (legIndex) => {
        const leg = flightLegs[legIndex];
        if (!leg || !canOpenLeg(legIndex)) return;

        setActiveLegKey(leg.key);
        setExpandedFlight(null);
    };

    /* =========================================================
       TOTAL OPTIONS
    ========================================================= */

    const totalFlights =
        flightLegs.reduce(
            (total, leg) =>
                total +
                leg.flights.length,
            0
        );

    /*
     * All sectors selected?
     */
    const allLegsSelected =
        flightLegs.length > 0 &&
        flightLegs.every(
            (leg) =>
                Boolean(
                    selectedFlights[
                    leg.key
                    ]
                )
        );

    const reviewLoading = checkingFlightId === 'REVIEW';

    /* =========================================================
       MARK UNAVAILABLE
    ========================================================= */

    const markFlightUnavailable = (
        flight
    ) => {
        const flightId =
            getFlightUniqueId(
                flight
            );

        if (!flightId) {
            return;
        }

        setUnavailableFlights(
            (prev) => {
                if (
                    prev.includes(
                        flightId
                    )
                ) {
                    return prev;
                }

                const updated = [
                    ...prev,
                    flightId,
                ];

                try {
                    sessionStorage.setItem(
                        'tripjack_unavailable_flights',
                        JSON.stringify(
                            updated
                        )
                    );
                } catch (error) {
                    console.error(
                        'Unable to save unavailable flights:',
                        error
                    );
                }

                return updated;
            }
        );
    };

    /* =========================================================
       SELECT FLIGHT

       Selection only stores the fare locally.
       Review is called once after every sector is selected.
    ========================================================= */

    const selectFlight = (flight, leg) => {
        const flightId = getFlightUniqueId(flight);

        if (flightId && unavailableFlights.includes(flightId)) {
            toast.error('Flight no longer available. Please choose another flight.', { duration: 4000 });
            return;
        }

        const selectedFare = getFlightFare(flight);
        const fareId = selectedFare?.id;

        if (!fareId) {
            markFlightUnavailable(flight);
            toast.error('Flight fare is no longer available. Please choose another flight.', { duration: 4000 });
            return;
        }

        setSelectedFlights((prev) => ({
            ...prev,
            [leg.key]: {
                flight,
                fare: selectedFare,
                flightId,
                fareId,
                legKey: leg.key,
                route: leg.route,
            },
        }));

        // After selecting the current sector, automatically move to the
        // next sector. This is the key UX for round-trip / multi-city.
        const currentIndex = flightLegs.findIndex(
            (item) => item.key === leg.key
        );
        const nextLeg = flightLegs[currentIndex + 1];

        if (nextLeg) {
            setActiveLegKey(nextLeg.key);
            setExpandedFlight(null);
        }

        const route = getFlightRoute(flight, leg.route);
        toast.success(
            `${leg.route?.fromCityOrAirport?.code || route.from} → ${leg.route?.toCityOrAirport?.code || route.to} selected`,
            { duration: 1800 }
        );
    };

    /* =========================================================
       CONTINUE -> REVIEW

       TripJack expects ONE PriceId per requested sector:
       ONE_WAY    => [onwardPriceId]
       ROUND_TRIP => [onwardPriceId, returnPriceId]
       MULTI_CITY => [sector1PriceId, sector2PriceId, ...]

       The order is exactly the order of flightLegs.
    ========================================================= */

    const continueToReview = async () => {
        if (!allLegsSelected) {
            toast.error('Please select a flight for every sector before continuing.');
            return;
        }

        const selections = flightLegs.map((leg) => ({
            legKey: leg.key,
            title: leg.title,
            route: leg.route,
            ...selectedFlights[leg.key],
        }));

        const priceIds = selections.map((selection) => selection?.fareId).filter(Boolean);

        if (priceIds.length !== flightLegs.length) {
            toast.error('Please select a valid fare for every flight sector before continuing.', { duration: 4500 });
            return;
        }

        if (new Set(priceIds).size !== priceIds.length) {
            toast.error('The selected flight fares are invalid. Please choose again.', { duration: 4500 });
            return;
        }

        const reviewPayload = { priceIds };

        try {
            setCheckingFlightId('REVIEW');


            const reviewResponse = await flightService.review(reviewPayload);

            const reviewSuccess =
                reviewResponse?.success === true ||
                reviewResponse?.status?.success === true;

            if (!reviewSuccess) {
                const reviewMessage =
                    reviewResponse?.message ||
                    reviewResponse?.error?.errors?.[0]?.message ||
                    reviewResponse?.error?.message ||
                    'Selected flight fare is no longer available. Please choose another flight.';

                toast.error(reviewMessage, { duration: 5000 });
                return;
            }

            const selectedBookingData = {
                version: 2,
                tripType,
                search,
                request: searchData?.request || null,
                selections,
                priceIds,
                review: reviewResponse,
                reviewedAt: new Date().toISOString(),
            };

            try {
                sessionStorage.setItem(
                    'tripjack_selected_flight',
                    JSON.stringify(selectedBookingData)
                );
            } catch (storageError) {
                console.error('Unable to save reviewed flight:', storageError);
                toast.error('Unable to continue. Please try again.', { duration: 4500 });
                return;
            }

            toast.success('Flight fare verified successfully.', { duration: 1800 });
            router.push('/flights/review');
        } catch (error) {
            console.error('Flight Review Exception:', error);

            const errorMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error?.errors?.[0]?.message ||
                error?.response?.data?.error?.message ||
                error?.message ||
                'Unable to verify flight fare. Please choose another flight.';

            toast.error(errorMessage, { duration: 5000 });
        } finally {
            setCheckingFlightId(null);
        }
    };

    /* =========================================================
       MODIFY SEARCH
    ========================================================= */

    const modifySearch =
        () => {
            router.push(
                '/flights'
            );
        };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3500,

                        style: {
                            fontSize:
                                '14px',

                            borderRadius:
                                '10px',
                        },
                    }}
                />

                <main
                    className="flight-results-page"
                >
                    <div className="results-container">
                        <div className="loading-box">
                            Loading flights...
                        </div>
                    </div>
                </main>
            </>
        );
    }

    /* =========================================================
       EMPTY
    ========================================================= */

    if (
        !searchData ||
        flightLegs.length ===
        0
    ) {
        return (
            <>
                <Toaster
                    position="top-right"
                />

                <main
                    className="flight-results-page"
                >
                    <div className="results-container">
                        <div
                            className="loading-box"
                            style={{
                                padding:
                                    '50px 20px',
                            }}
                        >
                            No flights found.

                            <div
                                style={{
                                    marginTop:
                                        '18px',
                                }}
                            >
                                <button
                                    type="button"
                                    className="modify-btn"
                                    onClick={
                                        modifySearch
                                    }
                                >
                                    MODIFY SEARCH
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    /* =========================================================
       HEADER ROUTE
    ========================================================= */

    const firstLeg =
        flightLegs?.[0];

    const lastLeg =
        flightLegs?.[
        flightLegs.length -
        1
        ];

    const firstRoute =
        firstLeg
            ? getFlightRoute(
                firstLeg.flights?.[0],
                firstLeg.route
            )
            : {};

    const lastRoute =
        lastLeg
            ? getFlightRoute(
                lastLeg.flights?.[0],
                lastLeg.route
            )
            : {};

    /*
     * Header title:
     *
     * One way:
     * Flights from DEL to BOM
     *
     * Round:
     * Flights from DEL to BOM
     *
     * Multi:
     * Multi-city flights
     */
    const pageTitle =
        tripType ===
            'MULTI_CITY'
            ? 'Multi-city flights'
            : `Flights from ${firstRoute.from ||
            search?.fromCode ||
            'Departure'
            } to ${lastRoute.to ||
            search?.toCode ||
            'Destination'
            }`;

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3500,

                    style: {
                        fontSize:
                            '14px',

                        borderRadius:
                            '10px',
                    },
                }}
            />

            <main
                className="flight-results-page"
                style={{
                    paddingBottom:
                        allLegsSelected
                            ? '150px'
                            : '30px',
                }}
            >

                {/* =================================================
                    TOP SEARCH SUMMARY
                ================================================= */}

                <div className="top-search-area">

                    <div className="results-container">

                        <div
                            className="search-summary"
                            style={{
                                display:
                                    'flex',

                                alignItems:
                                    'center',

                                gap:
                                    '12px',

                                flexWrap:
                                    'wrap',
                            }}
                        >

                            {/* ROUTE */}

                            <div
                                className="search-box"
                            >
                                <small>
                                    ROUTE
                                </small>

                                <strong>
                                    {firstRoute.from ||
                                        search?.fromCode ||
                                        '--'}

                                    {' → '}

                                    {lastRoute.to ||
                                        search?.toCode ||
                                        '--'}
                                </strong>

                                <span>
                                    {tripType ===
                                        'ROUND_TRIP'
                                        ? 'Round Trip'
                                        : tripType ===
                                            'MULTI_CITY'
                                            ? 'Multi City'
                                            : 'One Way'}
                                </span>
                            </div>

                            {/* DATE */}

                            <div
                                className="search-box"
                            >
                                <small>
                                    DEPART
                                </small>

                                <strong>
                                    {search?.departureDate ||
                                        routeInfos?.[0]
                                            ?.travelDate ||
                                        '--'}
                                </strong>

                                <span>
                                    {tripType ===
                                        'ROUND_TRIP' &&
                                        search?.returnDate
                                        ? `Return: ${search.returnDate}`
                                        : 'Travel Date'}
                                </span>
                            </div>

                            {/* TRAVELLERS */}

                            <div
                                className="search-box travellers"
                            >
                                <small>
                                    TRAVELLERS
                                </small>

                                <strong>
                                    {search?.adults ||
                                        1}{' '}
                                    Adult
                                    {(Number(
                                        search?.children
                                    ) || 0) >
                                        0 &&
                                        `, ${search.children} Child`}
                                </strong>

                                <span>
                                    {search?.cabinClass ||
                                        'ECONOMY'}
                                </span>
                            </div>

                            {/* MODIFY */}

                            <button
                                type="button"
                                className="modify-btn"
                                onClick={
                                    modifySearch
                                }
                            >
                                MODIFY SEARCH
                            </button>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    MAIN
                ================================================= */}

                <div
                    className="results-container"
                    style={{
                        marginTop:
                            '20px',
                    }}
                >

                    <section
                        className="results-content"
                    >

                        {/* =================================================
                            PAGE TITLE
                        ================================================= */}

                        <div
                            className="results-title-row"
                        >

                            <div>

                                <h1>
                                    {pageTitle}
                                </h1>

                                <p
                                    style={{
                                        marginTop: '5px',
                                    }}
                                >
                                    {flightLegs.length === 1
                                        ? `${totalFlights} flight options`
                                        : `${flightLegs.length} sectors • ${totalFlights} total flight options`}
                                </p>

                                {flightLegs.length > 1 && activeLeg && (
                                    <div
                                        style={{
                                            marginTop: '10px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '7px',
                                            padding: '7px 11px',
                                            borderRadius: '999px',
                                            background: '#eff6ff',
                                            color: '#1d4ed8',
                                            fontSize: '12px',
                                            fontWeight: 800,
                                        }}
                                    >
                                        {selectedFlights[activeLeg.key] ? '✓ Selected' : 'SELECT NOW'}
                                        {' • '}
                                        {activeLeg.route?.fromCityOrAirport?.code || getFlightRoute(activeLeg.flights?.[0], activeLeg.route).from}
                                        {' → '}
                                        {activeLeg.route?.toCityOrAirport?.code || getFlightRoute(activeLeg.flights?.[0], activeLeg.route).to}
                                    </div>
                                )}

                            </div>

                        </div>

                        {/* =================================================
                            SECTOR PROGRESS
                        ================================================= */}

                        {flightLegs.length > 1 && (
                            <div
                                style={{
                                    marginBottom: '20px',
                                    padding: '10px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '14px',
                                    background: '#ffffff',
                                    boxShadow: '0 3px 14px rgba(15,23,42,0.04)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        overflowX: 'auto',
                                        paddingBottom: '2px',
                                    }}
                                >
                                    {flightLegs.map((leg, index) => {
                                        const selected = Boolean(selectedFlights[leg.key]);
                                        const active = leg.key === activeLegKey;
                                        const clickable = canOpenLeg(index);
                                        const routeDisplay = getFlightRoute(
                                            leg.flights?.[0],
                                            leg.route
                                        );

                                        return (
                                            <button
                                                key={leg.key}
                                                type="button"
                                                disabled={!clickable}
                                                onClick={() => openLeg(index)}
                                                style={{
                                                    flex: '0 0 auto',
                                                    minWidth: '170px',
                                                    border: active
                                                        ? '2px solid #2196f3'
                                                        : selected
                                                            ? '1px solid #86efac'
                                                            : '1px solid #e2e8f0',
                                                    background: active
                                                        ? '#eff6ff'
                                                        : selected
                                                            ? '#f0fdf4'
                                                            : '#f8fafc',
                                                    color: active
                                                        ? '#075985'
                                                        : selected
                                                            ? '#166534'
                                                            : '#64748b',
                                                    borderRadius: '11px',
                                                    padding: '9px 12px',
                                                    textAlign: 'left',
                                                    cursor: clickable ? 'pointer' : 'not-allowed',
                                                    opacity: clickable ? 1 : 0.55,
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '8px',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: '11px',
                                                            fontWeight: 800,
                                                            textTransform: 'uppercase',
                                                        }}
                                                    >
                                                        {tripType === 'ROUND_TRIP'
                                                            ? index === 0
                                                                ? 'ONWARD'
                                                                : 'RETURN'
                                                            : `SECTOR ${index + 1}`}
                                                    </span>

                                                    <span style={{ fontSize: '12px', fontWeight: 800 }}>
                                                        {selected ? '✓' : active ? '●' : '○'}
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        marginTop: '3px',
                                                        fontSize: '15px',
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    {leg.route?.fromCityOrAirport?.code || routeDisplay.from}
                                                    {' → '}
                                                    {leg.route?.toCityOrAirport?.code || routeDisplay.to}
                                                </div>

                                                <div
                                                    style={{
                                                        marginTop: '2px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: active ? '#3b82f6' : '#94a3b8',
                                                    }}
                                                >
                                                    {active
                                                        ? selected
                                                            ? 'Selected • You can change it'
                                                            : 'Select this sector'
                                                        : selected
                                                            ? 'Selected • Click to change'
                                                            : 'Locked until previous sector'}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {activeLeg && (
                                    <div
                                        style={{
                                            marginTop: '10px',
                                            padding: '9px 12px',
                                            borderRadius: '9px',
                                            background: '#f8fafc',
                                            color: '#475569',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {selectedFlights[activeLeg.key]
                                            ? 'Selected sector — you can change this flight anytime.'
                                            : tripType === 'ROUND_TRIP'
                                                ? activeLegIndex === 0
                                                    ? 'Step 1 of 2 • Select your onward flight first.'
                                                    : 'Step 2 of 2 • Now select your return flight.'
                                                : `Step ${activeLegIndex + 1} of ${flightLegs.length} • Select this flight to unlock the next sector.`}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =================================================
                            SECTOR LIST
                        ================================================= */}

                        <div
                            className="flight-sectors"
                        >

                            {visibleFlightLegs.map(
                                (
                                    leg
                                ) => {
                                    const legIndex = flightLegs.findIndex(
                                        (item) => item.key === leg.key
                                    );
                                    const selected =
                                        selectedFlights[
                                        leg.key
                                        ];

                                    const route =
                                        leg.route;

                                    const routeDisplay =
                                        getFlightRoute(
                                            leg.flights?.[0],
                                            route
                                        );

                                    return (
                                        <section
                                            key={
                                                leg.key
                                            }
                                            style={{
                                                marginBottom:
                                                    '30px',
                                            }}
                                        >

                                            {/* =================================================
                                                SECTOR HEADER
                                            ================================================= */}

                                            <div
                                                style={{
                                                    display:
                                                        'flex',

                                                    alignItems:
                                                        'center',

                                                    justifyContent:
                                                        'space-between',

                                                    gap:
                                                        '15px',

                                                    padding:
                                                        '15px 18px',

                                                    marginBottom:
                                                        '12px',

                                                    border:
                                                        '1px solid #e2e8f0',

                                                    background:
                                                        '#ffffff',

                                                    borderRadius:
                                                        '12px',

                                                    boxShadow:
                                                        '0 2px 8px rgba(15,23,42,0.04)',
                                                }}
                                            >

                                                <div>

                                                    <div
                                                        style={{
                                                            fontSize:
                                                                '12px',

                                                            fontWeight:
                                                                700,

                                                            color:
                                                                '#64748b',

                                                            textTransform:
                                                                'uppercase',

                                                            marginBottom:
                                                                '4px',
                                                        }}
                                                    >
                                                        {tripType ===
                                                            'ROUND_TRIP'
                                                            ? leg.key ===
                                                                'ONWARD'
                                                                ? 'Onward Flight'
                                                                : 'Return Flight'
                                                            : tripType ===
                                                                'MULTI_CITY'
                                                                ? `Sector ${legIndex +
                                                                1
                                                                }`
                                                                : 'Flight'}
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize:
                                                                '20px',

                                                            fontWeight:
                                                                750,

                                                            color:
                                                                '#0f172a',
                                                        }}
                                                    >
                                                        {route
                                                            ?.fromCityOrAirport
                                                            ?.code ||
                                                            routeDisplay.from}

                                                        <span
                                                            style={{
                                                                margin:
                                                                    '0 8px',

                                                                color:
                                                                    '#94a3b8',
                                                            }}
                                                        >
                                                            →
                                                        </span>

                                                        {route
                                                            ?.toCityOrAirport
                                                            ?.code ||
                                                            routeDisplay.to}
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize:
                                                                '13px',

                                                            color:
                                                                '#64748b',

                                                            marginTop:
                                                                '2px',
                                                        }}
                                                    >
                                                        {route
                                                            ?.fromCityOrAirport
                                                            ?.name ||
                                                            routeDisplay.fromCity ||
                                                            ''}

                                                        {' → '}

                                                        {route
                                                            ?.toCityOrAirport
                                                            ?.name ||
                                                            routeDisplay.toCity ||
                                                            ''}
                                                    </div>

                                                </div>

                                                <div
                                                    style={{
                                                        textAlign:
                                                            'right',
                                                    }}
                                                >

                                                    <div
                                                        style={{
                                                            fontSize:
                                                                '13px',

                                                            color:
                                                                '#64748b',
                                                        }}
                                                    >
                                                        {
                                                            leg
                                                                .flights
                                                                .length
                                                        }{' '}
                                                        options
                                                    </div>

                                                    {selected && (
                                                        <div
                                                            style={{
                                                                display:
                                                                    'inline-flex',

                                                                alignItems:
                                                                    'center',

                                                                gap:
                                                                    '5px',

                                                                marginTop:
                                                                    '5px',

                                                                color:
                                                                    '#0879f9',

                                                                fontWeight:
                                                                    700,

                                                                fontSize:
                                                                    '13px',
                                                            }}
                                                        >
                                                            ✓ Selected
                                                        </div>
                                                    )}

                                                </div>

                                            </div>

                                            {/* =================================================
                                                FLIGHTS
                                            ================================================= */}

                                            <div
                                                className="flight-list"
                                            >

                                                {leg
                                                    .flights
                                                    .length ===
                                                    0 ? (
                                                    <div
                                                        className="loading-box"
                                                    >
                                                        No flights
                                                        available
                                                        for this
                                                        sector.
                                                    </div>
                                                ) : (
                                                    leg.flights.map(
                                                        (
                                                            flight,
                                                            index
                                                        ) => {
                                                            const fare =
                                                                getFlightFare(
                                                                    flight
                                                                );

                                                            const price =
                                                                getFlightPrice(
                                                                    flight
                                                                );

                                                            const airline =
                                                                getAirline(
                                                                    flight
                                                                );

                                                            const first =
                                                                getFirstSegment(
                                                                    flight
                                                                );

                                                            const last =
                                                                getLastSegment(
                                                                    flight
                                                                );

                                                            const segments =
                                                                getSegments(
                                                                    flight
                                                                );

                                                            const duration =
                                                                getFlightDuration(
                                                                    flight
                                                                );

                                                            const stops =
                                                                getFlightStops(
                                                                    flight
                                                                );

                                                            const flightId =
                                                                getFlightUniqueId(
                                                                    flight
                                                                );

                                                            const isUnavailable =
                                                                unavailableFlights.includes(
                                                                    flightId
                                                                );

                                                            const isChecking =
                                                                checkingFlightId ===
                                                                flightId;

                                                            const isSelected =
                                                                selected?.flightId ===
                                                                flightId;

                                                            const flightNumbers =
                                                                getFlightNumbers(
                                                                    flight
                                                                );

                                                            const expandKey =
                                                                `${leg.key}-${flightId}`;

                                                            const isExpanded =
                                                                expandedFlight ===
                                                                expandKey;

                                                            return (
                                                                <div
                                                                    className={`flight-card ${isSelected
                                                                            ? 'flight-card-selected'
                                                                            : ''
                                                                        } ${isUnavailable
                                                                            ? 'flight-card-unavailable'
                                                                            : ''
                                                                        }`}
                                                                    key={`${leg.key}-${flightId || fare?.id || index}`}
                                                                    style={{
                                                                        position:
                                                                            'relative',

                                                                        border:
                                                                            isSelected
                                                                                ? '2px solid #2196f3'
                                                                                : '1px solid #e5e7eb',

                                                                        background:
                                                                            isSelected
                                                                                ? '#f4f9ff'
                                                                                : '#ffffff',

                                                                        boxShadow:
                                                                            isSelected
                                                                                ? '0 8px 25px rgba(33,150,243,0.12)'
                                                                                : '0 3px 14px rgba(15,23,42,0.04)',

                                                                        transition:
                                                                            'all 0.2s ease',
                                                                    }}
                                                                >

                                                                    {/* =================================================
                                                                        SELECTED BADGE
                                                                    ================================================= */}

                                                                    {isSelected && (
                                                                        <div
                                                                            style={{
                                                                                position:
                                                                                    'absolute',

                                                                                top:
                                                                                    '-1px',

                                                                                left:
                                                                                    '-1px',

                                                                                padding:
                                                                                    '5px 12px',

                                                                                background:
                                                                                    '#2196f3',

                                                                                color:
                                                                                    '#ffffff',

                                                                                borderRadius:
                                                                                    '0 0 8px 0',

                                                                                fontSize:
                                                                                    '11px',

                                                                                fontWeight:
                                                                                    800,

                                                                                zIndex:
                                                                                    3,
                                                                            }}
                                                                        >
                                                                            ✓ SELECTED
                                                                        </div>
                                                                    )}

                                                                    {/* =================================================
                                                                        AIRLINE
                                                                    ================================================= */}

                                                                    <div
                                                                        className="airline-column"
                                                                    >

                                                                        <div
                                                                            className="airline-logo"
                                                                            style={{
                                                                                display:
                                                                                    'flex',

                                                                                alignItems:
                                                                                    'center',

                                                                                justifyContent:
                                                                                    'center',

                                                                                fontWeight:
                                                                                    800,

                                                                                fontSize:
                                                                                    '13px',
                                                                            }}
                                                                        >
                                                                            {airline?.code ||
                                                                                'FL'}
                                                                        </div>

                                                                        <div>

                                                                            <strong>
                                                                                {airline?.name ||
                                                                                    'Airline'}
                                                                            </strong>

                                                                            <span>
                                                                                {flightNumbers.join(
                                                                                    ' · '
                                                                                ) ||
                                                                                    '--'}
                                                                            </span>

                                                                        </div>

                                                                    </div>

                                                                    {/* =================================================
                                                                        DEPARTURE
                                                                    ================================================= */}

                                                                    <div
                                                                        className="flight-time"
                                                                    >

                                                                        <strong>
                                                                            {formatTime(
                                                                                first?.dt
                                                                            )}
                                                                        </strong>

                                                                        <span>
                                                                            {first
                                                                                ?.da
                                                                                ?.code ||
                                                                                '--'}
                                                                        </span>

                                                                        <small>
                                                                            {first
                                                                                ?.da
                                                                                ?.city ||
                                                                                first
                                                                                    ?.da
                                                                                    ?.name ||
                                                                                ''}
                                                                        </small>

                                                                    </div>

                                                                    {/* =================================================
                                                                        DURATION
                                                                    ================================================= */}

                                                                    <div
                                                                        className="flight-duration"
                                                                    >

                                                                        <span>
                                                                            {formatDuration(
                                                                                duration
                                                                            )}
                                                                        </span>

                                                                        <div className="flight-line">

                                                                            <i />

                                                                            <b>
                                                                                ✈
                                                                            </b>

                                                                            <i />

                                                                        </div>

                                                                        <small>
                                                                            {stops ===
                                                                                0
                                                                                ? 'Non stop'
                                                                                : `${stops} ${stops ===
                                                                                    1
                                                                                    ? 'Stop'
                                                                                    : 'Stops'
                                                                                }`}
                                                                        </small>

                                                                    </div>

                                                                    {/* =================================================
                                                                        ARRIVAL
                                                                    ================================================= */}

                                                                    <div
                                                                        className="flight-time"
                                                                    >

                                                                        <strong>
                                                                            {formatTime(
                                                                                last?.at
                                                                            )}
                                                                        </strong>

                                                                        <span>
                                                                            {last
                                                                                ?.aa
                                                                                ?.code ||
                                                                                '--'}
                                                                        </span>

                                                                        <small>
                                                                            {last
                                                                                ?.aa
                                                                                ?.city ||
                                                                                last
                                                                                    ?.aa
                                                                                    ?.name ||
                                                                                ''}
                                                                        </small>

                                                                    </div>

                                                                    {/* =================================================
                                                                        PRICE
                                                                    ================================================= */}

                                                                    <div
                                                                        className="flight-price"
                                                                    >

                                                                        <strong>
                                                                            ₹
                                                                            {Number(
                                                                                price
                                                                            ).toLocaleString(
                                                                                'en-IN'
                                                                            )}
                                                                        </strong>

                                                                        <small>
                                                                            per adult
                                                                        </small>

                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                isUnavailable ||
                                                                                isChecking ||
                                                                                reviewLoading
                                                                            }
                                                                            style={{
                                                                                backgroundColor:
                                                                                    isUnavailable
                                                                                        ? '#dc2626'
                                                                                        : isChecking
                                                                                            ? '#f59e0b'
                                                                                            : isSelected
                                                                                                ? '#0879f9'
                                                                                                : '#16a34a',

                                                                                color:
                                                                                    '#ffffff',

                                                                                border:
                                                                                    'none',

                                                                                borderRadius:
                                                                                    '7px',

                                                                                padding:
                                                                                    '10px 18px',

                                                                                fontWeight:
                                                                                    700,

                                                                                fontSize:
                                                                                    '13px',

                                                                                cursor:
                                                                                    isUnavailable ||
                                                                                        isChecking ||
                                                                                        reviewLoading
                                                                                        ? 'not-allowed'
                                                                                        : 'pointer',

                                                                                opacity:
                                                                                    1,

                                                                                transition:
                                                                                    'all 0.2s ease',

                                                                                minWidth:
                                                                                    '125px',
                                                                            }}
                                                                            onClick={() =>
                                                                                selectFlight(
                                                                                    flight,
                                                                                    leg
                                                                                )
                                                                            }
                                                                        >
                                                                            {isChecking
                                                                                ? 'CHECKING...'
                                                                                : reviewLoading
                                                                                    ? 'REVIEWING...'
                                                                                    : isUnavailable
                                                                                    ? 'UNAVAILABLE'
                                                                                    : isSelected
                                                                                        ? '✓ SELECTED'
                                                                                        : 'SELECT'}
                                                                        </button>

                                                                    </div>

                                                                    {/* =================================================
                                                                        DETAILS
                                                                    ================================================= */}

                                                                    <div
                                                                        style={{
                                                                            gridColumn:
                                                                                '1 / -1',

                                                                            marginTop:
                                                                                '2px',

                                                                            display:
                                                                                'flex',

                                                                            alignItems:
                                                                                'center',

                                                                            gap:
                                                                                '10px',

                                                                            flexWrap:
                                                                                'wrap',
                                                                        }}
                                                                    >

                                                                        <span
                                                                            style={{
                                                                                fontSize:
                                                                                    '13px',

                                                                                color:
                                                                                    '#334155',

                                                                                fontWeight:
                                                                                    600,
                                                                            }}
                                                                        >
                                                                            {stops ===
                                                                                0
                                                                                ? 'Non-stop flight'
                                                                                : `${stops} connection${stops >
                                                                                    1
                                                                                    ? 's'
                                                                                    : ''
                                                                                }`}
                                                                        </span>

                                                                        <span
                                                                            style={{
                                                                                color:
                                                                                    '#cbd5e1',
                                                                            }}
                                                                        >
                                                                            •
                                                                        </span>

                                                                        <button
                                                                            type="button"
                                                                            style={{
                                                                                border:
                                                                                    'none',

                                                                                background:
                                                                                    '#eff6ff',

                                                                                color:
                                                                                    '#2563eb',

                                                                                borderRadius:
                                                                                    '6px',

                                                                                padding:
                                                                                    '7px 10px',

                                                                                fontSize:
                                                                                    '12px',

                                                                                fontWeight:
                                                                                    600,

                                                                                cursor:
                                                                                    'pointer',
                                                                            }}
                                                                            onClick={() =>
                                                                                setExpandedFlight(
                                                                                    isExpanded
                                                                                        ? null
                                                                                        : expandKey
                                                                                )
                                                                            }
                                                                        >
                                                                            {isExpanded
                                                                                ? 'Hide flight details'
                                                                                : 'View flight details'}
                                                                            {' '}
                                                                            {isExpanded
                                                                                ? '⌃'
                                                                                : '⌄'}
                                                                        </button>

                                                                    </div>

                                                                    {/* =================================================
                                                                        EXPANDED SEGMENTS
                                                                    ================================================= */}

                                                                    {isExpanded && (
                                                                        <div
                                                                            style={{
                                                                                gridColumn:
                                                                                    '1 / -1',

                                                                                marginTop:
                                                                                    '12px',

                                                                                padding:
                                                                                    '14px',

                                                                                borderTop:
                                                                                    '1px solid #e2e8f0',

                                                                                background:
                                                                                    '#f8fafc',

                                                                                borderRadius:
                                                                                    '8px',
                                                                            }}
                                                                        >

                                                                            {segments.map(
                                                                                (
                                                                                    segment,
                                                                                    segmentIndex
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            segment?.id ||
                                                                                            segmentIndex
                                                                                        }
                                                                                        style={{
                                                                                            display:
                                                                                                'grid',

                                                                                            gridTemplateColumns:
                                                                                                '1fr auto 1fr',

                                                                                            gap:
                                                                                                '15px',

                                                                                            alignItems:
                                                                                                'center',

                                                                                            padding:
                                                                                                '8px 0',

                                                                                            borderBottom:
                                                                                                segmentIndex <
                                                                                                    segments.length -
                                                                                                    1
                                                                                                    ? '1px solid #e2e8f0'
                                                                                                    : 'none',
                                                                                        }}
                                                                                    >

                                                                                        <div>

                                                                                            <strong>
                                                                                                {formatTime(
                                                                                                    segment?.dt
                                                                                                )}
                                                                                            </strong>

                                                                                            <div
                                                                                                style={{
                                                                                                    fontSize:
                                                                                                        '12px',

                                                                                                    color:
                                                                                                        '#64748b',
                                                                                                }}
                                                                                            >
                                                                                                {segment
                                                                                                    ?.da
                                                                                                    ?.code ||
                                                                                                    '--'}{' '}
                                                                                                •{' '}
                                                                                                {segment
                                                                                                    ?.da
                                                                                                    ?.city ||
                                                                                                    ''}
                                                                                            </div>

                                                                                        </div>

                                                                                        <div
                                                                                            style={{
                                                                                                textAlign:
                                                                                                    'center',

                                                                                                fontSize:
                                                                                                    '12px',

                                                                                                color:
                                                                                                    '#64748b',
                                                                                            }}
                                                                                        >
                                                                                            {formatDuration(
                                                                                                segment?.duration
                                                                                            )}
                                                                                            <br />
                                                                                            ↓
                                                                                        </div>

                                                                                        <div
                                                                                            style={{
                                                                                                textAlign:
                                                                                                    'right',
                                                                                            }}
                                                                                        >

                                                                                            <strong>
                                                                                                {formatTime(
                                                                                                    segment?.at
                                                                                                )}
                                                                                            </strong>

                                                                                            <div
                                                                                                style={{
                                                                                                    fontSize:
                                                                                                        '12px',

                                                                                                    color:
                                                                                                        '#64748b',
                                                                                                }}
                                                                                            >
                                                                                                {segment
                                                                                                    ?.aa
                                                                                                    ?.code ||
                                                                                                    '--'}{' '}
                                                                                                •{' '}
                                                                                                {segment
                                                                                                    ?.aa
                                                                                                    ?.city ||
                                                                                                    ''}
                                                                                            </div>

                                                                                        </div>

                                                                                    </div>
                                                                                )
                                                                            )}

                                                                        </div>
                                                                    )}

                                                                </div>
                                                            );
                                                        }
                                                    )
                                                )}

                                            </div>

                                        </section>
                                    );
                                }
                            )}

                        </div>

                    </section>

                </div>

                {/* =================================================
                    STICKY SELECTION BAR
                ================================================= */}

                {flightLegs.length >
                    0 && (
                        <div
                            style={{
                                position:
                                    'fixed',

                                left:
                                    '0',

                                right:
                                    '0',

                                bottom:
                                    '0',

                                zIndex:
                                    1000,

                                background:
                                    'rgba(24,24,24,0.97)',

                                color:
                                    '#ffffff',

                                boxShadow:
                                    '0 -8px 30px rgba(0,0,0,0.18)',

                                backdropFilter:
                                    'blur(10px)',
                            }}
                        >

                            <div
                                style={{
                                    maxWidth:
                                        '1320px',

                                    margin:
                                        '0 auto',

                                    padding:
                                        '12px 18px',

                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    gap:
                                        '18px',

                                    overflowX:
                                        'auto',
                                }}
                            >

                                {/* =================================================
                                SELECTED SECTORS
                            ================================================= */}

                                <div
                                    style={{
                                        display:
                                            'flex',

                                        alignItems:
                                            'stretch',

                                        gap:
                                            '0',

                                        flex:
                                            1,

                                        minWidth:
                                            '0',
                                    }}
                                >

                                    {flightLegs.map(
                                        (
                                            leg,
                                            index
                                        ) => {
                                            const selected =
                                                selectedFlights[
                                                leg.key
                                                ];

                                            if (
                                                !selected
                                            ) {
                                                return (
                                                    <div
                                                        key={
                                                            leg.key
                                                        }
                                                        style={{
                                                            minWidth:
                                                                '230px',

                                                            padding:
                                                                '4px 18px',

                                                            display:
                                                                'flex',

                                                            flexDirection:
                                                                'column',

                                                            justifyContent:
                                                                'center',
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    '11px',

                                                                color:
                                                                    '#94a3b8',

                                                                fontWeight:
                                                                    700,

                                                                textTransform:
                                                                    'uppercase',
                                                            }}
                                                        >
                                                            Sector{' '}
                                                            {index +
                                                                1}
                                                        </div>

                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    '3px',

                                                                fontSize:
                                                                    '15px',

                                                                fontWeight:
                                                                    700,
                                                            }}
                                                        >
                                                            {leg
                                                                .route
                                                                ?.fromCityOrAirport
                                                                ?.code ||
                                                                getFlightRoute(
                                                                    leg.flights?.[0],
                                                                    leg.route
                                                                ).from}

                                                            {' → '}

                                                            {leg
                                                                .route
                                                                ?.toCityOrAirport
                                                                ?.code ||
                                                                getFlightRoute(
                                                                    leg.flights?.[0],
                                                                    leg.route
                                                                ).to}
                                                        </div>

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    '12px',

                                                                color:
                                                                    '#94a3b8',

                                                                marginTop:
                                                                    '2px',
                                                            }}
                                                        >
                                                            Select a flight
                                                        </div>

                                                    </div>
                                                );
                                            }

                                            const flight =
                                                selected.flight;

                                            const first =
                                                getFirstSegment(
                                                    flight
                                                );

                                            const last =
                                                getLastSegment(
                                                    flight
                                                );

                                            const airline =
                                                getAirline(
                                                    flight
                                                );

                                            const price =
                                                getFlightPrice(
                                                    flight
                                                );

                                            return (
                                                <div
                                                    key={
                                                        leg.key
                                                    }
                                                    style={{
                                                        minWidth:
                                                            '270px',

                                                        padding:
                                                            '4px 18px',

                                                        borderRight:
                                                            index <
                                                                flightLegs.length -
                                                                1
                                                                ? '1px solid #555'
                                                                : 'none',

                                                        display:
                                                            'flex',

                                                        flexDirection:
                                                            'column',

                                                        justifyContent:
                                                            'center',
                                                    }}
                                                >

                                                    <div
                                                        style={{
                                                            display:
                                                                'flex',

                                                            alignItems:
                                                                'center',

                                                            gap:
                                                                '9px',
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                width:
                                                                    '30px',

                                                                height:
                                                                    '30px',

                                                                borderRadius:
                                                                    '6px',

                                                                background:
                                                                    '#dc2626',

                                                                display:
                                                                    'flex',

                                                                alignItems:
                                                                    'center',

                                                                justifyContent:
                                                                    'center',

                                                                fontSize:
                                                                    '10px',

                                                                fontWeight:
                                                                    800,
                                                            }}
                                                        >
                                                            {airline?.code ||
                                                                'FL'}
                                                        </div>

                                                        <strong
                                                            style={{
                                                                fontSize:
                                                                    '15px',
                                                            }}
                                                        >
                                                            {airline?.name ||
                                                                'Airline'}
                                                        </strong>

                                                        <span
                                                            style={{
                                                                marginLeft:
                                                                    'auto',

                                                                background:
                                                                    '#f1f5f9',

                                                                color:
                                                                    '#111827',

                                                                borderRadius:
                                                                    '6px',

                                                                padding:
                                                                    '4px 8px',

                                                                fontSize:
                                                                    '11px',

                                                                fontWeight:
                                                                    800,
                                                            }}
                                                        >
                                                            {first
                                                                ?.da
                                                                ?.code ||
                                                                '--'}
                                                            -
                                                            {last
                                                                ?.aa
                                                                ?.code ||
                                                                '--'}
                                                        </span>

                                                    </div>

                                                    <div
                                                        style={{
                                                            display:
                                                                'flex',

                                                            alignItems:
                                                                'center',

                                                            gap:
                                                                '10px',

                                                            marginTop:
                                                                '5px',
                                                        }}
                                                    >

                                                        <strong
                                                            style={{
                                                                fontSize:
                                                                    '18px',
                                                            }}
                                                        >
                                                            {formatTime(
                                                                first?.dt
                                                            )}
                                                        </strong>

                                                        <span
                                                            style={{
                                                                color:
                                                                    '#94a3b8',
                                                            }}
                                                        >
                                                            →
                                                        </span>

                                                        <strong
                                                            style={{
                                                                fontSize:
                                                                    '18px',
                                                            }}
                                                        >
                                                            {formatTime(
                                                                last?.at
                                                            )}
                                                        </strong>

                                                        <strong
                                                            style={{
                                                                marginLeft:
                                                                    'auto',

                                                                fontSize:
                                                                    '16px',
                                                            }}
                                                        >
                                                            ₹
                                                            {Number(
                                                                price
                                                            ).toLocaleString(
                                                                'en-IN'
                                                            )}
                                                        </strong>

                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize:
                                                                '12px',

                                                            color:
                                                                '#a3a3a3',

                                                            marginTop:
                                                                '2px',
                                                        }}
                                                    >
                                                        {formatDuration(
                                                            getFlightDuration(
                                                                flight
                                                            )
                                                        )}{' '}
                                                        •{' '}
                                                        {getFlightStops(
                                                            flight
                                                        ) ===
                                                            0
                                                            ? 'Non Stop'
                                                            : `${getFlightStops(
                                                                flight
                                                            )} Stop`}
                                                    </div>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                                {/* =================================================
                                FLIGHT DETAILS
                            ================================================= */}

                                <button
                                    type="button"
                                    style={{
                                        background:
                                            'transparent',

                                        border:
                                            'none',

                                        color:
                                            '#ffffff',

                                        fontWeight:
                                            700,

                                        fontSize:
                                            '14px',

                                        whiteSpace:
                                            'nowrap',

                                        cursor:
                                            'pointer',
                                    }}
                                    onClick={() => {
                                        const firstSelected =
                                            flightLegs.find(
                                                (
                                                    leg
                                                ) =>
                                                    selectedFlights[
                                                    leg.key
                                                    ]
                                            );

                                        if (
                                            firstSelected
                                        ) {
                                            setExpandedFlight(
                                                expandedFlight
                                                    ? null
                                                    : `summary-${firstSelected.key}`
                                            );
                                        }
                                    }}
                                >
                                    ☷ Flight details
                                </button>

                                {/* =================================================
                                CONTINUE
                            ================================================= */}

                                <button
                                    type="button"
                                    disabled={
                                        !allLegsSelected ||
                                        reviewLoading
                                    }
                                    onClick={
                                        continueToReview
                                    }
                                    style={{
                                        minWidth:
                                            '150px',

                                        padding:
                                            '13px 22px',

                                        border:
                                            'none',

                                        borderRadius:
                                            '10px',

                                        background:
                                            allLegsSelected && !reviewLoading
                                                ? '#2196f3'
                                                : '#475569',

                                        color:
                                            '#ffffff',

                                        fontSize:
                                            '15px',

                                        fontWeight:
                                            800,

                                        cursor:
                                            allLegsSelected && !reviewLoading
                                                ? 'pointer'
                                                : 'not-allowed',

                                        opacity:
                                            allLegsSelected && !reviewLoading
                                                ? 1
                                                : 0.75,

                                        whiteSpace:
                                            'nowrap',

                                        boxShadow:
                                            allLegsSelected && !reviewLoading
                                                ? '0 5px 18px rgba(33,150,243,0.35)'
                                                : 'none',
                                    }}
                                >
                                    {reviewLoading
                                        ? 'CHECKING FARE...'
                                        : allLegsSelected
                                            ? 'CONTINUE'
                                        : `SELECT ${flightLegs.filter(
                                            (
                                                leg
                                            ) =>
                                                selectedFlights[
                                                leg.key
                                                ]
                                        ).length +
                                        1
                                        }/${flightLegs.length}`}
                                </button>

                            </div>

                        </div>
                    )}

            </main>
        </>
    );
}