'use client';

import Image from 'next/image';
import StarRating from './StarRating';

export default function ReviewCard({ review }) {
  return (
    <div className="review-card">
      <div className="review-quote">"</div>
      <p className="review-text">{review.review}</p>

      <div className="mb-3">
        <StarRating rating={review.rating} size={15} />
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
          for {review.tour}
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
            border: '2px solid var(--color-border)',
          }}
        >
          <Image
            src={review.avatar}
            alt={review.name}
            fill
            sizes="44px"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>
            {review.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
            {review.location} · {review.date}
          </div>
        </div>
      </div>
    </div>
  );
}
