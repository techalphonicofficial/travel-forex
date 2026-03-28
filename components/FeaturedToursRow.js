'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

/* ── Filter definitions ───────────────────────────────── */
const BUDGET_FILTERS = [
  { label: 'All Budgets', key: 'all' },
  { label: 'Under ₹50K', key: 'under50' },
  { label: '₹50K to ₹1.5L', key: '50to150' },
  { label: '₹1.5L to ₹2.5L', key: '150to250' },
  { label: 'Luxury', key: 'luxury' },
];

const DESTINATIONS = [
  'All Destinations',
  'Singapore',
  'Bali',
  'Europe',
  'Thailand',
  'Dubai',
  'Japan',
  'India',
];

/* priceCategory:
   under50   = < 50000
   50to150   = 50000 – 149999
   150to250  = 150000 – 249999
   luxury    = ≥ 250000
*/
const allBookings = [
  /* ── Under ₹50K ──────────────────────────────────────── */
  {
    id: 'b1',
    slug: 'goa-beach-paradise',
    dest: 'India',
    title: 'Weekend Escape: 3 Nights In Goa Beach Paradise',
    locations: ['North Goa (2N)', 'South Goa (1N)'],
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80',
    nights: 3, price: 18500, priceCategory: 'under50',
    type: 'COUPLE', typeColor: '#f97316',
    user: { name: 'Riya', city: 'Pune', avatar: 'R', avatarBg: '#f97316', ago: '1hr ago' },
  },
  {
    id: 'b2',
    slug: 'kochi-alleppey-getaway',
    dest: 'India',
    title: 'Budget Getaway: 4 Nights In Kochi & Alleppey',
    locations: ['Kochi (2N)', 'Alleppey (2N)'],
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80',
    nights: 4, price: 24900, priceCategory: 'under50',
    type: 'FAMILY', typeColor: '#6366f1',
    user: { name: 'Suresh', city: 'Chennai', avatar: 'S', avatarBg: '#6366f1', ago: '3hr ago' },
  },
  {
    id: 'b3',
    slug: 'manali-snow-trip',
    dest: 'India',
    title: 'Hill Station: 3 Nights In Manali Snow Trip',
    locations: ['Manali (3N)'],
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
    nights: 3, price: 32000, priceCategory: 'under50',
    type: 'ADVENTURE', typeColor: '#10b981',
    user: { name: 'Vikram', city: 'Delhi', avatar: 'V', avatarBg: '#10b981', ago: '4hr ago' },
  },
  {
    id: 'b4',
    slug: 'jaisalmer-jodhpur-magic',
    dest: 'India',
    title: 'Desert Magic: 4 Nights In Jaisalmer & Jodhpur',
    locations: ['Jaisalmer (2N)', 'Jodhpur (2N)'],
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80',
    nights: 4, price: 28500, priceCategory: 'under50',
    type: 'COUPLE', typeColor: '#f97316',
    user: { name: 'Anita', city: 'Jaipur', avatar: 'A', avatarBg: '#ec4899', ago: '6hr ago' },
  },
  {
    id: 'b5',
    slug: 'bangkok-city-break',
    dest: 'Thailand',
    title: 'Budget Thailand: 5 Nights Bangkok City Break',
    locations: ['Bangkok (5N)'],
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',
    nights: 5, price: 42000, priceCategory: 'under50',
    type: 'SOLO', typeColor: '#0ea5e9',
    user: { name: 'Kiran', city: 'Hyderabad', avatar: 'K', avatarBg: '#0ea5e9', ago: '8hr ago' },
  },
  {
    id: 'b6',
    slug: 'vietnam-backpacker',
    dest: 'Vietnam',
    title: 'Backpacker: 5 Nights In Vietnam Ho Chi Minh',
    locations: ['Ho Chi Minh (3N)', 'Hanoi (2N)'],
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80',
    nights: 5, price: 38000, priceCategory: 'under50',
    type: 'SOLO', typeColor: '#0ea5e9',
    user: { name: 'Rohan', city: 'Mumbai', avatar: 'R', avatarBg: '#8b5cf6', ago: '9hr ago' },
  },

  /* ── ₹50K–₹1.5L ──────────────────────────────────────── */
  {
    id: 'b7',
    slug: 'couple-retreat-bali',
    dest: 'Bali',
    title: 'Couple Retreat: 8 Nights In Seminyak And Ubud',
    locations: ['Ubud (3N)', '+1 more'],
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
    nights: 8, price: 75656, priceCategory: '50to150',
    type: 'COUPLE', typeColor: '#f97316',
    user: { name: 'Gaurav', city: 'Mumbai', avatar: 'G', avatarBg: '#f97316', ago: '10hr ago' },
  },
  {
    id: 'b8',
    slug: 'family-escape-thailand',
    dest: 'Thailand',
    title: 'Family Escape: 6 Nights In Bangkok And Pattaya',
    locations: ['Pattaya (3N)', '+1 more'],
    image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600&q=80',
    nights: 6, price: 50009, priceCategory: '50to150',
    type: 'FAMILY', typeColor: '#6366f1',
    user: { name: 'Hema', city: 'Chennai', avatar: 'H', avatarBg: '#6366f1', ago: '11hr ago' },
  },
  {
    id: 'b9',
    slug: 'japan-cherry-blossom',
    dest: 'Japan',
    title: 'Solo: 10 Nights Japan Cherry Blossom Tour',
    locations: ['Tokyo (4N)', '+3 more'],
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
    nights: 10, price: 145000, priceCategory: '50to150',
    type: 'SOLO', typeColor: '#0ea5e9',
    user: { name: 'Arjun', city: 'Hyderabad', avatar: 'A', avatarBg: '#0ea5e9', ago: '5hr ago' },
  },
  {
    id: 'b10',
    slug: 'singapore-sentosa-romantic',
    dest: 'Singapore',
    title: 'Romantic: 6 Nights In Singapore & Sentosa',
    locations: ['Singapore (4N)', 'Sentosa (2N)'],
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80',
    nights: 6, price: 89000, priceCategory: '50to150',
    type: 'COUPLE', typeColor: '#f97316',
    user: { name: 'Pooja', city: 'Bangalore', avatar: 'P', avatarBg: '#ec4899', ago: '2hr ago' },
  },
  {
    id: 'b11',
    slug: 'vietnam-cambodia-adventure',
    dest: 'Vietnam',
    title: 'Adventure: 7 Nights In Vietnam & Cambodia',
    locations: ['Hanoi (3N)', 'Siem Reap (4N)'],
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80',
    nights: 7, price: 64000, priceCategory: '50to150',
    type: 'ADVENTURE', typeColor: '#10b981',
    user: { name: 'Nikhil', city: 'Pune', avatar: 'N', avatarBg: '#10b981', ago: '14hr ago' },
  },
  {
    id: 'b12',
    slug: 'dubai-theme-parks',
    dest: 'Dubai',
    title: 'Family: 8 Nights In Dubai With Theme Parks',
    locations: ['Dubai (5N)', 'Abu Dhabi (3N)'],
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
    nights: 8, price: 110000, priceCategory: '50to150',
    type: 'FAMILY', typeColor: '#6366f1',
    user: { name: 'Ramesh', city: 'Kolkata', avatar: 'R', avatarBg: '#6366f1', ago: '20hr ago' },
  },

  /* ── ₹1.5L–₹2.5L ─────────────────────────────────────── */
  {
    id: 'b13',
    slug: 'swiss-alps-paris-adventure',
    dest: 'Europe',
    title: 'Adventure: 7 Nights In Swiss Alps And Paris',
    locations: ['Interlaken (3N)', '+2 more'],
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&q=80',
    nights: 7, price: 189000, priceCategory: '150to250',
    type: 'ADVENTURE', typeColor: '#10b981',
    user: { name: 'Priya', city: 'Bangalore', avatar: 'P', avatarBg: '#10b981', ago: '2hr ago' },
  },
  {
    id: 'b14',
    slug: 'europe-trail-france-italy',
    dest: 'Europe',
    title: 'Europe Trail: 10 Nights France Italy & Spain',
    locations: ['Paris (3N)', 'Rome (3N)', '+2 more'],
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
    nights: 10, price: 210000, priceCategory: '150to250',
    type: 'COUPLE', typeColor: '#f97316',
    user: { name: 'Deepak', city: 'Delhi', avatar: 'D', avatarBg: '#f97316', ago: '1hr ago' },
  },
  {
    id: 'b15',
    slug: 'australia-sydney-melbourne',
    dest: 'Australia',
    title: 'Family: 9 Nights Australia Sydney & Melbourne',
    locations: ['Sydney (4N)', 'Melbourne (5N)'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    nights: 9, price: 235000, priceCategory: '150to250',
    type: 'FAMILY', typeColor: '#6366f1',
    user: { name: 'Sneha', city: 'Mumbai', avatar: 'S', avatarBg: '#6366f1', ago: '3hr ago' },
  },
  {
    id: 'b16',
    slug: 'greece-honeymoon-santorini',
    dest: 'Europe',
    title: 'Honeymoon: 8 Nights Greece Santorini & Mykonos',
    locations: ['Santorini (4N)', 'Mykonos (4N)'],
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
    nights: 8, price: 195000, priceCategory: '150to250',
    type: 'COUPLE', typeColor: '#f97316',
    user: { name: 'Rahul', city: 'Hyderabad', avatar: 'R', avatarBg: '#ec4899', ago: '5hr ago' },
  },
  {
    id: 'b17',
    slug: 'safari-south-africa-kruger',
    dest: 'Africa',
    title: 'Safari: 8 Nights South Africa Cape Town & Kruger',
    locations: ['Cape Town (4N)', 'Kruger (4N)'],
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80',
    nights: 8, price: 220000, priceCategory: '150to250',
    type: 'ADVENTURE', typeColor: '#10b981',
    user: { name: 'Arun', city: 'Chennai', avatar: 'A', avatarBg: '#10b981', ago: '7hr ago' },
  },
  {
    id: 'b18',
    slug: 'canada-vancouver-banff-niagara',
    dest: 'Canada',
    title: 'Canada: 10 Nights Vancouver Banff & Niagara',
    locations: ['Vancouver (3N)', 'Banff (4N)', '+1 more'],
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80',
    nights: 10, price: 245000, priceCategory: '150to250',
    type: 'FAMILY', typeColor: '#6366f1',
    user: { name: 'Meena', city: 'Pune', avatar: 'M', avatarBg: '#8b5cf6', ago: '12hr ago' },
  },

  /* ── Luxury (₹2.5L+) ──────────────────────────────────── */
  {
    id: 'b19',
    slug: 'maldives-lucerne-escape',
    dest: 'Europe',
    title: 'Couple Escape: 8 Nights In Maldives And Lucerne',
    locations: ['Zurich (2N)', '+2 more'],
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=80',
    nights: 8, price: 325000, priceCategory: 'luxury',
    type: 'COUPLE', typeColor: '#f97316',
    user: { name: 'Mayank', city: 'Delhi', avatar: 'M', avatarBg: '#ec4899', ago: '13hr ago' },
  },
  {
    id: 'b20',
    slug: 'new-zealand-royal-island',
    dest: 'New Zealand',
    title: 'Royal: 10 Nights New Zealand North & South Island',
    locations: ['Auckland (3N)', 'Queenstown (4N)', '+1 more'],
    image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80',
    nights: 10, price: 380000, priceCategory: 'luxury',
    type: 'COUPLE', typeColor: '#f97316',
    user: { name: 'Leela', city: 'Chennai', avatar: 'L', avatarBg: '#f59e0b', ago: '4hr ago' },
  },
  {
    id: 'b21',
    slug: 'seychelles-mauritius-hop',
    dest: 'Seychelles',
    title: 'Luxury: 12 Nights Seychelles & Mauritius Island Hop',
    locations: ['Mahé (5N)', 'Mauritius (7N)'],
    image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80',
    nights: 12, price: 450000, priceCategory: 'luxury',
    type: 'LUXURY', typeColor: '#f59e0b',
    user: { name: 'Kavitha', city: 'Chennai', avatar: 'K', avatarBg: '#f59e0b', ago: '7hr ago' },
  },
  {
    id: 'b22',
    dest: 'USA',
    title: 'Opulent: 14 Nights USA New York LA & Vegas',
    locations: ['New York (4N)', 'Las Vegas (4N)', '+2 more'],
    image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
    nights: 14, price: 520000, priceCategory: 'luxury',
    type: 'LUXURY', typeColor: '#f59e0b',
    user: { name: 'Aditya', city: 'Mumbai', avatar: 'A', avatarBg: '#f59e0b', ago: '9hr ago' },
  },
  {
    id: 'b23',
    dest: 'Japan',
    title: 'Elite: 10 Nights Japan Private Tour With Ryokan',
    locations: ['Tokyo (4N)', 'Kyoto (3N)', '+1 more'],
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
    nights: 10, price: 395000, priceCategory: 'luxury',
    type: 'LUXURY', typeColor: '#f59e0b',
    user: { name: 'Shweta', city: 'Delhi', avatar: 'S', avatarBg: '#8b5cf6', ago: '15hr ago' },
  },
  {
    id: 'b24',
    dest: 'Europe',
    title: 'Grand: 15 Nights Europe 7 Countries Luxury Rail',
    locations: ['London (3N)', 'Paris (2N)', '+5 more'],
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&q=80',
    nights: 15, price: 680000, priceCategory: 'luxury',
    type: 'LUXURY', typeColor: '#f59e0b',
    user: { name: 'Harish', city: 'Bangalore', avatar: 'H', avatarBg: '#026eb5', ago: '20hr ago' },
  },
];

/* ── Custom Dropdown Component ────────────────────────── */
function DestinationDropdown({ currentDest, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 16px', borderRadius: 999,
          border: open ? '1.5px solid #026eb5' : '1.5px solid #d1d5db',
          background: 'white',
          color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.2s',
          boxShadow: open ? '0 0 0 3px rgba(20,83,45,0.1)' : 'none',
        }}
      >
        {currentDest}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          background: 'white', border: '1px solid #e5e7eb',
          borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          minWidth: 200, zIndex: 50, padding: '8px 0',
          animation: 'fadeSlideIn 0.2s ease',
        }}>
          {DESTINATIONS.map((d, i) => {
            const isActive = d === currentDest;
            return (
              <button
                key={d}
                onClick={() => {
                  onChange(d);
                  setOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '10px 18px',
                  background: 'none', border: 'none',
                  borderBottom: i < DESTINATIONS.length - 1 ? '1px solid #f3f4f6' : 'none',
                  textAlign: 'left', cursor: 'pointer',
                  color: '#1f2937', fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Radio circle matching screenshot */}
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: isActive ? '2px solid #16a34a' : '1.5px solid #d1d5db',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />}
                </div>
                {d}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Filter logic ─────────────────────────────────────── */
function filterBookings(budgetStr, destStr) {
  let list = allBookings;
  if (budgetStr !== 'all') {
    list = list.filter(b => b.priceCategory === budgetStr);
  }
  if (destStr !== 'All Destinations') {
    list = list.filter(b => b.dest === destStr);
  }
  return list;
}

/* ── Main component ───────────────────────────────────── */
export default function RecommendedPackages() {
  const [activeBudget, setActiveBudget] = useState('all');
  const [activeDest, setActiveDest] = useState('All Destinations');
  const [visible, setVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth <= 768);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const filtered = filterBookings(activeBudget, activeDest);

  const handleBudgetSort = (key) => {
    if (key === activeBudget) return;
    setVisible(false);
    setTimeout(() => {
      setActiveBudget(key);
      setVisible(true);
      if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    }, 180);
  };

  const handleDestChange = (dest) => {
    if (dest === activeDest) return;
    setVisible(false);
    setTimeout(() => {
      setActiveDest(dest);
      setVisible(true);
      if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    }, 180);
  };

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const scrollAmount = isMobile ? (scrollRef.current.offsetWidth - 10) : 328;
    scrollRef.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  };

  return (
    <section style={{ background: '#fff', padding: '52px 0 60px' }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .booking-cards-wrap {
          display: flex;
          gap: 18px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          transition: opacity 0.18s ease;
        }
        .booking-cards-wrap.hidden { opacity: 0; }
        .booking-cards-wrap.shown  { opacity: 1; }
        .booking-card-item {
          animation: fadeSlideIn 0.32s ease both;
        }

        @media (max-width: 768px) {
           .responsive-header-row {
             flex-direction: column;
             align-items: flex-start !important;
             gap: 24px !important;
           }
           .filters-container {
             width: 100%;
             order: 2;
           }
           .arrows-container {
             order: 3;
             margin-top: 8px;
           }
           .heading-container {
             order: 1;
           }
        }
      `}</style>

      <div className='container' style={{ margin: '0 auto', padding: '0 8px' }}>

        {/* ── Top row: left label + filters + arrows ── */}
        <div className="responsive-header-row" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>

          {/* Left label */}
          <div className="heading-container" style={{ flexShrink: 0, marginRight: 12 }}>
            <h2 style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 900, fontSize: 28,
              color: '#111827', margin: 0,
              lineHeight: 1.15,
              textTransform: 'uppercase',
              letterSpacing: -0.5,
            }}>
              RECENTLY<br />BOOKED<br />
              <span style={{ color: '#026eb5' }}>ITINERARIES</span>
            </h2>
            <div style={{
              marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff0f0', border: '1px solid #fecaca',
              borderRadius: 999, padding: '5px 12px', width: 'fit-content',
            }}>
              <span style={{ color: '#ef4444', fontSize: 14 }}>❤️</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>143+ trips booked last week</span>
            </div>
          </div>

          {/* Filter pills */}
          <div className="filters-container" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            {/* The Destination Dropdown */}
            <DestinationDropdown currentDest={activeDest} onChange={handleDestChange} />

            {BUDGET_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => handleBudgetSort(f.key)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 999,
                  border: activeBudget === f.key ? '2px solid #026eb5' : '1.5px solid #d1d5db',
                  background: activeBudget === f.key ? '#c5e5fb' : 'white',
                  color: activeBudget === f.key ? '#026eb5' : '#374151',
                  fontWeight: activeBudget === f.key ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Prev / Next arrows */}
          <div className="arrows-container" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {['‹', '›'].map((arrow, i) => (
              <button
                key={arrow}
                onClick={() => scroll(i === 0 ? -1 : 1)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1.5px solid #d1d5db',
                  background: 'white', color: '#374151', fontSize: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', lineHeight: 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; }}
              >
                {arrow}
              </button>
            ))}
          </div>
        </div>

        {/* ── Result count badge ── */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: '#c5e5fb', border: '1px solid #7abfee',
            color: '#026eb5', borderRadius: 999,
            padding: '3px 12px', fontSize: 12, fontWeight: 700,
          }}>
            {filtered.length} itineraries
          </span>
          <span style={{ color: '#9ca3af', fontSize: 12 }}>
            {activeDest === 'All Destinations' && activeBudget === 'all' ? 'showing all popular trips' : `filtered results`}
          </span>
        </div>

        {/* ── Cards horizontal scroll ── */}
        <div
          ref={scrollRef}
          className={`booking-cards-wrap ${visible ? 'shown' : 'hidden'}`}
        >
          {filtered.map((pkg, idx) => (
            <BookingCard
              key={pkg.id}
              pkg={pkg}
              animDelay={idx * 40}
              isMobile={isMobile}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

/* ── Single card ──────────────────────────────────────── */
function BookingCard({ pkg, animDelay, isMobile }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="booking-card-item"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: isMobile ? 'calc(100vw - 32px)' : 310,
        background: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        // boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.14)' : '0 2px 12px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'all 0.3s ease',
        animationDelay: `${animDelay}ms`,
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img
          src={pkg.image}
          alt={pkg.title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.45s ease',
            display: 'block',
          }}
          loading="lazy"
        />
        {/* Price ribbon */}
        {/* <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          color: 'white', borderRadius: 999,
          padding: '3px 10px', fontSize: 11, fontWeight: 700,
        }}>
          ₹{pkg.price.toLocaleString('en-IN')}
        </div> */}

        {/* User badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          borderRadius: 999,
          padding: '5px 12px 5px 5px',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: pkg.user.avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 11, color: 'white', flexShrink: 0,
          }}>
            {pkg.user.avatar}
          </div>
          <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>
            {pkg.user.name} from {pkg.user.city} · {pkg.user.ago}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        {/* Title */}
        <p style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 700,
          fontSize: 14, color: '#111827', margin: '0 0 6px',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {pkg.title}
        </p>

        {/* Location */}
        <p style={{
          fontSize: 12, color: '#6b7280', margin: '0 0 10px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <svg viewBox="0 0 24 24" fill="#6b7280" width="11" height="11">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          {pkg.locations.join(' · ')}
        </p>

        {/* Type badge + nights */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{
            display: 'inline-block',
            background: pkg.typeColor + '18',
            color: pkg.typeColor,
            border: `1px solid ${pkg.typeColor}40`,
            borderRadius: 6,
            padding: '2px 10px',
            fontSize: 10, fontWeight: 800,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}>
            {pkg.type}
          </span>
          <span style={{
            display: 'inline-block',
            background: '#f3f4f6',
            color: '#4b5563',
            borderRadius: 6,
            padding: '2px 9px',
            fontSize: 10, fontWeight: 700,
          }}>
            🌙 {pkg.nights} Nights
          </span>
        </div>

        {/* Price + CTA */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #f3f4f6',
          paddingTop: 12, gap: 8,
        }}>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827', lineHeight: 1 }}>
              ₹{pkg.price.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{pkg.nights} nights / person</div>
          </div>
          <Link
            href={`/tours/${pkg.slug || pkg.id}`}
            style={{
              background: '#026eb5', color: 'white',
              borderRadius: 8, padding: '9px 16px',
              fontWeight: 700, fontSize: 12,
              textDecoration: 'none',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#166534'}
            onMouseLeave={e => e.currentTarget.style.background = '#026eb5'}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
