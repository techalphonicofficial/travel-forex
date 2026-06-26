'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getStoredAuth, getStoredToken } from '@/utils/api';

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

export default function CruiseClient() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [activeCabinTab, setActiveCabinTab] = useState(0);

  // Search fields
  const [destination, setDestination] = useState(cruiseDestinations[0]);
  const [travelMonth, setTravelMonth] = useState(cruiseMonths[0]);
  const [duration, setDuration] = useState('3-5 Nights');
  const [cruiseLine, setCruiseLine] = useState(cruiseLines[0]);

  // Contact fields
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

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cruiseDetails = [
        `Cruise Booking Inquiry Details:`,
        `- Destination: ${destination}`,
        `- Expected Travel Month: ${travelMonth}`,
        `- Duration Preference: ${duration}`,
        `- Cruise Line Preference: ${cruiseLine}`,
        `- Cabin Selected: ${cabinTypes[activeCabinTab].name}`,
        `- Customer: ${name}`,
        `- Contact: ${phone} | ${email}`,
        notes.trim() ? `- Notes/Special Requests: ${notes.trim()}` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        pipeline_id: 3,
        name: name || 'Cruise Inquiry',
        email: email || '',
        phone: phone || '',
        source: 'Cruise Landing Page',
        notes: cruiseDetails,
        custom_fields: {
          subject: `Cruise Booking: ${destination}`,
          message: cruiseDetails
        }
      };

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
      setNotes('');
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

  return (
    <main className="cruise-page">
      {/* 1. HERO SECTION */}
      <section className="cruise-hero">
        <div className="container">
          <div className="cruise-hero-grid">
            <div className="cruise-hero-copy">
              <span>🛳 Premium Ocean Journeys</span>
              <h1>Sail Away Into <span style={{ color: 'var(--color-secondary)' }}>Paradise</span></h1>
              <p>Discover unmatched cruise packages on the world's most luxurious liners. Enjoy fine multi-cuisine dining, Broadway-style deck entertainment, and exciting shore excursions, all included in your package.</p>
              <div className="cruise-hero-badges">
                <span className="cruise-tag-badge">★ All-Inclusive Meals</span>
                <span className="cruise-tag-badge">★ Kid-Friendly Lounges</span>
                <span className="cruise-tag-badge">★ Dedicated Deck Support</span>
              </div>
            </div>

            {/* CRUISE SEARCH WIDGET */}
            <div className="cruise-search-card" id="cruise-search-widget">
              <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 20, color: 'var(--color-primary)' }}>Find Your Ideal Cruise</h3>
              <form onSubmit={handleSearchSubmit} className="cruise-form">
                <div className="cruise-field">
                  <label htmlFor="cDest">Destination</label>
                  <select id="cDest" value={destination} onChange={e => setDestination(e.target.value)}>
                    {cruiseDestinations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="cruise-inputs-row">
                  <div className="cruise-field">
                    <label htmlFor="cMonth">Travel Month</label>
                    <select id="cMonth" value={travelMonth} onChange={e => setTravelMonth(e.target.value)}>
                      {cruiseMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="cruise-field">
                    <label htmlFor="cDur">Duration</label>
                    <select id="cDur" value={duration} onChange={e => setDuration(e.target.value)}>
                      <option value="2-3 Nights">2 - 3 Nights</option>
                      <option value="4-5 Nights">4 - 5 Nights</option>
                      <option value="6-8 Nights">6 - 8 Nights</option>
                      <option value="9+ Nights">9+ Nights</option>
                    </select>
                  </div>
                </div>

                <div className="cruise-field">
                  <label htmlFor="cLine">Cruise Line</label>
                  <select id="cLine" value={cruiseLine} onChange={e => setCruiseLine(e.target.value)}>
                    {cruiseLines.map(line => <option key={line} value={line}>{line}</option>)}
                  </select>
                </div>

                <div className="cruise-inputs-row">
                  <div className="cruise-field">
                    <label htmlFor="cName">Your Name</label>
                    <input id="cName" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="cruise-field">
                    <label htmlFor="cPhone">Mobile (+91)</label>
                    <input id="cPhone" type="tel" placeholder="Mobile Number" value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                </div>

                <div className="cruise-field">
                  <label htmlFor="cEmail">Email Address</label>
                  <input id="cEmail" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="cruise-field">
                  <label htmlFor="cNotes">Special Requests / Cabin Choice Details</label>
                  <textarea id="cNotes" rows="2" placeholder="e.g. Vegetarian meals, connecting cabins for family, celebrating birthday" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <button type="submit" className="cruise-search-submit" disabled={loading}>
                  {loading ? 'Sending Booking Request...' : 'Get Cruise Quote'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CRUISE PACKAGES */}
      <section className="cruise-section container">
        <div className="cruise-section-head">
          <h2>Trending Cruise Packages</h2>
          <p>Hand-picked luxury sailings offering the best cabin deals. Choose an itinerary to begin booking.</p>
        </div>
        <div className="cruise-grid-deals">
          {featuredCruises.map(cruise => (
            <article key={cruise.id} className="cruise-deal-card premium-card">
              <div className="cruise-card-img-wrap">
                <img src={cruise.image} alt={cruise.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <span>{cruise.duration}</span>
              </div>
              <div className="cruise-card-body">
                <h3>{cruise.title}</h3>
                <span className="cruise-liner-info">{cruise.line}</span>
                <div className="cruise-highlights">
                  {cruise.highlights.map((h, i) => <span key={i} className="highlight-pill">{h}</span>)}
                </div>
                <div className="cruise-price-panel">
                  <div>
                    <small>Starting price</small>
                    <strong>{cruise.price}</strong>
                    <span>/person</span>
                  </div>
                  <button type="button" className="btn-cruise-select" onClick={() => handleSelectCruise(cruise)}>
                    Select
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. CABIN SELECTION GUIDE */}
      <section className="cruise-cabin-section">
        <div className="container">
          <div className="cruise-section-head text-center">
            <h2>Select Your Cabin Style</h2>
            <p>Compare our high-quality cabin configurations on deck to fit your lifestyle and comfort.</p>
          </div>

          <div className="cabin-tabs-wrapper">
            <div className="cabin-tabs">
              {cabinTypes.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`cabin-tab-btn ${activeCabinTab === idx ? 'active' : ''}`}
                  onClick={() => setActiveCabinTab(idx)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="cabin-display-card">
              <div className="cabin-display-copy">
                <span className="cabin-badge-price">{cabinTypes[activeCabinTab].price}</span>
                <h3>{cabinTypes[activeCabinTab].name}</h3>
                <p>{cabinTypes[activeCabinTab].desc}</p>
                <div className="cabin-amenities-list">
                  <strong>Cabin Inclusions:</strong>
                  <ul>
                    {cabinTypes[activeCabinTab].features.map((f, i) => <li key={i}>✦ {f}</li>)}
                  </ul>
                </div>
              </div>
              <div className="cabin-display-visual">
                <img
                  src={
                    activeCabinTab === 0
                      ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80' // inside/hotel
                      : activeCabinTab === 1
                      ? 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&q=80' // oceanview
                      : activeCabinTab === 2
                      ? 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=500&q=80' // balcony
                      : 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&q=80' // suite
                  }
                  alt={cabinTypes[activeCabinTab].name}
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
          <h2>The Ultimate Cruise Vacation</h2>
          <p>Book with our specialized cruise experts to guarantee a memorable sailing voyage.</p>
        </div>
        <div className="cruise-features-grid">
          <div className="cruise-feature-box">
            <div className="feature-icon">⚓</div>
            <h3>Direct Cabin Bookings</h3>
            <p>We work directly with major liners to reserve optimal mid-ship cabin locations with reduced noise levels, avoiding less desirable bottom deck cabins.</p>
          </div>
          <div className="cruise-feature-box">
            <div className="feature-icon">🍹</div>
            <h3>Free Cabin Upgrades</h3>
            <p>Early-bird bookers receive complimentary ocean view upgrades or free balcony passes on select sailings (subject to availability).</p>
          </div>
          <div className="cruise-feature-box">
            <div className="feature-icon">🎭</div>
            <h3>Onboard Credit Allowances</h3>
            <p>Receive up to USD 100 in onboard credit allowances per room, eligible for spa bookings, specialty dining, and onboard shopping.</p>
          </div>
        </div>
      </section>

      {/* 5. FAQS Accordion */}
      <section className="cruise-section container" style={{ maxWidth: '800px' }}>
        <div className="cruise-section-head text-center">
          <h2>Frequently Asked Questions</h2>
          <p>Helpful advice to make your cruise holiday hassle-free.</p>
        </div>
        <div className="cruise-faq-list">
          {faqs.map((faq, idx) => {
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
          padding: 140px 0 60px;
          background: linear-gradient(135deg, #022340 0%, #054c73 100%);
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
          gap: 16px;
        }
        .cruise-inputs-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
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
          grid-template-columns: 1fr 1.2fr;
          gap: 40px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          align-items: center;
        }
        .cabin-badge-price {
          background: #e0f2fe;
          color: #0369a1;
          font-size: 11px;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 99px;
          text-transform: uppercase;
        }
        .cabin-display-copy h3 {
          font-size: 24px;
          font-weight: 900;
          margin: 12px 0 16px;
        }
        .cabin-display-copy p {
          color: var(--color-text-secondary);
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .cabin-amenities-list strong {
          display: block;
          font-size: 13px;
          font-weight: 850;
          color: var(--color-text-secondary);
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .cabin-amenities-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .cabin-amenities-list li {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--color-text-secondary);
        }
        .cabin-display-visual {
          height: 280px;
          position: relative;
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
        
        @media (max-width: 991px) {
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
