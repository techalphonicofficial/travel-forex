'use client';

import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

/* =========================================================
   DATA EXTRACTORS
========================================================= */

const getHeroImage = (hotel) => {
    if (hotel?.image) return hotel.image;

    const images = Array.isArray(hotel?.images) ? hotel.images : [];
    const heroImage = images.find((image) => image?.is_hero_image === true);

    return (
        heroImage?.links?.XXL?.href ||
        heroImage?.links?.Original?.href ||
        images[0]?.links?.Standard?.href ||
        images[0]?.links?.Original?.href ||
        null
    );
};

const getAllImages = (hotel) => {
    const images = Array.isArray(hotel?.images) ? hotel.images : [];
    return images
        .map(
            (img) =>
                img?.links?.XXL?.href ||
                img?.links?.Original?.href ||
                img?.links?.Standard?.href ||
                null
        )
        .filter(Boolean);
};

const getHotelName = (hotel) =>
    hotel?.name || hotel?.hotelContent?.name || hotel?.hotelName || 'Hotel';

/* ⭐ Reads star_rating from hotelContent */
const getRating = (hotel) => {
    const raw =
        hotel?.hotelContent?.star_rating ||
        hotel?.hotelContent?.starRating ||
        hotel?.hotelContent?.rating ||
        hotel?.starRating ||
        hotel?.star_rating ||
        hotel?.rating ||
        hotel?.hotelRating ||
        null;

    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : null;
};

const getLocation = (hotel) => {
    const content = hotel?.hotelContent;
    if (content?.address) {
        if (typeof content.address === 'string') return content.address;
        return [
            content.address?.line1,
            content.address?.city?.name || content.address?.city,
            content.address?.country?.name || content.address?.country,
        ]
            .filter(Boolean)
            .join(', ');
    }

    if (hotel?.address) {
        if (typeof hotel.address === 'string') return hotel.address;
        return [
            hotel.address?.line1,
            hotel.address?.city?.name || hotel.address?.city,
            hotel.address?.country?.name || hotel.address?.country,
        ]
            .filter(Boolean)
            .join(', ');
    }

    return (
        content?.city ||
        hotel?.location ||
        hotel?.city ||
        hotel?.destination ||
        ''
    );
};

const getBestOption = (hotel) =>
    Array.isArray(hotel?.options) ? hotel.options[0] || null : null;

const getPrice = (hotel) => {
    const option = getBestOption(hotel);
    return (
        option?.pricing?.totalPrice ??
        option?.price?.totalPrice ??
        hotel?.price ??
        hotel?.totalPrice ??
        null
    );
};

const getCurrency = (hotel) => {
    const option = getBestOption(hotel);
    return (
        option?.pricing?.currency ||
        option?.price?.currency ||
        hotel?.currency ||
        'INR'
    );
};

const getMealBasis = (hotel) => {
    const option = getBestOption(hotel);
    return option?.mealBasis || option?.mealType || null;
};

const getAmenities = (hotel) => {
    if (Array.isArray(hotel?.amenities)) return hotel.amenities;
    if (Array.isArray(hotel?.hotelContent?.amenities))
        return hotel.hotelContent.amenities;
    return [];
};

const getOptionsCount = (hotel) =>
    Array.isArray(hotel?.options) ? hotel.options.length : 0;

const getCancellationInfo = (hotel) => {
    const option = getBestOption(hotel);
    if (!option) return null;
    if (option?.isRefundable === true) return 'Free cancellation';
    if (option?.isRefundable === false) return 'Non-refundable';
    if (option?.cancellationPolicy) {
        const policy = String(option.cancellationPolicy).toLowerCase();
        if (policy.includes('free') || policy.includes('refund')) {
            return 'Free cancellation';
        }
    }
    if (option?.freeCancellationUntil) return 'Free cancellation available';
    return null;
};

const formatPrice = (price, currency = 'INR') => {
    if (price === null || price === undefined) return null;
    return `${currency} ${Number(price).toLocaleString('en-IN')}`;
};

/* =========================================================
   ICONS
========================================================= */

