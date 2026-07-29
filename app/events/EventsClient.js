'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getStoredAuth, getStoredToken } from '@/utils/api';

import { useMemo } from 'react';

const getInputType = (fieldType) => {
  const typeMap = { phone: 'tel', mobile: 'tel', integer: 'number', decimal: 'number', datetime: 'datetime-local' };
  const supportedTypes = ['text', 'email', 'tel', 'number', 'date', 'datetime-local', 'url', 'time'];
  const normalizedType = typeMap[fieldType] || fieldType;
  return supportedTypes.includes(normalizedType) ? normalizedType : 'text';
};

const getFormPayload = (formElement, fields, pipelineId) => {
  const data = new FormData(formElement);
  const payload = {
    pipeline_id: pipelineId || 11,
    name: '',
    email: '',
    phone: '',
    source: 'Events Landing Page',
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

function EventsDynamicField({ field, defaultValue }) {
  const isTextarea = field.fieldType === 'textarea' || field.fieldKey.includes('describe');
  const isSelect = field.fieldType === 'select';
  const isMultiSelect = field.fieldType === 'multiselect';
  const isWideField = isTextarea || field.fieldKey.includes('notes') || (field.fieldKey.includes('address') && !field.fieldKey.includes('email')) || field.fieldKey.includes('request');
  const requiredMark = field.isRequired ? ' *' : '';
  const commonProps = {
    id: field.fieldKey,
    name: field.fieldKey,
    required: field.isRequired,
    defaultValue: defaultValue || '',
  };

  return (
    <div className={`events-field ${isWideField ? 'full-width' : ''}`} style={isWideField ? { gridColumn: '1 / -1' } : {}}>
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

const popularVenues = [
  { id: 1, name: 'Sun-Kissed Beach Wedding', location: 'Goa Coastline, India', price: '₹ 15,00,000+', duration: '3 Days Celebration', highlight: 'Seaside mandap & sunset sunset cocktails' },
  { id: 2, name: 'Palace Heritage Grandeur', location: 'Udaipur / Jaipur Palace, Rajasthan', price: '₹ 25,00,000+', duration: '3 Days Celebration', highlight: 'Royal entrance & vintage heritage theme' },
  { id: 3, name: 'Tropical Island Ceremony', location: 'Bali, Indonesia', price: '₹ 18,00,000+', duration: '4 Days Celebration', highlight: 'Cliffside vistas & beachside gala dining' },
  { id: 4, name: 'Luxury Hill Station Retreat', location: 'Shimla / Mussoorie Heights, India', price: '₹ 12,00,000+', duration: '2 Days Celebration', highlight: 'Mist-wrapped pine forests & bonfire theme' }
];

const faqs = [
  { q: 'Can you organize destination weddings outside India?', a: 'Yes! We have dedicated destination wedding support departments for major international hubs like Bali, Thailand (Phuket/Krabi), Dubai, and Turkey (Antalya). Our services cover flight bookings, venue coordination, local caterers, and visa assistance.' },
  { q: 'What services are included in your wedding planning package?', a: 'Our end-to-end planning cover venue negotiation, catering menu customizations, theme decor setups, photographer/videographer curation, sound & light licenses, guest hospitality (RSVP lists, airport transfers), and on-day execution coordination.' },
  { q: 'Can I bring my own external vendors for catering or photography?', a: 'Yes, absolutely! While we have pre-vetted premium vendor lists that offer discount options, we are fully flexible to collaborate with external chefs, artists, or photographers selected by your family.' },
  { q: 'What is the standard payment layout and cancellation timeline?', a: 'To reserve venues and lock decorators, we require an initial advance booking deposit (usually 25%). Balance payments are structured in installments leading up to the event date. Venue refund policies vary depending on terms and seasons.' }
];

export default function EventsClient({ formConfig }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  const fields = useMemo(() => {
    if (!formConfig?.fields?.length) return [];
    return formConfig.fields.map(field => {
      if (['phone', 'mobile_number', 'contact_number'].includes(field.fieldKey || field.field_key) || field.id === 'base_phone') {
        return { ...field, is_required: true, isRequired: true };
      }
      return field;
    });
  }, [formConfig]);

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

      toast.success('Your event planning request has been received! Our dedicated planner will contact you shortly.');
      form.reset();
    } catch (err) {
      toast.error(err.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVenue = (venue) => {
    const destEl = document.getElementById('preferred_destination');
    const catEl = document.getElementById('event_category');
    if (destEl) destEl.value = venue.location;
    if (catEl) catEl.value = 'Destination Wedding';
    document.getElementById('events-search-widget')?.scrollIntoView({ behavior: 'smooth' });
    toast.success(`Selected theme venue: ${venue.name}`);
  };

  return (
    <main className="events-page">
      {/* 1. HERO SECTION */}
      <section className="events-hero">
        <div className="container">
          <div className="events-hero-grid">
            <div className="events-hero-copy">
              <span>💍 Destination Weddings & Celebrations</span>
              <h1>Create Unforgettable <span style={{ color: 'var(--color-secondary)' }}>Moments</span></h1>
              <p>Host destination weddings, anniversary galas, and bespoke parties in stunning venues globally. We handle decorators, luxury hotel bookings, transfers, and gourmet cuisines to turn your dreams into reality.</p>
              <div className="events-hero-badges">
                <span className="events-tag-badge">✔ Elite Decor Designers</span>
                <span className="events-tag-badge">✔ Hospitality Managers</span>
                <span className="events-tag-badge">✔ Curated Guest Experiences</span>
              </div>
            </div>

            {/* SEARCH WIDGET CARD */}
            <div className="events-search-card" id="events-search-widget">
              <h3 style={{ margin: '0 0 12px', fontWeight: 900, fontSize: 19, color: 'var(--color-primary)' }}>Request Event Consultation</h3>
              <form onSubmit={handleSearchSubmit} className="events-form">
                {fields.length > 0 ? (
                  fields.map(field => (
                    <EventsDynamicField
                      key={field.id || field.fieldKey}
                      field={field}
                      defaultValue={currentUser ? currentUser[field.fieldKey] || '' : ''}
                    />
                  ))
                ) : (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.7 }}>Form is unavailable right now.</p>
                )}

                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <button type="submit" className="events-search-submit" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Submitting Planning Request...' : 'Get Event Proposal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>



      {/* 3. KEY FEATURES */}
      <section className="events-cabin-section">
        <div className="container">
          <div className="events-section-head text-center">
            <h2>Seamless Celebration Planning</h2>
            <p>Our complete event management systems handle all logistics, letting you enjoy the day.</p>
          </div>
          <div className="events-features-grid">
            <div className="events-feature-box">
              <div className="feature-icon">🏨</div>
              <h3>Discount Group Bookings</h3>
              <p>We leverage hotel partner relationships to book bulk rooms at rates significantly lower than booking platforms, keeping group travel affordable.</p>
            </div>
            <div className="events-feature-box">
              <div className="feature-icon">✨</div>
              <h3>Premium Themes & Decor</h3>
              <p>From sunset beach lights and boho setups to royal palace floral arches, our design teams customize decor templates to match your family vision.</p>
            </div>
            <div className="events-feature-box">
              <div className="feature-icon">🍽</div>
              <h3>Gourmet Dining Curation</h3>
              <p>Work with renowned catering groups offering multi-cuisine menus (Punjabi, South Indian, Continental, Jain, and Halal) with strict quality checks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQS Accordion */}
      <section className="events-section container" style={{ maxWidth: '800px' }}>
        <div className="events-section-head text-center">
          <h2>Frequently Asked Questions</h2>
          <p>Helpful advice to make your wedding or event planning stress-free.</p>
        </div>
        <div className="events-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaqIndex === idx;
            return (
              <div key={idx} className="events-faq-item">
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

      {/* EVENTS CSS STYLES */}
      <style jsx global>{`
        .events-page {
          background: linear-gradient(135deg, #e0f2fe 0%, #ede9fe 40%, #fce7f3 100%);
          min-height: 100vh;
          color: var(--color-text-primary);
          padding-bottom: 80px;
        }
        .events-hero {
          padding: 48px 0 48px;
          background: linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 100%),
                      url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80');
          background-size: cover;
          background-position: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .events-hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: center;
        }
        .events-hero-copy span {
          color: var(--color-secondary);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .events-hero-copy h1 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 900;
          line-height: 1.15;
          margin: 12px 0 20px;
        }
        .events-hero-copy p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 540px;
        }
        .events-hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        .events-tag-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 13.5px;
          font-weight: 700;
          color: white;
        }
        .events-search-card {
          background: white;
          border-radius: 20px;
          box-shadow: var(--shadow-xl);
          padding: 28px;
          color: var(--color-text-primary);
        }
        .events-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 12px;
        }
        .events-field {
          display: grid;
          gap: 6px;
        }
        .events-field label {
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          color: var(--color-text-secondary);
        }
        .events-field select,
        .events-field input,
        .events-field textarea {
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
        .events-field select:focus,
        .events-field input:focus,
        .events-field textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }
        .events-search-submit {
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
        .events-search-submit:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }
        .events-search-submit:disabled {
          opacity: 0.72;
          cursor: wait;
        }
        
        .events-section {
          margin-top: 80px;
        }
        .events-section-head {
          margin-bottom: 36px;
        }
        .events-section-head.text-center {
          text-align: center;
        }
        .events-section-head h2 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: 32px;
          font-weight: 900;
          color: var(--color-text-primary);
          margin: 0;
        }
        .events-section-head p {
          color: var(--color-text-secondary);
          font-size: 16px;
          margin-top: 8px;
        }
        
        .events-grid-deals {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .events-deal-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .events-deal-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
        }
        .events-card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          position: relative;
        }
        .venue-duration {
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
        .events-card-body h3 {
          font-size: 18px;
          font-weight: 850;
          color: var(--color-text-primary);
          line-height: 1.35;
          margin: 0 0 6px;
          padding-right: 70px;
        }
        .venue-desc {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          margin-bottom: 12px;
        }
        .venue-highlight {
          font-size: 12.5px;
          font-weight: 700;
          color: #059669;
          margin-bottom: 20px;
          background: #ecfdf5;
          padding: 4px 10px;
          border-radius: 6px;
          width: fit-content;
        }
        .events-price-panel {
          border-top: 1px dashed #e2e8f0;
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .events-price-panel small {
          display: block;
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .events-price-panel strong {
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
        .events-deal-card:hover .btn-select {
          background: var(--color-primary);
          color: white;
        }
        
        .events-cabin-section {
          background: white;
          padding: 80px 0;
          margin-top: 80px;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }
        .events-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 40px;
        }
        .events-feature-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px;
        }
        .events-feature-box h3 {
          font-size: 18px;
          font-weight: 850;
          color: var(--color-text-primary);
          margin-bottom: 10px;
        }
        .events-feature-box p {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.55;
        }
        
        .events-faq-list {
          display: grid;
          gap: 12px;
          margin-top: 40px;
        }
        .events-faq-item {
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
          .events-hero {
            padding: 36px 0 32px;
          }
          .events-hero-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .events-features-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .events-form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
