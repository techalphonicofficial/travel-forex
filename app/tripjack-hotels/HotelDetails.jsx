'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import './hotels-booking.css';
import hotelService from '../services/hotelService';
import BookingTopBar from '../flights/BookingTopBar';
import { Stars } from './TripJackHotelCard';
import { AboutSections, Collapse, Points, PolicySections } from './HotelInfo';
import {
    BOOKING_CONTEXT_KEY,
    HOTEL_STEPS,
    amenityIcon,
    formatDate,
    formatDateTime,
    freeCancellationUntil,
    guestCount,
    isFreeCancellation,
    mealLabel,
    money,
    descriptionSections,
    nightsBetween,
    sortOptions,
    splitInclusions,
    titleCase,
    toApiRooms,
} from './hotelUtils';

const GENERAL_RULES = [
    'Guests must carry a valid government photo ID (Aadhaar, passport, driving licence or voter ID) at check-in.',
    'Couples may be asked for proof of identity; local ID acceptance is at the hotel’s discretion.',
    'Extra charges at the hotel (food, minibar, laundry, early check-in) are payable directly to the hotel.',
];

const CANCELLATION_RULES = [
    'The cancellation policy depends on the room you choose. It is confirmed again before payment and shown on your booking and voucher.',
    'Cancelling within the free cancellation period costs nothing; after it, the charge shown for that period applies.',
    'If you do not check in (no-show), the full booking amount is charged.',
    'Refunds are made to your original payment method within 5–7 working days of cancellation.',
    'To cancel, contact our support team with your Booking ID.',
];

const apiError = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

// one-line policy for a room option: free till X / charges apply / non-refundable
const cancellationSummary = (option) => {
    if (option?.cancellation?.isRefundable === false) return { tone: 'danger', text: 'Non-refundable' };
    const until = freeCancellationUntil(option);
    if (until) return { tone: 'success', text: `Free cancellation till ${formatDateTime(until)}` };
    return { tone: 'warning', text: 'Cancellation charges apply' };
};

/* --------------------------------------------------------- */

function Lightbox({ images, index, onClose, onChange }) {
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowRight') onChange((index + 1) % images.length);
            if (event.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [index, images.length, onClose, onChange]);

    const image = images[index];
    return (
        <div className="hb-lightbox" role="dialog" aria-modal="true">
            <div className="hb-lightbox-top">
                <span>{index + 1} / {images.length}{image?.caption ? ` · ${image.caption}` : ''}</span>
                <button type="button" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <div className="hb-lightbox-stage">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image?.url} alt={image?.caption || 'Hotel photo'} />
                <button type="button" className="hb-lightbox-nav prev" onClick={() => onChange((index - 1 + images.length) % images.length)} aria-label="Previous">‹</button>
                <button type="button" className="hb-lightbox-nav next" onClick={() => onChange((index + 1) % images.length)} aria-label="Next">›</button>
            </div>
            <div className="hb-thumbs">
                {images.map((img, i) => (
                    <button type="button" key={img.url} className={i === index ? 'active' : ''} onClick={() => onChange(i)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" loading="lazy" />
                    </button>
                ))}
            </div>
        </div>
    );
}

