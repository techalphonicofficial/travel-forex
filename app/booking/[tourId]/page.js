'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import tours from '@/data/tours.json';
import toast from 'react-hot-toast';
import { getStoredAuth } from '@/utils/api';

const STEPS = ['Tour Details', 'Personal Info', 'Payment', 'Review'];

function ProgressBar({ currentStep }) {
  return (
    <div className="step-indicator">
      {STEPS.map((label, i) => (
        <div key={label} className="step-item">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
            <div
              className={`step-circle ${i < currentStep ? 'completed' : i === currentStep ? 'active' : 'pending'}`}
            >
              {i < currentStep ? (
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: i === currentStep ? 'var(--color-primary)' : i < currentStep ? 'var(--color-accent)' : 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`step-line ${i < currentStep ? 'completed' : ''}`}
              style={{ margin: '0 8px', marginBottom: 24 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.tourId;
  const tour = tours.find((t) => t.id === tourId);

  const [step, setStep] = useState(0);
  const [travelers, setTravelers] = useState(2);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const auth = getStoredAuth();

    if (!auth?.token) {
      toast.error('Please login before booking.');
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.replace(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm();

  if (!tour) {
    return (
      <div className="container text-center py-5" style={{ marginTop: 100 }}>
        <h2>Tour not found</h2>
        <Link href="/tours" className="btn-primary mt-3">Browse Tours</Link>
      </div>
    );
  }

  const totalPrice = tour.price * travelers;

  const nextStep = async () => {
    if (!getStoredAuth()?.token) {
      toast.error('Please login before booking.');
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (step === 1) {
      const valid = await trigger(['firstName', 'lastName', 'email', 'phone']);
      if (!valid) return;
    }
    if (step === 2) {
      const valid = await trigger(['cardNumber', 'expiry', 'cvv', 'cardName']);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = () => {
    if (!getStoredAuth()?.token) {
      toast.error('Please login before booking.');
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    toast.success('Booking confirmed! Redirecting...');
    setTimeout(() => router.push('/booking/confirmation'), 1500);
  };

  const renderTourSummaryCard = () => (
    <div
      style={{
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: 100,
      }}
    >
      <div style={{ position: 'relative', height: 180 }}>
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          sizes="400px"
          style={{ objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-card)' }} />
      </div>
      <div style={{ padding: 20 }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)', marginBottom: 4 }}>
          {tour.title}
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          {tour.location}
        </p>
        <div className="d-flex flex-column gap-2">
          {[
            [`📅`, selectedDate || 'Not selected', 'Date'],
            ['👥', `${travelers} travelers`, 'Group'],
            ['⏱️', `${tour.duration} days`, 'Duration'],
          ].map(([icon, value, label]) => (
            <div key={label} className="d-flex justify-content-between align-items-center" style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {icon} {label}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: '1px dashed var(--color-border)',
            marginTop: 16,
            paddingTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--color-primary)', fontFamily: 'Poppins, sans-serif' }}>
            ${totalPrice.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Blog Hero Container */}
      <div style={{ background: '#111827', padding: '100px 24px 60px', textAlign: 'center', marginBottom: 50 }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 48, fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
          Travel Inspiration & Stories
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Discover hidden gems, expert packing guides, and carefully curated itineraries for your next adventure.
        </p>
      </div>
      <div className="container ">
        <div className="mb-5">
          <span className="section-label">🎫 Secure Booking</span>
          <h1 className="section-title">Complete Your Booking</h1>
        </div>

        <ProgressBar currentStep={step} />

        <div className="row g-5">
          <div className="col-lg-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 0: Tour Details */}
              {step === 0 && (
                <div
                  className="p-5"
                  style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 24, color: 'var(--color-text-primary)' }}>
                    Tour Details
                  </h2>

                  {/* Select Date */}
                  <div className="form-group">
                    <label className="form-label">Departure Date *</label>
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
                    <label className="form-label">Number of Travelers</label>
                    <div className="d-flex align-items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setTravelers(Math.max(1, travelers - 1))}
                        style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        −
                      </button>
                      <span style={{ fontWeight: 800, fontSize: 24, minWidth: 32, textAlign: 'center' }}>{travelers}</span>
                      <button
                        type="button"
                        onClick={() => setTravelers(Math.min(tour.groupSize, travelers + 1))}
                        style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--color-primary)', background: 'var(--color-primary)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                      >
                        +
                      </button>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Max {tour.groupSize} per group</span>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="form-group">
                    <label className="form-label">Special Requests (optional)</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Dietary requirements, accessibility needs, celebrations..."
                      {...register('specialRequests')}
                      style={{ resize: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div
                  className="p-5"
                  style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 24, color: 'var(--color-text-primary)' }}>
                    Personal Information
                  </h2>
                  <div className="row g-4">
                    <div className="col-sm-6">
                      <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input
                          className={`form-input ${errors.firstName ? 'is-invalid' : ''}`}
                          placeholder="John"
                          {...register('firstName', { required: 'First name is required' })}
                          style={{ borderColor: errors.firstName ? '#dc3545' : undefined }}
                        />
                        {errors.firstName && <div style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>{errors.firstName.message}</div>}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="form-group">
                        <label className="form-label">Last Name *</label>
                        <input
                          className={`form-input ${errors.lastName ? 'is-invalid' : ''}`}
                          placeholder="Doe"
                          {...register('lastName', { required: 'Last name is required' })}
                          style={{ borderColor: errors.lastName ? '#dc3545' : undefined }}
                        />
                        {errors.lastName && <div style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>{errors.lastName.message}</div>}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                          type="email"
                          className={`form-input ${errors.email ? 'is-invalid' : ''}`}
                          placeholder="john@example.com"
                          {...register('email', {
                            required: 'Email is required',
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                          })}
                          style={{ borderColor: errors.email ? '#dc3545' : undefined }}
                        />
                        {errors.email && <div style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>{errors.email.message}</div>}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="form-group">
                        <label className="form-label">Phone Number *</label>
                        <input
                          type="tel"
                          className={`form-input ${errors.phone ? 'is-invalid' : ''}`}
                          placeholder="+1 (555) 000-0000"
                          {...register('phone', { required: 'Phone is required' })}
                          style={{ borderColor: errors.phone ? '#dc3545' : undefined }}
                        />
                        {errors.phone && <div style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>{errors.phone.message}</div>}
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Nationality</label>
                        <select className="form-input" {...register('nationality')}>
                          {['United States', 'United Kingdom', 'India', 'Australia', 'Canada', 'Germany', 'France', 'Other'].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Passport Number</label>
                        <input className="form-input" placeholder="Optional — required for international tours" {...register('passport')} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div
                  className="p-5"
                  style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 8, color: 'var(--color-text-primary)' }}>
                    Payment Details
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 28 }}>
                    🔒 Your payment information is encrypted and secure. This is a demo — no real charges will be made.
                  </p>

                  {/* Card type selector */}
                  <div className="d-flex gap-3 mb-5">
                    {['💳 Credit Card', '🏦 Debit Card', '💰 PayPal'].map((method, i) => (
                      <label key={method} style={{ cursor: 'pointer', flex: 1 }}>
                        <input type="radio" name="payMethod" defaultChecked={i === 0} style={{ display: 'none' }} />
                        <div
                          style={{
                            padding: '12px 16px',
                            border: i === 0 ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center',
                            fontSize: 13,
                            fontWeight: 600,
                            background: i === 0 ? 'var(--color-primary-light)' : 'transparent',
                            color: i === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          }}
                        >
                          {method}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="row g-4">
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Cardholder Name *</label>
                        <input
                          className="form-input"
                          placeholder="John M. Doe"
                          {...register('cardName', { required: 'Name on card is required' })}
                          style={{ borderColor: errors.cardName ? '#dc3545' : undefined }}
                        />
                        {errors.cardName && <div style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>{errors.cardName.message}</div>}
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Card Number *</label>
                        <input
                          className="form-input"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          {...register('cardNumber', {
                            required: 'Card number is required',
                            minLength: { value: 16, message: 'Enter valid card number' },
                          })}
                          style={{ borderColor: errors.cardNumber ? '#dc3545' : undefined, letterSpacing: 2 }}
                        />
                        {errors.cardNumber && <div style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>{errors.cardNumber.message}</div>}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="form-group">
                        <label className="form-label">Expiry Date *</label>
                        <input
                          className="form-input"
                          placeholder="MM / YY"
                          {...register('expiry', { required: 'Expiry is required' })}
                          style={{ borderColor: errors.expiry ? '#dc3545' : undefined }}
                        />
                        {errors.expiry && <div style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>{errors.expiry.message}</div>}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="form-group">
                        <label className="form-label">CVV *</label>
                        <input
                          className="form-input"
                          placeholder="•••"
                          maxLength={4}
                          type="password"
                          {...register('cvv', { required: 'CVV is required', minLength: { value: 3, message: 'Invalid CVV' } })}
                          style={{ borderColor: errors.cvv ? '#dc3545' : undefined }}
                        />
                        {errors.cvv && <div style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>{errors.cvv.message}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div
                  className="p-5"
                  style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 24, color: 'var(--color-text-primary)' }}>
                    ✅ Review & Confirm
                  </h2>

                  <div
                    style={{ background: 'var(--color-bg-soft)', borderRadius: 'var(--radius-xl)', padding: 24, border: '1px solid var(--color-border)', marginBottom: 24 }}
                  >
                    <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Booking Summary</h4>
                    {[
                      ['Tour', tour.title],
                      ['Location', tour.location],
                      ['Date', selectedDate || 'Not specified'],
                      ['Duration', `${tour.duration} days`],
                      ['Travelers', `${travelers} people`],
                      ['Price per person', `$${tour.price.toLocaleString()}`],
                      ['Total Amount', `$${totalPrice.toLocaleString()}`],
                    ].map(([label, value]) => (
                      <div key={label} className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid var(--color-border)', fontSize: 14 }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                        <span style={{ fontWeight: 600, color: label === 'Total Amount' ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="form-check mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="termsCheck"
                      required
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <label className="form-check-label" htmlFor="termsCheck" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                      I agree to the{' '}
                      <a href="#" style={{ color: 'var(--color-primary)' }}>Terms & Conditions</a>
                      {' '}and{' '}
                      <a href="#" style={{ color: 'var(--color-primary)' }}>Privacy Policy</a>
                    </label>
                  </div>

                  <button type="submit" className="btn-primary btn-lg w-100">
                    🎉 Confirm Booking — ${totalPrice.toLocaleString()}
                  </button>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="d-flex justify-content-between mt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary"
                  disabled={step === 0}
                  style={{ opacity: step === 0 ? 0.4 : 1 }}
                >
                  ← Previous
                </button>
                {step < STEPS.length - 1 && (
                  <button type="button" onClick={nextStep} className="btn-primary">
                    Next Step →
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Sidebar Summary */}
          <div className="col-lg-4">
            {renderTourSummaryCard()}
          </div>
        </div>
      </div>
    </div>
  );
}
