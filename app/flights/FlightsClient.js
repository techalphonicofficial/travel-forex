'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeftRight,
    Calendar3,
    ChevronDown,
    GeoAlt,
    Search,
    People,
    Plus,
    X,
} from 'react-bootstrap-icons';

import airports from './airports.json';
import flightService from '../services/flightBookingService';

import './flights.css';




/* =========================================================
   CONSTANTS
========================================================= */

const today = new Date().toISOString().split('T')[0];

const cabinClasses = [
    {
        value: 'ECONOMY',
        label: 'Economy',
    },
    {
        value: 'PREMIUM_ECONOMY',
        label: 'Premium Economy',
    },
    {
        value: 'BUSINESS',
        label: 'Business',
    },
    {
        value: 'FIRST',
        label: 'First Class',
    },
];


/* =========================================================
   AIRPORT DATA
========================================================= */

/* =========================================================
   AIRPORT DATA
========================================================= */

const toText = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => toText(item))
            .filter(Boolean)
            .join(' ');
    }

    if (typeof value === 'object') {
        return Object.values(value)
            .map((item) => toText(item))
            .filter(Boolean)
            .join(' ');
    }

    return String(value).trim();
};


const airportList = Array.isArray(airports)
    ? airports
          .filter((airport) => {
              const iataCode = toText(
                  airport?.iata_code
              );

              const hasIata =
                  iataCode.length === 3;

              const isNotHeliport =
                  toText(
                      airport?.type
                  ).toLowerCase() !==
                  'heliport';

              const hasScheduledService =
                  toText(
                      airport?.scheduled_service
                  ).toLowerCase() !==
                  'no';

              return (
                  hasIata &&
                  isNotHeliport &&
                  hasScheduledService
              );
          })
          .map((airport) => ({
              code: toText(
                  airport?.iata_code
              ).toUpperCase(),

              name: toText(
                  airport?.name
              ),

              city: toText(
                  airport?.municipality
              ),

              country: toText(
                  airport?.iso_country
              ),

              keywords: toText(
                  airport?.keywords
              ),

              type: toText(
                  airport?.type
              ),
          }))
    : [];


/* =========================================================
   AIRPORT SEARCH
========================================================= */

const getAirportSuggestions = (value) => {
    const query = String(value || '')
        .trim()
        .toLowerCase();

    if (!query) {
        return [];
    }

    return airportList
        .map((airport) => {
            const code =
                airport.code.toLowerCase();

            const city =
                airport.city.toLowerCase();

            const name =
                airport.name.toLowerCase();

            const keywords =
                airport.keywords.toLowerCase();

            let score = 0;

            /*
             * Exact matches
             */
            if (code === query) {
                score += 200;
            }

            if (city === query) {
                score += 180;
            }

            if (name === query) {
                score += 160;
            }

            /*
             * Starts with
             */
            if (code.startsWith(query)) {
                score += 130;
            }

            if (city.startsWith(query)) {
                score += 120;
            }

            if (name.startsWith(query)) {
                score += 110;
            }

            /*
             * Contains
             */
            if (city.includes(query)) {
                score += 80;
            }

            if (name.includes(query)) {
                score += 60;
            }

            if (keywords.includes(query)) {
                score += 40;
            }

            return {
                ...airport,
                score,
            };
        })
        .filter((airport) => airport.score > 0)
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }

            return (
                a.city.localeCompare(
                    b.city
                ) ||
                a.name.localeCompare(
                    b.name
                )
            );
        })
        .slice(0, 8);
};


/* =========================================================
   SEGMENT
========================================================= */

const createSegment = () => ({
    from: '',
    fromCode: '',
    to: '',
    toCode: '',
    date: today,
});


/* =========================================================
   POPULAR ROUTES
========================================================= */

