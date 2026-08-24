'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getPackages, getMediaUrl } from '@/utils/api';

const FALLBACK_PACKAGE_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80';

const normalizePackage = (pkg) => {
  const destinationItems = pkg.destinations || [];
  const firstDestinationItem = destinationItems[0];
  const firstDestination = firstDestinationItem?.destination;
  const firstMapping = firstDestination?.mappings?.[0];
  const destinationName = firstDestination?.name || 'Worldwide';
  const nights = destinationItems.reduce((total, item) => total + (Number(item.nights) || 0), 0) || Math.max((Number(pkg.duration_days) || 1) - 1, 1);
  const locations = destinationItems.length
    ? destinationItems.map((item) => {
      const name = item.destination?.name || destinationName;
      return `${name}${item.nights ? ` (${item.nights}N)` : ''}`;
    })
    : [destinationName];
  const price = Number(pkg.price) || 0;
  const image = getMediaUrl(pkg.main_image) || getMediaUrl(firstDestination?.feature_image) || FALLBACK_PACKAGE_IMAGE;

  // Classify as domestic if the destination is flag type domestic or destination country is India or destination itself is India
  const isDomestic = String(firstDestination?.type || '').toLowerCase() === 'domestic' || 
                     String(firstDestination?.name || '').toLowerCase() === 'india' ||
                     String(firstMapping?.city?.country?.name || '').toLowerCase() === 'india';

  return {
    id: pkg.id,
    slug: pkg.slug || String(pkg.id),
    destination: destinationName,
    title: pkg.name,
    locations,
    image,
    nights,
    price,
    isDomestic,
    rating: 4.7,
  };
};

