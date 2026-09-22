'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Spinner
} from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

const INITIAL_GUEST = {
    title: '',
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    email: '',
    mobile: '',
    pan: '',
    passportNumber: '',
    passportExpiry: '',
    nationality: 'IN',
    isPrimary: false
};

const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function createGuest(roomIndex, guestIndex, type) {
    return {
        ...INITIAL_GUEST,
        roomIndex,
        guestIndex,
        type,
        title: type === 'ADULT' ? 'Mr' : 'Master'
    };
}

function getAgeFromDate(dateString) {
    if (!dateString) return null;

    const dob = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();

    const monthDiff = today.getMonth() - dob.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
        age--;
    }

    return age;
}

function formatIndianDate(dateString) {
    if (!dateString) return '';

    const [year, month, day] = dateString.split('-');

    if (!year || !month || !day) return '';

    return `${day}/${month}/${year}`;
}

function isValidDate(dateString) {
    if (!dateString) return false;

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) return false;

    const [year, month, day] = dateString.split('-').map(Number);

    return (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month &&
        date.getDate() === day
    );
}

function getTodayString() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function validateGuest(guest, compliance) {
    const errors = {};

    if (!guest.title) {
        errors.title = 'Title is required.';
    }

    if (!guest.firstName.trim()) {
        errors.firstName = 'First name is required.';
    } else if (
        guest.firstName.trim().length < 2 ||
        !NAME_REGEX.test(guest.firstName.trim())
    ) {
        errors.firstName = 'Enter a valid first name.';
    }

    if (!guest.lastName.trim()) {
        errors.lastName = 'Last name is required.';
    } else if (
        guest.lastName.trim().length < 2 ||
        !NAME_REGEX.test(guest.lastName.trim())
    ) {
        errors.lastName = 'Enter a valid last name.';
    }

    if (!guest.gender) {
        errors.gender = 'Please select gender.';
    }

    if (guest.type === 'ADULT') {
        if (!guest.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!EMAIL_REGEX.test(guest.email.trim())) {
            errors.email = 'Enter a valid email address.';
        }

        if (!guest.mobile.trim()) {
            errors.mobile = 'Mobile number is required.';
        } else if (!MOBILE_REGEX.test(guest.mobile.trim())) {
            errors.mobile =
                'Enter a valid 10-digit Indian mobile number starting with 6-9.';
        }

        if (compliance?.panRequired) {
            if (!guest.pan.trim()) {
                errors.pan = 'PAN is required for this booking.';
            } else if (!PAN_REGEX.test(guest.pan.trim().toUpperCase())) {
                errors.pan = 'Enter a valid PAN, e.g. ABCDE1234F.';
            }
        }

        if (compliance?.passportRequired) {
            if (!guest.passportNumber.trim()) {
                errors.passportNumber = 'Passport number is required.';
            }

            if (!guest.passportExpiry) {
                errors.passportExpiry = 'Passport expiry date is required.';
            }
        }
    }

    if (guest.type === 'CHILD') {
        if (!guest.dob) {
            errors.dob = 'Child date of birth is required.';
        } else if (!isValidDate(guest.dob)) {
            errors.dob = 'Enter a valid date of birth.';
        } else {
            const age = getAgeFromDate(guest.dob);

            if (age === null) {
                errors.dob = 'Invalid date of birth.';
            } else if (age >= 18) {
                errors.dob = 'Child must be below 18 years.';
            }
        }
    }

    return errors;
}

