import React from 'react';
import TrustedPartners from '@/components/TrustedPartners';
import QuoteButton from '@/components/QuoteButton';
import InsuranceInquiryModal from '@/components/InsuranceInquiryModal';

export const metadata = {
  title: 'Travel Insurance | Secure Your Journey',
  description: 'Comprehensive travel insurance for domestic and international trips. Cover medical emergencies, trip cancellations, lost baggage, and more.',
};

export default function InsurancePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* 1. HERO SECTION */}
      <section style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #3b82f6 100%)', color: 'white', padding: '100px 0 80px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: 1.2, marginBottom: 20, textTransform: 'uppercase' }}>
            Peace of Mind Anywhere
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: 20, lineHeight: 1.2 }}>
            Comprehensive Travel Insurance
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Don't let unforeseen circumstances ruin your hard-earned vacation. Protect yourself against medical emergencies, flight cancellations, and lost baggage with our top-tier insurance policies.
          </p>
          <QuoteButton 
            text="Get a Free Quote" 
            eventName="openInsuranceInquiry"
            className="btn-primary" 
            style={{ padding: '16px 32px', fontSize: 16, fontWeight: 700, borderRadius: 30, border: 'none', background: 'white', color: 'var(--color-primary)', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }} 
          />
        </div>
      </section>

      {/* 2. TRUSTED PARTNERS MARQUEE */}
      <TrustedPartners />

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
