'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import './results.css';
import flightService from '@/app/services/flightBookingService';

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

const formatDuration = (minutes = 0) => {
    const hrs = Math.floor(Number(minutes) / 60);
    const mins = Number(minutes) % 60;

    if (!hrs) {
        return `${mins}m`;
    }

    if (!mins) {
        return `${hrs}h`;
    }

    return `${hrs}h ${mins}m`;
};

export default function FlightResultsPage() {
    const router = useRouter();

    const [searchData, setSearchData] = useState(null);
    const [loading, setLoading] = useState(true);

    /*
     * Flights which failed TripJack review.
     *
     * We store their unique IDs here so they can be
     * visually marked as unavailable and cannot be
     * selected again.
     */
    const [unavailableFlights, setUnavailableFlights] =
        useState(() => {
            if (typeof window === 'undefined') {
                return [];
            }

            try {
                const stored = sessionStorage.getItem(
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

    const [checkingFlightId, setCheckingFlightId] =
        useState(null);

    /*
     * ---------------------------------------------------------
     * LOAD SEARCH DATA
     * ---------------------------------------------------------
     */

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(
                'tripjack_flight_search'
            );

            if (!stored) {
                router.replace('/flights');
                return;
            }

            setSearchData(
                JSON.parse(stored)
            );
        } catch (error) {
            console.error(
                'Unable to load flight search:',
                error
            );

            router.replace('/flights');
        } finally {
            setLoading(false);
        }
    }, [router]);

    /*
     * ---------------------------------------------------------
     * FLIGHTS
     * ---------------------------------------------------------
     */

    const flights =
        searchData
            ?.response
            ?.searchResult
            ?.tripInfos
            ?.ONWARD || [];

    const search =
        searchData?.search;

    /*
     * ---------------------------------------------------------
     * GET UNIQUE FLIGHT ID
     * ---------------------------------------------------------
     *
     * Fare ID is preferred because it is the exact TripJack
     * price/fare identifier.
     *
     * Fallback is used just in case fare ID is missing.
     */

    const getFlightUniqueId = (flight) => {
        const segment =
            flight?.sI?.[0];

        const fare =
            flight?.totalPriceList?.[0] ||
            flight?.priceList?.[0];

        return (
            fare?.id ||
            [
                segment?.fD?.aI?.code,
                segment?.fD?.fN,
                segment?.da?.code,
                segment?.aa?.code,
                segment?.dt,
            ]
                .filter(Boolean)
                .join('_')
        );
    };

    /*
     * ---------------------------------------------------------
     * MARK FLIGHT UNAVAILABLE
     * ---------------------------------------------------------
     */

    const markFlightUnavailable = (flight) => {
        const flightId =
            getFlightUniqueId(flight);

        if (!flightId) {
            return;
        }

        setUnavailableFlights((prev) => {
            if (prev.includes(flightId)) {
                return prev;
            }

            const updated = [
                ...prev,
                flightId,
            ];

            try {
                sessionStorage.setItem(
                    'tripjack_unavailable_flights',
                    JSON.stringify(updated)
                );
            } catch (error) {
                console.error(
                    'Unable to save unavailable flights:',
                    error
                );
            }

            return updated;
        });
    };

    /*
     * ---------------------------------------------------------
     * REVIEW API
     * ---------------------------------------------------------
     *
     * User clicks VIEW PRICES
     *
     * 1. Get fare ID
     * 2. Call TripJack Review API
     * 3. If success:
     *      save selected flight
     *      navigate to review page
     *
     * 4. If failed:
     *      mark flight unavailable
     *      show toast
     *      DO NOT navigate
     */

    const selectFlight = async (flight) => {
        const flightId =
            getFlightUniqueId(flight);

        /*
         * Already unavailable
         */
        if (
            flightId &&
            unavailableFlights.includes(
                flightId
            )
        ) {
            toast.error(
                'Flight no longer available. Please choose another flight.',
                {
                    duration: 4000,
                }
            );

            return;
        }

        try {
            /*
             * Get selected fare
             */
            const selectedFare =
                flight?.totalPriceList?.[0] ||
                flight?.priceList?.[0];

            const fareId =
                selectedFare?.id;

            /*
             * Fare ID missing
             */
            if (!fareId) {
                console.error(
                    'Selected fare ID not found:',
                    flight
                );

                markFlightUnavailable(
                    flight
                );

                toast.error(
                    'Flight no longer available. Please choose another flight.',
                    {
                        duration: 4000,
                    }
                );

                return;
            }

            /*
             * Set checking state
             */
            setCheckingFlightId(
                flightId
            );

            console.log(
                '========================================'
            );

            console.log(
                'SELECTED FLIGHT'
            );

            console.log(
                '========================================'
            );

            console.log(
                'Selected Flight:',
                flight
            );

            console.log(
                'Selected Fare:',
                selectedFare
            );

            console.log(
                'Selected Fare ID:',
                fareId
            );

            /*
             * -------------------------------------------------
             * REVIEW PAYLOAD
             * -------------------------------------------------
             */

            const reviewPayload = {
                id: fareId,
            };

            console.log(
                'Review Payload:',
                reviewPayload
            );

            /*
             * -------------------------------------------------
             * CALL REVIEW API
             * -------------------------------------------------
             */

            const reviewResponse =
                await flightService.review(
                    reviewPayload
                );

            console.log(
                'Review Response:',
                reviewResponse
            );

            /*
             * -------------------------------------------------
             * CHECK SUCCESS
             * -------------------------------------------------
             */

            const reviewSuccess =
                reviewResponse?.success === true ||
                reviewResponse?.status?.success === true;

            /*
             * -------------------------------------------------
             * REVIEW FAILED
             * -------------------------------------------------
             */

            if (!reviewSuccess) {
                console.error(
                    'Flight Review Failed:',
                    reviewResponse
                );

                /*
                 * Add this flight to unavailable list.
                 */
                markFlightUnavailable(
                    flight
                );

                toast.error(
                    'Flight no longer available. Please choose another flight.',
                    {
                        duration: 4500,
                    }
                );

                /*
                 * IMPORTANT:
                 *
                 * Do NOT save selected flight.
                 * Do NOT navigate.
                 */

                return;
            }

            /*
             * -------------------------------------------------
             * REVIEW SUCCESS
             * -------------------------------------------------
             */

            console.log(
                'Flight Review Successful:',
                reviewResponse
            );

            /*
             * Save only after successful Review API.
             */
            sessionStorage.setItem(
                'tripjack_selected_flight',
                JSON.stringify({
                    flight,

                    search:
                        searchData?.search,

                    tripType:
                        searchData?.tripType,

                    request:
                        searchData?.request,

                    review:
                        reviewResponse,

                    fare:
                        selectedFare,
                })
            );

            /*
             * Navigate only after success.
             */
            router.push(
                '/flights/review'
            );

        } catch (error) {
            console.error(
                'Flight Review Exception:',
                error
            );

            /*
             * API/network exception also means
             * user should not continue with this fare.
             */
            markFlightUnavailable(
                flight
            );

            toast.error(
                'Flight no longer available. Please choose another flight.',
                {
                    duration: 4500,
                }
            );

            /*
             * No navigation.
             */

        } finally {
            setCheckingFlightId(
                null
            );
        }
    };

    /*
     * ---------------------------------------------------------
     * LOADING
     * ---------------------------------------------------------
     */

    if (loading) {
        return (
            <>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3500,
                        style: {
                            fontSize: '14px',
                            borderRadius: '10px',
                        },
                    }}
                />

                <main className="flight-results-page">
                    <div className="results-container">
                        <div className="loading-box">
                            Loading flights...
                        </div>
                    </div>
                </main>
            </>
        );
    }

    /*
     * ---------------------------------------------------------
     * RENDER
     * ---------------------------------------------------------
     */

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3500,
                    style: {
                        fontSize: '14px',
                        borderRadius: '10px',
                    },
                }}
            />

            <main className="flight-results-page">

                {/* =================================================
                    TOP SEARCH BAR
                ================================================= */}

                <div className="top-search-area">
                    <div className="results-container">

                        <div className="search-summary">

                            <div className="search-box">
                                <small>
                                    FROM
                                </small>

                                <strong>
                                    {search?.fromCode ||
                                        '--'}
                                </strong>

                                <span>
                                    {search?.from ||
                                        'Departure'}
                                </span>
                            </div>

                            <div className="swap-icon">
                                ⇄
                            </div>

                            <div className="search-box">
                                <small>
                                    TO
                                </small>

                                <strong>
                                    {search?.toCode ||
                                        '--'}
                                </strong>

                                <span>
                                    {search?.to ||
                                        'Destination'}
                                </span>
                            </div>

                            <div className="search-box">
                                <small>
                                    DEPART
                                </small>

                                <strong>
                                    {search?.departureDate ||
                                        '--'}
                                </strong>

                                <span>
                                    One Way
                                </span>
                            </div>

                            <div className="search-box travellers">
                                <small>
                                    TRAVELLERS
                                </small>

                                <strong>
                                    {search?.adults ||
                                        1}{' '}
                                    Adult
                                </strong>

                                <span>
                                    {search?.cabinClass ||
                                        'ECONOMY'}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="modify-btn"
                                onClick={() =>
                                    router.push(
                                        '/flights'
                                    )
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

                <div className="results-container " style={{ marginTop: '20px' }}>

                    <section className="results-content">

                        <div className="results-title-row">

                            <div>

                                <h1>
                                    Flights from{' '}
                                    {search?.from ||
                                        search?.fromCode ||
                                        'Departure'}
                                    {' '}
                                    to{' '}
                                    {search?.to ||
                                        search?.toCode ||
                                        'Destination'}
                                </h1>

                                <p>
                                    {flights.length}{' '}
                                    flights found
                                </p>

                            </div>

                        </div>

                        {/* =================================================
                                SORT BAR
                            ================================================= */}

                        {/* <div className="sort-bar">

                            <div className="sort-option active">

                                <strong>
                                    Cheapest
                                </strong>

                                <span>
                                    Best price
                                </span>

                            </div>

                            <div className="sort-option">

                                <strong>
                                    Non Stop First
                                </strong>

                                <span>
                                    Direct flights
                                </span>

                            </div>

                            <div className="sort-option">

                                <strong>
                                    Earliest
                                </strong>

                                <span>
                                    Departure
                                </span>

                            </div>

                            <div className="sort-option">

                                <strong>
                                    Other Sort
                                </strong>

                                <span>
                                    ⌄
                                </span>

                            </div>

                        </div> */}

                        {/* =================================================
                                FLIGHTS
                            ================================================= */}

                        <div className="flight-list">

                            {flights.length === 0 ? (

                                <div className="loading-box">
                                    No flights found.
                                </div>

                            ) : (

                                flights.map(
                                    (
                                        flight,
                                        index
                                    ) => {

                                        const segment =
                                            flight?.sI?.[0];

                                        const fare =
                                            flight
                                                ?.totalPriceList?.[0] ||
                                            flight
                                                ?.priceList?.[0];

                                        const price =
                                            fare
                                                ?.fd
                                                ?.ADULT
                                                ?.fC
                                                ?.TF ||
                                            0;

                                        const airline =
                                            segment
                                                ?.fD
                                                ?.aI;

                                        /*
                                         * Unique ID for this
                                         * flight/fare.
                                         */
                                        const flightId =
                                            getFlightUniqueId(
                                                flight
                                            );

                                        /*
                                         * Is this flight
                                         * unavailable?
                                         */
                                        const isUnavailable =
                                            unavailableFlights.includes(
                                                flightId
                                            );

                                        /*
                                         * Is this flight
                                         * currently being
                                         * checked?
                                         */
                                        const isChecking =
                                            checkingFlightId ===
                                            flightId;

                                        return (

                                            <div
                                                className={`flight-card ${isUnavailable
                                                    ? 'flight-card-unavailable'
                                                    : ''
                                                    }`}
                                                key={
                                                    fare?.id ||
                                                    `${segment?.id}-${index}`
                                                }
                                            >

                                                {/* =================================================
                                                        UNAVAILABLE BADGE
                                                    ================================================= */}
                                                {/* 
                                                    {isUnavailable && (
                                                        <div className="flight-unavailable-badge">
                                                            Flight Unavailable
                                                        </div>
                                                    )} */}

                                                {/* =================================================
                                                        AIRLINE
                                                    ================================================= */}

                                                <div className="airline-column">

                                                    <div className="airline-logo">
                                                        {airline?.code ||
                                                            'FL'}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {airline?.name ||
                                                                'Airline'}
                                                        </strong>

                                                        <span>
                                                            {airline?.code}{' '}
                                                            {
                                                                segment
                                                                    ?.fD
                                                                    ?.fN
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                                {/* =================================================
                                                        DEPARTURE
                                                    ================================================= */}

                                                <div className="flight-time">

                                                    <strong>
                                                        {formatTime(
                                                            segment?.dt
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {segment
                                                            ?.da
                                                            ?.code}
                                                    </span>

                                                    <small>
                                                        {segment
                                                            ?.da
                                                            ?.city}
                                                    </small>

                                                </div>

                                                {/* =================================================
                                                        DURATION
                                                    ================================================= */}

                                                <div className="flight-duration">

                                                    <span>
                                                        {formatDuration(
                                                            segment?.duration
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
                                                        {Number(
                                                            segment
                                                                ?.stops ||
                                                            0
                                                        ) === 0
                                                            ? 'Non stop'
                                                            : `${segment.stops} Stop`}
                                                    </small>

                                                </div>

                                                {/* =================================================
                                                        ARRIVAL
                                                    ================================================= */}

                                                <div className="flight-time">

                                                    <strong>
                                                        {formatTime(
                                                            segment?.at
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {segment
                                                            ?.aa
                                                            ?.code}
                                                    </span>

                                                    <small>
                                                        {segment
                                                            ?.aa
                                                            ?.city}
                                                    </small>

                                                </div>

                                                {/* =================================================
                                                        PRICE
                                                    ================================================= */}

                                                <div className="flight-price">

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
                                                        disabled={isUnavailable || isChecking}
                                                        style={{
                                                            backgroundColor: isUnavailable
                                                                ? '#dc2626'       // red - unavailable
                                                                : isChecking
                                                                    ? '#f59e0b'   // orange - checking
                                                                    : '#16a34a',  // green - available

                                                            color: '#ffffff',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            padding: '10px 18px',
                                                            fontWeight: '600',
                                                            fontSize: '13px',
                                                            cursor: isUnavailable || isChecking
                                                                ? 'not-allowed'
                                                                : 'pointer',
                                                            opacity: isUnavailable || isChecking ? 0.9 : 1,
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                        onClick={() => selectFlight(flight)}
                                                    >
                                                        {isChecking
                                                            ? 'CHECKING...'
                                                            : isUnavailable
                                                                ? 'UNAVAILABLE'
                                                                : 'VIEW PRICES'}
                                                    </button>
                                                </div>

                                            </div>

                                        );
                                    }
                                )

                            )}

                        </div>

                    </section>



                </div>

            </main>
        </>
    );
}