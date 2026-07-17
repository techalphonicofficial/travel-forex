'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getStoredAuth, getStoredToken, getMediaUrl } from '@/utils/api';

const getInputType = (fieldType) => {
  const typeMap = { phone: 'tel', mobile: 'tel', integer: 'number', decimal: 'number', datetime: 'datetime-local' };
  const supportedTypes = ['text', 'email', 'tel', 'number', 'date', 'datetime-local', 'url', 'time'];
  const normalizedType = typeMap[fieldType] || fieldType;
  return supportedTypes.includes(normalizedType) ? normalizedType : 'text';
};

const baseFieldKeys = ['name', 'email', 'phone'];

const getFormPayload = (formElement, fields, pipelineId) => {
  const data = new FormData(formElement);
  const payload = {
    pipeline_id: pipelineId || 7,
    name: '',
    email: '',
    phone: '',
    source: 'Cruise Landing Page',
    notes: '',
    custom_fields: {},
  };

  fields.forEach((field) => {
    const value = field.fieldType === 'multiselect'
      ? data.getAll(field.fieldKey).filter(Boolean)
      : data.get(field.fieldKey);
    const normalizedValue = field.fieldType === 'checkbox' ? Boolean(value) : value;

    if (field.fieldKey === 'name' || field.fieldKey === 'full_name' || field.fieldKey === 'first_name') {
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

function CruiseDynamicField({ field, defaultValue }) {
  const isTextarea = field.fieldType === 'textarea';
  const isSelect = field.fieldType === 'select';
  const isMultiSelect = field.fieldType === 'multiselect';
  const isWideField = isTextarea || field.fieldKey.includes('requests') || field.fieldKey.includes('message');
  const requiredMark = field.isRequired ? ' *' : '';
  const commonProps = {
    id: field.fieldKey,
    name: field.fieldKey,
    required: field.isRequired,
    defaultValue: defaultValue || '',
  };

  return (
    <div className={`cruise-field ${isWideField ? 'full-width' : ''}`}>
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

const cruiseDestinations = [
  'Singapore, Malaysia & Thailand',
  'India Coast (Mumbai, Goa, Lakshadweep)',
  'Bahamas & Caribbean',
  'Mediterranean Europe',
  'Dubai & Arabian Gulf',
  'Alaska & North America'
];

const cruiseMonths = [
  'July 2026', 'August 2026', 'September 2026', 'October 2026',
  'November 2026', 'December 2026', 'January 2027', 'February 2027'
];

const cruiseLines = [
  'All Cruise Lines',
  'Cordelia Cruises',
  'Royal Caribbean International',
  'Costa Cruises',
  'Norwegian Cruise Line',
  'Celebrity Cruises'
];

const featuredCruises = [
  {
    id: 1,
    title: 'Vibrant Singapore-Malaysia Ocean Escape',
    line: 'Royal Caribbean - Anthem of the Seas',
    destination: 'Singapore, Malaysia & Thailand',
    duration: '4 Nights / 5 Days',
    price: '₹ 42,500',
    image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=80&auto=format&fit=crop',
    highlights: ['All-inclusive Meals', 'Broadway Shows', 'Indoor Skydiving', 'Surf Simulator']
  },
  {
    id: 2,
    title: 'Indian Ocean Magic: Mumbai-Goa-Lakshadweep',
    line: 'Cordelia Cruises - Empress',
    destination: 'India Coast (Mumbai, Goa, Lakshadweep)',
    duration: '5 Nights / 6 Days',
    price: '₹ 38,900',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80&auto=format&fit=crop',
    highlights: ['Casino & Nightclub', 'Sundowner Deck Parties', 'Indian & Jain Buffets', 'Kids Play Zone']
  },
  {
    id: 3,
    title: 'Mediterranean Highlights: Spain, France & Italy',
    line: 'Costa Cruises - Costa Toscana',
    destination: 'Mediterranean Europe',
    duration: '7 Nights / 8 Days',
    price: '₹ 84,600',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=80&auto=format&fit=crop',
    highlights: ['Colosseum Spa', 'Sorento Cooking School', 'Water Park', '11 Passenger Bars']
  },
  {
    id: 4,
    title: 'Dubai & Arabian Gulf Luxury Sailing',
    line: 'Costa Cruises - Costa Deliziosa',
    destination: 'Dubai & Arabian Gulf',
    duration: '5 Nights / 6 Days',
    price: '₹ 46,200',
    image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=600&q=80&auto=format&fit=crop',
    highlights: ['Arabian Nights Parties', 'Duty Free Shopping', 'Wellness Spas', 'Rooftop Cinema']
  }
];

const cabinTypes = [
  {
    name: 'Inside Cabin',
    desc: 'Affordable, cozy rooms equipped with all standard cruise amenities, ideal for travelers who spend most of their time on deck.',
    price: 'Best Value',
    features: ['2 Twin Beds / Queen Bed', 'En-suite Bathroom', 'Standard LCD TV', '24/7 Room Service']
  },
  {
    name: 'Oceanview Cabin',
    desc: 'Features a large picture window or porthole offering scenic marine views and morning natural sunlight in your room.',
    price: 'Popular Choice',
    features: ['Scenic Window View', 'Dedicated Sitting Area', 'Plush Linens', 'Mini Bar fridge']
  },
  {
    name: 'Balcony Cabin',
    desc: 'Features a private walk-out veranda with chairs and a table. Breathe in the fresh ocean air directly from your room.',
    price: 'Highly Recommended',
    features: ['Private Ocean Balcony', 'Outdoor Sitting Set', 'Spacious Closet space', 'Priority boarding']
  },
  {
    name: 'Luxury Suite',
    desc: 'The ultimate VIP cruise layout. Separate living rooms, private hot tubs, premium dining access, and dedicated butler service.',
    price: 'Premium Luxury',
    features: ['Butler Service', 'VIP Lounge Access', 'Private Jacuzzi Balcony', 'Pillow Menu']
  }
];

const faqs = [
  { q: 'Is food included in the cruise package cost?', a: 'Yes! Standard cruise bookings include unlimited meals at the main dining rooms, buffets, and poolside cafes. Specialty restaurants, alcoholic drinks, and canned sodas are generally billed extra on your cruise card.' },
  { q: 'Do I need a passport or visa for domestic cruises starting from India?', a: 'For cruises traveling within Indian territorial waters (like Mumbai to Goa or Lakshadweep), an official government photo ID (Aadhaar or Passport) is required. If the cruise visits international waters or ports, a valid Passport (and destination Visas) is mandatory.' },
  { q: 'What is a Cruise Card or Cruise SeaPass?', a: 'It is a personal card issued at check-in that serves as your room key, shipboard ID, and cashless payment card for all onboard purchases (spa, drinks, shops). It is linked to your credit card or cash deposit at the start of travel.' },
  { q: 'Are there activities for kids and teenagers on cruises?', a: 'Absolutely! Premium cruise liners offer complimentary supervised kids clubs (segmented by age groups), arcade zones, youth lounges, water slides, and daily family game shows.' }
];

export default function CruiseClient({ pageData, formConfig }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [activeCabinTab, setActiveCabinTab] = useState(0);

  const fields = useMemo(() => (formConfig?.fields?.length ? formConfig.fields : []), [formConfig]);

  const heroSection = pageData?.details?.find(d => d.section === 'image_text' || d.key === 'hero_key');
  const heroData = heroSection?.json_data || {};

  const cabinSection = pageData?.details?.find(d => d.section === 'tabs_section' || d.key === 'cabin_key');
  const cabinData = cabinSection?.json_data || {};
  const dynamicCabinTabs = cabinData.tabs || cabinTypes.map(c => ({
    badge: c.name,
    content: `
      <div class="cabin-badge-price">${c.price}</div>
      <h3>${c.name}</h3>
      <p>${c.desc}</p>
      <h4>CABIN INCLUSIONS:</h4>
      <ul>
        ${c.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    `,
    img: ''
  }));

  const ultimateSection = pageData?.details?.find(d => d.section === 'stats_bar' || d.key === 'ultimate_vacation_key');
  const ultimateData = ultimateSection?.json_data || {};
  const dynamicStats = ultimateData.stats || [
    { value: 'Direct Cabin Bookings', label: '<p>We work directly with major liners...</p>' },
    { value: 'Free Cabin Upgrades', label: '<p>Early-bird bookers receive complimentary ocean view upgrades...</p>' },
    { value: 'Onboard Credit Allowances', label: '<p>Receive up to USD 100 in onboard credit...</p>' }
  ];

  const faqSection = pageData?.details?.find(d => d.section === 'faq_accordion' || d.key === 'faq_key');
  const faqData = faqSection?.json_data || {};
  const dynamicFaqs = faqData.faqs || faqs;

  useEffect(() => {
    const token = getStoredToken();
    setIsLoggedIn(Boolean(token));
    const auth = getStoredAuth();
    setCurrentUser(auth);
  }, []);

  const handleSearchSubmit = async (e) => {
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
        throw new Error(resData?.message || 'Failed to submit cruise inquiry.');
      }

      toast.success('Your Cruise booking request has been submitted! Our cruise consultant will contact you within 2 hours with available cabin deals.');
      form.reset();
    } catch (err) {
      toast.error(err.message || 'Unable to process inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCruise = (cruise) => {
    setDestination(cruise.destination);
    setDuration(cruise.duration);
    setCruiseLine(cruise.line.split(' - ')[0]);
    document.getElementById('cruise-search-widget')?.scrollIntoView({ behavior: 'smooth' });
    toast.success(`Selected cruise package: ${cruise.title}`);
  };

  const parseCabinContent = (html) => {
    if (!html) return '';
    let p = html;
    p = p.replace(/<p>\s*<strong>(?!Cabin Inclusions|✦)(.{1,40})<\/strong>\s*<\/p>/i, '<div class="cabin-badge-price">$1</div>');
    p = p.replace(/<p>\s*<strong>(Cabin Inclusions:?)<\/strong>\s*<\/p>/gi, '<h4>$1</h4>');
    p = p.replace(/<p>\s*<strong>[✦*\\-•]\s*(.*?)<\/strong>\s*<\/p>/gi, '<li>$1</li>');
    if (p.includes('<li>')) {
      p = p.replace(/(<li>[\s\S]*<\/li>)/i, '<ul>$1</ul>');
    }
    return p;
  };

  return (
    <main className="cruise-page">
      {/* 1. HERO SECTION */}
      <section className="cruise-hero" style={heroData.media_url ? { backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 100%), url('${getMediaUrl(heroData.media_url)}')` } : {}}>
        <div className="container">
          <div className="cruise-hero-grid">
            <div className="cruise-hero-copy">
              <span>{pageData?.meta_title || '🛳 Premium Ocean Journeys'}</span>
              <h1>{heroData.heading_content || 'Sail Away Into Paradise'}</h1>
              <p>{heroData.body || "Discover unmatched cruise packages on the world's most luxurious liners. Enjoy fine multi-cuisine dining, Broadway-style deck entertainment, and exciting shore excursions, all included in your package."}</p>
              <div className="cruise-hero-badges">
                {(heroData.points || [{ title: '★ All-Inclusive Meals' }, { title: '★ Kid-Friendly Lounges' }, { title: '★ Dedicated Deck Support' }]).map((pt, idx) => (
                  <span key={idx} className="cruise-tag-badge">{pt.title}</span>
                ))}
              </div>
            </div>

            {/* CRUISE SEARCH WIDGET */}
            <div className="cruise-search-card" id="cruise-search-widget">
              <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 20, color: 'var(--color-primary)' }}>Find Your Ideal Cruise</h3>
              <form onSubmit={handleSearchSubmit} className="cruise-form">
                {fields.length > 0 ? (
                  fields.map(field => (
                    <CruiseDynamicField
                      key={field.id || field.fieldKey}
                      field={field}
                      defaultValue={currentUser ? currentUser[field.fieldKey] || '' : ''}
                    />
                  ))
                ) : (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.7 }}>Form is unavailable right now.</p>
                )}

                <button type="submit" className="cruise-search-submit" disabled={loading} style={{ gridColumn: '1 / -1' }}>
                  {loading ? 'Sending Booking Request...' : 'Get Cruise Quote'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CABIN CATEGORIES */}
      <section className="cruise-cabin-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Our Cabin Categories</h2>
            <p>Choose the perfect accommodation for your journey</p>
          </div>

          <div className="cabin-tabs-wrapper">
            <div className="cabin-tabs">
              {dynamicCabinTabs.map((c, idx) => (
                <button 
                  key={idx}
                  className={`cabin-tab-btn ${activeCabinTab === idx ? 'active' : ''}`}
                  onClick={() => setActiveCabinTab(idx)}
                >
                  {c.badge}
                </button>
              ))}
            </div>

            <div className="cabin-display-card">
              <div 
                className="cabin-display-copy dynamic-html-content"
                dangerouslySetInnerHTML={{ __html: parseCabinContent(dynamicCabinTabs[activeCabinTab]?.content) }}
              />
              <div className="cabin-display-visual">
                <img
                  src={getMediaUrl(dynamicCabinTabs[activeCabinTab]?.img || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80')}
                  alt={dynamicCabinTabs[activeCabinTab]?.badge || 'Cabin'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY BOOK CRUISES WITH US */}
      <section className="cruise-section container">
        <div className="cruise-section-head text-center">
          <h2>{ultimateSection?.title || 'The Ultimate Cruise Vacation'}</h2>
          <p>{ultimateData.block_desc || 'Book with our specialized cruise experts to guarantee a memorable sailing voyage.'}</p>
        </div>
        <div className="cruise-features-grid">
          {dynamicStats.map((stat, idx) => (
            <div key={idx} className="cruise-feature-box">
              <div className="feature-icon">⚓</div>
              <h3>{stat.value}</h3>
              <div dangerouslySetInnerHTML={{ __html: stat.label || '' }} />
            </div>
          ))}
        </div>
      </section>

      {/* 5. FAQS Accordion */}
      <section className="cruise-section container" style={{ maxWidth: '800px' }}>
        <div className="cruise-section-head text-center">
          <h2>{faqSection?.title || 'Frequently Asked Questions'}</h2>
          <p>{faqData.heading_content || 'Helpful advice to make your cruise holiday hassle-free.'}</p>
        </div>
        <div className="cruise-faq-list">
          {dynamicFaqs.map((faq, idx) => {
            const isOpen = activeFaqIndex === idx;
            return (
              <div key={idx} className="cruise-faq-item">
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

      {/* CRUISE CSS STYLES */}
      <style jsx global>{`
        .cruise-page {
          background: linear-gradient(135deg, #e0f2fe 0%, #ede9fe 40%, #fce7f3 100%);
          min-height: 100vh;
          color: var(--color-text-primary);
          padding-bottom: 80px;
        }
        .cruise-hero {
          padding: 48px 0 48px;
          background: linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 100%),
                      url('https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1920&q=80');
          background-size: cover;
          background-position: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .cruise-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 40px;
          align-items: center;
        }
        .cruise-hero-copy span {
          color: var(--color-secondary);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .cruise-hero-copy h1 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 900;
          line-height: 1.15;
          margin: 12px 0 20px;
        }
        .cruise-hero-copy p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 540px;
        }
        .cruise-hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        .cruise-tag-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 13.5px;
          font-weight: 700;
          color: white;
        }
        .cruise-search-card {
          background: white;
          border-radius: 20px;
          box-shadow: var(--shadow-xl);
          padding: 28px;
          color: var(--color-text-primary);
        }
        .cruise-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 12px;
        }
        .cruise-field.full-width {
          grid-column: 1 / -1;
        }
        .cruise-field {
          display: grid;
          gap: 6px;
        }
        .cruise-field label {
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          color: var(--color-text-secondary);
        }
        .cruise-field select,
        .cruise-field input,
        .cruise-field textarea {
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
        .cruise-field select:focus,
        .cruise-field input:focus,
        .cruise-field textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }
        .cruise-search-submit {
          background: var(--gradient-primary);
          color: white;
          font-weight: 900;
          font-size: 15px;
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          box-shadow: 0 8px 24px rgba(2, 110, 181, 0.22);
          margin-top: 8px;
        }
        .cruise-search-submit:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }
        .cruise-search-submit:disabled {
          opacity: 0.72;
          cursor: wait;
        }
        
        .cruise-section {
          margin-top: 80px;
        }
        .cruise-section-head {
          margin-bottom: 36px;
        }
        .cruise-section-head.text-center {
          text-align: center;
        }
        .cruise-section-head h2 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: 32px;
          font-weight: 900;
          color: var(--color-text-primary);
          margin: 0;
        }
        .cruise-section-head p {
          color: var(--color-text-secondary);
          font-size: 16px;
          margin-top: 8px;
        }
        
        .cruise-grid-deals {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .cruise-deal-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .cruise-card-img-wrap {
          position: relative;
        }
        .cruise-card-img-wrap span {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          color: white;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
        }
        .cruise-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .cruise-card-body h3 {
          font-size: 17px;
          font-weight: 850;
          color: var(--color-text-primary);
          line-height: 1.35;
          margin: 0 0 6px;
        }
        .cruise-liner-info {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-primary);
        }
        .cruise-highlights {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 16px 0;
          flex-grow: 1;
        }
        .highlight-pill {
          background: #f1f5f9;
          color: #334155;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 99px;
        }
        .cruise-price-panel {
          border-top: 1px dashed #e2e8f0;
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cruise-price-panel small {
          display: block;
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .cruise-price-panel strong {
          font-size: 20px;
          font-weight: 900;
          color: #10b981;
        }
        .cruise-price-panel span {
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .btn-cruise-select {
          background: var(--color-primary);
          color: white;
          font-weight: 800;
          font-size: 13px;
          border-radius: 8px;
          padding: 8px 16px;
          cursor: pointer;
        }
        
        .cruise-cabin-section {
          background: white;
          padding: 80px 0;
          margin-top: 80px;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }
        .cabin-tabs-wrapper {
          margin-top: 40px;
        }
        .cabin-tabs {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .cabin-tab-btn {
          padding: 10px 24px;
          border-radius: 99px;
          font-size: 14px;
          font-weight: 800;
          color: var(--color-text-secondary);
          background: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cabin-tab-btn.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
        .cabin-display-card {
          display: grid;
          grid-template-columns: 1fr 1.7fr;
          gap: 40px;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          align-items: stretch;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        .cabin-badge-price {
          display: inline-block;
          background: #e0f2fe;
          color: #0284c7;
          font-size: 10.5px;
          font-weight: 850;
          padding: 4px 10px;
          border-radius: 99px;
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
          align-self: flex-start;
          width: fit-content;
        }
        .cabin-display-copy {
          padding: 12px 0 12px 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .dynamic-html-content h1, 
        .dynamic-html-content h2, 
        .dynamic-html-content h3 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: 24px;
          font-weight: 900;
          margin: 0 0 16px;
          color: #0f172a;
          line-height: 1.2;
        }
        .dynamic-html-content p {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .dynamic-html-content h4 {
          font-size: 11.5px;
          font-weight: 900;
          margin: 0 0 16px;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dynamic-html-content ul {
          padding-left: 0;
          margin: 0;
          list-style: none;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 24px;
        }
        .dynamic-html-content ul li {
          position: relative;
          padding-left: 16px;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          line-height: 1.4;
        }
        .dynamic-html-content ul li::before {
          content: '✦';
          position: absolute;
          left: 0;
          top: 0;
          color: #475569;
          font-size: 12px;
        }
        .dynamic-html-content strong {
          color: #0f172a;
          font-weight: 800;
        }
        .cabin-display-visual {
          width: 100%;
          height: 100%;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
        }
        .cabin-display-visual img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          inset: 0;
        }
        @media (max-width: 991px) {
          .cabin-display-card {
            grid-template-columns: 1fr;
            padding: 16px;
          }
          .cabin-display-visual {
            min-height: 250px;
            order: -1;
          }
          .cabin-display-copy {
            padding: 8px 0 0 0;
          }
        }
        
        .cruise-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .cruise-feature-box {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 28px;
          box-shadow: var(--shadow-sm);
        }
        .cruise-feature-box h3 {
          font-size: 18px;
          font-weight: 850;
          color: var(--color-text-primary);
          margin-bottom: 10px;
        }
        .cruise-feature-box p {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.55;
        }
        
        .cruise-faq-list {
          display: grid;
          gap: 12px;
        }
        .cruise-faq-item {
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
          .cruise-hero {
            padding: 36px 0 32px;
          }
          .cruise-hero-grid {
            grid-template-columns: 1fr;
            gap: 35px;
          }
          .cabin-display-card {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .cabin-display-visual {
            height: 220px;
          }
          .cruise-features-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .cruise-inputs-row {
            grid-template-columns: 1fr;
          }
          .cabin-amenities-list ul {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
