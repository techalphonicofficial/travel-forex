'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

import flightService from '../../services/flightBookingService';

const styles = {
    page: {
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '30px 16px 60px',
    },

    container: {
        width: '100%',
        maxWidth: '1180px',
        margin: '0 auto',
    },

    backButton: {
        border: 'none',
        background: 'transparent',
        padding: 0,
        marginBottom: '20px',
        color: '#334155',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
    },

    header: {
        marginBottom: '24px',
    },

    title: {
        margin: 0,
        fontSize: '28px',
        fontWeight: 700,
        color: '#0f172a',
    },

    subtitle: {
        margin: '7px 0 0',
        color: '#64748b',
        fontSize: '14px',
    },

    grid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: '20px',
        alignItems: 'start',
    },

    card: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
    },

    cardHeader: {
        padding: '18px 20px',
        borderBottom: '1px solid #eef0f3',
    },

    cardTitle: {
        margin: 0,
        fontSize: '17px',
        fontWeight: 700,
        color: '#111827',
    },

    cardBody: {
        padding: '20px',
    },

    airlineRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        marginBottom: '24px',
    },

    airlineLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },

    airlineLogo: {
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '13px',
        color: '#0f172a',
    },

    airlineName: {
        margin: 0,
        fontSize: '15px',
        fontWeight: 700,
        color: '#111827',
    },

    flightNumber: {
        margin: '4px 0 0',
        fontSize: '13px',
        color: '#64748b',
    },

    fareBadge: {
        padding: '6px 10px',
        borderRadius: '999px',
        background: '#eff6ff',
        color: '#2563eb',
        fontSize: '12px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
    },

    route: {
        display: 'grid',
        gridTemplateColumns: '1fr 130px 1fr',
        alignItems: 'center',
        gap: '15px',
    },

    airportBlock: {
        minWidth: 0,
    },

    airportRight: {
        textAlign: 'right',
    },

    time: {
        margin: 0,
        fontSize: '24px',
        lineHeight: 1.2,
        fontWeight: 700,
        color: '#0f172a',
    },

    airportCode: {
        margin: '5px 0 0',
        fontSize: '14px',
        fontWeight: 700,
        color: '#334155',
    },

    airportName: {
        margin: '3px 0 0',
        fontSize: '12px',
        color: '#64748b',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },

    routeMiddle: {
        textAlign: 'center',
    },

    routeLine: {
        height: '1px',
        background: '#cbd5e1',
        position: 'relative',
        margin: '0 5px 8px',
    },

    routeDotLeft: {
        position: 'absolute',
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: '#64748b',
        left: 0,
        top: '-3px',
    },

    routeDotRight: {
        position: 'absolute',
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: '#64748b',
        right: 0,
        top: '-3px',
    },

    routeArrow: {
        fontSize: '16px',
        color: '#2563eb',
        fontWeight: 700,
    },

    duration: {
        margin: '5px 0 0',
        fontSize: '12px',
        color: '#64748b',
    },

    dateText: {
        margin: '18px 0 0',
        paddingTop: '15px',
        borderTop: '1px solid #eef0f3',
        fontSize: '13px',
        color: '#475569',
    },

    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '12px',
        marginTop: '20px',
    },

    infoBox: {
        padding: '13px',
        borderRadius: '10px',
        background: '#f8fafc',
        border: '1px solid #eef2f7',
    },

    infoLabel: {
        display: 'block',
        fontSize: '11px',
        color: '#64748b',
        marginBottom: '5px',
    },

    infoValue: {
        display: 'block',
        fontSize: '13px',
        fontWeight: 700,
        color: '#1e293b',
    },

    fareRows: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },

    fareRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        fontSize: '14px',
        color: '#475569',
    },

    fareRowStrong: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        paddingTop: '15px',
        marginTop: '5px',
        borderTop: '1px solid #e5e7eb',
        fontSize: '17px',
        fontWeight: 700,
        color: '#111827',
    },

    price: {
        fontWeight: 700,
        color: '#111827',
    },

    totalPrice: {
        fontSize: '22px',
        color: '#0f172a',
    },

    continueButton: {
        width: '100%',
        marginTop: '20px',
        padding: '14px 18px',
        border: 'none',
        borderRadius: '10px',
        background: '#2563eb',
        color: '#fff',
        fontSize: '15px',
        fontWeight: 700,
        cursor: 'pointer',
    },

    disabledButton: {
        background: '#94a3b8',
        cursor: 'not-allowed',
    },

    note: {
        marginTop: '12px',
        fontSize: '11px',
        lineHeight: 1.5,
        color: '#64748b',
        textAlign: 'center',
    },

    error: {
        padding: '20px',
        background: '#fff',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        color: '#b91c1c',
    },

    loading: {
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '14px',
    },

    sectionGap: {
        marginTop: '20px',
    },

    selectedFare: {
        padding: '12px 14px',
        borderRadius: '10px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        marginBottom: '16px',
    },

    selectedFareLabel: {
        fontSize: '11px',
        color: '#64748b',
        marginBottom: '4px',
    },

    selectedFareValue: {
        fontSize: '13px',
        fontWeight: 700,
        color: '#1e293b',
        wordBreak: 'break-all',
    },

    apiBox: {
        marginTop: '20px',
        padding: '15px',
        borderRadius: '10px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
    },

    apiTitle: {
        margin: '0 0 8px',
        fontSize: '13px',
        fontWeight: 700,
        color: '#334155',
    },

    apiStatus: {
        margin: 0,
        fontSize: '13px',
        color: '#475569',
    },
};

