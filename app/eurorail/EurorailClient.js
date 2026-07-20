'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getStoredAuth, getStoredToken } from '@/utils/api';

const getInputType = (fieldType) => {
  const typeMap = { phone: 'tel', mobile: 'tel', integer: 'number', decimal: 'number', datetime: 'datetime-local' };
  const supportedTypes = ['text', 'email', 'tel', 'number', 'date', 'datetime-local', 'url', 'time'];
  const normalizedType = typeMap[fieldType] || fieldType;
  return supportedTypes.includes(normalizedType) ? normalizedType : 'text';
};

const getFormPayload = (formElement, fields, pipelineId) => {
  const data = new FormData(formElement);
  const payload = {
    pipeline_id: pipelineId || 10,
    name: '',
    email: '',
    phone: '',
    source: 'Euro Rails Landing Page',
    notes: '',
    custom_fields: {},
  };

  fields.forEach((field) => {
    const value = field.fieldType === 'multiselect'
      ? data.getAll(field.fieldKey).filter(Boolean)
      : data.get(field.fieldKey);
    const normalizedValue = field.fieldType === 'checkbox' ? Boolean(value) : value;

    if (field.fieldKey === 'name' || field.fieldKey === 'full_name' || field.fieldKey === 'first_name' || field.fieldKey === 'your_name_') {
      payload.name = payload.name || normalizedValue || '';
    }
    if (field.fieldKey === 'email' || field.fieldKey === 'email_address') {
      payload.email = payload.email || normalizedValue || '';
    }
    if (field.fieldKey === 'phone' || field.fieldKey === 'mobile_number' || field.fieldKey === 'contact_number') {
      payload.phone = payload.phone || normalizedValue || '';
    }

    if (!String(field.id).startsWith('base_')) {
      payload.custom_fields[field.fieldKey] = normalizedValue;
    }
  });

  payload.notes = fields.map(f => {
    const val = payload.custom_fields[f.fieldKey] || payload[f.fieldKey];
    return val ? `- ${f.label}: ${val}` : null;
  }).filter(Boolean).join('\n');

  return payload;
};

function EurorailDynamicField({ field, defaultValue }) {
  const isTextarea = field.fieldType === 'textarea';
  const isSelect = field.fieldType === 'select';
  const isMultiSelect = field.fieldType === 'multiselect';
  const isWideField = isTextarea || field.fieldKey.includes('notes') || field.fieldKey.includes('address') || field.fieldKey.includes('request');
  const requiredMark = field.isRequired ? ' *' : '';
  const commonProps = {
    id: field.fieldKey,
    name: field.fieldKey,
    required: field.isRequired,
    defaultValue: defaultValue || '',
  };

  return (
    <div className={`eurorail-field ${isWideField ? 'full-width' : ''}`}>
      <label htmlFor={field.fieldKey}>{field.label}{requiredMark}</label>
      {isTextarea ? (
        <textarea {...commonProps} rows="2" placeholder={`Enter ${field.label.toLowerCase()}`} style={{ resize: 'vertical' }} />
      ) : isSelect || isMultiSelect ? (
        <select {...commonProps} multiple={isMultiSelect}>
          {!isMultiSelect && <option value="">Select {field.label}</option>}
          {(field.options || []).map((opt) => {
            const val = typeof opt === 'string' ? opt : (opt.value || opt.id || opt.label);
            const lbl = typeof opt === 'string' ? opt : (opt.label || opt.name || val);
            return <option key={val} value={val}>{lbl}</option>;
          })}
        </select>
      ) : (
        <input {...commonProps} type={getInputType(field.fieldType)} placeholder={`Enter ${field.label.toLowerCase()}`} />
      )}
    </div>
  );
}

