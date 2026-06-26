'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getStoredAuth, getStoredToken } from '@/utils/api';

const eventTypes = [
  'Destination Wedding',
  'Anniversary Celebration',
  'Birthday Theme Party',
  'Corporate Gala Dinner / Award Night',
  'Private Cocktails / Pre-Wedding Social'
];

const guestRanges = [
  'Micro Event (Under 50 guests)',
  'Boutique Event (50 - 150 guests)',
  'Grand Event (150 - 300 guests)',
  'Mega Event (300+ guests)'
];

const budgetTiers = [
  'Luxury VIP / Elite Tier',
  'Premium Premium / Standard Tier',
  'Boutique / Cost-Sensitive Tier'
];

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

export default function EventsClient() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  // Form states
  const [eventType, setEventType] = useState(eventTypes[0]);
  const [guestCount, setGuestCount] = useState(guestRanges[0]);
  const [eventDate, setEventDate] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState(budgetTiers[0]);

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
    if (!destination || !eventDate) {
      toast.error('Please enter preferred location and event date.');
      return;
    }

    setLoading(true);
    try {
      const eventDetails = [
        `Events & Weddings Inquiry Form Details:`,
        `- Event Type: ${eventType}`,
        `- Expected Guest Count: ${guestCount}`,
        `- Preferred Location/Destination: ${destination}`,
        `- Event Date: ${eventDate}`,
        `- Budget Tier: ${budget}`,
        `- Customer: ${name}`,
        `- Contact: ${phone} | ${email}`,
        notes.trim() ? `- Notes/Requests: ${notes.trim()}` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        pipeline_id: 3,
        name: name || 'Events Landing Page Inquiry',
        email: email || '',
        phone: phone || '',
        source: 'Events Landing Page',
        notes: eventDetails,
        custom_fields: {
          subject: `${eventType} Assistance: ${destination}`,
          message: eventDetails
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

      toast.success('Your event planning request has been received! Our dedicated planner will call or email you within 2 hours.');
      // Reset fields
      setDestination('');
      setEventDate('');
      setNotes('');
    } catch (err) {
      toast.error(err.message || 'Unable to submit inquiry at this time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVenue = (venue) => {
    setDestination(venue.location);
    setEventType('Destination Wedding');
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
                <div className="events-inputs-row">
                  <div className="events-field">
                    <label htmlFor="eventType">Event Category</label>
                    <select id="eventType" value={eventType} onChange={e => setEventType(e.target.value)}>
                      {eventTypes.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="events-field">
                    <label htmlFor="destination">Preferred Destination</label>
                    <input
                      id="destination"
                      type="text"
                      placeholder="e.g. Goa, Udaipur, Bali"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="events-inputs-row">
                  <div className="events-field">
                    <label htmlFor="eventDate">Expected Event Date</label>
                    <input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="events-field">
                    <label htmlFor="guestCount">Guest Attendance</label>
                    <select id="guestCount" value={guestCount} onChange={e => setGuestCount(e.target.value)}>
                      {guestRanges.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="events-field">
                  <label htmlFor="budget">Target Budget Tier</label>
                  <select id="budget" value={budget} onChange={e => setBudget(e.target.value)}>
                    {budgetTiers.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Contact info fields */}
                <div className="events-inputs-row">
                  <div className="events-field">
                    <label htmlFor="evName">Your Name</label>
                    <input id="evName" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="events-field">
                    <label htmlFor="evPhone">Mobile Number</label>
                    <input id="evPhone" type="tel" placeholder="Mobile" value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                </div>

                <div className="events-field">
                  <label htmlFor="evEmail">Email Address</label>
                  <input id="evEmail" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="events-field">
                  <label htmlFor="evNotes">Briefly describe your requirements (Optional)</label>
                  <textarea id="evNotes" rows="2" placeholder="e.g. Royal Rajasthani theme, require catering for 200 guests with Jain cuisines" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <button type="submit" className="events-search-submit" disabled={loading}>
                  {loading ? 'Submitting Planning Request...' : 'Get Event Proposal'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR VENUES */}
      <section className="events-section container">
        <div className="events-section-head text-center">
          <h2>Featured Destination Themes</h2>
          <p>Hand-picked locations offering breathtaking backdrops and world-class celebrations.</p>
        </div>
        <div className="events-grid-deals">
          {popularVenues.map(venue => (
            <article key={venue.id} className="events-deal-card" onClick={() => handleSelectVenue(venue)} style={{ cursor: 'pointer' }}>
              <div className="events-card-body">
                <span className="venue-duration">{venue.duration}</span>
                <h3>{venue.name}</h3>
                <p className="venue-desc">📍 {venue.location}</p>
                <div className="venue-highlight">💐 {venue.highlight}</div>
                <div className="events-price-panel">
                  <div>
                    <small>Packages from</small>
                    <strong>{venue.price}</strong>
                  </div>
                  <span className="btn-select">Select Venue</span>
                </div>
              </div>
            </article>
          ))}
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
          gap: 16px;
        }
        .events-inputs-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          align-items: end;
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
          .events-inputs-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
