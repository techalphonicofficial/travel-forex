'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import bookingsData from '@/data/bookings.json';

const NAV_ITEMS = [
  { id: 'bookings', label: 'My Bookings', icon: '📋' },
  { id: 'upcoming', label: 'Upcoming Tours', icon: '✈️' },
  { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
  { id: 'profile', label: 'My Profile', icon: '👤' },
  { id: 'history', label: 'History', icon: '🕐' },
];

function Countdown({ dateStr }) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = new Date(dateStr) - new Date();
      if (diff <= 0) return setTimeLeft({ expired: true });
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [dateStr]);

  if (timeLeft.expired) return <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>In progress!</span>;
  return (
    <div className="d-flex gap-2">
      {[['Days', timeLeft.days], ['Hrs', timeLeft.hours], ['Min', timeLeft.minutes]].map(([label, val]) => (
        <div
          key={label}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            textAlign: 'center',
            minWidth: 48,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{val ?? '--'}</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [user] = useState({ name: 'Alex Johnson', email: 'alex@example.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=75' });
  const [wishlist] = useState([
    { id: '2', slug: 'swiss-alps-adventure', title: 'Swiss Alps Adventure', price: 3299, image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=400&q=75', location: 'Switzerland' },
    { id: '6', slug: 'safari-serengeti', title: 'Serengeti Safari', price: 4299, image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&q=75', location: 'Tanzania' },
  ]);

  const upcomingBookings = bookingsData.filter((b) => b.status === 'Upcoming');
  const completedBookings = bookingsData.filter((b) => b.status === 'Completed');

  const BookingCard = ({ booking }) => (
    <div
      style={{
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        gap: 0,
      }}
    >
      <div style={{ position: 'relative', width: 120, flexShrink: 0 }}>
        <Image
          src={booking.image}
          alt={booking.tourTitle}
          fill
          sizes="120px"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div style={{ padding: '16px 20px', flex: 1, minWidth: 0 }}>
        <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              {booking.tourTitle}
            </h3>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              📅 {booking.date} – {booking.endDate} &nbsp;·&nbsp; 👥 {booking.travelers} travelers
            </div>
          </div>
          <span
            className={`badge ${booking.status === 'Upcoming' ? 'badge-primary' : 'badge-success'}`}
            style={{ flexShrink: 0 }}
          >
            {booking.status}
          </span>
        </div>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)', fontFamily: 'Poppins, sans-serif' }}>
              ${booking.totalPrice.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 4 }}>total</span>
          </div>
          <div className="d-flex gap-2">
            <Link href={`/tours/${booking.tourSlug}`} className="btn-secondary btn-sm">
              View Tour
            </Link>
            {booking.status === 'Upcoming' && (
              <Link href={`/booking/confirmation`} className="btn-primary btn-sm">
                E-Ticket
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Blog Hero Container */}
      <div style={{ background: '#111827', padding: '150px 24px 60px', textAlign: 'center', marginBottom: 50 }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 48, fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
          My Dashboard
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Manage your bookings, wishlist, and profile.
        </p>
      </div>

      <div className="container">
        {/* Header */}
        <div className="mb-6 d-flex align-items-center gap-4 flex-wrap" style={{ marginBottom: 40 }}>
          <div style={{ position: 'relative', width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-primary)' }}>
            <Image src={user.avatar} alt={user.name} fill sizes="68px" style={{ objectFit: 'cover' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: 'var(--color-text-primary)', marginBottom: 4 }}>
              Welcome back, {user.name.split(' ')[0]}! 👋
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>{user.email}</p>
          </div>
          <div className="ms-auto d-flex gap-2">
            <Link href="/tours" className="btn-primary btn-sm">
              Browse More Tours
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-5">
          {[
            { icon: '✈️', label: 'Total Trips', value: bookingsData.length, color: 'var(--color-primary)' },
            { icon: '📅', label: 'Upcoming', value: upcomingBookings.length, color: '#f59e0b' },
            { icon: '✅', label: 'Completed', value: completedBookings.length, color: 'var(--color-accent)' },
            { icon: '❤️', label: 'Wishlist', value: wishlist.length, color: '#e53935' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="col-6 col-md-3">
              <div
                style={{
                  background: 'var(--color-bg-card)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Layout */}
        <div className="dashboard-layout">
          {/* Sidebar */}
          <div className="dashboard-sidebar">
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Navigation
              </div>
              <div className="d-flex flex-column gap-1">
                {NAV_ITEMS.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`dashboard-nav-item ${activeTab === id ? 'active' : ''}`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
              <button className="dashboard-nav-item" style={{ color: '#e53935', width: '100%' }}>
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            {/* My Bookings */}
            {activeTab === 'bookings' && (
              <div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--color-text-primary)', marginBottom: 24 }}>
                  My Bookings
                </h2>
                <div className="d-flex flex-column gap-4">
                  {bookingsData.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {activeTab === 'upcoming' && (
              <div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--color-text-primary)', marginBottom: 24 }}>
                  Upcoming Tours — Countdown
                </h2>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-5">
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✈️</div>
                    <p style={{ color: 'var(--color-text-muted)' }}>No upcoming tours. Time to plan your next adventure!</p>
                    <Link href="/tours" className="btn-primary mt-2">Browse Tours</Link>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        style={{
                          background: 'var(--color-bg-card)',
                          borderRadius: 'var(--radius-xl)',
                          padding: 24,
                          border: '1px solid var(--color-border)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                          <div>
                            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{booking.tourTitle}</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>📅 {booking.date}</p>
                          </div>
                          <Countdown dateStr={booking.date} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist */}
            {activeTab === 'wishlist' && (
              <div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 24 }}>
                  My Wishlist ❤️
                </h2>
                <div className="row g-4">
                  {wishlist.map((item) => (
                    <div key={item.id} className="col-md-6">
                      <div style={{
                        background: 'var(--color-bg-card)',
                        borderRadius: 'var(--radius-xl)',
                        overflow: 'hidden',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                      }}>
                        <div style={{ position: 'relative', height: 160 }}>
                          <Image src={item.image} alt={item.title} fill sizes="400px" style={{ objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.title}</h3>
                          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 12 }}>📍 {item.location}</p>
                          <div className="d-flex align-items-center justify-content-between">
                            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>${item.price.toLocaleString()}</span>
                            <Link href={`/tours/${item.slug}`} className="btn-primary btn-sm">Book Now</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 24 }}>
                  My Profile
                </h2>
                <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', padding: 32, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="row g-4">
                    {[
                      { label: 'First Name', value: 'Alex', type: 'text' },
                      { label: 'Last Name', value: 'Johnson', type: 'text' },
                      { label: 'Email', value: user.email, type: 'email' },
                      { label: 'Phone', value: '+1 (555) 123-4567', type: 'tel' },
                      { label: 'Nationality', value: 'United States', type: 'text' },
                      { label: 'Passport Number', value: 'US1234567', type: 'text' },
                    ].map(({ label, value, type }) => (
                      <div key={label} className="col-sm-6">
                        <div className="form-group">
                          <label className="form-label">{label}</label>
                          <input type={type} className="form-input" defaultValue={value} />
                        </div>
                      </div>
                    ))}
                    <div className="col-12">
                      <button className="btn-primary">Save Changes</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            {activeTab === 'history' && (
              <div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 24 }}>
                  Travel History
                </h2>
                <div className="d-flex flex-column gap-4">
                  {completedBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