export default function DomesticInternationalPackages() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('domestic'); // 'domestic' | 'international' | 'flight' | 'hotel'
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Flight states
  const [flightTripType, setFlightTripType] = useState('Round-trip');
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('');
  const [flightDepartDate, setFlightDepartDate] = useState('');
  const [flightReturnDate, setFlightReturnDate] = useState('');
  const [flightClass, setFlightClass] = useState('Economy');
  const [flightAdults, setFlightAdults] = useState(1);
  const [flightChildren, setFlightChildren] = useState(0);
  const [flightName, setFlightName] = useState('');
  const [flightPhone, setFlightPhone] = useState('');
  const [flightEmail, setFlightEmail] = useState('');
  const [flightNotes, setFlightNotes] = useState('');
  const [flightSubmitting, setFlightSubmitting] = useState(false);

  // Hotel states
  const [hotelCity, setHotelCity] = useState('');
  const [hotelCheckIn, setHotelCheckIn] = useState('');
  const [hotelCheckOut, setHotelCheckOut] = useState('');
  const [hotelAdults, setHotelAdults] = useState(2);
  const [hotelChildren, setHotelChildren] = useState(0);
  const [hotelRooms, setHotelRooms] = useState(1);

  const domesticList = packages.filter(p => p.isDomestic);
  const internationalList = packages.filter(p => !p.isDomestic);
  const displayedPackages = activeTab === 'domestic' ? domesticList : internationalList;

  // Track responsive screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll loop for packages tabs
  useEffect(() => {
    if (activeTab === 'flight' || activeTab === 'hotel') return;
    if (displayedPackages.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;

      const cardWidth = 350 + 24; // Card width (350px) + gap (24px)
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      if (container.scrollLeft >= maxScrollLeft - 10) {
        // Rollback to start
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 3500); // Auto-scroll every 3.5 seconds

    return () => clearInterval(interval);
  }, [displayedPackages, activeTab, isHovered]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getPackages();
        if (mounted) {
          const mapped = (data || []).map(normalizePackage);
          setPackages(mapped);
        }
      } catch (err) {
        console.warn('Error loading packages for switcher:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const triggerInquiry = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openGlobalInquiry'));
    }
  };

  const handleFlightSubmit = async (e) => {
    e.preventDefault();
    if (!flightFrom.trim() || !flightTo.trim() || !flightDepartDate || !flightName.trim() || !flightPhone.trim() || !flightEmail.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setFlightSubmitting(true);

    try {
      const passengerStr = `${flightAdults} Adult${flightAdults > 1 ? 's' : ''}${flightChildren > 0 ? `, ${flightChildren} Child${flightChildren > 1 ? 'ren' : ''}` : ''}`;
      
      const flightDetails = [
        `Flight Booking Inquiry Details:`,
        `- Trip Type: ${flightTripType}`,
        `- From: ${flightFrom}`,
        `- To: ${flightTo}`,
        `- Departure Date: ${flightDepartDate}`,
        flightTripType === 'Round-trip' ? `- Return Date: ${flightReturnDate}` : '',
        `- Passengers: ${passengerStr}`,
        `- Cabin Class: ${flightClass}`,
        `- Customer: ${flightName}`,
        `- Contact: ${flightPhone} | ${flightEmail}`,
        flightNotes.trim() ? `- Special Requests: ${flightNotes.trim()}` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        pipeline_id: 3,
        name: flightName || 'Flight Inquiry',
        email: flightEmail || '',
        phone: flightPhone || '',
        source: 'Website',
        notes: flightDetails,
        custom_fields: {
          subject: 'Flight Booking Inquiry',
          message: flightDetails
        }
      };

      const response = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok || !resData?.success) {
        throw new Error(resData?.message || 'Unable to submit flight inquiry.');
      }

      toast.success('Flight inquiry submitted successfully! Our team will contact you shortly.');
      // Reset form
      setFlightFrom('');
      setFlightTo('');
      setFlightDepartDate('');
      setFlightReturnDate('');
      setFlightName('');
      setFlightPhone('');
      setFlightEmail('');
      setFlightNotes('');
    } catch (error) {
      toast.error(error.message || 'Failed to submit flight inquiry. Please try again.');
    } finally {
      setFlightSubmitting(false);
    }
  };

  const handleHotelSearch = (e) => {
    e.preventDefault();
    if (!hotelCity.trim()) {
      toast.error('Please enter a destination city.');
      return;
    }
    // Redirect to hotels page with search filters
    router.push(`/hotels?city=${encodeURIComponent(hotelCity.trim())}`);
  };

  return (
    <section style={{ padding: '64px 0', background: 'var(--color-bg-soft)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 8 }}>
            CURATED HOLIDAYS
          </p>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 850, fontSize: 32, color: 'var(--color-primary)', marginBottom: 24, lineHeight: 1.2 }}>
            Explore Our Holiday Packages
          </h2>

          {/* Elegant tab switcher */}
          <div style={{ 
            display: 'inline-flex', 
            background: 'var(--color-bg-card)', 
            padding: 6, 
            borderRadius: 999, 
            border: '1px solid var(--color-border)', 
            boxShadow: '0 8px 20px rgba(15,23,42,0.04)',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 4
          }}>
            <button
              onClick={() => setActiveTab('domestic')}
              style={{
                border: 'none',
                padding: '12px 24px',
                borderRadius: 999,
                fontWeight: 750,
                fontSize: 13.5,
                cursor: 'pointer',
                background: activeTab === 'domestic' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'domestic' ? 'white' : 'var(--color-text-secondary)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              🇮🇳 Domestic Packages ({domesticList.length})
            </button>
            <button
              onClick={() => setActiveTab('international')}
              style={{
                border: 'none',
                padding: '12px 24px',
                borderRadius: 999,
                fontWeight: 750,
                fontSize: 13.5,
                cursor: 'pointer',
                background: activeTab === 'international' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'international' ? 'white' : 'var(--color-text-secondary)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              ✈️ International Packages ({internationalList.length})
            </button>
            <button
              onClick={() => setActiveTab('flight')}
              style={{
                border: 'none',
                padding: '12px 24px',
                borderRadius: 999,
                fontWeight: 750,
                fontSize: 13.5,
                cursor: 'pointer',
                background: activeTab === 'flight' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'flight' ? 'white' : 'var(--color-text-secondary)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              🛫 Flight Booking
            </button>
            <button
              onClick={() => setActiveTab('hotel')}
              style={{
                border: 'none',
                padding: '12px 24px',
                borderRadius: 999,
                fontWeight: 750,
                fontSize: 13.5,
                cursor: 'pointer',
                background: activeTab === 'hotel' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'hotel' ? 'white' : 'var(--color-text-secondary)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              🏨 Hotel Booking
            </button>
          </div>
        </div>

        {/* Flight Booking Form Content */}
        {activeTab === 'flight' && (
          <div style={{
            background: 'var(--color-bg-card)',
            borderRadius: 24,
            border: '1px solid var(--color-border)',
            boxShadow: '0 12px 40px rgba(15,23,42,0.06)',
            padding: isMobile ? '24px 18px' : '40px',
            maxWidth: 900,
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <form onSubmit={handleFlightSubmit} style={{ display: 'grid', gap: 20 }}>
              {/* Trip Type Selectors */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                {['Round-trip', 'One-way'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFlightTripType(type)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 999,
                      border: 'none',
                      fontWeight: 750,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      background: flightTripType === type ? 'var(--color-primary)' : 'rgba(21, 128, 61, 0.08)',
                      color: flightTripType === type ? 'white' : 'var(--color-primary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Flight Search Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                gap: 16
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Departure City / Airport *</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi (DEL)"
                    value={flightFrom}
                    onChange={(e) => setFlightFrom(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Destination City / Airport *</label>
                  <input
                    type="text"
                    placeholder="e.g. London (LHR)"
                    value={flightTo}
                    onChange={(e) => setFlightTo(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Cabin Class</label>
                  <select
                    value={flightClass}
                    onChange={(e) => setFlightClass(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif',
                      background: 'white'
                    }}
                  >
                    <option>Economy</option>
                    <option>Premium Economy</option>
                    <option>Business</option>
                    <option>First Class</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Departure Date *</label>
                  <input
                    type="date"
                    value={flightDepartDate}
                    onChange={(e) => setFlightDepartDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>

                {flightTripType === 'Round-trip' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Return Date *</label>
                    <input
                      type="date"
                      value={flightReturnDate}
                      onChange={(e) => setFlightReturnDate(e.target.value)}
                      required={flightTripType === 'Round-trip'}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1px solid var(--color-border)',
                        outline: 'none',
                        fontSize: 14,
                        fontFamily: 'Inter, sans-serif'
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Travellers</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <select
                      value={flightAdults}
                      onChange={(e) => setFlightAdults(Number(e.target.value))}
                      style={{
                        flex: 1,
                        padding: '12px 10px',
                        borderRadius: 10,
                        border: '1px solid var(--color-border)',
                        fontSize: 13,
                        background: 'white'
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                    </select>
                    <select
                      value={flightChildren}
                      onChange={(e) => setFlightChildren(Number(e.target.value))}
                      style={{
                        flex: 1,
                        padding: '12px 10px',
                        borderRadius: 10,
                        border: '1px solid var(--color-border)',
                        fontSize: 13,
                        background: 'white'
                      }}
                    >
                      {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Child{n > 1 ? 'ren' : n === 1 ? 'd' : ''}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--color-border)', margin: '10px 0' }} />

              {/* Contact Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                gap: 16
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={flightName}
                    onChange={(e) => setFlightName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9999999999"
                    value={flightPhone}
                    onChange={(e) => setFlightPhone(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={flightEmail}
                    onChange={(e) => setFlightEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Special Requests / Notes (Optional)</label>
                <textarea
                  placeholder="Preferred airlines, meal requests, seat choice, etc."
                  value={flightNotes}
                  onChange={(e) => setFlightNotes(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    fontSize: 14,
                    fontFamily: 'Inter, sans-serif',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={flightSubmitting}
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px 40px',
                    fontWeight: 750,
                    fontSize: 14,
                    cursor: flightSubmitting ? 'not-allowed' : 'pointer',
                    opacity: flightSubmitting ? 0.7 : 1,
                    boxShadow: '0 4px 14px color-mix(in srgb, var(--color-primary) 30%, transparent)',
                    transition: 'all 0.2s'
                  }}
                >
                  {flightSubmitting ? 'Submitting Inquiry...' : 'Submit Flight Inquiry'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Hotel Booking Form Content */}
        {activeTab === 'hotel' && (
          <div style={{
            background: 'var(--color-bg-card)',
            borderRadius: 24,
            border: '1px solid var(--color-border)',
            boxShadow: '0 12px 40px rgba(15,23,42,0.06)',
            padding: isMobile ? '24px 18px' : '40px',
            maxWidth: 900,
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <form onSubmit={handleHotelSearch} style={{ display: 'grid', gap: 20 }}>
              {/* Hotel Search Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr',
                gap: 16
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Destination City / Hotel Name *</label>
                  <input
                    type="text"
                    placeholder="Where are you going? (e.g. Goa, Paris)"
                    value={hotelCity}
                    onChange={(e) => setHotelCity(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Check-in Date (Optional)</label>
                  <input
                    type="date"
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Check-out Date (Optional)</label>
                  <input
                    type="date"
                    value={hotelCheckOut}
                    onChange={(e) => setHotelCheckOut(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1.5fr 1fr' : '1fr 1fr 1fr',
                gap: 16
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Guests (Adults / Children)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={hotelAdults}
                      onChange={(e) => setHotelAdults(Number(e.target.value))}
                      style={{
                        flex: 1,
                        padding: '12px 10px',
                        borderRadius: 10,
                        border: '1px solid var(--color-border)',
                        fontSize: 13,
                        background: 'white'
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                    </select>
                    <select
                      value={hotelChildren}
                      onChange={(e) => setHotelChildren(Number(e.target.value))}
                      style={{
                        flex: 1,
                        padding: '12px 10px',
                        borderRadius: 10,
                        border: '1px solid var(--color-border)',
                        fontSize: 13,
                        background: 'white'
                      }}
                    >
                      {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Child{n > 1 ? 'ren' : n === 1 ? 'd' : ''}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Rooms Required</label>
                  <select
                    value={hotelRooms}
                    onChange={(e) => setHotelRooms(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif',
                      background: 'white'
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>

                {!isMobile && <div />}
              </div>

              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button
                  type="submit"
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px 40px',
                    fontWeight: 750,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px color-mix(in srgb, var(--color-primary) 30%, transparent)',
                    transition: 'all 0.2s'
                  }}
                >
                  Search Hotels
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Package Tabs Content */}
        {activeTab !== 'flight' && activeTab !== 'hotel' && (
          <>
            {loading ? (
              <div className="row g-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="col-12 col-md-6 col-lg-4">
                    <div style={{ background: 'var(--color-bg-card)', borderRadius: 18, height: 420, animation: 'pulse 1.5s infinite ease-in-out', border: '1px solid var(--color-border)' }} />
                  </div>
                ))}
              </div>
            ) : displayedPackages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-bg-card)', borderRadius: 18, border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
                <h4 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>No Packages Available</h4>
                <p style={{ fontSize: 14, margin: 0 }}>We are currently updating our {activeTab} deals. Please check back later!</p>
              </div>
            ) : (
              <div 
                ref={scrollRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  display: 'flex',
                  gap: '24px',
                  overflowX: 'auto',
                  padding: '12px 4px 28px',
                  scrollBehavior: 'smooth',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  scrollSnapType: 'x mandatory'
                }}
                className="packages-scroll-container"
              >
                {displayedPackages.map(pkg => {
                  const packageHref = `/tours?destination=${encodeURIComponent(pkg.destination)}`;
                  return (
                    <div key={pkg.id} style={{ flex: '0 0 350px', scrollSnapAlign: 'start' }}>
                      <article style={{
                        background: 'var(--color-bg-card)',
                        borderRadius: 20,
                        overflow: 'hidden',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 4px 20px rgba(15,23,42,0.05)',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      className="package-card-hover"
                      >
                        {/* Image Area */}
                        <div style={{ position: 'relative', height: 210, width: '100%', overflow: 'hidden' }}>
                          <img
                            src={pkg.image}
                            alt={pkg.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                            className="package-card-img"
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.6) 100%)' }} />
                          
                          {/* Duration Tag */}
                          <span style={{
                            position: 'absolute', top: 16, right: 16,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                            color: 'white', borderRadius: 999, padding: '4px 12px',
                            fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)'
                          }}>
                            {pkg.nights} Nights
                          </span>

                          {/* Destination Name tag */}
                          <span style={{
                            position: 'absolute', bottom: 16, left: 16,
                            background: 'var(--color-secondary)', color: 'white',
                            borderRadius: 999, padding: '4px 12px',
                            fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5
                          }}>
                            {pkg.destination}
                          </span>
                        </div>

                        {/* Content Area */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                          <h4 style={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 750,
                            fontSize: 16,
                            color: 'var(--color-text-primary)',
                            lineHeight: 1.4,
                            marginBottom: 10,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: 44
                          }}>
                            {pkg.title}
                          </h4>

                          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style={{ color: 'var(--color-primary)' }}>
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            {pkg.locations.slice(0, 2).join(' · ')}
                          </p>

                          <div style={{ marginTop: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 16, marginBottom: 18 }}>
                              <div>
                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Starts from</span>
                                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 850, fontSize: 22, color: 'var(--color-text-primary)' }}>
                                  ₹{pkg.price.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '4px 10px', borderRadius: 8 }}>
                                ★ {pkg.rating}
                              </span>
                            </div>

                            {/* CTA Buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <Link href={packageHref} style={{
                                background: 'var(--color-bg-soft)', color: 'var(--color-text-secondary)',
                                borderRadius: 12, padding: '12px 0', textDecoration: 'none',
                                fontWeight: 700, fontSize: 13, textAlign: 'center', transition: 'all 0.2s',
                                border: '1px solid var(--color-border)'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-soft)'}
                              >
                                Details
                              </Link>
                              <button
                                onClick={triggerInquiry}
                                style={{
                                  background: 'var(--color-primary)', color: 'white', border: 'none',
                                  borderRadius: 12, padding: '12px 0', cursor: 'pointer',
                                  fontWeight: 750, fontSize: 13, transition: 'all 0.2s',
                                  boxShadow: '0 4px 14px color-mix(in srgb, var(--color-primary) 20%, transparent)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                              >
                                Inquire Now
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .packages-scroll-container::-webkit-scrollbar {
          display: none;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        :global(.package-card-hover:hover) {
          transform: translateY(-8px);
          box-shadow: 0 20px 35px rgba(15,23,42,0.1) !important;
          border-color: color-mix(in srgb, var(--color-primary) 30%, transparent) !important;
        }
        :global(.package-card-hover:hover .package-card-img) {
          transform: scale(1.06);
        }
      `}</style>
    </section>
  );
}
