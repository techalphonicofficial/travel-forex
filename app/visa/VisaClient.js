'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getStoredAuth, getStoredToken } from '@/utils/api';
import TrustedPartners from '@/components/TrustedPartners';

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
    pipeline_id: pipelineId || 12,
    name: '',
    email: '',
    phone: '',
    source: 'Visa Landing Page',
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

function VisaDynamicField({ field, defaultValue }) {
  const isTextarea = field.fieldType === 'textarea';
  const isSelect = field.fieldType === 'select';
  const isMultiSelect = field.fieldType === 'multiselect';
  const isWideField = isTextarea || field.fieldKey.includes('notes') || field.fieldKey.includes('message');
  const requiredMark = field.isRequired ? ' *' : '';
  const commonProps = {
    id: field.fieldKey,
    name: field.fieldKey,
    required: field.isRequired,
    defaultValue: defaultValue || '',
  };

  return (
    <div className={`visa-field ${isWideField ? 'full-width' : ''}`}>
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


const freeAndOnArrivalCountries = [
  { id: 'nepal', name: 'Nepal', category: 'free-on-arrival', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
  { id: 'bhutan', name: 'Bhutan', category: 'free-on-arrival', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
  { id: 'mauritius', name: 'Mauritius', category: 'free-on-arrival', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
  { id: 'seychelles', name: 'Seychelles', category: 'free-on-arrival', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
  { id: 'maldives', name: 'Maldives', category: 'free-on-arrival', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&q=80' },
  { id: 'thailand', name: 'Thailand', category: 'free-on-arrival', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=500&q=80' },
  { id: 'indonesia', name: 'Indonesia', category: 'free-on-arrival', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
  { id: 'fiji', name: 'Fiji', category: 'free-on-arrival', image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=500&q=80' },
  { id: 'macau', name: 'Macau', category: 'free-on-arrival', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
];

const eVisaCountries = [
  { id: 'dubai', name: 'Dubai (UAE)', category: 'e-visa', image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=500&q=80' },
  { id: 'sri-lanka', name: 'Sri Lanka', category: 'e-visa', image: 'https://images.unsplash.com/photo-1546708973-b339540b5162?w=500&q=80' },
  { id: 'vietnam', name: 'Vietnam', category: 'e-visa', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=500&q=80' },
  { id: 'cambodia', name: 'Cambodia', category: 'e-visa', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
  { id: 'azerbaijan', name: 'Azerbaijan', category: 'e-visa', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
  { id: 'kenya', name: 'Kenya', category: 'e-visa', image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=500&q=80' },
  { id: 'georgia', name: 'Georgia', category: 'e-visa', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
  { id: 'philippines', name: 'Philippines', category: 'e-visa', image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=500&q=80' },
];

const stampedVisaCountries = [
  { id: 'usa', name: 'USA', category: 'stamped', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
  { id: 'canada', name: 'CANADA', category: 'stamped', image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=500&q=80' },
  { id: 'europe', name: 'EUROPEAN COUNTRIES', category: 'stamped', image: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=500&q=80' },
  { id: 'australia', name: 'AUSTRALIA', category: 'stamped', image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=500&q=80' },
  { id: 'china', name: 'CHINA', category: 'stamped', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=500&q=80' },
  { id: 'uk', name: 'UNITED KINGDOM', category: 'stamped', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&q=80' },
  { id: 'japan', name: 'JAPAN', category: 'stamped', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80' },
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

// trustedPartners array removed and delegated to components/TrustedPartners.js

export default function VisaClient({ formConfig }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialType = searchParams?.get('type') || 'free-on-arrival';
  const mappedType = initialType === 'paid' ? 'stamped' : initialType === 'free' ? 'free-on-arrival' : initialType === 'required' ? 'stamped' : initialType;
  const validInitialType = ['free-on-arrival', 'e-visa', 'stamped'].includes(mappedType) ? mappedType : 'free-on-arrival';

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [activeCategory, setActiveCategory] = useState(validInitialType);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const fields = useMemo(() => {
    let list = formConfig?.fields?.length ? [...formConfig.fields] : [];
    list.push({
      id: 'visa_category',
      fieldKey: 'visa_category',
      label: 'Visa Category',
      fieldType: 'text',
      isRequired: true
    });
    list.push({
      id: 'special_request',
      fieldKey: 'special_request',
      label: 'Special Request',
      fieldType: 'textarea',
      isRequired: false
    });
    return list;
  }, [formConfig]);

  useEffect(() => {
    const type = searchParams?.get('type');
    if (type) {
      const mapped = type === 'paid' ? 'stamped' : type === 'free' ? 'free-on-arrival' : type === 'required' ? 'stamped' : type;
      if (['free-on-arrival', 'e-visa', 'stamped'].includes(mapped)) {
        setActiveCategory(mapped);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const token = getStoredToken();
    setIsLoggedIn(Boolean(token));
    const auth = getStoredAuth();
    setCurrentUser(auth);
  }, []);

  const handleInquirySubmit = async (e) => {
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
      const payload = getFormPayload(form, fields, formConfig?.id);

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
      form.reset();
    } catch (err) {
      toast.error(err.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setIsModalOpen(true);
  };

  const currentList = useMemo(() => {
    let list = [];
    if (activeCategory === 'free-on-arrival') list = freeAndOnArrivalCountries;
    if (activeCategory === 'e-visa') list = eVisaCountries;
    if (activeCategory === 'stamped') list = stampedVisaCountries;

    if (searchTerm) {
      list = list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list;
  }, [activeCategory, searchTerm]);

  return (
    <main className="visa-page">
      {/* 3. VISA DESTINATIONS (TABBED) */}

      {/* 3. VISA DESTINATIONS (TABBED) */}
      <section className="visa-section container" id="destinations">
        <div className="visa-section-head text-center">
          <h2>Select Your Destination</h2>
          <p>Click on any country to check visa requirements and apply.</p>
        </div>

        <div className="visa-tabs" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          <button className={`visa-tab-btn ${activeCategory === 'free-on-arrival' ? 'active' : ''}`} onClick={() => { setActiveCategory('free-on-arrival'); router.push('/visa?type=free-on-arrival', { scroll: false }); }}>Visa Free & On Arrival</button>
          <button className={`visa-tab-btn ${activeCategory === 'e-visa' ? 'active' : ''}`} onClick={() => { setActiveCategory('e-visa'); router.push('/visa?type=e-visa', { scroll: false }); }}>E-Visa</button>
          <button className={`visa-tab-btn ${activeCategory === 'stamped' ? 'active' : ''}`} onClick={() => { setActiveCategory('stamped'); router.push('/visa?type=stamped', { scroll: false }); }}>Stamped Visa</button>
        </div>

        <div className="visa-grid-deals">
          {currentList.map(country => (
            <div key={country.id} className="visa-deal-card" onClick={() => handleSelectCountry(country.name)} style={{ cursor: 'pointer' }}>
              <div className="visa-card-img-wrap" style={{ height: 200, width: '100%', position: 'relative' }}>
                <Image src={country.image} alt={country.name} fill style={{ objectFit: 'cover' }} />
                <span style={{ position: 'absolute', textTransform: 'uppercase', background: activeCategory === 'free' ? '#10b981' : activeCategory === 'on-arrival' ? '#f59e0b' : '#ef4444', color: 'white', padding: '6px 14px', fontSize: 11, bottom: 12, left: 12, right: 'auto', borderRadius: 8, fontWeight: 800 }}>
                  {activeCategory === 'free' ? 'VISA FREE' : activeCategory === 'on-arrival' ? 'ON ARRIVAL / E-VISA' : 'VISA REQUIRED'}
                </span>
              </div>
              <div className="visa-card-body" style={{ padding: '20px 24px' }}>
                <h3 style={{ margin: 0, fontSize: 22 }}>{country.name}</h3>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: 14 }}>Apply Now &rarr;</span>
                </div>
              </div>
            </div>
          ))}
          {currentList.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#64748b' }}>No countries found.</div>
          )}
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
                  <h4>Valid Passport</h4>
                  <p>Must have at least 6 months validity remaining from your return date and 2 blank pages.</p>
                </div>
              </li>
              <li>
                <span className="chk-icon">✔</span>
                <div>
                  <h4>Employment Details</h4>
                  <p>Recent salary slips or a No Objection Certificate (NOC) from your current employer.</p>
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
            <div className="visa-inquiry-card" style={{ margin: '48px 32px' }}>
              <h3 style={{ margin: '0 0 8px', fontWeight: 900, fontSize: 22, color: 'var(--color-primary)' }}>Speak to a Visa Expert</h3>
              <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Fill out this form and our senior visa advisor will call you to walk you through documentation and pricing.</p>

              <form onSubmit={handleInquirySubmit} className="visa-form">
                {fields.length > 0 ? (
                  fields.map(field => (
                    <VisaDynamicField
                      key={field.id || field.fieldKey}
                      field={field}
                      defaultValue={currentUser ? currentUser[field.fieldKey] || '' : ''}
                    />
                  ))
                ) : (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.7 }}>Form is unavailable right now.</p>
                )}

                <button type="submit" className="visa-search-submit" disabled={loading} style={{ gridColumn: '1 / -1' }}>
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

      {/* VISA INQUIRY MODAL */}
      {isModalOpen && (
        <div className="visa-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="visa-modal-content" onClick={e => e.stopPropagation()}>
            <button className="visa-modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            <div className="visa-inquiry-card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
              <h3 style={{ margin: '0 0 8px', fontWeight: 900, fontSize: 24, color: 'var(--color-primary)' }}>Apply for {selectedCountry} Visa</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Fill out this form and our senior visa advisor will call you to walk you through documentation and pricing for {selectedCountry}.</p>

              <form onSubmit={handleInquirySubmit} className="visa-form">
                <input type="hidden" name="target_country" value={selectedCountry || ''} />
                {fields.length > 0 ? (
                  fields.map(field => {
                    let defaultVal = currentUser ? currentUser[field.fieldKey] || '' : '';
                    if (
                      field.fieldKey === 'destination_country' ||
                      field.label.toLowerCase().includes('country') ||
                      field.fieldKey.toLowerCase().includes('country')
                    ) {
                      defaultVal = selectedCountry || defaultVal;
                    }
                    return (
                      <VisaDynamicField
                        key={field.id || field.fieldKey}
                        field={field}
                        defaultValue={defaultVal}
                      />
                    );
                  })
                ) : (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.7 }}>Form is unavailable right now.</p>
                )}

                <button type="submit" className="visa-search-submit" disabled={loading} style={{ gridColumn: '1 / -1' }}>
                  {loading ? 'Submitting Request...' : 'Get Visa Assistance'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VISA PAGE CSS STYLES */}
      <style jsx global>{`
        .visa-tab-btn {
          padding: 12px 24px;
          border-radius: 99px;
          border: 2px solid transparent;
          background: white;
          color: var(--color-text-secondary);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .visa-tab-btn:hover {
          background: #f8fafc;
          transform: translateY(-2px);
        }
        .visa-tab-btn.active {
          background: var(--color-primary);
          color: white;
          box-shadow: 0 8px 24px color-mix(in srgb, var(--color-primary) 30%, transparent);
        }
        .visa-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: grid;
          place-items: center;
          padding: 20px;
        }
        .visa-modal-content {
          background: white;
          width: 100%;
          max-width: 600px;
          border-radius: 24px;
          padding: 32px;
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .visa-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          color: #64748b;
          display: grid;
          place-items: center;
          transition: background 0.2s;
        }
        .visa-modal-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .visa-deal-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
          border-color: var(--brand-primary-border);
        }
        .visa-deal-card {
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .visa-page {
          background: linear-gradient(135deg, #e0f2fe 0%, #ede9fe 40%, #fce7f3 100%);
          min-height: 100vh;
          color: var(--color-text-primary);
          padding-top: 40px;
          padding-bottom: 80px;
        }
        .visa-hero {
          padding: 48px 0 48px;
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
          margin-top: 0;
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
          grid-template-columns: 1fr 1fr;
          gap: 16px 12px;
          padding: 20px 0;
          margin: 20px 0;
        }
        .visa-field.full-width {
          grid-column: 1 / -1;
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
          gap: 16px;
        }
        .visa-faq-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .visa-faq-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          border-color: #cbd5e1;
        }
        .faq-question-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          text-align: left;
          transition: background 0.2s;
        }
        .faq-question-btn:hover {
          background: #f8fafc;
        }
        .faq-arrow {
          font-size: 14px;
          color: var(--color-primary);
          transition: transform 0.3s ease;
          display: inline-block;
        }
        .faq-answer-panel {
          padding: 0 24px 20px;
          color: #475569;
          line-height: 1.7;
          font-size: 15px;
          animation: slideDown 0.3s ease-out forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 991px) {
          .visa-hero {
            padding: 36px 0 32px;
          }
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
