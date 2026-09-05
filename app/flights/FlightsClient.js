'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getMediaUrl, getStoredAuth, getStoredToken } from '@/utils/api';
import TrustedPartners from '@/components/TrustedPartners';
import './flights.css';

const getInputType = (fieldType) => {
  const typeMap = { phone: 'tel', mobile: 'tel', integer: 'number', decimal: 'number', datetime: 'datetime-local' };
  const supportedTypes = ['text', 'email', 'tel', 'number', 'date', 'datetime-local', 'url', 'time'];
  const normalizedType = typeMap[fieldType] || fieldType;
  return supportedTypes.includes(normalizedType) ? normalizedType : 'text';
};

const getFormPayload = (formElement, fields, pipelineId) => {
  const data = new FormData(formElement);
  const payload = {
    pipeline_id: pipelineId || 8,
    name: '',
    email: '',
    phone: '',
    source: 'Flight Landing Page',
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

function FlightsDynamicField({ field, defaultValue }) {
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
    <div className={`flights-field ${isWideField ? 'full-width' : ''}`}>
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

const popularRoutes = [
  { id: 1, from: 'Delhi (DEL)', to: 'Bali (DPS)', price: '₹ 28,500', duration: '7h 15m', airline: 'VietJet Air', type: 'Direct/1-Stop' },
  { id: 2, from: 'Mumbai (BOM)', to: 'Dubai (DXB)', price: '₹ 19,800', duration: '3h 30m', airline: 'Emirates', type: 'Direct' },
  { id: 3, from: 'Bangalore (BLR)', to: 'Singapore (SIN)', price: '₹ 22,400', duration: '4h 45m', airline: 'Singapore Airlines', type: 'Direct' },
  { id: 4, from: 'Delhi (DEL)', to: 'London (LHR)', price: '₹ 54,900', duration: '9h 20m', airline: 'Air India', type: 'Direct' },
  { id: 5, from: 'Mumbai (BOM)', to: 'Phuket (HKT)', price: '₹ 23,200', duration: '4h 10m', airline: 'IndiGo', type: 'Direct' },
  { id: 6, from: 'Delhi (DEL)', to: 'Paris (CDG)', price: '₹ 58,600', duration: '9h 40m', airline: 'Air France', type: 'Direct' }
];

const airlinePartners = [
  { name: 'Air India', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Air_India_Logo_2023.svg' },
  { name: 'IndiGo', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/IndiGo_logo.svg/320px-IndiGo_logo.svg.png' },
  { name: 'Emirates', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg' },
  { name: 'Singapore Airlines', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Singapore_Airlines_Logo.svg/200px-Singapore_Airlines_Logo.svg.png' },
  { name: 'Qatar Airways', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Qatar_Airways_Logo.svg/320px-Qatar_Airways_Logo.svg.png' },
  { name: 'Lufthansa', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lufthansa_Logo_2018.svg' }
];

const faqs = [
  { q: 'How early should I book flight tickets for the best price?', a: 'For international flights, it is recommended to book 45–60 days in advance. For domestic travels, 14–21 days prior to departure generally yields the best discount options.' },
  { q: 'Can I request wheelchair assistance or special meals through your portal?', a: 'Yes, absolutely! You can write your special requests in the query notes section of the inquiry form, and our ticketing executives will add them to your reservation.' },
  { q: 'What is the baggage allowance for international flights?', a: 'Baggage allowance varies by airline and class. Generally, economy class permits 1 piece of check-in baggage (up to 23 kg or 30 kg depending on carrier) and 7 kg cabin baggage. This will be specified in your flight quote.' },
  { q: 'Are ticket cancellation or rescheduling charges applicable?', a: 'Yes, cancellations and rescheduling are subject to individual airline policies plus a nominal agency processing fee. We recommend selecting flexible fare options if your travel plans are tentative.' }
];

export default function FlightsClient({ roundTripConfig, oneWayConfig, multiCityConfig, pageData }) {

  const heroSection = pageData?.details?.find(d => d.key === 'hero_key');
  const whyBookSection = pageData?.details?.find(d => d.section === 'team_grid' && d.key === 'book-key');
  const faqSection = pageData?.details?.find(d => d.section === 'faq_accordion');
  const partnersSection = pageData?.details?.find(d => d.section === 'team_grid' && d.key === 'our_trusted_partner');

  const partnersTitle = partnersSection?.title || (pageData ? '' : 'Our Trusted Airline Partners');
  const dynamicAirlinePartners = partnersSection?.json_data?.team?.map(p => ({
    name: p.name,
    logo: p.img?.startsWith('http') ? p.img : `https://admin.travel-forex.com${p.img}`
  })) || (pageData ? [] : airlinePartners);

  const heroTitle = heroSection?.title || (pageData ? '' : '✈ Global Airline Tickets');
  const heroHeading = heroSection?.json_data?.heading_content || (pageData ? '' : 'Fly Anywhere, For Less');
  const heroDesc = heroSection?.json_data?.story_desc ?? (pageData ? '' : 'Book international and domestic flight tickets at exclusive discount rates. We compare corporate fares and group discounts to give you lower prices than major travel portals.');
  const heroPoints = heroSection?.json_data?.stats || (pageData ? [] : [{ value: '✔ Zero Booking Fees' }, { value: '✔ Instant Confirmation' }, { value: '✔ 24/7 Ticketing Support' }]);

  const heroBgImage = getMediaUrl(heroSection?.json_data?.media_url || pageData?.feature_image);

  const whyBookTitle = whyBookSection?.title || (pageData ? '' : 'Why Book Flights with Us?');
  const whyBookDesc = whyBookSection?.json_data?.heading_content || (pageData ? '' : 'Experience seamless ticketing and premium post-booking customer assistance.');
  const whyBookPoints = whyBookSection?.json_data?.team || (pageData ? [] : [
    { name: 'Exclusive Corporate Fares', bio: 'Access special contract fares and companion discounts not listed on online booking engines, helping you save up to 15% on tickets.', img: '🛡' },
    { name: 'No Hidden Conveniences Fees', bio: 'Unlike OTA portals that add hefty convenience fees at checkout, our quotation lists clean, final pricing with no surprises.', img: '💼' },
    { name: '24/7 Schedule Monitoring', bio: 'Our helpdesk monitors flights round the clock to immediately support you with alternative routes, rescheduling, or refunds in case of airline delays.', img: '📢' }
  ]);

  const faqTitle = faqSection?.title || (pageData ? '' : 'Frequently Asked Questions');
  const faqDesc = faqSection?.json_data?.heading_content || (pageData ? '' : 'Get answers to common flight booking questions.');
  const dynamicFaqs = faqSection?.json_data?.faqs || (pageData ? [] : faqs);

  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [tripType, setTripType] = useState('One-way');

  const activeConfig = useMemo(() => {
    if (tripType === 'Multi-city') return multiCityConfig;
    if (tripType === 'Round-trip') return roundTripConfig;
    return oneWayConfig;
  }, [tripType, oneWayConfig, roundTripConfig, multiCityConfig]);

  const fields = useMemo(() => {
    if (activeConfig?.fields && activeConfig.fields.length > 0) {
      return activeConfig.fields;
    }
    return [
      { id: 'full_name', fieldKey: 'full_name', label: 'Full Name', fieldType: 'text', isRequired: true },
      { id: 'email', fieldKey: 'email', label: 'Email Address', fieldType: 'email', isRequired: false },
      { id: 'phone', fieldKey: 'phone', label: 'Mobile Number', fieldType: 'tel', isRequired: true },
      { id: 'passengers', fieldKey: 'passengers', label: 'No. of Passengers', fieldType: 'number', isRequired: true },
      { id: 'departure_city', fieldKey: 'departure_city', label: 'Departure City', fieldType: 'text', isRequired: true },
      { id: 'destination_city', fieldKey: 'destination_city', label: 'Destination City', fieldType: 'text', isRequired: true },
      { id: 'departure_date', fieldKey: 'departure_date', label: 'Departure Date', fieldType: 'date', isRequired: true },
      ...(tripType === 'One-way' ? [] : [{ id: 'arrival_date', fieldKey: 'arrival_date', label: 'Arrival Date', fieldType: 'date', isRequired: false }]),
      { id: 'fare_type', fieldKey: 'fare_type', label: 'Fare Type', fieldType: 'select', options: [{ label: 'Regular', value: 'Regular' }, { label: 'Student', value: 'Student' }], isRequired: true },
      { id: 'class', fieldKey: 'class', label: 'Class', fieldType: 'select', options: [{ label: 'Economy', value: 'Economy' }, { label: 'Premium Economy', value: 'Premium Economy' }, { label: 'Business', value: 'Business' }, { label: 'First Class', value: 'First Class' }], isRequired: true },
      { id: 'flight_preference', fieldKey: 'flight_preference', label: 'Flight Preference / Special Request', fieldType: 'textarea', isRequired: false },
    ];
  }, [activeConfig, tripType]);

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
      const payload = getFormPayload(form, fields, activeConfig?.id);

      const response = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok || !resData?.success) {
        throw new Error(resData?.message || 'Failed to submit inquiry.');
      }

      toast.success('Your flight inquiry has been sent! Our ticketing desk will contact you shortly.');
      form.reset();
    } catch (err) {
      toast.error(err.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoute = (route) => {
    const fromEl = document.getElementById('departure_city') || document.getElementById('from_city');
    const toEl = document.getElementById('destination_city') || document.getElementById('to_city');
    if (fromEl) fromEl.value = route.from.split(' (')[0];
    if (toEl) toEl.value = route.to.split(' (')[0];
    document.getElementById('flights-search-widget')?.scrollIntoView({ behavior: 'smooth' });
    toast.success(`Selected flight route: ${route.from} to ${route.to}`);
  };

  return (
    <main className="flights-page">
      {/* 1. HERO SECTION */}
      <section
        className="flights-hero"
        style={heroBgImage ? {
          backgroundImage: `url('${heroBgImage}')`,
        } : {}}
      >
        <div className="container">
          <div className="flights-hero-grid">
            <div className="flights-hero-copy">
              {heroTitle && <span>{heroTitle}</span>}
              {heroHeading && (
                <h1>
                  {heroHeading.split(' ').slice(0, -1).join(' ')}{' '}
                  <span style={{ color: 'var(--color-secondary)' }}>
                    {heroHeading.split(' ').slice(-1)[0] || ''}
                  </span>
                </h1>
              )}
              {heroSection?.json_data?.story_desc !== undefined ? (
                <div dangerouslySetInnerHTML={{ __html: heroDesc }} className="flights-hero-desc" />
              ) : (
                <p>{heroDesc}</p>
              )}
              <div className="flights-hero-badges">
                {heroPoints.map((pt, idx) => {
                  let text = (pt.value || pt.title || '').trim();
                  let hasTick = false;

                  if (text.startsWith('✔') || text.startsWith('✓')) {
                    hasTick = true;
                    text = text.substring(1).trim();
                  }

                  return (
                    <span key={idx} className="flights-tag-badge">
                      {hasTick && <span style={{ color: '#fdce2e', marginRight: '4px' }}>{'\u2713'}</span>}
                      {text}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* SEARCH WIDGET CARD */}
            <div className="flights-search-card" id="flights-search-widget">
              {/* Trip type selectors */}
              <div className="flights-trip-toggle">
                {['One-way', 'Round-trip', 'Multi-city'].map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`flights-trip-btn ${tripType === type ? 'active' : ''}`}
                    onClick={() => setTripType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearchSubmit} className="flights-form">
                {fields.length > 0 ? (
                  fields.map(field => (
                    <FlightsDynamicField
                      key={field.id || field.fieldKey}
                      field={field}
                      defaultValue={currentUser ? currentUser[field.fieldKey] || '' : ''}
                    />
                  ))
                ) : (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.7 }}>Form is unavailable right now.</p>
                )}

                <button type="submit" className="flights-search-submit" disabled={loading} style={{ gridColumn: '1 / -1' }}>
                  {loading ? 'Submitting Inquiry...' : `Request ${tripType} Quote`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>


      {/* 3. AIRLINE PARTNERS (REPLACED WITH TRUSTED PARTNERS MARQUEE) */}
      {(partnersSection || !pageData) && (
        <TrustedPartners
          category="airlines"
          customPartners={dynamicAirlinePartners}
          title={partnersTitle}
        />
      )}

      {/* 4. WHY BOOK WITH US */}
      {(whyBookSection || !pageData) && (
        <section className="flights-section container">
          <div className="flights-section-head text-center">
            <h2>{whyBookTitle}</h2>
            <p>{whyBookDesc}</p>
          </div>
          <div className="flights-features-grid">
            {whyBookPoints.map((pt, idx) => {
              const icons = ['🛡', '💼', '📢', '⭐', '✈️'];
              const icon = pt.img || icons[idx % icons.length];
              return (
                <div key={idx} className="flights-feature-box">
                  <div className="feature-icon">{icon}</div>
                  <h3>{pt.name}</h3>
                  <p>{pt.bio}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. FAQS */}
      {(faqSection || !pageData) && (
        <section className="flights-section container" style={{ maxWidth: '800px' }}>
          <div className="flights-section-head text-center">
            <h2>{faqTitle}</h2>
            <p>{faqDesc}</p>
          </div>
          <div className="flights-faq-list">
            {dynamicFaqs.map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div key={idx} className="flights-faq-item">
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
      )}

    </main>
  );
}
