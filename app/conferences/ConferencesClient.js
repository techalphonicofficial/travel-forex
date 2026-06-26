'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getStoredAuth, getStoredToken } from '@/utils/api';

const conferenceCategories = [
  'Corporate Seminar / Training Workshop',
  'Annual General Meeting (AGM)',
  'Executive Leadership Summit',
  'Product Launch / Exhibition',
  'Global Partner Conference / Sales Meet'
];

const paxRanges = [
  'Small Group (Under 50 attendees)',
  'Medium Group (50 - 150 attendees)',
  'Large Group (150 - 300 attendees)',
  'Enterprise Group (300+ attendees)'
];

const hotelPreferences = [
  'Yes - Group rooms + conference hall required',
  'No - Conference venue / hall only',
  'Day Delegate package (no stays)'
];

const standardDestinations = [
  { id: 1, name: 'Metro Corporate Hub Layout', location: 'Mumbai / Delhi NCR Hotels, India', price: '₹ 2,500 / Pax', duration: 'Full Day Package', highlight: 'Boardroom layouts & prime city access' },
  { id: 2, name: 'Tech & Innovation Summit', location: 'Bangalore / Hyderabad Convention Sites', price: '₹ 2,200 / Pax', duration: 'Full Day Package', highlight: 'Advanced hybrid setups & projection halls' },
  { id: 3, name: 'Global Executive Gathering', location: 'Marina Bay Sands / Sentosa, Singapore', price: 'SGD 120 / Pax', duration: '2 Days Delegate', highlight: 'International connectivity & VIP dining' },
  { id: 4, name: 'Quiet Corporate Retreat', location: 'Lonavala / Neemrana Heritage Forts, India', price: '₹ 4,500 / Pax', duration: 'Residential Package', highlight: 'Outbound activities & team building' }
];

const faqs = [
  { q: 'Do you provide corporate billing with GST invoices?', a: 'Yes, absolutely! We provide compliant corporate invoices with proper GST breakdowns to ensure you can claim input tax credits (ITC) for your company event expenses.' },
  { q: 'Can you arrange hybrid video-conferencing and high-speed Wi-Fi?', a: 'Yes. We coordinate with hotel IT support teams and AV vendors to set up high-bandwidth dedicated Wi-Fi, premium camera setups, lapel microphones, and live YouTube/Zoom streaming for hybrid events.' },
  { q: 'Is a dedicated event manager assigned for day-of coordination?', a: 'Yes. Every corporate conference booking is assigned a senior Account Executive who manages local setup, coordinates with decorators, and oversees AV tests and dinner schedules on-site.' },
  { q: 'What is the standard cancellation timeline for large group venue bookings?', a: 'Hotel booking policies vary. Generally, corporate event spaces permit minor amendments up to 30 days prior. Peak season venue bookings (October to March) have stricter cancellation guidelines.' }
];