const popularRoutes = [
    {
        from: 'Delhi',
        fromCode: 'DEL',
        to: 'Mumbai',
        toCode: 'BOM',
    },
    {
        from: 'Delhi',
        fromCode: 'DEL',
        to: 'Bengaluru',
        toCode: 'BLR',
    },
    {
        from: 'Mumbai',
        fromCode: 'BOM',
        to: 'Dubai',
        toCode: 'DXB',
    },
    {
        from: 'Delhi',
        fromCode: 'DEL',
        to: 'Dubai',
        toCode: 'DXB',
    },
    {
        from: 'Bengaluru',
        fromCode: 'BLR',
        to: 'Singapore',
        toCode: 'SIN',
    },
    {
        from: 'Delhi',
        fromCode: 'DEL',
        to: 'London',
        toCode: 'LHR',
    },
];


/* =========================================================
   AIRPORT AUTOCOMPLETE COMPONENT
========================================================= */

function AirportAutocomplete({
    label,
    placeholder,
    value,
    code,
    onSelect,
}) {
    const [open, setOpen] = useState(false);

    const suggestions =
        getAirportSuggestions(value);


    const handleChange = (event) => {
        const nextValue =
            event.target.value;

        /*
         * User changed the text,
         * so old airport code should be cleared.
         */
        onSelect({
            name: nextValue,
            code: '',
        });

        setOpen(true);
    };


    const handleSelect = (airport) => {
        onSelect({
            name:
                airport.city ||
                airport.name,

            code:
                airport.code,
        });

        setOpen(false);
    };


    return (
        <div className="tj-airport-autocomplete">

            <label className="tj-label">
                {label}
            </label>

            <div className="tj-location-field">

                <GeoAlt />

                <div className="flex-grow-1">

                    <small>
                        {label === 'FROM'
                            ? 'Departure'
                            : 'Destination'}
                    </small>

                    <input
                        type="text"
                        value={value}
                        onChange={
                            handleChange
                        }
                        onFocus={() => {
                            if (value) {
                                setOpen(true);
                            }
                        }}
                        placeholder={
                            placeholder
                        }
                        autoComplete="off"
                    />

                    {code && (
                        <span className="tj-selected-airport-code">
                            {code}
                        </span>
                    )}

                </div>

            </div>


            {open && value && (
                <div className="tj-airport-dropdown">

                    {suggestions.length > 0 ? (
                        suggestions.map(
                            (airport) => (
                                <button
                                    key={`${airport.code}-${airport.name}`}
                                    type="button"
                                    className="tj-airport-option"
                                    onMouseDown={(
                                        event
                                    ) =>
                                        event.preventDefault()
                                    }
                                    onClick={() =>
                                        handleSelect(
                                            airport
                                        )
                                    }
                                >

                                    <div className="tj-airport-code">
                                        {
                                            airport.code
                                        }
                                    </div>

                                    <div className="tj-airport-info">

                                        <strong>
                                            {
                                                airport.city ||
                                                airport.name
                                            }
                                        </strong>

                                        <span>
                                            {
                                                airport.name
                                            }
                                        </span>

                                        {airport.country && (
                                            <small>
                                                {
                                                    airport.country
                                                }
                                            </small>
                                        )}

                                    </div>

                                </button>
                            )
                        )
                    ) : (
                        <div className="tj-airport-empty">
                            No airport found
                        </div>
                    )}

                </div>
            )}

        </div>
    );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function FlightsClient() {

    const router = useRouter();


    /* =====================================================
       SEARCH STATE
    ===================================================== */

    const [tripType, setTripType] =
        useState('ONE_WAY');


    const [search, setSearch] =
        useState({
            from: '',
            fromCode: '',

            to: '',
            toCode: '',

            departureDate: today,
            returnDate: '',

            adults: 1,
            children: 0,
            infants: 0,

            cabinClass: 'ECONOMY',

            directFlight: false,
        });


    const [segments, setSegments] =
        useState([
            createSegment(),
            createSegment(),
        ]);


    const [passengerOpen, setPassengerOpen] =
        useState(false);


    const [loading, setLoading] =
        useState(false);


    /* =====================================================
       PASSENGERS
    ===================================================== */

    const totalPassengers =
        Number(search.adults) +
        Number(search.children) +
        Number(search.infants);


    /* =====================================================
       UPDATE SEARCH
    ===================================================== */

    const updateSearch = (
        field,
        value
    ) => {
        setSearch((prev) => ({
            ...prev,
            [field]: value,
        }));
    };


    /* =====================================================
       SWAP
    ===================================================== */

    const swapAirports = () => {
        setSearch((prev) => ({
            ...prev,

            from: prev.to,
            fromCode: prev.toCode,

            to: prev.from,
            toCode: prev.fromCode,
        }));
    };


    /* =====================================================
       PASSENGER UPDATE
    ===================================================== */

    const updatePassenger = (
        type,
        value
    ) => {

        setSearch((prev) => {

            const current =
                Number(prev[type]);


            const next = Math.max(
                type === 'adults'
                    ? 1
                    : 0,

                current + value
            );


            /*
             * Infant cannot exceed adults.
             */
            if (
                type === 'infants' &&
                next >
                    Number(prev.adults)
            ) {
                return prev;
            }


            return {
                ...prev,
                [type]: next,
            };
        });
    };


    /* =====================================================
       MULTI CITY UPDATE
    ===================================================== */

    const updateSegment = (
        index,
        field,
        value
    ) => {

        setSegments((prev) =>
            prev.map(
                (segment, i) =>
                    i === index
                        ? {
                              ...segment,
                              [field]:
                                  value,
                          }
                        : segment
            )
        );
    };


    /* =====================================================
       ADD SEGMENT
    ===================================================== */

    const addSegment = () => {

        if (segments.length >= 6) {
            toast.error(
                'Maximum 6 sectors allowed.'
            );

            return;
        }


        setSegments((prev) => [
            ...prev,
            createSegment(),
        ]);
    };


    /* =====================================================
       REMOVE SEGMENT
    ===================================================== */

    const removeSegment = (
        index
    ) => {

        if (segments.length <= 2) {
            return;
        }


        setSegments((prev) =>
            prev.filter(
                (_, i) => i !== index
            )
        );
    };


    /* =====================================================
       POPULAR ROUTE
    ===================================================== */

    const selectPopularRoute = (
        route
    ) => {

        setSearch((prev) => ({
            ...prev,

            from: route.from,
            fromCode:
                route.fromCode,

            to: route.to,
            toCode:
                route.toCode,
        }));


        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };


    /* =====================================================
       VALIDATION
    ===================================================== */

    const validateSearch = () => {

        /*
         * MULTI CITY
         */
        if (
            tripType ===
            'MULTI_CITY'
        ) {

            const invalid =
                segments.some(
                    (segment) =>
                        !segment.fromCode ||
                        !segment.toCode ||
                        !segment.date
                );


            if (invalid) {
                toast.error(
                    'Please select departure and destination airports for all sectors.'
                );

                return false;
            }


            const sameRoute =
                segments.some(
                    (segment) =>
                        segment.fromCode.toUpperCase() ===
                        segment.toCode.toUpperCase()
                );


            if (sameRoute) {
                toast.error(
                    'Departure and destination cannot be same.'
                );

                return false;
            }


            return true;
        }


        /*
         * NORMAL SEARCH
         */
        if (!search.fromCode) {
            toast.error(
                'Please select a departure airport.'
            );

            return false;
        }


        if (!search.toCode) {
            toast.error(
                'Please select a destination airport.'
            );

            return false;
        }


        if (
            search.fromCode.toUpperCase() ===
            search.toCode.toUpperCase()
        ) {
            toast.error(
                'Departure and destination cannot be same.'
            );

            return false;
        }


        if (!search.departureDate) {
            toast.error(
                'Please select departure date.'
            );

            return false;
        }


        /*
         * ROUND TRIP
         */
        if (
            tripType ===
            'ROUND_TRIP'
        ) {

            if (!search.returnDate) {
                toast.error(
                    'Please select return date.'
                );

                return false;
            }


            if (
                search.returnDate <
                search.departureDate
            ) {
                toast.error(
                    'Return date cannot be before departure date.'
                );

                return false;
            }
        }


        return true;
    };


    /* =====================================================
       BUILD TRIPJACK PAYLOAD
    ===================================================== */

    const buildSearchPayload = () => {

        let routeInfos = [];


        /*
         * MULTI CITY
         */
        if (
            tripType ===
            'MULTI_CITY'
        ) {

            routeInfos =
                segments.map(
                    (segment) => ({
                        fromCityOrAirport: {
                            code:
                                segment.fromCode
                                    .trim()
                                    .toUpperCase(),
                        },

                        toCityOrAirport: {
                            code:
                                segment.toCode
                                    .trim()
                                    .toUpperCase(),
                        },

                        travelDate:
                            segment.date,
                    })
                );

        } else {

            /*
             * ONE WAY
             */
            routeInfos = [
                {
                    fromCityOrAirport: {
                        code:
                            search.fromCode
                                .trim()
                                .toUpperCase(),
                    },

                    toCityOrAirport: {
                        code:
                            search.toCode
                                .trim()
                                .toUpperCase(),
                    },

                    travelDate:
                        search.departureDate,
                },
            ];


            /*
             * ROUND TRIP
             */
            if (
                tripType ===
                'ROUND_TRIP'
            ) {

                routeInfos.push({
                    fromCityOrAirport: {
                        code:
                            search.toCode
                                .trim()
                                .toUpperCase(),
                    },

                    toCityOrAirport: {
                        code:
                            search.fromCode
                                .trim()
                                .toUpperCase(),
                    },

                    travelDate:
                        search.returnDate,
                });
            }
        }


        return {
            searchQuery: {

                cabinClass:
                    search.cabinClass,


                paxInfo: {

                    ADULT: String(
                        search.adults
                    ),

                    CHILD: String(
                        search.children
                    ),

                    INFANT: String(
                        search.infants
                    ),
                },


                routeInfos,


                searchModifiers: {

                    isDirectFlight:
                        Boolean(
                            search.directFlight
                        ),

                    isConnectingFlight:
                        !search.directFlight,
                },
            },
        };
    };


    /* =====================================================
       SEARCH
    ===================================================== */

    const handleSearch = async (
        event
    ) => {

        event.preventDefault();


        if (!validateSearch()) {
            return;
        }


        setLoading(true);


        try {

            const payload =
                buildSearchPayload();


            const response =
                await flightService.search(
                    payload
                );


            /*
             * Save complete search
             * context for result page.
             */
            sessionStorage.setItem(
                'tripjack_flight_search',

                JSON.stringify({
                    search,
                    tripType,
                    segments,
                    request:
                        payload,
                    response,
                })
            );


            router.push(
                '/flights/results'
            );

        } catch (error) {

            console.error(
                'Flight search error:',
                error
            );


            toast.error(
                error?.message ||
                    'Unable to search flights.'
            );

        } finally {

            setLoading(false);
        }
    };


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <main className="tj-flight-page">

            {/* =================================================
                HERO
            ================================================= */}

            <section className="tj-flight-hero">

                <div className="container">

                    <div className="tj-hero-copy text-center text-white">

                        <span className="tj-eyebrow">
                            TRIPJACK FLIGHTS
                        </span>

                        <h1>
                            Search. Compare. Fly.
                        </h1>

                        <p>
                            Find the right flight,
                            compare fares and book
                            your journey with ease.
                        </p>

                    </div>


                    {/* =================================================
                        SEARCH CARD
                    ================================================= */}

                    <div className="tj-search-shell">

                        {/* TRIP TYPE */}

                        <div className="tj-search-tabs">

                            {[
                                [
                                    'ONE_WAY',
                                    'One Way',
                                ],
                                [
                                    'ROUND_TRIP',
                                    'Round Trip',
                                ],
                                [
                                    'MULTI_CITY',
                                    'Multi City',
                                ],
                            ].map(
                                ([
                                    value,
                                    label,
                                ]) => (
                                    <button
                                        key={
                                            value
                                        }
                                        type="button"
                                        className={
                                            tripType ===
                                            value
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() => {

                                            setTripType(
                                                value
                                            );


                                            if (
                                                value ===
                                                'MULTI_CITY'
                                            ) {

                                                setSegments(
                                                    [
                                                        createSegment(),
                                                        createSegment(),
                                                    ]
                                                );
                                            }
                                        }}
                                    >
                                        {
                                            label
                                        }
                                    </button>
                                )
                            )}

                        </div>


                        <form
                            onSubmit={
                                handleSearch
                            }
                            className="p-3 p-md-4"
                        >

                            {/* =================================================
                                ONE WAY / ROUND TRIP
                            ================================================= */}

                            {tripType !==
                            'MULTI_CITY' ? (
                                <>

                                    <div className="row g-2">

                                        {/* FROM */}

                                        <div className="col-12 col-lg-5">

                                            <AirportAutocomplete
                                                label="FROM"
                                                placeholder="Delhi"
                                                value={
                                                    search.from
                                                }
                                                code={
                                                    search.fromCode
                                                }
                                                onSelect={({
                                                    name,
                                                    code,
                                                }) => {

                                                    setSearch(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,

                                                            from:
                                                                name,

                                                            fromCode:
                                                                code,
                                                        })
                                                    );
                                                }}
                                            />

                                        </div>


                                        {/* SWAP */}

                                        <div className="col-12 col-lg-2 d-flex justify-content-center align-items-center">

                                            <button
                                                type="button"
                                                className="tj-swap"
                                                onClick={
                                                    swapAirports
                                                }
                                                aria-label="Swap airports"
                                            >
                                                <ArrowLeftRight />
                                            </button>

                                        </div>


                                        {/* TO */}

                                        <div className="col-12 col-lg-5">

                                            <AirportAutocomplete
                                                label="TO"
                                                placeholder="Mumbai"
                                                value={
                                                    search.to
                                                }
                                                code={
                                                    search.toCode
                                                }
                                                onSelect={({
                                                    name,
                                                    code,
                                                }) => {

                                                    setSearch(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,

                                                            to:
                                                                name,

                                                            toCode:
                                                                code,
                                                        })
                                                    );
                                                }}
                                            />

                                        </div>

                                    </div>


                                    {/* =================================================
                                        DETAILS
                                    ================================================= */}

                                    <div className="row g-2 mt-2">

                                        {/* DEPARTURE */}

                                        <div className="col-12 col-md-6 col-lg-3">

                                            <label className="tj-label">
                                                DEPARTURE
                                            </label>

                                            <div className="tj-simple-field">

                                                <Calendar3 />

                                                <input
                                                    type="date"
                                                    min={
                                                        today
                                                    }
                                                    value={
                                                        search.departureDate
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateSearch(
                                                            'departureDate',
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />

                                            </div>

                                        </div>


                                        {/* RETURN */}

                                        {tripType ===
                                            'ROUND_TRIP' && (
                                            <div className="col-12 col-md-6 col-lg-3">

                                                <label className="tj-label">
                                                    RETURN
                                                </label>

                                                <div className="tj-simple-field">

                                                    <Calendar3 />

                                                    <input
                                                        type="date"
                                                        min={
                                                            search.departureDate ||
                                                            today
                                                        }
                                                        value={
                                                            search.returnDate
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateSearch(
                                                                'returnDate',
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />

                                                </div>

                                            </div>
                                        )}


                                        {/* PASSENGERS */}

                                        <div className="col-12 col-md-6 col-lg-3 position-relative">

                                            <label className="tj-label">
                                                TRAVELLERS
                                            </label>

                                            <button
                                                type="button"
                                                className="tj-simple-field tj-click-field w-100 text-start"
                                                onClick={() =>
                                                    setPassengerOpen(
                                                        (
                                                            prev
                                                        ) =>
                                                            !prev
                                                    )
                                                }
                                            >

                                                <People />

                                                <span>
                                                    {
                                                        totalPassengers
                                                    }{' '}
                                                    Traveller
                                                    {totalPassengers !==
                                                    1
                                                        ? 's'
                                                        : ''}
                                                </span>

                                                <ChevronDown className="ms-auto" />

                                            </button>


                                            {passengerOpen && (
                                                <div className="tj-passenger-popover">

                                                    {[
                                                        [
                                                            'adults',
                                                            'Adults',
                                                            '12+ years',
                                                        ],
                                                        [
                                                            'children',
                                                            'Children',
                                                            '2–11 years',
                                                        ],
                                                        [
                                                            'infants',
                                                            'Infants',
                                                            'Below 2 years',
                                                        ],
                                                    ].map(
                                                        ([
                                                            key,
                                                            label,
                                                            sub,
                                                        ]) => (
                                                            <div
                                                                className="tj-pax-row"
                                                                key={
                                                                    key
                                                                }
                                                            >

                                                                <div>

                                                                    <strong>
                                                                        {
                                                                            label
                                                                        }
                                                                    </strong>

                                                                    <small>
                                                                        {
                                                                            sub
                                                                        }
                                                                    </small>

                                                                </div>


                                                                <div className="tj-counter">

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            updatePassenger(
                                                                                key,
                                                                                -1
                                                                            )
                                                                        }
                                                                    >
                                                                        −
                                                                    </button>

                                                                    <b>
                                                                        {
                                                                            search[
                                                                                key
                                                                            ]
                                                                        }
                                                                    </b>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            updatePassenger(
                                                                                key,
                                                                                1
                                                                            )
                                                                        }
                                                                    >
                                                                        +
                                                                    </button>

                                                                </div>

                                                            </div>
                                                        )
                                                    )}

                                                </div>
                                            )}

                                        </div>


                                        {/* CABIN */}

                                        <div className="col-12 col-md-6 col-lg-3">

                                            <label className="tj-label">
                                                CLASS
                                            </label>

                                            <div className="tj-simple-field">

                                                <select
                                                    value={
                                                        search.cabinClass
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateSearch(
                                                            'cabinClass',
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >

                                                    {cabinClasses.map(
                                                        (
                                                            cabin
                                                        ) => (
                                                            <option
                                                                key={
                                                                    cabin.value
                                                                }
                                                                value={
                                                                    cabin.value
                                                                }
                                                            >
                                                                {
                                                                    cabin.label
                                                                }
                                                            </option>
                                                        )
                                                    )}

                                                </select>

                                            </div>

                                        </div>

                                    </div>

                                </>
                            ) : (

                                /* =================================================
                                   MULTI CITY
                                ================================================= */

                                <div className="tj-multicity-list">

                                    {segments.map(
                                        (
                                            segment,
                                            index
                                        ) => (
                                            <div
                                                className="tj-multi-row"
                                                key={
                                                    index
                                                }
                                            >

                                                <div className="tj-sector-number">
                                                    {index +
                                                        1}
                                                </div>


                                                {/* FROM */}

                                                <div className="tj-multi-airport">

                                                    <AirportAutocomplete
                                                        label="FROM"
                                                        placeholder="Delhi"
                                                        value={
                                                            segment.from
                                                        }
                                                        code={
                                                            segment.fromCode
                                                        }
                                                        onSelect={({
                                                            name,
                                                            code,
                                                        }) =>
                                                            updateSegment(
                                                                index,
                                                                'from',
                                                                name
                                                            ) ||
                                                            updateSegment(
                                                                index,
                                                                'fromCode',
                                                                code
                                                            )
                                                        }
                                                    />

                                                </div>


                                                {/* TO */}

                                                <div className="tj-multi-airport">

                                                    <AirportAutocomplete
                                                        label="TO"
                                                        placeholder="Mumbai"
                                                        value={
                                                            segment.to
                                                        }
                                                        code={
                                                            segment.toCode
                                                        }
                                                        onSelect={({
                                                            name,
                                                            code,
                                                        }) => {

                                                            updateSegment(
                                                                index,
                                                                'to',
                                                                name
                                                            );

                                                            updateSegment(
                                                                index,
                                                                'toCode',
                                                                code
                                                            );
                                                        }}
                                                    />

                                                </div>


                                                {/* DATE */}

                                                <div>

                                                    <label className="tj-label">
                                                        DATE
                                                    </label>

                                                    <div className="tj-simple-field">

                                                        <Calendar3 />

                                                        <input
                                                            type="date"
                                                            min={
                                                                today
                                                            }
                                                            value={
                                                                segment.date
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateSegment(
                                                                    index,
                                                                    'date',
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />

                                                    </div>

                                                </div>


                                                {/* DELETE */}

                                                {segments.length >
                                                    2 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger tj-delete-sector"
                                                        onClick={() =>
                                                            removeSegment(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        <Trash3 />
                                                    </button>
                                                )}

                                            </div>
                                        )
                                    )}


                                    <button
                                        type="button"
                                        className="tj-add-sector"
                                        onClick={
                                            addSegment
                                        }
                                    >
                                        <Plus />
                                        Add another city
                                    </button>

                                </div>
                            )}


                            {/* =================================================
                                BOTTOM
                            ================================================= */}

                            <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3 mt-4">

                                <label className="tj-switch">

                                    <input
                                        type="checkbox"
                                        checked={
                                            search.directFlight
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateSearch(
                                                'directFlight',
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                    />

                                    <span />

                                    Direct flights only

                                </label>


                                <button
                                    type="submit"
                                    className="tj-search-button"
                                    disabled={
                                        loading
                                    }
                                >

                                    <Search />

                                    {loading
                                        ? 'Searching Flights...'
                                        : 'Search Flights'}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            </section>


            {/* =================================================
                POPULAR ROUTES
            ================================================= */}

            <section className="container py-5">

                <div className="mb-4">

                    <span className="tj-section-kicker">
                        EXPLORE
                    </span>

                    <h2 className="tj-section-title">
                        Popular flight routes
                    </h2>

                    <p className="text-muted mb-0">
                        Quickly search some of the
                        popular routes.
                    </p>

                </div>


                <div className="row g-3">

                    {popularRoutes.map(
                        (route) => (
                            <div
                                className="col-12 col-md-6 col-lg-4"
                                key={`${route.fromCode}-${route.toCode}`}
                            >

                                <button
                                    type="button"
                                    className="tj-route-card w-100"
                                    onClick={() =>
                                        selectPopularRoute(
                                            route
                                        )
                                    }
                                >

                                    <div>

                                        <strong>
                                            {
                                                route.fromCode
                                            }
                                        </strong>

                                        <span>
                                            {
                                                route.from
                                            }
                                        </span>

                                    </div>


                                    <ArrowLeftRight />


                                    <div>

                                        <strong>
                                            {
                                                route.toCode
                                            }
                                        </strong>

                                        <span>
                                            {
                                                route.to
                                            }
                                        </span>

                                    </div>

                                </button>

                            </div>
                        )
                    )}

                </div>

            </section>


            {/* =================================================
                FEATURES
            ================================================= */}

            <section className="tj-trust-strip">

                <div className="container">

                    <div className="row g-4">

                        <div className="col-12 col-md-4">

                            <div className="tj-feature-box">

                                <span className="tj-feature-icon">
                                    01
                                </span>

                                <div>

                                    <strong>
                                        Live flight search
                                    </strong>

                                    <p>
                                        Search available
                                        flight options
                                        through TripJack.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="col-12 col-md-4">

                            <div className="tj-feature-box">

                                <span className="tj-feature-icon">
                                    02
                                </span>

                                <div>

                                    <strong>
                                        Compare options
                                    </strong>

                                    <p>
                                        Review schedules,
                                        fares and flight
                                        choices.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="col-12 col-md-4">

                            <div className="tj-feature-box">

                                <span className="tj-feature-icon">
                                    03
                                </span>

                                <div>

                                    <strong>
                                        Simple booking
                                    </strong>

                                    <p>
                                        Select your flight
                                        and continue to
                                        passenger details.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

        </main>
    );
}