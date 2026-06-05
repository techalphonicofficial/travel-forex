'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal';
import toast from 'react-hot-toast';

const fallbackFaqs = [
  { q: 'What is your cancellation policy?', a: 'Free cancellation up to 14 days before departure. Within 14 days, we offer a 50% refund. No refund within 48 hours of your tour start.' },
  { q: 'Are group tours available?', a: 'Yes! All our tours are designed for groups of 2-15 people. We also offer private tours for families and couples.' },
  { q: 'Is travel insurance included?', a: 'Travel insurance is not included but we strongly recommend it. We can help you find the right coverage for your trip.' },
  { q: 'How are your tour guides selected?', a: "All guides are certified professionals with deep local knowledge and at least 5 years of experience. They're vetted and trained by our team." },
  { q: 'Can you customize a tour package?', a: "Absolutely! We specialize in bespoke itineraries. Contact us and we'll craft a personalized experience just for you." },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers. Payments are fully secured and encrypted.' },
];

const fallbackHero = {
  label: 'Get In Touch',
  title: 'Contact Us',
  description: "Have questions? We'd love to hear from you. Send us a message and we'll respond within 24 hours.",
};

const fallbackFaqContent = {
  label: 'Common Questions',
  title: 'Frequently Asked Questions',
  description: "Can't find what you're looking for? Contact our support team.",
  faqs: fallbackFaqs,
};

const fallbackFormFields = [
  { id: 'base_name', label: 'Full Name', fieldKey: 'name', fieldType: 'text', options: [], isRequired: true, order: -3 },
  { id: 'base_email', label: 'Email Address', fieldKey: 'email', fieldType: 'email', options: [], isRequired: false, order: -2 },
  { id: 'base_phone', label: 'Phone Number', fieldKey: 'phone', fieldType: 'text', options: [], isRequired: false, order: -1 },
  { id: 'subject', label: 'Subject', fieldKey: 'subject', fieldType: 'select', options: ['General Enquiry', 'Tour Booking', 'Custom Package'], isRequired: true, order: 0 },
  { id: 'message', label: 'Message', fieldKey: 'message', fieldType: 'textarea', options: [], isRequired: false, order: 2 },
];

const getInputType = (fieldType) => {
  const typeMap = {
    phone: 'tel',
    mobile: 'tel',
    integer: 'number',
    decimal: 'number',
    datetime: 'datetime-local',
  };
  const supportedTypes = ['text', 'email', 'tel', 'number', 'date', 'datetime-local', 'url', 'time'];
  const normalizedType = typeMap[fieldType] || fieldType;
  return supportedTypes.includes(normalizedType) ? normalizedType : 'text';
};

const baseFieldKeys = ['name', 'email', 'phone'];

const parseOfficeAddress = (officeAddress) => {
  if (!officeAddress) return '106, AGGARWAL BHAWAN 36, Nehru Place, New Delhi, South Delhi, Delhi, 110019';
  return String(officeAddress)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== '📍' && line.toLowerCase() !== 'office')
    .join('\n');
};

const getMapQuery = (contact) => {
  const coordinates = String(contact?.map_coordinates || '').trim();
  if (coordinates) return coordinates;

  return parseOfficeAddress(contact?.office_address).replace(/\s+/g, ' ');
};

const getFormPayload = (formElement, fields, pipelineId) => {
  const data = new FormData(formElement);
  const payload = {
    pipeline_id: pipelineId || 3,
    name: '',
    email: '',
    phone: '',
    source: 'Website',
    notes: '',
    custom_fields: {},
  };

  fields.forEach((field) => {
    const value = field.fieldType === 'multiselect'
      ? data.getAll(field.fieldKey).filter(Boolean)
      : data.get(field.fieldKey);
    const normalizedValue = field.fieldType === 'checkbox' ? Boolean(value) : value;

    if (field.fieldKey === 'name') payload.name = normalizedValue || '';
    else if (field.fieldKey === 'email') payload.email = normalizedValue || '';
    else if (field.fieldKey === 'phone') payload.phone = normalizedValue || '';
    else if (field.fieldKey === 'message') {
      payload.notes = normalizedValue || '';
      payload.custom_fields[field.fieldKey] = normalizedValue || '';
    } else if (!baseFieldKeys.includes(field.fieldKey)) {
      payload.custom_fields[field.fieldKey] = normalizedValue;
    }
  });

  return payload;
};

