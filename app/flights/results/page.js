'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import './results.css';
import './flight-results-filters.css';
import './flight-results-mobile.css';
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

const getFareList = (flight) => {
    const list = Array.isArray(flight?.totalPriceList)
        ? flight.totalPriceList
        : Array.isArray(flight?.priceList)
            ? flight.priceList
            : [];
    return list;
};

const getFareValue = (fare) => Number(
    fare?.fd?.ADULT?.fC?.TF ??
    fare?.fd?.ADULT?.fC?.NF ??
    fare?.fare ?? fare?.amount ?? 0
) || 0;

const getLowestFlightPrice = (flight) => {
    const prices = getFareList(flight).map(getFareValue).filter((price) => price > 0);
    return prices.length ? Math.min(...prices) : Number(getFlightPrice(flight)) || 0;
};

const getDepartureHour = (flight) => {
    const raw = getFirstSegment(flight)?.dt;
    if (!raw) return null;
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date.getHours();
    const match = String(raw).match(/T(\d{2}):/);
    return match ? Number(match[1]) : null;
};

const getArrivalHour = (flight) => {
    const raw = getLastSegment(flight)?.at;
    if (!raw) return null;
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date.getHours();
    const match = String(raw).match(/T(\d{2}):/);
    return match ? Number(match[1]) : null;
};

const getFlightAirlineCodes = (flight) => [...new Set(
    getSegments(flight).map((segment) => segment?.fD?.aI?.code).filter(Boolean)
)];

const getFareTypeLabel = (fare) => {
    const value = String(
        fare?.fareType ?? fare?.fareIdentifier ?? fare?.ft ??
        fare?.fareName ?? fare?.fareBasis ?? fare?.fd?.ADULT?.fareType ?? ''
    ).toLowerCase();
    if (/ndc/.test(value)) return 'NDC';
    if (/corporate|sme/.test(value)) return 'CORPORATE';
    if (/business/.test(value)) return 'BUSINESS';
    return 'STANDARD';
};

const getFlightTerminals = (flight) => getSegments(flight).flatMap((segment) => [
    segment?.da?.terminal, segment?.aa?.terminal,
    segment?.da?.terminalName, segment?.aa?.terminalName,
].filter(Boolean).map(String));

const getFlightAirportCodes = (flight) => getSegments(flight).flatMap((segment) => [
    segment?.da?.code, segment?.aa?.code,
].filter(Boolean).map(String));

const getLayoverAirportCodes = (flight) => {
    const segments = getSegments(flight);
    return segments.slice(0, -1).map((segment) => segment?.aa?.code).filter(Boolean);
};

const getLayoverMinutes = (flight) => {
    const segments = getSegments(flight);
    return segments.slice(0, -1).reduce((total, segment, index) => {
        const arrival = new Date(segment?.at).getTime();
        const nextDeparture = new Date(segments[index + 1]?.dt).getTime();
        if (!Number.isFinite(arrival) || !Number.isFinite(nextDeparture) || nextDeparture < arrival) return total;
        return total + Math.round((nextDeparture - arrival) / 60000);
    }, 0);
};

