'use client';

import React from 'react';
import Link from 'next/link';

export default function VisaPage() {
  return (


    <div className="bg-white min-h-screen">
      <div style={{ background: 'linear-gradient(135deg, #1f2937, #111827, #0f172a)', position: 'relative', overflow: 'hidden' }}>
        {/* <Navbar /> */}
        <div style={{ padding: '80px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 48, fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
            Thailand Visa For Indians
          </h1>
          <p style={{ color: '#93c5fd', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Navigate through our extensive collection of hand-crafted global destinations and tour packages.
          </p>
        </div>
      </div>
      {/* ── Breadcrumbs ── */}
      <div className="container py-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0" style={{ fontSize: '13px' }}>
            <li className="breadcrumb-item"><Link href="/" className="text-decoration-none text-muted">Home</Link></li>
            <li className="breadcrumb-item"><Link href="/visa" className="text-decoration-none text-muted">Visa</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Thailand Visa For Indians</li>
          </ol>
        </nav>
      </div>

      {/* ── Heading ── */}
      <div className="container py-2">
        <h1 style={{ fontWeight: 800, fontSize: '2.4rem', color: '#111827', marginBottom: '1.5rem' }}>
          Thailand Visa For Indians
        </h1>
      </div>

      <div className="container pb-5">
        <div className="row g-4">

          {/* ────── Main Content (Left) ────── */}
          <div className="col-lg-8">
            {/* Banner Image */}
            <div className="mb-4" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <img
                src="https://images.pickyourtrail.com/thailand_travel_visa_0d93e4a4e0.webp?q=80&w=1200&auto=format&fit=crop"
                alt="Thailand Tourism"
                className="img-fluid w-100"
                style={{ height: '380px', objectFit: 'cover' }}
              />
            </div>

            {/* Intro Text */}
            <div className="content-section mb-5">
              <p className="text-muted leading-relaxed" style={{ fontSize: '15px' }}>
                Traveling to Thailand is an adventure of a lifetime. For Indian citizens, Thailand remains one of the most accessible and culturally rich destinations.
                Whether you're looking for the bustling streets of Bangkok or the serene beaches of Phuket, obtaining the right visa is your first step towards an unforgettable holiday.
              </p>
            </div>

            {/* Types of Visa Table */}
            <h3 className="mb-4" style={{ fontWeight: 700 }}>Types of Thailand Tourist Visa</h3>
            <div className="table-responsive mb-5">
              <table className="table border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th className="py-3 px-4 border-bottom-0">Visa Type</th>
                    <th className="py-3 px-4 border-bottom-0">Brief Description</th>
                    <th className="py-3 px-4 border-bottom-0">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 px-4 fw-600">Tourist Visa (Single)</td>
                    <td className="py-3 px-4 text-muted">Valid for 60 days, suitable for short leisure trips and sightseeing.</td>
                    <td className="py-3 px-4 fw-bold text-success">₹ 2,500</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 fw-600">Tourist Visa (Multiple)</td>
                    <td className="py-3 px-4 text-muted">Allows multiple entries within 6 months, ideal for frequent travelers.</td>
                    <td className="py-3 px-4 fw-bold text-success">₹ 14,500</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 fw-600">Visa On Arrival</td>
                    <td className="py-3 px-4 text-muted">15-day stay, available at designated checkpoints across Thailand.</td>
                    <td className="py-3 px-4 fw-bold text-success">₹ 4,700</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Documents Section */}
            <h3 className="mb-4" style={{ fontWeight: 700 }}>Documents Required for Thailand Visa</h3>
            <div className="p-4 mb-5" style={{ background: '#fcfcfc', borderRadius: '14px', border: '1px solid #f3f4f6' }}>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                {[
                  'Original Passport with at least 6 months validity from the date of return.',
                  'Two recent color photographs (3.5cm x 4.5cm) with a white background.',
                  'Confirmed onward/return flight tickets.',
                  'Proof of accommodation (Hotel booking confirmation).',
                  'Original bank statement for the last 6 months with a minimum balance of ₹50,000.',
                  'A duly filled and signed visa application form.'
                ].map((item, id) => (
                  <li key={id} className="d-flex align-items-start gap-3">
                    <div style={{ padding: '4px', background: 'var(--brand-primary-border)', borderRadius: '50%', color: '#10b981', display: 'flex' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span style={{ fontSize: '14.5px', color: '#374151' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Trust Banner ── */}
            <div className="mb-5 p-4 pe-lg-5" style={{
              background: 'linear-gradient(135deg, #064e3b 0%, var(--color-primary) 100%)',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(6,78,59,0.15)'
            }}>
              {/* Decorative circle */}
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />

              <div className="row align-items-center g-4 position-relative z-index-2">
                <div className="col-md-7">
                  <span style={{ color: '#10b981', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>
                    WHY CHOOSE WANDERLUST?
                  </span>
                  <h2 className="text-white fw-bold mb-3" style={{ fontSize: '1.8rem' }}>Trusted by millions for seamless travel</h2>
                  <div className="d-flex flex-wrap gap-4 mt-4">
                    <div className="d-flex align-items-center gap-2 text-white-50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <span style={{ fontSize: '13px' }}>24/7 Support</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-white-50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      <span style={{ fontSize: '13px' }}>Secure Payments</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-white-50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      <span style={{ fontSize: '13px' }}>Top Rated</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="bg-white p-3 shadow-sm rounded-4 text-center">
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 10px 0' }}>Our Global Partners</p>
                    <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap opacity-50 grayscale">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/d/d3/Expedia_Logo.svg" alt="Partner" width="60" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/02/Tripadvisor_Logo.svg" alt="Partner" width="70" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Booking.com_logo.svg" alt="Partner" width="80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <h3 className="mb-4" style={{ fontWeight: 700 }}>Frequently Asked Questions</h3>
            <div className="accordion accordion-flush" id="visaFaq">
              {[
                { q: "Is visa mandatory for Indians for Thailand?", a: "Yes, a tourist visa is mandatory. You can choose between a pre-approved E-Tourist visa or Visa on Arrival." },
                { q: "Can I apply for a Thailand visa online?", a: "Yes, the E-Visa process allows you to apply and pay online before your trip, saving time at the airport." },
                { q: "What is the processing time for a Thailand sticker visa?", a: "It typically takes 3 to 5 working days from the date of submission at the VFS center." }
              ].map((faq, i) => (
                <div key={i} className="accordion-item border-bottom">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed py-3" type="button" data-bs-toggle="collapse" data-bs-target={`#faq${i}`} style={{ fontSize: '15px', fontWeight: 600 }}>
                      {faq.q}
                    </button>
                  </h2>
                  <div id={`#faq${i}`} className="accordion-collapse collapse" data-bs-parent="#visaFaq">
                    <div className="accordion-body text-muted" style={{ fontSize: '14px' }}>
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ────── Sidebar (Right) ────── */}
          <div className="col-lg-4">
            <div className="sticky-top" style={{ top: '100px', zIndex: 10 }}>

              {/* Inquiry Form Card */}
              <div className="card border-0 shadow-lg p-4 mb-4" style={{ borderRadius: '20px', background: 'white' }}>
                <h4 style={{ fontWeight: 750, color: '#111827', marginBottom: '10px' }}>Get in touch</h4>
                <p className="text-muted mb-4" style={{ fontSize: '13px' }}>Fill this form and let our experts assist you with your Visa application.</p>

                <form className="d-flex flex-column gap-3">
                  <div className="form-floating">
                    <input type="text" className="form-control" id="formName" placeholder="Full Name" style={{ borderRadius: '12px', border: '1.5px solid #e5e7eb' }} />
                    <label htmlFor="formName" style={{ color: '#9ca3af' }}>Full Name</label>
                  </div>
                  <div className="form-floating">
                    <input type="email" className="form-control" id="formEmail" placeholder="Email Address" style={{ borderRadius: '12px', border: '1.5px solid #e5e7eb' }} />
                    <label htmlFor="formEmail" style={{ color: '#9ca3af' }}>Email Address</label>
                  </div>
                  <div className="form-floating">
                    <input type="tel" className="form-control" id="formPhone" placeholder="Mobile Number" style={{ borderRadius: '12px', border: '1.5px solid #e5e7eb' }} />
                    <label htmlFor="formPhone" style={{ color: '#9ca3af' }}>Mobile Number</label>
                  </div>

                  <button
                    type="submit"
                    className="btn w-100 py-3"
                    style={{
                      background: '#10b981',
                      color: 'white',
                      fontWeight: 700,
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                      marginTop: '10px'
                    }}
                  >
                    Get Expert Assistance
                  </button>
                </form>

                {/* Trust Signal */}
                <div className="mt-4 pt-4 border-top d-flex align-items-center gap-3">
                  <div className="d-flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid white', overflow: 'hidden', marginLeft: i > 1 ? '-10px' : '0' }}>
                        <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>
                    Trusted by 50K+ Travelers
                  </span>
                </div>
              </div>

              {/* Promo Banner */}
              <div className="card border-0 p-4 position-relative overflow-hidden" style={{ borderRadius: '20px', background: '#064e3b', minHeight: '180px' }}>
                <div className="position-relative z-index-2">
                  <h5 className="text-white fw-bold mb-3">Plan your Thailand trip now!</h5>
                  <button className="btn btn-light btn-sm fw-bold px-3 py-2" style={{ borderRadius: '8px', fontSize: '12px', color: '#064e3b' }}>
                    Explore Packages
                  </button>
                </div>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.2 }}>
                  <svg width="150" height="150" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Custom Styles ── */}
      <style jsx>{`
        .breadcrumb-item + .breadcrumb-item::before {
          content: '›';
          font-size: 18px;
          line-height: 1;
          vertical-align: middle;
        }
        .leads-relaxed { line-height: 1.8; }
        .fw-600 { font-weight: 600; }
        .form-control:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 4px rgba(16,185,129,0.1) !important;
        }
        .accordion-button:not(.collapsed) {
          background-color: var(--color-primary-light);
          color: #064e3b;
          box-shadow: none;
        }
        .accordion-button:focus {
          box-shadow: none;
          border-color: rgba(0,0,0,0.125);
        }
      `}</style>
    </div>
  );
}