const formatTime = (value) => {
    if (!value) return '--';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(11, 16) || String(value);
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
        return String(value).slice(0, 10);
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return '--';

    const hrs = Math.floor(Number(minutes) / 60);
    const mins = Number(minutes) % 60;

    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;

    return `${hrs}h ${mins}m`;
};

const formatCurrency = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) return '₹0';

    return `₹${number.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
    })}`;
};

const getFlightSegment = (flight) => {
    if (!flight) return null;

    if (Array.isArray(flight.sI) && flight.sI.length > 0) {
        return flight.sI[0];
    }

    if (
        Array.isArray(flight.segments) &&
        flight.segments.length > 0
    ) {
        return flight.segments[0];
    }

    return null;
};

const getFare = (flight) => {
    if (!flight) return null;

    if (
        Array.isArray(flight.totalPriceList) &&
        flight.totalPriceList.length > 0
    ) {
        return flight.totalPriceList[0];
    }

    if (
        Array.isArray(flight.priceList) &&
        flight.priceList.length > 0
    ) {
        return flight.priceList[0];
    }

    return null;
};

const isApiSuccess = (response) => {
    return (
        response?.success === true ||
        response?.status?.success === true ||
        response?.status?.httpStatus === 200
    );
};

const getApiErrorMessage = (response) => {
    return (
        response?.message ||
        response?.error?.message ||
        response?.error?.status?.message ||
        response?.error?.errors?.[0]?.message ||
        response?.error?.errors?.[0]?.details ||
        'Something went wrong with TripJack API.'
    );
};

