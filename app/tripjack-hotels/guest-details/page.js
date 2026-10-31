'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import '../hotels-booking.css';
import hotelService from '../../services/hotelService';
import BookingTopBar from '../../flights/BookingTopBar';
import { Stars } from '../TripJackHotelCard';
import { CancellationTable } from '../HotelDetails';
import { Collapse, Points, PolicySections } from '../HotelInfo';
import {
    BOOKING_CONTEXT_KEY,
    HOTEL_STEPS,
    formatDate,
    formatDateTime,
    freeCancellationUntil,
    isFreeCancellation,
    mealLabel,
    money,
    nightsBetween,
    readSession,
    splitInclusions,
} from '../hotelUtils';

const DRAFT_KEY = 'tripjack_hotel_guest_draft';
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const NAME_REGEX = /^[A-Za-z ]+$/;
const ADULT_TITLES = ['Mr', 'Ms', 'Mrs'];
const CHILD_TITLES = ['Master', 'Miss'];
const COUNTRY_CODES = ['+91', '+971', '+1', '+44', '+61', '+65', '+977', '+880', '+94', '+966', '+974'];

/* one guest per adult / child of each reviewed room */
const buildGuests = (option, searchRooms = [], draft = []) =>
    (option?.roomInfo || []).flatMap((room, roomIndex) => {
        const ages = searchRooms[roomIndex]?.childAges || [];
        const list = [
            ...Array.from({ length: Number(room.adults) || 0 }, (_, i) => ({ type: 'ADULT', guestIndex: i })),
            ...Array.from({ length: Number(room.children) || 0 }, (_, i) => ({ type: 'CHILD', guestIndex: Number(room.adults || 0) + i, age: ages[i] })),
        ];
        return list.map((guest) => {
            const saved = draft.find((d) => d.roomIndex === roomIndex && d.guestIndex === guest.guestIndex) || {};
            return {
                roomIndex,
                ...guest,
                title: saved.title || '',
                firstName: saved.firstName || '',
                lastName: saved.lastName || '',
                pan: saved.pan || '',
                passportNumber: saved.passportNumber || '',
                isPrimary: roomIndex === 0 && guest.guestIndex === 0,
            };
        });
    });

function Input({ label, error, optional, children }) {
    return (
        <label className={`hb-input ${error ? 'has-error' : ''}`}>
            <span>{label}{optional && <i> (optional)</i>}</span>
            {children}
            {error && <small>{error}</small>}
        </label>
    );
}

