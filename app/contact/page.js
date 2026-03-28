'use client';

import { useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';
import toast from 'react-hot-toast';

const faqs = [
  { q: 'What is your cancellation policy?', a: 'Free cancellation up to 14 days before departure. Within 14 days, we offer a 50% refund. No refund within 48 hours of your tour start.' },
  { q: 'Are group tours available?', a: 'Yes! All our tours are designed for groups of 2–15 people. We also offer private tours for families and couples.' },
  { q: 'Is travel insurance included?', a: 'Travel insurance is not included but we strongly recommend it. We can help you find the right coverage for your trip.' },
  { q: 'How are your tour guides selected?', a: 'All guides are certified professionals with deep local knowledge and at least 5 years of experience. They\'re vetted and trained by our team.' },
  { q: 'Can you customize a tour package?', a: 'Absolutely! We specialize in bespoke itineraries. Contact us and we\'ll craft a personalized experience just for you.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers. Payments are fully secured and encrypted.' },
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    toast.success('Message sent! We\'ll reply within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <span className="section-label" style={{ color: 'rgba(255,255,255,0.6)' }}>📞 Get In Touch</span>
          <h1 className="section-title" style={{ color: 'white' }}>Contact Us</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond within 24 hours.
          </p>
        </div>
      </div>

      {/* ── CONTACT SECTION ── */}
      <section className="section">
        <div className="container">
          <div className="row g-5">
            {/* Left: Form */}
            <div className="col-lg-7">
              <ScrollReveal direction="left">
                <div
                  style={{
                    background: 'var(--color-bg-card)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 48,
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Send Us a Message</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 28 }}>
                    Fill in the form below and our travel experts will get back to you shortly.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                      <div className="col-sm-6 form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                          className="form-input"
                          placeholder="John Doe"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                      <div className="col-sm-6 form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="john@example.com"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                      <div className="col-12 form-group">
                        <label className="form-label">Subject</label>
                        <select
                          className="form-input"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        >
                          {['General Inquiry', 'Tour Booking', 'Custom Package', 'Cancellation', 'Complaint', 'Partnership'].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12 form-group">
                        <label className="form-label">Message *</label>
                        <textarea
                          className="form-input"
                          rows={5}
                          placeholder="Tell us about your dream trip, questions, or concerns..."
                          required
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn-primary btn-lg"
                          disabled={sending}
                          style={{ opacity: sending ? 0.75 : 1 }}
                        >
                          {sending ? (
                            <>
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  border: '2px solid rgba(255,255,255,0.4)',
                                  borderTopColor: 'white',
                                  borderRadius: '50%',
                                  animation: 'spin 0.8s linear infinite',
                                }}
                              />
                              Sending...
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                              </svg>
                              Send Message
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: Info + Map */}
            <div className="col-lg-5">
              <ScrollReveal>
                <div className="d-flex flex-column gap-4">
                  {/* Contact Info Cards */}
                  {[
                    { icon: '📍', title: 'Office', info: '106, AGGARWAL BHAWAN 36, Nehru Place, New Delhi, South Delhi, Delhi, 110019', action: null },
                    { icon: '📞', title: 'Phone', info: '9999457020\nMon–Fri 9am–6pm EST', action: 'tel:+9999457020' },
                    { icon: '📧', title: 'Email', info: 'itstravels.tours@gmail.com\nWe reply within 24 hours', action: 'mailto:itstravels.tours@gmail.com' },
                    { icon: '💬', title: 'Live Chat', info: 'Available 24/7 for urgent travel assistance', action: '#' },
                  ].map(({ icon, title, info, action }) => (
                    <div
                      key={title}
                      style={{
                        background: 'var(--color-bg-card)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '20px 24px',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-xs)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 16,
                        transition: 'all 0.2s',
                        cursor: action ? 'pointer' : 'default',
                      }}
                      onClick={() => action && window.open(action)}
                      onMouseEnter={(e) => action && (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
                      onMouseLeave={(e) => action && (e.currentTarget.style.boxShadow = 'var(--shadow-xs)')}
                    >
                      <div style={{ fontSize: 24, flexShrink: 0 }}>{icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 4 }}>{title}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{info}</div>
                      </div>
                    </div>
                  ))}

                  {/* Map Placeholder */}
                  <div
                    style={{
                      height: 200,
                      borderRadius: 'var(--radius-xl)',
                      background: 'linear-gradient(135deg, var(--color-bg-soft) 0%, var(--color-border) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      border: '2px dashed var(--color-border)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <div style={{ fontSize: 36 }}>🗺️</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Interactive Map</div>
                    <div style={{ fontSize: 12 }}>123 Travel Street, New York</div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section bg-soft" id="faq">
        <div className="container" style={{ maxWidth: 780 }}>
          <ScrollReveal>
            <div className="text-center mb-5">
              <span className="section-label">❓ Common Questions</span>
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-subtitle mx-auto">Can't find what you're looking for? Contact our support team.</p>
            </div>
          </ScrollReveal>

          <div className="d-flex flex-column gap-3">
            {faqs.map(({ q, a }, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <div
                  style={{
                    background: 'var(--color-bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%',
                      padding: '18px 24px',
                      background: openFaq === i ? 'var(--color-primary-light)' : 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: 12,
                      textAlign: 'left',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 15, color: openFaq === i ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                      {q}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="20"
                      height="20"
                      style={{
                        color: 'var(--color-text-muted)',
                        transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 24px 20px 24px' }}>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{a}</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