const scenicRoutes = [
  { id: 1, route: 'Glacier Express', description: 'Zermatt to St. Moritz, Switzerland', price: '₹ 14,800', duration: '8h 03m', highlight: 'Panoramic Swiss Alps views' },
  { id: 2, route: 'Bernina Express', description: 'Chur (Switzerland) to Tirano (Italy)', price: '₹ 9,500', duration: '4h 13m', highlight: 'Landwasser Viaduct UNESCO site' },
  { id: 3, route: 'Eurostar Direct', description: 'London (UK) to Paris (France)', price: '₹ 6,800', duration: '2h 16m', highlight: 'Channel Tunnel crossing' },
  { id: 4, route: 'Frecciarossa High Speed', description: 'Rome to Milan, Italy', price: '₹ 4,200', duration: '2h 59m', highlight: 'Speeding up to 300 km/h' }
];

const faqs = [
  { q: 'Is it mandatory to book seat reservations with a Eurail Pass?', a: 'Yes, on most high-speed trains (like Eurostar, TGV, Frecciarossa) and overnight night trains, seat reservations are compulsory in addition to your Eurail Pass. Standard regional trains generally do not require advance reservations.' },
  { q: 'What is the difference between Continuous and Flexi Passes?', a: 'A Continuous Pass lets you travel every day within its validity period (e.g. 15 days straight). A Flexi Pass gives you a specific number of travel days to use within a larger window (e.g. 7 days within 1 month).' },
  { q: 'Are children eligible for free rail passes in Europe?', a: 'Yes, children under 4 years travel for free. Children aged 4 to 11 can get a free Child Pass when accompanied by an adult holding an Adult Pass (limit of 2 children per adult).' },
  { q: 'Can I cancel or refund my point-to-point train tickets?', a: 'Points-to-point ticket refundability depends on the fare class (e.g. Super Economy, Economy, Base). Base fares are usually modifiable or refundable up to departure, whereas promo/economy fares are non-refundable.' }
];

