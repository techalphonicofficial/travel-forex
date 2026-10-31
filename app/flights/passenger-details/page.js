'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import './passenger-details.css';
import BookingTopBar, { getSessionExpiry, useSessionTimer } from '../BookingTopBar';

/* =========================================================
   CONSTANTS
========================================================= */

const FLOW_KEY = 'tripjack_passenger_flow';
const AUTH_KEY = 'wl_auth';
const AUTH_EVENT = 'wl_auth_changed';
const NEXT_ROUTE = '/flights/seat-selection';

const PAX_LABELS = { ADULT: 'Adult', CHILD: 'Child', INFANT: 'Infant' };

/* TripJack travellerInfo.ti */
const TITLES = {
    ADULT: ['Mr', 'Ms', 'Mrs'],
    CHILD: ['Master', 'Ms'],
    INFANT: ['Master', 'Ms'],
};

/* ISO country codes sent as TripJack pNat */
const NATIONALITIES = [
    ['IN', 'India'], ['AE', 'United Arab Emirates'], ['US', 'United States'], ['GB', 'United Kingdom'],
    ['CA', 'Canada'], ['AU', 'Australia'], ['NZ', 'New Zealand'], ['SG', 'Singapore'],
    ['MY', 'Malaysia'], ['TH', 'Thailand'], ['NP', 'Nepal'], ['BD', 'Bangladesh'],
    ['LK', 'Sri Lanka'], ['BT', 'Bhutan'], ['MV', 'Maldives'], ['SA', 'Saudi Arabia'],
    ['QA', 'Qatar'], ['OM', 'Oman'], ['KW', 'Kuwait'], ['BH', 'Bahrain'],
    ['DE', 'Germany'], ['FR', 'France'], ['IT', 'Italy'], ['ES', 'Spain'],
    ['NL', 'Netherlands'], ['CH', 'Switzerland'], ['IE', 'Ireland'], ['RU', 'Russia'],
    ['JP', 'Japan'], ['CN', 'China'], ['HK', 'Hong Kong'], ['KR', 'South Korea'],
    ['ID', 'Indonesia'], ['PH', 'Philippines'], ['VN', 'Vietnam'], ['ZA', 'South Africa'],
    ['KE', 'Kenya'], ['MU', 'Mauritius'], ['AF', 'Afghanistan'], ['PK', 'Pakistan'],
];

const COUNTRY_CODES = ['+91', '+971', '+1', '+44', '+61', '+65', '+60', '+977', '+880', '+94', '+966', '+974', '+968', '+965', '+973'];

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSPORT_REGEX = /^[A-Z0-9]{6,15}$/;
const NAME_REGEX = /^[A-Za-z ]+$/;

/* =========================================================
   HELPERS
========================================================= */

