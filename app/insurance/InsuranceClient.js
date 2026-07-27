'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getStoredToken } from '@/utils/api';
import TrustedPartners from '@/components/TrustedPartners';
import QuoteButton from '@/components/QuoteButton';
import InsuranceInquiryModal from '@/components/InsuranceInquiryModal';

const getInputType = (fieldType) => {
  const typeMap = { phone: 'tel', mobile: 'tel', integer: 'number', decimal: 'number', datetime: 'datetime-local' };
  const supportedTypes = ['text', 'email', 'tel', 'number', 'date', 'datetime-local', 'url', 'time'];
  const normalizedType = typeMap[fieldType] || fieldType;
  return supportedTypes.includes(normalizedType) ? normalizedType : 'text';
};

const getFormPayload = (formElement, fields, pipelineId) => {
  const data = new FormData(formElement);
  const payload = {
    pipeline_id: pipelineId || 26,
    name: '',
    email: '',
    phone: '',
    source: 'Insurance Landing Page',
    notes: '',
    custom_fields: {},
  };

  fields.forEach((field) => {
    const value = field.fieldType === 'multiselect'
      ? data.getAll(field.fieldKey).filter(Boolean)
      : data.get(field.fieldKey);
    const normalizedValue = field.fieldType === 'checkbox' ? Boolean(value) : value;

    if (field.fieldKey === 'name' || field.fieldKey === 'full_name' || field.fieldKey === 'first_name' || field.fieldKey === 'your_name_' || field.fieldKey === 'base_name') {
      payload.name = payload.name || normalizedValue || '';
    }
    if (field.fieldKey === 'email' || field.fieldKey === 'email_address' || field.fieldKey === 'base_email') {
      payload.email = payload.email || normalizedValue || '';
    }
    if (field.fieldKey === 'phone' || field.fieldKey === 'mobile_number' || field.fieldKey === 'contact_number' || field.fieldKey === 'mobile_number_' || field.fieldKey === 'base_phone') {
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

function InsuranceDynamicField({ field }) {
  const isTextarea = field.fieldType === 'textarea';
  const isSelect = field.fieldType === 'select';
  const isMultiSelect = field.fieldType === 'multiselect';
  const isWideField = isTextarea || field.fieldKey.includes('notes') || field.fieldKey.includes('address') || field.fieldKey.includes('request') || field.fieldKey.includes('destination') || field.fieldKey.includes('country');
  const requiredMark = field.isRequired ? ' *' : '';
  const commonProps = {
    id: field.fieldKey,
    name: field.fieldKey,
    required: field.isRequired,
    style: { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b', background: 'white' }
  };

  return (
    <div className={isWideField ? "col-12 mb-3" : "col-12 col-md-6 mb-3"}>
      <label htmlFor={field.fieldKey} style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
        {field.label}{requiredMark}
      </label>
      {isTextarea ? (
        <textarea {...commonProps} rows="2" placeholder={`Enter ${field.label.toLowerCase()}`} style={{ ...commonProps.style, resize: 'vertical' }} />
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

export default function InsuranceClient({ pageData, formConfig }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const fields = formConfig?.fields || [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const heroSection = pageData?.details?.find(d => d.section === 'image_text' && d.key === 'hero_key');
  const partnersSection = pageData?.details?.find(d => d.section === 'team_grid' && d.key === 'our_trusted_partner');
  const benefitsSection = pageData?.details?.find(d => d.section === 'team_grid' && d.key === 'book-key');

  const heroHeadingSmall = heroSection?.title || 'Peace of Mind Anywhere';
  const heroHeadingLarge = heroSection?.json_data?.heading_content || 'Comprehensive Travel Insurance';
  const heroDesc = heroSection?.json_data?.body || 'Don\'t let unforeseen circumstances ruin your hard-earned vacation. Protect yourself against medical emergencies, flight cancellations, and lost baggage with our top-tier insurance policies.';

  const partnersTitle = partnersSection?.title || 'Our Trusted Insurance Partners';
  const dynamicPartners = partnersSection?.json_data?.team?.map(p => ({
    name: p.name,
    logo: p.img?.startsWith('http') ? p.img : `https://tourtravel.yber.in${p.img}`
  })) || null;

  const benefitsTitle = benefitsSection?.title || 'Why You Need Coverage';
  const benefitsList = benefitsSection?.json_data?.team || [
    { name: 'Medical Emergencies', bio: 'Coverage for unexpected hospital visits and medical evacuations abroad.', img: '🏥' },
    { name: 'Trip Cancellation', bio: 'Get reimbursed if you need to cancel your trip due to covered unforeseen events.', img: '✈️' },
    { name: 'Lost Baggage', bio: 'Compensation for lost, stolen, or delayed luggage and personal items.', img: '🧳' }
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* 1. HERO SECTION */}
      <section style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #3b82f6 100%)', color: 'white', padding: '100px 0 80px' }}>
        <div className="container">
          <div className="row align-items-center">

            {/* Left Column: Hero Text */}
            <div className="col-12 col-lg-6 mb-5 mb-lg-0" style={{ textAlign: 'left' }}>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: 1.2, marginBottom: 20, textTransform: 'uppercase' }}>
                {heroHeadingSmall}
              </span>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: 20, lineHeight: 1.2 }}>
                {heroHeadingLarge}
              </h1>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 500, marginBottom: '40px', lineHeight: 1.6 }}>
                {heroDesc}
              </p>
            </div>

            {/* Right Column: Inline Form */}
            <div className="col-12 col-lg-6">
              <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                padding: '32px',
                color: '#0f172a',
                textAlign: 'left'
              }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '24px' }}>Get Overseas Travel Insurance Quote</h2>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const token = getStoredToken();
                  if (!token) {
                    toast.error('Please login first to continue.');
                    router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                    return;
                  }

                  const formElement = e.currentTarget;
                  setLoading(true);

                  try {
                    const payload = getFormPayload(formElement, fields, formConfig?.id);
                    
                    const response = await fetch('/api/contact-leads', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });

                    const resData = await response.json();
                    if (!response.ok || !resData?.success) {
                      throw new Error(resData?.message || 'Failed to submit inquiry.');
                    }

                    toast.success('Your insurance inquiry has been sent! Our team will contact you shortly.');
                    formElement.reset();
                  } catch (err) {
                    toast.error(err.message || 'Unable to process request. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}>
                  <div className="row">
                    {fields.length > 0 ? (
                      fields.map(field => (
                        <InsuranceDynamicField key={field.id || field.fieldKey} field={field} />
                      ))
                    ) : (
                      <div className="col-12"><p>Loading form fields...</p></div>
                    )}
                  </div>

                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', opacity: loading ? 0.7 : 1 }} onMouseEnter={e => { if(!loading) e.currentTarget.style.background = '#000000' }} onMouseLeave={e => { if(!loading) e.currentTarget.style.background = '#111827' }}>
                    {loading ? 'Submitting...' : 'Get Insurance Quote'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUSTED PARTNERS MARQUEE */}
      <TrustedPartners 
        category="insurance" 
        customPartners={dynamicPartners}
        title={partnersTitle}
      />

      {/* 3. BENEFITS SECTION */}
      <section className="container" style={{ padding: '60px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b' }}>{benefitsTitle}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 30 }}>
          {benefitsList.map((benefit, idx) => {
            const icons = ['🏥', '✈️', '🧳', '🛡', '📢'];
            const icon = benefit.img || icons[idx % icons.length];
            return (
              <div key={idx} style={{ padding: 30, background: '#f8fafc', borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 15 }}>{icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#334155', marginBottom: 10 }}>{benefit.name}</h3>
                <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>{benefit.bio}</p>
              </div>
            );
          })}
        </div>
      </section>

      <InsuranceInquiryModal />
    </main>
  );
}