export default function EurorailClient({ formConfig }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  const fields = useMemo(() => (formConfig?.fields?.length ? formConfig.fields : []), [formConfig]);

  useEffect(() => {
    const token = getStoredToken();
    setIsLoggedIn(Boolean(token));
    const auth = getStoredAuth();
    setCurrentUser(auth);
  }, []);

  const handleSearchSubmit = async (e) => {
    const token = getStoredToken();
    if (!token) {
      toast.error('Please login first to continue.');
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);

    try {
      const payload = getFormPayload(form, fields, formConfig?.id);

      const response = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok || !resData?.success) {
        throw new Error(resData?.message || 'Failed to submit inquiry.');
      }

      toast.success('Your European train inquiry has been received! Our rail desk will contact you shortly.');
      form.reset();
    } catch (err) {
      toast.error(err.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoute = (route) => {
    const parts = route.description.split(' to ');
    let from = '', to = '';
    if (parts.length === 2) {
      from = parts[0];
      to = parts[1];
    } else {
      from = route.route;
      to = route.description;
    }
    const fromEl = document.getElementById('departure_city');
    const toEl = document.getElementById('destination_city');
    if (fromEl) fromEl.value = from;
    if (toEl) toEl.value = to;
    document.getElementById('eurorail-search-widget')?.scrollIntoView({ behavior: 'smooth' });
    toast.success(`Selected route: ${route.route}`);
  };

  return (
    <main className="eurorail-page">
      {/* 1. HERO SECTION */}
      <section className="eurorail-hero">
        <div className="container">
          <div className="eurorail-hero-grid">
            <div className="eurorail-hero-copy">
              <span>🚆 European Rail Networks</span>
              <h1>Explore Europe, By <span style={{ color: 'var(--color-secondary)' }}>Train</span></h1>
              <p>Book passes and point-to-point tickets for high-speed networks across Europe. Travel scenic routes, cross borders seamlessly, and enjoy the comfort of Eurostar, TGV, and Swiss panoramic trains.</p>
              <div className="eurorail-hero-badges">
                <span className="eurorail-tag-badge">✔ Best Pass Pricing</span>
                <span className="eurorail-tag-badge">✔ Direct Rail Passes</span>
                <span className="eurorail-tag-badge">✔ Borderless Travel</span>
              </div>
            </div>

            {/* SEARCH WIDGET CARD */}
            <div className="eurorail-search-card" id="eurorail-search-widget">
              <h3 style={{ margin: '0 0 12px', fontWeight: 900, fontSize: 19, color: 'var(--color-primary)' }}>Find Rail Passes & Tickets</h3>
              <form onSubmit={handleSearchSubmit} className="eurorail-form">
                {fields.length > 0 ? (
                  fields.map(field => (
                    <EurorailDynamicField
                      key={field.id || field.fieldKey}
                      field={field}
                      defaultValue={currentUser ? currentUser[field.fieldKey] || '' : ''}
                    />
                  ))
                ) : (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.7 }}>Form is unavailable right now.</p>
                )}

                <button type="submit" className="eurorail-search-submit" disabled={loading} style={{ gridColumn: '1 / -1' }}>
                  {loading ? 'Submitting Request...' : 'Get Rail Quote & Book'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>



      {/* 3. KEY FEATURES */}
      <section className="eurorail-cabin-section">
        <div className="container">
          <div className="eurorail-section-head text-center">
            <h2>Why Book Rails with Us?</h2>
            <p>We make navigating European train systems simple, secure, and cost-effective.</p>
          </div>
          <div className="eurorail-features-grid">
            <div className="eurorail-feature-box">
              <div className="feature-icon">🇪🇺</div>
              <h3>Borderless Passes</h3>
              <p>Get Eurail passes delivered directly to your mobile app or doorstep. Visit up to 33 European countries with a single unified travel document.</p>
            </div>
            <div className="eurorail-feature-box">
              <div className="feature-icon">🛋</div>
              <h3>Guaranteed Seat Bookings</h3>
              <p>Consulates and rail networks require seat reservations on peak high-speed trains. Our ticketing experts secure reservations months in advance.</p>
            </div>
            <div className="eurorail-feature-box">
              <div className="feature-icon">🛡</div>
              <h3>24/7 Helpline Assistance</h3>
              <p>Missed a connection or encountered a train cancellation? Our round-the-clock support desk assists you with re-routings and replacement tickets instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQS Accordion */}
      <section className="eurorail-section container" style={{ maxWidth: '800px' }}>
        <div className="eurorail-section-head text-center">
          <h2>Frequently Asked Questions</h2>
          <p>Helpful advice to make your rail holiday hassle-free.</p>
        </div>
        <div className="eurorail-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaqIndex === idx;
            return (
              <div key={idx} className="eurorail-faq-item">
                <button type="button" className="faq-question-btn" onClick={() => setActiveFaqIndex(isOpen ? null : idx)}>
                  <span>{faq.q}</span>
                  <span className="faq-arrow" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                </button>
                {isOpen && (
                  <div className="faq-answer-panel">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* EURORAIL CSS STYLES */}
      <style jsx global>{`
        .eurorail-page {
          background: linear-gradient(135deg, #e0f2fe 0%, #ede9fe 40%, #fce7f3 100%);
          min-height: 100vh;
          color: var(--color-text-primary);
          padding-bottom: 80px;
        }
        .eurorail-hero {
          padding: 48px 0 48px;
          background: linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 100%),
                      url('https://images.unsplash.com/photo-1541423408854-5df73dbb6e90?w=1920&q=80');
          background-size: cover;
          background-position: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .eurorail-hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: center;
        }
        .eurorail-hero-copy span {
          color: var(--color-secondary);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .eurorail-hero-copy h1 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 900;
          line-height: 1.15;
          margin: 12px 0 20px;
        }
        .eurorail-hero-copy p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 540px;
        }
        .eurorail-hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        .eurorail-tag-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 13.5px;
          font-weight: 700;
          color: white;
        }
        .eurorail-search-card {
          background: white;
          border-radius: 20px;
          box-shadow: var(--shadow-xl);
          padding: 28px;
          color: var(--color-text-primary);
        }
        .eurorail-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 12px;
        }
        .eurorail-field.full-width {
          grid-column: 1 / -1;
        }
        .eurorail-field {
          display: grid;
          gap: 6px;
        }
        .eurorail-field label {
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          color: var(--color-text-secondary);
        }
        .eurorail-field select,
        .eurorail-field input,
        .eurorail-field textarea {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          color: var(--color-text-primary);
          font-size: 14px;
          font-weight: 600;
          padding: 10px 14px;
          outline: none;
          min-height: 42px;
        }
        .eurorail-field select:focus,
        .eurorail-field input:focus,
        .eurorail-field textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }
        .eurorail-search-submit {
          background: var(--gradient-primary);
          color: white;
          font-weight: 900;
          font-size: 15px;
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          box-shadow: 0 8px 24px rgba(2, 110, 181, 0.22);
          border: none;
        }
        .eurorail-search-submit:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }
        .eurorail-search-submit:disabled {
          opacity: 0.72;
          cursor: wait;
        }
        
        .eurorail-section {
          margin-top: 80px;
        }
        .eurorail-section-head {
          margin-bottom: 36px;
        }
        .eurorail-section-head.text-center {
          text-align: center;
        }
        .eurorail-section-head h2 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: 32px;
          font-weight: 900;
          color: var(--color-text-primary);
          margin: 0;
        }
        .eurorail-section-head p {
          color: var(--color-text-secondary);
          font-size: 16px;
          margin-top: 8px;
        }
        
        .eurorail-grid-deals {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .eurorail-deal-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .eurorail-deal-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
        }
        .eurorail-card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          position: relative;
        }
        .route-duration {
          position: absolute;
          top: 24px;
          right: 24px;
          background: var(--color-primary-light);
          color: var(--color-primary);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
        }
        .eurorail-card-body h3 {
          font-size: 18px;
          font-weight: 850;
          color: var(--color-text-primary);
          line-height: 1.35;
          margin: 0 0 6px;
          padding-right: 70px;
        }
        .route-desc {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          margin-bottom: 12px;
        }
        .route-highlight {
          font-size: 12.5px;
          font-weight: 700;
          color: #059669;
          margin-bottom: 20px;
          background: #ecfdf5;
          padding: 4px 10px;
          border-radius: 6px;
          width: fit-content;
        }
        .eurorail-price-panel {
          border-top: 1px dashed #e2e8f0;
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .eurorail-price-panel small {
          display: block;
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .eurorail-price-panel strong {
          font-size: 20px;
          font-weight: 900;
          color: #10b981;
        }
        .btn-select {
          background: var(--color-primary-light);
          color: var(--color-primary);
          border: 1px solid var(--brand-primary-border);
          font-weight: 800;
          font-size: 12px;
          border-radius: 8px;
          padding: 6px 12px;
          transition: all 0.2s;
        }
        .eurorail-deal-card:hover .btn-select {
          background: var(--color-primary);
          color: white;
        }
        
        .eurorail-cabin-section {
          background: white;
          padding: 80px 0;
          margin-top: 80px;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }
        .eurorail-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 40px;
        }
        .eurorail-feature-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px;
        }
        .feature-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }
        .eurorail-feature-box h3 {
          font-size: 18px;
          font-weight: 850;
          color: var(--color-text-primary);
          margin-bottom: 10px;
        }
        .eurorail-feature-box p {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.55;
        }
        
        .eurorail-faq-list {
          display: grid;
          gap: 12px;
          margin-top: 40px;
        }
        .eurorail-faq-item {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          overflow: hidden;
        }
        .faq-question-btn {
          width: 100%;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 15px;
          font-weight: 800;
          color: var(--color-text-primary);
          text-align: left;
          cursor: pointer;
          background: none;
          border: none;
          transition: background 0.2s;
        }
        .faq-question-btn:hover {
          background: #f8fafc;
        }
        .faq-arrow {
          font-size: 10px;
          color: var(--color-text-muted);
          transition: transform 0.2s;
        }
        .faq-answer-panel {
          padding: 16px 20px 20px;
          font-size: 14.5px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          border-top: 1px solid #f1f5f9;
        }
        
        @media (max-width: 991px) {
          .eurorail-hero {
            padding: 36px 0 32px;
          }
          .eurorail-hero-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .eurorail-features-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .eurorail-form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
