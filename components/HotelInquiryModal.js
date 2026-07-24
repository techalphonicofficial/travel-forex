'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { getMediaUrl } from '@/utils/api';
import ReadMoreText from '@/components/ReadMoreText';

const getHotelImage = (hotel) =>
  getMediaUrl(hotel?.image_url) ||
  getMediaUrl(hotel?.gallery?.find((item) => item.is_primary)?.url) ||
  getMediaUrl(hotel?.gallery?.[0]?.url) ||
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

export default function HotelInquiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', date: '', checkoutDate: '', guests: '2', message: '' });

  useEffect(() => {
    const handleTrigger = (e) => {
      if (e.detail?.hotel) {
        setHotel(e.detail.hotel);
      }
      setIsOpen(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('openHotelInquiry', handleTrigger);
      return () => window.removeEventListener('openHotelInquiry', handleTrigger);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Reset form after a delay to allow close animation
    setTimeout(() => {
      setForm({ name: '', phone: '', email: '', date: '', guests: '2', message: '' });
      setHotel(null);
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
    const hotelName = hotel?.name || 'Hotel';
    const location = [hotel?.destination?.name, hotel?.destination?.country].filter(Boolean).join(', ') || 'Unknown Location';

    const noteLines = [
      `Service Interest: Hotel Booking`,
      `Hotel: ${hotelName} (${location})`,
      form.date ? `Check-in Date: ${form.date}` : '',
      form.checkoutDate ? `Check-out Date: ${form.checkoutDate}` : '',
      form.guests ? `Guests: ${form.guests}` : '',
      form.message.trim() ? `Message: ${form.message.trim()}` : '',
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: 20,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          source: 'Website - Hotel Inquiry',
          notes: noteLines,
          custom_fields: {
            check_in: form.date,
            hotel_name: hotelName,
            check_out: form.checkoutDate,
            guest: form.guests,
            any_special_request: form.message.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Submission failed');
      toast.success(data.message || 'Thank you! Our team will contact you shortly about this hotel.');
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !hotel) return null;

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
        {/* Left Panel (Hotel Details) */}
        <div
          style={{
            flex: '0 0 42%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          className="d-none d-md-flex hotel-panel"
        >
          {hotel ? (
            <>
              <Image
                src={getHotelImage(hotel)}
                alt={hotel.name || 'Hotel'}
                fill
                style={{ objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
                zIndex: 1
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                padding: '30px',
                zIndex: 2,
                color: 'white'
              }}>
                <div style={{
                  display: 'inline-block',
                  background: 'var(--color-primary)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}>
                  {Number(hotel.star_rating) || 0} Star Property
                </div>
                <h3 style={{ margin: '0 0 5px', fontSize: '24px', fontWeight: '800', lineHeight: 1.2 }}>
                  {hotel.name}
                </h3>
                <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
                  {[hotel?.destination?.name, hotel?.destination?.country].filter(Boolean).join(', ') || 'Hotel destination'}
                </p>
              </div>
            </>
          ) : (
            <div style={{ background: 'var(--color-primary)', width: '100%', height: '100%' }} />
          )}
        </div>

        {/* Right Panel (Form Content) */}
        <div style={{ flex: 1, padding: '48px', position: 'relative' }}>
          {/* Close Button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: '24px', right: '48px',
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
            {hotel?.description ? (
              <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#111827', marginBottom: '8px' }}>About this hotel</h3>
                <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
                  <ReadMoreText text={hotel.description} lines={3} />
                </div>
              </div>
            ) : null}
            <h3 style={{ fontWeight: 800, fontSize: '24px', color: '#111827', marginBottom: '8px' }}>Send Booking Inquiry</h3>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>Fill in your details and we will get back to you with the best rates.</p>
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

            <div className="form-floating">
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

            <div className="d-flex gap-2">
              <div className="form-floating" style={{ width: '100px' }}>
                <input type="text" className="form-control" defaultValue="+91" style={formInputStyle} />
                <label>Code</label>
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

            <div className="d-flex gap-2">
              <div className="form-floating flex-grow-1">
                <input
                  type="date"
                  className="form-control"
                  style={formInputStyle}
                  value={form.date}
                  onChange={e => update('date', e.target.value)}
                />
                <label>Check-in Date (Optional)</label>
              </div>
              <div className="form-floating flex-grow-1">
                <input
                  type="date"
                  className="form-control"
                  style={formInputStyle}
                  value={form.checkoutDate}
                  onChange={e => update('checkoutDate', e.target.value)}
                />
                <label>Check-out (Optional)</label>
              </div>
              <div className="form-floating" style={{ width: '100px' }}>
                <select
                  className="form-select"
                  style={formInputStyle}
                  value={form.guests}
                  onChange={e => update('guests', e.target.value)}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5+</option>
                </select>
                <label>Guests</label>
              </div>
            </div>

            <div className="form-floating">
              <textarea
                className="form-control"
                placeholder="Message"
                style={{ ...formInputStyle, height: '80px', resize: 'none' }}
                value={form.message}
                onChange={e => update('message', e.target.value)}
              ></textarea>
              <label>Any special requests?</label>
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
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading ? 'Submitting...' : 'Send Inquiry'}
            </button>
          </form>
        </div>

        <style jsx>{`
          .modal-container { font-family: 'Inter', sans-serif; }
          .hotel-panel { min-height: 400px; }
          @media (max-width: 768px) {
            .modal-container { flex-direction: column; }
            .hotel-panel { flex: 0 0 200px !important; min-height: 200px; }
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