export function CancellationTable({ option }) {
    const penalties = option?.cancellation?.penalties || [];
    if (!penalties.length) {
        return <p className="hb-muted hb-small" style={{ margin: 0 }}>{option?.cancellation?.isRefundable === false ? 'This booking is non-refundable.' : 'Cancellation charges as per hotel policy.'}</p>;
    }
    return (
        <table className="hb-penalties">
            <thead>
                <tr><th>If you cancel between</th><th>Charge</th></tr>
            </thead>
            <tbody>
                {penalties.map((p, i) => (
                    <tr key={i}>
                        <td>{formatDateTime(p.from)} – {formatDateTime(p.to)}</td>
                        <td><b>{Number(p.amount) === 0 ? 'Free' : money(p.amount)}</b></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/* --------------------------------------------------------- */

export default function HotelDetails({ hotel }) {
    const router = useRouter();
    const search = useMemo(() => hotel.search || {}, [hotel]);

    const [pricing, setPricing] = useState({ loading: true });
    const [roomFilter, setRoomFilter] = useState('ALL');
    const [openPolicy, setOpenPolicy] = useState({});
    const [lightbox, setLightbox] = useState(null);
    const [confirming, setConfirming] = useState(null);
    const [soldOut, setSoldOut] = useState([]);

    const nights = nightsBetween(search.checkIn, search.checkOut) || 1;
    const totals = guestCount(search.rooms || []);
    const images = hotel.images?.length ? hotel.images : hotel.image ? [{ url: hotel.image, caption: '' }] : [];
    const mapUrl = hotel.coordinates?.lat
        ? `https://www.google.com/maps/search/?api=1&query=${hotel.coordinates.lat},${hotel.coordinates.long}`
        : null;

    /* live room options for these dates */
    const loadPricing = useCallback(async () => {
        try {
            const response = await hotelService.pricing({
                correlationId: hotel.correlationId || search.correlationId,
                hid: String(hotel.hotelId),
                checkIn: search.checkIn,
                checkOut: search.checkOut,
                rooms: toApiRooms(search.rooms || []),
                currency: search.currency || 'INR',
                nationality: String(search.nationality || '106'),
                timeoutMs: 13000,
            });
            const data = response?.data || {};
            setPricing({ data, options: sortOptions(data.options || []) });
        } catch (error) {
            setPricing({ error: apiError(error, 'Rooms for this hotel are not available right now.'), options: [] });
        }
    }, [hotel, search]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => active && loadPricing());
        return () => {
            active = false;
        };
    }, [loadPricing]);

    const options = useMemo(() => pricing.options || [], [pricing.options]);
    const mealTypes = useMemo(() => [...new Set(options.map((o) => mealLabel(o.mealBasis)))], [options]);
    const shownOptions = options.filter((option) => {
        if (roomFilter === 'FREE') return isFreeCancellation(option);
        if (roomFilter !== 'ALL') return mealLabel(option.mealBasis) === roomFilter;
        return true;
    });
    const cheapest = options[0];

    /* select → supplier review → guest details */
    const selectOption = async (option) => {
        if (confirming) return;
        setConfirming(option.optionId);
        try {
            const response = await hotelService.review({
                optionId: option.optionId,
                reviewHash: pricing.data?.reviewHash,
                correlationId: pricing.data?.correlationId || hotel.correlationId || search.correlationId,
                hid: String(hotel.hotelId),
            });
            const review = response?.data;
            if (!response?.success || !review?.bookingId || review?.status?.success === false) {
                throw new Error(review?.errors?.[0]?.message || 'This room is no longer available.');
            }

            const { search: _search, ...hotelOnly } = hotel;
            sessionStorage.setItem(BOOKING_CONTEXT_KEY, JSON.stringify({
                hotel: { ...hotelOnly, images: images.slice(0, 6) },
                search,
                correlationId: review.correlationId || pricing.data?.correlationId,
                reviewHash: pricing.data?.reviewHash,
                selectedOption: option,
                review,
                reviewedAt: new Date().toISOString(),
            }));
            router.push('/hotel-booking/guest-details');
        } catch (error) {
            setSoldOut((prev) => [...prev, option.optionId]);
            toast.error(apiError(error, 'This room is no longer available. Please choose another room.'));
            setConfirming(null);
        }
    };

    const descriptions = descriptionSections(hotel);
    const checkTimes = hotel.policies?.checkInCheckOut || {};

    return (
        <>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            <BookingTopBar
                step={0}
                steps={HOTEL_STEPS}
                onBack={() => router.push('/hotel-booking')}
                backLabel="Hotels"
                total={cheapest ? Number(cheapest.pricing?.totalPrice || 0) : null}
                totalLabel={`From · ${nights} night${nights > 1 ? 's' : ''}`}
                continueLabel="Select room"
                onContinue={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                continueDisabled={!cheapest}
            />

            <div className="hb-container hb-details">
                {/* HEADER */}
                <div className="hb-head">
                    <div>
                        <h1>{hotel.name} <Stars count={hotel.starRating} /></h1>
                        <div className="hb-location">
                            {hotel.propertyType && <span className="hb-type" style={{ marginRight: 8 }}>{hotel.propertyType}</span>}
                            📍 {hotel.address?.full}
                            {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer">View on map</a>}
                        </div>
                    </div>
                    {cheapest && (
                        <div style={{ textAlign: 'right' }}>
                            <div className="hb-muted hb-small">Starting from</div>
                            <strong style={{ fontSize: 22 }}>{money(cheapest.pricing?.totalPrice)}</strong>
                            <div className="hb-muted hb-small">{nights} night{nights > 1 ? 's' : ''}, {(search.rooms || []).length} room{(search.rooms || []).length > 1 ? 's' : ''} · incl. taxes</div>
                        </div>
                    )}
                </div>

                {/* GALLERY */}
                {images.length > 0 && (
                    <div className="hb-gallery">
                        {images.slice(0, 5).map((image, index) => (
                            <button type="button" key={image.url} onClick={() => setLightbox(index)} aria-label="Open photo">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={image.url} alt={image.caption || hotel.name} loading={index ? 'lazy' : 'eager'} />
                                {index === 4 && images.length > 5 && <span className="hb-all-photos">+{images.length - 5} photos</span>}
                            </button>
                        ))}
                    </div>
                )}

                <nav className="hb-tabs" aria-label="Hotel sections">
                    <a href="#rooms">Rooms</a>
                    {descriptions.length > 0 && <a href="#overview">Overview</a>}
                    {hotel.amenities?.length > 0 && <a href="#amenities">Amenities</a>}
                    <a href="#policies">Policies</a>
                    {hotel.coordinates?.lat && <a href="#location">Location</a>}
                </nav>

                <div className="hb-detail-layout">
                    <div className="hb-detail-main">
                        {/* ROOMS */}
                        <section className="hb-card-box" id="rooms" style={{ scrollMarginTop: 140 }}>
                            <h2>Choose your room</h2>
                            {options.length > 0 && (
                                <div className="hb-room-filters">
                                    <button type="button" className={`hb-chip ${roomFilter === 'ALL' ? 'active' : ''}`} onClick={() => setRoomFilter('ALL')}>All ({options.length})</button>
                                    <button type="button" className={`hb-chip ${roomFilter === 'FREE' ? 'active' : ''}`} onClick={() => setRoomFilter('FREE')}>Free cancellation</button>
                                    {mealTypes.map((meal) => (
                                        <button type="button" key={meal} className={`hb-chip ${roomFilter === meal ? 'active' : ''}`} onClick={() => setRoomFilter(meal)}>{meal}</button>
                                    ))}
                                </div>
                            )}

                            {pricing.loading && (
                                <div className="hb-options">
                                    <div className="hb-skeleton" style={{ height: 120 }} />
                                    <div className="hb-skeleton" style={{ height: 120 }} />
                                </div>
                            )}

                            {!pricing.loading && !options.length && (
                                <div className="hb-empty">
                                    <strong>No rooms available</strong>
                                    <span>{pricing.error || 'This hotel has no rooms left for your dates.'}</span>
                                    <button type="button" className="hb-btn hb-btn-outline" onClick={() => router.push('/hotel-booking')}>See other hotels</button>
                                </div>
                            )}

                            <div className="hb-options">
                                {shownOptions.map((option, index) => {
                                    const free = isFreeCancellation(option);
                                    const until = freeCancellationUntil(option);
                                    const unavailable = soldOut.includes(option.optionId);
                                    const total = Number(option.pricing?.totalPrice || 0);
                                    const sameRoom = new Set((option.roomInfo || []).map((r) => r.name)).size === 1;
                                    return (
                                        <article className={`hb-roomopt ${index === 0 && roomFilter === 'ALL' ? 'best' : ''}`} key={option.optionId}>
                                            <div className="hb-roomopt-main">
                                                {index === 0 && roomFilter === 'ALL' && <span className="hb-best">Best price</span>}
                                                <h3>{sameRoom ? option.roomInfo?.[0]?.name : 'Room combination'}</h3>
                                                <ul>
                                                    {(option.roomInfo || []).map((room, i) => (
                                                        <li key={i}>
                                                            {(option.roomInfo || []).length > 1 && <b>Room {i + 1}: </b>}
                                                            {!sameRoom && `${room.name} · `}
                                                            {room.adults} adult{room.adults > 1 ? 's' : ''}
                                                            {room.children ? `, ${room.children} child${room.children > 1 ? 'ren' : ''}` : ''}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="hb-tags">
                                                    <span className={`hb-tag ${/room only/i.test(mealLabel(option.mealBasis)) ? '' : 'info'}`}>🍽 {mealLabel(option.mealBasis)}</span>
                                                    {free ? (
                                                        <span className="hb-tag success">✓ Free cancellation{until ? ` till ${formatDateTime(until)}` : ''}</span>
                                                    ) : (
                                                        <span className="hb-tag danger">Non-refundable</span>
                                                    )}
                                                    {option.compliance?.panRequired && <span className="hb-tag warning">PAN required</span>}
                                                    {option.compliance?.passportRequired && <span className="hb-tag warning">Passport required</span>}
                                                </div>
                                                {/* perks as a list, supplier policy text as readable points */}
                                                {(() => {
                                                    const { perks, notes } = splitInclusions(option.inclusions);
                                                    return (
                                                        <>
                                                            {perks.length > 0 && <ul>{perks.map((perk) => <li key={perk}>{perk}</li>)}</ul>}
                                                            {notes.length > 0 && (
                                                                <Collapse title="Property information">
                                                                    {notes.map((group) => (
                                                                        <div key={group.label} className="hb-points-group">
                                                                            {group.label && <h5>{group.label}</h5>}
                                                                            <Points points={group.points} />
                                                                        </div>
                                                                    ))}
                                                                </Collapse>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                                <button
                                                    type="button"
                                                    className="hb-policy-btn"
                                                    onClick={() => setOpenPolicy((prev) => ({ ...prev, [option.optionId]: !prev[option.optionId] }))}
                                                >
                                                    {openPolicy[option.optionId] ? 'Hide' : 'View'} cancellation policy
                                                </button>
                                                {openPolicy[option.optionId] && <CancellationTable option={option} />}
                                            </div>

                                            <div className="hb-roomopt-price">
                                                <small>{nights} night{nights > 1 ? 's' : ''}, {(option.roomInfo || []).length} room{(option.roomInfo || []).length > 1 ? 's' : ''}</small>
                                                <strong>{money(total)}</strong>
                                                <em>{money(total / nights)} / night · incl. taxes</em>
                                                {Number(option.pricing?.discount) > 0 && <em style={{ color: '#15803d' }}>You save {money(option.pricing.discount)}</em>}
                                                <button
                                                    type="button"
                                                    className="hb-btn"
                                                    disabled={unavailable || Boolean(confirming)}
                                                    onClick={() => selectOption(option)}
                                                >
                                                    {unavailable ? 'Sold out' : confirming === option.optionId ? 'Please wait…' : 'Select'}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        {/* OVERVIEW */}
                        {descriptions.length > 0 && (
                            <section className="hb-card-box" id="overview" style={{ scrollMarginTop: 140 }}>
                                <h2>About the property</h2>
                                <AboutSections hotel={hotel} />
                            </section>
                        )}

                        {/* AMENITIES */}
                        {hotel.amenities?.length > 0 && (
                            <section className="hb-card-box" id="amenities" style={{ scrollMarginTop: 140 }}>
                                <h2>Amenities</h2>
                                <ul className="hb-amenity-grid">
                                    {hotel.amenities.map((name) => (
                                        <li key={name}><span>{amenityIcon(name)}</span>{name}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* POLICIES */}
                        <section className="hb-card-box" id="policies" style={{ scrollMarginTop: 140 }}>
                            <h2>Hotel policies</h2>
                            <div className="hb-info-grid">
                                <div><small>Check-in</small><strong>From {checkTimes.checkin_from || '—'}{checkTimes.checkin_till && checkTimes.checkin_till !== 'anytime' ? ` to ${checkTimes.checkin_till}` : ''}</strong></div>
                                <div><small>Check-out</small><strong>{checkTimes.checkout_from ? `Until ${checkTimes.checkout_from}` : '—'}</strong></div>
                                {checkTimes.checkin_min_age && <div><small>Minimum check-in age</small><strong>{checkTimes.checkin_min_age} years</strong></div>}
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <Collapse
                                    title="Cancellation policy"
                                    hint={options.length ? `${options.filter((o) => freeCancellationUntil(o)).length} of ${options.length} rooms with free cancellation` : ''}
                                    defaultOpen
                                >
                                    {pricing.loading ? (
                                        <p className="hb-muted hb-small" style={{ margin: 0 }}>Loading the cancellation policy of each room…</p>
                                    ) : options.length ? (
                                        <div className="hb-cancel-list">
                                            {options.map((option) => {
                                                const sameRoom = new Set((option.roomInfo || []).map((r) => r.name)).size === 1;
                                                const summary = cancellationSummary(option);
                                                return (
                                                    <details className="hb-cancel-item" key={option.optionId}>
                                                        <summary>
                                                            <span className="hb-cancel-room">
                                                                <b>{sameRoom ? option.roomInfo?.[0]?.name : 'Room combination'}</b>
                                                                <small>{mealLabel(option.mealBasis)} · {money(option.pricing?.totalPrice)}</small>
                                                            </span>
                                                            <span className={`hb-tag ${summary.tone}`}>{summary.text}</span>
                                                            <i aria-hidden="true" />
                                                        </summary>
                                                        <CancellationTable option={option} />
                                                    </details>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="hb-muted hb-small" style={{ margin: 0 }}>No rooms are available for your dates, so there is no cancellation policy to show.</p>
                                    )}
                                    <div style={{ marginTop: 10 }}>
                                        <Points points={CANCELLATION_RULES} />
                                    </div>
                                </Collapse>
                                <PolicySections hotel={hotel} />
                                <Collapse title="General rules">
                                    <Points points={GENERAL_RULES} />
                                </Collapse>
                            </div>
                        </section>

                        {/* LOCATION */}
                        {hotel.coordinates?.lat && (
                            <section className="hb-card-box" id="location" style={{ scrollMarginTop: 140 }}>
                                <h2>Location</h2>
                                <p className="hb-muted" style={{ marginTop: 0 }}>{hotel.address?.full}</p>
                                <iframe
                                    title="Hotel location"
                                    src={`https://maps.google.com/maps?q=${hotel.coordinates.lat},${hotel.coordinates.long}&z=15&output=embed`}
                                    style={{ width: '100%', height: 260, border: 0, borderRadius: 10 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </section>
                        )}
                    </div>

                    {/* SIDE: stay summary */}
                    <aside className="hb-detail-side">
                        <section className="hb-card-box">
                            <h2>Your stay</h2>
                            <div className="hb-stay">
                                <div><small>Check-in</small><strong>{formatDate(search.checkIn)}</strong></div>
                                <span>{nights}N</span>
                                <div style={{ textAlign: 'right' }}><small>Check-out</small><strong>{formatDate(search.checkOut)}</strong></div>
                            </div>
                            <div className="hb-row"><span>Rooms</span><b>{(search.rooms || []).length}</b></div>
                            <div className="hb-row"><span>Guests</span><b>{totals.adults} adult{totals.adults > 1 ? 's' : ''}{totals.children ? `, ${totals.children} child${totals.children > 1 ? 'ren' : ''}` : ''}</b></div>
                            <button type="button" className="hb-btn hb-btn-outline" style={{ width: '100%', marginTop: 10 }} onClick={() => router.push('/hotel-booking')}>
                                Change dates or guests
                            </button>
                        </section>
                    </aside>
                </div>
            </div>

            {confirming && (
                <div className="hb-overlay" role="status">
                    <div className="hb-overlay-card">
                        <span className="hb-spinner" />
                        <strong>Confirming your room</strong>
                        <p>We are checking the latest price and availability with the hotel.</p>
                    </div>
                </div>
            )}

            {lightbox !== null && images.length > 0 && (
                <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} onChange={setLightbox} />
            )}
        </>
    );
}
