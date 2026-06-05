'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import TourCard from '@/components/TourCard';
import ScrollReveal from '@/components/ScrollReveal';

const BLUR_PLACEHOLDER = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH7AQsBAsNCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARCAAUAEADASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

export default function TourDetailClient({ tour, similarTours }) {
  const [travelers, setTravelers] = useState(2);
  const [selectedDate, setSelectedDate] = useState('');
  const [galleryModal, setGalleryModal] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [openDays, setOpenDays] = useState([0]);
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [reviewMessage, setReviewMessage] = useState('');

  const totalPrice = tour.price * travelers;

  // Mock reviews data generator
  const getReviews = (tourId) => {
    const reviewsPool = [
      { id: 1, user: "Amit S.", rating: 5, date: "10 Jan 2024", comment: "Amazing experience! The hotels were exactly as described and the guide was very helpful.", avatar: "A" },
      { id: 2, user: "Priya K.", rating: 5, date: "15 Feb 2024", comment: "Value for money. The itinerary was well planned and we didn't feel rushed.", avatar: "P" },
      { id: 3, user: "Rahul M.", rating: 4, date: "22 Feb 2024", comment: "The tour was great. Only wish we had a bit more time at the main city.", avatar: "R" },
      { id: 4, user: "Sneha G.", rating: 5, date: "05 Mar 2024", comment: "Highly recommended for families. Everything was taken care of perfectly.", avatar: "S" }
    ];
    return reviewsPool.slice(0, (parseInt(tourId) % 3) + 2);
  };

  const currentReviews = [...submittedReviews, ...getReviews(tour.id)];

  const handleReviewSubmit = (event) => {
    event.preventDefault();

    if (!reviewRating || !reviewText.trim()) {
      setReviewMessage('Please add a rating and write your review.');
      return;
    }

    const trimmedName = reviewName.trim();
    const newReview = {
      id: `local-${Date.now()}`,
      user: trimmedName || 'Guest Traveler',
      rating: reviewRating,
      date: 'Just now',
      comment: reviewText.trim(),
      avatar: (trimmedName || 'G').charAt(0).toUpperCase(),
    };

    setSubmittedReviews((prev) => [newReview, ...prev]);
    setReviewName('');
    setReviewText('');
    setReviewRating(0);
    setReviewMessage('Thanks! Your review has been added to this page.');
  };

  const toggleDay = (day) => {
    setOpenDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div>
      {/* ── GALLERY ── */}
      <div className="gallery-grid" style={{ maxHeight: 500, marginBottom: 0 }}>
        {/* Main Image */}
        <div className="gallery-item gallery-main" onClick={() => setGalleryModal(0)}>
          <Image
            src={tour.gallery[0]}
            alt={tour.title}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            style={{ objectFit: 'cover' }}
            loading="eager"
            preload
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.3s',
            }}
            className="gallery-hover-overlay"
          />
        </div>

        {/* Thumbnails */}
        {tour.gallery.slice(1, 3).map((src, i) => (
          <div key={i} className="gallery-item gallery-thumb" onClick={() => setGalleryModal(i + 1)}>
            <Image
              src={src}
              alt={`${tour.title} ${i + 2}`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ objectFit: 'cover' }}
              loading="lazy"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
            {i === 1 && tour.gallery.length > 3 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +{tour.gallery.length - 3} more
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="container" style={{ padding: '48px 24px 80px' }}>
        <div className="row g-5">
          {/* Left Content */}
          <div className="col-lg-8">
            {/* Header */}
            <div className="mb-5">
              <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                <span className="badge badge-primary" style={{ fontSize: 13 }}>{tour.type}</span>
                {tour.trending && (
                  <span className="badge" style={{ background: 'rgba(255,87,34,0.12)', color: 'var(--color-secondary)', fontSize: 13 }}>
                    🔥 Trending
                  </span>
                )}
              </div>

              <h1
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 'clamp(28px, 4vw, 42px)',
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.2,
                  marginBottom: 16,
                }}
              >
                {tour.title}
              </h1>

              <div className="d-flex align-items-center gap-4 flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ color: 'var(--color-primary)' }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>{tour.location}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <StarRating rating={tour.rating} size={15} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{tour.rating}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>({tour.reviews} reviews)</span>
                </div>
                <div className="d-flex align-items-center gap-1" style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                  </svg>
                  {tour.duration} days
                </div>
                <div className="d-flex align-items-center gap-1" style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  Max {tour.groupSize}
                </div>
              </div>
            </div>

            {/* Tabs (Sticky Header) */}
            <div 
              style={{ 
                position: 'sticky', 
                top: '72px', 
                zIndex: 100, 
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                padding: '12px 0 20px',
                margin: '0 -15px 15px',
                paddingLeft: '15px',
                paddingRight: '15px',
                borderBottom: '1px solid var(--color-border)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  background: 'var(--color-bg-soft)',
                  borderRadius: 'var(--radius-md)',
                  padding: 4,
                }}
              >
                {['overview', 'itinerary', 'includes', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: activeTab === tab ? 'white' : 'transparent',
                      color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mb-5">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
                    {tour.description}
                  </p>
                  <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, color: 'var(--color-text-primary)' }}>
                    Tour Highlights
                  </h3>
                  <div className="row g-3">
                    {tour.highlights.map((h, i) => (
                      <div key={i} className="col-sm-6">
                        <div
                          className="d-flex align-items-center gap-3 p-3"
                          style={{
                            background: 'var(--color-bg-soft)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'var(--color-primary-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ color: 'var(--color-primary)' }}>
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{h}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Map Placeholder */}
                  <div
                    style={{
                      marginTop: 32,
                      height: 260,
                      background: 'linear-gradient(135deg, var(--color-bg-soft) 0%, var(--color-border) 100%)',
                      borderRadius: 'var(--radius-xl)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      border: '2px dashed var(--color-border)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40" style={{ opacity: 0.4 }}>
                      <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9 15 21l5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>Destination Map</div>
                      <div style={{ fontSize: 13 }}>{tour.location}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Itinerary Tab */}
              {activeTab === 'itinerary' && (
                <div className="d-flex flex-column gap-3">
                  {tour.itinerary.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        onClick={() => toggleDay(i)}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          background: openDays.includes(i) ? 'var(--color-primary-light)' : 'var(--color-bg-soft)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.2s',
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: openDays.includes(i) ? 'var(--color-primary)' : 'white',
                            color: openDays.includes(i) ? 'white' : 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 13,
                            flexShrink: 0,
                            border: '2px solid',
                            borderColor: openDays.includes(i) ? 'var(--color-primary)' : 'var(--color-border)',
                            transition: 'all 0.2s',
                          }}
                        >
                          {item.day}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: openDays.includes(i) ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                            {item.title}
                          </div>
                        </div>
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          width="20"
                          height="20"
                          style={{
                            color: 'var(--color-text-muted)',
                            transform: openDays.includes(i) ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s',
                          }}
                        >
                          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                        </svg>
                      </button>
                      {openDays.includes(i) && (
                        <div style={{ padding: '16px 20px 16px 72px', background: 'white' }}>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                            {item.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Includes Tab */}
              {activeTab === 'includes' && (
                <div className="row g-4">
                  <div className="col-md-6">
                    <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-accent)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      What&apos;s Included
                    </h3>
                    <ul className="list-unstyled d-flex flex-column gap-2">
                      {tour.included.map((item, i) => (
                        <li key={i} className="d-flex align-items-start gap-2" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,184,148,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style={{ color: 'var(--color-accent)' }}>
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h3 style={{ fontWeight: 700, fontSize: 16, color: '#e53935', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                      Not Included
                    </h3>
                    <ul className="list-unstyled d-flex flex-column gap-2">
                      {tour.excluded.map((item, i) => (
                        <li key={i} className="d-flex align-items-start gap-2" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(229,57,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style={{ color: '#e53935' }}>
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  <form
                    onSubmit={handleReviewSubmit}
                    className="mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,123,255,0.08), rgba(255,255,255,0.96))',
                      border: '1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-border))',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow: 'var(--shadow-sm)',
                      padding: 24,
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
                      <div>
                        <div style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 800, letterSpacing: 0, textTransform: 'uppercase', marginBottom: 6 }}>
                          Share your experience
                        </div>
                        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                          Write a review
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '8px 0 0', maxWidth: 560 }}>
                          Tell future travelers what stood out about this tour.
                        </p>
                      </div>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'var(--color-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 12px 24px rgba(0,123,255,0.18)',
                        }}
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 8H7V9h10v2zm-4 3H7v-2h6v2zm4-6H7V6h10v2z" />
                        </svg>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Your name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={reviewName}
                          onChange={(event) => setReviewName(event.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Your rating</label>
                        <div
                          className="d-flex align-items-center gap-2"
                          style={{
                            minHeight: 48,
                            background: 'white',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0 12px',
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setReviewRating(rating)}
                              aria-label={`Rate ${rating} out of 5`}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: rating <= reviewRating ? '#ffb400' : 'var(--color-border)',
                                fontSize: 24,
                                lineHeight: 1,
                                padding: '6px 2px',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease, color 0.15s ease',
                                transform: rating === reviewRating ? 'scale(1.12)' : 'scale(1)',
                              }}
                            >
                              ★
                            </button>
                          ))}
                          <span style={{ marginLeft: 6, color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>
                            {reviewRating ? `${reviewRating}/5` : 'Select rating'}
                          </span>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Your review</label>
                        <textarea
                          className="form-input"
                          rows={5}
                          value={reviewText}
                          onChange={(event) => setReviewText(event.target.value)}
                          placeholder="Write about hotels, itinerary, support, transfers, or anything that helped your trip..."
                          style={{ resize: 'vertical', minHeight: 132 }}
                        />
                      </div>
                    </div>

                    {reviewMessage && (
                      <div
                        style={{
                          marginTop: 14,
                          color: reviewMessage.startsWith('Thanks') ? 'var(--color-accent)' : '#e53935',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {reviewMessage}
                      </div>
                    )}

                    <div className="d-flex justify-content-end mt-4">
                      <button type="submit" className="btn-primary btn-sm">
                        Submit Review
                      </button>
                    </div>
                  </form>

                  <div className="reviews-list d-flex flex-column gap-3">
                    {currentReviews.map((rev) => (
                      <div key={rev.id} className="p-4" style={{ background: 'var(--color-bg-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center gap-3">
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {rev.avatar}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{rev.user}</div>
                              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{rev.date}</div>
                            </div>
                          </div>
                          <StarRating rating={rev.rating} size={12} />
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-5">
                    <button className="btn-secondary btn-sm">See All {tour.reviews} Reviews</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right – Booking Card */}
          <div className="col-lg-4">
            <div className="booking-card-sticky">
              {/* Header */}
              <div className="booking-card-header">
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Starting from</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'Poppins, sans-serif' }}>
                    ${tour.price.toLocaleString()}
                  </div>
                  <div style={{ opacity: 0.75, fontSize: 14 }}>/ person</div>
                </div>
                {tour.originalPrice && (
                  <div style={{ fontSize: 13, opacity: 0.7, textDecoration: 'line-through' }}>
                    Was ${tour.originalPrice.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="booking-card-body">
                {/* Date */}
                <div className="form-group">
                  <label className="form-label">Select Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Travelers */}
                <div className="form-group">
                  <label className="form-label">Travelers</label>
                  <div className="d-flex align-items-center gap-3">
                    <button
                      onClick={() => setTravelers(Math.max(1, travelers - 1))}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '2px solid var(--color-border)',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        color: 'var(--color-text-primary)',
                        transition: 'all 0.2s',
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 18, minWidth: 24, textAlign: 'center' }}>
                      {travelers}
                    </span>
                    <button
                      onClick={() => setTravelers(Math.min(tour.groupSize, travelers + 1))}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '2px solid var(--color-primary)',
                        background: 'var(--color-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        color: 'white',
                        transition: 'all 0.2s',
                      }}
                    >
                      +
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      max {tour.groupSize}
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div
                  style={{
                    background: 'var(--color-bg-soft)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginBottom: 20,
                  }}
                >
                  <div className="d-flex justify-content-between mb-2" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    <span>${tour.price.toLocaleString()} × {travelers} travelers</span>
                    <span>${(tour.price * travelers).toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2" style={{ fontSize: 14, color: 'var(--color-accent)' }}>
                    <span>Promo discount</span>
                    <span>–$0</span>
                  </div>
                  <div
                    style={{
                      borderTop: '1px dashed var(--color-border)',
                      paddingTop: 12,
                      marginTop: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 800,
                      fontSize: 18,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <span>Total</span>
                    <span style={{ color: 'var(--color-primary)' }}>${totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/booking/${tour.id}`}
                  className="btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{ marginBottom: 12 }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                  </svg>
                  Book This Tour
                </Link>
                <button
                  className="btn-secondary w-100"
                  onClick={() => window.open('https://wa.me/?text=I%20want%20to%20enquire%20about%20' + tour.title)}
                >
                  Ask a Question
                </button>

                {/* Trust badges */}
                <div className="d-flex gap-2 justify-content-center mt-4 flex-wrap">
                  {['🔒 Secure Payment', '✅ Free Cancellation', '📞 24/7 Support'].map((b) => (
                    <span key={b} style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-bg-soft)', padding: '3px 10px', borderRadius: 999 }}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SIMILAR TOURS ── */}
        {similarTours.length > 0 && (
          <div className="mt-5">
            <ScrollReveal>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 28, color: 'var(--color-text-primary)', marginBottom: 32 }}>
                Similar Tours
              </h2>
            </ScrollReveal>
            <div className="row g-4">
              {similarTours.map((t, i) => (
                <div key={t.id} className="col-lg-4 col-md-6">
                  <ScrollReveal delay={i * 100}>
                    <TourCard tour={t} />
                  </ScrollReveal>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gallery Modal */}
      {galleryModal !== null && (
        <div className="modal-overlay" onClick={() => setGalleryModal(null)}>
          <div style={{ position: 'relative', maxWidth: 900, width: '100%', maxHeight: '85vh', aspectRatio: '16/9' }} onClick={(e) => e.stopPropagation()}>
            <Image
              src={tour.gallery[galleryModal]}
              alt={tour.title}
              fill
              style={{ objectFit: 'contain', borderRadius: 'var(--radius-xl)' }}
              sizes="100vw"
            />
            <button
              onClick={() => setGalleryModal(null)}
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
                zIndex: 1,
              }}
            >
              ✕
            </button>
            {galleryModal > 0 && (
              <button
                onClick={() => setGalleryModal(galleryModal - 1)}
                style={{
                  position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
                  width: 44, height: 44, borderRadius: '50%', background: 'white', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', zIndex: 1
                }}
              >
                ←
              </button>
            )}
            {galleryModal < tour.gallery.length - 1 && (
              <button
                onClick={() => setGalleryModal(galleryModal + 1)}
                style={{
                  position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
                  width: 44, height: 44, borderRadius: '50%', background: 'white', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', zIndex: 1
                }}
              >
                →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