export default function ContactClient({ hero = fallbackHero, faqContent = fallbackFaqContent, heroImage = '', formConfig = null, companyInfo = null }) {
  const fields = useMemo(() => (
    formConfig?.fields?.length ? formConfig.fields : fallbackFormFields
  ), [formConfig]);
  const [openFaq, setOpenFaq] = useState(null);
  const [sending, setSending] = useState(false);
  const faqs = faqContent.faqs?.length ? faqContent.faqs : fallbackFaqs;
  const contact = companyInfo?.contact || {};
  const contactCards = [
    { icon: 'pin', title: 'Office', info: parseOfficeAddress(contact.office_address), action: null },
    { icon: 'phone', title: 'Phone', info: `${contact.phone || '9999457020'}\nMon-Fri 9am-6pm EST`, action: contact.phone ? `tel:${contact.phone}` : 'tel:+9999457020' },
    { icon: 'mail', title: 'Email', info: `${contact.email || 'itstravels.tours@gmail.com'}\nWe reply within 24 hours`, action: contact.email ? `mailto:${contact.email}` : 'mailto:itstravels.tours@gmail.com' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(getFormPayload(e.currentTarget, fields, formConfig?.id)),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Unable to submit your enquiry.');
      }

      toast.success(payload.message || 'Lead captured successfully');
      e.currentTarget.reset();
    } catch (error) {
      toast.error(error.message || 'Unable to submit your enquiry. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="page-header" style={{ position: 'relative', overflow: 'hidden' }}>
        {heroImage && (
          <>
            <Image
              src={heroImage}
              alt={hero.title}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover', opacity: 0.35 }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,10,40,0.78), rgba(0,82,204,0.46))' }} />
          </>
        )}
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="section-label" style={{ color: 'rgba(255,255,255,0.7)' }}>{hero.label}</span>
          <h1 className="section-title" style={{ color: 'white' }}>{hero.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 16, maxWidth: 720 }}>
            {hero.description}
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="row g-5">
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
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>{formConfig?.name || 'Send Us a Message'}</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 28 }}>
                    Fill in the form below and our travel experts will get back to you shortly.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                      {fields.map((field) => (
                        <DynamicField
                          key={field.id || field.fieldKey}
                          field={field}
                        />
                      ))}
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
                                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
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

            <div className="col-lg-5">
              <ScrollReveal>
                <div className="d-flex flex-column gap-4">
                  {contactCards.map(({ icon, title, info, action }) => (
                    <button
                      key={title}
                      type="button"
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
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onClick={() => action && window.open(action)}
                    >
                      <ContactIcon name={icon} />
                      <span>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 4 }}>{title}</span>
                        <span style={{ display: 'block', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{info}</span>
                      </span>
                    </button>
                  ))}

                  <div
                    style={{
                      height: 240,
                      borderRadius: 'var(--radius-xl)',
                      overflow: 'hidden',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-xs)',
                      background: 'var(--color-bg-soft)',
                    }}
                  >
                    <iframe
                      title="Office location map"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(getMapQuery(contact))}&z=15&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0, display: 'block' }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-soft" id="faq">
        <div className="container" style={{ maxWidth: 780 }}>
          <ScrollReveal>
            <div className="text-center mb-5">
              <span className="section-label">{faqContent.label}</span>
              <h2 className="section-title">{faqContent.title}</h2>
              <p className="section-subtitle mx-auto">{faqContent.description}</p>
            </div>
          </ScrollReveal>

          <div className="d-flex flex-column gap-3">
            {faqs.map(({ q, a }, i) => (
              <ScrollReveal key={`${q}-${i}`} delay={i * 60}>
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
                      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
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

function ContactIcon({ name, size = 24 }) {
  const paths = {
    pin: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z',
    phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2Z',
    mail: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z',
    chat: 'M4 4h16v12H5.17L4 17.17V4Zm0-2a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4Z',
    map: 'M20.5 3 15 5.2 9 3 3.5 5.1V21L9 18.8l6 2.2 5.5-2.1V3ZM9 16.7l-3.5 1.4V6.5L9 5.2v11.5Zm6 2.1-4-1.5V5.2l4 1.5v12.1Zm3.5-1.3L17 18.1V6.7l1.5-.6v11.4Z',
  };

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
      <path d={paths[name]} />
    </svg>
  );
}

function DynamicField({ field }) {
  const isTextarea = field.fieldType === 'textarea';
  const isSelect = field.fieldType === 'select';
  const isRadio = field.fieldType === 'radio';
  const isCheckbox = field.fieldType === 'checkbox';
  const isMultiSelect = field.fieldType === 'multiselect';
  const isWideField = isTextarea || isSelect || isRadio || isMultiSelect;
  const columnClass = isWideField ? 'col-12' : 'col-sm-6';
  const requiredMark = field.isRequired ? ' *' : '';
  const commonProps = {
    id: field.fieldKey,
    name: field.fieldKey,
    className: 'form-input',
    required: field.isRequired,
  };
  const normalizedOptions = (field.options || []).map((option) => (
    typeof option === 'string' ? { label: option, value: option } : option
  ));

  return (
    <div className={`${columnClass} form-group`}>
      {!isCheckbox && (
        <label className="form-label" htmlFor={field.fieldKey}>
          {field.label}{requiredMark}
        </label>
      )}

      {isTextarea ? (
        <textarea
          {...commonProps}
          rows={5}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          style={{ resize: 'vertical' }}
        />
      ) : isSelect || isMultiSelect ? (
        <select
          {...commonProps}
          multiple={isMultiSelect}
          style={isMultiSelect ? { minHeight: 112 } : undefined}
        >
          {!isMultiSelect && <option value="">Select {field.label}</option>}
          {normalizedOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : isRadio ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {normalizedOptions.map((option) => (
            <label key={option.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: 14 }}>
              <input
                type="radio"
                name={field.fieldKey}
                value={option.value}
                required={field.isRequired}
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : isCheckbox ? (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--color-text-secondary)', fontSize: 14 }}>
          <input
            id={field.fieldKey}
            name={field.fieldKey}
            type="checkbox"
            required={field.isRequired}
          />
          {field.label}{requiredMark}
        </label>
      ) : (
        <input
          {...commonProps}
          type={getInputType(field.fieldType)}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      )}
    </div>
  );
}
