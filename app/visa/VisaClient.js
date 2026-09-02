'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getStoredAuth, getStoredToken, getMediaUrl } from '@/utils/api';
import TrustedPartners from '@/components/TrustedPartners';
import './visa.css';

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
    pipeline_id: pipelineId || 17,
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
  
  const isPhoneField = ['phone', 'mobile_number', 'contact_number', 'phone_number'].includes(field.fieldKey);
  const isReq = field.isRequired || isPhoneField;
  const requiredMark = isReq ? ' *' : '';
  
  const commonProps = {
    id: field.fieldKey,
    name: field.fieldKey,
    required: isReq,
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












// trustedPartners array removed and delegated to components/TrustedPartners.js

export default function VisaClient({ formConfig, pageData }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const destinationSection = pageData?.details?.find(d => d.section === 'destination_tabs' && d.key === 'destination_key');
  const destinationTabs = destinationSection?.json_data?.tabs || [];
  
  const heroSection = pageData?.details?.find(d => d.key === 'hero_key');
  const stepsSection = pageData?.details?.find(d => d.key === 'Application-key');
  const dynamicSteps = stepsSection?.json_data?.team || [];
  
  const faqSection = pageData?.details?.find(d => d.key === 'FAQ-key');
  const dynamicFaqs = faqSection?.json_data?.faqs || [];
  
  const docsSection = pageData?.details?.find(d => d.key === 'Document-key');

  const [activeCategory, setActiveCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    if (destinationTabs.length > 0 && !activeCategory) {
      const type = searchParams?.get('type');
      if (type && destinationTabs.some(t => t.key === type)) {
        setActiveCategory(type);
      } else {
        setActiveCategory(destinationTabs[0].key);
      }
    }
  }, [destinationTabs, searchParams, activeCategory]);

  const fields = useMemo(() => {
    let baseFields = formConfig?.fields?.length ? [...formConfig.fields] : [];
    return baseFields.map(field => {
      if (field.fieldKey === 'visa_category' || field.label?.toLowerCase().includes('category')) {
         return {
           ...field,
           fieldType: 'select',
           options: destinationTabs.map(tab => ({ label: tab.label, value: tab.label }))
         };
      }
      return field;
    });
  }, [formConfig, destinationTabs]);

  useEffect(() => {
    const type = searchParams?.get('type');
    if (type && destinationTabs.some(t => t.key === type)) {
      setActiveCategory(type);
    }
  }, [searchParams, destinationTabs]);

  useEffect(() => {
    const token = getStoredToken();
    setIsLoggedIn(Boolean(token));
    const auth = getStoredAuth();
    setCurrentUser(auth);
  }, []);

  const handleInquirySubmit = async (e) => {
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
      setIsModalOpen(false);
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
    if (!activeCategory) return [];
    const activeTab = destinationTabs.find(t => t.key === activeCategory);
    let list = activeTab?.destinations?.map(d => ({ 
      id: d.slug, 
      name: d.name, 
      category: activeCategory, 
      image: getMediaUrl(d.image) 
    })) || [];

    if (searchTerm) {
      list = list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list;
  }, [activeCategory, destinationTabs, searchTerm]);

    const docHeroImageUrl = heroSection?.json_data?.media_url ? getMediaUrl(heroSection.json_data.media_url) : null;

  return (
    <main className="visa-page">
      {/* 2. VISA DESTINATIONS (TABBED) */}
      <section className="visa-section container" id="destinations">
        <div className="visa-section-head text-center">
          <h2>{destinationSection?.json_data?.heading_content || destinationSection?.title || 'Select Your Destination'}</h2>
          <p>{destinationSection?.json_data?.description || 'Click on any country to check visa requirements and apply.'}</p>
        </div>

        <div className="visa-tabs" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          {destinationTabs.map(tab => (
            <button 
              key={tab.key} 
              className={`visa-tab-btn ${activeCategory === tab.key ? 'active' : ''}`} 
              onClick={() => { setActiveCategory(tab.key); router.push(`/visa?type=${tab.key}`, { scroll: false }); }}
            >
              {tab.label}
            </button>
          ))}
          {/* Dropdown for tabs as requested */}
          <select 
            value={activeCategory} 
            onChange={(e) => { setActiveCategory(e.target.value); router.push(`/visa?type=${e.target.value}`, { scroll: false }); }}
            className="visa-tab-dropdown-select d-block d-md-none"
            style={{
               padding: '12px 24px',
               borderRadius: '99px',
               border: '2px solid #cbd5e1',
               background: 'white',
               fontSize: '15px',
               fontWeight: '700',
               color: 'var(--color-text-secondary)',
               cursor: 'pointer',
               outline: 'none',
               marginTop: '10px',
               width: '100%',
               maxWidth: '300px'
            }}
          >
            {destinationTabs.map(tab => (
               <option key={tab.key} value={tab.key}>{tab.label}</option>
            ))}
          </select>
        </div>

        <div className="visa-grid-deals">
          {currentList.map(country => {
            const isNoFormSection = activeCategory === 'Visa-Free-&-On-Arrival' || activeCategory === 'On Arrival';
            return (
              <div 
                key={country.id} 
                className="visa-deal-card" 
                onClick={!isNoFormSection ? () => handleSelectCountry(country.name) : undefined} 
                style={{ cursor: isNoFormSection ? 'default' : 'pointer' }}
              >
                <div className="visa-card-img-wrap" style={{ height: 200, width: '100%', position: 'relative' }}>
                  <Image src={country.image} alt={country.name} fill style={{ objectFit: 'cover' }} />
                </div>
                <div className="visa-card-body" style={{ padding: '20px 24px' }}>
                  <h3 style={{ margin: 0, fontSize: 22 }}>{country.name}</h3>
                  {!isNoFormSection && (
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: 14 }}>Apply Now &rarr;</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {currentList.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#64748b' }}>No countries found.</div>
          )}
        </div>
      </section>
      {/* 3. APPLICATION STEPS */}
            <section className="visa-steps-section">
        <div className="container">
          <div className="visa-section-head text-center">
            <h2>{stepsSection?.title || 'Visa Application Process'}</h2>
            <p>{stepsSection?.json_data?.heading_content || stepsSection?.description || 'Obtain your international travel visa in 4 simple and secure steps.'}</p>
          </div>
          <div className="visa-steps-grid">
            {dynamicSteps.map((step, idx) => (
              <div key={idx} className="visa-step-box">
                <span>{step.role || `0${idx + 1}`}</span>
                <h3>{step.name}</h3>
                <p>{step.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DOCUMENTS CHECKLIST INFO & FORM ROW */}
            <section className="visa-section container" id="inquiry">
        <div className="row g-5 align-items-center">
          <div className="col-12 col-lg-6">
            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '18px' }}>{docsSection?.title || 'Standard Documents Checklist'}</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>{docsSection?.json_data?.heading_content}</p>

            <ul className="visa-checklist-ul">
              {docsSection?.json_data?.stats?.map((stat, idx) => (
                <li key={idx}>
                  <span className="chk-icon">&#10003;</span>
                  <div>
                    <h4>{stat.value?.replace(/✔\s*/, '')}</h4>
                    <p>{stat.label}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* HERO IMAGE */}
          <div className="col-12 col-lg-6" id="visa-inquiry-image" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            {docHeroImageUrl ? (
              <div className="visa-hero-image-wrap" style={{ position: 'relative', height: '600px', width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
                <Image src={docHeroImageUrl} alt="Visa Documents Checklist" fill style={{ objectFit: 'cover' }} />
              </div>
            ) : (
              <div className="visa-inquiry-card" style={{ margin: '48px 32px', textAlign: 'center', padding: '100px 20px', background: '#f8fafc', borderRadius: '24px' }}>
                 <p style={{ color: 'var(--color-text-secondary)' }}>Image will appear here</p>
              </div>
            )}
          </div>
        </div>
      </section>

            {/* 5. FAQS ACCORDION */}
      {dynamicFaqs.length > 0 && (
        <section className="visa-section container" style={{ maxWidth: '800px' }}>
          <div className="visa-section-head text-center">
            <h2>{faqSection?.title || 'Frequently Asked Questions'}</h2>
            <p>{faqSection?.json_data?.heading_content}</p>
          </div>
          <div className="visa-faq-list">
            {dynamicFaqs.map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div key={idx} className="visa-faq-item">
                  <button type="button" className="faq-question-btn" onClick={() => setActiveFaqIndex(isOpen ? null : idx)}>
                    <span>{faq.q?.replace(/▼$/, '')}</span>
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
      )}

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

      
    </main>
  );
}
