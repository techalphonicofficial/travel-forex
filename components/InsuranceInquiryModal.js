'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function InsuranceInquiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    destination: '', 
    tripStartDate: '', 
    tripEndDate: '', 
    travelers: '1', 
    insuranceType: 'Comprehensive' 
  });

  useEffect(() => {
    const handleTrigger = () => {
      setIsOpen(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('openInsuranceInquiry', handleTrigger);
      return () => window.removeEventListener('openInsuranceInquiry', handleTrigger);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Reset form after a delay to allow close animation
    setTimeout(() => {
      setForm({ name: '', phone: '', email: '', destination: '', tripStartDate: '', tripEndDate: '', travelers: '1', insuranceType: 'Comprehensive' });
    }, 300);
  };

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Please enter your name and phone number.');
      return;
    }

    setLoading(true);
    
    const noteLines = [
      `Service Interest: Travel Insurance`,
      `Type: ${form.insuranceType}`,
      form.destination ? `Destination: ${form.destination}` : '',
      form.tripStartDate ? `Start Date: ${form.tripStartDate}` : '',
      form.tripEndDate ? `End Date: ${form.tripEndDate}` : '',
      form.travelers ? `Travelers: ${form.travelers}` : '',
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: 1, // Default pipeline
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          source: 'Website - Insurance Inquiry',
          notes: noteLines,
          custom_fields: {
            subject: `Insurance Inquiry: ${form.insuranceType}`,
            message: noteLines,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Submission failed');
      toast.success(data.message || 'Thank you! Our insurance expert will contact you shortly.');
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={isOpen ? 'visible' : ''}
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease'
        }}
      />

      {/* Modal Content */}
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: isOpen ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -46%) scale(0.95)',
          width: '95%', maxWidth: '850px',
          background: 'white', borderRadius: '24px',
          boxShadow: '0 40px 80px -12px rgba(0,0,0,0.4)',
          zIndex: 10000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="modal-container"
      >
        {/* Left Panel (Visual Content) */}
        <div
          style={{
            flex: '0 0 42%',
            background: 'var(--color-primary)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            textAlign: 'center',
            overflow: 'hidden'
          }}
          className="d-none d-md-flex insurance-panel"
        >
          {/* Sunburst Pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'conic-gradient(from 0deg at 50% 50%, color-mix(in srgb, var(--color-primary) 10%, transparent) 0deg, transparent 20deg, color-mix(in srgb, var(--color-primary) 10%, transparent) 40deg)',
            opacity: 0.4,
            animation: 'rotatePulse 20s linear infinite'
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              margin: '0 auto 20px',
              backdropFilter: 'blur(10px)'
            }}>
              🛡️
            </div>

            <h4 style={{ color: 'white', fontWeight: 400, letterSpacing: '2px', marginBottom: '10px' }}>TRAVEL</h4>
            <h2 style={{ color: '#fbbf24', fontWeight: 950, fontSize: '3rem', lineHeight: 1, textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>FULLY</h2>
            <h2 style={{ color: '#fbbf24', fontWeight: 950, fontSize: '3.2rem', marginBottom: '15px' }}>SECURED</h2>
            <h4 style={{ color: 'white', fontWeight: 600, letterSpacing: '1px', fontSize: '13px' }}>PEACE OF MIND ANYWHERE</h4>
          </div>
        </div>

        {/* Right Panel (Form Content) */}
        <div style={{ flex: 1, padding: '48px', position: 'relative' }}>
          {/* Close Button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: '24px', right: '24px',
              background: '#f9fafb', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#374151', transition: 'all 0.2s', zIndex: 10
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="mb-4">
            <h3 style={{ fontWeight: 800, fontSize: '24px', color: '#111827', marginBottom: '8px' }}>Get a Quote</h3>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>Fill in your trip details and our insurance experts will contact you with the best coverage plans.</p>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <div className="form-floating">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Name" 
                style={formInputStyle} 
                required 
                value={form.name}
                onChange={e => update('name', e.target.value)}
              />
              <label>Full Name</label>
            </div>

            <div className="d-flex gap-2">
              <div className="form-floating flex-grow-1">
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Email" 
                  style={formInputStyle} 
                  required 
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                />
                <label>Email Address</label>
              </div>
              <div className="form-floating flex-grow-1">
                <input 
                  type="tel" 
                  className="form-control" 
                  placeholder="Phone" 
                  style={formInputStyle} 
                  required 
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                />
                <label>Mobile Number</label>
              </div>
            </div>

            <div className="form-floating">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Destination" 
                style={formInputStyle} 
                required 
                value={form.destination}
                onChange={e => update('destination', e.target.value)}
              />
              <label>Destination Country</label>
            </div>

            <div className="d-flex gap-2">
              <div className="form-floating flex-grow-1">
                <input 
                  type="date" 
                  className="form-control" 
                  style={formInputStyle} 
                  required
                  value={form.tripStartDate}
                  onChange={e => update('tripStartDate', e.target.value)}
                />
                <label>Start Date</label>
              </div>
              <div className="form-floating flex-grow-1">
                <input 
                  type="date" 
                  className="form-control" 
                  style={formInputStyle} 
                  required
                  value={form.tripEndDate}
                  onChange={e => update('tripEndDate', e.target.value)}
                />
                <label>End Date</label>
              </div>
            </div>
            
            <div className="d-flex gap-2">
              <div className="form-floating flex-grow-1">
                <select 
                  className="form-select" 
                  style={formInputStyle}
                  value={form.insuranceType}
                  onChange={e => update('insuranceType', e.target.value)}
                >
                  <option value="Comprehensive">Comprehensive Coverage</option>
                  <option value="Medical Only">Medical Only</option>
                  <option value="Multi-trip">Annual Multi-trip</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                </select>
                <label>Coverage Type</label>
              </div>
              <div className="form-floating" style={{ width: '120px' }}>
                <select 
                  className="form-select" 
                  style={formInputStyle}
                  value={form.travelers}
                  onChange={e => update('travelers', e.target.value)}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5+</option>
                </select>
                <label>Travelers</label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn py-3 mt-2"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                fontWeight: 750,
                borderRadius: '14px',
                fontSize: '16px',
                border: 'none',
                boxShadow: '0 15px 30px -5px color-mix(in srgb, var(--color-primary) 30%, transparent)',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'wait' : 'pointer'
              }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.transform = 'scale(1.02)' }}
              onMouseLeave={e => { if(!loading) e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading ? 'Submitting...' : 'Send Inquiry'}
            </button>
          </form>
        </div>

        <style jsx>{`
          @keyframes rotatePulse {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
          }
          .modal-container { font-family: 'Inter', sans-serif; }
          .insurance-panel { min-height: 400px; }
          @media (max-width: 768px) {
            .modal-container { flex-direction: column; }
            .insurance-panel { flex: 0 0 150px !important; min-height: 150px; }
          }
        `}</style>
      </div>
    </>
  );
}

const formInputStyle = {
  borderRadius: '14px',
  background: '#f9fafb',
  border: '1.5px solid #f3f4f6',
  fontSize: '14.5px'
};