const MapPinIcon = () => (
    <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const HeartIcon = ({ filled }) => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={filled ? '#e11d48' : 'none'}
        stroke={filled ? '#e11d48' : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const ImageIcon = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
    >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
);

const CheckIcon = () => (
    <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/* =========================================================
   AMENITY ICONS
========================================================= */

const AMENITY_ICONS = {
    wifi: '📶',
    'wi-fi': '📶',
    internet: '📶',
    pool: '🏊',
    swimming: '🏊',
    parking: '🅿️',
    breakfast: '🍳',
    ac: '❄️',
    'air conditioning': '❄️',
    gym: '🏋️',
    fitness: '🏋️',
    spa: '💆',
    restaurant: '🍽️',
    dining: '🍽️',
    bar: '🍸',
    lounge: '🍸',
    pet: '🐾',
    laundry: '🧺',
    tv: '📺',
    shuttle: '🚐',
    airport: '✈️',
    beach: '🏖️',
    garden: '🌳',
};

const getAmenityIcon = (name = '') => {
    const key = name.toLowerCase();
    const found = Object.keys(AMENITY_ICONS).find((k) => key.includes(k));
    return found ? AMENITY_ICONS[found] : '✓';
};

/* =========================================================
   ⭐ STAR RATING
   star_rating = 4  →  ★★★★☆  (4 lit gold + 1 dull gray)
   star_rating = 3  →  ★★★☆☆  (3 lit gold + 2 dull gray)
   star_rating = 5  →  ★★★★★  (5 lit gold)
========================================================= */

const StarRating = ({ rating }) => {
    const numRating = Number(rating);
    if (!Number.isFinite(numRating) || numRating <= 0) return null;

    // Round to nearest whole star (4.5 → 5, 3.2 → 3)
    const litStars = Math.min(5, Math.max(0, Math.round(numRating)));

    return (
        <div className="tj-rating-wrap d-inline-flex align-items-center gap-2">
            <div className="tj-stars-row d-inline-flex align-items-center">
                {[1, 2, 3, 4, 5].map((n) => (
                    <span
                        key={n}
                        className={
                            n <= litStars
                                ? 'tj-star-icon tj-star-lit'
                                : 'tj-star-icon tj-star-dull'
                        }
                    >
                        ★
                    </span>
                ))}
            </div>

            <div className="tj-rating-badge d-inline-flex align-items-center gap-1">
                <span className="tj-rating-num">{numRating.toFixed(1)}</span>
                <span className="tj-rating-star">★</span>
            </div>
        </div>
    );
};

/* =========================================================
   IMAGE GALLERY - FIXED HEIGHT
========================================================= */

const ImageGallery = ({ images, hotelName }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="tj-gallery-empty w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                <div className="tj-gallery-empty-icon">🏨</div>
                <span className="tj-gallery-empty-text">No image</span>
            </div>
        );
    }

    const currentImage = images[activeIndex];

    return (
        <div className="tj-gallery position-relative w-100 h-100">
            <img
                src={currentImage}
                alt={hotelName}
                loading="lazy"
                className="tj-gallery-img w-100 h-100"
            />

            {images.length > 1 && (
                <>
                    <div className="tj-img-counter position-absolute d-flex align-items-center gap-1">
                        <ImageIcon />
                        {activeIndex + 1}/{images.length}
                    </div>

                    <div className="tj-thumb-strip position-absolute d-flex gap-1">
                        {images.slice(0, 5).map((img, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveIndex(idx)}
                                className={`tj-thumb-btn border-0 p-0 ${
                                    activeIndex === idx ? 'tj-thumb-active' : ''
                                }`}
                            >
                                <img src={img} alt="" />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const TripJackHotelCard = ({ hotel, onSelect }) => {
    const [isWishlisted, setIsWishlisted] = useState(false);

    const heroImage = getHeroImage(hotel);
    const allImages = getAllImages(hotel);
    const hotelName = getHotelName(hotel);
    const rating = getRating(hotel);
    const location = getLocation(hotel);
    const price = getPrice(hotel);
    const currency = getCurrency(hotel);
    const mealBasis = getMealBasis(hotel);
    const amenities = getAmenities(hotel);
    const optionsCount = getOptionsCount(hotel);
    const cancellation = getCancellationInfo(hotel);

    const formattedPrice = formatPrice(price, currency);

    return (
        <div className="tj-hotel-card">
            <div className="d-flex flex-column flex-md-row">
                {/* =========================================
                    IMAGE - FIXED HEIGHT
                ========================================= */}
                <div className="tj-image-wrapper position-relative flex-shrink-0">
                    <ImageGallery
                        images={
                            allImages.length > 0
                                ? allImages
                                : heroImage
                                ? [heroImage]
                                : []
                        }
                        hotelName={hotelName}
                    />

                    <button
                        type="button"
                        onClick={() => setIsWishlisted(!isWishlisted)}
                        className="tj-wishlist-btn position-absolute border-0 d-flex align-items-center justify-content-center"
                        aria-label="Add to wishlist"
                    >
                        <HeartIcon filled={isWishlisted} />
                    </button>

                    {optionsCount > 1 && (
                        <div className="tj-options-badge position-absolute">
                            {optionsCount} options
                        </div>
                    )}
                </div>

                {/* =========================================
                    DETAILS
                ========================================= */}
                <div className="tj-details flex-grow-1 p-3 p-md-4 d-flex flex-column flex-sm-row justify-content-between gap-3">
                    {/* LEFT: Info */}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        {/* Rating on top */}
                        {rating && (
                            <div className="mb-2">
                                <StarRating rating={rating} />
                            </div>
                        )}

                        <h6 className="tj-hotel-name mb-2" title={hotelName}>
                            {hotelName}
                        </h6>

                        {location && (
                            <div className="tj-location d-flex align-items-center gap-1 mb-3">
                                <MapPinIcon />
                                <span className="text-truncate">{location}</span>
                            </div>
                        )}

                        <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                            {cancellation && (
                                <span className="tj-pill tj-pill-success">
                                    <CheckIcon />
                                    {cancellation}
                                </span>
                            )}
                            {mealBasis && (
                                <span className="tj-pill tj-pill-neutral">
                                    🍽️ {mealBasis}
                                </span>
                            )}
                        </div>

                        {amenities.length > 0 && (
                            <div className="tj-amenities d-flex flex-wrap align-items-center gap-2">
                                {amenities.slice(0, 4).map((amenity, index) => {
                                    const name =
                                        typeof amenity === 'string'
                                            ? amenity
                                            : amenity?.name ||
                                              amenity?.description ||
                                              null;
                                    if (!name) return null;
                                    return (
                                        <span
                                            key={`${name}-${index}`}
                                            className="tj-amenity d-flex align-items-center gap-1"
                                        >
                                            <span>{getAmenityIcon(name)}</span>
                                            <span className="text-truncate">
                                                {name}
                                            </span>
                                        </span>
                                    );
                                })}
                                {amenities.length > 4 && (
                                    <span className="tj-amenity-more">
                                        +{amenities.length - 4} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Price + CTA */}
                    <div className="tj-price-section d-flex flex-row flex-sm-column align-items-center align-items-sm-end justify-content-between flex-shrink-0">
                        {formattedPrice ? (
                            <div className="text-sm-end">
                                <div className="tj-price-label">Starting from</div>
                                <div className="tj-price-value">
                                    {formattedPrice}
                                </div>
                                <div className="tj-price-sub">
                                    + taxes &amp; fees
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm-end">
                                <div className="tj-price-label">
                                    Price on request
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={() => onSelect?.(hotel)}
                            className="tj-cta-btn border-0"
                        >
                            View Details
                        </Button>
                    </div>
                </div>
            </div>

            {/* =========================================
                STYLES
            ========================================= */}
            <style jsx>{`
                .tj-hotel-card {
                    --tj-primary: #0a5c4e;
                    --tj-primary-dark: #084a3e;
                    --tj-primary-light: #0d7a66;
                    --tj-accent: #f2ae25;
                    --tj-text-dark: #151c26;
                    --tj-text-mid: #475569;
                    --tj-text-light: #94a3b8;
                    --tj-border: #e9edf1;
                    --tj-bg-soft: #f8fafc;

                    background: #fff;
                    border-radius: 14px;
                    border: 1px solid var(--tj-border);
                    overflow: hidden;
                    transition: box-shadow 0.2s ease, transform 0.2s ease,
                        border-color 0.2s ease;
                    margin-bottom: 16px;
                }

                .tj-hotel-card:hover {
                    box-shadow: 0 10px 30px rgba(10, 92, 78, 0.12);
                    border-color: rgba(10, 92, 78, 0.25);
                    transform: translateY(-2px);
                }

                /* =========================================
                   IMAGE - FIXED HEIGHT
                ========================================= */
                .tj-image-wrapper {
                    width: 100%;
                    height: 220px;
                    min-height: 220px;
                    max-height: 220px;
                    background: #f1f5f9;
                    overflow: hidden;
                    position: relative;
                }

                .tj-gallery {
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }

                .tj-gallery-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    display: block;
                    transition: transform 0.4s ease;
                }

                .tj-hotel-card:hover .tj-gallery-img {
                    transform: scale(1.05);
                }

                .tj-gallery-empty {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    color: var(--tj-text-light);
                }

                .tj-gallery-empty-icon {
                    font-size: 32px;
                    margin-bottom: 6px;
                    opacity: 0.6;
                }

                .tj-gallery-empty-text {
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }

                .tj-img-counter {
                    bottom: 10px;
                    right: 10px;
                    background: rgba(10, 92, 78, 0.85);
                    color: #fff;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                }

                .tj-thumb-strip {
                    bottom: 10px;
                    left: 10px;
                    max-width: calc(100% - 100px);
                    overflow-x: auto;
                    padding: 4px;
                    background: rgba(0, 0, 0, 0.35);
                    border-radius: 8px;
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                    scrollbar-width: none;
                }

                .tj-thumb-strip::-webkit-scrollbar {
                    display: none;
                }

                .tj-thumb-btn {
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    overflow: hidden;
                    opacity: 0.55;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: opacity 0.15s ease, transform 0.15s ease;
                    padding: 0;
                    background: transparent;
                }

                .tj-thumb-btn img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .tj-thumb-btn:hover {
                    opacity: 0.9;
                    transform: scale(1.08);
                }

                .tj-thumb-active {
                    opacity: 1;
                    outline: 2px solid var(--tj-accent);
                    outline-offset: 1px;
                }

                .tj-wishlist-btn {
                    top: 10px;
                    right: 10px;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    color: var(--tj-text-mid);
                    transition: transform 0.15s ease, color 0.15s ease;
                    z-index: 2;
                }

                .tj-wishlist-btn:hover {
                    transform: scale(1.1);
                    color: #e11d48;
                }

                .tj-options-badge {
                    top: 10px;
                    left: 10px;
                    background: var(--tj-accent);
                    color: var(--tj-text-dark);
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.3px;
                    box-shadow: 0 2px 6px rgba(242, 174, 37, 0.4);
                    z-index: 2;
                }

                /* =========================================
                   DETAILS
                ========================================= */
                .tj-details {
                    min-height: 220px;
                }

                .tj-hotel-name {
                    color: var(--tj-text-dark);
                    font-size: 16px;
                    font-weight: 700;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .tj-location {
                    color: #6b7686;
                    font-size: 13px;
                    max-width: 100%;
                }

                /* =========================================
                   ⭐ STAR RATING
                   Lit stars = gold, Dull stars = gray
                ========================================= */
                .tj-rating-wrap {
                    flex-wrap: wrap;
                }

                .tj-stars-row {
                    line-height: 1;
                    gap: 1px;
                }

                .tj-star-icon {
                    font-size: 15px;
                    line-height: 1;
                    display: inline-block;
                }

                /* Gold - filled stars */
                .tj-star-lit {
                    color: #f2ae25;
                    text-shadow: 0 0 1px rgba(242, 174, 37, 0.4);
                }

                /* Gray - empty stars */
                .tj-star-dull {
                    color: #d7dee7;
                    opacity: 0.9;
                }

                .tj-rating-badge {
                    background: linear-gradient(
                        135deg,
                        var(--tj-primary),
                        var(--tj-primary-light)
                    );
                    padding: 3px 8px;
                    border-radius: 6px;
                    line-height: 1;
                    box-shadow: 0 2px 6px rgba(10, 92, 78, 0.25);
                    flex-shrink: 0;
                }

                .tj-rating-num {
                    color: #fff;
                    font-size: 12px;
                    font-weight: 800;
                }

                .tj-rating-star {
                    color: #f2ae25;
                    font-size: 11px;
                }

                /* =========================================
                   PILLS
                ========================================= */
                .tj-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    line-height: 1.4;
                    white-space: nowrap;
                }

                .tj-pill-success {
                    background: #ecfdf5;
                    color: var(--tj-primary);
                    border: 1px solid #a7f3d0;
                }

                .tj-pill-neutral {
                    background: var(--tj-bg-soft);
                    color: var(--tj-text-mid);
                    border: 1px solid #e2e8f0;
                }

                /* =========================================
                   AMENITIES
                ========================================= */
                .tj-amenities {
                    font-size: 12px;
                    color: var(--tj-text-mid);
                }

                .tj-amenity {
                    background: var(--tj-bg-soft);
                    padding: 3px 8px;
                    border-radius: 5px;
                    max-width: 140px;
                    border: 1px solid #f1f5f9;
                }

                .tj-amenity-more {
                    color: var(--tj-text-light);
                    font-size: 11px;
                    font-weight: 700;
                }

                /* =========================================
                   PRICE
                ========================================= */
                .tj-price-section {
                    min-width: 150px;
                    gap: 12px;
                }

                .tj-price-label {
                    font-size: 10px;
                    color: var(--tj-text-light);
                    text-transform: uppercase;
                    letter-spacing: 0.6px;
                    font-weight: 700;
                }

                .tj-price-value {
                    font-size: 20px;
                    color: var(--tj-primary);
                    line-height: 1.2;
                    font-weight: 800;
                    margin: 3px 0;
                }

                .tj-price-sub {
                    font-size: 11px;
                    color: var(--tj-text-light);
                }

                /* =========================================
                   CTA BUTTON
                ========================================= */
                .tj-cta-btn {
                    background: linear-gradient(
                        135deg,
                        var(--tj-primary),
                        var(--tj-primary-light)
                    );
                    border-radius: 8px;
                    padding: 9px 22px;
                    font-weight: 700;
                    font-size: 13px;
                    letter-spacing: 0.3px;
                    white-space: nowrap;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                    box-shadow: 0 3px 10px rgba(10, 92, 78, 0.25);
                }

                .tj-cta-btn:hover,
                .tj-cta-btn:focus {
                    background: linear-gradient(
                        135deg,
                        var(--tj-primary-dark),
                        var(--tj-primary)
                    );
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(10, 92, 78, 0.35);
                }

                .tj-cta-btn:active {
                    transform: translateY(0);
                }

                /* =========================================
                   RESPONSIVE
                ========================================= */
                @media (min-width: 768px) {
                    .tj-image-wrapper {
                        width: 280px;
                        height: 220px;
                        min-height: 220px;
                        max-height: 220px;
                    }

                    .tj-details {
                        min-height: 220px;
                    }
                }

                @media (min-width: 992px) {
                    .tj-image-wrapper {
                        width: 300px;
                        height: 220px;
                        min-height: 220px;
                        max-height: 220px;
                    }
                }

                @media (min-width: 576px) and (max-width: 767.98px) {
                    .tj-image-wrapper {
                        width: 100%;
                        height: 200px;
                        min-height: 200px;
                        max-height: 200px;
                    }

                    .tj-price-section {
                        min-width: 130px;
                    }
                }

                @media (max-width: 575.98px) {
                    .tj-image-wrapper {
                        width: 100%;
                        height: 200px;
                        min-height: 200px;
                        max-height: 200px;
                    }

                    .tj-details {
                        min-height: auto;
                        padding: 14px !important;
                    }

                    .tj-price-section {
                        padding-top: 12px;
                        border-top: 1px solid #f1f5f9;
                        width: 100%;
                        min-width: 0;
                    }

                    .tj-price-value {
                        font-size: 18px;
                    }

                    .tj-cta-btn {
                        padding: 8px 16px;
                        font-size: 12px;
                    }

                    .tj-hotel-name {
                        font-size: 15px;
                    }

                    .tj-img-counter {
                        padding: 3px 8px;
                        font-size: 10px;
                    }

                    .tj-thumb-btn {
                        width: 26px;
                        height: 26px;
                    }

                    .tj-star-icon {
                        font-size: 13px;
                    }
                }
            `}</style>
        </div>
    );
};

export default TripJackHotelCard;