'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getStoredToken } from '@/utils/api';
import TrustedPartners from '@/components/TrustedPartners';
import QuoteButton from '@/components/QuoteButton';
import InsuranceInquiryModal from '@/components/InsuranceInquiryModal';



export default function InsurancePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <main style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* 1. HERO SECTION */}
      <section style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #3b82f6 100%)', color: 'white', padding: '100px 0 80px' }}>
        <div className="container">
          <div className="row align-items-center">

            {/* Left Column: Hero Text */}
            <div className="col-12 col-lg-6 mb-5 mb-lg-0" style={{ textAlign: 'left' }}>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: 1.2, marginBottom: 20, textTransform: 'uppercase' }}>
                Peace of Mind Anywhere
              </span>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: 20, lineHeight: 1.2 }}>
                Comprehensive Travel Insurance
              </h1>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 500, marginBottom: '40px', lineHeight: 1.6 }}>
                Don't let unforeseen circumstances ruin your hard-earned vacation. Protect yourself against medical emergencies, flight cancellations, and lost baggage with our top-tier insurance policies.
              </p>
            </div>

            {/* Right Column: Inline Form */}
            <div className="col-12 col-lg-6">
              <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                padding: '32px',
                color: '#0f172a',
                textAlign: 'left'
              }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '24px' }}>Get Overseas Travel Insurance Quote</h2>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const token = getStoredToken();
                  if (!token) {
                    toast.error('Please login first to continue.');
                    router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                    return;
                  }
                  alert('Inquiry submitted!');
                }}>
                  <div className="row">

                    {/* Destination Country */}
                    <div className="col-12 col-md-6 mb-3">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Destination Country *</label>
                      <input type="text" placeholder="Enter destination country" required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b' }} />
                    </div>

                    {/* Departure Date */}
                    <div className="col-12 col-md-6 mb-3">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Departure Date *</label>
                      <input type="date" required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b' }} />
                    </div>

                    {/* Arrival Date */}
                    <div className="col-12 col-md-6 mb-3">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Arrival Date *</label>
                      <input type="date" required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b' }} />
                    </div>

                    {/* Number of Travelers */}
                    <div className="col-12 col-md-6 mb-3">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Number of Travelers *</label>
                      <select required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b', background: 'white' }}>
                        <option value="">Select Travelers</option>
                        <option value="1">1 Traveler</option>
                        <option value="2">2 Travelers</option>
                        <option value="3">3 Travelers</option>
                        <option value="4">4+ Travelers</option>
                      </select>
                    </div>

                    {/* Traveler Ages */}
                    {/* <div className="col-12 col-md-6 mb-3">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Traveler Ages *</label>
                      <input type="text" placeholder="E.g., 34, 32, 5" required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b' }} />
                    </div> */}

                    {/* Name */}
                    <div className="col-12 col-md-6 mb-3">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Your Name *</label>
                      <input type="text" placeholder="Enter your name" required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b' }} />
                    </div>

                    {/* Mobile Number */}
                    <div className="col-12 col-md-6 mb-3">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Mobile Number *</label>
                      <input type="tel" placeholder="Enter mobile number" required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b' }} />
                    </div>

                    {/* Email */}
                    <div className="col-12 mb-3">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Email Address </label>
                      <input type="email" placeholder="Enter email address" required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b' }} />
                    </div>

                    {/* Special Requests / Medical */}
                    <div className="col-12 mb-3">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Special Request / Pre-existing Medical Conditions</label>
                      <textarea rows="2" placeholder="Enter any conditions or special requests" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b', resize: 'vertical' }}></textarea>
                    </div>

                  </div>

                  <button type="submit" style={{ width: '100%', padding: '16px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#000000'} onMouseLeave={e => e.currentTarget.style.background = '#111827'}>
                    Get Insurance Quote
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUSTED PARTNERS MARQUEE */}
      <TrustedPartners category="insurance" />

      {/* 3. BENEFITS SECTION */}
      <section className="container" style={{ padding: '60px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b' }}>Why You Need Coverage</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 30 }}>
          <div style={{ padding: 30, background: '#f8fafc', borderRadius: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 15 }}>🏥</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Medical Emergencies</h3>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>Coverage for unexpected hospital visits and medical evacuations abroad.</p>
          </div>
          <div style={{ padding: 30, background: '#f8fafc', borderRadius: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 15 }}>✈️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Trip Cancellation</h3>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>Get reimbursed if you need to cancel your trip due to covered unforeseen events.</p>
          </div>
          <div style={{ padding: 30, background: '#f8fafc', borderRadius: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 15 }}>🧳</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Lost Baggage</h3>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>Compensation for lost, stolen, or delayed luggage and personal items.</p>
          </div>
        </div>
      </section>

      <InsuranceInquiryModal />
    </main>
  );
}
