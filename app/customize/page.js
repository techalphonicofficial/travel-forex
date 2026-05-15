'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DestinationPicker from '@/components/DestinationPicker';

// Mock Data
const DESTINATIONS = [
  { name: 'Vietnam', subtitle: 'LAND OF ASCENDING DRAGON', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80' },
  { name: 'Bali', subtitle: 'CULTURAL PARADISE', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80' },
  { name: 'Thailand', subtitle: 'THE KINGDOM OF', img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=400&q=80' },
  { name: 'Japan', subtitle: 'LAND OF RISING SUN', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80' },
  { name: 'Maldives', subtitle: 'CREATE MEMORIES IN', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=80' },
  { name: 'Australia', subtitle: 'LAND OF DOWN UNDER', img: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400&q=80' },
  { name: 'Singapore', subtitle: 'THE LION CITY', img: 'https://images.unsplash.com/photo-1525625299374-eb3405d52156?w=400&q=80' }
];

const TRAVELLERS = [
  { name: 'Couple', img: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&q=80' },
  { name: 'Family', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80' },
  { name: 'Friends', img: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=400&q=80' },
  { name: 'Solo', img: 'https://images.unsplash.com/photo-1506869640319-fea1a2753689?w=400&q=80' },
  { name: 'Senior citizen', img: 'https://images.unsplash.com/photo-1518155317743-a8ff43ca6f5f?w=400&q=80' }
];

const DURATIONS = ['3-4 Days', '5-6 Days', '7-8 Days', '9-15 Days'];

const AIRPORTS = [
  'Bengaluru, BLR', 'Chennai, MAA', 'New Delhi, DEL', 'Mumbai, BOM',
  'Hyderabad, HYD', 'Trivandrum, TRV', 'Ahmedabad, AMD', 'Kolkata, CCU'
];

// Complex Cities Data
const REGION_CITIES = [
  { name: 'Ubud', subtitle: 'The cultural homeland.', type: 'BUDGET', tags: ['MUST SEE', 'THEME PARKS'], img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=400&q=80' },
  { name: 'Nusa Dua', subtitle: 'Gateway to exquisite luxury.', type: 'BUDGET', tags: ['MUST SEE', 'THEME PARKS'], img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80' },
  { name: 'Kuta', subtitle: 'Hotspot for surfers', type: 'BUDGET', tags: ['MUST SEE', 'THEME PARKS'], img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80' },
  { name: 'Canggu', subtitle: 'Canggu', type: 'BUDGET', tags: ['MUST SEE', 'THEME PARKS'], img: 'https://images.unsplash.com/photo-1551183053-ec9180cbd78e?w=400&q=80' },
  { name: 'Manggis', subtitle: 'Indonesia', type: 'BUDGET', tags: [], img: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&q=80' },
  { name: 'Sanur', subtitle: 'Indonesia', type: 'BUDGET', tags: [], img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=80' },
  { name: 'Labuan Bajo', subtitle: 'Indonesia', type: 'BUDGET', tags: [], img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80' },
  { name: 'Tulamben', subtitle: 'Indonesia', type: 'BUDGET', tags: [], img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80' },
];

export default function CustomizeFlow() {
  const [step, setStep] = useState(0);
  const [subStep, setSubStep] = useState(''); // 'room-config', 'login-modal'
  const [calendarBaseDate, setCalendarBaseDate] = useState(new Date(2026, 2, 1)); // March 2026 base

  const [data, setData] = useState({
    destination: '',
    travelWith: '',
    rooms: [{ id: 1, adults: 2, children: 0, childAges: [] }],
    duration: '',
    departureCity: '',
    departureDate: '',
    cities: []
  });

  // Load from URL Params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dest = params.get('dest');
      const trav = params.get('traveller');

      if (dest || trav) {
        let destStr = dest || '';
        // Titlecase destination simply for UI neatness
        if (destStr) destStr = destStr.charAt(0).toUpperCase() + destStr.slice(1);

        setData(d => ({ ...d, destination: destStr, travelWith: trav || '' }));

        if (dest && trav) {
          if (trav === 'Couple') {
            setData(d => ({ ...d, destination: destStr, travelWith: trav, rooms: [{ id: 1, adults: 2, children: 0, childAges: [] }] }));
            setStep(2); // Go to Duration
          } else if (trav === 'Solo') {
            setData(d => ({ ...d, destination: destStr, travelWith: trav, rooms: [{ id: 1, adults: 1, children: 0, childAges: [] }] }));
            setStep(2); // Go to Duration
          } else {
            setStep(1); // Go to traveller to pop room config
            setSubStep('room-config');
          }
        } else if (dest) {
          setStep(1); // Go to traveller
        } else if (trav) {
          setStep(0); // Need destination still
        }
      }
    }
  }, []);

  // Navigation Handlers
  const goNext = (overrideStep = null) => setStep(prev => overrideStep !== null ? overrideStep : prev + 1);

  const handleDestination = (dest) => {
    setData(d => {
      const updated = { ...d, destination: dest };
      if (updated.travelWith) {
        if (updated.travelWith === 'Couple') {
          updated.rooms = [{ id: 1, adults: 2, children: 0, childAges: [] }];
          setStep(2);
        } else if (updated.travelWith === 'Solo') {
          updated.rooms = [{ id: 1, adults: 1, children: 0, childAges: [] }];
          setStep(2);
        } else {
          setStep(1);
          setSubStep('room-config');
        }
      } else {
        setStep(1);
      }
      return updated;
    });
  };

  const handleTravellerType = (type) => {
    setData(d => ({ ...d, travelWith: type }));
    if (type === 'Couple') {
      setData(d => ({ ...d, rooms: [{ id: 1, adults: 2, children: 0, childAges: [] }] }));
      goNext();
    } else if (type === 'Solo') {
      setData(d => ({ ...d, rooms: [{ id: 1, adults: 1, children: 0, childAges: [] }] }));
      goNext();
    } else {
      setSubStep('room-config');
    }
  };

  const updateRoom = (roomId, field, val) => {
    setData(d => {
      const newRooms = d.rooms.map(r => {
        if (r.id === roomId) {
          const updated = { ...r, [field]: val };
          if (field === 'children') {
            const currentAges = updated.childAges || [];
            updated.childAges = Array(val).fill(3).map((_, i) => currentAges[i] || 3);
          }
          return updated;
        }
        return r;
      });
      return { ...d, rooms: newRooms };
    });
  };

  const removeRoom = (roomId) => {
    setData(d => {
      if (d.rooms.length <= 1) return d;
      const newRooms = d.rooms.filter(r => r.id !== roomId);
      return { ...d, rooms: newRooms };
    });
  };

  const handleRoomConfigSave = () => { setSubStep(''); goNext(); };
  const handleDuration = (dur) => { setData(d => ({ ...d, duration: dur })); goNext(); };
  const handleCity = (city) => { setData(d => ({ ...d, departureCity: city })); goNext(); };
  const handleDate = (date) => { setData(d => ({ ...d, departureDate: date })); goNext(); };

  const handleCityToggle = (cityName) => {
    setData(d => {
      const exists = d.cities.includes(cityName);
      const newCities = exists ? d.cities.filter(c => c !== cityName) : [...d.cities, cityName];
      return { ...d, cities: newCities };
    });
  };

  // 1-Based Breadcrumbs
  const BREADCRUMBS = [
    { label: data.destination || 'Destination', active: step === 0 },
    { label: data.travelWith ? `${data.travelWith} (${data.rooms.reduce((acc, r) => acc + r.adults + r.children, 0)} Pax, ${data.rooms.length} Room)` : 'Travellers', active: step === 1 },
    { label: data.duration || 'Duration', active: step === 2 },
    { label: data.departureCity ? data.departureCity.split(',')[0] : 'Departure City', active: step === 3 },
    { label: data.departureDate || 'Departure Date', active: step === 4 },
    { label: data.cities.length ? `${data.cities.length} Citys` : 'Cities', active: step === 5 },
  ];

  /* ─────────────────────────────────────────────────────────────────
     Step 1: Destination
  ───────────────────────────────────────────────────────────────── */
  const renderDestination = () => (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <DestinationPicker onPick={handleDestination} />
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     Step 2: Travellers & Room Config
  ───────────────────────────────────────────────────────────────── */
  const renderTravellers = () => {
    if (subStep === 'room-config') {
      return (
        <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 40, fontFamily: 'Poppins, sans-serif' }}>Select your rooms</h2>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {data.rooms.map((r, index) => (
              <div key={r.id} style={{ border: '1px solid #fef08a', borderRadius: 12, padding: 24, background: '#fefce8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: 0, letterSpacing: 1 }}>ROOM {index + 1}</p>
                  {index > 0 && (
                    <button onClick={() => removeRoom(r.id)} style={{ border: 'none', background: 'transparent', color: '#e11d48', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>REMOVE</button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>Adults</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => updateRoom(r.id, 'adults', Math.max(1, r.adults - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 18 }}>-</button>
                    <span style={{ fontSize: 16, fontWeight: 600, width: 20, textAlign: 'center' }}>{r.adults}</span>
                    <button onClick={() => updateRoom(r.id, 'adults', r.adults + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 18 }}>+</button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', display: 'block' }}>Children</span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>0 to 15 yrs</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => updateRoom(r.id, 'children', Math.max(0, r.children - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 18 }}>-</button>
                    <span style={{ fontSize: 16, fontWeight: 600, width: 20, textAlign: 'center' }}>{r.children}</span>
                    <button onClick={() => updateRoom(r.id, 'children', r.children + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 18 }}>+</button>
                  </div>
                </div>

                {r.children > 0 && r.childAges.map((age, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px dashed #d1d5db' }}>
                    <span style={{ fontSize: 14, color: '#4b5563' }}>Age of Child {i + 1}</span>
                    <select value={age} onChange={(e) => {
                      const newAges = [...r.childAges]; newAges[i] = parseInt(e.target.value); updateRoom(r.id, 'childAges', newAges);
                    }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', outline: 'none' }}>
                      {[...Array(16)].map((_, idx) => <option key={idx} value={idx}>{idx} {idx <= 1 ? 'Year' : 'Years'}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <button onClick={() => setData(d => ({ ...d, rooms: [...d.rooms, { id: Date.now(), adults: 2, children: 0, childAges: [] }] }))}
                style={{ flex: 1, padding: 16, borderRadius: 8, border: '1px solid #026eb5', background: '#ecfdf5', color: '#026eb5', fontWeight: 700, cursor: 'pointer' }}>+ Add new room</button>
              <button onClick={handleRoomConfigSave} style={{ flex: 1, padding: 16, borderRadius: 8, border: 'none', background: '#026eb5', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Save & Proceed</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div style={{ textAlign: 'center', maxWidth: 1000, margin: '40px auto', animation: 'fadeIn 0.3s' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 40px', fontFamily: 'Poppins, sans-serif' }}>Who are you travelling with?</h2>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {TRAVELLERS.map(t => (
            <div key={t.name} onClick={() => handleTravellerType(t.name)}
              style={{ width: 140, padding: 10, borderRadius: 16, border: '1px solid #e5e7eb', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: 120, height: 120, borderRadius: '60px 60px 10px 10px', overflow: 'hidden', marginBottom: 12 }}>
                <img src={t.img} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#1f2937' }}>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────────
     Step 3: Duration
  ───────────────────────────────────────────────────────────────── */
  const renderDuration = () => (
    <div style={{ textAlign: 'center', maxWidth: 800, margin: '40px auto', animation: 'fadeIn 0.3s' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 40px', fontFamily: 'Poppins, sans-serif' }}>What's the duration of your holiday?</h2>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        {DURATIONS.map((dur, i) => (
          <div key={dur} onClick={() => handleDuration(dur)}
            style={{ width: 140, padding: 30, borderRadius: '70px 70px 20px 20px', border: '1px solid #e5e7eb', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', cursor: 'pointer', position: 'relative', height: 180, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ position: 'absolute', top: 50, fontSize: 40 }}>🧳</div>
            {i === 1 && <div style={{ position: 'absolute', top: -12, background: '#026eb5', color: 'white', fontSize: 10, padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>OUR PICK</div>}
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1f2937' }}>{dur}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     Step 4: Departure City
  ───────────────────────────────────────────────────────────────── */
  const renderDepartureCity = () => (
    <div style={{ maxWidth: 600, margin: '40px auto', animation: 'fadeIn 0.3s' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 30px', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>Where are you travelling from?</h2>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <input type="text" placeholder="Search airports" style={{ width: '100%', padding: '16px 24px', paddingLeft: 48, borderRadius: 12, border: '2px solid #fdce2e', fontSize: 16, outline: 'none' }} />
        <svg style={{ position: 'absolute', left: 16, top: 18, color: '#9ca3af' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
      </div>
      <div style={{ background: 'white', borderTop: '1px solid #e5e7eb' }}>
        {AIRPORTS.map(city => (
          <div key={city} onClick={() => handleCity(city)}
            style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 500, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            {city}
          </div>
        ))}
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     Step 5: Departure Date (Triple Calendar View)
  ───────────────────────────────────────────────────────────────── */
  const renderDepartureDate = () => {
    const changeMonth = (dir) => {
      setCalendarBaseDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + dir);
        return newDate;
      });
    };

    const renderMonth = (dateObj, greenDates, yellowDates) => {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthStr = monthNames[dateObj.getMonth()];
      const year = dateObj.getFullYear();

      const startDay = new Date(year, dateObj.getMonth(), 1).getDay();
      const daysInMonth = new Date(year, dateObj.getMonth() + 1, 0).getDate();

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const blanks = Array.from({ length: startDay }, (_, i) => i);
      const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      return (
        <div style={{ flex: 1, minWidth: 260 }}>
          <h4 style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, margin: '0 0 20px' }}>
            {monthStr} <span style={{ color: '#6b7280', fontWeight: 400 }}>· {year}</span>
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 12, textAlign: 'center' }}>
            {days.map(d => <div key={d} style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 4px', textAlign: 'center' }}>
            {blanks.map(b => <div key={`blank-${b}`} />)}
            {dates.map(date => {
              const tg = greenDates.includes(date);
              const ty = yellowDates.includes(date);
              const borderCol = tg ? '#f59e0b' : (ty ? '#f59e0b' : 'transparent');
              const textCol = (tg || ty) ? '#111827' : '#6b7280';
              return (
                <div key={date} onClick={() => handleDate(`${monthStr} ${date}, ${year}`)}
                  style={{
                    height: 32, width: 32, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: textCol,
                    border: `1.5px solid ${borderCol}`,
                    background: tg ? '#ecfdf5' : (ty ? '#fffbeb' : 'transparent'),
                    transition: 'all 0.2s'
                  }}>
                  {date}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const months = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(calendarBaseDate);
      d.setMonth(d.getMonth() + i);
      months.push(d);
    }

    return (
      <div style={{ maxWidth: 1000, margin: '40px auto', animation: 'fadeIn 0.3s' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 30px', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>When is your departure date?</h2>

        <div style={{ background: 'white', padding: '32px 40px', borderRadius: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative' }}>
          {/* Navigation Arrows */}
          <div
            onClick={() => changeMonth(-1)}
            style={{ position: 'absolute', left: 24, top: 32, width: 28, height: 28, borderRadius: '50%', background: '#ecfdf5', color: '#026eb5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', zIndex: 10 }}>❮</div>
          <div
            onClick={() => changeMonth(1)}
            style={{ position: 'absolute', right: 24, top: 32, width: 28, height: 28, borderRadius: '50%', background: '#ecfdf5', color: '#026eb5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', zIndex: 10 }}>❯</div>

          <div style={{ display: 'flex', gap: 40, justifyContent: 'space-between', padding: '0 20px' }}>
            {months.map((m, idx) => (
              <div key={idx} style={{ flex: 1 }}>
                {renderMonth(m, [2, 3, 4, 9, 10, 16, 17, 21, 22, 25], [1, 6, 7, 12, 13, 20, 23])}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #026eb5' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Low crowd</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #f59e0b' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>High Crowd</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────────
     Step 6: Cities Grid 
  ───────────────────────────────────────────────────────────────── */
  const renderCities = () => (
    <div style={{ maxWidth: 1100, margin: '40px auto', textAlign: 'center', animation: 'fadeIn 0.3s', paddingBottom: 100 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 30px', fontFamily: 'Poppins, sans-serif' }}>Choose cities</h2>

      <div style={{ margin: '0 auto 40px', maxWidth: 600, position: 'relative' }}>
        <input type="text" placeholder="Find a city" style={{ width: '100%', padding: '16px 24px', paddingLeft: 48, borderRadius: 12, border: '2px solid #fdce2e', fontSize: 16, outline: 'none' }} />
        <svg style={{ position: 'absolute', left: 20, top: 18, color: '#9ca3af' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
        {REGION_CITIES.map(c => {
          const selected = data.cities.includes(c.name);
          return (
            <div key={c.name} onClick={() => handleCityToggle(c.name)}
              style={{
                width: 220, background: 'white', borderRadius: '110px 110px 16px 16px', overflow: 'hidden',
                border: selected ? '2px solid #026eb5' : '1px solid #e5e7eb',
                boxShadow: selected ? '0 8px 20px rgba(16,185,129,0.15)' : '0 4px 12px rgba(0,0,0,0.04)',
                cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
              }}>
              <div style={{ height: 200, width: '100%', borderRadius: '110px 110px 0 0', overflow: 'hidden' }}>
                <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {/* {selected && (
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, background: '#026eb5', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✓</div>
                )} */}
              </div>
              <div style={{ padding: '20px 16px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#111827' }}>{c.name},</h4>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280' }}>{c.subtitle}</p>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#026eb5', letterSpacing: 1, marginBottom: 12 }}>{c.type}</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {c.tags.map(tag => (
                    <span key={tag} style={{ background: '#fef3c7', color: '#92400e', fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 999, border: '1px dashed #f59e0b' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Black Action Bar */}
      {data.cities.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          background: '#0a0a0a', display: 'flex', alignItems: 'center', padding: '12px 16px',
          borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', zIndex: 100,
          animation: 'fadeIn 0.3s'
        }}>


          <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between'>
            <div className='d-flex align-items-center'>
              {/* Overlapping Avatars */}
              <div className='d-flex align-items-center' style={{ marginRight: 16, width: 32, height: 32 }}>
                {data.cities.slice(0, 3).map((cityName, idx) => {
                  const cityImg = REGION_CITIES.find(c => c.name === cityName)?.img;
                  return (
                    <img key={cityName} src={cityImg} style={{
                      width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
                      border: '2px solid #0a0a0a', marginLeft: idx > 0 ? -12 : 0, zIndex: 3 - idx
                    }} alt="City" />
                  );
                })}
                {data.cities.length > 3 && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#374151', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, border: '2px solid #0a0a0a', marginLeft: -8, zIndex: 0, padding: '8px' }}>
                    +{data.cities.length - 3}
                  </div>
                )}
              </div>

              <div style={{ color: 'white', fontSize: 13, fontWeight: 500, marginRight: 24, marginLeft: 32, whiteSpace: 'nowrap' }}>
                {data.cities.length > 2 ? 'Itinerary could overshoot by 4 days' : `${data.cities[data.cities.length - 1]}! Great choice, keep adding`}
              </div>

            </div>
            <div>
              <button onClick={() => setSubStep('edit-cities')} style={{ background: '#e5e7eb', color: '#111827', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
                Edit
              </button>
              <button onClick={() => setSubStep('login-modal')} style={{ background: '#026eb5', color: 'white', border: 'none', padding: '8px 24px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Build itinerary
              </button>

            </div>

          </div>


        </div>
      )}
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     Modal: Edit Cities
  ───────────────────────────────────────────────────────────────── */
  const renderEditCitiesModal = () => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setSubStep('')} />

      <div style={{ position: 'relative', width: 500, maxHeight: '80vh', background: 'white', borderRadius: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
          <button onClick={() => setSubStep('')} style={{ position: 'absolute', top: 20, right: 20, width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: '1px solid #d1d5db', fontSize: 14, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px', fontFamily: 'Poppins, sans-serif' }}>Cities you will be visiting</h2>
          {data.cities.length > 2 && (
            <>
              <p style={{ color: '#e11d48', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Itinerary could overshoot by 4 days</p>
              <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>Try removing a few cities to keep the duration under 3-4 days.</p>
            </>
          )}
        </div>

        {/* Scrollable List */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.cities.map(cityName => {
              const cityObj = REGION_CITIES.find(c => c.name === cityName);
              return (
                <div key={cityName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <img src={cityObj?.img} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt={cityName} />
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{cityName}, <span style={{ fontWeight: 400 }}>Indonesia</span></p>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{cityObj?.subtitle}</p>
                    </div>
                  </div>
                  <button onClick={() => handleCityToggle(cityName)} style={{ width: 28, height: 28, borderRadius: 8, background: 'transparent', border: '1px solid #d1d5db', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     Final Mobile Number Modal
  ───────────────────────────────────────────────────────────────── */
  const renderLoginModal = () => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSubStep('')} />

      <div style={{ position: 'relative', width: 800, height: 450, background: 'white', borderRadius: 16, display: 'flex', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

        {/* Left Side Branding */}
        <div style={{
          width: '45%', background: '#026eb5', padding: 40, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
          {/* Radial Rays Background Mock */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'repeating-conic-gradient(from 0deg, transparent 0deg 10deg, #fff 10deg 20deg)' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
              <img src="./logooo.png" alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
            </div>
            <h3 style={{ color: 'white', fontSize: 22, fontWeight: 500, margin: '0 0 10px', letterSpacing: 1 }}>YOUR</h3>
            <h2 style={{ color: '#fef08a', fontSize: 36, fontWeight: 900, margin: '0 0 16px', lineHeight: 1.1, textShadow: '0 4px 12px rgba(0,0,0,0.3)', fontFamily: 'Poppins, sans-serif' }}>
              SOOPER HIT<br />HOLIDAY
            </h2>
            <h3 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: 1 }}>STARTS HERE</h3>
          </div>
        </div>

        {/* Right Side Form */}
        <div style={{ width: '55%', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <button onClick={() => setSubStep('')} style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', border: 'none', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', color: '#6b7280' }}>✕</button>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 500, color: '#111827', margin: '0 0 24px', lineHeight: 1.4 }}>Enter mobile number to<br />save itinerary</h2>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 60, height: 48, borderRadius: 8, border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500 }}>+91</div>
              <input type="tel" placeholder="Enter your mobile number" style={{ flex: 1, height: 48, borderRadius: 8, border: '1px solid #d1d5db', padding: '0 16px', fontSize: 16, outline: 'none' }} />
            </div>

            <button onClick={() => alert("Itinerary Saved! Redirecting to Dashboard...")} style={{ width: '100%', padding: 16, borderRadius: 8, background: '#fbbf24', color: '#fff', border: '1px dashed #059669', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#026eb5'; e.currentTarget.style.color = 'white'; e.currentTarget.style.border = 'none'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fbbf24'; e.currentTarget.style.color = 'white'; e.currentTarget.style.border = '1px dashed #059669'; }}>
              View customized itinerary
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes segPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(2,110,181,0.5); } 50% { box-shadow: 0 0 0 4px rgba(2,110,181,0); } }

        /* ── DESKTOP header ── */
        .cust-header {
          background: #111827;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 999;
          gap: 12px;
        }
        .cust-logo { width: 96px; height: 96px; object-fit: contain; flex-shrink: 0; }
        .cust-breadcrumbs {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          font-size: 13px; font-weight: 500;
          overflow-x: auto; flex: 1;
          scrollbar-width: none; -ms-overflow-style: none;
          white-space: nowrap; padding: 4px 0;
        }
        .cust-breadcrumbs::-webkit-scrollbar { display: none; }
        .cust-crumb-item { display: inline-flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .cust-close {
          width: 28px; height: 28px; background: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          text-decoration: none; color: #111827; font-weight: 700; font-size: 14px; flex-shrink: 0;
        }

        /* ── MOBILE header – hidden on desktop ── */
        .cust-mobile-header { display: none; }

        @media (max-width: 767.98px) {
          /* Hide desktop breadcrumb bar, show mobile header */
          .cust-header { display: none; }
          .cust-mobile-header {
            display: flex;
            flex-direction: column;
            background: #0d1117;
            position: sticky;
            top: 0;
            z-index: 999;
          }

          /* Top row */
          .cust-mob-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            gap: 10px;
          }
          .cust-mob-logo {
            width: 44px; height: 44px; object-fit: contain; flex-shrink: 0;
            border-radius: 8px;
          }
          .cust-mob-title {
            flex: 1;
            text-align: center;
          }
          .cust-mob-title-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #4b5563;
            margin-bottom: 1px;
          }
          .cust-mob-title-step {
            font-size: 14px;
            font-weight: 700;
            color: white;
            font-family: Poppins, sans-serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .cust-mob-close {
            width: 30px; height: 30px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            text-decoration: none;
            color: white;
            font-size: 13px;
            font-weight: 700;
            flex-shrink: 0;
            backdrop-filter: blur(4px);
          }

          /* Segmented progress track */
          .cust-mob-progress {
            display: flex;
            align-items: center;
            gap: 3px;
            padding: 0 16px 10px;
          }
          .cust-seg {
            flex: 1;
            height: 3px;
            border-radius: 999px;
            background: rgba(255,255,255,0.1);
            transition: background 0.35s ease, box-shadow 0.35s ease;
            cursor: default;
            position: relative;
            overflow: hidden;
          }
          .cust-seg.done {
            background: rgba(2,110,181,0.55);
            cursor: pointer;
          }
          .cust-seg.done:active { opacity: 0.7; }
          .cust-seg.active {
            background: #026eb5;
            animation: segPulse 2s infinite;
          }
          /* Shimmer on active segment */
          .cust-seg.active::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
            animation: shimmer 1.8s infinite;
          }
          @keyframes shimmer {
            from { transform: translateX(-100%); }
            to   { transform: translateX(100%); }
          }

          /* Step counter badge */
          .cust-mob-badge {
            font-size: 10px;
            font-weight: 700;
            color: #026eb5;
            background: rgba(2,110,181,0.12);
            border: 1px solid rgba(2,110,181,0.3);
            border-radius: 999px;
            padding: 2px 8px;
            letter-spacing: 0.5px;
            flex-shrink: 0;
          }
        }
      `}</style>

      {subStep === 'login-modal' && renderLoginModal()}
      {subStep === 'edit-cities' && renderEditCitiesModal()}

      {/* ── DESKTOP Header ── */}
      <header className="cust-header">
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img
            src="/logooo.png"
            alt="Logo"
            className="cust-logo"
          />
        </Link>
        <div className="cust-breadcrumbs">
          {BREADCRUMBS.map((crumb, i) => (
            <div key={i} className="cust-crumb-item">
              <span
                style={{
                  color: crumb.active ? '#026eb5' : (i < step ? 'white' : '#6b7280'),
                  borderBottom: crumb.active ? '2px solid #026eb5' : 'none',
                  paddingBottom: 3,
                  cursor: i < step ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => { if (i < step) { setStep(i); setSubStep(''); } }}
              >
                {crumb.label}
              </span>
              {i < BREADCRUMBS.length - 1 && <span style={{ color: '#4b5563', flexShrink: 0 }}>·</span>}
            </div>
          ))}
        </div>
        <Link href="/" className="cust-close">✕</Link>
      </header>

      {/* ── MOBILE Header – unique step-tracker design ── */}
      <div className="cust-mobile-header">
        {/* Top row: Logo + current step title + close */}
        <div className="cust-mob-top">
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <img
              src="https://i.ibb.co/wNt195HZ/Whats-App-Image-2026-03-27-at-1-12-46-AM-1-copy-2.webp"
              alt="Logo"
              className="cust-mob-logo"
            />
          </Link>

          <div className="cust-mob-title">
            <div className="cust-mob-title-label">Step {step + 1} of {BREADCRUMBS.length}</div>
            <div className="cust-mob-title-step">{BREADCRUMBS[step]?.label}</div>
          </div>

          <Link href="/" className="cust-mob-close">✕</Link>
        </div>

        {/* Segmented progress bar */}
        <div className="cust-mob-progress">
          {BREADCRUMBS.map((_, i) => (
            <div
              key={i}
              className={`cust-seg${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}
              onClick={() => { if (i < step) { setStep(i); setSubStep(''); } }}
              title={BREADCRUMBS[i]?.label}
            />
          ))}
          <span className="cust-mob-badge">{step + 1}/{BREADCRUMBS.length}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px', position: 'relative' }}>
        {step === 0 && renderDestination()}
        {step === 1 && renderTravellers()}
        {step === 2 && renderDuration()}
        {step === 3 && renderDepartureCity()}
        {step === 4 && renderDepartureDate()}
        {step === 5 && renderCities()}
      </main>

      {/* Bottom Review Block */}
      {step < 5 && (
        <footer style={{ background: 'white', padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', maxWidth: 800 }}>
            <div style={{ display: 'flex', gap: 12, flex: 1 }}>
              <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} alt="User" />
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#4b5563', lineHeight: 1.4 }}>"This is my honest review of my experience with ITS TRAVELS AND TOURS whose services my partner and I used to book our memorable New Zealand honeymoon..."</p>
                <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: '#026eb5' }}>Tejas Kinger, New Zealand</p>
              </div>
            </div>
            <div style={{ width: 1, height: 40, background: '#e5e7eb' }} />
            <div style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>4.6 / 5</span>
                <span style={{ color: '#fbbf24', fontSize: 14 }}>★</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>8250 reviews</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