export default function FlightReviewPage() {
    const router = useRouter();

    const [selectedData, setSelectedData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [fareRuleLoading, setFareRuleLoading] =
        useState(false);

    const [reviewLoading, setReviewLoading] =
        useState(false);

    const [fareRuleResponse, setFareRuleResponse] =
        useState(null);

    const [reviewResponse, setReviewResponse] =
        useState(null);

    const [apiError, setApiError] = useState('');

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(
                'tripjack_selected_flight'
            );

            if (!stored) {
                setApiError(
                    'Selected flight data was not found.'
                );

                setLoading(false);

                return;
            }

            const parsed = JSON.parse(stored);

            console.log(
                'Selected Flight Data:',
                parsed
            );

            setSelectedData(parsed);
        } catch (err) {
            console.error(
                'Failed to read selected flight:',
                err
            );

            setApiError(
                'Unable to load selected flight data.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const flight = selectedData?.flight;

    const segment = useMemo(
        () => getFlightSegment(flight),
        [flight]
    );

    const fare = useMemo(
        () => getFare(flight),
        [flight]
    );

    const airline = segment?.fD?.aI;

    const fareDetails =
        fare?.fd?.ADULT?.fC;

    const fareId = fare?.id || '';

    const departure = segment?.da;

    const arrival = segment?.aa;

    const baseFare =
        Number(fareDetails?.BF || 0);

    const taxes =
        Number(fareDetails?.TAF || 0);

    const totalFare = Number(
        fareDetails?.TF ??
        fareDetails?.NF ??
        baseFare + taxes
    );

    const cabinClass =
        fare?.fd?.ADULT?.cc ||
        selectedData?.search?.cabinClass ||
        'ECONOMY';

    const fareIdentifier =
        fare?.fareIdentifier ||
        'PUBLISHED';

    const passengers =
        Number(selectedData?.search?.adults || 0) +
        Number(selectedData?.search?.children || 0) +
        Number(selectedData?.search?.infants || 0);

    /*
     * ---------------------------------------------------------
     * FARE RULE API
     * ---------------------------------------------------------
     */
    const callFareRule = async () => {
        if (!fareId) {
            console.error(
                'Fare Rule API: Fare ID missing'
            );

            return;
        }

        try {
            setFareRuleLoading(true);

            console.log(
                '========== FARE RULE API =========='
            );

            /*
             * Selected fare ID from TripJack search response.
             */
            const payload = {
                id: fareId,
            };

            console.log(
                'Fare Rule Payload:',
                payload
            );

            const response =
                await flightService.fareRule(
                    payload
                );

            console.log(
                'Fare Rule Response:',
                response
            );

            setFareRuleResponse(response);

            /*
             * Error response bhi console mein dikhega.
             */
            if (!isApiSuccess(response)) {
                console.error(
                    'Fare Rule API Error:',
                    response
                );

                const message =
                    getApiErrorMessage(response);

                await Swal.fire({
                    icon: 'error',
                    title: 'Fare Rule Error',
                    text: message,
                    confirmButtonText: 'OK',
                });

                return;
            }

            /*
             * Successful response.
             */
            console.log(
                'Fare Rule API Success:',
                response
            );

        } catch (error) {
            console.error(
                'Fare Rule API Exception:',
                error
            );

            const message =
                error?.message ||
                'Fare Rule API failed.';

            await Swal.fire({
                icon: 'error',
                title: 'Fare Rule Failed',
                text: message,
                confirmButtonText: 'OK',
            });
        } finally {
            setFareRuleLoading(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * REVIEW API
     * ---------------------------------------------------------
     */
    const callReview = async () => {
        if (!fareId) {
            console.error(
                'Review API: Fare ID missing'
            );

            return;
        }

        try {
            setReviewLoading(true);

            console.log(
                '========== REVIEW API =========='
            );

            /*
             * Review ke liye selected fare ka ID.
             *
             * Agar backend/controller exact TripJack review
             * contract ke hisaab se additional fields expect
             * karta hai, yahin payload extend karna hoga.
             */
            const payload = {
                id: fareId,
            };

            console.log(
                'Review Payload:',
                payload
            );

            const response =
                await flightService.review(
                    payload
                );

            console.log(
                'Review Response:',
                response
            );

            setReviewResponse(response);

            /*
             * -------------------------------------------------
             * ERROR RESPONSE
             * -------------------------------------------------
             */
            if (!isApiSuccess(response)) {
                const message =
                    getApiErrorMessage(response);

                console.error(
                    'Review API Error:',
                    response
                );

                await Swal.fire({
                    icon: 'error',
                    title: 'Flight Review Failed',
                    text: message,
                    confirmButtonText: 'OK',
                });

                return;
            }

            /*
             * -------------------------------------------------
             * SUCCESS RESPONSE
             * -------------------------------------------------
             */
            console.log(
                'Review API Success:',
                response
            );

            await Swal.fire({
                icon: 'success',
                title: 'Flight Review Successful',
                text: 'Flight fare and availability have been verified.',
                confirmButtonText: 'OK',
            });

        } catch (error) {
            console.error(
                'Review API Exception:',
                error
            );

            const message =
                error?.message ||
                'Flight Review API failed.';

            await Swal.fire({
                icon: 'error',
                title: 'Review Failed',
                text: message,
                confirmButtonText: 'OK',
            });
        } finally {
            setReviewLoading(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * CALL BOTH APIS
     * ---------------------------------------------------------
     *
     * Page load:
     * 1. Fare Rule
     * 2. Review
     *
     * Fare Rule ka response pehle log hoga.
     * Uske baad Review call hogi.
     */
    useEffect(() => {
        if (!selectedData || !fareId) {
            return;
        }

        const runApis = async () => {
            await callFareRule();

            await callReview();
        };

        runApis();
    }, [selectedData, fareId]);

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.loading}>
                        Loading selected flight...
                    </div>
                </div>
            </div>
        );
    }

    if (
        apiError ||
        !selectedData ||
        !flight
    ) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <button
                        type="button"
                        style={styles.backButton}
                        onClick={() =>
                            router.push(
                                '/flights/results'
                            )
                        }
                    >
                        ← Back to Results
                    </button>

                    <div style={styles.error}>
                        {apiError ||
                            'Selected flight was not found.'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>

                <button
                    type="button"
                    style={styles.backButton}
                    onClick={() =>
                        router.push(
                            '/flights/results'
                        )
                    }
                >
                    ← Back to Results
                </button>

                <div style={styles.header}>
                    <h1 style={styles.title}>
                        Review Your Flight
                    </h1>

                    <p style={styles.subtitle}>
                        Check your flight and fare
                        details before continuing.
                    </p>
                </div>

                <div
                    className="review-grid"
                    style={styles.grid}
                >

                    {/* LEFT SIDE */}

                    <div>

                        <div style={styles.card}>

                            <div style={styles.cardHeader}>
                                <h2
                                    style={
                                        styles.cardTitle
                                    }
                                >
                                    Flight Details
                                </h2>
                            </div>

                            <div style={styles.cardBody}>

                                <div
                                    style={
                                        styles.airlineRow
                                    }
                                >

                                    <div
                                        style={
                                            styles.airlineLeft
                                        }
                                    >

                                        <div
                                            style={
                                                styles.airlineLogo
                                            }
                                        >
                                            {airline?.code ||
                                                '--'}
                                        </div>

                                        <div>
                                            <p
                                                style={
                                                    styles.airlineName
                                                }
                                            >
                                                {airline?.name ||
                                                    'Airline'}
                                            </p>

                                            <p
                                                style={
                                                    styles.flightNumber
                                                }
                                            >
                                                Flight No.{' '}
                                                {segment?.fD
                                                    ?.fN ||
                                                    '--'}
                                            </p>
                                        </div>

                                    </div>

                                    <div
                                        style={
                                            styles.fareBadge
                                        }
                                    >
                                        {fareIdentifier}
                                    </div>

                                </div>

                                <div
                                    className="route"
                                    style={
                                        styles.route
                                    }
                                >

                                    <div
                                        style={
                                            styles.airportBlock
                                        }
                                    >
                                        <p
                                            className="time"
                                            style={
                                                styles.time
                                            }
                                        >
                                            {formatTime(
                                                segment?.dt
                                            )}
                                        </p>

                                        <p
                                            style={
                                                styles.airportCode
                                            }
                                        >
                                            {departure?.code ||
                                                '--'}
                                        </p>

                                        <p
                                            style={
                                                styles.airportName
                                            }
                                        >
                                            {departure?.name ||
                                                '--'}
                                        </p>
                                    </div>

                                    <div
                                        style={
                                            styles.routeMiddle
                                        }
                                    >
                                        <div
                                            style={
                                                styles.routeLine
                                            }
                                        >
                                            <span
                                                style={
                                                    styles.routeDotLeft
                                                }
                                            />

                                            <span
                                                style={
                                                    styles.routeDotRight
                                                }
                                            />
                                        </div>

                                        <div
                                            style={
                                                styles.routeArrow
                                            }
                                        >
                                            →
                                        </div>

                                        <p
                                            style={
                                                styles.duration
                                            }
                                        >
                                            {formatDuration(
                                                segment?.duration
                                            )}
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            ...styles.airportBlock,
                                            ...styles.airportRight,
                                        }}
                                    >
                                        <p
                                            className="time"
                                            style={
                                                styles.time
                                            }
                                        >
                                            {formatTime(
                                                segment?.at
                                            )}
                                        </p>

                                        <p
                                            style={
                                                styles.airportCode
                                            }
                                        >
                                            {arrival?.code ||
                                                '--'}
                                        </p>

                                        <p
                                            style={
                                                styles.airportName
                                            }
                                        >
                                            {arrival?.name ||
                                                '--'}
                                        </p>
                                    </div>

                                </div>

                                <p
                                    style={
                                        styles.dateText
                                    }
                                >
                                    Travel Date:{' '}
                                    <strong>
                                        {formatDate(
                                            segment?.dt
                                        )}
                                    </strong>
                                </p>

                                <div
                                    className="info-grid"
                                    style={
                                        styles.infoGrid
                                    }
                                >

                                    <div
                                        style={
                                            styles.infoBox
                                        }
                                    >
                                        <span
                                            style={
                                                styles.infoLabel
                                            }
                                        >
                                            Stops
                                        </span>

                                        <span
                                            style={
                                                styles.infoValue
                                            }
                                        >
                                            {segment?.stops ===
                                            0
                                                ? 'Non-stop'
                                                : `${segment?.stops || 0} Stop`}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.infoBox
                                        }
                                    >
                                        <span
                                            style={
                                                styles.infoLabel
                                            }
                                        >
                                            Cabin
                                        </span>

                                        <span
                                            style={
                                                styles.infoValue
                                            }
                                        >
                                            {cabinClass}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.infoBox
                                        }
                                    >
                                        <span
                                            style={
                                                styles.infoLabel
                                            }
                                        >
                                            Passengers
                                        </span>

                                        <span
                                            style={
                                                styles.infoValue
                                            }
                                        >
                                            {passengers ||
                                                1}
                                        </span>
                                    </div>

                                </div>

                            </div>
                        </div>

                        {/* FARE DETAILS */}

                        <div
                            style={{
                                ...styles.card,
                                ...styles.sectionGap,
                            }}
                        >
                            <div
                                style={
                                    styles.cardHeader
                                }
                            >
                                <h2
                                    style={
                                        styles.cardTitle
                                    }
                                >
                                    Fare Details
                                </h2>
                            </div>

                            <div
                                style={
                                    styles.cardBody
                                }
                            >

                                <div
                                    style={
                                        styles.selectedFare
                                    }
                                >
                                    <div
                                        style={
                                            styles.selectedFareLabel
                                        }
                                    >
                                        Selected Fare ID
                                    </div>

                                    <div
                                        style={
                                            styles.selectedFareValue
                                        }
                                    >
                                        {fareId || '--'}
                                    </div>
                                </div>

                                <div
                                    style={
                                        styles.fareRows
                                    }
                                >

                                    <div
                                        style={
                                            styles.fareRow
                                        }
                                    >
                                        <span>
                                            Base Fare
                                        </span>

                                        <span
                                            style={
                                                styles.price
                                            }
                                        >
                                            {formatCurrency(
                                                baseFare
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.fareRow
                                        }
                                    >
                                        <span>
                                            Taxes & Fees
                                        </span>

                                        <span
                                            style={
                                                styles.price
                                            }
                                        >
                                            {formatCurrency(
                                                taxes
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.fareRow
                                        }
                                    >
                                        <span>
                                            Fare Type
                                        </span>

                                        <span
                                            style={
                                                styles.price
                                            }
                                        >
                                            {fareIdentifier}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.fareRowStrong
                                        }
                                    >
                                        <span>
                                            Total Amount
                                        </span>

                                        <span
                                            style={
                                                styles.totalPrice
                                            }
                                        >
                                            {formatCurrency(
                                                totalFare
                                            )}
                                        </span>
                                    </div>

                                </div>

                            </div>
                        </div>

                    </div>

                    {/* RIGHT SIDE */}

                    <div>

                        <div style={styles.card}>

                            <div
                                style={
                                    styles.cardHeader
                                }
                            >
                                <h2
                                    style={
                                        styles.cardTitle
                                    }
                                >
                                    Fare Summary
                                </h2>
                            </div>

                            <div
                                style={
                                    styles.cardBody
                                }
                            >

                                <div
                                    style={
                                        styles.fareRows
                                    }
                                >

                                    <div
                                        style={
                                            styles.fareRow
                                        }
                                    >
                                        <span>
                                            Base Fare
                                        </span>

                                        <span
                                            style={
                                                styles.price
                                            }
                                        >
                                            {formatCurrency(
                                                baseFare
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.fareRow
                                        }
                                    >
                                        <span>
                                            Taxes & Fees
                                        </span>

                                        <span
                                            style={
                                                styles.price
                                            }
                                        >
                                            {formatCurrency(
                                                taxes
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.fareRowStrong
                                        }
                                    >
                                        <span>
                                            Total
                                        </span>

                                        <span
                                            style={
                                                styles.totalPrice
                                            }
                                        >
                                            {formatCurrency(
                                                totalFare
                                            )}
                                        </span>
                                    </div>

                                </div>

                                {/* API STATUS */}

                                <div
                                    style={
                                        styles.apiBox
                                    }
                                >
                                    <p
                                        style={
                                            styles.apiTitle
                                        }
                                    >
                                        Fare Rule API
                                    </p>

                                    <p
                                        style={
                                            styles.apiStatus
                                        }
                                    >
                                        {fareRuleLoading
                                            ? 'Checking fare rules...'
                                            : fareRuleResponse
                                                ? isApiSuccess(
                                                      fareRuleResponse
                                                  )
                                                    ? 'Fare Rule API successful'
                                                    : 'Fare Rule API returned an error'
                                                : 'Waiting...'}
                                    </p>
                                </div>

                                <div
                                    style={
                                        styles.apiBox
                                    }
                                >
                                    <p
                                        style={
                                            styles.apiTitle
                                        }
                                    >
                                        Review API
                                    </p>

                                    <p
                                        style={
                                            styles.apiStatus
                                        }
                                    >
                                        {reviewLoading
                                            ? 'Checking fare availability and price...'
                                            : reviewResponse
                                                ? isApiSuccess(
                                                      reviewResponse
                                                  )
                                                    ? 'Review API successful'
                                                    : 'Review API returned an error'
                                                : 'Waiting...'}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        reviewLoading ||
                                        !isApiSuccess(
                                            reviewResponse
                                        )
                                    }
                                    style={{
                                        ...styles.continueButton,
                                        ...(
                                            reviewLoading ||
                                            !isApiSuccess(
                                                reviewResponse
                                            )
                                                ? styles.disabledButton
                                                : {}
                                        ),
                                    }}
                                    onClick={() => {
                                        if (
                                            isApiSuccess(
                                                reviewResponse
                                            )
                                        ) {
                                            console.log(
                                                'Continue with Review Response:',
                                                reviewResponse
                                            );
                                        }
                                    }}
                                >
                                    {reviewLoading
                                        ? 'Reviewing Flight...'
                                        : 'Continue to Passenger Details'}
                                </button>

                                <p
                                    style={
                                        styles.note
                                    }
                                >
                                    Review API must succeed
                                    before continuing with
                                    passenger details.
                                </p>

                            </div>
                        </div>

                        {/* SEARCH DETAILS */}

                        <div
                            style={{
                                ...styles.card,
                                ...styles.sectionGap,
                            }}
                        >
                            <div
                                style={
                                    styles.cardHeader
                                }
                            >
                                <h2
                                    style={
                                        styles.cardTitle
                                    }
                                >
                                    Search Details
                                </h2>
                            </div>

                            <div
                                style={
                                    styles.cardBody
                                }
                            >

                                <div
                                    style={
                                        styles.fareRows
                                    }
                                >

                                    <div
                                        style={
                                            styles.fareRow
                                        }
                                    >
                                        <span>
                                            Trip Type
                                        </span>

                                        <span
                                            style={
                                                styles.price
                                            }
                                        >
                                            {selectedData?.tripType ||
                                                '--'}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.fareRow
                                        }
                                    >
                                        <span>
                                            From
                                        </span>

                                        <span
                                            style={
                                                styles.price
                                            }
                                        >
                                            {departure?.code ||
                                                '--'}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.fareRow
                                        }
                                    >
                                        <span>
                                            To
                                        </span>

                                        <span
                                            style={
                                                styles.price
                                            }
                                        >
                                            {arrival?.code ||
                                                '--'}
                                        </span>
                                    </div>

                                    <div
                                        style={
                                            styles.fareRow
                                        }
                                    >
                                        <span>
                                            Cabin
                                        </span>

                                        <span
                                            style={
                                                styles.price
                                            }
                                        >
                                            {cabinClass}
                                        </span>
                                    </div>

                                </div>

                            </div>
                        </div>

                    </div>

                </div>
            </div>

            <style jsx>{`
                @media (max-width: 900px) {
                    .review-grid {
                        grid-template-columns: 1fr !important;
                    }
                }

                @media (max-width: 700px) {
                    .route {
                        grid-template-columns: 1fr 70px 1fr !important;
                    }

                    .time {
                        font-size: 20px !important;
                    }

                    .info-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}