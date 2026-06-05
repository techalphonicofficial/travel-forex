'use client';

import { useState, useEffect } from 'react';

export default function GlobalInquiryModal({ brand }) {
  const [isOpen, setIsOpen] = useState(false);
  const brandLogo = brand?.logo || '/logooo.png';
  const brandName = brand?.legalName || 'ITS TRAVELS AND TOURS';

  useEffect(() => {
    // Check if the modal was already closed in this session
    let isClosed = false;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        isClosed = sessionStorage.getItem('inquiryModalClosed');
      }
    } catch (e) {
      console.warn('Storage access denied:', e);
    }

    if (!isClosed) {
      // Show modal after 3 seconds delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('inquiryModalClosed', 'true');
      }
    } catch (e) {
      // Fallback: just ignore if storage is denied
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          animation: 'fadeIn 0.4s ease'
        }}
      />

      {/* Modal Content */}
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95%', maxWidth: '850px',
          background: 'white', borderRadius: '24px',
          boxShadow: '0 40px 80px -12px rgba(0,0,0,0.4)',
          zIndex: 10000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          animation: 'modalEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
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
          className="d-none d-md-flex"
        >
          {/* Sunburst Pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'conic-gradient(from 0deg at 50% 50%, color-mix(in srgb, var(--color-primary) 10%, transparent) 0deg, transparent 20deg, color-mix(in srgb, var(--color-primary) 10%, transparent) 40deg)',
            opacity: 0.4,
            animation: 'rotatePulse 20s linear infinite'
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="mb-4 mx-auto w-100">
              <img src={brandLogo} alt={`${brandName} Logo`} style={{ width: '100%', maxWidth: '100px', height: 100, margin: 'auto', objectFit: 'contain' }} />
            </div>

            <h4 style={{ color: 'white', fontWeight: 400, letterSpacing: '2px', marginBottom: '10px' }}>YOUR</h4>
            <h2 style={{ color: '#fbbf24', fontWeight: 950, fontSize: '3rem', lineHeight: 1, textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>SOOPER HIT</h2>
            <h2 style={{ color: '#fbbf24', fontWeight: 950, fontSize: '3.2rem', marginBottom: '15px' }}>HOLIDAY</h2>
            <h4 style={{ color: 'white', fontWeight: 600, letterSpacing: '3px' }}>STARTS HERE</h4>
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
            <h3 style={{ fontWeight: 800, fontSize: '24px', color: '#111827', marginBottom: '8px' }}>Save your customized itinerary</h3>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>Fill in your details and we'll send it across to you.</p>
          </div>

          <form onSubmit={e => { e.preventDefault(); handleClose(); }} className="d-flex flex-column gap-3">
            <div className="form-floating">
              <input type="text" className="form-control" placeholder="Name" style={formInputStyle} required />
              <label>Full Name</label>
            </div>

            <div className="form-floating">
              <input type="email" className="form-control" placeholder="Email" style={formInputStyle} required />
              <label>Email Address</label>
            </div>

            <div className="d-flex gap-2">
              <div className="form-floating" style={{ width: '100px' }}>
                <input type="text" className="form-control" defaultValue="+91" style={formInputStyle} />
                <label>Code</label>
              </div>
              <div className="form-floating flex-grow-1">
                <input type="tel" className="form-control" placeholder="Phone" style={formInputStyle} required />
                <label>Mobile Number</label>
              </div>
            </div>

            <div className="form-floating">
              <select className="form-select" style={formInputStyle} required defaultValue="">
                <option value="" disabled>Choose an experience...</option>
                <option value="honeymoon">Luxury Honeymoon</option>
                <option value="family">Family Adventure</option>
                <option value="solo">Solo Backpacking</option>
                <option value="friends">Group Trekking</option>
                <option value="corporate">Corporate Retreat</option>
              </select>
              <label>Select Interest</label>
            </div>

            <button
              type="submit"
              className="btn py-3 mt-2"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                fontWeight: 750,
                borderRadius: '14px',
                fontSize: '16px',
                border: 'none',
                boxShadow: '0 15px 30px -5px color-mix(in srgb, var(--color-primary) 30%, transparent)',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              View customized Itinerary
            </button>
          </form>

          <div className="mt-4 pt-3 border-top text-center">
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: 0 }}>
              Need help? Reach out at <span className="fw-bold text-dark">+91 8031274154</span>
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes modalEntrance { 
            from { opacity: 0; transform: translate(-50%, -46%) scale(0.95); } 
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); } 
          }
          @keyframes rotatePulse {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
          }
          .modal-container { font-family: 'Inter', sans-serif; }
          @media (max-width: 768px) {
            .modal-container { flex-direction: column; }
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