const formatISODate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

    const [filtersOpen, setFiltersOpen] = useState(true);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [filterState, setFilterState] = useState({
        minPrice: '', maxPrice: '', stops: [], departureSlots: [], arrivalSlots: [],
        airlines: [], baggageOnly: false, fareTypes: [], flightNumber: '',
        terminal: [], airport: [], layoverAirport: [], maxDuration: '', maxLayoverDuration: '',
        hideNearbyAirports: false, specificDepartureStart: '', specificDepartureEnd: '',
        specificArrivalStart: '', specificArrivalEnd: '',
    });
    const [sortBy, setSortBy] = useState('recommended');
    const [airlineQuery, setAirlineQuery] = useState('');
    const [dateSearchLoading, setDateSearchLoading] = useState(false);
    const [dateError, setDateError] = useState('');
    const [compareFlightIds, setCompareFlightIds] = useState([]);
    const [showCompare, setShowCompare] = useState(false);
    const [expandedFilters, setExpandedFilters] = useState({
        stops: true, departure: true, arrival: true, baggage: true, fareType: true,
        flightNumber: true, airlines: true, terminal: false, airport: false,
        layover: false, duration: false, layoverDuration: false,
    });
    const [flightNumberEntries, setFlightNumberEntries] = useState([]);
    const [flightNumberDraft, setFlightNumberDraft] = useState('');


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


    const allVisibleSourceFlights = useMemo(
        () => visibleFlightLegs.flatMap((leg) => leg.flights || []),
        [visibleFlightLegs]
    );

    const priceBounds = useMemo(() => {
        const prices = allVisibleSourceFlights.flatMap((flight) => {
            const fares = getFareList(flight).map(getFareValue).filter((price) => price > 0);
            return fares.length ? fares : [getFlightPrice(flight)].filter((price) => price > 0);
        });
        if (!prices.length) return { min: 0, max: 0 };
        return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
    }, [allVisibleSourceFlights]);

    const filterOptions = useMemo(() => {
        const airlineMap = new Map();
        const terminals = new Set();
        const airports = new Set();
        const layovers = new Set();
        allVisibleSourceFlights.forEach((flight) => {
            getSegments(flight).forEach((segment) => {
                const code = segment?.fD?.aI?.code;
                if (code) airlineMap.set(code, segment?.fD?.aI?.name || code);
            });
            getFlightTerminals(flight).forEach((item) => terminals.add(item));
            getFlightAirportCodes(flight).forEach((item) => airports.add(item));
            getLayoverAirportCodes(flight).forEach((item) => layovers.add(item));
        });
        return {
            airlines: [...airlineMap.entries()].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name)),
            terminals: [...terminals].sort(), airports: [...airports].sort(), layovers: [...layovers].sort(),
        };
    }, [allVisibleSourceFlights]);

    const getFilteredFlights = (leg) => {
        let flights = [...(leg?.flights || [])];
        const f = filterState;
        const matchesSlot = (hour, slots) => {
            if (!slots.length) return true;
            if (hour === null || hour === undefined) return false;
            const slot = hour < 6 ? '00-06' : hour < 12 ? '06-12' : hour < 18 ? '12-18' : '18-24';
            return slots.includes(slot);
        };
        const matchesTimeRange = (hour, start, end) => {
            if (!start && !end) return true;
            if (hour === null || hour === undefined) return false;
            const startHour = start ? Number(start.split(':')[0]) + Number(start.split(':')[1] || 0) / 60 : 0;
            const endHour = end ? Number(end.split(':')[0]) + Number(end.split(':')[1] || 0) / 60 : 24;
            const hourValue = hour;
            return startHour <= endHour ? hourValue >= startHour && hourValue <= endHour : hourValue >= startHour || hourValue <= endHour;
        };
        flights = flights.filter((flight) => {
            const segments = getSegments(flight);
            const stops = getFlightStops(flight);
            const price = getLowestFlightPrice(flight);
            const departureHour = getDepartureHour(flight);
            const arrivalHour = getArrivalHour(flight);
            const airlineCodes = getFlightAirlineCodes(flight);
            const allFares = getFareList(flight);
            const fareTypes = allFares.map(getFareTypeLabel);
            const flightNums = getFlightNumbers(flight).map((n) => n.replace(/[^a-z0-9]/gi, '').toLowerCase());
            const terminalValues = getFlightTerminals(flight);
            const airportValues = getFlightAirportCodes(flight);
            const layoverValues = getLayoverAirportCodes(flight);
            const baggageValues = allFares.flatMap((fare) => {
                const adult = fare?.fd?.ADULT || {};
                return [adult?.bI?.iB, adult?.baggage?.checkIn, adult?.baggage?.checkin, adult?.checkInBaggage].filter(Boolean);
            });
            const hasCheckInBaggage = baggageValues.some((value) => /\d/.test(String(value)) && !/^0/.test(String(value))) ||
                allFares.some((fare) => Boolean(fare?.fd?.ADULT?.baggage?.checkIn || fare?.fd?.ADULT?.checkInBaggage));
            if (f.stops.length && !f.stops.includes(stops >= 3 ? '3+' : String(stops))) return false;
            if (f.minPrice !== '' && price < Number(f.minPrice)) return false;
            if (f.maxPrice !== '' && price > Number(f.maxPrice)) return false;
            if (!matchesSlot(departureHour, f.departureSlots)) return false;
            if (!matchesSlot(arrivalHour, f.arrivalSlots)) return false;
            if (!matchesTimeRange(departureHour, f.specificDepartureStart, f.specificDepartureEnd)) return false;
            if (!matchesTimeRange(arrivalHour, f.specificArrivalStart, f.specificArrivalEnd)) return false;
            if (f.airlines.length && !airlineCodes.some((code) => f.airlines.includes(code))) return false;
            if (f.baggageOnly && !hasCheckInBaggage) return false;
            if (f.fareTypes.length && !f.fareTypes.some((type) => fareTypes.includes(type))) return false;
            if (flightNumberEntries.length && !flightNumberEntries.some((entry) => flightNums.some((num) => num.includes(entry.toLowerCase().replace(/[^a-z0-9]/g, ''))))) return false;
            if (f.terminal.length && !f.terminal.some((value) => terminalValues.includes(value))) return false;
            if (f.airport.length && !f.airport.some((value) => airportValues.includes(value))) return false;
            if (f.layoverAirport.length && !f.layoverAirport.some((value) => layoverValues.includes(value))) return false;
            if (f.maxDuration !== '' && getFlightDuration(flight) > Number(f.maxDuration)) return false;
            if (f.maxLayoverDuration !== '' && getLayoverMinutes(flight) > Number(f.maxLayoverDuration)) return false;
            if (f.hideNearbyAirports) {
                const expectedFrom = leg?.route?.fromCityOrAirport?.code;
                const expectedTo = leg?.route?.toCityOrAirport?.code;
                if ((expectedFrom && getFirstSegment(flight)?.da?.code && expectedFrom !== getFirstSegment(flight)?.da?.code) ||
                    (expectedTo && getLastSegment(flight)?.aa?.code && expectedTo !== getLastSegment(flight)?.aa?.code)) return false;
            }
            return true;
        });
        const minPrice = (flight) => getLowestFlightPrice(flight) || Infinity;
        if (sortBy === 'price') flights.sort((a, b) => minPrice(a) - minPrice(b));
        else if (sortBy === 'duration') flights.sort((a, b) => getFlightDuration(a) - getFlightDuration(b));
        else if (sortBy === 'departure') flights.sort((a, b) => (new Date(getFirstSegment(a)?.dt).getTime() || 0) - (new Date(getFirstSegment(b)?.dt).getTime() || 0));
        else if (sortBy === 'arrival') flights.sort((a, b) => (new Date(getLastSegment(a)?.at).getTime() || 0) - (new Date(getLastSegment(b)?.at).getTime() || 0));
        return flights;
    };

    const filteredFlightCount = visibleFlightLegs.reduce((sum, leg) => sum + getFilteredFlights(leg).length, 0);
    const activeDateIndex = Math.max(0, flightLegs.findIndex((leg) => leg.key === activeLegKey));
    const activeDate = routeInfos?.[activeDateIndex]?.travelDate ||
        (activeDateIndex === 0 ? search?.departureDate : search?.returnDate) || search?.departureDate;
    const dateStrip = useMemo(() => {
        if (!activeDate) return [];
        const base = new Date(`${activeDate}T12:00:00`);
        if (Number.isNaN(base.getTime())) return [];
        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(base);
            date.setDate(base.getDate() + index - 3);
            return formatISODate(date);
        });
    }, [activeDate]);

    const updateFilter = (key, value) => setFilterState((prev) => ({ ...prev, [key]: value }));
    const toggleFilterValue = (key, value) => setFilterState((prev) => ({
        ...prev,
        [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
    }));
    const resetFilters = () => {
        setFilterState({ minPrice: '', maxPrice: '', stops: [], departureSlots: [], arrivalSlots: [], airlines: [], baggageOnly: false, fareTypes: [], flightNumber: '', terminal: [], airport: [], layoverAirport: [], maxDuration: '', maxLayoverDuration: '', hideNearbyAirports: false, specificDepartureStart: '', specificDepartureEnd: '', specificArrivalStart: '', specificArrivalEnd: '' });
        setFlightNumberEntries([]); setFlightNumberDraft(''); setAirlineQuery(''); setSortBy('recommended');
    };
    const activeFilterChips = [
        ...filterState.stops.map((value) => ({ key: 'stops', value, label: value === '0' ? 'Non-stop' : `${value} stop${value === '1' ? '' : 's'}` })),
        ...filterState.departureSlots.map((value) => ({ key: 'departureSlots', value, label: `Depart ${value}` })),
        ...filterState.arrivalSlots.map((value) => ({ key: 'arrivalSlots', value, label: `Arrive ${value}` })),
        ...filterState.airlines.map((value) => ({ key: 'airlines', value, label: filterOptions.airlines.find((a) => a.code === value)?.name || value })),
        ...filterState.fareTypes.map((value) => ({ key: 'fareTypes', value, label: value })),
        ...filterState.terminal.map((value) => ({ key: 'terminal', value, label: `Terminal ${value}` })),
        ...filterState.airport.map((value) => ({ key: 'airport', value, label: `Airport ${value}` })),
        ...filterState.layoverAirport.map((value) => ({ key: 'layoverAirport', value, label: `Layover ${value}` })),
        ...(filterState.minPrice !== '' ? [{ key: 'minPrice', value: filterState.minPrice, label: `Min ₹${filterState.minPrice}` }] : []),
        ...(filterState.maxPrice !== '' ? [{ key: 'maxPrice', value: filterState.maxPrice, label: `Max ₹${filterState.maxPrice}` }] : []),
        ...(filterState.baggageOnly ? [{ key: 'baggageOnly', value: true, label: 'Check-in baggage' }] : []),
        ...(filterState.specificDepartureStart || filterState.specificDepartureEnd ? [{ key: 'departureTimeRange', value: 'departureTimeRange', label: `Depart ${filterState.specificDepartureStart || '00:00'}–${filterState.specificDepartureEnd || '23:59'}` }] : []),
        ...(filterState.specificArrivalStart || filterState.specificArrivalEnd ? [{ key: 'arrivalTimeRange', value: 'arrivalTimeRange', label: `Arrive ${filterState.specificArrivalStart || '00:00'}–${filterState.specificArrivalEnd || '23:59'}` }] : []),
        ...(filterState.maxDuration !== '' ? [{ key: 'maxDuration', value: filterState.maxDuration, label: `Duration ≤ ${formatDuration(Number(filterState.maxDuration))}` }] : []),
        ...(filterState.maxLayoverDuration !== '' ? [{ key: 'maxLayoverDuration', value: filterState.maxLayoverDuration, label: `Layover ≤ ${formatDuration(Number(filterState.maxLayoverDuration))}` }] : []),
        ...(filterState.hideNearbyAirports ? [{ key: 'hideNearbyAirports', value: true, label: 'Hide nearby airports' }] : []),
        ...flightNumberEntries.map((value) => ({ key: 'flightNumberEntries', value, label: `Flight ${value}` })),
    ];
    const removeFilterChip = (chip) => {
        if (['stops', 'departureSlots', 'arrivalSlots', 'airlines', 'fareTypes', 'terminal', 'airport', 'layoverAirport'].includes(chip.key)) toggleFilterValue(chip.key, chip.value);
        else if (chip.key === 'flightNumberEntries') setFlightNumberEntries((prev) => prev.filter((item) => item !== chip.value));
        else if (chip.key === 'baggageOnly' || chip.key === 'hideNearbyAirports') updateFilter(chip.key, false);
        else if (chip.key === 'departureTimeRange') { updateFilter('specificDepartureStart', ''); updateFilter('specificDepartureEnd', ''); }
        else if (chip.key === 'arrivalTimeRange') { updateFilter('specificArrivalStart', ''); updateFilter('specificArrivalEnd', ''); }
        else updateFilter(chip.key, '');
    };

    const searchDate = async (date) => {
        if (!searchData?.request?.searchQuery?.routeInfos?.length) {
            toast.error('Original TripJack search request is unavailable. Please modify search and try again.');
            return;
        }
        const routeIndex = tripType === 'MULTI_CITY' ? activeDateIndex : activeDateIndex;
        const oldRouteInfos = searchData.request.searchQuery.routeInfos;
        if (!oldRouteInfos[routeIndex]) return;
        if (tripType === 'ROUND_TRIP' && routeIndex === 0 && searchData.search?.returnDate && date > searchData.search.returnDate) {
            toast.error('Departure date cannot be after return date.'); return;
        }
        if (tripType === 'ROUND_TRIP' && routeIndex === 1 && searchData.search?.departureDate && date < searchData.search.departureDate) {
            toast.error('Return date cannot be before departure date.'); return;
        }
        const request = {
            ...searchData.request,
            searchQuery: {
                ...searchData.request.searchQuery,
                routeInfos: oldRouteInfos.map((route, index) => index === routeIndex ? { ...route, travelDate: date } : route),
            },
        };
        const nextSearch = { ...searchData.search };
        if (tripType === 'MULTI_CITY') {
            const nextSegments = [...(searchData.segments || [])];
            if (nextSegments[routeIndex]) nextSegments[routeIndex] = { ...nextSegments[routeIndex], date };
            try {
                setDateSearchLoading(true); setDateError(''); setSelectedFlights({}); setExpandedFlight(null);
                const response = await flightService.search(request);
                const updated = { ...searchData, search: nextSearch, segments: nextSegments, request, response };
                setSearchData(updated); sessionStorage.setItem('tripjack_flight_search', JSON.stringify(updated));
                resetFilters(); toast.success('Flights updated for selected date.');
            } catch (error) {
                console.error('TripJack date search failed:', error);
                setDateError(error?.response?.data?.message || error?.message || 'Unable to fetch flights for this date.');
                toast.error(error?.response?.data?.message || error?.message || 'Unable to fetch flights for this date.');
            } finally { setDateSearchLoading(false); }
            return;
        }
        if (routeIndex === 0) nextSearch.departureDate = date;
        else nextSearch.returnDate = date;
        try {
            setDateSearchLoading(true); setDateError(''); setSelectedFlights({}); setExpandedFlight(null);
            const response = await flightService.search(request);
            const updated = { ...searchData, search: nextSearch, request, response };
            setSearchData(updated); sessionStorage.setItem('tripjack_flight_search', JSON.stringify(updated));
            resetFilters(); toast.success('Flights updated for selected date.');
        } catch (error) {
            console.error('TripJack date search failed:', error);
            setDateError(error?.response?.data?.message || error?.message || 'Unable to fetch flights for this date.');
            toast.error(error?.response?.data?.message || error?.message || 'Unable to fetch flights for this date.');
        } finally { setDateSearchLoading(false); }
    };

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

    const totalFlights = filteredFlightCount;

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
                    className="results-container flight-results-workspace"
                    style={{ marginTop: '20px' }}
                >
                    <div className="mobile-filter-actions">
                        <button
                            type="button"
                            className="mobile-filter-trigger"
                            onClick={() => setMobileFiltersOpen(true)}
                            aria-label="Open flight filters"
                            aria-expanded={mobileFiltersOpen}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 6h16M7 12h10m-7 6h4" />
                            </svg>
                            <span>Filters</span>
                            {activeFilterChips.length > 0 && (
                                <span className="mobile-filter-count">{activeFilterChips.length}</span>
                            )}
                        </button>
                    </div>
                    {mobileFiltersOpen && (
                        <button
                            type="button"
                            className="mobile-filter-backdrop"
                            aria-label="Close filters"
                            onClick={() => setMobileFiltersOpen(false)}
                        />
                    )}
                    <aside className={`flight-filter-sidebar ${filtersOpen ? '' : 'collapsed'} ${mobileFiltersOpen ? 'mobile-open' : ''}`}>

                        <div className="filter-sidebar-heading">
                            <strong>Filters</strong>
                            <button
                                type="button"
                                className="mobile-filter-close"
                                onClick={() => setMobileFiltersOpen(false)}
                                aria-label="Close filters"
                            >×</button>
                            <button type="button" className="filter-text-button" onClick={resetFilters}>RESET ALL</button>
                            <button type="button" className="filter-collapse-button" onClick={() => setFiltersOpen((value) => !value)} aria-label="Toggle filters">{filtersOpen ? '−' : '+'}</button>
                        </div>
                        {filtersOpen && <>
                            <div className="filter-applied"><div className="filter-section-title">Applied Filters <button type="button" onClick={resetFilters}>CLEAR ALL</button></div>
                                <div className="filter-chip-list">{activeFilterChips.length ? activeFilterChips.map((chip) => <button type="button" className="filter-chip" key={`${chip.key}-${chip.value}`} onClick={() => removeFilterChip(chip)}>{chip.label} <span>×</span></button>) : <span className="filter-muted">No filters applied</span>}</div>
                            </div>
                            <div className="filter-section"><h3>Price <button type="button" onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }}>CLEAR</button></h3>
                                <div className="filter-price-values"><label>Min ₹<input type="number" min="0" placeholder={String(priceBounds.min)} value={filterState.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} /></label><label>Max ₹<input type="number" min="0" placeholder={String(priceBounds.max)} value={filterState.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} /></label></div>
                                <div className="filter-price-range"><input aria-label="Minimum price" type="range" min={priceBounds.min} max={Math.max(priceBounds.max, priceBounds.min + 1)} value={Math.max(priceBounds.min, Math.min(Number(filterState.minPrice || priceBounds.min), priceBounds.max || priceBounds.min))} onChange={(e) => updateFilter('minPrice', e.target.value)} /><input aria-label="Maximum price" type="range" min={priceBounds.min} max={Math.max(priceBounds.max, priceBounds.min + 1)} value={Math.max(priceBounds.min, Math.min(Number(filterState.maxPrice || priceBounds.max), priceBounds.max || priceBounds.min))} onChange={(e) => updateFilter('maxPrice', e.target.value)} /></div>
                            </div>
                            <div className="filter-section"><h3>Stops</h3><div className="filter-button-grid stops-grid">{[['0','Non-stop'],['1','1 Stop'],['2','2 Stops'],['3+','3+ Stops']].map(([value,label]) => <button type="button" key={value} className={filterState.stops.includes(value) ? 'selected' : ''} onClick={() => toggleFilterValue('stops', value)}>{label}</button>)}</div></div>
                            <div className="filter-section"><h3>Departure From {activeLeg?.route?.fromCityOrAirport?.name || getFlightRoute(activeLeg?.flights?.[0], activeLeg?.route).from || ''}</h3><div className="filter-button-grid time-grid">{[['00-06','☀','00–06'],['06-12','☼','06–12'],['12-18','☀','12–18'],['18-24','☾','18–24']].map(([value,icon,label]) => <button type="button" key={value} className={filterState.departureSlots.includes(value) ? 'selected' : ''} onClick={() => toggleFilterValue('departureSlots', value)}><span>{icon}</span>{label}</button>)}</div><div className="filter-specific-time"><label>Specific timeframe <span>Departure</span></label><div><input aria-label="Departure start time" type="time" value={filterState.specificDepartureStart} onChange={(e) => updateFilter('specificDepartureStart', e.target.value)} /><input aria-label="Departure end time" type="time" value={filterState.specificDepartureEnd} onChange={(e) => updateFilter('specificDepartureEnd', e.target.value)} /></div></div></div>
                            <div className="filter-section"><h3>Arrival To {activeLeg?.route?.toCityOrAirport?.name || getFlightRoute(activeLeg?.flights?.[0], activeLeg?.route).to || ''}</h3><div className="filter-button-grid time-grid">{[['00-06','☀','00–06'],['06-12','☼','06–12'],['12-18','☀','12–18'],['18-24','☾','18–24']].map(([value,icon,label]) => <button type="button" key={value} className={filterState.arrivalSlots.includes(value) ? 'selected' : ''} onClick={() => toggleFilterValue('arrivalSlots', value)}><span>{icon}</span>{label}</button>)}</div><div className="filter-specific-time"><label>Specific timeframe <span>Arrival</span></label><div><input aria-label="Arrival start time" type="time" value={filterState.specificArrivalStart} onChange={(e) => updateFilter('specificArrivalStart', e.target.value)} /><input aria-label="Arrival end time" type="time" value={filterState.specificArrivalEnd} onChange={(e) => updateFilter('specificArrivalEnd', e.target.value)} /></div></div></div>
                            <div className="filter-section"><h3>Baggage</h3><label className="filter-check"><input type="checkbox" checked={filterState.baggageOnly} onChange={(e) => updateFilter('baggageOnly', e.target.checked)} /> Show Check-in Baggage</label></div>
                            <div className="filter-section"><h3>Fare Type <button type="button" onClick={() => updateFilter('fareTypes', [])}>CLEAR</button></h3>{[['STANDARD','Standard'],['NDC','NDC'],['CORPORATE','Corporate / SME'],['BUSINESS','Business']].map(([value,label]) => <label className="filter-check" key={value}><input type="checkbox" checked={filterState.fareTypes.includes(value)} onChange={() => toggleFilterValue('fareTypes', value)} /> {label} <span className="filter-muted">({allVisibleSourceFlights.filter((flight) => getFareList(flight).some((fare) => getFareTypeLabel(fare) === value)).length})</span></label>)}</div>
                            <div className="filter-section"><h3>Flight Number <button type="button" onClick={() => { setFlightNumberEntries([]); setFlightNumberDraft(''); }}>CLEAR</button></h3><div className="filter-flight-number"><input placeholder="e.g. 123 or 6E-123" value={flightNumberDraft} onChange={(e) => setFlightNumberDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && flightNumberDraft.trim()) { e.preventDefault(); setFlightNumberEntries((prev) => [...new Set([...prev, flightNumberDraft.trim()])]); setFlightNumberDraft(''); } }} /><button type="button" onClick={() => { if (flightNumberDraft.trim()) { setFlightNumberEntries((prev) => [...new Set([...prev, flightNumberDraft.trim()])]); setFlightNumberDraft(''); } }}>＋ Add</button></div>{flightNumberEntries.map((value) => <span className="filter-inline-chip" key={value}>{value}<button type="button" onClick={() => setFlightNumberEntries((prev) => prev.filter((item) => item !== value))}>×</button></span>)}</div>
                            <div className="filter-section"><h3>Airlines <button type="button" onClick={() => { updateFilter('airlines', []); setAirlineQuery(''); }}>CLEAR</button></h3><input className="filter-search-input" placeholder="⌕ Search airline name" value={airlineQuery} onChange={(e) => setAirlineQuery(e.target.value)} />{filterOptions.airlines.filter((airline) => `${airline.name} ${airline.code}`.toLowerCase().includes(airlineQuery.toLowerCase())).map((airline) => <label className="filter-check filter-airline-row" key={airline.code}><input type="checkbox" checked={filterState.airlines.includes(airline.code)} onChange={() => toggleFilterValue('airlines', airline.code)} /><span>{airline.name} <small>{airline.code}</small></span><strong>{(() => { const prices = allVisibleSourceFlights.filter((flight) => getFlightAirlineCodes(flight).includes(airline.code)).map(getLowestFlightPrice).filter((v) => v > 0); return prices.length ? `₹${Math.min(...prices).toLocaleString('en-IN')}` : '—'; })()}</strong></label>)}</div>
                            <div className="filter-section"><h3>Terminal <button type="button" onClick={() => updateFilter('terminal', [])}>{filterState.terminal.length ? 'CLEAR' : '＋'}</button></h3>{expandedFilters.terminal && (filterOptions.terminals.length ? filterOptions.terminals.map((value) => <label className="filter-check" key={value}><input type="checkbox" checked={filterState.terminal.includes(value)} onChange={() => toggleFilterValue('terminal', value)} /> Terminal {value}</label>) : <span className="filter-muted">Terminal details unavailable in current results.</span>)}<button className="filter-expand-link" type="button" onClick={() => setExpandedFilters((prev) => ({ ...prev, terminal: !prev.terminal }))}>{expandedFilters.terminal ? 'Hide' : 'Show options'}</button></div>
                            <div className="filter-section"><h3>Airport <button type="button" onClick={() => updateFilter('airport', [])}>{filterState.airport.length ? 'CLEAR' : '＋'}</button></h3>{expandedFilters.airport && (filterOptions.airports.length ? filterOptions.airports.map((value) => <label className="filter-check" key={value}><input type="checkbox" checked={filterState.airport.includes(value)} onChange={() => toggleFilterValue('airport', value)} /> {value}</label>) : <span className="filter-muted">Airport details unavailable.</span>)}<button className="filter-expand-link" type="button" onClick={() => setExpandedFilters((prev) => ({ ...prev, airport: !prev.airport }))}>{expandedFilters.airport ? 'Hide' : 'Show options'}</button></div>
                            <div className="filter-section"><h3>Layover Airport <button type="button" onClick={() => updateFilter('layoverAirport', [])}>{filterState.layoverAirport.length ? 'CLEAR' : '＋'}</button></h3>{expandedFilters.layover && (filterOptions.layovers.length ? filterOptions.layovers.map((value) => <label className="filter-check" key={value}><input type="checkbox" checked={filterState.layoverAirport.includes(value)} onChange={() => toggleFilterValue('layoverAirport', value)} /> {value}</label>) : <span className="filter-muted">No layover airports in current results.</span>)}<button className="filter-expand-link" type="button" onClick={() => setExpandedFilters((prev) => ({ ...prev, layover: !prev.layover }))}>{expandedFilters.layover ? 'Hide' : 'Show options'}</button></div>
                            <div className="filter-section"><h3>Duration <button type="button" onClick={() => updateFilter('maxDuration', '')}>{filterState.maxDuration ? 'CLEAR' : '＋'}</button></h3>{expandedFilters.duration && <label className="filter-range-label">Maximum duration <select value={filterState.maxDuration} onChange={(e) => updateFilter('maxDuration', e.target.value)}><option value="">Any duration</option><option value="180">3 hours</option><option value="360">6 hours</option><option value="540">9 hours</option><option value="720">12 hours</option><option value="960">16 hours</option><option value="1440">24 hours</option></select></label>}<button className="filter-expand-link" type="button" onClick={() => setExpandedFilters((prev) => ({ ...prev, duration: !prev.duration }))}>{expandedFilters.duration ? 'Hide' : 'Show options'}</button></div>
                            <div className="filter-section"><h3>Layover Duration <button type="button" onClick={() => updateFilter('maxLayoverDuration', '')}>{filterState.maxLayoverDuration ? 'CLEAR' : '＋'}</button></h3>{expandedFilters.layoverDuration && <label className="filter-range-label">Maximum layover <select value={filterState.maxLayoverDuration} onChange={(e) => updateFilter('maxLayoverDuration', e.target.value)}><option value="">Any layover</option><option value="60">1 hour</option><option value="120">2 hours</option><option value="240">4 hours</option><option value="360">6 hours</option><option value="720">12 hours</option></select></label>}<button className="filter-expand-link" type="button" onClick={() => setExpandedFilters((prev) => ({ ...prev, layoverDuration: !prev.layoverDuration }))}>{expandedFilters.layoverDuration ? 'Hide' : 'Show options'}</button></div>
                            <div className="filter-section"><label className="filter-check"><input type="checkbox" checked={filterState.hideNearbyAirports} onChange={(e) => updateFilter('hideNearbyAirports', e.target.checked)} /> Hide Nearby Airports</label><p className="filter-muted">Excludes results using a different origin or destination airport code.</p></div>
                            <div className="mobile-filter-footer">
                                <button type="button" onClick={resetFilters} className="mobile-filter-reset">Reset all</button>
                                <button type="button" onClick={() => setMobileFiltersOpen(false)} className="mobile-filter-apply">Show {filteredFlightCount} flights</button>
                            </div>
                        </>}
                    </aside>

                    <section className="results-content">
                        <div className="flight-date-strip" aria-label="Flight dates">
                            <button type="button" className="date-nav" disabled={dateSearchLoading} onClick={() => activeDate && searchDate(formatISODate(new Date(new Date(`${activeDate}T12:00:00`).getTime() - 86400000)))} aria-label="Previous date">‹</button>
                            {dateStrip.map((date) => <button type="button" key={date} className={`flight-date-item ${date === activeDate ? 'active' : ''}`} disabled={dateSearchLoading} onClick={() => date !== activeDate && searchDate(date)}><span>{new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short' })}, {new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span><strong>{date === activeDate ? 'Selected date' : 'Fetch Fare'}</strong></button>)}
                            <button type="button" className="date-nav" disabled={dateSearchLoading} onClick={() => activeDate && searchDate(formatISODate(new Date(new Date(`${activeDate}T12:00:00`).getTime() + 86400000)))} aria-label="Next date">›</button>
                        </div>
                        {dateSearchLoading && <div className="date-search-loading">Searching TripJack for the selected date…</div>}
                        {dateError && <div className="date-search-error">{dateError} <button type="button" onClick={() => activeDate && searchDate(activeDate)}>Retry</button></div>}
                        <div className="flight-results-toolbar"><div><button type="button" className={sortBy === 'price' ? 'quick-sort active' : 'quick-sort'} onClick={() => setSortBy('price')}>₹ Cheapest <small>{priceBounds.min ? `from ₹${priceBounds.min.toLocaleString('en-IN')}` : 'Compare fares'}</small></button><button type="button" className={sortBy === 'duration' ? 'quick-sort active' : 'quick-sort'} onClick={() => setSortBy('duration')}>⚡ Fastest <small>Shortest duration</small></button></div><label>Sort by <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="recommended">Recommended</option><option value="price">Price: low to high</option><option value="duration">Duration: shortest</option><option value="departure">Departure: earliest</option><option value="arrival">Arrival: earliest</option></select></label></div>
                        {activeFilterChips.length > 0 && <div className="active-filter-chips">{activeFilterChips.map((chip) => <button type="button" className="filter-chip" key={`${chip.key}-${chip.value}`} onClick={() => removeFilterChip(chip)}>{chip.label} ×</button>)}<button type="button" className="filter-clear-inline" onClick={resetFilters}>Clear all</button></div>}
                        <div className="filter-results-count">Showing {filteredFlightCount} flight{filteredFlightCount === 1 ? '' : 's'} {dateSearchLoading ? '• Updating…' : ''}</div>

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

                                                {getFilteredFlights(leg).length === 0 ? (
                                                    <div
                                                        className="loading-box"
                                                    >
                                                        No flights
                                                        available
                                                        for this
                                                        sector.
                                                    </div>
                                                ) : (
                                                    getFilteredFlights(leg).map(
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
                                                                        <button type="button" className={`flight-compare-toggle ${compareFlightIds.includes(flightId) ? 'active' : ''}`} onClick={() => setCompareFlightIds((prev) => prev.includes(flightId) ? prev.filter((id) => id !== flightId) : prev.length < 3 ? [...prev, flightId] : (toast.error('You can compare up to 3 flights.'), prev))}>{compareFlightIds.includes(flightId) ? '✓ Added to compare' : '＋ Compare'}</button>

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

                {compareFlightIds.length > 0 && (
                    <div className="flight-compare-bar">
                        <div><strong>{compareFlightIds.length} flight{compareFlightIds.length === 1 ? '' : 's'} selected to compare</strong><span>Choose up to 3 flights from the current results.</span></div>
                        <button type="button" onClick={() => setShowCompare((value) => !value)}>{showCompare ? 'Hide comparison' : 'Compare now'}</button>
                        <button type="button" className="compare-clear" onClick={() => { setCompareFlightIds([]); setShowCompare(false); }}>Clear</button>
                        {showCompare && <div className="flight-compare-table">{compareFlightIds.map((id) => {
                            const flight = visibleFlightLegs.flatMap((leg) => leg.flights).find((item) => getFlightUniqueId(item) === id);
                            if (!flight) return null;
                            const first = getFirstSegment(flight); const last = getLastSegment(flight);
                            return <div key={id} className="flight-compare-cell"><strong>{getAirline(flight)?.name || getAirline(flight)?.code || 'Airline'}</strong><span>{first?.da?.code} → {last?.aa?.code}</span><span>{formatTime(first?.dt)} – {formatTime(last?.at)}</span><span>{formatDuration(getFlightDuration(flight))}</span><b>₹{getFlightPrice(flight).toLocaleString('en-IN')}</b><button type="button" onClick={() => setCompareFlightIds((prev) => prev.filter((value) => value !== id))}>Remove</button></div>;
                        })}</div>}
                    </div>
                )}

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

                                {/* <button
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
                                </button> */}

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