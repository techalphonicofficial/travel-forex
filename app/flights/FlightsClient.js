'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getStoredAuth, getStoredToken } from '@/utils/api';

const cabinClasses = ['Economy', 'Premium Economy', 'Business', 'First'];

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

export default function FlightsClient() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  // Search form fields
  const [tripType, setTripType] = useState('Round-trip');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cabinClass, setCabinClass] = useState('Economy');

  // Contact/Inquiry fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    setIsLoggedIn(Boolean(token));
    const auth = getStoredAuth();
    setCurrentUser(auth);
    if (auth) {
      setName(auth.name || '');
      setEmail(auth.email || '');
      setPhone(auth.phone || '');
    }
  }, []);

  const handleSwapCities = (e) => {
    e.preventDefault();
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!fromCity || !toCity || !departureDate) {
      toast.error('Please fill in departure city, destination city, and departure date.');
      return;
    }
    if (tripType === 'Round-trip' && !returnDate) {
      toast.error('Please specify a return date for your round trip.');
      return;
    }

    setLoading(true);
    try {
      const passengerStr = `${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}`;
      const flightDetails = [
        `Flight Inquiry Form Details:`,
        `- Trip Type: ${tripType}`,
        `- Origin City: ${fromCity}`,
        `- Destination City: ${toCity}`,
        `- Departure Date: ${departureDate}`,
        tripType === 'Round-trip' ? `- Return Date: ${returnDate}` : '',
        `- Passengers: ${passengerStr}`,
        `- Cabin Class: ${cabinClass}`,
        `- Customer: ${name}`,
        `- Contact: ${phone} | ${email}`,
        notes.trim() ? `- Notes/Requests: ${notes.trim()}` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        pipeline_id: 3,
        name: name || 'Flight Landing Page Inquiry',
        email: email || '',
        phone: phone || '',
        source: 'Flight Landing Page',
        notes: flightDetails,
        custom_fields: {
          subject: `Flight Quote: ${fromCity} to ${toCity}`,
          message: flightDetails
        }
      };

      const response = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok || !resData?.success) {
        throw new Error(resData?.message || 'Failed to submit inquiry.');
      }

      toast.success('Your flight inquiry has been sent! Our ticketing desk will email/call you with discount rates within 1 hour.');
      // Reset search/contact fields
      setFromCity('');
      setToCity('');
      setDepartureDate('');
      setReturnDate('');
      setNotes('');
    } catch (err) {
      toast.error(err.message || 'Unable to submit inquiry at this time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoute = (route) => {
    setFromCity(route.from.split(' (')[0]);
    setToCity(route.to.split(' (')[0]);
    document.getElementById('flights-search-widget')?.scrollIntoView({ behavior: 'smooth' });
    toast.success(`Selected flight route: ${route.from} to ${route.to}`);
  };

  return (
    <main className="flights-page">
      {/* 1. HERO SECTION */}
      <section className="flights-hero">
        <div className="container">
          <div className="flights-hero-grid">
            <div className="flights-hero-copy">
              <span>✈ Global Airline Tickets</span>
              <h1>Fly Anywhere, For <span style={{ color: 'var(--color-secondary)' }}>Less</span></h1>
              <p>Book international and domestic flight tickets at exclusive discount rates. We compare corporate fares and group discounts to give you lower prices than major travel portals.</p>
              <div className="flights-hero-badges">
                <span className="flights-tag-badge">✔ Zero Booking Fees</span>
                <span className="flights-tag-badge">✔ Instant Confirmation</span>
                <span className="flights-tag-badge">✔ 24/7 Ticketing Support</span>
              </div>
            </div>

            {/* SEARCH WIDGET CARD */}
            <div className="flights-search-card" id="flights-search-widget">
              {/* Trip type selectors */}
              <div className="flights-trip-toggle">
                {['Round-trip', 'One-way'].map(type => (
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
                {/* Cities Search row */}
                <div className="flights-inputs-row flex-row-cols-3">
                  <div className="flights-field">
                    <label htmlFor="fromCity">From</label>
                    <input
                      id="fromCity"
                      type="text"
                      placeholder="Departure City (e.g. Delhi)"
                      value={fromCity}
                      onChange={e => setFromCity(e.target.value)}
                      required
                    />
                  </div>
                  <button type="button" className="flights-swap-btn" onClick={handleSwapCities} title="Swap Cities">
                    ⇄
                  </button>
                  <div className="flights-field">
                    <label htmlFor="toCity">To</label>
                    <input
                      id="toCity"
                      type="text"
                      placeholder="Destination City (e.g. Bali)"
                      value={toCity}
                      onChange={e => setToCity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Dates & Passengers row */}
                <div className="flights-inputs-row">
                  <div className="flights-field">
                    <label htmlFor="depDate">Departure Date</label>
                    <input
                      id="depDate"
                      type="date"
                      value={departureDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setDepartureDate(e.target.value)}
                      required
                    />
                  </div>
                  {tripType === 'Round-trip' && (
                    <div className="flights-field">
                      <label htmlFor="retDate">Return Date</label>
                      <input
                        id="retDate"
                        type="date"
                        value={returnDate}
                        min={departureDate || new Date().toISOString().split('T')[0]}
                        onChange={e => setReturnDate(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div className="flights-field">
                    <label htmlFor="cabin">Class</label>
                    <select id="cabin" value={cabinClass} onChange={e => setCabinClass(e.target.value)}>
                      {cabinClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Travelers & Contact row */}
                <div className="flights-inputs-row">
                  <div className="flights-field">
                    <label>Travelers</label>
                    <div className="flights-qty-selector">
                      <div className="qty-sub">
                        <span>Adults</span>
                        <select value={adults} onChange={e => setAdults(Number(e.target.value))}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="qty-sub">
                        <span>Children</span>
                        <select value={children} onChange={e => setChildren(Number(e.target.value))}>
                          {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flights-field">
                    <label htmlFor="fName">Contact Name</label>
                    <input id="fName" type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                </div>

                <div className="flights-inputs-row">
                  <div className="flights-field">
                    <label htmlFor="fPhone">Mobile Number</label>
                    <input id="fPhone" type="tel" placeholder="Mobile (+91)" value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                  <div className="flights-field">
                    <label htmlFor="fEmail">Email Address</label>
                    <input id="fEmail" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="flights-field flights-grid-full">
                  <label htmlFor="fNotes">Special Requests / Airline Preference (Optional)</label>
                  <textarea id="fNotes" rows="2" placeholder="e.g. Prefer Direct Flights, Vegetarian meals, Indigo/Emirates airlines" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <button type="submit" className="flights-search-submit" disabled={loading}>
                  {loading ? 'Submitting Inquiry...' : 'Request Flights Quote'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR ROUTE DEALS */}
      <section className="flights-section container">
        <div className="flights-section-head">
          <h2>Trending Flight Deals</h2>
          <p>Book these highly popular routes at special discounted rates. Click a route to prefill your search box.</p>
        </div>
        <div className="flights-grid-deals">
          {popularRoutes.map(route => (
            <article key={route.id} className="flight-deal-card premium-card" onClick={() => handleSelectRoute(route)}>
              <div className="flight-route-info">
                <h3>{route.from} ➔ {route.to}</h3>
                <span className="flight-airline">{route.airline} • {route.type}</span>
              </div>
              <div className="flight-price-action">
                <span className="price-label">Starting from</span>
                <strong className="price-value">{route.price}</strong>
                <span className="duration-label">Avg. Duration {route.duration}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. AIRLINE PARTNERS */}
      <section className="flights-partners-section">
        <div className="container">
          <div className="flights-section-head text-center">
            <h2>Our Partner Airlines</h2>
            <p>We work directly with major domestic and international carriers to secure discount seat blockings.</p>
          </div>
          <div className="airline-logos-grid">
            {airlinePartners.map((airline, idx) => (
              <div key={idx} className="airline-logo-box" title={airline.name}>
                <img src={airline.logo} alt={airline.name} style={{ maxHeight: '42px', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY BOOK WITH US */}
      <section className="flights-section container">
        <div className="flights-section-head text-center">
          <h2>Why Book Flights with Us?</h2>
          <p>Experience seamless ticketing and premium post-booking customer assistance.</p>
        </div>
        <div className="flights-features-grid">
          <div className="flights-feature-box">
            <div className="feature-icon">🛡</div>
            <h3>Exclusive Corporate Fares</h3>
            <p>Access special contract fares and companion discounts not listed on online booking engines, helping you save up to 15% on tickets.</p>
          </div>
          <div className="flights-feature-box">
            <div className="feature-icon">💼</div>
            <h3>No Hidden Conveniences Fees</h3>
            <p>Unlike OTA portals that add hefty convenience fees at checkout, our quotation lists clean, final pricing with no surprises.</p>
          </div>
          <div className="flights-feature-box">
            <div className="feature-icon">📢</div>
            <h3>24/7 Schedule Monitoring</h3>
            <p>Our helpdesk monitors flights round the clock to immediately support you with alternative routes, rescheduling, or refunds in case of airline delays.</p>
          </div>
        </div>
      </section>

      {/* 5. FAQS */}
      <section className="flights-section container" style={{ maxWidth: '800px' }}>
        <div className="flights-section-head text-center">
          <h2>Frequently Asked Questions</h2>
          <p>Get answers to common flight booking questions.</p>
        </div>
        <div className="flights-faq-list">
          {faqs.map((faq, idx) => {
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

      {/* FLIGHT STYLES */}
      <style jsx global>{`
        .flights-page {
          background: linear-gradient(135deg, #e0f2fe 0%, #ede9fe 40%, #fce7f3 100%);
          min-height: 100vh;
          color: var(--color-text-primary);
          padding-bottom: 80px;
        }
        .flights-hero {
          padding: 48px 0 48px;
          background: linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 100%),
                      url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80');
          background-size: cover;
          background-position: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .flights-hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: center;
        }
        .flights-hero-copy span {
          color: var(--color-secondary);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .flights-hero-copy h1 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 900;
          line-height: 1.15;
          margin: 12px 0 20px;
        }
        .flights-hero-copy p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 540px;
        }
        .flights-hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        .flights-tag-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 13.5px;
          font-weight: 700;
          color: white;
        }
        .flights-search-card {
          background: white;
          border-radius: 20px;
          box-shadow: var(--shadow-xl);
          padding: 28px;
          color: var(--color-text-primary);
        }
        .flights-trip-toggle {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 8px;
          margin-bottom: 24px;
          width: fit-content;
        }
        .flights-trip-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          color: var(--color-text-secondary);
        }
        .flights-trip-btn.active {
          background: var(--color-primary);
          color: white;
        }
        .flights-form {
          display: grid;
          gap: 18px;
        }
        .flights-inputs-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          align-items: end;
        }
        .flights-inputs-row.flex-row-cols-3 {
          grid-template-columns: minmax(0, 1fr) 42px minmax(0, 1fr);
        }
        .flights-field {
          display: grid;
          gap: 6px;
        }
        .flights-field label {
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          color: var(--color-text-secondary);
          margin-bottom: 2px;
        }
        .flights-field input,
        .flights-field select,
        .flights-field textarea {
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
        .flights-field input:focus,
        .flights-field select:focus,
        .flights-field textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }
        .flights-qty-selector {
          display: flex;
          gap: 12px;
        }
        .qty-sub {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
        }
        .qty-sub span {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-secondary);
        }
        .qty-sub select {
          min-width: 58px;
        }
        .flights-swap-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: var(--color-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: center;
          margin-bottom: 2px;
          font-size: 16px;
        }
        .flights-grid-full {
          grid-column: 1 / -1;
        }
        .flights-search-submit {
          background: var(--gradient-primary);
          color: white;
          font-weight: 900;
          font-size: 15px;
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          box-shadow: 0 8px 24px rgba(2, 110, 181, 0.22);
        }
        .flights-search-submit:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }
        .flights-search-submit:disabled {
          opacity: 0.72;
          cursor: wait;
        }
        
        .flights-section {
          margin-top: 80px;
        }
        .flights-section-head {
          margin-bottom: 36px;
        }
        .flights-section-head.text-center {
          text-align: center;
        }
        .flights-section-head h2 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: 32px;
          font-weight: 900;
          color: var(--color-text-primary);
          margin: 0;
        }
        .flights-section-head p {
          color: var(--color-text-secondary);
          font-size: 16px;
          margin-top: 8px;
        }
        
        .flights-grid-deals {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 22px;
        }
        .flight-deal-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
        }
        .flight-route-info h3 {
          font-size: 18px;
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 0 0 6px;
        }
        .flight-airline {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
        }
        .flight-price-action {
          display: grid;
          gap: 3px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 12px;
        }
        .price-label, .duration-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }
        .price-value {
          font-size: 22px;
          font-weight: 900;
          color: #10b981;
        }
        
        .flights-partners-section {
          background: white;
          padding: 60px 0;
          margin-top: 80px;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }
        .airline-logos-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 30px;
          align-items: center;
          margin-top: 40px;
        }
        .airline-logo-box {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px;
          filter: grayscale(100%);
          opacity: 0.65;
          transition: filter 0.3s, opacity 0.3s;
        }
        .airline-logo-box:hover {
          filter: grayscale(0);
          opacity: 1;
        }
        
        .flights-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .flights-feature-box {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 28px;
          box-shadow: var(--shadow-sm);
        }
        .feature-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }
        .flights-feature-box h3 {
          font-size: 18px;
          font-weight: 850;
          color: var(--color-text-primary);
          margin-bottom: 10px;
        }
        .flights-feature-box p {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.55;
        }
        
        .flights-faq-list {
          display: grid;
          gap: 12px;
        }
        .flights-faq-item {
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
        }
        .faq-arrow {
          font-size: 10px;
          color: var(--color-text-muted);
          transition: transform 0.2s;
        }
        .faq-answer-panel {
          padding: 0 20px 16px;
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        
        @media (max-width: 991px) {
          .flights-hero {
            padding: 36px 0 32px;
          }
          .flights-hero-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .airline-logos-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .flights-features-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .flights-trip-toggle {
            width: 100%;
          }
          .flights-trip-btn {
            flex: 1;
            text-align: center;
          }
          .flights-inputs-row {
            grid-template-columns: 1fr;
          }
          .flights-inputs-row.flex-row-cols-3 {
            grid-template-columns: 1fr;
          }
          .flights-swap-btn {
            transform: rotate(90deg);
            margin: 6px auto;
          }
          .qty-sub {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          .qty-sub select {
            width: 100%;
          }
          .airline-logos-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </main>
  );
}