export default function GuestDetailsPage() {
    const router = useRouter();

    const [bookingContext, setBookingContext] = useState(null);
    const [guests, setGuests] = useState([]);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pageError, setPageError] = useState('');

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(
                'tripjack_booking_context'
            );

            if (!stored) {
                setPageError(
                    'Booking session expired. Please select the room again.'
                );
                setLoading(false);
                return;
            }

            const parsed = JSON.parse(stored);

            setBookingContext(parsed);

            const roomInfo =
                parsed?.review?.option?.roomInfo ||
                parsed?.selectedOption?.roomInfo ||
                [];

            if (!roomInfo.length) {
                setPageError(
                    'Room information is missing. Please select the room again.'
                );
                setLoading(false);
                return;
            }

            const generatedGuests = [];

            roomInfo.forEach((room, roomIndex) => {
                const adults = Number(room?.adults) || 0;
                const children = Number(room?.children) || 0;

                for (let i = 0; i < adults; i++) {
                    generatedGuests.push(
                        createGuest(roomIndex, i, 'ADULT')
                    );
                }

                for (let i = 0; i < children; i++) {
                    generatedGuests.push(
                        createGuest(roomIndex, i, 'CHILD')
                    );
                }
            });

            if (generatedGuests.length > 0) {
                generatedGuests[0].isPrimary = true;
            }

            setGuests(generatedGuests);
        } catch (error) {
            console.error('Guest Context Error:', error);

            setPageError(
                'Unable to load booking details. Please start the booking again.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const review = bookingContext?.review;

    const option =
        review?.option ||
        bookingContext?.selectedOption ||
        {};

    const compliance = option?.compliance || {};

    const roomInfo =
        option?.roomInfo ||
        [];

    const hotelName =
        bookingContext?.hotel?.hotelName ||
        review?.hotelName ||
        'Hotel';

    const totalPrice =
        option?.pricing?.totalPrice ?? null;

    const currency =
        option?.pricing?.currency ||
        bookingContext?.search?.currency ||
        'INR';

    const adultCount = useMemo(
        () => guests.filter((guest) => guest.type === 'ADULT').length,
        [guests]
    );

    const childCount = useMemo(
        () => guests.filter((guest) => guest.type === 'CHILD').length,
        [guests]
    );

    const updateGuest = (index, field, value) => {
        setGuests((previous) =>
            previous.map((guest, guestIndex) =>
                guestIndex === index
                    ? {
                          ...guest,
                          [field]: value
                      }
                    : guest
            )
        );

        const errorKey = `${index}.${field}`;

        setTouched((previous) => ({
            ...previous,
            [errorKey]: true
        }));

        setErrors((previous) => {
            const next = {
                ...previous
            };

            delete next[errorKey];

            return next;
        });
    };

    const handleBlur = (index, field) => {
        const guest = guests[index];

        if (!guest) return;

        const guestErrors = validateGuest(
            guest,
            compliance
        );

        const errorKey = `${index}.${field}`;

        if (guestErrors[field]) {
            setErrors((previous) => ({
                ...previous,
                [errorKey]: guestErrors[field]
            }));
        } else {
            setErrors((previous) => {
                const next = {
                    ...previous
                };

                delete next[errorKey];

                return next;
            });
        }

        setTouched((previous) => ({
            ...previous,
            [errorKey]: true
        }));
    };

    const setPrimaryGuest = (index) => {
        setGuests((previous) =>
            previous.map((guest, guestIndex) => ({
                ...guest,
                isPrimary: guestIndex === index
            }))
        );
    };

    const validateAll = () => {
        const validationErrors = {};

        guests.forEach((guest, index) => {
            const guestErrors = validateGuest(
                guest,
                compliance
            );

            Object.entries(guestErrors).forEach(
                ([field, message]) => {
                    validationErrors[
                        `${index}.${field}`
                    ] = message;
                }
            );
        });

        const primaryGuestExists = guests.some(
            (guest) =>
                guest.type === 'ADULT' &&
                guest.isPrimary
        );

        if (!primaryGuestExists) {
            validationErrors.primary =
                'Please select one adult as the primary guest.';
        }

        setErrors(validationErrors);

        const touchedFields = {};

        Object.keys(validationErrors).forEach((key) => {
            touchedFields[key] = true;
        });

        setTouched(touchedFields);

        return Object.keys(validationErrors).length === 0;
    };

    const handleContinue = async (event) => {
        event.preventDefault();

        setPageError('');

        const valid = validateAll();

        if (!valid) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            await Swal.fire({
                icon: 'warning',
                title: 'Please check your details',
                text: 'Some guest details are missing or invalid.',
                confirmButtonText: 'Review Details',
                confirmButtonColor: '#198754'
            });

            return;
        }

        try {
            setSubmitting(true);

            const primaryGuest =
                guests.find(
                    (guest) =>
                        guest.isPrimary &&
                        guest.type === 'ADULT'
                ) ||
                guests.find(
                    (guest) => guest.type === 'ADULT'
                );

            const bookingData = {
                source: 'TRIPJACK_HOTEL',
                hotel: bookingContext?.hotel || null,
                search: bookingContext?.search || null,

                tripjack: {
                    correlationId:
                        bookingContext?.correlationId ||
                        review?.correlationId ||
                        null,

                    reviewHash:
                        bookingContext?.reviewHash ||
                        null,

                    review: review || null,

                    selectedOption:
                        bookingContext?.selectedOption ||
                        option ||
                        null
                },

                guests: guests.map((guest) => ({
                    roomIndex: guest.roomIndex,
                    guestIndex: guest.guestIndex,
                    type: guest.type,
                    title: guest.title,
                    firstName: guest.firstName.trim(),
                    lastName: guest.lastName.trim(),
                    gender: guest.gender,
                    dob: guest.dob || null,
                    email:
                        guest.email.trim() || null,
                    mobile:
                        guest.mobile.trim() || null,
                    pan:
                        guest.pan.trim().toUpperCase() ||
                        null,
                    passportNumber:
                        guest.passportNumber.trim() ||
                        null,
                    passportExpiry:
                        guest.passportExpiry || null,
                    nationality:
                        guest.nationality || 'IN',
                    isPrimary:
                        Boolean(guest.isPrimary)
                })),

                primaryGuest: primaryGuest
                    ? {
                          title: primaryGuest.title,
                          firstName:
                              primaryGuest.firstName.trim(),
                          lastName:
                              primaryGuest.lastName.trim(),
                          email:
                              primaryGuest.email.trim(),
                          mobile:
                              primaryGuest.mobile.trim()
                      }
                    : null
            };

            const amount =
                Number(totalPrice) || 0;

            const response = await fetch(
                '/api/v1/bookings',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body: JSON.stringify({
                        bookingType: 'HOTEL',
                        provider: 'TRIPJACK',

                        providerBookingId:
                            review?.bookingId ||
                            null,

                        amount,

                        currency,

                        correlationId:
                            bookingContext?.correlationId ||
                            review?.correlationId ||
                            null,

                        bookingData
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result?.success) {
                throw new Error(
                    result?.message ||
                        'Unable to create booking.'
                );
            }

            const booking = result?.data;

            /*
             * Save our internal booking reference.
             * Payment page will use this reference.
             */
            sessionStorage.setItem(
                'tripjack_booking',
                JSON.stringify({
                    id: booking?.id,
                    bookingReference:
                        booking?.booking_reference,
                    amount,
                    currency,
                    bookingType: 'HOTEL',
                    provider: 'TRIPJACK'
                })
            );

            /*
             * Keep guests + review context available
             * for payment / final TripJack booking.
             */
            sessionStorage.setItem(
                'tripjack_guest_details',
                JSON.stringify({
                    bookingId: booking?.id,
                    bookingReference:
                        booking?.booking_reference,
                    guests,
                    bookingData
                })
            );

            router.push(
                `/tripjack-hotels/payment?bookingId=${encodeURIComponent(
                    booking?.id
                )}`
            );
        } catch (error) {
            console.error(
                'Guest Details Submit Error:',
                error
            );

            setPageError(
                error?.message ||
                    'Unable to continue to payment.'
            );

            await Swal.fire({
                icon: 'error',
                title: 'Unable to Continue',
                text:
                    error?.message ||
                    'Something went wrong while saving your booking.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#198754'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getFieldError = (index, field) => {
        const key = `${index}.${field}`;

        return touched[key] ? errors[key] : '';
    };

    if (loading) {
        return (
            <Container className="py-5">
                <div className="d-flex justify-content-center align-items-center py-5">
                    <div className="text-center">
                        <Spinner
                            animation="border"
                            variant="success"
                        />
                        <div className="mt-3 text-muted">
                            Loading guest details...
                        </div>
                    </div>
                </div>
            </Container>
        );
    }

    if (pageError && !guests.length) {
        return (
            <Container className="py-5">
                <Row className="justify-content-center">
                    <Col
                        xs={12}
                        md={8}
                        lg={6}
                    >
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="p-4">
                                <Alert
                                    variant="danger"
                                    className="mb-4"
                                >
                                    {pageError}
                                </Alert>

                                <Button
                                    variant="success"
                                    onClick={() =>
                                        router.push(
                                            '/tripjack-hotels'
                                        )
                                    }
                                >
                                    Start Again
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container className="py-4 py-md-5">
            <Row className="justify-content-center">
                <Col
                    xs={12}
                    xl={10}
                >
                    {/* HEADER */}
                    <div className="mb-4">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                            <div>
                                <div className="text-muted small mb-1">
                                    Hotel Booking
                                </div>

                                <h2 className="fw-bold mb-1">
                                    Guest Details
                                </h2>

                                <div className="text-muted">
                                    Enter the details exactly as
                                    they appear on your ID.
                                </div>
                            </div>

                            <Badge
                                bg="success"
                                className="px-3 py-2 align-self-start align-self-md-center"
                            >
                                Step 2 of 4
                            </Badge>
                        </div>
                    </div>

                    {/* PROGRESS */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body className="p-3 p-md-4">
                            <Row className="g-3 text-center">
                                <Col>
                                    <div className="fw-semibold text-success">
                                        ✓ Hotel
                                    </div>
                                    <small className="text-muted">
                                        Selected
                                    </small>
                                </Col>

                                <Col>
                                    <div className="fw-semibold text-success">
                                        ✓ Room
                                    </div>
                                    <small className="text-muted">
                                        Selected
                                    </small>
                                </Col>

                                <Col>
                                    <div className="fw-semibold">
                                        3. Guests
                                    </div>
                                    <small className="text-muted">
                                        Current
                                    </small>
                                </Col>

                                <Col>
                                    <div className="fw-semibold text-muted">
                                        4. Payment
                                    </div>
                                    <small className="text-muted">
                                        Next
                                    </small>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {pageError && (
                        <Alert
                            variant="danger"
                            dismissible
                            onClose={() =>
                                setPageError('')
                            }
                        >
                            {pageError}
                        </Alert>
                    )}

                    {/* HOTEL SUMMARY */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body className="p-4">
                            <Row className="align-items-center">
                                <Col>
                                    <div className="small text-muted mb-1">
                                        Property
                                    </div>

                                    <h5 className="fw-bold mb-2">
                                        {hotelName}
                                    </h5>

                                    <div className="d-flex flex-wrap gap-2">
                                        <Badge bg="light" text="dark">
                                            {adultCount}{' '}
                                            Adult
                                            {adultCount !== 1
                                                ? 's'
                                                : ''}
                                        </Badge>

                                        {childCount > 0 && (
                                            <Badge
                                                bg="light"
                                                text="dark"
                                            >
                                                {childCount}{' '}
                                                Child
                                                {childCount !== 1
                                                    ? 'ren'
                                                    : ''}
                                            </Badge>
                                        )}

                                        <Badge
                                            bg="light"
                                            text="dark"
                                        >
                                            {roomInfo.length}{' '}
                                            Room
                                            {roomInfo.length !== 1
                                                ? 's'
                                                : ''}
                                        </Badge>
                                    </div>
                                </Col>

                                {totalPrice !== null && (
                                    <Col
                                        xs="auto"
                                        className="text-end"
                                    >
                                        <div className="small text-muted">
                                            Total
                                        </div>

                                        <div className="fs-4 fw-bold text-success">
                                            {currency}{' '}
                                            {Number(
                                                totalPrice
                                            ).toLocaleString(
                                                'en-IN',
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                }
                                            )}
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* REQUIREMENT INFO */}
                    {(compliance.panRequired ||
                        compliance.passportRequired) && (
                        <Alert
                            variant="warning"
                            className="border-0 shadow-sm"
                        >
                            <div className="fw-semibold mb-1">
                                Additional information required
                            </div>

                            {compliance.panRequired && (
                                <div>
                                    PAN is required for
                                    this booking.
                                </div>
                            )}

                            {compliance.passportRequired && (
                                <div>
                                    Passport details are
                                    required for this booking.
                                </div>
                            )}
                        </Alert>
                    )}

                    <Form onSubmit={handleContinue}>
                        {/* ROOMS */}
                        {roomInfo.map(
                            (room, roomIndex) => {
                                const roomGuests =
                                    guests.filter(
                                        (guest) =>
                                            guest.roomIndex ===
                                            roomIndex
                                    );

                                return (
                                    <Card
                                        key={roomIndex}
                                        className="border-0 shadow-sm mb-4"
                                    >
                                        <Card.Header className="bg-white border-0 p-4 pb-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="fw-bold mb-1">
                                                        Room{' '}
                                                        {roomIndex +
                                                            1}
                                                    </h5>

                                                    <div className="text-muted small">
                                                        {room?.name ||
                                                            `Room ${
                                                                roomIndex +
                                                                1
                                                            }`}
                                                    </div>
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <Badge bg="success">
                                                        {
                                                            room?.adults
                                                        }{' '}
                                                        Adult
                                                    </Badge>

                                                    {Number(
                                                        room?.children
                                                    ) >
                                                        0 && (
                                                        <Badge bg="secondary">
                                                            {
                                                                room?.children
                                                            }{' '}
                                                            Child
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </Card.Header>

                                        <Card.Body className="p-4 pt-3">
                                            {roomGuests.map(
                                                (
                                                    guest
                                                ) => {
                                                    const guestIndex =
                                                        guests.findIndex(
                                                            (
                                                                item
                                                            ) =>
                                                                item.roomIndex ===
                                                                    guest.roomIndex &&
                                                                item.guestIndex ===
                                                                    guest.guestIndex &&
                                                                item.type ===
                                                                    guest.type
                                                        );

                                                    return (
                                                        <Card
                                                            key={`${roomIndex}-${guest.type}-${guest.guestIndex}`}
                                                            className="border mb-4"
                                                        >
                                                            <Card.Body className="p-3 p-md-4">
                                                                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
                                                                    <div>
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <h6 className="fw-bold mb-0">
                                                                                {guest.type ===
                                                                                'ADULT'
                                                                                    ? 'Adult'
                                                                                    : 'Child'}{' '}
                                                                                {guest.guestIndex +
                                                                                    1}
                                                                            </h6>

                                                                            <Badge
                                                                                bg={
                                                                                    guest.type ===
                                                                                    'ADULT'
                                                                                        ? 'success'
                                                                                        : 'secondary'
                                                                                }
                                                                            >
                                                                                {
                                                                                    guest.type
                                                                                }
                                                                            </Badge>
                                                                        </div>

                                                                        <small className="text-muted">
                                                                            Guest details
                                                                        </small>
                                                                    </div>

                                                                    {guest.type ===
                                                                        'ADULT' && (
                                                                        <Form.Check
                                                                            type="radio"
                                                                            name="primaryGuest"
                                                                            label="Primary guest"
                                                                            checked={
                                                                                guest.isPrimary
                                                                            }
                                                                            onChange={() =>
                                                                                setPrimaryGuest(
                                                                                    guestIndex
                                                                                )
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>

                                                                <Row className="g-3">
                                                                    {/* TITLE */}
                                                                    <Col
                                                                        xs={
                                                                            12
                                                                        }
                                                                        md={
                                                                            2
                                                                        }
                                                                    >
                                                                        <Form.Group>
                                                                            <Form.Label>
                                                                                Title{' '}
                                                                                <span className="text-danger">
                                                                                    *
                                                                                </span>
                                                                            </Form.Label>

                                                                            <Form.Select
                                                                                value={
                                                                                    guest.title
                                                                                }
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    updateGuest(
                                                                                        guestIndex,
                                                                                        'title',
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                onBlur={() =>
                                                                                    handleBlur(
                                                                                        guestIndex,
                                                                                        'title'
                                                                                    )
                                                                                }
                                                                                isInvalid={
                                                                                    Boolean(
                                                                                        getFieldError(
                                                                                            guestIndex,
                                                                                            'title'
                                                                                        )
                                                                                    )
                                                                                }
                                                                            >
                                                                                <option value="">
                                                                                    Select
                                                                                </option>

                                                                                {guest.type ===
                                                                                'ADULT' ? (
                                                                                    <>
                                                                                        <option value="Mr">
                                                                                            Mr
                                                                                        </option>
                                                                                        <option value="Ms">
                                                                                            Ms
                                                                                        </option>
                                                                                        <option value="Mrs">
                                                                                            Mrs
                                                                                        </option>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <option value="Master">
                                                                                            Master
                                                                                        </option>
                                                                                        <option value="Miss">
                                                                                            Miss
                                                                                        </option>
                                                                                    </>
                                                                                )}
                                                                            </Form.Select>

                                                                            <Form.Control.Feedback type="invalid">
                                                                                {
                                                                                    getFieldError(
                                                                                        guestIndex,
                                                                                        'title'
                                                                                    )
                                                                                }
                                                                            </Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    </Col>

                                                                    {/* FIRST NAME */}
                                                                    <Col
                                                                        xs={
                                                                            12
                                                                        }
                                                                        md={
                                                                            5
                                                                        }
                                                                    >
                                                                        <Form.Group>
                                                                            <Form.Label>
                                                                                First Name{' '}
                                                                                <span className="text-danger">
                                                                                    *
                                                                                </span>
                                                                            </Form.Label>

                                                                            <Form.Control
                                                                                type="text"
                                                                                placeholder="Enter first name"
                                                                                value={
                                                                                    guest.firstName
                                                                                }
                                                                                maxLength={
                                                                                    50
                                                                                }
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    updateGuest(
                                                                                        guestIndex,
                                                                                        'firstName',
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                            .replace(
                                                                                                /[^A-Za-z\s.'-]/g,
                                                                                                ''
                                                                                            )
                                                                                    )
                                                                                }
                                                                                onBlur={() =>
                                                                                    handleBlur(
                                                                                        guestIndex,
                                                                                        'firstName'
                                                                                    )
                                                                                }
                                                                                isInvalid={
                                                                                    Boolean(
                                                                                        getFieldError(
                                                                                            guestIndex,
                                                                                            'firstName'
                                                                                        )
                                                                                    )
                                                                                }
                                                                            />

                                                                            <Form.Control.Feedback type="invalid">
                                                                                {
                                                                                    getFieldError(
                                                                                        guestIndex,
                                                                                        'firstName'
                                                                                    )
                                                                                }
                                                                            </Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    </Col>

                                                                    {/* LAST NAME */}
                                                                    <Col
                                                                        xs={
                                                                            12
                                                                        }
                                                                        md={
                                                                            5
                                                                        }
                                                                    >
                                                                        <Form.Group>
                                                                            <Form.Label>
                                                                                Last Name{' '}
                                                                                <span className="text-danger">
                                                                                    *
                                                                                </span>
                                                                            </Form.Label>

                                                                            <Form.Control
                                                                                type="text"
                                                                                placeholder="Enter last name"
                                                                                value={
                                                                                    guest.lastName
                                                                                }
                                                                                maxLength={
                                                                                    50
                                                                                }
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    updateGuest(
                                                                                        guestIndex,
                                                                                        'lastName',
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                            .replace(
                                                                                                /[^A-Za-z\s.'-]/g,
                                                                                                ''
                                                                                            )
                                                                                    )
                                                                                }
                                                                                onBlur={() =>
                                                                                    handleBlur(
                                                                                        guestIndex,
                                                                                        'lastName'
                                                                                    )
                                                                                }
                                                                                isInvalid={
                                                                                    Boolean(
                                                                                        getFieldError(
                                                                                            guestIndex,
                                                                                            'lastName'
                                                                                        )
                                                                                    )
                                                                                }
                                                                            />

                                                                            <Form.Control.Feedback type="invalid">
                                                                                {
                                                                                    getFieldError(
                                                                                        guestIndex,
                                                                                        'lastName'
                                                                                    )
                                                                                }
                                                                            </Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    </Col>

                                                                    {/* GENDER */}
                                                                    <Col
                                                                        xs={
                                                                            12
                                                                        }
                                                                        md={
                                                                            4
                                                                        }
                                                                    >
                                                                        <Form.Group>
                                                                            <Form.Label>
                                                                                Gender{' '}
                                                                                <span className="text-danger">
                                                                                    *
                                                                                </span>
                                                                            </Form.Label>

                                                                            <Form.Select
                                                                                value={
                                                                                    guest.gender
                                                                                }
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    updateGuest(
                                                                                        guestIndex,
                                                                                        'gender',
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                onBlur={() =>
                                                                                    handleBlur(
                                                                                        guestIndex,
                                                                                        'gender'
                                                                                    )
                                                                                }
                                                                                isInvalid={
                                                                                    Boolean(
                                                                                        getFieldError(
                                                                                            guestIndex,
                                                                                            'gender'
                                                                                        )
                                                                                    )
                                                                                }
                                                                            >
                                                                                <option value="">
                                                                                    Select gender
                                                                                </option>
                                                                                <option value="MALE">
                                                                                    Male
                                                                                </option>
                                                                                <option value="FEMALE">
                                                                                    Female
                                                                                </option>
                                                                                <option value="OTHER">
                                                                                    Other
                                                                                </option>
                                                                            </Form.Select>

                                                                            <Form.Control.Feedback type="invalid">
                                                                                {
                                                                                    getFieldError(
                                                                                        guestIndex,
                                                                                        'gender'
                                                                                    )
                                                                                }
                                                                            </Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    </Col>

                                                                    {/* CHILD DOB */}
                                                                    {guest.type ===
                                                                        'CHILD' && (
                                                                        <Col
                                                                            xs={
                                                                                12
                                                                            }
                                                                            md={
                                                                                4
                                                                            }
                                                                        >
                                                                            <Form.Group>
                                                                                <Form.Label>
                                                                                    Date of Birth{' '}
                                                                                    <span className="text-danger">
                                                                                        *
                                                                                    </span>
                                                                                </Form.Label>

                                                                                <Form.Control
                                                                                    type="date"
                                                                                    max={
                                                                                        getTodayString()
                                                                                    }
                                                                                    value={
                                                                                        guest.dob
                                                                                    }
                                                                                    onChange={(
                                                                                        event
                                                                                    ) =>
                                                                                        updateGuest(
                                                                                            guestIndex,
                                                                                            'dob',
                                                                                            event
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    onBlur={() =>
                                                                                        handleBlur(
                                                                                            guestIndex,
                                                                                            'dob'
                                                                                        )
                                                                                    }
                                                                                    isInvalid={
                                                                                        Boolean(
                                                                                            getFieldError(
                                                                                                guestIndex,
                                                                                                'dob'
                                                                                            )
                                                                                        )
                                                                                    }
                                                                                />

                                                                                <Form.Text className="text-muted">
                                                                                    {guest.dob
                                                                                        ? `Selected: ${formatIndianDate(
                                                                                              guest.dob
                                                                                          )}`
                                                                                        : 'Format: DD/MM/YYYY'}
                                                                                </Form.Text>

                                                                                <Form.Control.Feedback type="invalid">
                                                                                    {
                                                                                        getFieldError(
                                                                                            guestIndex,
                                                                                            'dob'
                                                                                        )
                                                                                    }
                                                                                </Form.Control.Feedback>
                                                                            </Form.Group>
                                                                        </Col>
                                                                    )}

                                                                    {/* ADULT CONTACT */}
                                                                    {guest.type ===
                                                                        'ADULT' && (
                                                                        <>
                                                                            <Col
                                                                                xs={
                                                                                    12
                                                                                }
                                                                                md={
                                                                                    4
                                                                                }
                                                                            >
                                                                                <Form.Group>
                                                                                    <Form.Label>
                                                                                        Email{' '}
                                                                                        <span className="text-danger">
                                                                                            *
                                                                                        </span>
                                                                                    </Form.Label>

                                                                                    <Form.Control
                                                                                        type="email"
                                                                                        placeholder="name@example.com"
                                                                                        value={
                                                                                            guest.email
                                                                                        }
                                                                                        maxLength={
                                                                                            100
                                                                                        }
                                                                                        onChange={(
                                                                                            event
                                                                                        ) =>
                                                                                            updateGuest(
                                                                                                guestIndex,
                                                                                                'email',
                                                                                                event
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                        onBlur={() =>
                                                                                            handleBlur(
                                                                                                guestIndex,
                                                                                                'email'
                                                                                            )
                                                                                        }
                                                                                        isInvalid={
                                                                                            Boolean(
                                                                                                getFieldError(
                                                                                                    guestIndex,
                                                                                                    'email'
                                                                                                )
                                                                                            )
                                                                                        }
                                                                                    />

                                                                                    <Form.Control.Feedback type="invalid">
                                                                                        {
                                                                                            getFieldError(
                                                                                                guestIndex,
                                                                                                'email'
                                                                                            )
                                                                                        }
                                                                                    </Form.Control.Feedback>
                                                                                </Form.Group>
                                                                            </Col>

                                                                            <Col
                                                                                xs={
                                                                                    12
                                                                                }
                                                                                md={
                                                                                    4
                                                                                }
                                                                            >
                                                                                <Form.Group>
                                                                                    <Form.Label>
                                                                                        Mobile Number{' '}
                                                                                        <span className="text-danger">
                                                                                            *
                                                                                        </span>
                                                                                    </Form.Label>

                                                                                    <div className="d-flex">
                                                                                        <div
                                                                                            className="form-control bg-light text-center"
                                                                                            style={{
                                                                                                maxWidth:
                                                                                                    '70px'
                                                                                            }}
                                                                                        >
                                                                                            +91
                                                                                        </div>

                                                                                        <Form.Control
                                                                                            className="rounded-start-0"
                                                                                            type="tel"
                                                                                            inputMode="numeric"
                                                                                            placeholder="10-digit mobile"
                                                                                            value={
                                                                                                guest.mobile
                                                                                            }
                                                                                            maxLength={
                                                                                                10
                                                                                            }
                                                                                            onChange={(
                                                                                                event
                                                                                            ) =>
                                                                                                updateGuest(
                                                                                                    guestIndex,
                                                                                                    'mobile',
                                                                                                    event
                                                                                                        .target
                                                                                                        .value
                                                                                                        .replace(
                                                                                                            /\D/g,
                                                                                                            ''
                                                                                                        )
                                                                                                        .slice(
                                                                                                            0,
                                                                                                            10
                                                                                                        )
                                                                                                )
                                                                                            }
                                                                                            onBlur={() =>
                                                                                                handleBlur(
                                                                                                    guestIndex,
                                                                                                    'mobile'
                                                                                                )
                                                                                            }
                                                                                            isInvalid={
                                                                                                Boolean(
                                                                                                    getFieldError(
                                                                                                        guestIndex,
                                                                                                        'mobile'
                                                                                                    )
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>

                                                                                    {getFieldError(
                                                                                        guestIndex,
                                                                                        'mobile'
                                                                                    ) && (
                                                                                        <div className="text-danger small mt-1">
                                                                                            {
                                                                                                getFieldError(
                                                                                                    guestIndex,
                                                                                                    'mobile'
                                                                                                )
                                                                                            }
                                                                                        </div>
                                                                                    )}
                                                                                </Form.Group>
                                                                            </Col>
                                                                        </>
                                                                    )}

                                                                    {/* PAN */}
                                                                    {guest.type ===
                                                                        'ADULT' &&
                                                                        compliance.panRequired && (
                                                                            <Col
                                                                                xs={
                                                                                    12
                                                                                }
                                                                                md={
                                                                                    4
                                                                                }
                                                                            >
                                                                                <Form.Group>
                                                                                    <Form.Label>
                                                                                        PAN Number{' '}
                                                                                        <span className="text-danger">
                                                                                            *
                                                                                        </span>
                                                                                    </Form.Label>

                                                                                    <Form.Control
                                                                                        type="text"
                                                                                        placeholder="ABCDE1234F"
                                                                                        value={
                                                                                            guest.pan
                                                                                        }
                                                                                        maxLength={
                                                                                            10
                                                                                        }
                                                                                        style={{
                                                                                            textTransform:
                                                                                                'uppercase'
                                                                                        }}
                                                                                        onChange={(
                                                                                            event
                                                                                        ) =>
                                                                                            updateGuest(
                                                                                                guestIndex,
                                                                                                'pan',
                                                                                                event
                                                                                                    .target
                                                                                                    .value
                                                                                                    .toUpperCase()
                                                                                                    .replace(
                                                                                                        /[^A-Z0-9]/g,
                                                                                                        ''
                                                                                                    )
                                                                                                    .slice(
                                                                                                        0,
                                                                                                        10
                                                                                                    )
                                                                                            )
                                                                                        }
                                                                                        onBlur={() =>
                                                                                            handleBlur(
                                                                                                guestIndex,
                                                                                                'pan'
                                                                                            )
                                                                                        }
                                                                                        isInvalid={
                                                                                            Boolean(
                                                                                                getFieldError(
                                                                                                    guestIndex,
                                                                                                    'pan'
                                                                                                )
                                                                                            )
                                                                                        }
                                                                                    />

                                                                                    <Form.Text className="text-muted">
                                                                                        Example:{' '}
                                                                                        ABCDE1234F
                                                                                    </Form.Text>

                                                                                    <Form.Control.Feedback type="invalid">
                                                                                        {
                                                                                            getFieldError(
                                                                                                guestIndex,
                                                                                                'pan'
                                                                                            )
                                                                                        }
                                                                                    </Form.Control.Feedback>
                                                                                </Form.Group>
                                                                            </Col>
                                                                        )}

                                                                    {/* PASSPORT */}
                                                                    {guest.type ===
                                                                        'ADULT' &&
                                                                        compliance.passportRequired && (
                                                                            <>
                                                                                <Col
                                                                                    xs={
                                                                                        12
                                                                                    }
                                                                                    md={
                                                                                        6
                                                                                    }
                                                                                >
                                                                                    <Form.Group>
                                                                                        <Form.Label>
                                                                                            Passport Number{' '}
                                                                                            <span className="text-danger">
                                                                                                *
                                                                                            </span>
                                                                                        </Form.Label>

                                                                                        <Form.Control
                                                                                            type="text"
                                                                                            placeholder="Enter passport number"
                                                                                            value={
                                                                                                guest.passportNumber
                                                                                            }
                                                                                            maxLength={
                                                                                                20
                                                                                            }
                                                                                            onChange={(
                                                                                                event
                                                                                            ) =>
                                                                                                updateGuest(
                                                                                                    guestIndex,
                                                                                                    'passportNumber',
                                                                                                    event
                                                                                                        .target
                                                                                                        .value
                                                                                                        .toUpperCase()
                                                                                                        .replace(
                                                                                                            /\s/g,
                                                                                                            ''
                                                                                                        )
                                                                                                )
                                                                                            }
                                                                                            onBlur={() =>
                                                                                                handleBlur(
                                                                                                    guestIndex,
                                                                                                    'passportNumber'
                                                                                                )
                                                                                            }
                                                                                            isInvalid={
                                                                                                Boolean(
                                                                                                    getFieldError(
                                                                                                        guestIndex,
                                                                                                        'passportNumber'
                                                                                                    )
                                                                                                )
                                                                                            }
                                                                                        />

                                                                                        <Form.Control.Feedback type="invalid">
                                                                                            {
                                                                                                getFieldError(
                                                                                                    guestIndex,
                                                                                                    'passportNumber'
                                                                                                )
                                                                                            }
                                                                                        </Form.Control.Feedback>
                                                                                    </Form.Group>
                                                                                </Col>

                                                                                <Col
                                                                                    xs={
                                                                                        12
                                                                                    }
                                                                                    md={
                                                                                        6
                                                                                    }
                                                                                >
                                                                                    <Form.Group>
                                                                                        <Form.Label>
                                                                                            Passport Expiry{' '}
                                                                                            <span className="text-danger">
                                                                                                *
                                                                                            </span>
                                                                                        </Form.Label>

                                                                                        <Form.Control
                                                                                            type="date"
                                                                                            min={
                                                                                                getTodayString()
                                                                                            }
                                                                                            value={
                                                                                                guest.passportExpiry
                                                                                            }
                                                                                            onChange={(
                                                                                                event
                                                                                            ) =>
                                                                                                updateGuest(
                                                                                                    guestIndex,
                                                                                                    'passportExpiry',
                                                                                                    event
                                                                                                        .target
                                                                                                        .value
                                                                                                )
                                                                                            }
                                                                                            onBlur={() =>
                                                                                                handleBlur(
                                                                                                    guestIndex,
                                                                                                    'passportExpiry'
                                                                                                )
                                                                                            }
                                                                                            isInvalid={
                                                                                                Boolean(
                                                                                                    getFieldError(
                                                                                                        guestIndex,
                                                                                                        'passportExpiry'
                                                                                                    )
                                                                                                )
                                                                                            }
                                                                                        />

                                                                                        <Form.Text className="text-muted">
                                                                                            {guest.passportExpiry
                                                                                                ? `Selected: ${formatIndianDate(
                                                                                                      guest.passportExpiry
                                                                                                  )}`
                                                                                                : 'Format: DD/MM/YYYY'}
                                                                                        </Form.Text>

                                                                                        <Form.Control.Feedback type="invalid">
                                                                                            {
                                                                                                getFieldError(
                                                                                                    guestIndex,
                                                                                                    'passportExpiry'
                                                                                                )
                                                                                            }
                                                                                        </Form.Control.Feedback>
                                                                                    </Form.Group>
                                                                                </Col>
                                                                            </>
                                                                        )}
                                                                </Row>
                                                            </Card.Body>
                                                        </Card>
                                                    );
                                                }
                                            )}
                                        </Card.Body>
                                    </Card>
                                );
                            }
                        )}

                        {/* PRIMARY ERROR */}
                        {errors.primary && (
                            <Alert variant="danger">
                                {errors.primary}
                            </Alert>
                        )}

                        {/* IMPORTANT */}
                        <Alert
                            variant="light"
                            className="border shadow-sm"
                        >
                            <div className="fw-semibold mb-1">
                                Important
                            </div>

                            <div className="small text-muted">
                                Please enter the guest name exactly
                                as it appears on the identification
                                document. Incorrect details may
                                affect your hotel booking.
                            </div>
                        </Alert>

                        {/* ACTIONS */}
                        <Card className="border-0 shadow-sm mt-4">
                            <Card.Body className="p-3 p-md-4">
                                <div className="d-flex flex-column-reverse flex-md-row justify-content-between gap-3">
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        size="lg"
                                        onClick={() =>
                                            router.back()
                                        }
                                        disabled={submitting}
                                    >
                                        ← Back
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="success"
                                        size="lg"
                                        className="px-5 fw-semibold"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Spinner
                                                    animation="border"
                                                    size="sm"
                                                    className="me-2"
                                                />
                                                Saving Details...
                                            </>
                                        ) : (
                                            <>
                                                Continue to Payment →
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}