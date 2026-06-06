'use client';

import { useState } from 'react';
import { sampleItinerary, navTabs } from '../data';

// ── Sticky Header ── //
export function StickyHeader({ activeTab, scrolled, scrollToSection }) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            background: 'white', zIndex: 1000,
            boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.1)' : 'none',
            transform: scrolled ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '12px 0',
        }}>
            <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827', width: 'max-content', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sampleItinerary.title}</h4>
                        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                            {navTabs.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => scrollToSection(t.id)}
                                    style={{ border: 'none', background: 'none', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? '#10b981' : '#6b7280', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', borderBottom: activeTab === t.id ? '2px solid #10b981' : '2px solid transparent', paddingBottom: 4 }}
                                >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                        <path d={t.icon} />
                                    </svg>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>₹{sampleItinerary.price.toLocaleString('en-IN')} <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280' }}>/ person</span></div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>Excluding Applicable Taxes</div>
                    </div>
                    <button style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Unlock your itinerary</button>
                </div>
            </div>
        </div>
    );
}

// ── Booking Sidebar ── //
export function BookingSidebar() {
    return (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>₹{sampleItinerary.price.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'line-through' }}>₹{sampleItinerary.originalPrice.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700, marginBottom: 20 }}>Saving ₹{(sampleItinerary.originalPrice - sampleItinerary.price).toLocaleString('en-IN')} / Person</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <button style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '16px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(2,110,181,0.2)' }}>Reserve Now</button>
                <button style={{ background: '#f8fafc', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '16px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>Request Callback</button>
            </div>

            <div style={{ paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="#6366f1"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>Instant Confirmation</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Voucher will be sent via email</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="#22c55e"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>Expert Support</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Chat with us for assistance</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Reviews Section ── //
export function ReviewsSection({ showReviewForm, setShowReviewForm, reviewRating, setReviewRating }) {
    return (
        <div id="reviews" style={{ scrollMarginTop: 150, marginBottom: 64 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-poppins)' }}>Travelers&apos; Reviews</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: '#111827' }}>{sampleItinerary.rating}</span>
                        <div>
                            <div style={{ color: '#fbbf24', fontSize: 16 }}>{'★'.repeat(Math.round(sampleItinerary.rating))}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>Based on {sampleItinerary.reviews} reviews</div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #10b981', color: showReviewForm ? 'white' : '#10b981', background: showReviewForm ? '#10b981' : 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' }}
                >
                    {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                </button>
            </div>

            {showReviewForm && (
                <div style={{ background: 'white', padding: 32, borderRadius: 16, border: '1px solid #e5e7eb', marginBottom: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#111827' }}>Share Your Experience</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 20 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>Your Name</label>
                            <input type="text" placeholder="John Doe" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>Email Address</label>
                            <input type="email" placeholder="john@example.com" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>Overall Rating</label>
                        <div style={{ display: 'flex', gap: 8, cursor: 'pointer' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    onClick={() => setReviewRating(star)}
                                    style={{ fontSize: 24, color: star <= reviewRating ? '#fbbf24' : '#e5e7eb', transition: 'color 0.2s' }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>Your Review</label>
                        <textarea rows="4" placeholder="Tell us about your trip. What did you like the most?" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}></textarea>
                    </div>
                    <button style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(2,110,181,0.2)' }}>Submit Review</button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                {sampleItinerary.reviews_list.map((review, idx) => (
                    <div key={idx} style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <img src={review.avatar} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} alt={review.user} />
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{review.user}</div>
                                <div style={{ fontSize: 11, color: '#6b7280' }}>{review.date}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', color: '#fbbf24', fontSize: 12, letterSpacing: 2 }}>{'★'.repeat(review.rating)}</div>
                        </div>
                        <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>&quot;{review.text}&quot;</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Day Wise Itinerary ── //
export function DayWiseItinerary() {
    return (
        <div id="itinerary" style={{ scrollMarginTop: 100, marginBottom: 80 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, fontFamily: 'var(--font-poppins)', color: '#1e293b' }}>Day Wise Itinerary</h2>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Vertical Timeline Line */}
                <div style={{ position: 'absolute', left: '19px', top: '10px', bottom: '10px', width: '2px', background: '#e2e8f0', zIndex: 0 }} />

                {(sampleItinerary.itinerary || []).map((day, dIdx) => (
                    <div key={day.day} style={{ position: 'relative', paddingLeft: '64px', paddingBottom: '32px' }}>
                        {/* Day Dot */}
                        <div style={{ 
                            position: 'absolute', 
                            left: '0', 
                            top: '4px', 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            background: 'var(--color-primary)', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: 14, 
                            fontWeight: 800, 
                            zIndex: 1, 
                            border: '4px solid white', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                        }}>
                            {day.day}
                        </div>

                        <div style={{ 
                            background: 'white', 
                            borderRadius: 20, 
                            border: '1px solid #e2e8f0', 
                            overflow: 'hidden', 
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                            transition: '0.3s'
                        }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 300px', padding: '32px' }}>
                                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>{day.title}</h3>
                                    <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{day.desc}</p>
                                    
                                    <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>
                                            <span style={{ fontSize: 18 }}>🏨</span> Stay Included
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                                            <span style={{ fontSize: 18 }}>🍽️</span> Breakfast Included
                                        </div>
                                    </div>
                                </div>
                                <div style={{ flex: '1 1 200px', height: '240px', position: 'relative' }}>
                                    <img src={day.image + '?w=800'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={day.title} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, white, transparent 20%)', '@media (max-width: 600px)': { display: 'none' } }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Trip Highlights Section ── //
export function TripHighlights({ scrollToSection }) {
    return (
        <div id="overview" style={{
            scrollMarginTop: 150,
            marginBottom: 80,
            marginLeft: '-100vw', marginRight: '-100vw', padding: '100px 100vw',
            background: '#0f172a',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ position: 'relative', width: '100%', margin: '0 auto' }}>
                <div style={{ marginBottom: 64, textAlign: 'left' }}>
                    <h2 style={{ fontSize: 42, fontWeight: 800, marginBottom: 20, fontFamily: 'var(--font-poppins)', letterSpacing: '-0.03em' }}>Trip Highlights</h2>
                    <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6, marginBottom: 36, maxWidth: 700 }}>
                        Exclusive activities designed to offer you the ultimate experience.
                        Discover the hidden gems of {sampleItinerary.destinations[0]}.
                    </p>
                    <button 
                        onClick={() => scrollToSection('inclusions')} 
                        style={{ 
                            background: 'transparent', 
                            border: '1.5px solid #475569', 
                            color: 'white', 
                            padding: '14px 40px', 
                            borderRadius: 12, 
                            fontSize: 15, 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        View all inclusions
                    </button>
                </div>

                <div className="sample-highlights-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: 32,
                    alignItems: 'stretch'
                }}>
                    {(sampleItinerary.activities || []).map((act, idx) => (
                        <div key={idx} style={{
                            background: '#1e293b',
                            borderRadius: 28, 
                            border: '2px solid #22c55e',
                            overflow: 'hidden', 
                            position: 'relative',
                            aspectRatio: '0.8',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                            transition: 'transform 0.3s ease'
                        }}>
            <div className="sample-visa-card" style={{
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                right: 0, 
                                padding: '12px 16px', 
                                background: '#22c55e', 
                                color: '#064e3b', 
                                fontSize: 12, 
                                fontWeight: 900, 
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                zIndex: 10,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                ⚡ Exclusive with {sampleItinerary.badges[1]}
                            </div>
                            <img src={act.image + '?w=1000'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={act.name} />
                            <div style={{ 
                                position: 'absolute', 
                                inset: 0, 
                                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.5) 40%, transparent 100%)', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'flex-end', 
                                padding: 32 
                            }}>
                                <div style={{ marginBottom: 16 }}>
                                    <span style={{ fontSize: 11, fontWeight: 900, background: '#22c55e', color: '#064e3b', padding: '5px 16px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>INCLUDED</span>
                                </div>
                                <h4 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{act.name}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Hotels Section ── //
export function HotelsSection() {
    return (
        <div id="hotels" style={{ scrollMarginTop: 100, marginBottom: 80 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, color: '#1e293b' }}>Hotels & Resorts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                {(sampleItinerary.hotels || []).map((hotel, hIdx) => (
                    <div key={hIdx} style={{ 
                        background: 'white', 
                        borderRadius: 20, 
                        border: '1px solid #e2e8f0', 
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        transition: 'transform 0.3s ease'
                    }}>
                        <div style={{ height: 220, position: 'relative' }}>
                            <img src={hotel.image + '?w=800'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={hotel.name} />
                            <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.9)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', backdropFilter: 'blur(4px)' }}>
                                {hotel.type}
                            </div>
                        </div>
                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                                {[...Array(hotel.stars)].map((_, i) => (
                                    <span key={i} style={{ color: '#fbbf24', fontSize: 14 }}>★</span>
                                ))}
                            </div>
                            <h4 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#1e293b' }}>{hotel.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                                <svg viewBox="0 0 24 24" width="14" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                {hotel.location}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Inclusions & Exclusions Section ── //
export function InclusionsExclusionsSection({ inclusionSubTab, setInclusionSubTab }) {
    return (
        <div id="inclusions" style={{ scrollMarginTop: 150, marginBottom: 80 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, color: '#1e293b' }}>Inclusions & Exclusions</h2>

            {/* Inclusion Sub-tabs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 40, overflowX: 'auto', paddingBottom: 4 }}>
                {['Stays', 'Transfers', 'Activities', 'Visa & Insurance'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setInclusionSubTab(tab.toLowerCase().includes('visa') ? 'visa' : tab.toLowerCase())}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 12,
                            border: '1px solid',
                            background: (inclusionSubTab === 'visa' && tab.toLowerCase().includes('visa')) || inclusionSubTab === tab.toLowerCase() ? '#f0fdf4' : 'white',
                            color: (inclusionSubTab === 'visa' && tab.toLowerCase().includes('visa')) || inclusionSubTab === tab.toLowerCase() ? '#10b981' : '#64748b',
                            borderColor: (inclusionSubTab === 'visa' && tab.toLowerCase().includes('visa')) || inclusionSubTab === tab.toLowerCase() ? '#10b981' : '#e2e8f0',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: '0.2s'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Visa & Insurance Content */}
            {inclusionSubTab === 'visa' && (
                <div style={{
                    background: 'white',
                    borderRadius: 20,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    marginBottom: 48,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{ width: 240, flexShrink: 0 }}>
                        <img src={sampleItinerary.visaInfo.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Visa" />
                    </div>
                    <div style={{ padding: 32, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px', color: '#1e293b' }}>{sampleItinerary.visaInfo.title}</h3>
                                <div style={{ display: 'flex', gap: 24 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Visa Type</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{sampleItinerary.visaInfo.type}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Processing Time</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>3-5 Business Days</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #ef4444', color: '#ef4444', background: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                                <button style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #10b981', color: '#10b981', background: '#f0fdf4', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Change</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inclusions & Exclusions Grid */}
            <div className="sample-inclusions-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64 }}>
                <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: 24, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#10b981' }}>✓</span> Inclusions
                    </h4>
                    <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {sampleItinerary.inclusions.map((item, idx) => (
                            <li key={idx} style={{ fontSize: 15, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 14, lineHeight: 1.6 }}>
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>✓</div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                    <div>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: 24, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: '#ef4444' }}>×</span> Exclusions
                        </h4>
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {sampleItinerary.exclusions.map((item, idx) => (
                                <li key={idx} style={{ fontSize: 15, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 14, lineHeight: 1.6 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>×</div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Mobile App Promo */}
                    <div style={{ background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)', padding: 32, borderRadius: 20, border: '1px dashed #cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                            <div style={{ width: 44, height: 44, background: '#10b981', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 24 24" fill="white" width="24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" /></svg>
                            </div>
                            <div>
                                <h5 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Pickyourtrail App</h5>
                                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>BETTER TRAVEL EXPERIENCE</div>
                            </div>
                        </div>
                        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
                            Stay updated wherever you are & travel hassle-free with our mobile concierge.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>💬</span> Concierge</div>
                            <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>📋</span> Vouchers</div>
                            <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>🛠️</span> Tools</div>
                            <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>📍</span> Guide</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Transfers Section ── //
export function TransfersSection() {
    return (
        <div id="transfers" style={{ scrollMarginTop: 100, marginBottom: 64 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, fontFamily: 'var(--font-poppins)' }}>Transfers</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                {(sampleItinerary.transfers || []).map((t, idx) => (
                    <div key={idx} style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 80, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                            <img src={t.image + '?w=200'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={t.title} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>{t.title}</h4>
                            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{t.type} · {t.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Activities Section ── //
export function ActivitiesSection() {
    return (
        <div id="activities" style={{ scrollMarginTop: 100, marginBottom: 80 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, color: '#1e293b' }}>Activities</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
                {(sampleItinerary.activities || []).map((act, idx) => (
                    <div key={idx} style={{ 
                        position: 'relative', 
                        height: 200, 
                        borderRadius: 20, 
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <img src={act.image + '?w=600'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={act.name} />
                        <div style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 70%)', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'flex-end', 
                            padding: 24 
                        }}>
                            <h4 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>{act.name}</h4>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '4px 0 0' }}>{act.location}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Policies Section ── //
export function PoliciesSection() {
    return (
        <div id="policies" style={{ scrollMarginTop: 100, marginBottom: 80 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, color: '#1e293b' }}>Trip Policies</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {(sampleItinerary.policies || []).map((p, idx) => (
                    <div key={idx} style={{ 
                        background: 'white', 
                        padding: 32, 
                        borderRadius: 20, 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                    }}>
                        <h4 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }}></span>
                            {p.title}
                        </h4>
                        <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {p.items.map((item, iIdx) => (
                                <li key={iIdx} style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{item}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── FAQ Section ── //
export function FAQSection() {
    return (
        <div style={{ marginBottom: 100 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, color: '#1e293b' }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sampleItinerary.faqs.map((faq, idx) => (
                    <details key={idx} style={{ 
                        background: 'white', 
                        borderRadius: 16, 
                        border: '1px solid #e2e8f0', 
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                    }}>
                        <summary style={{ 
                            padding: '24px 32px', 
                            fontSize: 16, 
                            fontWeight: 700, 
                            color: '#1e293b', 
                            cursor: 'pointer', 
                            listStyle: 'none', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            userSelect: 'none'
                        }}>
                            {faq.q}
                            <span style={{ fontSize: 18, color: '#94a3b8' }}>+</span>
                        </summary>
                        <div style={{ 
                            padding: '0 32px 32px', 
                            fontSize: 15, 
                            color: '#64748b', 
                            lineHeight: 1.8,
                            borderTop: '1px solid #f1f5f9',
                            paddingTop: 16
                        }}>
                            {faq.a}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}

// ── Header Section ── //
export function HeaderSection() {
    return (
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {(sampleItinerary.badges || []).map(b => (
                        <span key={b} style={{ fontSize: 10, fontWeight: 800, background: b === 'BESTSELLER' ? '#10b981' : 'var(--color-primary)', color: 'white', padding: '4px 10px', borderRadius: 6, letterSpacing: 0.5 }}>{b}</span>
                    ))}
                </div>
                <h1 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'var(--font-poppins)' }}>
                    {sampleItinerary.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ {sampleItinerary.rating}</span>
                    <span>({sampleItinerary.reviews} reviews)</span>
                    <span>·</span>
                    <span>{sampleItinerary.duration}</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>Share</button>
                <button style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>Save</button>
            </div>
        </div>
    );
}

// ── Gallery Section ── //
export function GallerySection() {
    return (
        <div className="sample-gallery-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '200px 200px', gap: 12, marginBottom: 40, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ gridRow: 'span 2', position: 'relative' }}>
                <img src={sampleItinerary.gallery[0] + '?w=1200'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Gallery 1" />
            </div>
            <div style={{ position: 'relative' }}>
                <img src={sampleItinerary.gallery[1] + '?w=600'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Gallery 2" />
            </div>
            <div style={{ position: 'relative' }}>
                <img src={sampleItinerary.gallery[2] + '?w=600'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Gallery 3" />
            </div>
            <div style={{ position: 'relative' }}>
                <img src={sampleItinerary.gallery[3] + '?w=600'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Gallery 4" />
            </div>
            <div style={{ position: 'relative' }}>
                <img src={sampleItinerary.gallery[4] + '?w=600'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Gallery 5" />
                <button style={{ position: 'absolute', bottom: 12, right: 12, background: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>View All Photos</button>
            </div>
        </div>
    );
}

// ── Quick Info Section ── //
export function QuickInfoSection() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e5e7eb', marginBottom: 40 }}>
            <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Duration</div>
                <div style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>{sampleItinerary.duration}</div>
            </div>
            <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Travelers</div>
                <div style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>{sampleItinerary.travelers}</div>
            </div>
            <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Destinations</div>
                <div style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>{sampleItinerary.destinations.join(' · ')}</div>
            </div>
        </div>
    );
}

// ── Map Section ── //
export function MapSection() {
    return (
        <div style={{ marginTop: 64, marginBottom: 64 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Explore the Route</h2>
            <div style={{ height: 400, background: '#e2e8f0', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Map" />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '12px 24px', borderRadius: 40, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg viewBox="0 0 24 24" width="20" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                        View Interactive Map
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Tab Navigation ── //
export function MainTabNavigation({ activeTab, scrollToSection }) {
    return (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', borderBottom: '1px solid #e5e7eb', marginBottom: 32, paddingBottom: 2 }}>
            {navTabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id)}
                    style={{
                        padding: '12px 16px', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                        color: activeTab === tab.id ? '#10b981' : '#6b7280',
                        border: 'none', borderBottom: activeTab === tab.id ? '2px solid #10b981' : '2px solid transparent',
                        background: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s',
                        display: 'flex', alignItems: 'center', gap: 6
                    }}
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d={tab.icon} />
                    </svg>
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
