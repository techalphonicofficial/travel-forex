'use client';

import React, {
    useEffect,
    useMemo,
    useState,
} from 'react';

import { useRouter } from 'next/navigation';
import toast, {
    Toaster,
} from 'react-hot-toast';

import './passenger-details.css';

const STORAGE_KEY =
    'tripjack_passenger_flow';

const SOURCE_KEY =
    'tripjack_selected_flight';

const createEmptyPassenger = (
    type,
    index
) => ({
    id: `${type}-${index + 1}`,

    type,

    title: '',

    firstName: '',

    lastName: '',

    dob: '',

    nationality: 'Indian',

    passportNumber: '',
});

const getPaxInfo = (
    bookingData
) => {
    const paxInfo =
        bookingData?.request
            ?.searchQuery
            ?.paxInfo ||
        bookingData?.searchQuery
            ?.paxInfo ||
        bookingData?.search
            ?.paxInfo ||
        {};

    return {
        ADULT:
            Number(
                paxInfo?.ADULT || 0
            ),

        CHILD:
            Number(
                paxInfo?.CHILD || 0
            ),

        INFANT:
            Number(
                paxInfo?.INFANT || 0
            ),
    };
};

const buildPassengers = (
    paxInfo,
    existingPassengers = []
) => {
    const passengers = [];

    const types = [
        {
            type: 'ADULT',
            count: paxInfo.ADULT,
        },
        {
            type: 'CHILD',
            count: paxInfo.CHILD,
        },
        {
            type: 'INFANT',
            count: paxInfo.INFANT,
        },
    ];

    types.forEach(
        ({ type, count }) => {
            for (
                let i = 0;
                i < count;
                i++
            ) {
                const id =
                    `${type}-${i + 1}`;

                const existing =
                    existingPassengers.find(
                        (passenger) =>
                            passenger?.id ===
                            id
                    );

                passengers.push(
                    existing ||
                    createEmptyPassenger(
                        type,
                        i
                    )
                );
            }
        }
    );

    return passengers;
};

const getPassengerLabel = (
    type,
    index
) => {
    if (type === 'ADULT') {
        return `Adult ${index + 1}`;
    }

    if (type === 'CHILD') {
        return `Child ${index + 1}`;
    }

    return `Infant ${index + 1}`;
};

const getPassengerTypeLabel = (
    type
) => {
    if (type === 'ADULT') {
        return 'Adult';
    }

    if (type === 'CHILD') {
        return 'Child';
    }

    return 'Infant';
};

const getBookingId = (
    review
) =>
    review?.bookingId ||
    review?.data?.bookingId ||
    review?.booking?.bookingId ||
    '';

const getTotalFare = (
    review
) => {
    const total =
        review?.totalPriceInfo
            ?.totalFareDetail
            ?.fC
            ?.TF ??
        review?.data
            ?.totalPriceInfo
            ?.totalFareDetail
            ?.fC
            ?.TF ??
        review?.totalPrice ??
        review?.data
            ?.totalPrice ??
        0;

    return Number(total) || 0;
};

const getRouteSummary = (
    bookingData
) => {
    const routeInfos =
        bookingData?.request
            ?.searchQuery
            ?.routeInfos ||
        bookingData?.request
            ?.routeInfos ||
        [];

    if (!Array.isArray(routeInfos)) {
        return [];
    }

    return routeInfos;
};

