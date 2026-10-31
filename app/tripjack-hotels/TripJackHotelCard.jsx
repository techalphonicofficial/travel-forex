'use client';

import { useState } from 'react';

import {
    amenityIcon,
    cheapestOption,
    formatDate,
    freeCancellationUntil,
    isFreeCancellation,
    mealLabel,
    money,
    nightsBetween,
    roomNames,
    splitInclusions,
} from './hotelUtils';

export const Stars = ({ count }) =>
    count > 0 ? (
        <span className="hb-stars" aria-label={`${count} star`}>
            {'★'.repeat(Math.round(count))}
        </span>
    ) : null;

/* One hotel in the results list */
export default function TripJackHotelCard({ hotel, search, onSelect, picked = false, onTogglePick }) {
    const [imageFailed, setImageFailed] = useState(false);

    const option = cheapestOption(hotel);
    const nights = nightsBetween(search?.checkIn, search?.checkOut) || 1;
    const roomCount = search?.rooms?.length || 1;
    const total = Number(option?.pricing?.totalPrice || 0);
    const freeCancel = isFreeCancellation(option);
    const freeUntil = freeCancellationUntil(option);
    const discount = Number(option?.pricing?.discount || 0);
    // every room option of the hotel (filters may have narrowed hotel.options)
    const allOptions = hotel.allOptions || hotel.options || [];
    const mealPlans = [...new Set(allOptions.map((o) => mealLabel(o.mealBasis)))];
    const refundableCount = allOptions.filter(isFreeCancellation).length;
    // short perks only (policy text sent in the same list is shown on the room page)
    const inclusions = splitInclusions(option?.inclusions).perks
        .filter((item) => item.toLowerCase() !== mealLabel(option?.mealBasis).toLowerCase())
        .slice(0, 3);
    const mapUrl = hotel.coordinates?.lat
        ? `https://www.google.com/maps/search/?api=1&query=${hotel.coordinates.lat},${hotel.coordinates.long}`
        : null;

    return (
        <article className="hb-card">
            <div className="hb-card-media">
                {hotel.image && !imageFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hotel.image} alt={hotel.name} loading="lazy" onError={() => setImageFailed(true)} />
                ) : (
                    <div className="hb-noimg">🏨</div>
                )}
                {hotel.images?.length > 1 && <span className="hb-photos">📷 {hotel.images.length} photos</span>}
            </div>

            <div className="hb-card-body">
                <div className="hb-card-title">
                    <h3>{hotel.name}</h3>
                    <Stars count={hotel.starRating} />
                    {hotel.propertyType && <span className="hb-type">{hotel.propertyType}</span>}
                </div>

                <div className="hb-location">
                    📍 {[hotel.address?.locality, hotel.address?.city !== hotel.address?.locality ? hotel.address?.city : null].filter(Boolean).join(', ') || hotel.address?.full}
                    {mapUrl && (
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer">View on map</a>
                    )}
                </div>

                {hotel.amenities?.length > 0 && (
                    <div className="hb-amenities">
                        {hotel.amenities.slice(0, 4).map((name) => (
                            <span className="hb-amenity" key={name}>{amenityIcon(name)} {name}</span>
                        ))}
                        {hotel.amenities.length > 4 && <span className="hb-amenity">+{hotel.amenities.length - 4} more</span>}
                    </div>
                )}

                {option && (
                    <>
                        <div className="hb-room-line">{roomNames(option)}</div>
                        <div className="hb-tags">
                            <span className={`hb-tag ${/room\s*only/i.test(mealLabel(option.mealBasis)) ? '' : 'info'}`}>
                                🍽 {mealLabel(option.mealBasis)}
                            </span>
                            {freeCancel ? (
                                <span className="hb-tag success">
                                    ✓ Free cancellation{freeUntil ? ` till ${formatDate(freeUntil, { day: '2-digit', month: 'short' })}` : ''}
                                </span>
                            ) : (
                                <span className="hb-tag danger">Non-refundable</span>
                            )}
                            {(option.compliance?.panRequired || option.compliance?.passportRequired) && (
                                <span className="hb-tag">{option.compliance?.passportRequired ? 'Passport' : 'PAN'} required</span>
                            )}
                        </div>
                        {inclusions.length > 0 && (
                            <ul className="hb-inclusions">
                                {inclusions.map((item) => <li key={item}>✓ {item}</li>)}
                            </ul>
                        )}
                        <div className="hb-options-summary">
                            <span>
                                <b>{allOptions.length}</b> room option{allOptions.length > 1 ? 's' : ''}
                                {refundableCount > 0
                                    ? ` · ${refundableCount === allOptions.length ? 'all' : refundableCount} refundable`
                                    : ' · non-refundable only'}
                            </span>
                            {mealPlans.length > 0 && (
                                <span className="hb-meal-plans">
                                    Meals: {mealPlans.map((meal) => <em key={meal}>{meal}</em>)}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="hb-card-price">
                <small>{nights} night{nights > 1 ? 's' : ''}, {roomCount} room{roomCount > 1 ? 's' : ''}</small>
                {discount > 0 && <s>{money(total + discount)}</s>}
                <strong>{money(total)}</strong>
                <em>{money(total / nights)} per night • incl. taxes</em>
                <button type="button" className="hb-btn" onClick={() => onSelect(hotel)}>
                    View rooms
                </button>
                {onTogglePick && (
                    <button
                        type="button"
                        className={`ssb-toggle ${picked ? 'active' : ''}`}
                        onClick={() => onTogglePick(hotel)}
                        aria-pressed={picked}
                    >
                        {picked ? '✓ Added to share' : '＋ Share'}
                    </button>
                )}
            </div>
        </article>
    );
}