const money = (value) =>
    `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatTime = (value) => {
    const match = String(value || '').match(/T(\d{2}:\d{2})/);
    return match ? match[1] : '--';
};

const formatDate = (value) => {
    if (!value) return '--';
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
};

/* Age in full years on a given date (YYYY-MM-DD strings) */
const ageOn = (dob, onDate) => {
    if (!dob || !onDate) return null;
    const [by, bm, bd] = dob.split('-').map(Number);
    const [ty, tm, td] = String(onDate).slice(0, 10).split('-').map(Number);
    if (!by || !ty) return null;
    let age = ty - by;
    if (tm < bm || (tm === bm && td < bd)) age -= 1;
    return age;
};

const getTrips = (review) => {
    const value = review?.tripInfos || [];
    if (Array.isArray(value)) return value;
    return Object.values(value || {}).filter(Array.isArray).flat();
};

const emptyPassenger = (type, index) => ({
    id: `${type}-${index + 1}`,
    type,
    title: '',
    firstName: '',
    lastName: '',
    dob: '',
    nationality: 'IN',
    passportNumber: '',
    passportExpiry: '',
    passportIssueDate: '',
    pan: '',
    documentId: '',
});

const buildPassengers = (paxInfo, existing = []) =>
    ['ADULT', 'CHILD', 'INFANT'].flatMap((type) =>
        Array.from({ length: Number(paxInfo?.[type] || 0) }, (_, index) => {
            const id = `${type}-${index + 1}`;
            const saved = existing.find((passenger) => passenger?.id === id);
            /* old flows stored nationality as "Indian" */
            const nationality = saved?.nationality && saved.nationality.length === 2 ? saved.nationality : 'IN';
            return { ...emptyPassenger(type, index), ...(saved || {}), nationality };
        })
    );

/*
 * Which traveller fields this booking needs, from TripJack
 * review conditions + domestic / international.
 */
const getRequirements = (flow) => {
    const review = flow?.review || {};
    const c = review?.conditions || {};
    const isDomestic = review?.searchQuery?.isDomestic !== false;
    const fareType = String(flow?.search?.fareType || review?.searchQuery?.searchModifiers?.pft || '').toUpperCase();
    const passport = !isDomestic || Boolean(c?.pcs?.pm);

    return {
        isDomestic,
        passport,
        passportIssueDate: Boolean(c?.pcs?.pid),
        dob: {
            ADULT: Boolean(c?.dob?.adobr) || !isDomestic,
            CHILD: Boolean(c?.dob?.cdobr) || !isDomestic,
            INFANT: true,
        },
        /* TripJack takes one PAN per booking, on the lead traveller */
        pan: Boolean(c?.ipa) || !isDomestic,
        documentId: Boolean(c?.dc?.ida || c?.dc?.idm) || ['STUDENT', 'SENIOR_CITIZEN'].includes(fareType),
        documentIdRequired: Boolean(c?.dc?.idm) || ['STUDENT', 'SENIOR_CITIZEN'].includes(fareType),
        documentIdLabel: fareType === 'SENIOR_CITIZEN' ? 'Senior citizen ID' : fareType === 'STUDENT' ? 'Student ID' : 'Student / Senior citizen ID',
        gst: Boolean(c?.gst?.gstappl || c?.gst?.igm),
        gstRequired: Boolean(c?.gst?.igm),
        emergencyContact: Boolean(c?.iecr),
        firstNameMax: Number(c?.anlm?.fN) || 32,
        lastNameMax: Number(c?.anlm?.lN) || 32,
        lastNameMin: Math.max(1, Number(c?.anlm?.lnml) || 1),
    };
};

/* =========================================================
   VALIDATION
========================================================= */

const validate = ({ passengers, contact, gst, emergency, req, firstTravel, lastTravel }) => {
    const errors = {};
    const set = (key, message) => { if (!errors[key]) errors[key] = message; };

    passengers.forEach((p, i) => {
        const k = (field) => `${i}.${field}`;
        const first = p.firstName.trim();
        const last = p.lastName.trim();

        if (!p.title) set(k('title'), 'Select title');

        if (!first) set(k('firstName'), 'Enter first name');
        else if (!NAME_REGEX.test(first)) set(k('firstName'), 'Use letters only');
        else if (first.length > req.firstNameMax) set(k('firstName'), `Max ${req.firstNameMax} characters`);

        if (!last) set(k('lastName'), 'Enter last name');
        else if (!NAME_REGEX.test(last)) set(k('lastName'), 'Use letters only');
        else if (last.length < req.lastNameMin) set(k('lastName'), `Min ${req.lastNameMin} characters`);
        else if (last.length > req.lastNameMax) set(k('lastName'), `Max ${req.lastNameMax} characters`);

        const dobRequired = req.dob[p.type];
        if (dobRequired && !p.dob) set(k('dob'), 'Enter date of birth');
        if (p.dob) {
            const ageStart = ageOn(p.dob, firstTravel);
            const ageEnd = ageOn(p.dob, lastTravel);
            if (ageStart === null || ageStart < 0 || p.dob > (firstTravel || '9999')) set(k('dob'), 'Enter a valid date of birth');
            else if (p.type === 'ADULT' && ageStart < 12) set(k('dob'), 'Adult must be 12 years or older');
            else if (p.type === 'CHILD' && (ageStart < 2 || ageStart >= 12)) set(k('dob'), 'Child must be 2–11 years on the travel date');
            else if (p.type === 'INFANT' && ageEnd >= 2) set(k('dob'), 'Infant must be under 2 years for the whole trip');
        }

        if (req.passport) {
            const number = p.passportNumber.trim().toUpperCase();
            if (!p.nationality) set(k('nationality'), 'Select nationality');
            if (!number) set(k('passportNumber'), 'Enter passport number');
            else if (!PASSPORT_REGEX.test(number)) set(k('passportNumber'), 'Enter a valid passport number');
            if (!p.passportExpiry) set(k('passportExpiry'), 'Enter passport expiry date');
            else if (lastTravel && p.passportExpiry <= lastTravel) set(k('passportExpiry'), 'Passport must be valid beyond your travel date');
            if (req.passportIssueDate && !p.passportIssueDate) set(k('passportIssueDate'), 'Enter passport issue date');
            if (p.passportIssueDate && firstTravel && p.passportIssueDate >= firstTravel) set(k('passportIssueDate'), 'Enter a valid issue date');
        }

        if (req.pan && i === 0) {
            const pan = p.pan.trim().toUpperCase();
            if (!pan) set(k('pan'), 'Enter PAN of the lead traveller');
            else if (!PAN_REGEX.test(pan)) set(k('pan'), 'Enter a valid PAN (e.g. ABCDE1234F)');
        }

        if (req.documentId && req.documentIdRequired && p.type !== 'INFANT' && !p.documentId.trim()) {
            set(k('documentId'), `Enter ${req.documentIdLabel.toLowerCase()}`);
        }
    });

    if (!contact.email.trim()) set('contact.email', 'Enter email address');
    else if (!EMAIL_REGEX.test(contact.email.trim())) set('contact.email', 'Enter a valid email address');

    const mobile = contact.mobile.replace(/\D/g, '');
    if (!mobile) set('contact.mobile', 'Enter mobile number');
    else if (contact.countryCode === '+91' ? !/^[6-9]\d{9}$/.test(mobile) : (mobile.length < 6 || mobile.length > 14)) {
        set('contact.mobile', 'Enter a valid mobile number');
    }

    if (req.emergencyContact) {
        if (!emergency.name.trim()) set('emergency.name', 'Enter contact name');
        if (!/^[6-9]\d{9}$/.test(emergency.mobile.replace(/\D/g, ''))) set('emergency.mobile', 'Enter a valid 10-digit mobile number');
    }

    if (gst.enabled || req.gstRequired) {
        if (!GST_REGEX.test(gst.gstNumber.trim().toUpperCase())) set('gst.gstNumber', 'Enter a valid 15-character GSTIN');
        if (!gst.registeredName.trim()) set('gst.registeredName', 'Enter registered company name');
        if (gst.email.trim() && !EMAIL_REGEX.test(gst.email.trim())) set('gst.email', 'Enter a valid email address');
    }

    return errors;
};

/* =========================================================
   FIELD
========================================================= */

function Field({ label, error, hint, optional, children, wide }) {
    return (
        <label className={`pd-field ${error ? 'has-error' : ''} ${wide ? 'wide' : ''}`}>
            <span className="pd-label">
                {label}
                {optional && <i> (optional)</i>}
            </span>
            {children}
            {error ? <small className="pd-error">{error}</small> : hint ? <small className="pd-hint">{hint}</small> : null}
        </label>
    );
}

/* =========================================================
   FORM (mounted once the booking flow is loaded)
========================================================= */

function TravellerForm({ flow }) {
    const router = useRouter();

    const isLoggedIn = useSyncExternalStore(
        (onChange) => {
            window.addEventListener('storage', onChange);
            window.addEventListener(AUTH_EVENT, onChange);
            return () => {
                window.removeEventListener('storage', onChange);
                window.removeEventListener(AUTH_EVENT, onChange);
            };
        },
        () => {
            try {
                return Boolean(JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')?.id);
            } catch {
                return false;
            }
        },
        () => true
    );

    const review = useMemo(() => flow.review || {}, [flow]);
    const req = useMemo(() => getRequirements(flow), [flow]);
    const paxInfo = review?.searchQuery?.paxInfo || flow?.request?.searchQuery?.paxInfo || {};

    const [passengers, setPassengers] = useState(() => buildPassengers(paxInfo, flow.passengers || []));
    const [contact, setContact] = useState(() => ({
        email: flow?.contact?.email || '',
        mobile: flow?.contact?.mobile || '',
        countryCode: flow?.contact?.countryCode || '+91',
    }));
    const [gst, setGst] = useState(() => ({
        enabled: Boolean(flow?.gstInfo?.gstNumber) || req.gstRequired,
        gstNumber: flow?.gstInfo?.gstNumber || '',
        registeredName: flow?.gstInfo?.registeredName || '',
        email: flow?.gstInfo?.email || '',
        mobile: flow?.gstInfo?.mobile || '',
        address: flow?.gstInfo?.address || '',
    }));
    const [emergency, setEmergency] = useState(() => ({
        name: flow?.emergencyContact?.name || '',
        mobile: flow?.emergencyContact?.mobile || '',
    }));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    /* Journeys for the trip strip + age checks */
    const journeys = useMemo(() => getTrips(review).map((trip) => {
        const segments = Array.isArray(trip?.sI) ? trip.sI : [];
        return { segments, first: segments[0], last: segments[segments.length - 1] };
    }).filter((journey) => journey.first), [review]);

    const firstTravel = String(journeys[0]?.first?.dt || '').slice(0, 10);
    const lastTravel = String(journeys[journeys.length - 1]?.last?.at || '').slice(0, 10);

    const fare = review?.totalPriceInfo?.totalFareDetail?.fC || {};
    const total = Number(fare.TF || 0);

    const expiresAt = getSessionExpiry(flow);
    const secondsLeft = useSessionTimer(expiresAt);
    const sessionExpired = secondsLeft === 0;

    const errors = useMemo(
        () => (submitted ? validate({ passengers, contact, gst, emergency, req, firstTravel, lastTravel }) : {}),
        [submitted, passengers, contact, gst, emergency, req, firstTravel, lastTravel]
    );

    /* ---------- persistence ---------- */

    const buildFlow = (overrides = {}) => {
        const current = JSON.parse(sessionStorage.getItem(FLOW_KEY) || 'null') || flow;
        const mobile = contact.mobile.replace(/\D/g, '');
        return {
            ...current,
            passengers: passengers.map((p, index) => ({
                ...p,
                firstName: p.firstName.trim().replace(/\s+/g, ' '),
                lastName: p.lastName.trim().replace(/\s+/g, ' '),
                passportNumber: req.passport ? p.passportNumber.trim().toUpperCase() : '',
                passportExpiry: req.passport ? p.passportExpiry : '',
                passportIssueDate: req.passport ? p.passportIssueDate : '',
                nationality: req.passport ? p.nationality : p.nationality || 'IN',
                pan: req.pan && index === 0 ? p.pan.trim().toUpperCase() : '',
                documentId: req.documentId && p.type !== 'INFANT' ? p.documentId.trim() : '',
                isLead: index === 0,
            })),
            contact: { email: contact.email.trim(), mobile, countryCode: contact.countryCode },
            gstInfo: gst.enabled || req.gstRequired
                ? {
                    gstNumber: gst.gstNumber.trim().toUpperCase(),
                    registeredName: gst.registeredName.trim(),
                    email: gst.email.trim(),
                    mobile: gst.mobile.replace(/\D/g, ''),
                    address: gst.address.trim(),
                }
                : null,
            emergencyContact: req.emergencyContact
                ? { name: emergency.name.trim(), mobile: emergency.mobile.replace(/\D/g, '') }
                : null,
            updatedAt: new Date().toISOString(),
            ...overrides,
        };
    };

    const persist = () => {
        try {
            sessionStorage.setItem(FLOW_KEY, JSON.stringify(buildFlow()));
        } catch {
            /* storage full / disabled */
        }
    };

    /* ---------- updates ---------- */

    const updatePassenger = (index, field, value) =>
        setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

    /* ---------- continue ---------- */

    const handleContinue = () => {
        if (saving || sessionExpired) return;

        setSubmitted(true);
        const found = validate({ passengers, contact, gst, emergency, req, firstTravel, lastTravel });
        const keys = Object.keys(found);

        if (keys.length) {
            toast.error(keys.length === 1 ? found[keys[0]] : `Please correct ${keys.length} highlighted fields.`);
            setTimeout(() => {
                document.querySelector('.pd-field.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
            return;
        }

        persist();

        if (!isLoggedIn) {
            toast('Please log in to continue with your booking.', { icon: '🔒' });
            router.push(`/auth/login?redirect=${encodeURIComponent('/flights/passenger-details')}`);
            return;
        }

        setSaving(true);
        try {
            sessionStorage.setItem(
                FLOW_KEY,
                JSON.stringify(buildFlow({
                    payment: { ...(flow.payment || {}), status: 'PENDING' },
                    booking: { ...(flow.booking || {}), status: 'NOT_STARTED' },
                    seatSelection: flow.seatSelection || null,
                }))
            );
            router.push(NEXT_ROUTE);
        } catch (error) {
            console.error('Unable to save traveller details:', error);
            toast.error('Unable to continue. Please try again.');
            setSaving(false);
        }
    };

    const goBack = () => {
        persist();
        router.push('/flights/review');
    };

    /* ---------- render ---------- */

    return (
        <>
            <BookingTopBar
                step={1}
                onBack={goBack}
                backLabel="Review"
                secondsLeft={secondsLeft}
                total={total}
                totalLabel="Total fare"
                continueLabel={saving ? 'Please wait…' : 'Continue'}
                onContinue={handleContinue}
                continueDisabled={saving || sessionExpired}
            />

            <div className="pd-container pd-layout">
                <section className="pd-main" onBlur={persist}>
                    <div className="pd-page-head">
                        <h1>Traveller details</h1>
                        <p>Enter names exactly as they appear on the {req.passport ? 'passport' : 'government-issued photo ID'}.</p>
                    </div>

                    {!isLoggedIn && (
                        <div className="pd-login">
                            <div>
                                <strong>Log in to book faster</strong>
                                <span>Your booking will be saved to your account and you can manage it anytime.</span>
                            </div>
                            <button
                                type="button"
                                className="pd-btn pd-btn-outline"
                                onClick={() => {
                                    persist();
                                    router.push(`/auth/login?redirect=${encodeURIComponent('/flights/passenger-details')}`);
                                }}
                            >
                                Log in
                            </button>
                        </div>
                    )}

                    {/* TRIP STRIP */}
                    <div className="pd-card pd-trip">
                        {journeys.map((journey, index) => (
                            <div className="pd-trip-row" key={index}>
                                <strong>{journey.first?.da?.code} → {journey.last?.aa?.code}</strong>
                                <span>{formatDate(journey.first?.dt)} • {formatTime(journey.first?.dt)} – {formatTime(journey.last?.at)}</span>
                                <small>{[...new Set(journey.segments.map((s) => s?.fD?.aI?.name))].join(' + ')}</small>
                            </div>
                        ))}
                        <span className={`pd-trip-type ${req.isDomestic ? '' : 'intl'}`}>
                            {req.isDomestic ? 'Domestic' : 'International'}
                        </span>
                    </div>

                    {/* TRAVELLERS */}
                    {passengers.map((p, index) => {
                        const label = `${PAX_LABELS[p.type]} ${passengers.slice(0, index + 1).filter((item) => item.type === p.type).length}`;
                        const e = (field) => errors[`${index}.${field}`];
                        const showDob = req.dob[p.type] || p.type !== 'ADULT';

                        return (
                            <article className="pd-card pd-traveller" key={p.id}>
                                <div className="pd-traveller-head">
                                    <strong>{label}</strong>
                                    {index === 0 && <span className="pd-badge">Lead traveller</span>}
                                    <small>
                                        {p.type === 'ADULT' && '12+ years'}
                                        {p.type === 'CHILD' && '2–11 years'}
                                        {p.type === 'INFANT' && 'Under 2 years • travels on an adult’s lap'}
                                    </small>
                                </div>

                                <div className="pd-grid">
                                    <Field label="Title" error={e('title')}>
                                        <div className="pd-titles" role="radiogroup">
                                            {TITLES[p.type].map((title) => (
                                                <button
                                                    type="button"
                                                    key={title}
                                                    role="radio"
                                                    aria-checked={p.title === title}
                                                    className={p.title === title ? 'active' : ''}
                                                    onClick={() => updatePassenger(index, 'title', title)}
                                                >
                                                    {title}
                                                </button>
                                            ))}
                                        </div>
                                    </Field>

                                    <Field label="First & middle name" error={e('firstName')}>
                                        <input
                                            value={p.firstName}
                                            maxLength={req.firstNameMax}
                                            autoComplete="given-name"
                                            placeholder="As on ID"
                                            onChange={(event) => updatePassenger(index, 'firstName', event.target.value.replace(/[^A-Za-z ]/g, ''))}
                                        />
                                    </Field>

                                    <Field label="Last name" error={e('lastName')}>
                                        <input
                                            value={p.lastName}
                                            maxLength={req.lastNameMax}
                                            autoComplete="family-name"
                                            placeholder="As on ID"
                                            onChange={(event) => updatePassenger(index, 'lastName', event.target.value.replace(/[^A-Za-z ]/g, ''))}
                                        />
                                    </Field>

                                    {showDob && (
                                        <Field label="Date of birth" optional={!req.dob[p.type]} error={e('dob')}>
                                            <input
                                                type="date"
                                                value={p.dob}
                                                max={firstTravel || undefined}
                                                onChange={(event) => updatePassenger(index, 'dob', event.target.value)}
                                            />
                                        </Field>
                                    )}

                                    {req.passport && (
                                        <>
                                            <Field label="Nationality" error={e('nationality')}>
                                                <select value={p.nationality} onChange={(event) => updatePassenger(index, 'nationality', event.target.value)}>
                                                    {NATIONALITIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                                                </select>
                                            </Field>
                                            <Field label="Passport number" error={e('passportNumber')}>
                                                <input
                                                    value={p.passportNumber}
                                                    maxLength={15}
                                                    placeholder="e.g. Z1234567"
                                                    onChange={(event) => updatePassenger(index, 'passportNumber', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                                />
                                            </Field>
                                            <Field label="Passport expiry" error={e('passportExpiry')} hint="Should be valid for 6 months after travel">
                                                <input
                                                    type="date"
                                                    value={p.passportExpiry}
                                                    min={lastTravel || undefined}
                                                    onChange={(event) => updatePassenger(index, 'passportExpiry', event.target.value)}
                                                />
                                            </Field>
                                            <Field label="Passport issue date" optional={!req.passportIssueDate} error={e('passportIssueDate')}>
                                                <input
                                                    type="date"
                                                    value={p.passportIssueDate}
                                                    max={firstTravel || undefined}
                                                    onChange={(event) => updatePassenger(index, 'passportIssueDate', event.target.value)}
                                                />
                                            </Field>
                                        </>
                                    )}

                                    {req.pan && index === 0 && (
                                        <Field label="PAN" error={e('pan')} hint="Required once per booking, for the lead traveller">
                                            <input
                                                value={p.pan}
                                                maxLength={10}
                                                placeholder="ABCDE1234F"
                                                onChange={(event) => updatePassenger(index, 'pan', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                            />
                                        </Field>
                                    )}

                                    {req.documentId && p.type !== 'INFANT' && (
                                        <Field label={req.documentIdLabel} optional={!req.documentIdRequired} error={e('documentId')} hint="Carry this ID at the airport">
                                            <input
                                                value={p.documentId}
                                                maxLength={30}
                                                onChange={(event) => updatePassenger(index, 'documentId', event.target.value)}
                                            />
                                        </Field>
                                    )}
                                </div>
                            </article>
                        );
                    })}

                    {/* CONTACT */}
                    <section className="pd-card">
                        <div className="pd-card-head">
                            <h2>Contact details</h2>
                            <small>Your ticket and booking updates will be sent here</small>
                        </div>
                        <div className="pd-grid">
                            <Field label="Email address" error={errors['contact.email']} wide>
                                <input
                                    type="email"
                                    value={contact.email}
                                    autoComplete="email"
                                    placeholder="name@example.com"
                                    onChange={(event) => setContact((prev) => ({ ...prev, email: event.target.value }))}
                                />
                            </Field>
                            <Field label="Mobile number" error={errors['contact.mobile']} wide>
                                <div className="pd-phone">
                                    <select
                                        value={contact.countryCode}
                                        onChange={(event) => setContact((prev) => ({ ...prev, countryCode: event.target.value }))}
                                    >
                                        {COUNTRY_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                                    </select>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        value={contact.mobile}
                                        maxLength={14}
                                        autoComplete="tel-national"
                                        placeholder="Mobile number"
                                        onChange={(event) => setContact((prev) => ({ ...prev, mobile: event.target.value.replace(/\D/g, '') }))}
                                    />
                                </div>
                            </Field>
                        </div>
                    </section>

                    {/* EMERGENCY CONTACT */}
                    {req.emergencyContact && (
                        <section className="pd-card">
                            <div className="pd-card-head">
                                <h2>Emergency contact</h2>
                                <small>Required by the airline for this booking</small>
                            </div>
                            <div className="pd-grid">
                                <Field label="Contact name" error={errors['emergency.name']} wide>
                                    <input value={emergency.name} onChange={(event) => setEmergency((prev) => ({ ...prev, name: event.target.value }))} />
                                </Field>
                                <Field label="Mobile number" error={errors['emergency.mobile']} wide>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        value={emergency.mobile}
                                        maxLength={10}
                                        onChange={(event) => setEmergency((prev) => ({ ...prev, mobile: event.target.value.replace(/\D/g, '') }))}
                                    />
                                </Field>
                            </div>
                        </section>
                    )}

                    {/* GST */}
                    {req.gst && (
                        <section className="pd-card">
                            {req.gstRequired ? (
                                <div className="pd-card-head">
                                    <h2>GST details</h2>
                                    <small>Mandatory for this fare</small>
                                </div>
                            ) : (
                                <label className="pd-check">
                                    <input
                                        type="checkbox"
                                        checked={gst.enabled}
                                        onChange={(event) => setGst((prev) => ({ ...prev, enabled: event.target.checked }))}
                                    />
                                    <span>
                                        <strong>I have a GST number</strong>
                                        <small>Claim GST credit on this booking (optional)</small>
                                    </span>
                                </label>
                            )}

                            {(gst.enabled || req.gstRequired) && (
                                <div className="pd-grid pd-gst">
                                    <Field label="GSTIN" error={errors['gst.gstNumber']}>
                                        <input
                                            value={gst.gstNumber}
                                            maxLength={15}
                                            placeholder="22AAAAA0000A1Z5"
                                            onChange={(event) => setGst((prev) => ({ ...prev, gstNumber: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                                        />
                                    </Field>
                                    <Field label="Registered company name" error={errors['gst.registeredName']}>
                                        <input value={gst.registeredName} maxLength={35} onChange={(event) => setGst((prev) => ({ ...prev, registeredName: event.target.value }))} />
                                    </Field>
                                    <Field label="Company email" optional error={errors['gst.email']}>
                                        <input type="email" value={gst.email} onChange={(event) => setGst((prev) => ({ ...prev, email: event.target.value }))} />
                                    </Field>
                                    <Field label="Company phone" optional>
                                        <input type="tel" inputMode="numeric" maxLength={12} value={gst.mobile} onChange={(event) => setGst((prev) => ({ ...prev, mobile: event.target.value.replace(/\D/g, '') }))} />
                                    </Field>
                                    <Field label="Company address" optional wide>
                                        <input value={gst.address} maxLength={70} onChange={(event) => setGst((prev) => ({ ...prev, address: event.target.value }))} />
                                    </Field>
                                </div>
                            )}
                        </section>
                    )}

                    <p className="pd-note">
                        By continuing, you agree to the fare rules and airline conditions of carriage. Name changes are not allowed after the ticket is issued.
                    </p>
                </section>

                {/* SIDEBAR */}
                <aside className="pd-sidebar">
                    <section className="pd-card">
                        <h2>Fare summary</h2>
                        <div className="pd-fare-row"><span>Base fare</span><strong>{money(fare.BF)}</strong></div>
                        <div className="pd-fare-row"><span>Taxes &amp; fees</span><strong>{money(fare.TAF)}</strong></div>
                        <div className="pd-fare-total">
                            <div><strong>Total amount</strong><small>Inclusive of all taxes</small></div>
                            <strong>{money(total)}</strong>
                        </div>
                        <small className="pd-muted">Seats, meals and extra baggage can be added in the next step.</small>
                    </section>
                </aside>
            </div>

            {sessionExpired && (
                <div className="pd-modal" role="dialog" aria-modal="true">
                    <div className="pd-modal-card">
                        <h3>Your session has expired</h3>
                        <p>Flight prices and availability change frequently. Please search again to get the latest fares.</p>
                        <button type="button" className="pd-btn" onClick={() => router.push('/flights')}>
                            Search flights
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

/* =========================================================
   PAGE
========================================================= */

export default function PassengerDetailsPage() {
    const router = useRouter();

    /* null => not hydrated, '' => no booking in progress */
    const stored = useSyncExternalStore(
        () => () => {},
        () => sessionStorage.getItem(FLOW_KEY) || '',
        () => null
    );

    const flow = useMemo(() => {
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }, [stored]);

    return (
        <>
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
            <main className="flight-pax-page">
                {flow?.review ? (
                    <TravellerForm flow={flow} />
                ) : (
                    <div className="pd-container">
                        <div className="pd-empty">
                            {stored === null ? (
                                <p>Loading traveller details…</p>
                            ) : (
                                <>
                                    <h2>No booking in progress</h2>
                                    <p>Please select a flight to continue.</p>
                                    <button type="button" className="pd-btn" onClick={() => router.push('/flights')}>
                                        Search flights
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