function GuestForm({ context }) {
    const router = useRouter();
    const { hotel = {}, search = {}, review = {}, selectedOption } = context;
    const option = review.option || selectedOption || {};
    const pricing = option.pricing || {};
    const compliance = option.compliance || {};
    const nights = nightsBetween(search.checkIn, search.checkOut) || 1;
    const total = Number(pricing.totalPrice || 0);
    const previousTotal = Number(selectedOption?.pricing?.totalPrice || 0);
    const priceDiff = previousTotal ? Math.round(total - previousTotal) : 0;
    const checkTimes = hotel.policies?.checkInCheckOut || {};
    const gstApplicable = compliance.gstType && compliance.gstType !== 'NA';

    const auth = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('wl_auth') || 'null');
        } catch {
            return null;
        }
    }, []);
    const draft = useMemo(() => readSession(DRAFT_KEY) || {}, []);

    const [guests, setGuests] = useState(() => buildGuests(option, search.rooms, draft.guests || []));
    const [contact, setContact] = useState(() => ({
        email: draft.contact?.email || auth?.email || '',
        mobile: draft.contact?.mobile || String(auth?.phone || auth?.mobile || '').replace(/\D/g, '').slice(-10),
        countryCode: draft.contact?.countryCode || '+91',
    }));
    const [gst, setGst] = useState(() => ({ enabled: false, gstNumber: '', registeredName: '', ...(draft.gst || {}) }));
    const [submitted, setSubmitted] = useState(false);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [paying, setPaying] = useState(false);
    const [priceUpdate, setPriceUpdate] = useState(null);

    /* ---------- validation ---------- */
    const computeErrors = () => {
        const e = {};
        guests.forEach((g, i) => {
            const k = (f) => `${i}.${f}`;
            if (!g.title) e[k('title')] = 'Select title';
            if (!g.firstName.trim()) e[k('firstName')] = 'Enter first name';
            else if (!NAME_REGEX.test(g.firstName.trim())) e[k('firstName')] = 'Letters only';
            if (!g.lastName.trim()) e[k('lastName')] = 'Enter last name';
            else if (!NAME_REGEX.test(g.lastName.trim())) e[k('lastName')] = 'Letters only';
            // one PAN per booking: the lead guest's
            if (compliance.panRequired && g.isPrimary && !PAN_REGEX.test(g.pan.trim().toUpperCase())) e[k('pan')] = 'Enter a valid PAN (e.g. ABCDE1234F)';
            if (compliance.passportRequired && !g.passportNumber.trim()) e[k('passportNumber')] = 'Enter passport number';
        });
        const leads = (option.roomInfo || []).map((_, r) => {
            const lead = guests.find((g) => g.roomIndex === r && g.type === 'ADULT');
            return `${lead?.firstName} ${lead?.lastName}`.trim().toLowerCase();
        });
        leads.forEach((name, r) => {
            if (name && leads.indexOf(name) !== r) {
                const index = guests.findIndex((g) => g.roomIndex === r && g.type === 'ADULT');
                e[`${index}.firstName`] = 'Lead guest must be different for each room';
            }
        });
        if (!EMAIL_REGEX.test(contact.email.trim())) e['contact.email'] = 'Enter a valid email address';
        const mobile = contact.mobile.replace(/\D/g, '');
        if (contact.countryCode === '+91' ? !/^[6-9]\d{9}$/.test(mobile) : mobile.length < 6) e['contact.mobile'] = 'Enter a valid mobile number';
        if (gst.enabled) {
            if (!GST_REGEX.test(gst.gstNumber.trim().toUpperCase())) e['gst.gstNumber'] = 'Enter a valid 15-character GSTIN';
            if (!gst.registeredName.trim()) e['gst.registeredName'] = 'Enter registered company name';
        }
        return e;
    };
    const errors = submitted ? computeErrors() : {};

    const saveDraft = () => {
        try {
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ guests, contact, gst }));
        } catch {
            /* ignore */
        }
    };

    const updateGuest = (index, field, value) =>
        setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));

    /* ---------- continue → summary ---------- */
    const handleContinue = () => {
        setSubmitted(true);
        if (Object.keys(computeErrors()).length) {
            toast.error('Please complete the highlighted guest details.');
            setTimeout(() => document.querySelector('.hb-input.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
            return;
        }
        saveDraft();
        if (!localStorage.getItem('wl_token')) {
            toast('Please log in to continue with your booking.', { icon: '🔒' });
            router.push(`/auth/login?redirect=${encodeURIComponent('/hotel-booking/guest-details')}`);
            return;
        }
        setSummaryOpen(true);
    };

    /* ---------- pay ---------- */
    const redirectToGateway = (payment) => {
        const redirectURI = payment?.response?.redirectURI;
        const tranCtx = payment?.response?.tranCtx;
        if (!redirectURI || !tranCtx || !/^https:\/\//i.test(redirectURI)) {
            throw new Error('Unable to open the payment page. Please try again.');
        }
        window.location.assign(`${redirectURI}?tranCtx=${encodeURIComponent(tranCtx)}`);
    };

    const handlePay = async () => {
        if (paying) return;
        if (!acceptTerms) {
            toast.error('Please accept the hotel policies and terms.');
            return;
        }
        setPaying(true);

        const lead = guests[0] || {};
        const bookingData = {
            source: 'HOTEL',
            hotel: {
                hotelId: hotel.hotelId,
                hotelName: hotel.name,
                address: hotel.address?.full,
                city: hotel.address?.city,
                starRating: hotel.starRating,
                image: hotel.image,
                checkInFrom: checkTimes.checkin_from || null,
                checkOutBy: checkTimes.checkout_from || null,
                // shown on the customer's booking page / voucher
                minCheckInAge: checkTimes.checkin_min_age || null,
                coordinates: hotel.coordinates || null,
                policies: hotel.policies || null,
            },
            search,
            tripjack: {
                correlationId: context.correlationId || review.correlationId,
                reviewHash: context.reviewHash || null,
                bookingId: review.bookingId,
                review,
                selectedOption,
            },
            guests: guests.map((g) => ({
                roomIndex: g.roomIndex,
                guestIndex: g.guestIndex,
                type: g.type,
                title: g.title,
                firstName: g.firstName.trim().replace(/\s+/g, ' '),
                lastName: g.lastName.trim().replace(/\s+/g, ' '),
                age: g.age ?? null,
                pan: g.isPrimary && compliance.panRequired ? g.pan.trim().toUpperCase() : null,
                passportNumber: compliance.passportRequired ? g.passportNumber.trim().toUpperCase() : null,
                isPrimary: g.isPrimary,
                ...(g.isPrimary && { email: contact.email.trim(), mobile: contact.mobile.replace(/\D/g, '') }),
            })),
            primaryGuest: {
                title: lead.title,
                firstName: lead.firstName.trim(),
                lastName: lead.lastName.trim(),
                email: contact.email.trim(),
                mobile: contact.mobile.replace(/\D/g, ''),
                countryCode: contact.countryCode,
            },
            countryCode: contact.countryCode,
            ...(gst.enabled && { gstInfo: { gstNumber: gst.gstNumber.trim().toUpperCase(), registeredName: gst.registeredName.trim() } }),
        };

        try {
            const result = await hotelService.book({
                bookingType: 'HOTEL',
                provider: 'TRIPJACK',
                amount: total,
                currency: pricing.currency || 'INR',
                correlationId: bookingData.tripjack.correlationId,
                bookingData,
            });
            const data = result?.data || {};

            sessionStorage.setItem('tripjack_booking', JSON.stringify({
                id: data.booking?.id || null,
                bookingReference: data.booking?.booking_reference || null,
                amount: data.amount,
                bookingType: 'HOTEL',
                savedAt: new Date().toISOString(),
            }));
            sessionStorage.removeItem(DRAFT_KEY);

            if (data.priceChanged) {
                // show the new price before leaving for the gateway
                setPriceUpdate({ amount: data.amount, payment: data.payment });
                setPaying(false);
                return;
            }
            redirectToGateway(data.payment);
        } catch (error) {
            if (error?.code === 'LOGIN_REQUIRED') {
                toast.error(error.message);
                router.push(`/auth/login?redirect=${encodeURIComponent('/hotel-booking/guest-details')}`);
                return;
            }
            toast.error(error?.message || 'Unable to start the booking. Please try again.', { duration: 6000 });
            setPaying(false);
        }
    };

    const free = isFreeCancellation(option);
    const until = freeCancellationUntil(option);
    // perks as tags, supplier policy text (JSON) as readable points
    const roomInclusions = splitInclusions(option.inclusions);
    const taxes = Number(pricing.taxes || 0) + Number(pricing.mf || 0) + Number(pricing.mft || 0);

    return (
        <>
            <BookingTopBar
                step={1}
                steps={HOTEL_STEPS}
                onBack={() => {
                    saveDraft();
                    router.push('/hotel-booking/details');
                }}
                backLabel="Rooms"
                total={total}
                totalLabel={`Total · ${nights} night${nights > 1 ? 's' : ''}`}
                continueLabel="Continue"
                onContinue={handleContinue}
                continueDisabled={paying}
            />

            <div className="hb-container hb-guest-layout">
                <section className="hb-guest-main" onBlur={saveDraft}>
                    {/* HOTEL */}
                    <div className="hb-card-box hb-hotel-mini">
                        {hotel.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={hotel.image} alt={hotel.name} />
                        ) : (
                            <div className="hb-noimg">🏨</div>
                        )}
                        <div>
                            <h2>{hotel.name} <Stars count={hotel.starRating} /></h2>
                            <div className="hb-location" style={{ marginBottom: 8 }}>📍 {hotel.address?.full}</div>
                            <div className="hb-stay">
                                <div><small>Check-in{checkTimes.checkin_from ? ` · from ${checkTimes.checkin_from}` : ''}</small><strong>{formatDate(search.checkIn, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                                <span>{nights}N</span>
                                <div style={{ textAlign: 'right' }}><small>Check-out{checkTimes.checkout_from ? ` · by ${checkTimes.checkout_from}` : ''}</small><strong>{formatDate(search.checkOut, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                            </div>
                        </div>
                    </div>

                    {priceDiff !== 0 && (
                        <div className={`hb-notice ${priceDiff > 0 ? 'warning' : 'success'}`}>
                            <b>{priceDiff > 0 ? 'Price updated by the hotel.' : 'Good news! The price has dropped.'}</b>{' '}
                            New total {money(total)} (was {money(previousTotal)}).
                        </div>
                    )}

                    {/* ROOM */}
                    <div className="hb-card-box">
                        <h2>Your room</h2>
                        {(option.roomInfo || []).map((room, i) => (
                            <div className="hb-row" key={i}>
                                <span><b>Room {i + 1}:</b> {room.name}</span>
                                <span className="hb-muted">{room.adults} adult{room.adults > 1 ? 's' : ''}{room.children ? `, ${room.children} child${room.children > 1 ? 'ren' : ''}` : ''}</span>
                            </div>
                        ))}
                        <div className="hb-tags" style={{ margin: '8px 0' }}>
                            <span className="hb-tag info">🍽 {mealLabel(option.mealBasis)}</span>
                            {free ? (
                                <span className="hb-tag success">✓ Free cancellation{until ? ` till ${formatDateTime(until)}` : ''}</span>
                            ) : (
                                <span className="hb-tag danger">Non-refundable</span>
                            )}
                            {roomInclusions.perks.map((perk) => (
                                <span className="hb-tag" key={perk}>✓ {perk}</span>
                            ))}
                        </div>
                        <Collapse
                            title="Cancellation policy"
                            hint={free ? `Free till ${formatDateTime(until) || 'deadline'}` : 'Non-refundable'}
                        >
                            <CancellationTable option={option} />
                        </Collapse>
                        {roomInclusions.notes.length > 0 && (
                            <Collapse title="Property information" hint={`${roomInclusions.notes.length} section${roomInclusions.notes.length > 1 ? 's' : ''}`}>
                                {roomInclusions.notes.map((group) => (
                                    <div key={group.label} className="hb-points-group">
                                        {group.label && <h5>{group.label}</h5>}
                                        <Points points={group.points} />
                                    </div>
                                ))}
                            </Collapse>
                        )}
                    </div>

                    {/* GUESTS */}
                    <div className="hb-card-box">
                        <h2>Guest details</h2>
                        <p className="hb-muted hb-small" style={{ marginTop: -6 }}>
                            Enter names exactly as on a government photo ID. The lead guest must check in.
                        </p>
                        {(option.roomInfo || []).map((room, roomIndex) => (
                            <div className="hb-guest-room" key={roomIndex}>
                                <h3>Room {roomIndex + 1} · {room.name}</h3>
                                {guests.map((g, index) => {
                                    if (g.roomIndex !== roomIndex) return null;
                                    const e = (f) => errors[`${index}.${f}`];
                                    const titles = g.type === 'ADULT' ? ADULT_TITLES : CHILD_TITLES;
                                    return (
                                        <div className="hb-guest" key={index}>
                                            <div className="hb-guest-label">
                                                {g.type === 'ADULT' ? `Adult ${guests.filter((x, i) => x.roomIndex === roomIndex && x.type === 'ADULT' && i <= index).length}` : `Child ${guests.filter((x, i) => x.roomIndex === roomIndex && x.type === 'CHILD' && i <= index).length}${g.age !== undefined ? ` · ${g.age} yrs` : ''}`}
                                                {g.isPrimary && <span className="hb-tag info">Lead guest</span>}
                                                {!g.isPrimary && g.type === 'ADULT' && g.guestIndex === 0 && <span className="hb-tag">Room lead</span>}
                                            </div>
                                            <div className="hb-grid">
                                                <Input label="Title" error={e('title')}>
                                                    <div className="hb-titles">
                                                        {titles.map((title) => (
                                                            <button
                                                                type="button"
                                                                key={title}
                                                                className={g.title === title ? 'active' : ''}
                                                                onClick={() => updateGuest(index, 'title', title)}
                                                            >
                                                                {title}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </Input>
                                                <Input label="First & middle name" error={e('firstName')}>
                                                    <input value={g.firstName} maxLength={50} autoComplete="given-name" onChange={(event) => updateGuest(index, 'firstName', event.target.value.replace(/[^A-Za-z ]/g, ''))} />
                                                </Input>
                                                <Input label="Last name" error={e('lastName')}>
                                                    <input value={g.lastName} maxLength={50} autoComplete="family-name" onChange={(event) => updateGuest(index, 'lastName', event.target.value.replace(/[^A-Za-z ]/g, ''))} />
                                                </Input>
                                                {compliance.panRequired && g.isPrimary && (
                                                    <Input label="PAN of lead guest" error={e('pan')}>
                                                        <input value={g.pan} maxLength={10} placeholder="ABCDE1234F" onChange={(event) => updateGuest(index, 'pan', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
                                                    </Input>
                                                )}
                                                {compliance.passportRequired && (
                                                    <Input label="Passport number" error={e('passportNumber')}>
                                                        <input value={g.passportNumber} maxLength={15} onChange={(event) => updateGuest(index, 'passportNumber', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
                                                    </Input>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* CONTACT */}
                    <div className="hb-card-box">
                        <h2>Contact details</h2>
                        <p className="hb-muted hb-small" style={{ marginTop: -6 }}>Your booking voucher and updates will be sent here.</p>
                        <div className="hb-grid wide">
                            <Input label="Email address" error={errors['contact.email']}>
                                <input type="email" value={contact.email} autoComplete="email" onChange={(event) => setContact((prev) => ({ ...prev, email: event.target.value }))} />
                            </Input>
                            <Input label="Mobile number" error={errors['contact.mobile']}>
                                <div className="hb-phone">
                                    <select value={contact.countryCode} onChange={(event) => setContact((prev) => ({ ...prev, countryCode: event.target.value }))}>
                                        {COUNTRY_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                                    </select>
                                    <input type="tel" inputMode="numeric" maxLength={14} value={contact.mobile} onChange={(event) => setContact((prev) => ({ ...prev, mobile: event.target.value.replace(/\D/g, '') }))} />
                                </div>
                            </Input>
                        </div>

                        {gstApplicable && (
                            <>
                                <label className="hb-terms">
                                    <input type="checkbox" checked={gst.enabled} onChange={(event) => setGst((prev) => ({ ...prev, enabled: event.target.checked }))} />
                                    <span><b>I have a GST number</b> (optional) — claim GST credit on this booking</span>
                                </label>
                                {gst.enabled && (
                                    <div className="hb-grid wide" style={{ marginTop: 10 }}>
                                        <Input label="GSTIN" error={errors['gst.gstNumber']}>
                                            <input value={gst.gstNumber} maxLength={15} onChange={(event) => setGst((prev) => ({ ...prev, gstNumber: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))} />
                                        </Input>
                                        <Input label="Registered company name" error={errors['gst.registeredName']}>
                                            <input value={gst.registeredName} maxLength={60} onChange={(event) => setGst((prev) => ({ ...prev, registeredName: event.target.value }))} />
                                        </Input>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* IMPORTANT */}
                    <div className="hb-card-box">
                        <h2>Important information</h2>
                        <Collapse title="Booking rules" defaultOpen>
                            <Points
                                points={[
                                    checkTimes.checkin_from && `Check-in from ${checkTimes.checkin_from}${checkTimes.checkout_from ? `, check-out by ${checkTimes.checkout_from}` : ''}.`,
                                    checkTimes.checkin_min_age && `Minimum check-in age is ${checkTimes.checkin_min_age} years.`,
                                    'All guests must carry a valid government photo ID. Foreign nationals must carry a passport and valid visa.',
                                    compliance.panRequired && 'PAN of the lead guest is mandatory for this hotel as per government rules.',
                                    'Early check-in and late check-out are subject to availability and may be charged by the hotel.',
                                    'Incidental charges (food, minibar, laundry, security deposit) are payable directly at the hotel.',
                                    'Name changes are not allowed after the booking is confirmed.',
                                ].filter(Boolean)}
                            />
                        </Collapse>
                        <PolicySections hotel={hotel} />
                    </div>
                </section>

                {/* PRICE */}
                <aside className="hb-guest-side">
                    <section className="hb-card-box">
                        <h2>Price details</h2>
                        <div className="hb-row"><span>{(option.roomInfo || []).length} room{(option.roomInfo || []).length > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}</span><b>{money(pricing.basePrice ?? total)}</b></div>
                        {taxes > 0 && <div className="hb-row"><span>Taxes & fees</span><b>{money(taxes)}</b></div>}
                        {Number(pricing.discount) > 0 && <div className="hb-row" style={{ color: '#15803d' }}><span>Discount</span><b>− {money(pricing.discount)}</b></div>}
                        <div className="hb-total">
                            <div><strong>Total amount</strong><small>Inclusive of all taxes</small></div>
                            <strong>{money(total)}</strong>
                        </div>
                        <small className="hb-muted" style={{ display: 'block', marginTop: 10 }}>
                            {money(total / nights)} per night for {(option.roomInfo || []).length} room{(option.roomInfo || []).length > 1 ? 's' : ''}.
                        </small>
                    </section>
                </aside>
            </div>

            {/* PAYMENT SUMMARY */}
            {summaryOpen && !priceUpdate && (
                <div className="hb-modal" role="dialog" aria-modal="true">
                    <div className="hb-modal-card">
                        <h3>Review & pay</h3>
                        <div className="hb-row"><span>{hotel.name}</span></div>
                        <div className="hb-row"><span>{formatDate(search.checkIn)} – {formatDate(search.checkOut)}</span><b>{nights} night{nights > 1 ? 's' : ''}</b></div>
                        <div className="hb-row"><span>Lead guest</span><b>{guests[0]?.title} {guests[0]?.firstName} {guests[0]?.lastName}</b></div>
                        <div className="hb-total">
                            <div><strong>Amount payable</strong><small>Final price is confirmed with the hotel before payment</small></div>
                            <strong>{money(total)}</strong>
                        </div>
                        <label className="hb-terms">
                            <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
                            <span>
                                I accept the hotel’s cancellation policy, the{' '}
                                <a href="/terms" target="_blank" rel="noopener noreferrer">terms of use</a> and the{' '}
                                <a href="/cancellation" target="_blank" rel="noopener noreferrer">cancellation & refund policy</a>.
                            </span>
                        </label>
                        <div className="hb-modal-actions">
                            <button type="button" className="hb-btn hb-btn-outline" disabled={paying} onClick={() => setSummaryOpen(false)}>Back</button>
                            <button type="button" className="hb-btn" disabled={paying || !acceptTerms} onClick={handlePay}>
                                {paying ? 'Please wait…' : `Pay ${money(total)} securely`}
                            </button>
                        </div>
                        <p className="hb-small" style={{ textAlign: 'center', marginTop: 8 }}>🔒 You will be redirected to the secure ICICI payment page.</p>
                    </div>
                </div>
            )}

            {/* PRICE CHANGED AT THE LAST MOMENT */}
            {priceUpdate && (
                <div className="hb-modal" role="dialog" aria-modal="true">
                    <div className="hb-modal-card">
                        <h3>Price updated</h3>
                        <p>The hotel updated the price for this room while we confirmed your booking.</p>
                        <div className="hb-total">
                            <div><strong>New amount</strong><small>Was {money(total)}</small></div>
                            <strong>{money(priceUpdate.amount)}</strong>
                        </div>
                        <div className="hb-modal-actions">
                            <button type="button" className="hb-btn hb-btn-outline" onClick={() => router.push('/hotel-booking/details')}>Choose another room</button>
                            <button
                                type="button"
                                className="hb-btn"
                                onClick={() => {
                                    try {
                                        redirectToGateway(priceUpdate.payment);
                                    } catch (error) {
                                        toast.error(error.message);
                                    }
                                }}
                            >
                                Pay {money(priceUpdate.amount)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {paying && !priceUpdate && (
                <div className="hb-overlay" role="status">
                    <div className="hb-overlay-card">
                        <span className="hb-spinner" />
                        <strong>Confirming your booking</strong>
                        <p>We are confirming the final price with the hotel and opening the secure payment page.</p>
                    </div>
                </div>
            )}
        </>
    );
}

export default function HotelGuestDetailsPage() {
    const router = useRouter();

    const stored = useSyncExternalStore(
        () => () => {},
        () => sessionStorage.getItem(BOOKING_CONTEXT_KEY) || '',
        () => null
    );

    const context = useMemo(() => {
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }, [stored]);

    return (
        <main className="hb-page">
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            {context?.review?.option || context?.selectedOption ? (
                <GuestForm context={context} />
            ) : (
                <div className="hb-container" style={{ paddingTop: 40 }}>
                    <div className="hb-empty">
                        {stored === null ? (
                            <span>Loading…</span>
                        ) : (
                            <>
                                <strong>No room selected</strong>
                                <span>Please select a hotel and room to continue.</span>
                                <button type="button" className="hb-btn" onClick={() => router.push('/hotel-booking')}>Search hotels</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
