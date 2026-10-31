'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeftRight,
    Calendar3,
    ChevronDown,
    GeoAlt,
    Search,
    People,
    Plus,
    Trash3,
    X,
} from 'react-bootstrap-icons';

import airports from './airports.json';
import FlightLanding, { FLIGHT_RECENT_KEY } from './FlightLanding';
import { saveRecent } from '@/components/travel-landing/LandingSections';
import flightService from '../services/flightBookingService';

import './flights.css';
import toast from 'react-hot-toast';




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

/*
 * TripJack searchModifiers.pft (passenger fare type).
 * Special fares are adult-only.
 * NOTE: confirm the exact pft codes with the TripJack
 * search API doc; edit only this list if a code differs.
 */
const specialFares = [
    { value: 'REGULAR', label: 'Regular' },
    { value: 'STUDENT', label: 'Student' },
    { value: 'SENIOR_CITIZEN', label: 'Senior Citizen' },
    { value: 'ARMED_FORCES', label: 'Armed Forces' },
    { value: 'DOCTORS_NURSES', label: 'Doctors & Nurses' },
];

/*
 * Extra TripJack search toggles (sent inside searchModifiers).
 * NOTE: confirm the exact modifier keys with the TripJack
 * search API doc; edit only this list if a key differs.
 */
const searchToggles = [
    { key: 'directFlight', label: 'Direct flights only' },
    { key: 'ndc', label: 'NDC fares', modifier: 'isNDC' },
    { key: 'soto', label: 'SOTO fares', modifier: 'isSOTO' },
];

/*
 * TripJack searchQuery.preferredAirline
 */
