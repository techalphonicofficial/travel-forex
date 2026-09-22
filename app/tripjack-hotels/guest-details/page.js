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
import hotelService from '@/app/services/hotelService';


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

    if (Number.isNaN(dob.getTime())) {
        return null;
    }

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

    if (Number.isNaN(date.getTime())) {
        return false;
    }

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
        errors.gender = 'Gender is required.';
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
                'Enter a valid 10-digit mobile number.';
        }

        if (compliance?.panRequired) {
            if (!guest.pan.trim()) {
                errors.pan = 'PAN is required.';
            } else if (
                !PAN_REGEX.test(
                    guest.pan.trim().toUpperCase()
                )
            ) {
                errors.pan = 'Enter a valid PAN.';
            }
        }

        if (compliance?.passportRequired) {
            if (!guest.passportNumber.trim()) {
                errors.passportNumber =
                    'Passport number is required.';
            }

            if (!guest.passportExpiry) {
                errors.passportExpiry =
                    'Passport expiry is required.';
            }
        }
    }

    if (guest.type === 'CHILD') {
        if (!guest.dob) {
            errors.dob = 'Date of birth is required.';
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
                return;
            }

            const generatedGuests = [];

            roomInfo.forEach((room, roomIndex) => {
                const adults = Number(room?.adults) || 0;
                const children = Number(room?.children) || 0;

                for (let i = 0; i < adults; i++) {
                    generatedGuests.push(
                        createGuest(
                            roomIndex,
                            i,
                            'ADULT'
                        )
                    );
                }

                for (let i = 0; i < children; i++) {
                    generatedGuests.push(
                        createGuest(
                            roomIndex,
                            i,
                            'CHILD'
                        )
                    );
                }
            });

            if (generatedGuests.length) {
                generatedGuests[0].isPrimary = true;
            }

            setGuests(generatedGuests);
        } catch (error) {
            console.error(
                'Guest Context Error:',
                error
            );

            setPageError(
                'Unable to load booking details.'
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

    const compliance =
        option?.compliance || {};

    const roomInfo =
        option?.roomInfo || [];

    const hotelName =
        bookingContext?.hotel?.hotelName ||
        review?.hotelName ||
        'Hotel';

    const totalPrice =
        option?.pricing?.totalPrice ?? 0;

    const currency =
        option?.pricing?.currency ||
        bookingContext?.search?.currency ||
        'INR';

    const adultCount = useMemo(
        () =>
            guests.filter(
                (guest) => guest.type === 'ADULT'
            ).length,
        [guests]
    );

    const childCount = useMemo(
        () =>
            guests.filter(
                (guest) => guest.type === 'CHILD'
            ).length,
        [guests]
    );

    const updateGuest = (
        index,
        field,
        value
    ) => {
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

    const handleBlur = (
        index,
        field
    ) => {
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
                [errorKey]:
                    guestErrors[field]
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
            previous.map(
                (guest, guestIndex) => ({
                    ...guest,
                    isPrimary:
                        guestIndex === index
                })
            )
        );

        setErrors((previous) => {
            const next = {
                ...previous
            };

            delete next.primary;

            return next;
        });
    };

    const validateAll = () => {
        const validationErrors = {};

        guests.forEach(
            (guest, index) => {
                const guestErrors =
                    validateGuest(
                        guest,
                        compliance
                    );

                Object.entries(
                    guestErrors
                ).forEach(
                    ([field, message]) => {
                        validationErrors[
                            `${index}.${field}`
                        ] = message;
                    }
                );
            }
        );

        const primaryGuestExists =
            guests.some(
                (guest) =>
                    guest.type === 'ADULT' &&
                    guest.isPrimary
            );

        if (!primaryGuestExists) {
            validationErrors.primary =
                'Please select one adult as primary guest.';
        }

        setErrors(validationErrors);

        const touchedFields = {};

        Object.keys(
            validationErrors
        ).forEach((key) => {
            touchedFields[key] = true;
        });

        setTouched(touchedFields);

        return (
            Object.keys(validationErrors)
                .length === 0
        );
    };

    const handleContinue = async (
        event
    ) => {
        event.preventDefault();

        setPageError('');

        if (!validateAll()) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            await Swal.fire({
                icon: 'warning',
                title: 'Check guest details',
                text:
                    'Please complete all required details.',
                confirmButtonText: 'OK',
                confirmButtonColor:
                    '#198754'
            });

            return;
        }

        try {
            setSubmitting(true);

            const primaryGuest =
                guests.find(
                    (guest) =>
                        guest.type ===
                            'ADULT' &&
                        guest.isPrimary
                ) ||
                guests.find(
                    (guest) =>
                        guest.type ===
                        'ADULT'
                );

            /*
             * Complete booking snapshot.
             * This stays in DB and will later be used
             * by backend after ICICI payment webhook.
             */
            const bookingData = {
                source: 'TRIPJACK_HOTEL',

                hotel:
                    bookingContext?.hotel ||
                    null,

                search:
                    bookingContext?.search ||
                    null,

                tripjack: {
                    correlationId:
                        bookingContext?.correlationId ||
                        review?.correlationId ||
                        null,

                    reviewHash:
                        bookingContext?.reviewHash ||
                        null,

                    bookingId:
                        review?.bookingId ||
                        null,

                    review:
                        review || null,

                    selectedOption:
                        bookingContext?.selectedOption ||
                        option ||
                        null
                },

                guests: guests.map(
                    (guest) => ({
                        roomIndex:
                            guest.roomIndex,

                        guestIndex:
                            guest.guestIndex,

                        type:
                            guest.type,

                        title:
                            guest.title,

                        firstName:
                            guest.firstName.trim(),

                        lastName:
                            guest.lastName.trim(),

                        gender:
                            guest.gender,

                        dob:
                            guest.dob ||
                            null,

                        email:
                            guest.email.trim() ||
                            null,

                        mobile:
                            guest.mobile.trim() ||
                            null,

                        pan:
                            guest.pan
                                .trim()
                                .toUpperCase() ||
                            null,

                        passportNumber:
                            guest.passportNumber
                                .trim() ||
                            null,

                        passportExpiry:
                            guest.passportExpiry ||
                            null,

                        nationality:
                            guest.nationality ||
                            'IN',

                        isPrimary:
                            Boolean(
                                guest.isPrimary
                            )
                    })
                ),

                primaryGuest:
                    primaryGuest
                        ? {
                              title:
                                  primaryGuest.title,

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

            /*
             * IMPORTANT:
             * No fetch here.
             * Booking is created through hotelService.
             */
            const result =
                await hotelService.createBooking({
                    bookingType: 'HOTEL',

                    provider:
                        'TRIPJACK',

                    providerBookingId:
                        review?.bookingId ||
                        null,

                    providerReference:
                        review?.bookingId ||
                        null,

                    status:
                        'INITIATED',

                    paymentStatus:
                        'PENDING',

                    amount,

                    currency,

                    correlationId:
                        bookingContext?.correlationId ||
                        review?.correlationId ||
                        null,

                    bookingData
                });

            if (!result?.success) {
                throw new Error(
                    result?.message ||
                        'Unable to create booking.'
                );
            }

            const booking =
                result?.data;

            if (!booking?.id) {
                throw new Error(
                    'Booking was created but booking ID is missing.'
                );
            }

            /*
             * Keep internal booking information
             * for payment page.
             */
            sessionStorage.setItem(
                'tripjack_booking',
                JSON.stringify({
                    id:
                        booking.id,

                    bookingReference:
                        booking.booking_reference ||
                        booking.bookingReference,

                    amount,

                    currency,

                    bookingType:
                        'HOTEL',

                    provider:
                        'TRIPJACK'
                })
            );

            /*
             * Keep guest information locally
             * for payment flow/UI if required.
             */
            sessionStorage.setItem(
                'tripjack_guest_details',
                JSON.stringify({
                    bookingId:
                        booking.id,

                    bookingReference:
                        booking.booking_reference ||
                        booking.bookingReference,

                    guests,

                    bookingData
                })
            );

            /*
             * Payment page.
             *
             * ICICI payment happens here.
             * TripJack BOOK API is NOT called
             * from frontend.
             */
            router.push(
                `/tripjack-hotels/payment?bookingId=${encodeURIComponent(
                    booking.id
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
                    'Something went wrong while creating the booking.',
                confirmButtonText: 'OK',
                confirmButtonColor:
                    '#198754'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getFieldError = (
        index,
        field
    ) => {
        const key = `${index}.${field}`;

        return touched[key]
            ? errors[key]
            : '';
    };

    if (loading) {
        return (
            <Container
                className="py-5"
            >
                <div className="text-center py-5">
                    <Spinner
                        animation="border"
                        variant="success"
                    />

                    <div className="mt-3 text-muted">
                        Loading guest details...
                    </div>
                </div>
            </Container>
        );
    }

    if (
        pageError &&
        !guests.length
    ) {
        return (
            <Container className="py-5">
                <Row className="justify-content-center">
                    <Col
                        xs={12}
                        md={6}
                    >
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="p-4">
                                <Alert variant="danger">
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
        <Container
            className="py-3 py-md-4"
        >
            <Row className="justify-content-center">
                <Col
                    xs={12}
                    lg={9}
                    xl={8}
                >
                    {/* HEADER */}
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <div className="small text-muted">
                                    Hotel Booking
                                </div>

                                <h3 className="fw-bold mb-0">
                                    Guest Details
                                </h3>
                            </div>

                            <Badge
                                bg="success"
                                className="px-3 py-2"
                            >
                                Step 2 of 4
                            </Badge>
                        </div>
                    </div>

                    {/* HOTEL SUMMARY */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body className="p-3">
                            <Row className="align-items-center">
                                <Col>
                                    <div className="fw-semibold">
                                        {hotelName}
                                    </div>

                                    <div className="small text-muted mt-1">
                                        {adultCount}{' '}
                                        Adult
                                        {adultCount !== 1
                                            ? 's'
                                            : ''}

                                        {childCount >
                                            0 &&
                                            ` • ${childCount} Child${
                                                childCount !==
                                                1
                                                    ? 'ren'
                                                    : ''
                                            }`}

                                        {` • ${roomInfo.length} Room${
                                            roomInfo.length !==
                                            1
                                                ? 's'
                                                : ''
                                        }`}
                                    </div>
                                </Col>

                                <Col
                                    xs="auto"
                                    className="text-end"
                                >
                                    <div className="small text-muted">
                                        Total
                                    </div>

                                    <div className="fw-bold fs-5 text-success">
                                        {currency}{' '}
                                        {Number(
                                            totalPrice
                                        ).toLocaleString(
                                            'en-IN',
                                            {
                                                minimumFractionDigits:
                                                    2,
                                                maximumFractionDigits:
                                                    2
                                            }
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* REQUIREMENTS */}
                    {(compliance.panRequired ||
                        compliance.passportRequired) && (
                        <Alert
                            variant="warning"
                            className="py-2 small"
                        >
                            <strong>
                                Additional details:
                            </strong>{' '}

                            {compliance.panRequired &&
                                'PAN is required. '}

                            {compliance.passportRequired &&
                                'Passport details are required.'}
                        </Alert>
                    )}

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

                    <Form
                        onSubmit={
                            handleContinue
                        }
                    >
                        {/* ROOMS */}
                        {roomInfo.map(
                            (
                                room,
                                roomIndex
                            ) => {
                                const roomGuests =
                                    guests.filter(
                                        (
                                            guest
                                        ) =>
                                            guest.roomIndex ===
                                            roomIndex
                                    );

                                return (
                                    <Card
                                        key={
                                            roomIndex
                                        }
                                        className="border-0 shadow-sm mb-3"
                                    >
                                        <Card.Body className="p-3">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <div className="fw-bold">
                                                        Room{' '}
                                                        {roomIndex +
                                                            1}
                                                    </div>

                                                    <div className="small text-muted">
                                                        {room?.name ||
                                                            'Selected room'}
                                                    </div>
                                                </div>

                                                <div className="small text-muted">
                                                    {
                                                        room?.adults
                                                    }{' '}
                                                    Adult
                                                    {Number(
                                                        room?.children
                                                    ) >
                                                        0 &&
                                                        ` • ${room?.children} Child`}
                                                </div>
                                            </div>

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
                                                        <div
                                                            key={`${roomIndex}-${guest.type}-${guest.guestIndex}`}
                                                            className="border rounded-3 p-3 mb-3"
                                                        >
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <div className="fw-semibold">
                                                                    {guest.type ===
                                                                    'ADULT'
                                                                        ? 'Adult'
                                                                        : 'Child'}{' '}
                                                                    {guest.guestIndex +
                                                                        1}
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
                                                                    sm={
                                                                        3
                                                                    }
                                                                >
                                                                    <Form.Group>
                                                                        <Form.Label>
                                                                            Title
                                                                        </Form.Label>

                                                                        <Form.Select
                                                                            value={
                                                                                guest.title
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateGuest(
                                                                                    guestIndex,
                                                                                    'title',
                                                                                    e
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
                                                                            isInvalid={Boolean(
                                                                                getFieldError(
                                                                                    guestIndex,
                                                                                    'title'
                                                                                )
                                                                            )}
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
                                                                            {getFieldError(
                                                                                guestIndex,
                                                                                'title'
                                                                            )}
                                                                        </Form.Control.Feedback>
                                                                    </Form.Group>
                                                                </Col>

                                                                {/* FIRST NAME */}
                                                                <Col
                                                                    xs={
                                                                        12
                                                                    }
                                                                    sm={
                                                                        4
                                                                    }
                                                                >
                                                                    <Form.Group>
                                                                        <Form.Label>
                                                                            First Name
                                                                        </Form.Label>

                                                                        <Form.Control
                                                                            value={
                                                                                guest.firstName
                                                                            }
                                                                            placeholder="First name"
                                                                            maxLength={
                                                                                50
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateGuest(
                                                                                    guestIndex,
                                                                                    'firstName',
                                                                                    e.target.value.replace(
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
                                                                            isInvalid={Boolean(
                                                                                getFieldError(
                                                                                    guestIndex,
                                                                                    'firstName'
                                                                                )
                                                                            )}
                                                                        />

                                                                        <Form.Control.Feedback type="invalid">
                                                                            {getFieldError(
                                                                                guestIndex,
                                                                                'firstName'
                                                                            )}
                                                                        </Form.Control.Feedback>
                                                                    </Form.Group>
                                                                </Col>

                                                                {/* LAST NAME */}
                                                                <Col
                                                                    xs={
                                                                        12
                                                                    }
                                                                    sm={
                                                                        5
                                                                    }
                                                                >
                                                                    <Form.Group>
                                                                        <Form.Label>
                                                                            Last Name
                                                                        </Form.Label>

                                                                        <Form.Control
                                                                            value={
                                                                                guest.lastName
                                                                            }
                                                                            placeholder="Last name"
                                                                            maxLength={
                                                                                50
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateGuest(
                                                                                    guestIndex,
                                                                                    'lastName',
                                                                                    e.target.value.replace(
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
                                                                            isInvalid={Boolean(
                                                                                getFieldError(
                                                                                    guestIndex,
                                                                                    'lastName'
                                                                                )
                                                                            )}
                                                                        />

                                                                        <Form.Control.Feedback type="invalid">
                                                                            {getFieldError(
                                                                                guestIndex,
                                                                                'lastName'
                                                                            )}
                                                                        </Form.Control.Feedback>
                                                                    </Form.Group>
                                                                </Col>

                                                                {/* GENDER */}
                                                                <Col
                                                                    xs={
                                                                        12
                                                                    }
                                                                    sm={
                                                                        4
                                                                    }
                                                                >
                                                                    <Form.Group>
                                                                        <Form.Label>
                                                                            Gender
                                                                        </Form.Label>

                                                                        <Form.Select
                                                                            value={
                                                                                guest.gender
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateGuest(
                                                                                    guestIndex,
                                                                                    'gender',
                                                                                    e
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
                                                                            isInvalid={Boolean(
                                                                                getFieldError(
                                                                                    guestIndex,
                                                                                    'gender'
                                                                                )
                                                                            )}
                                                                        >
                                                                            <option value="">
                                                                                Select
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
                                                                            {getFieldError(
                                                                                guestIndex,
                                                                                'gender'
                                                                            )}
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
                                                                        sm={
                                                                            4
                                                                        }
                                                                    >
                                                                        <Form.Group>
                                                                            <Form.Label>
                                                                                Date of Birth
                                                                            </Form.Label>

                                                                            <Form.Control
                                                                                type="date"
                                                                                max={getTodayString()}
                                                                                value={
                                                                                    guest.dob
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    updateGuest(
                                                                                        guestIndex,
                                                                                        'dob',
                                                                                        e
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
                                                                                isInvalid={Boolean(
                                                                                    getFieldError(
                                                                                        guestIndex,
                                                                                        'dob'
                                                                                    )
                                                                                )}
                                                                            />

                                                                            <Form.Text className="text-muted">
                                                                                {guest.dob
                                                                                    ? formatIndianDate(
                                                                                          guest.dob
                                                                                      )
                                                                                    : 'DD/MM/YYYY'}
                                                                            </Form.Text>

                                                                            <Form.Control.Feedback type="invalid">
                                                                                {getFieldError(
                                                                                    guestIndex,
                                                                                    'dob'
                                                                                )}
                                                                            </Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    </Col>
                                                                )}

                                                                {/* EMAIL */}
                                                                {guest.type ===
                                                                    'ADULT' && (
                                                                    <Col
                                                                        xs={
                                                                            12
                                                                        }
                                                                        sm={
                                                                            4
                                                                        }
                                                                    >
                                                                        <Form.Group>
                                                                            <Form.Label>
                                                                                Email
                                                                            </Form.Label>

                                                                            <Form.Control
                                                                                type="email"
                                                                                placeholder="name@example.com"
                                                                                value={
                                                                                    guest.email
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    updateGuest(
                                                                                        guestIndex,
                                                                                        'email',
                                                                                        e
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
                                                                                isInvalid={Boolean(
                                                                                    getFieldError(
                                                                                        guestIndex,
                                                                                        'email'
                                                                                    )
                                                                                )}
                                                                            />

                                                                            <Form.Control.Feedback type="invalid">
                                                                                {getFieldError(
                                                                                    guestIndex,
                                                                                    'email'
                                                                                )}
                                                                            </Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    </Col>
                                                                )}

                                                                {/* MOBILE */}
                                                                {guest.type ===
                                                                    'ADULT' && (
                                                                    <Col
                                                                        xs={
                                                                            12
                                                                        }
                                                                        sm={
                                                                            4
                                                                        }
                                                                    >
                                                                        <Form.Group>
                                                                            <Form.Label>
                                                                                Mobile
                                                                            </Form.Label>

                                                                            <div className="d-flex">
                                                                                <div
                                                                                    className="form-control bg-light text-center rounded-end-0"
                                                                                    style={{
                                                                                        maxWidth:
                                                                                            '58px'
                                                                                    }}
                                                                                >
                                                                                    +91
                                                                                </div>

                                                                                <Form.Control
                                                                                    className="rounded-start-0"
                                                                                    type="tel"
                                                                                    inputMode="numeric"
                                                                                    maxLength={
                                                                                        10
                                                                                    }
                                                                                    placeholder="10-digit mobile"
                                                                                    value={
                                                                                        guest.mobile
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) =>
                                                                                        updateGuest(
                                                                                            guestIndex,
                                                                                            'mobile',
                                                                                            e.target.value
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
                                                                                    isInvalid={Boolean(
                                                                                        getFieldError(
                                                                                            guestIndex,
                                                                                            'mobile'
                                                                                        )
                                                                                    )}
                                                                                />
                                                                            </div>

                                                                            {getFieldError(
                                                                                guestIndex,
                                                                                'mobile'
                                                                            ) && (
                                                                                <div className="text-danger small mt-1">
                                                                                    {getFieldError(
                                                                                        guestIndex,
                                                                                        'mobile'
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </Form.Group>
                                                                    </Col>
                                                                )}

                                                                {/* PAN */}
                                                                {guest.type ===
                                                                    'ADULT' &&
                                                                    compliance.panRequired && (
                                                                        <Col
                                                                            xs={
                                                                                12
                                                                            }
                                                                            sm={
                                                                                4
                                                                            }
                                                                        >
                                                                            <Form.Group>
                                                                                <Form.Label>
                                                                                    PAN
                                                                                </Form.Label>

                                                                                <Form.Control
                                                                                    value={
                                                                                        guest.pan
                                                                                    }
                                                                                    maxLength={
                                                                                        10
                                                                                    }
                                                                                    placeholder="ABCDE1234F"
                                                                                    style={{
                                                                                        textTransform:
                                                                                            'uppercase'
                                                                                    }}
                                                                                    onChange={(
                                                                                        e
                                                                                    ) =>
                                                                                        updateGuest(
                                                                                            guestIndex,
                                                                                            'pan',
                                                                                            e.target.value
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
                                                                                    isInvalid={Boolean(
                                                                                        getFieldError(
                                                                                            guestIndex,
                                                                                            'pan'
                                                                                        )
                                                                                    )}
                                                                                />

                                                                                <Form.Control.Feedback type="invalid">
                                                                                    {getFieldError(
                                                                                        guestIndex,
                                                                                        'pan'
                                                                                    )}
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
                                                                                sm={
                                                                                    6
                                                                                }
                                                                            >
                                                                                <Form.Group>
                                                                                    <Form.Label>
                                                                                        Passport Number
                                                                                    </Form.Label>

                                                                                    <Form.Control
                                                                                        value={
                                                                                            guest.passportNumber
                                                                                        }
                                                                                        maxLength={
                                                                                            20
                                                                                        }
                                                                                        placeholder="Passport number"
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            updateGuest(
                                                                                                guestIndex,
                                                                                                'passportNumber',
                                                                                                e.target.value
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
                                                                                        isInvalid={Boolean(
                                                                                            getFieldError(
                                                                                                guestIndex,
                                                                                                'passportNumber'
                                                                                            )
                                                                                        )}
                                                                                    />

                                                                                    <Form.Control.Feedback type="invalid">
                                                                                        {getFieldError(
                                                                                            guestIndex,
                                                                                            'passportNumber'
                                                                                        )}
                                                                                    </Form.Control.Feedback>
                                                                                </Form.Group>
                                                                            </Col>

                                                                            <Col
                                                                                xs={
                                                                                    12
                                                                                }
                                                                                sm={
                                                                                    6
                                                                                }
                                                                            >
                                                                                <Form.Group>
                                                                                    <Form.Label>
                                                                                        Passport Expiry
                                                                                    </Form.Label>

                                                                                    <Form.Control
                                                                                        type="date"
                                                                                        min={getTodayString()}
                                                                                        value={
                                                                                            guest.passportExpiry
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            updateGuest(
                                                                                                guestIndex,
                                                                                                'passportExpiry',
                                                                                                e
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
                                                                                        isInvalid={Boolean(
                                                                                            getFieldError(
                                                                                                guestIndex,
                                                                                                'passportExpiry'
                                                                                            )
                                                                                        )}
                                                                                    />

                                                                                    <Form.Text className="text-muted">
                                                                                        {guest.passportExpiry
                                                                                            ? formatIndianDate(
                                                                                                  guest.passportExpiry
                                                                                              )
                                                                                            : 'DD/MM/YYYY'}
                                                                                    </Form.Text>

                                                                                    <Form.Control.Feedback type="invalid">
                                                                                        {getFieldError(
                                                                                            guestIndex,
                                                                                            'passportExpiry'
                                                                                        )}
                                                                                    </Form.Control.Feedback>
                                                                                </Form.Group>
                                                                            </Col>
                                                                        </>
                                                                    )}
                                                            </Row>
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </Card.Body>
                                    </Card>
                                );
                            }
                        )}

                        {errors.primary && (
                            <Alert variant="danger">
                                {errors.primary}
                            </Alert>
                        )}

                        {/* FOOTER */}
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="p-3">
                                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        onClick={() =>
                                            router.back()
                                        }
                                        disabled={
                                            submitting
                                        }
                                    >
                                        ← Back
                                    </Button>

                                    <div className="text-sm-end">
                                        <div className="small text-muted">
                                            Total payable
                                        </div>

                                        <div className="fw-bold fs-5 mb-2">
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

                                        <Button
                                            type="submit"
                                            variant="success"
                                            size="lg"
                                            className="px-4 fw-semibold"
                                            disabled={
                                                submitting
                                            }
                                        >
                                            {submitting ? (
                                                <>
                                                    <Spinner
                                                        animation="border"
                                                        size="sm"
                                                        className="me-2"
                                                    />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    Continue to Pay →
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}