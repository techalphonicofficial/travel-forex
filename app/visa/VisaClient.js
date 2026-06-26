'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getStoredAuth, getStoredToken } from '@/utils/api';

const visaDestinations = [
  { id: 'thailand', name: 'Thailand', price: '₹ 2,500', time: '3-4 Days', docCount: 6, image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&q=80&auto=format&fit=crop', link: '/visa/thailand' },
  { id: 'dubai', name: 'Dubai (UAE)', price: '₹ 6,900', time: '2-3 Days', docCount: 4, image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=400&q=80&auto=format&fit=crop', link: '#inquiry' },
  { id: 'singapore', name: 'Singapore', price: '₹ 2,900', time: '4-5 Days', docCount: 5, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80&auto=format&fit=crop', link: '#inquiry' },
  { id: 'schengen', name: 'Schengen (Europe)', price: '₹ 11,500', time: '10-15 Days', docCount: 9, image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&q=80&auto=format&fit=crop', link: '#inquiry' },
  { id: 'malaysia', name: 'Malaysia', price: '₹ 1,800', time: '2-3 Days', docCount: 4, image: 'https://images.unsplash.com/photo-1595818973612-4cf3cfc23b2e?w=400&q=80&auto=format&fit=crop', link: '#inquiry' },
  { id: 'srilanka', name: 'Sri Lanka', price: '₹ 2,100', time: '1-2 Days', docCount: 3, image: 'https://images.unsplash.com/photo-1546708973-b339540b5162?w=400&q=80&auto=format&fit=crop', link: '#inquiry' }
];

const steps = [
  { num: '01', title: 'Choose Country', desc: 'Select your holiday destination to view exact visa requirements and price.' },
  { num: '02', title: 'Submit Documents', desc: 'Hand over soft-copy scans or let our courier pick up physical documents from your home.' },
  { num: '03', title: 'Application Processed', desc: 'Our visa officers review and file your application at respective VFS/Consulates.' },
  { num: '04', title: 'Visa Delivered', desc: 'Receive your approved E-Visa on email or sticker passport delivered back to your home.' }
];

const faqs = [
  { q: 'What is the difference between an E-Visa and a Sticker Visa?', a: 'An E-Visa (Electronic Visa) is processed digitally and sent via email as a PDF document which you print and carry. A Sticker Visa requires submitting your original physical passport so the consulate can paste the physical visa page inside.' },
  { q: 'Is my visa application fee refundable in case of rejection?', a: 'No, consulates and embassy visa charges are strictly non-refundable once an application is filed. However, our expert document vetting ensures a 99.2% approval success rate, minimizing any rejection risk.' },
  { q: 'Can I apply for a tourist visa if I do not have a confirmed hotel booking?', a: 'Yes, for most tourist visas, dummy reservations or flight schedules are acceptable for submission. Our team can generate these itinerary drafts to attach to your application file.' },
  { q: 'Is an interview mandatory for all visa applications?', a: 'No, most countries (like Thailand, Dubai, Singapore, Malaysia) do not require physical interviews. Interviews are generally mandatory only for Schengen, US, UK, and Canadian visa streams.' }
];

export default function VisaClient() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Contact fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [targetCountry, setTargetCountry] = useState('Thailand');
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

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const visaDetails = [
        `Visa Consultation Inquiry Details:`,
        `- Destination Country: ${targetCountry}`,
        `- Client Name: ${name}`,
        `- Contact: ${phone} | ${email}`,
        notes.trim() ? `- Notes/Requests: ${notes.trim()}` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        pipeline_id: 3,
        name: name || 'Visa Inquiry',
        email: email || '',
        phone: phone || '',
        source: 'Visa Landing Page',
        notes: visaDetails,
        custom_fields: {
          subject: `Visa Assistance: ${targetCountry}`,
          message: visaDetails
        }
      };

      const response = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok || !resData?.success) {
        throw new Error(resData?.message || 'Failed to submit visa inquiry.');
      }

      toast.success('Your Visa inquiry has been submitted! Our visa expert will call you shortly to assist with your document requirements.');
      setNotes('');
    } catch (err) {
      toast.error(err.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCountry = (countryName) => {
    setTargetCountry(countryName);
    document.getElementById('visa-inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
    toast.success(`Selected country for visa details: ${countryName}`);
  };

  const filteredDestinations = visaDestinations.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="visa-page">
      {/* 1. HERO SECTION */}
      <section className="visa-hero">
        <div className="container">
          <div className="visa-hero-grid">
            <div className="visa-hero-copy">
              <span>🖎 Expert Visa Assistance</span>
              <h1>Tourist Visas Made <span style={{ color: 'var(--color-secondary)' }}>Easy</span></h1>
              <p>Apply for international tourist visas with complete peace of mind. Our experienced visa document officers review checklists, draft travel plans, and guide you through consulate submissions to guarantee success.</p>
              <div className="visa-hero-badges">
                <span className="visa-tag-badge">✓ 99% Approval Rate</span>
                <span className="visa-tag-badge">✓ Document Pre-screening</span>
                <span className="visa-tag-badge">✓ Home Pick-up Available</span>
              </div>
            </div>

            {/* QUICK SEARCH WIDGET */}
            <div className="visa-search-card" id="visa-search-widget">
              <h3 style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>Find Visa Requirements</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>Search for your destination country to view fees, documents required, and processing durations.</p>
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="Search Country (e.g. Dubai, Singapore...)"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              {filteredDestinations.length > 0 ? (
                <div className="visa-mini-list">
                  {filteredDestinations.slice(0, 4).map(country => (
                    <div key={country.id} className="visa-mini-row" onClick={() => handleSelectCountry(country.name)}>
                      <strong>{country.name}</strong>
                      <span className="mini-price">{country.price}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>No countries match your search. Submit the inquiry form below for custom visa assistance.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR COUNTRIES GRID */}
      <section className="visa-section container">
        <div className="visa-section-head">
          <h2>Popular Visa Countries</h2>
          <p>Explore popular destinations with streamlined E-Visa or Sticker Visa processing options.</p>
        </div>
        <div className="visa-grid-deals">
          {visaDestinations.map(country => (
            <article key={country.id} className="visa-deal-card premium-card">
              <div className="visa-card-img-wrap">
                <img src={country.image} alt={country.name} style={{ width: '100%', height: '170px', objectFit: 'cover' }} />
                <span>{country.time}</span>
              </div>
              <div className="visa-card-body">
                <h3>{country.name} Visa</h3>
                <div className="visa-details-list">
                  <div className="detail-item"><span>Visa Fee:</span> <strong>{country.price}</strong></div>
                  <div className="detail-item"><span>Checklist:</span> <span>{country.docCount} Required Docs</span></div>
                </div>
                <div className="visa-action-panel">
                  {country.link !== '#inquiry' ? (
                    <Link href={country.link} className="btn-visa-link">
                      View Details
                    </Link>
                  ) : (
                    <button type="button" className="btn-visa-apply" onClick={() => handleSelectCountry(country.name)}>
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. APPLICATION STEPS */}
      <section className="visa-steps-section">
        <div className="container">
          <div className="visa-section-head text-center">
            <h2>Visa Application Process</h2>
            <p>Obtain your international travel visa in 4 simple and secure steps.</p>
          </div>
          <div className="visa-steps-grid">
            {steps.map((step, idx) => (
              <div key={idx} className="visa-step-box">
                <span>{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DOCUMENTS CHECKLIST INFO & FORM ROW */}
      <section className="visa-section container" id="inquiry">
        <div className="row g-5 align-items-center">
          <div className="col-12 col-lg-6">
            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '18px' }}>Standard Documents Checklist</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>While requirements differ slightly based on your destination country, these core documents are required for almost all tourist applications:</p>
            
            <ul className="visa-checklist-ul">
              <li>
                <span className="chk-icon">✔</span>
                <div>
                  <h4>Valid Indian Passport</h4>
                  <p>Must have at least 6 months validity remaining from your return date and 2 blank pages.</p>
                </div>
              </li>
              <li>
                <span className="chk-icon">✔</span>
                <div>
                  <h4>Color Photographs</h4>
                  <p>Recent white-background photos (size usually 3.5cm x 4.5cm or 2in x 2in depending on country).</p>
                </div>
              </li>
              <li>
                <span className="chk-icon">✔</span>
                <div>
                  <h4>Financial Statements</h4>
                  <p>Self-attested bank statement for the last 6 months showing sufficient savings balance.</p>
                </div>
              </li>
              <li>
                <span className="chk-icon">✔</span>
                <div>
                  <h4>Flight & Hotel Itineraries</h4>
                  <p>Confirmed round-trip tickets and hotel voucher sheets confirming stay durations.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* INQUIRY FORM */}
          <div className="col-12 col-lg-6" id="visa-inquiry-form">
            <div className="visa-inquiry-card">
              <h3 style={{ margin: '0 0 8px', fontWeight: 900, fontSize: 22, color: 'var(--color-primary)' }}>Speak to a Visa Expert</h3>
              <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Fill out this form and our senior visa advisor will call you to walk you through documentation and pricing.</p>
              
              <form onSubmit={handleInquirySubmit} className="visa-form">
                <div className="visa-field">
                  <label htmlFor="vDest">Destination Country</label>
                  <select id="vDest" value={targetCountry} onChange={e => setTargetCountry(e.target.value)}>
                    <option value="Thailand">Thailand</option>
                    <option value="Dubai (UAE)">Dubai (UAE)</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Schengen Europe">Schengen Europe</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                  </select>
                </div>

                <div className="visa-inputs-row">
                  <div className="visa-field">
                    <label htmlFor="vName">Your Name</label>
                    <input id="vName" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="visa-field">
                    <label htmlFor="vPhone">Mobile Number</label>
                    <input id="vPhone" type="tel" placeholder="Mobile" value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                </div>

                <div className="visa-field">
                  <label htmlFor="vEmail">Email Address</label>
                  <input id="vEmail" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="visa-field">
                  <label htmlFor="vNotes">Write your query or describe your employment profile (Optional)</label>
                  <textarea id="vNotes" rows="2" placeholder="e.g. Salaried manager, traveling with spouse in October" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <button type="submit" className="visa-search-submit" disabled={loading}>
                  {loading ? 'Submitting Visa Request...' : 'Get Visa Assistance'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQS ACCORDION */}
      <section className="visa-section container" style={{ maxWidth: '800px' }}>
        <div className="visa-section-head text-center">
          <h2>Frequently Asked Questions</h2>
          <p>Get answers to common visa processing questions.</p>
        </div>
        <div className="visa-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaqIndex === idx;
            return (
              <div key={idx} className="visa-faq-item">
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

      {/* VISA PAGE CSS STYLES */}
      <style jsx global>{`
        .visa-page {
          background: linear-gradient(135deg, #e0f2fe 0%, #ede9fe 40%, #fce7f3 100%);
          min-height: 100vh;
          color: var(--color-text-primary);
          padding-bottom: 80px;
        }
        .visa-hero {
          padding: 140px 0 60px;
          background: linear-gradient(135deg, #0f1c2b 0%, #0d3861 100%);
          color: white;
          position: relative;
          overflow: hidden;
        }
        .visa-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 40px;
          align-items: center;
        }
        .visa-hero-copy span {
          color: var(--color-secondary);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .visa-hero-copy h1 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 900;
          line-height: 1.15;
          margin: 12px 0 20px;
        }
        .visa-hero-copy p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 540px;
        }
        .visa-hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        .visa-tag-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 13.5px;
          font-weight: 700;
          color: white;
        }
        .visa-search-card {
          background: white;
          border-radius: 20px;
          box-shadow: var(--shadow-xl);
          padding: 28px;
          color: var(--color-text-primary);
        }
        .visa-mini-list {
          display: grid;
          gap: 8px;
          max-height: 180px;
          overflow-y: auto;
        }
        .visa-mini-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13.5px;
          transition: background 0.2s;
        }
        .visa-mini-row:hover {
          background: var(--color-primary-light);
          border-color: var(--brand-primary-border);
        }
        .mini-price {
          font-weight: 800;
          color: #10b981;
        }
        
        .visa-section {
          margin-top: 80px;
        }
        .visa-section-head {
          margin-bottom: 36px;
        }
        .visa-section-head.text-center {
          text-align: center;
        }
        .visa-section-head h2 {
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: 32px;
          font-weight: 900;
          color: var(--color-text-primary);
          margin: 0;
        }
        .visa-section-head p {
          color: var(--color-text-secondary);
          font-size: 16px;
          margin-top: 8px;
        }
        
        .visa-grid-deals {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .visa-deal-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .visa-card-img-wrap {
          position: relative;
        }
        .visa-card-img-wrap span {
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
        .visa-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .visa-card-body h3 {
          font-size: 18px;
          font-weight: 850;
          color: var(--color-text-primary);
          line-height: 1.3;
          margin: 0 0 12px;
        }
        .visa-details-list {
          display: grid;
          gap: 8px;
          margin-bottom: 20px;
          flex-grow: 1;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          color: var(--color-text-secondary);
          font-weight: 600;
        }
        .detail-item strong {
          color: #10b981;
          font-weight: 800;
        }
        .visa-action-panel {
          border-top: 1px dashed #e2e8f0;
          padding-top: 16px;
        }
        .btn-visa-link,
        .btn-visa-apply {
          width: 100%;
          display: block;
          text-align: center;
          background: var(--color-primary);
          color: white;
          font-weight: 800;
          font-size: 13px;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          text-decoration: none;
        }
        .btn-visa-apply {
          background: #10b981;
          border: none;
        }
        
        .visa-steps-section {
          background: white;
          padding: 80px 0;
          margin-top: 80px;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }
        .visa-steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 40px;
        }
        .visa-step-box {
          position: relative;
          padding: 24px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
        }
        .visa-step-box span {
          font-size: 40px;
          font-weight: 900;
          color: var(--color-primary-light);
          line-height: 1;
          display: block;
          margin-bottom: 12px;
        }
        .visa-step-box h3 {
          font-size: 17px;
          font-weight: 850;
          color: var(--color-text-primary);
          margin-bottom: 10px;
        }
        .visa-step-box p {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          line-height: 1.55;
        }
        
        .visa-checklist-ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 20px;
        }
        .visa-checklist-ul li {
          display: flex;
          gap: 16px;
          align-items: start;
        }
        .chk-icon {
          width: 24px;
          height: 24px;
          background: #e0f2fe;
          color: var(--color-primary);
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 900;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .visa-checklist-ul h4 {
          font-size: 15.5px;
          font-weight: 850;
          color: var(--color-text-primary);
          margin: 0 0 4px;
        }
        .visa-checklist-ul p {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          margin: 0;
        }
        
        .visa-inquiry-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          box-shadow: var(--shadow-lg);
          padding: 32px;
        }
        .visa-form {
          display: grid;
          gap: 16px;
        }
        .visa-inputs-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .visa-field {
          display: grid;
          gap: 6px;
        }
        .visa-field label {
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          color: var(--color-text-secondary);
        }
        .visa-field select,
        .visa-field input,
        .visa-field textarea {
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
        .visa-field select:focus,
        .visa-field input:focus,
        .visa-field textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }
        .visa-search-submit {
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
          border: none;
        }
        .visa-search-submit:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }
        .visa-search-submit:disabled {
          opacity: 0.72;
          cursor: wait;
        }
        
        .visa-faq-list {
          display: grid;
          gap: 12px;
        }
        .visa-faq-item {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          overflow: hidden;
        }
        
        @media (max-width: 991px) {
          .visa-hero-grid {
            grid-template-columns: 1fr;
            gap: 35px;
          }
          .visa-steps-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .visa-inputs-row {
            grid-template-columns: 1fr;
          }
          .visa-steps-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