export default function PassengerDetailsPage() {
    const router =
        useRouter();

    const [
        bookingData,
        setBookingData,
    ] = useState(null);

    const [
        passengers,
        setPassengers,
    ] = useState([]);

    const [
        contact,
        setContact,
    ] = useState({
        email: '',
        mobile: '',
        countryCode: '+91',
    });

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    /* =========================================================
       LOAD BOOKING SESSION
    ========================================================= */

    useEffect(() => {
        try {
            let flow = null;

            const savedFlow =
                sessionStorage.getItem(
                    STORAGE_KEY
                );

            if (savedFlow) {
                try {
                    flow =
                        JSON.parse(
                            savedFlow
                        );
                } catch (error) {
                    console.error(
                        'Invalid passenger flow:',
                        error
                    );
                }
            }

            /*
             * Fallback:
             * If passenger flow doesn't exist,
             * create it from selected flight.
             */

            if (!flow) {
                const selectedFlight =
                    sessionStorage.getItem(
                        SOURCE_KEY
                    );

                if (
                    selectedFlight
                ) {
                    try {
                        const selected =
                            JSON.parse(
                                selectedFlight
                            );

                        flow = {
                            version: 2,

                            bookingId:
                                getBookingId(
                                    selected?.review
                                ),

                            tripType:
                                selected?.tripType ||
                                null,

                            search:
                                selected?.search ||
                                null,

                            request:
                                selected?.request ||
                                null,

                            selections:
                                selected?.selections ||
                                [],

                            priceIds:
                                selected?.priceIds ||
                                [],

                            review:
                                selected?.review ||
                                null,

                            passengers: [],

                            contact: {
                                email: '',
                                mobile: '',
                                countryCode:
                                    '+91',
                            },

                            payment: {
                                status:
                                    'PENDING',
                                transactionId:
                                    null,
                            },

                            booking: {
                                status:
                                    'NOT_STARTED',
                                pnr: null,
                                bookingId:
                                    null,
                            },

                            createdAt:
                                new Date().toISOString(),

                            updatedAt:
                                new Date().toISOString(),
                        };

                        sessionStorage.setItem(
                            STORAGE_KEY,
                            JSON.stringify(flow)
                        );
                    } catch (error) {
                        console.error(
                            'Unable to parse selected flight:',
                            error
                        );
                    }
                }
            }

            if (!flow) {
                toast.error(
                    'Flight booking session not found.'
                );

                router.replace(
                    '/flights/results'
                );

                return;
            }

            setBookingData(flow);

            const paxInfo =
                getPaxInfo(flow);

            const restoredPassengers =
                buildPassengers(
                    paxInfo,
                    flow?.passengers || []
                );

            setPassengers(
                restoredPassengers
            );

            setContact({
                email:
                    flow?.contact
                        ?.email || '',

                mobile:
                    flow?.contact
                        ?.mobile || '',

                countryCode:
                    flow?.contact
                        ?.countryCode ||
                    '+91',
            });

            setLoading(false);
        } catch (error) {
            console.error(
                'Passenger page initialization failed:',
                error
            );

            toast.error(
                'Unable to load booking details.'
            );

            setLoading(false);
        }
    }, [router]);

    /* =========================================================
       SAVE SESSION
    ========================================================= */

    const saveSession = (
        nextPassengers = passengers,
        nextContact = contact
    ) => {
        if (!bookingData) {
            return;
        }

        const updatedFlow = {
            ...bookingData,

            passengers:
                nextPassengers,

            contact:
                nextContact,

            updatedAt:
                new Date().toISOString(),
        };

        try {
            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    updatedFlow
                )
            );

            setBookingData(
                updatedFlow
            );
        } catch (error) {
            console.error(
                'Unable to save passenger session:',
                error
            );
        }
    };

    /* =========================================================
       UPDATE PASSENGER
    ========================================================= */

    const updatePassenger = (
        index,
        field,
        value
    ) => {
        setPassengers(
            (previous) => {
                const updated = [
                    ...previous,
                ];

                updated[index] = {
                    ...updated[index],
                    [field]: value,
                };

                saveSession(
                    updated,
                    contact
                );

                return updated;
            }
        );
    };

    /* =========================================================
       UPDATE CONTACT
    ========================================================= */

    const updateContact = (
        field,
        value
    ) => {
        const updatedContact = {
            ...contact,
            [field]: value,
        };

        setContact(
            updatedContact
        );

        saveSession(
            passengers,
            updatedContact
        );
    };

    /* =========================================================
       VALIDATION
    ========================================================= */

    const validateForm = () => {
        if (!passengers.length) {
            toast.error(
                'Passenger information is missing.'
            );

            return false;
        }

        for (
            let i = 0;
            i < passengers.length;
            i++
        ) {
            const passenger =
                passengers[i];

            if (
                !passenger.title
            ) {
                toast.error(
                    `${getPassengerLabel(
                        passenger.type,
                        getTypeIndex(
                            passengers,
                            i
                        )
                    )}: Please select title.`
                );

                return false;
            }

            if (
                !passenger.firstName?.trim()
            ) {
                toast.error(
                    `${getPassengerLabel(
                        passenger.type,
                        getTypeIndex(
                            passengers,
                            i
                        )
                    )}: First name is required.`
                );

                return false;
            }

            if (
                !passenger.lastName?.trim()
            ) {
                toast.error(
                    `${getPassengerLabel(
                        passenger.type,
                        getTypeIndex(
                            passengers,
                            i
                        )
                    )}: Last name is required.`
                );

                return false;
            }

            if (
                passenger.type !==
                'ADULT' &&
                !passenger.dob
            ) {
                toast.error(
                    `${getPassengerLabel(
                        passenger.type,
                        getTypeIndex(
                            passengers,
                            i
                        )
                    )}: Date of birth is required.`
                );

                return false;
            }
        }

        if (
            !contact.email?.trim()
        ) {
            toast.error(
                'Email address is required.'
            );

            return false;
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailRegex.test(
                contact.email
            )
        ) {
            toast.error(
                'Please enter a valid email address.'
            );

            return false;
        }

        if (
            !contact.mobile?.trim()
        ) {
            toast.error(
                'Mobile number is required.'
            );

            return false;
        }

        const mobile =
            contact.mobile.replace(
                /\D/g,
                ''
            );

        if (
            mobile.length < 10
        ) {
            toast.error(
                'Please enter a valid mobile number.'
            );

            return false;
        }

        return true;
    };

    /* =========================================================
       CONTINUE
    ========================================================= */
    const handleContinue = async () => {
        if (localStorage.getItem('wl_auth') === null) {
            toast.error('Please login to continue.');
            return;
        }

        if (saving) {
            return;
        }

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            /*
             * Save latest passenger/contact data
             * in your existing session storage logic.
             */
            saveSession(
                passengers,
                contact
            );

            /*
             * Read existing TripJack booking flow.
             */
            const storedFlow =
                sessionStorage.getItem(
                    'tripjack_passenger_flow'
                );

            if (!storedFlow) {
                throw new Error(
                    'Booking session not found. Please select the flight again.'
                );
            }

            const flow = JSON.parse(storedFlow);

            /*
             * Preserve the COMPLETE existing flow.
             *
             * We are NOT creating a new object from scratch.
             * This is important because we don't want to lose:
             *
             * - bookingId
             * - tripType
             * - search
             * - request
             * - selections
             * - priceIds
             * - review
             * - selectedFare
             * - any future seat-selection data
             */
            const updatedFlow = {
                ...flow,

                /*
                 * Update passenger information.
                 */
                passengers: passengers,

                /*
                 * Update contact information.
                 */
                contact: contact,

                /*
                 * Payment has NOT started yet.
                 */
                payment: {
                    ...(flow.payment || {}),
                    status: 'PENDING',
                    transactionId:
                        flow.payment?.transactionId || null
                },

                /*
                 * TripJack booking has NOT started yet.
                 */
                booking: {
                    ...(flow.booking || {}),
                    status: 'NOT_STARTED',
                    pnr:
                        flow.booking?.pnr || null,
                    bookingId:
                        flow.booking?.bookingId || null
                },

                /*
                 * Keep existing seat selection if
                 * something was already saved.
                 *
                 * At this point normally it will be null.
                 */
                seatSelection:
                    flow.seatSelection || null,

                /*
                 * Update timestamps.
                 */
                updatedAt:
                    new Date().toISOString()
            };

            /*
             * Save the COMPLETE updated flow.
             */
            sessionStorage.setItem(
                'tripjack_passenger_flow',
                JSON.stringify(updatedFlow)
            );

            /*
             * Optional: keep a separate passenger session
             * if your existing saveSession() already uses it.
             */
            saveSession(
                passengers,
                contact
            );

            /*
             * Debugging.
             */
            console.log(
                'UPDATED TRIPJACK PASSENGER FLOW:',
                updatedFlow
            );

            /*
             * IMPORTANT:
             *
             * No Booking API here.
             * No Payment API here.
             * No TripJack Book API here.
             *
             * First user will select seats.
             */
            router.push(
                '/flights/seat-selection'
            );

        } catch (error) {

            console.error(
                'Unable to continue:',
                error
            );

            toast.error(
                error.message ||
                'Unable to continue. Please try again.'
            );

        } finally {

            setSaving(false);
        }
    };
    /* =========================================================
       COUNTS
    ========================================================= */

    const counts =
        useMemo(
            () =>
                getPaxInfo(
                    bookingData
                ),
            [bookingData]
        );

    const totalPassengers =
        passengers.length;

    const routeSummary =
        useMemo(
            () =>
                getRouteSummary(
                    bookingData
                ),
            [bookingData]
        );

    const totalFare =
        useMemo(
            () =>
                getTotalFare(
                    bookingData?.review
                ),
            [bookingData]
        );

    if (loading) {
        return (
            <main className="passenger-page">
                <div className="passenger-loading">
                    <div className="passenger-spinner" />

                    <h2>
                        Loading passenger details
                    </h2>

                    <p>
                        Restoring your flight
                        booking session...
                    </p>
                </div>
            </main>
        );
    }

    if (!bookingData) {
        return null;
    }

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
                            '12px',
                    },
                }}
            />

            <main className="passenger-page">

                {/* =================================================
                   TOP HEADER
                ================================================= */}

                <header className="passenger-header">

                    <div className="passenger-header-inner">

                        <button
                            type="button"
                            className="back-button"
                            onClick={() =>
                                router.back()
                            }
                        >
                            ←
                            <span>
                                Back
                            </span>
                        </button>

                        <div className="page-heading">
                            <div className="page-eyebrow">
                                FLIGHT BOOKING
                            </div>

                            <h1>
                                Passenger details
                            </h1>

                            <p>
                                Enter the details exactly
                                as they appear on the
                                passenger's travel document.
                            </p>
                        </div>

                    </div>

                </header>

                {/* =================================================
                   STEPPER
                ================================================= */}

                <div className="booking-stepper">

                    <div className="step completed">
                        <span className="step-number">
                            ✓
                        </span>

                        <span>
                            Review
                        </span>
                    </div>

                    <div className="step-line active" />

                    <div className="step active">
                        <span className="step-number">
                            2
                        </span>

                        <span>
                            Passenger Details
                        </span>
                    </div>

                    <div className="step-line" />

                    <div className="step">
                        <span className="step-number">
                            3
                        </span>

                        <span>
                            Payment
                        </span>
                    </div>

                </div>

                {/* =================================================
                   MAIN
                ================================================= */}

                <div className="passenger-container">

                    <section className="passenger-main">

                        {/* Passenger heading */}

                        <div className="section-heading">

                            <div>
                                <span className="section-kicker">
                                    TRAVELLERS
                                </span>

                                <h2>
                                    Passenger information
                                </h2>

                                <p>
                                    {totalPassengers}{' '}
                                    passenger
                                    {totalPassengers !== 1
                                        ? 's'
                                        : ''}
                                </p>
                            </div>

                        </div>

                        {/* =================================================
                           PASSENGER CARDS
                        ================================================= */}

                        {passengers.map(
                            (
                                passenger,
                                index
                            ) => {

                                const typeIndex =
                                    getTypeIndex(
                                        passengers,
                                        index
                                    );

                                return (
                                    <section
                                        key={
                                            passenger.id
                                        }
                                        className="passenger-card"
                                    >

                                        <div className="passenger-card-header">

                                            <div className="passenger-title">

                                                <div className="passenger-icon">
                                                    {passenger.type ===
                                                        'INFANT'
                                                        ? 'I'
                                                        : passenger.type ===
                                                            'CHILD'
                                                            ? 'C'
                                                            : 'A'}
                                                </div>

                                                <div>
                                                    <h3>
                                                        {getPassengerLabel(
                                                            passenger.type,
                                                            typeIndex
                                                        )}
                                                    </h3>

                                                    <span>
                                                        {getPassengerTypeLabel(
                                                            passenger.type
                                                        )}
                                                    </span>
                                                </div>

                                            </div>

                                            {index ===
                                                0 &&
                                                passenger.type ===
                                                'ADULT' && (
                                                    <span className="lead-badge">
                                                        Lead passenger
                                                    </span>
                                                )}

                                        </div>

                                        <div className="form-grid">

                                            <div className="form-field small">

                                                <label>
                                                    Title
                                                    <span>
                                                        *
                                                    </span>
                                                </label>

                                                <select
                                                    value={
                                                        passenger.title
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updatePassenger(
                                                            index,
                                                            'title',
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select
                                                    </option>

                                                    <option value="Mr">
                                                        Mr
                                                    </option>

                                                    <option value="Mrs">
                                                        Mrs
                                                    </option>

                                                    <option value="Ms">
                                                        Ms
                                                    </option>

                                                    <option value="Miss">
                                                        Miss
                                                    </option>

                                                    <option value="Master">
                                                        Master
                                                    </option>
                                                </select>

                                            </div>

                                            <div className="form-field">

                                                <label>
                                                    First name
                                                    <span>
                                                        *
                                                    </span>
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        passenger.firstName
                                                    }
                                                    placeholder="Enter first name"
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updatePassenger(
                                                            index,
                                                            'firstName',
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />

                                            </div>

                                            <div className="form-field">

                                                <label>
                                                    Last name
                                                    <span>
                                                        *
                                                    </span>
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        passenger.lastName
                                                    }
                                                    placeholder="Enter last name"
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updatePassenger(
                                                            index,
                                                            'lastName',
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />

                                            </div>

                                            <div className="form-field">

                                                <label>
                                                    Date of birth
                                                    {passenger.type !==
                                                        'ADULT' && (
                                                            <span>
                                                                *
                                                            </span>
                                                        )}
                                                </label>

                                                <input
                                                    type="date"
                                                    value={
                                                        passenger.dob
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updatePassenger(
                                                            index,
                                                            'dob',
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />

                                            </div>

                                            <div className="form-field">

                                                <label>
                                                    Nationality
                                                </label>

                                                <select
                                                    value={
                                                        passenger.nationality
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updatePassenger(
                                                            index,
                                                            'nationality',
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    <option value="Indian">
                                                        Indian
                                                    </option>

                                                    <option value="Other">
                                                        Other
                                                    </option>
                                                </select>

                                            </div>

                                            <div className="form-field">

                                                <label>
                                                    Passport number
                                                    <small>
                                                        Optional
                                                    </small>
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        passenger.passportNumber
                                                    }
                                                    placeholder="Enter passport number"
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updatePassenger(
                                                            index,
                                                            'passportNumber',
                                                            event
                                                                .target
                                                                .value
                                                                .toUpperCase()
                                                        )
                                                    }
                                                />

                                            </div>

                                        </div>

                                        <div className="name-note">
                                            Please make sure the passenger
                                            name matches the travel document.
                                        </div>

                                    </section>
                                );
                            }
                        )}

                        {/* =================================================
                           CONTACT
                        ================================================= */}

                        <section className="passenger-card contact-card">

                            <div className="passenger-card-header">

                                <div className="passenger-title">

                                    <div className="passenger-icon contact-icon">
                                        @
                                    </div>

                                    <div>
                                        <h3>
                                            Contact details
                                        </h3>

                                        <span>
                                            Booking confirmation
                                            will be sent here
                                        </span>
                                    </div>

                                </div>

                            </div>

                            <div className="form-grid contact-grid">

                                <div className="form-field">

                                    <label>
                                        Email address
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="email"
                                        value={
                                            contact.email
                                        }
                                        placeholder="example@email.com"
                                        onChange={(
                                            event
                                        ) =>
                                            updateContact(
                                                'email',
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />

                                </div>

                                <div className="form-field">

                                    <label>
                                        Mobile number
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <div className="mobile-input">

                                        <select
                                            value={
                                                contact.countryCode
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateContact(
                                                    'countryCode',
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        >
                                            <option value="+91">
                                                +91
                                            </option>

                                            <option value="+1">
                                                +1
                                            </option>

                                            <option value="+44">
                                                +44
                                            </option>

                                            <option value="+971">
                                                +971
                                            </option>
                                        </select>

                                        <input
                                            type="tel"
                                            value={
                                                contact.mobile
                                            }
                                            placeholder="Mobile number"
                                            maxLength={
                                                15
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateContact(
                                                    'mobile',
                                                    event
                                                        .target
                                                        .value
                                                        .replace(
                                                            /\D/g,
                                                            ''
                                                        )
                                                )
                                            }
                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="contact-note">
                                We'll use these details for
                                booking confirmation and important
                                flight updates.
                            </div>

                        </section>

                    </section>

                    {/* =================================================
                       RIGHT SUMMARY
                    ================================================= */}

                    <aside className="booking-sidebar">

                        <div className="summary-card">

                            <div className="summary-header">

                                <div>
                                    <span>
                                        YOUR TRIP
                                    </span>

                                    <h3>
                                        Flight summary
                                    </h3>
                                </div>

                                <div className="verified-small">
                                    ✓ Verified
                                </div>

                            </div>

                            <div className="summary-routes">

                                {routeSummary.map(
                                    (
                                        route,
                                        index
                                    ) => (
                                        <div
                                            key={
                                                `${route?.fromAirportCode}-${route?.toAirportCode}-${index}`
                                            }
                                            className="summary-route"
                                        >

                                            <div className="route-top">
                                                <strong>
                                                    {route?.fromAirportCode ||
                                                        route?.fromCityOrAirport
                                                            ?.code ||
                                                        '--'}
                                                </strong>

                                                <span>
                                                    →
                                                </span>

                                                <strong>
                                                    {route?.toAirportCode ||
                                                        route?.toCityOrAirport
                                                            ?.code ||
                                                        '--'}
                                                </strong>
                                            </div>

                                            <div className="route-date">
                                                {route?.travelDate ||
                                                    route?.departureDate ||
                                                    ''}
                                            </div>

                                        </div>
                                    )
                                )}

                            </div>

                            <div className="summary-divider" />

                            <div className="summary-row">

                                <span>
                                    Passengers
                                </span>

                                <strong>
                                    {counts.ADULT +
                                        counts.CHILD +
                                        counts.INFANT}
                                </strong>

                            </div>

                            {counts.ADULT > 0 && (
                                <div className="summary-row muted">
                                    <span>
                                        Adults
                                    </span>

                                    <span>
                                        {counts.ADULT}
                                    </span>
                                </div>
                            )}

                            {counts.CHILD > 0 && (
                                <div className="summary-row muted">
                                    <span>
                                        Children
                                    </span>

                                    <span>
                                        {counts.CHILD}
                                    </span>
                                </div>
                            )}

                            {counts.INFANT > 0 && (
                                <div className="summary-row muted">
                                    <span>
                                        Infants
                                    </span>

                                    <span>
                                        {counts.INFANT}
                                    </span>
                                </div>
                            )}

                            <div className="summary-divider" />

                            <div className="price-row">

                                <div>
                                    <span>
                                        Total fare
                                    </span>

                                    <small>
                                        Including taxes & fees
                                    </small>
                                </div>

                                <strong>
                                    ₹
                                    {totalFare.toLocaleString(
                                        'en-IN'
                                    )}
                                </strong>

                            </div>

                        </div>

                        <div className="secure-card">

                            <div className="secure-icon">
                                ✓
                            </div>

                            <div>
                                <strong>
                                    Your information is secure
                                </strong>

                                <p>
                                    Passenger information is
                                    stored only for this booking
                                    session.
                                </p>
                            </div>

                        </div>

                    </aside>

                </div>

                {/* =================================================
                   MOBILE / BOTTOM ACTION
                ================================================= */}

                <div className="continue-bar">

                    <div className="continue-price">

                        <span>
                            Total
                        </span>

                        <strong>
                            ₹
                            {totalFare.toLocaleString(
                                'en-IN'
                            )}
                        </strong>

                    </div>

                    <button
                        type="button"
                        className="continue-button"
                        disabled={saving}
                        onClick={
                            handleContinue
                        }
                    >
                        {saving
                            ? 'Saving...'
                            : 'Continue to payment'}
                        <span>
                            →
                        </span>
                    </button>

                </div>

            </main>
        </>
    );
}

/* =========================================================
   TYPE INDEX
========================================================= */

function getTypeIndex(
    passengers,
    currentIndex
) {
    const type =
        passengers?.[currentIndex]
            ?.type;

    if (!type) {
        return 0;
    }

    let index = 0;

    for (
        let i = 0;
        i <= currentIndex;
        i++
    ) {
        if (
            passengers?.[i]
                ?.type === type
        ) {
            index++;
        }
    }

    return index - 1;
}