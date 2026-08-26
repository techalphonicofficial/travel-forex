'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { usePathname } from 'next/navigation';

export default function FloatingContactWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: 'General Enquiry' });
  const [submitted, setSubmitted] = useState(false);

  if (pathname === '/gallery') {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and Contact Number are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: 3, // Contact Page pipeline
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          source: 'Floating Widget',
          notes: `Subject: ${form.subject}\nFrom Floating Widget`,
          custom_fields: {
            subject: form.subject,
          }
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Submission failed');
      
      setSubmitted(true);
      toast.success('Thank you! We will get back to you shortly.');
      
      // Auto-close after a few seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setForm({ name: '', phone: '', email: '', subject: 'General Enquiry' });
      }, 3000);
      
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      
      {/* Form Popup */}
      {isOpen && (
        <div 
          style={{
            marginBottom: 20,
            width: 320,
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s ease-out forwards'
          }}
        >
          <div style={{ background: 'var(--color-primary)', padding: '16px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Contact Us</h4>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: 24, lineHeight: 1 }}>&times;</button>
          </div>
          
          <div style={{ padding: 20 }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <h5 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Message Sent!</h5>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                />
                <select
                  value={form.subject}
                  required
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  style={inputStyle}
                >
                  <option value="General Enquiry">General Enquiry</option>
                  <option value="Tour Booking">Tour Booking</option>
                  <option value="Honeymoon Enquiry">Honeymoon Enquiry</option>
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: 8,
                    padding: '12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: loading ? 'wait' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Sending...' : 'Submit'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: 24 }}>&times;</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  fontSize: 14,
  outline: 'none',
};