export default function ConferencesClient() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  // Form states
  const [category, setCategory] = useState(conferenceCategories[0]);
  const [paxCount, setPaxCount] = useState(paxRanges[0]);
  const [prefDate, setPrefDate] = useState('');
  const [location, setLocation] = useState('');
  const [hotelNeeded, setHotelNeeded] = useState(hotelPreferences[0]);

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

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!location || !prefDate) {
      toast.error('Please enter preferred location and event date.');
      return;
    }

    setLoading(true);
    try {
      const confDetails = [
        `Corporate Conference Inquiry Form Details:`,
        `- Event Category: ${category}`,
        `- Expected Pax Count: ${paxCount}`,
        `- Preferred Location/City: ${location}`,
        `- Event Date: ${prefDate}`,
        `- Accommodation Requirement: ${hotelNeeded}`,
        `- Customer: ${name}`,
        `- Contact: ${phone} | ${email}`,
        notes.trim() ? `- Notes/Requests: ${notes.trim()}` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        pipeline_id: 3,
        name: name || 'Conference Landing Page Inquiry',
        email: email || '',
        phone: phone || '',
        source: 'Conferences Landing Page',
        notes: confDetails,
        custom_fields: {
          subject: `${category} Quote: ${location}`,
          message: confDetails
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

      toast.success('Your corporate conference inquiry has been received! Our corporate desk executive will email/call you with a custom proposal shortly.');
      // Reset fields
      setLocation('');
      setPrefDate('');
      setNotes('');
    } catch (err) {
      toast.error(err.message || 'Unable to submit inquiry at this time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVenue = (venue) => {
    setLocation(venue.location.split(',')[0]);
    document.getElementById('conferences-search-widget')?.scrollIntoView({ behavior: 'smooth' });
    toast.success(`Selected corporate package: ${venue.name}`);
  };

  return (
    <main className="conferences-page">
      {/* 1. HERO SECTION */}
      <section className="conferences-hero">
        <div className="container">
          <div className="conferences-hero-grid">
            <div className="conferences-hero-copy">
              <span>🏢 Corporate Meetings & MICE</span>
              <h1>Host World-Class Business <span style={{ color: 'var(--color-secondary)' }}>Events</span></h1>
              <p>Plan AGM meetings, corporate summits, training seminars, and product launches seamlessly. We manage premium hotels, projection halls, logistics, catering, and audio-visual setups globally.</p>
              <div className="conferences-hero-badges">
                <span className="conferences-tag-badge">✔ GST Corporate Invoicing</span>
                <span className="conferences-tag-badge">✔ Hybrid Meeting Tech</span>
                <span className="conferences-tag-badge">✔ Bulk Travel & Hotels</span>
              </div>
            </div>

            {/* SEARCH WIDGET CARD */}
            <div className="conferences-search-card" id="conferences-search-widget">
              <h3 style={{ margin: '0 0 12px', fontWeight: 900, fontSize: 19, color: 'var(--color-primary)' }}>Request Conference Proposal</h3>
              <form onSubmit={handleSearchSubmit} className="conferences-form">
                <div className="conferences-inputs-row">
                  <div className="conferences-field">
                    <label htmlFor="category">Event Category</label>
                    <select id="category" value={category} onChange={e => setCategory(e.target.value)}>
                      {conferenceCategories.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="conferences-field">
                    <label htmlFor="location">Target City / Country</label>
                    <input
                      id="location"
                      type="text"
                      placeholder="e.g. Mumbai, Singapore"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="conferences-inputs-row">
                  <div className="conferences-field">
                    <label htmlFor="prefDate">Expected Event Date</label>
                    <input
                      id="prefDate"
                      type="date"
                      value={prefDate}
                      onChange={e => setPrefDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="conferences-field">
                    <label htmlFor="paxCount">Expected Attendance</label>
                    <select id="paxCount" value={paxCount} onChange={e => setPaxCount(e.target.value)}>
                      {paxRanges.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="conferences-field">
                  <label htmlFor="hotelNeeded">Accommodation Requirement</label>
                  <select id="hotelNeeded" value={hotelNeeded} onChange={e => setHotelNeeded(e.target.value)}>
                    {hotelPreferences.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Contact info fields */}
                <div className="conferences-inputs-row">
                  <div className="conferences-field">
                    <label htmlFor="coName">Your Name</label>
                    <input id="coName" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="conferences-field">
                    <label htmlFor="coPhone">Mobile Number</label>
                    <input id="coPhone" type="tel" placeholder="Mobile" value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                </div>

                <div className="conferences-field">
                  <label htmlFor="coEmail">Corporate Email</label>
                  <input id="coEmail" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="conferences-field">
                  <label htmlFor="coNotes">Briefly describe your requirements (Optional)</label>
                  <textarea id="coNotes" rows="2" placeholder="e.g. Require U-shape boardroom layout, stage backdrop, and lunch buffet for 80 pax" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <button type="submit" className="conferences-search-submit" disabled={loading}>
                  {loading ? 'Submitting Planning Request...' : 'Get Custom Proposal'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR CONFERENCES PACKAGES */}
      <section className="conferences-section container">
        <div className="conferences-section-head text-center">
          <h2>Featured Corporate Packages</h2>
          <p>Streamlined meeting space packages built for maximum productivity and business collaboration.</p>
        </div>
        <div className="conferences-grid-deals">
          {standardDestinations.map(venue => (
            <article key={venue.id} className="conferences-deal-card" onClick={() => handleSelectVenue(venue)} style={{ cursor: 'pointer' }}>
              <div className="conferences-card-body">
                <span className="venue-duration">{venue.duration}</span>
                <h3>{venue.name}</h3>
                <p className="venue-desc">📍 {venue.location}</p>
                <div className="venue-highlight">⚙ {venue.highlight}</div>
                <div className="conferences-price-panel">
                  <div>
                    <small>Rates from</small>
                    <strong>{venue.price}</strong>
                  </div>
                  <span className="btn-select">Select Package</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. KEY FEATURES */}
      <section className="conferences-cabin-section">
        <div className="container">
          <div className="conferences-section-head text-center">
            <h2>Seamless MICE Management</h2>
            <p>Our business logistics coordinators assist you at every stage of the corporate schedule.</p>
          </div>
          <div className="conferences-features-grid">
            <div className="events-feature-box">
              <div className="feature-icon">🎙</div>
              <h3>Premium AV & Staging</h3>
              <p>We supply and set up dual projectors, high-definition LED backdrops, collar microphones, stage podiums, and professional lighting desks.</p>
            </div>
            <div className="events-feature-box">
              <div className="feature-icon">✈</div>
              <h3>Group Flights & Visa Checks</h3>
              <p>Our ticketing advisors handle bulk corporate airline seat reserves and compile fast-track visa checklists for business travel delegates.</p>
            </div>
            <div className="events-feature-box">
              <div className="feature-icon">🛡</div>
              <h3>Dedicated Account Manager</h3>
              <p>Save time with a single coordinator handling food menus, schedule changes, tea/coffee breaks, and custom event branding logistics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQS Accordion */}
      <section className="conferences-section container" style={{ maxWidth: '800px' }}>
        <div className="conferences-section-head text-center">
          <h2>Frequently Asked Questions</h2>
          <p>Helpful advice to make your corporate meeting or summit planning seamless.</p>
        </div>
        <div className="conferences-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaqIndex === idx;
            return (
              <div key={idx} className="conferences-faq-item">
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

      {/* CONFERENCES CSS STYLES */}
      <style jsx global>{`
        .conferences-page {
          background: linear-gradient(135deg, #e0f2fe 0%, #ede9fe 40%, #fce7f3 100%);
          min-height: 100vh;
          color: var(--color-text-primary);
          padding-bottom: 80px;
        }
        .conferences-hero {
          padding: 48px 0 48px;
          background: linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 100%),
                      url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&q=80');
          background-size: cover;
          background-position: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .conferences-hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: center;
        }
        .conferences-hero-copy span {
          color: var(--color-secondary);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .conferences-hero-copy h1 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 900;
          line-height: 1.15;
          margin: 12px 0 20px;
        }
        .conferences-hero-copy p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 540px;
        }
        .conferences-hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        .conferences-tag-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 13.5px;
          font-weight: 700;
          color: white;
        }
        .conferences-search-card {
          background: white;
          border-radius: 20px;
          box-shadow: var(--shadow-xl);
          padding: 28px;
          color: var(--color-text-primary);
        }
        .conferences-form {
          display: grid;
          gap: 16px;
        }
        .conferences-inputs-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          align-items: end;
        }
        .conferences-field {
          display: grid;
          gap: 6px;
        }
        .conferences-field label {
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          color: var(--color-text-secondary);
        }
        .conferences-field select,
        .conferences-field input,
        .conferences-field textarea {
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
        .conferences-field select:focus,
        .conferences-field input:focus,
        .conferences-field textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }
        .conferences-search-submit {
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
        .conferences-search-submit:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }
        .conferences-search-submit:disabled {
          opacity: 0.72;
          cursor: wait;
        }
        
        .conferences-section {
          margin-top: 80px;
        }
        .conferences-section-head {
          margin-bottom: 36px;
        }
        .conferences-section-head.text-center {
          text-align: center;
        }
        .conferences-section-head h2 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: 32px;
          font-weight: 900;
          color: var(--color-text-primary);
          margin: 0;
        }
        .conferences-section-head p {
          color: var(--color-text-secondary);
          font-size: 16px;
          margin-top: 8px;
        }
        
        .conferences-grid-deals {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .conferences-deal-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .conferences-deal-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
        }
        .conferences-card-body {
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
        .conferences-card-body h3 {
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
        .conferences-price-panel {
          border-top: 1px dashed #e2e8f0;
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .conferences-price-panel small {
          display: block;
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .conferences-price-panel strong {
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
        .conferences-deal-card:hover .btn-select {
          background: var(--color-primary);
          color: white;
        }
        
        .conferences-cabin-section {
          background: white;
          padding: 80px 0;
          margin-top: 80px;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }
        .conferences-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 40px;
        }
        .conferences-feature-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px;
        }
        .conferences-feature-box h3 {
          font-size: 18px;
          font-weight: 850;
          color: var(--color-text-primary);
          margin-bottom: 10px;
        }
        .conferences-feature-box p {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.55;
        }
        
        .conferences-faq-list {
          display: grid;
          gap: 12px;
          margin-top: 40px;
        }
        .conferences-faq-item {
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
          .conferences-hero {
            padding: 36px 0 32px;
          }
          .conferences-hero-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .conferences-features-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .conferences-inputs-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