const preferredAirlines = [
    { code: '', label: 'Any Airline' },
    { code: '6E', label: 'IndiGo' },
    { code: 'AI', label: 'Air India' },
    { code: 'IX', label: 'Air India Express' },
    { code: 'SG', label: 'SpiceJet' },
    { code: 'QP', label: 'Akasa Air' },
    { code: '9I', label: 'Alliance Air' },
    { code: 'EK', label: 'Emirates' },
    { code: 'QR', label: 'Qatar Airways' },
    { code: 'EY', label: 'Etihad Airways' },
    { code: 'SQ', label: 'Singapore Airlines' },
    { code: 'TG', label: 'Thai Airways' },
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


/*
 * Indian airports whose city in the airport data is not the name people
 * search for (data: "Vasco da Gama", "Mopa", "Bhuntar", ...).
 */
const DISPLAY_CITY = {
    GOI: 'Goa', GOX: 'Goa', KUU: 'Kullu', DED: 'Dehradun', SAG: 'Shirdi', RJA: 'Rajahmundry',
    KJB: 'Kurnool', JSA: 'Jaisalmer', TEZ: 'Tezpur', AYJ: 'Ayodhya', IXD: 'Prayagraj', CCJ: 'Kozhikode',
    IXB: 'Bagdogra', AJL: 'Aizawl', DXN: 'Noida', HSR: 'Rajkot', HWR: 'Ludhiana', HGI: 'Itanagar',
    MYQ: 'Mysuru', KQH: 'Ajmer', SDW: 'Sindhudurg', DHM: 'Dharamshala',
    DPS: 'Bali (Denpasar)',
};

// main airport of a city with several (London, Paris, New York, ...): shown first
const MAIN_HUBS = new Set(['LHR', 'CDG', 'JFK', 'DXB', 'NRT', 'ICN', 'PEK', 'FCO', 'MXP', 'IST', 'YYZ', 'KUL', 'BKK']);

const CITY_ALIASES = {
    DEL: ['Delhi', 'New Delhi', 'Gurgaon', 'Gurugram'],
    GOI: ['Goa', 'Dabolim', 'Vasco da Gama', 'South Goa'],
    GOX: ['Goa', 'Mopa', 'North Goa'],
    KUU: ['Kullu', 'Manali', 'Bhuntar'],
    DHM: ['Dharamshala', 'Dharamsala', 'Kangra', 'McLeod Ganj'],
    DED: ['Dehradun', 'Rishikesh', 'Mussoorie', 'Haridwar'],
    IXB: ['Bagdogra', 'Siliguri', 'Darjeeling'],
    SAG: ['Shirdi'],
    RJA: ['Rajahmundry', 'Rajamahendravaram'],
    KJB: ['Kurnool'],
    JSA: ['Jaisalmer'],
    TEZ: ['Tezpur'],
    AYJ: ['Ayodhya', 'Faizabad'],
    IXD: ['Prayagraj', 'Allahabad'],
    CCJ: ['Kozhikode', 'Calicut'],
    AJL: ['Aizawl'],
    DXN: ['Noida', 'Jewar'],
    HSR: ['Rajkot'],
    HWR: ['Ludhiana'],
    HGI: ['Itanagar'],
    MYQ: ['Mysuru', 'Mysore'],
    KQH: ['Ajmer', 'Kishangarh'],
    TRV: ['Trivandrum', 'Thiruvananthapuram'],
    PGH: ['Pantnagar', 'Nainital'],
    UDR: ['Udaipur'],
    IXU: ['Aurangabad', 'Chhatrapati Sambhajinagar'],
    VTZ: ['Vizag', 'Visakhapatnam'],
    TRZ: ['Trichy', 'Tiruchirappalli'],
    DPS: ['Bali', 'Denpasar'],
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
        .map((airport) => ({
            ...airport,
            // the name customers know ("Goa", not "Vasco da Gama")
            city: DISPLAY_CITY[airport.code] || airport.city,
            aliases: (CITY_ALIASES[airport.code] || []).map((alias) => alias.toLowerCase()),
        }))
    : [];


/*
 * Shown as soon as a city field is clicked
 * (before the user types anything).
 */
const POPULAR_AIRPORT_CODES = [
    'DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD',
    'GOI', 'PNQ', 'AMD', 'COK', 'DXB', 'SIN',
    'BKK', 'LHR',
];

const popularAirports = POPULAR_AIRPORT_CODES
    .map((code) =>
        airportList.find((airport) => airport.code === code)
    )
    .filter(Boolean);


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

    const wordStart = (text) =>
        text.startsWith(query) ||
        text.includes(` ${query}`) ||
        text.includes(`(${query}`) ||
        text.includes(`-${query}`);

    /*
     * Lower score = better. Match tier (0 code, 1 city / alias / keyword,
     * 2 a word starting with the text, 3 anywhere), +1.5 outside India
     * (so "hyderabad" shows HYD before Hyderabad, Pakistan and "goa" shows
     * Goa before Genova's code GOA), bigger airports first within a tier.
     */
    const SIZE = { large_airport: -0.3, medium_airport: 0 };

    return airportList
        .map((airport) => {
            const code = airport.code.toLowerCase();
            const city = airport.city.toLowerCase();
            const name = airport.name.toLowerCase();
            const keywords = [
                ...airport.keywords.toLowerCase().split(','),
                ...airport.aliases,
            ].map((word) => word.trim()).filter(Boolean);

            let tier = null;
            if (code === query) tier = 0;
            else if (city === query || keywords.includes(query)) tier = 1;
            else if (code.startsWith(query) || wordStart(city) || wordStart(name) || keywords.some(wordStart)) tier = 2;
            else if (city.includes(query) || name.includes(query) || keywords.some((word) => word.includes(query))) tier = 3;

            if (tier === null) return null;

            return {
                ...airport,
                score: tier +
                    (airport.country === 'IN' ? 0 : 1.5) +
                    (SIZE[airport.type] ?? 0.3) +
                    (MAIN_HUBS.has(airport.code) ? -0.1 : 0),
            };
        })
        .filter(Boolean)
        .sort((a, b) =>
            a.score - b.score ||
            a.city.localeCompare(b.city) ||
            a.name.localeCompare(b.name))
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

    /*
     * Text typed by the user. Empty means
     * "show popular cities" (TripJack style).
     */
    const [query, setQuery] = useState('');

    const [activeIndex, setActiveIndex] = useState(0);

    const suggestions = query
        ? getAirportSuggestions(query)
        : popularAirports;


    const openDropdown = (event) => {
        setQuery('');
        setActiveIndex(0);
        setOpen(true);
        event?.target?.select?.();
    };


    const handleChange = (event) => {
        const nextValue = event.target.value;

        /*
         * User changed the text,
         * so old airport code should be cleared.
         */
        onSelect({
            name: nextValue,
            code: '',
        });

        setQuery(nextValue);
        setActiveIndex(0);
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

        setQuery('');
        setOpen(false);
    };


    const handleKeyDown = (event) => {
        if (!open || !suggestions.length) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((prev) =>
                Math.min(prev + 1, suggestions.length - 1)
            );
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            handleSelect(suggestions[activeIndex]);
        } else if (event.key === 'Escape') {
            setOpen(false);
        }
    };


    return (
        <div className="tj-airport-autocomplete">

            <label className="tj-label">
                {label}
            </label>

            <div className="tj-location-field">

                <GeoAlt />

                <div className="flex-grow-1">

                    <input
                        type="text"
                        value={value}
                        onChange={handleChange}
                        onFocus={openDropdown}
                        onClick={() => setOpen(true)}
                        onBlur={() => setOpen(false)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        autoComplete="off"
                    />

                    {code && (
                        <span className="tj-selected-airport-code">
                            {code}
                        </span>
                    )}

                </div>

            </div>


            {open && (
                <div className="tj-airport-dropdown">

                    {!query && (
                        <div className="tj-airport-heading">
                            Popular Cities
                        </div>
                    )}

                    {suggestions.length > 0 ? (
                        suggestions.map((airport, index) => (
                            <button
                                key={`${airport.code}-${airport.name}`}
                                type="button"
                                className={
                                    index === activeIndex
                                        ? 'tj-airport-option active'
                                        : 'tj-airport-option'
                                }
                                onMouseDown={(event) =>
                                    event.preventDefault()
                                }
                                onMouseEnter={() =>
                                    setActiveIndex(index)
                                }
                                onClick={() =>
                                    handleSelect(airport)
                                }
                            >

                                <div className="tj-airport-code">
                                    {airport.code}
                                </div>

                                <div className="tj-airport-info">

                                    <strong>
                                        {airport.city || airport.name}
                                        {airport.country && (
                                            <small>, {airport.country}</small>
                                        )}
                                    </strong>

                                    <span>{airport.name}</span>

                                </div>

                            </button>
                        ))
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

/*
 * Restores a saved search (results page / back navigation).
 * Past dates are moved to today so TripJack does not reject them.
 */
const restoreSearch = (saved = {}) => {
    const next = { ...saved };

    if (!next.departureDate || next.departureDate < today) {
        next.departureDate = today;
    }

    if (next.returnDate && next.returnDate < next.departureDate) {
        next.returnDate = '';
    }

    return next;
};

const restoreSegments = (saved) =>
    Array.isArray(saved) && saved.length >= 2
        ? saved.map((segment) => ({
            ...createSegment(),
            ...segment,
            date:
                segment?.date && segment.date >= today
                    ? segment.date
                    : today,
        }))
        : [createSegment(), createSegment()];


/* =========================================================
   SEARCH FORM (used on /flights and on results "Modify")
========================================================= */

export function FlightSearchForm({
    initialData = null,
    onSearched = null,
    routePreset = null,
} = {}) {

    const router = useRouter();


    /* =====================================================
       SEARCH STATE
    ===================================================== */

    const [tripType, setTripType] =
        useState(initialData?.tripType || 'ONE_WAY');


    const [search, setSearch] =
        useState(() => ({
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

            ndc: false,

            soto: false,

            fareType: 'REGULAR',

            preferredAirline: '',

            ...restoreSearch(initialData?.search || {}),
        }));


    const [segments, setSegments] =
        useState(() =>
            restoreSegments(initialData?.segments)
        );


    const [passengerOpen, setPassengerOpen] =
        useState(false);

    const passengerRef = useRef(null);


    /*
     * Close travellers popover on outside click.
     */
    useEffect(() => {
        if (!passengerOpen) return undefined;

        const handleOutside = (event) => {
            if (!passengerRef.current?.contains(event.target)) {
                setPassengerOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutside);

        return () =>
            document.removeEventListener('mousedown', handleOutside);
    }, [passengerOpen]);


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

const updatePassenger = (type, value) => {
    setSearch((prev) => {
        const current = Number(prev[type]);

        const next = Math.max(
            type === 'adults' ? 1 : 0,
            current + value
        );

        // Infants cannot exceed adults
        if (
            type === 'infants' &&
            next > Number(prev.adults)
        ) {
            return prev;
        }

        // Maximum 9 travellers overall
        const totalTravellers =
            Number(prev.adults) +
            Number(prev.children) +
            Number(prev.infants);

        const nextTotal =
            totalTravellers + (next - current);

        if (nextTotal > 9) {
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
       POPULAR ROUTE (from parent page)
    ===================================================== */

    useEffect(() => {
        if (!routePreset) return;

        // a recent search: trip type, cities, dates (if still ahead) and travellers
        if (routePreset.search) {
            setTripType(routePreset.tripType || 'ONE_WAY');
            setSearch((prev) => ({ ...prev, ...restoreSearch(routePreset.search) }));
            return;
        }

        // a route, or only a destination (keeps the chosen departure city)
        setSearch((prev) => ({
            ...prev,
            from: routePreset.from ?? prev.from,
            fromCode: routePreset.fromCode ?? prev.fromCode,
            to: routePreset.to ?? prev.to,
            toCode: routePreset.toCode ?? prev.toCode,
        }));
    }, [routePreset]);


    /* =====================================================
       VALIDATION
    ===================================================== */

    const validateSearch = () => {

        /*
         * SPECIAL FARES (adult only)
         */
        if (
            search.fareType !== 'REGULAR' &&
            (Number(search.children) > 0 ||
                Number(search.infants) > 0)
        ) {
            toast.error(
                'Special fares are available for adult travellers only.'
            );

            return false;
        }


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


                ...(search.preferredAirline && {
                    preferredAirline: [
                        {
                            code:
                                search.preferredAirline,
                        },
                    ],
                }),


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


                /*
                 * Both true = all flights.
                 * Direct only = connecting off.
                 */
                searchModifiers: {

                    isDirectFlight: true,

                    isConnectingFlight:
                        !search.directFlight,

                    ...(search.fareType !== 'REGULAR' && {
                        pft: search.fareType,
                    }),

                    ...Object.fromEntries(
                        searchToggles
                            .filter((toggle) => toggle.modifier && search[toggle.key])
                            .map((toggle) => [toggle.modifier, true])
                    ),
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
            const saved = {
                search,
                tripType,
                segments,
                request: payload,
                response,
                searchedAt: new Date().toISOString(),
            };

            sessionStorage.setItem(
                'tripjack_flight_search',
                JSON.stringify(saved)
            );

            // New search => old "unavailable" marks are stale.
            sessionStorage.removeItem('tripjack_unavailable_flights');

            // "Your recent searches" on the flights page (this browser only)
            if (tripType !== 'MULTI_CITY') {
                saveRecent(FLIGHT_RECENT_KEY, {
                    key: [tripType, search.fromCode, search.toCode, search.departureDate, tripType === 'ROUND_TRIP' ? search.returnDate : '', search.adults, search.children, search.infants, search.cabinClass].join('|'),
                    tripType,
                    search: {
                        from: search.from,
                        fromCode: search.fromCode,
                        to: search.to,
                        toCode: search.toCode,
                        departureDate: search.departureDate,
                        returnDate: tripType === 'ROUND_TRIP' ? search.returnDate : '',
                        adults: search.adults,
                        children: search.children,
                        infants: search.infants,
                        cabinClass: search.cabinClass,
                    },
                });
            }


            if (onSearched) {
                onSearched(saved);
            } else {
                router.push('/flights/results');
            }

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
       TRAVELLERS FIELD (all trip types)
    ===================================================== */

    const renderTravellers = (className = '') => {
        const cabinLabel =
            cabinClasses.find((cabin) => cabin.value === search.cabinClass)?.label ||
            'Economy';

        return (
            <div
                className={`tj-field-col position-relative ${className}`}
                ref={passengerRef}
            >

                <label className="tj-label">
                    TRAVELLERS & CLASS
                </label>

                <button
                    type="button"
                    className="tj-simple-field tj-click-field w-100 text-start"
                    onClick={() =>
                        setPassengerOpen((prev) => !prev)
                    }
                >

                    <People />

                    <span className="tj-ellipsis">
                        {totalPassengers} Traveller
                        {totalPassengers !== 1 ? 's' : ''}, {cabinLabel}
                    </span>

                    <ChevronDown className="ms-auto" />

                </button>


                {passengerOpen && (
                    <div className="tj-passenger-popover">

                        {[
                            ['adults', 'Adults', '12+ years'],
                            ['children', 'Children', '2–11 years'],
                            ['infants', 'Infants', 'Below 2 years'],
                        ].map(([key, label, sub]) => (
                            <div
                                className="tj-pax-row"
                                key={key}
                            >

                                <div>
                                    <strong>{label}</strong>
                                    <small>{sub}</small>
                                </div>

                                <div className="tj-counter">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            updatePassenger(key, -1)
                                        }
                                    >
                                        −
                                    </button>

                                    <b>{search[key]}</b>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            updatePassenger(key, 1)
                                        }
                                    >
                                        +
                                    </button>

                                </div>

                            </div>
                        ))}

                        <div className="tj-cabin-title">
                            Class
                        </div>

                        <div className="tj-cabin-list">
                            {cabinClasses.map((cabin) => (
                                <button
                                    key={cabin.value}
                                    type="button"
                                    className={
                                        search.cabinClass === cabin.value
                                            ? 'tj-chip active'
                                            : 'tj-chip'
                                    }
                                    onClick={() =>
                                        updateSearch('cabinClass', cabin.value)
                                    }
                                >
                                    {cabin.label}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="tj-pax-done"
                            onClick={() =>
                                setPassengerOpen(false)
                            }
                        >
                            Done
                        </button>

                    </div>
                )}

            </div>
        );
    };


    /* =====================================================
       RENDER
    ===================================================== */

    return (
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
                onSubmit={handleSearch}
                className="tj-search-form"
            >

                {tripType !== 'MULTI_CITY' ? (

                    /* =================================================
                       ONE WAY / ROUND TRIP (single row)
                    ================================================= */

                    <div className="tj-search-grid">

                        <div className="tj-route-pair">

                            <AirportAutocomplete
                                label="FROM"
                                placeholder="Departure city"
                                value={search.from}
                                code={search.fromCode}
                                onSelect={({ name, code }) =>
                                    setSearch((prev) => ({
                                        ...prev,
                                        from: name,
                                        fromCode: code,
                                    }))
                                }
                            />

                            <button
                                type="button"
                                className="tj-swap"
                                onClick={swapAirports}
                                aria-label="Swap airports"
                            >
                                <ArrowLeftRight />
                            </button>

                            <AirportAutocomplete
                                label="TO"
                                placeholder="Destination city"
                                value={search.to}
                                code={search.toCode}
                                onSelect={({ name, code }) =>
                                    setSearch((prev) => ({
                                        ...prev,
                                        to: name,
                                        toCode: code,
                                    }))
                                }
                            />

                        </div>


                        {/* DEPARTURE */}

                        <div className="tj-field-col">

                            <label className="tj-label">
                                DEPARTURE
                            </label>

                            <div className="tj-simple-field">
                                <Calendar3 />
                                <input
                                    type="date"
                                    min={today}
                                    value={search.departureDate}
                                    onChange={(event) =>
                                        updateSearch(
                                            'departureDate',
                                            event.target.value
                                        )
                                    }
                                />
                            </div>

                        </div>


                        {/* RETURN (click to switch to round trip) */}

                        <div className="tj-field-col">

                            <label className="tj-label">
                                RETURN
                            </label>

                            {tripType === 'ROUND_TRIP' ? (
                                <div className="tj-simple-field">
                                    <Calendar3 />
                                    <input
                                        type="date"
                                        min={search.departureDate || today}
                                        value={search.returnDate}
                                        onChange={(event) =>
                                            updateSearch(
                                                'returnDate',
                                                event.target.value
                                            )
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="tj-clear-return"
                                        aria-label="Remove return"
                                        onClick={() => {
                                            setTripType('ONE_WAY');
                                            updateSearch('returnDate', '');
                                        }}
                                    >
                                        <X />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="tj-simple-field tj-click-field tj-add-return w-100 text-start"
                                    onClick={() =>
                                        setTripType('ROUND_TRIP')
                                    }
                                >
                                    <Plus />
                                    <span>Add return</span>
                                </button>
                            )}

                        </div>


                        {renderTravellers()}

                    </div>

                ) : (

                    /* =================================================
                       MULTI CITY
                    ================================================= */

                    <div className="tj-multicity-list">

                        {segments.map((segment, index) => (
                            <div
                                className="tj-multi-row"
                                key={index}
                            >

                                <div className="tj-sector-number">
                                    {index + 1}
                                </div>

                                <div className="tj-multi-airport">
                                    <AirportAutocomplete
                                        label="FROM"
                                        placeholder="Departure city"
                                        value={segment.from}
                                        code={segment.fromCode}
                                        onSelect={({ name, code }) => {
                                            updateSegment(index, 'from', name);
                                            updateSegment(index, 'fromCode', code);
                                        }}
                                    />
                                </div>

                                <div className="tj-multi-airport">
                                    <AirportAutocomplete
                                        label="TO"
                                        placeholder="Destination city"
                                        value={segment.to}
                                        code={segment.toCode}
                                        onSelect={({ name, code }) => {
                                            updateSegment(index, 'to', name);
                                            updateSegment(index, 'toCode', code);
                                        }}
                                    />
                                </div>

                                <div className="tj-field-col">
                                    <label className="tj-label">
                                        DATE
                                    </label>
                                    <div className="tj-simple-field">
                                        <Calendar3 />
                                        <input
                                            type="date"
                                            min={
                                                segments[index - 1]?.date ||
                                                today
                                            }
                                            value={segment.date}
                                            onChange={(event) =>
                                                updateSegment(
                                                    index,
                                                    'date',
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {segments.length > 2 ? (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger tj-delete-sector"
                                        onClick={() =>
                                            removeSegment(index)
                                        }
                                        aria-label="Remove sector"
                                    >
                                        <Trash3 />
                                    </button>
                                ) : (
                                    <span />
                                )}

                            </div>
                        ))}

                        <div className="tj-multi-footer">

                            <button
                                type="button"
                                className="tj-add-sector"
                                onClick={addSegment}
                            >
                                <Plus />
                                Add another city
                            </button>

                            {renderTravellers('tj-multi-travellers')}

                        </div>

                    </div>
                )}


                {/* =================================================
                    OPTIONS: SPECIAL FARES / TOGGLES / AIRLINE
                ================================================= */}

                <div className="tj-search-options">

                    <div className="tj-option-group">

                        <span className="tj-label">
                            SPECIAL FARES
                        </span>

                        <div className="tj-chip-list">
                            {specialFares.map((fare) => (
                                <button
                                    key={fare.value}
                                    type="button"
                                    className={
                                        search.fareType === fare.value
                                            ? 'tj-chip active'
                                            : 'tj-chip'
                                    }
                                    onClick={() =>
                                        updateSearch('fareType', fare.value)
                                    }
                                >
                                    {fare.label}
                                </button>
                            ))}
                        </div>

                    </div>


                    <div className="tj-option-group">

                        <span className="tj-label">
                            MORE OPTIONS
                        </span>

                        <div className="tj-check-list">
                            {searchToggles.map((toggle) => (
                                <label
                                    key={toggle.key}
                                    className="tj-check"
                                >
                                    <input
                                        type="checkbox"
                                        checked={Boolean(search[toggle.key])}
                                        onChange={(event) =>
                                            updateSearch(
                                                toggle.key,
                                                event.target.checked
                                            )
                                        }
                                    />
                                    {toggle.label}
                                </label>
                            ))}
                        </div>

                    </div>


                    <div className="tj-option-group tj-preferred-airline">

                        <label className="tj-label">
                            PREFERRED AIRLINE
                        </label>

                        <div className="tj-simple-field tj-small-field">
                            <select
                                value={search.preferredAirline}
                                onChange={(event) =>
                                    updateSearch(
                                        'preferredAirline',
                                        event.target.value
                                    )
                                }
                            >
                                {preferredAirlines.map((airline) => (
                                    <option
                                        key={airline.code || 'ANY'}
                                        value={airline.code}
                                    >
                                        {airline.code
                                            ? `${airline.label} (${airline.code})`
                                            : airline.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>


                    <button
                        type="submit"
                        className="tj-search-button"
                        disabled={loading}
                    >
                        <Search />
                        {loading
                            ? 'Searching...'
                            : 'Search Flights'}
                    </button>

                </div>

            </form>

        </div>
    );
}


/* =========================================================
   FLIGHTS PAGE
========================================================= */

export default function FlightsClient() {

    /*
     * Restore last search so going back from results
     * does not clear the form.
     */
    const storedSearch = useSyncExternalStore(
        () => () => {},
        () => sessionStorage.getItem('tripjack_flight_search'),
        () => null
    );

    const savedSearch = useMemo(() => {
        if (!storedSearch) return null;

        try {
            return JSON.parse(storedSearch);
        } catch (error) {
            console.error('Unable to restore flight search:', error);
            return null;
        }
    }, [storedSearch]);

    const [routePreset, setRoutePreset] = useState(null);


    const selectPopularRoute = (route) => {
        setRoutePreset({ ...route });

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };


    return (
        <main className="tj-flight-page">

            {/* =================================================
                HERO
            ================================================= */}

            <section className="tj-flight-hero">

                <div className="container">

                    <div className="tj-hero-copy text-center text-white">

                        <p>
                            Find the right flight,
                            compare fares and book
                            your journey with ease.
                        </p>

                    </div>


                    <FlightSearchForm
                        key={savedSearch?.searchedAt || (savedSearch ? 'restored' : 'fresh')}
                        initialData={savedSearch}
                        routePreset={routePreset}
                    />

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
                                        through Travel Forex.
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


            {/* =================================================
                DESTINATIONS, RECENT SEARCHES, TIPS, FAQ
            ================================================= */}

            <FlightLanding onPreset={selectPopularRoute} />

        </main>
    );
}