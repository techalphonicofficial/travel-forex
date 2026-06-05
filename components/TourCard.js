'use client';

import Image from 'next/image';
import Link from 'next/link';
import StarRating from './StarRating';
import { useWishlist } from './WishlistProvider';

const formatPriceNumber = (value) => Number(value || 0).toLocaleString('en-IN');

const getTourViewHref = (tour) => {
  const destination = tour.location || tour.country || tour.slug || 'paris';
  const queryValue = String(destination)
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const params = new URLSearchParams({
    destination: queryValue || 'paris',
    view: 'itinerary',
  });

  if (tour.slug) {
    params.set('package', tour.slug);
  }

  return `/tours?${params.toString()}`;
};

export default function TourCard({ tour, className = '' }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlistItem = {
    id: tour.slug || tour.id || tour.title,
    type: 'tour',
    title: tour.title,
    location: tour.location,
    image: tour.image,
    price: tour.price,
    href: getTourViewHref(tour),
    slug: tour.slug,
    duration: tour.duration ? `${tour.duration}D` : '',
    badge: tour.type,
  };
  const wishlisted = isWishlisted(wishlistItem);
  const discount = tour.originalPrice
    ? Math.round(((tour.originalPrice - tour.price) / tour.originalPrice) * 100)
    : 0;

  return (
    <div className={`tour-card ${className}`}>
      {/* Image */}
      <div className="tour-card-image-wrap" style={{ position: 'relative' }}>
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH7AQsBAsNCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAApAFADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUH/8QAIRAAAQQCAgMBAAAAAAAAAAAAAQIDBAUREiExQWH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0Tj2R2PaDRt9GpPk1kd8l2hq7c8JHEcTwqOiqCAioqCKqiKQB0fOdQiSmR2e0l2G7AAAAAAB/9k="
        />
        <div className="tour-card-overlay" />

        {/* Badges */}
        <div className="tour-card-badges">
          <span className="badge" style={{ background: 'var(--color-primary)', color: 'white', fontSize: 11 }}>
            {tour.type}
          </span>
          {discount > 0 && (
            <span className="badge" style={{ background: 'var(--color-secondary)', color: 'white', fontSize: 11 }}>
              -{discount}%
            </span>
          )}
          {tour.trending && (
            <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 11, backdropFilter: 'blur(8px)' }}>
              🔥 Hot
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          className="tour-card-wishlist"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(wishlistItem);
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          style={{ color: 'white', background: wishlisted ? 'rgba(255,87,34,0.9)' : 'rgba(255,255,255,0.2)' }}
        >
          <svg viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Price Tag on image */}
        <div className="tour-card-price-tag">
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>From</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'Poppins, sans-serif', lineHeight: 1.1 }}>
            Rs {formatPriceNumber(tour.price)}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="tour-card-body">
        <div className="tour-card-location">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          {tour.location}
        </div>

        <h3 className="tour-card-title line-clamp-2">{tour.title}</h3>

        {/* Meta */}
        <div className="tour-card-meta">
          <div className="tour-card-meta-item">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{ color: 'var(--color-text-muted)' }}>
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
            </svg>
            {tour.duration}D
          </div>
          <div className="tour-card-meta-item">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{ color: 'var(--color-text-muted)' }}>
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            {tour.groupSize} max
          </div>
          <div className="tour-card-meta-item">
            <StarRating rating={tour.rating} size={13} />
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>{tour.rating}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>({tour.reviews})</span>
          </div>
        </div>

        {/* Footer */}
        <div className="tour-card-footer">
          <div>
            {tour.originalPrice && (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                Rs {formatPriceNumber(tour.originalPrice)}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>per person</div>
          </div>
          <Link href={getTourViewHref(tour)} className="btn-primary btn-sm">
            View Tour
          </Link>
        </div>
      </div>
    </div>
  );
}
