'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Shared InquiryForm component
 *
 * Props:
 *   title       - Headline text
 *   subtitle    - Sub-heading text
 *   serviceName - Pre-fills the "Interest" field (e.g. "Hotels", "Cruise")
 *   prefillNote - Extra pre-fill text appended to notes (e.g. blog title or hotel name)
 *   variant     - "strip" | "card" | "inline" (default: "strip")
 *   accentColor - CSS color for button/accents (default: var(--color-primary))
 *   darkBg      - Boolean: if true renders on dark background with white text
 *   showEmail   - Boolean: show email field (default false)
 *   showDate    - Boolean: show travel date field (default false)
 *   showMessage - Boolean: show message textarea (default false)
 *   pipelineId  - Contact-leads pipeline ID (default 1)
 */
export default function InquiryForm({
  title = 'Get in Touch',
  subtitle = 'Our travel experts will call you back shortly.',
  serviceName = 'General Inquiry',
  prefillNote = '',
  variant = 'strip',
  accentColor = 'var(--color-primary)',
  darkBg = false,
  showEmail = false,
  showDate = false,
  showMessage = false,
  pipelineId = 1,
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', date: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Please enter your name and phone number.');
      return;
    }

    setLoading(true);
    const noteLines = [
      `Service Interest: ${serviceName}`,
      prefillNote ? `Reference: ${prefillNote}` : '',
      showDate && form.date ? `Preferred Travel Date: ${form.date}` : '',
      showMessage && form.message.trim() ? `Message: ${form.message.trim()}` : '',
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: pipelineId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || '',
          source: 'Website',
          notes: noteLines,
          custom_fields: {
            subject: `${serviceName} Inquiry`,
            message: noteLines,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Submission failed');
      toast.success(data.message || 'Thank you! Our team will contact you shortly.');
      setSubmitted(true);
      setForm({ name: '', phone: '', email: '', date: '', message: '' });
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const textColor = darkBg ? '#fff' : '#111827';
  const subColor = darkBg ? 'rgba(255,255,255,0.72)' : '#6b7280';
  const inputBg = darkBg ? 'rgba(255,255,255,0.12)' : '#f9fafb';
  const inputBorder = darkBg ? 'rgba(255,255,255,0.2)' : '#e5e7eb';
  const inputColor = darkBg ? '#fff' : '#111827';
  const inputPlaceholder = darkBg ? 'rgba(255,255,255,0.45)' : undefined;

  const inputStyle = {
    flex: '1 1 160px',
    minWidth: 0,
    padding: '12px 14px',
    borderRadius: 10,
    border: `1.5px solid ${inputBorder}`,
    background: inputBg,
    color: inputColor,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  };

  const btnStyle = {
    flexShrink: 0,
    padding: '12px 28px',
    borderRadius: 10,
    border: 'none',
    background: accentColor,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: loading ? 'wait' : 'pointer',
    opacity: loading ? 0.75 : 1,
    transition: 'transform 0.15s, opacity 0.15s',
    whiteSpace: 'nowrap',
  };

  if (submitted) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '32px 20px',
        color: textColor,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
        <h3 style={{ margin: '0 0 8px', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20 }}>
          Thank you!
        </h3>
        <p style={{ margin: 0, color: subColor, fontSize: 14 }}>
          Our team will reach out to you within a few hours.
        </p>
      </div>
    );
  }

  /* ── Strip variant (full-width horizontal bar) ── */
  if (variant === 'strip') {
    return (
      <div style={{ padding: '40px 0' }}>
        <div className="container">
          <div style={{
            borderRadius: 18,
            padding: '32px 36px',
            background: darkBg
              ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover, #0a5a8a))'
              : '#f0f7ff',
            border: darkBg ? 'none' : '1px solid #bfdbfe',
          }}>
            <div style={{ marginBottom: 22 }}>
              <h3 style={{
                margin: '0 0 6px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 800,
                fontSize: 22,
                color: textColor,
              }}>{title}</h3>
              <p style={{ margin: 0, color: subColor, fontSize: 14 }}>{subtitle}</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  style={inputStyle}
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  required
                  style={inputStyle}
                />
                {showEmail && (
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    style={inputStyle}
                  />
                )}
                {showDate && (
                  <input
                    type="date"
                    placeholder="Travel date"
                    value={form.date}
                    onChange={(e) => update('date', e.target.value)}
                    style={inputStyle}
                  />
                )}
                {showMessage && (
                  <textarea
                    placeholder="Message (optional)"
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, flex: '1 1 100%', resize: 'vertical' }}
                  />
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={btnStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {loading ? 'Sending…' : 'Get Expert Advice →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── Card variant (compact sidebar/panel card) ── */
  if (variant === 'card') {
    return (
      <div style={{
        borderRadius: 16,
        border: '1px solid #dbeafe',
        background: '#fff',
        padding: '24px 22px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
      }}>
        <h3 style={{
          margin: '0 0 6px',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 800,
          fontSize: 18,
          color: '#111827',
        }}>{title}</h3>
        <p style={{ margin: '0 0 18px', color: '#6b7280', fontSize: 13, lineHeight: 1.5 }}>{subtitle}</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          <input
            type="text"
            placeholder="Your name *"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
            style={{ ...inputStyle, flex: 'none', width: '100%' }}
          />
          <input
            type="tel"
            placeholder="Phone number *"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            required
            style={{ ...inputStyle, flex: 'none', width: '100%' }}
          />
          {showEmail && (
            <input
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              style={{ ...inputStyle, flex: 'none', width: '100%' }}
            />
          )}
          {showDate && (
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              style={{ ...inputStyle, flex: 'none', width: '100%' }}
            />
          )}
          {showMessage && (
            <textarea
              placeholder="Message (optional)"
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
              rows={3}
              style={{ ...inputStyle, flex: 'none', width: '100%', resize: 'vertical' }}
            />
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ ...btnStyle, width: '100%', padding: '13px 16px' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Sending…' : 'Request Callback →'}
          </button>
        </form>
      </div>
    );
  }

  /* ── Inline variant (plain, no card wrapper) ── */
  return (
    <div>
      {title && (
        <h3 style={{
          margin: '0 0 6px',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 800,
          fontSize: 20,
          color: textColor,
        }}>{title}</h3>
      )}
      {subtitle && (
        <p style={{ margin: '0 0 16px', color: subColor, fontSize: 14 }}>{subtitle}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input
            type="text"
            placeholder="Your name *"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="Phone number *"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            required
            style={inputStyle}
          />
          {showEmail && (
            <input
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              style={inputStyle}
            />
          )}
          {showDate && (
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              style={inputStyle}
            />
          )}
          {showMessage && (
            <textarea
              placeholder="Message (optional)"
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
              rows={2}
              style={{ ...inputStyle, flex: '1 1 100%', resize: 'vertical' }}
            />
          )}
          <button
            type="submit"
            disabled={loading}
            style={btnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Sending…' : 'Get Expert Advice →'}
          </button>
        </div>
      </form>
    </div>
  );
}
