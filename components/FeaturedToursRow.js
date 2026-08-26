'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getMediaUrl, getTripInquiries } from '@/utils/api';
import { CardLink, CircleButton, FilterPill, SectionIntro, SoftBadge } from '@/components/ui/TravelPrimitives';

/* ── Filter definitions ───────────────────────────────── */
const BUDGET_FILTERS = [
  { label: 'All Budgets', key: 'all' },
  { label: 'Under ₹50K', key: 'under50' },
  { label: '₹50K to ₹1.5L', key: '50to150' },
  { label: '₹1.5L to ₹2.5L', key: '150to250' },
  { label: 'Luxury', key: 'luxury' },
];

const getBudgetLabel = (key, fallback) => ({
  all: 'All Budgets',
  under50: 'Under Rs 50K',
  '50to150': 'Rs 50K to Rs 1.5L',
  '150to250': 'Rs 1.5L to Rs 2.5L',
  luxury: 'Luxury',
}[key] || fallback);

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
    user: { name: 'Harish', city: 'Bangalore', avatar: 'H', avatarBg: 'var(--color-primary)', ago: '20hr ago' },
  },
];

/* ── Custom Dropdown Component ────────────────────────── */
function DestinationDropdown({ currentDest, onChange, destinations = DESTINATIONS }) {
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
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.438rem 1rem', borderRadius: '62.438rem',
          border: open ? '1.5px solid var(--color-primary)' : '1.5px solid #d1d5db',
          background: 'var(--color-bg-card)',
          color: '#374151', fontSize: '0.813rem', fontWeight: 500, cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.2s',
          boxShadow: open ? '0 0 0 0.188rem rgba(20,83,45,0.1)' : 'none',
        }}
      >
        {currentDest}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0,
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: '0.75rem', boxShadow: '0 0.625rem 1.875rem rgba(0,0,0,0.1)',
          minWidth: '12.5rem', zIndex: 50, padding: '0.5rem 0',
          animation: 'fadeSlideIn 0.2s ease',
        }}>
          {destinations.map((d, i) => {
            const isActive = d === currentDest;
            return (
              <button
                key={d}
                onClick={() => {
                  onChange(d);
                  setOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  width: '100%', padding: '0.625rem 1.125rem',
                  background: 'none', border: 'none',
                  borderBottom: i < destinations.length - 1 ? '1px solid #f3f4f6' : 'none',
                  textAlign: 'left', cursor: 'pointer',
                  color: '#1f2937', fontSize: '0.844rem', fontWeight: isActive ? 600 : 400,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Radio circle matching screenshot */}
                <div style={{
                  width: '1.125rem', height: '1.125rem', borderRadius: '50%',
                  border: isActive ? '2px solid #16a34a' : '1.5px solid #d1d5db',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isActive && <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#16a34a' }} />}
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
function filterBookings(budgetStr, destStr, source = []) {
  let list = source;
  if (budgetStr !== 'all') {
    list = list.filter(b => b.priceCategory === budgetStr);
  }
  if (destStr !== 'All Destinations') {
    list = list.filter(b => b.dest === destStr);
  }
  return list;
}

const getPriceCategory = (amount) => {
  const price = Number(amount) || 0;
  if (price >= 250000) return 'luxury';
  if (price >= 150000) return '150to250';
  if (price >= 50000) return '50to150';
  return 'under50';
};

const getRelativeTime = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'recently';

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours}hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getTypeColor = (value) => {
  const key = String(value || '').toLowerCase();
  if (key.includes('luxury')) return '#f59e0b';
  if (key.includes('family')) return '#6366f1';
  if (key.includes('couple') || key.includes('honeymoon')) return '#f97316';
  if (key.includes('adventure') || key.includes('trending')) return '#10b981';
  return 'var(--color-primary)';
};

const normalizeInquiry = (item) => {
  const cityNames = (item.cities || []).map((city) => city.name).filter(Boolean);
  const galleryImage = item.destination_gallery?.find((image) => image.is_primary)?.url || item.destination_gallery?.[0]?.url;
  const totalAmount = Number(item.total_amount || item.base_price || 0);
  const nights = Number(String(item.duration || '').match(/\d+/)?.[0]) || Math.max(cityNames.length, 1);
  const destination = item.destination || cityNames[0] || 'Custom Trip';
  const travelType = item.travel_with || item.status || 'CUSTOM';
  const city = item.departure_city?.split(',')?.[0]?.trim() || 'India';

  return {
    id: item.id,
    slug: item.destination_slug,
    isInquiry: true,
    dest: destination,
    title: `${item.duration || 'Custom'} ${destination} itinerary for ${item.total_travellers || 1} travellers`,
    locations: cityNames.length ? cityNames.map((name) => titleCase(name)) : [destination],
    image: getMediaUrl(galleryImage) || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
    nights,
    price: totalAmount,
    priceCategory: getPriceCategory(totalAmount),
    type: String(travelType).toUpperCase(),
    typeColor: getTypeColor(travelType),
    user: {
      name: item.customer_name?.split(' ')?.[0] || 'Traveler',
      city,
      avatar: (item.customer_name || 'T').charAt(0).toUpperCase(),
      avatarBg: getTypeColor(travelType),
      ago: getRelativeTime(item.created_at),
    },
  };
};

const titleCase = (value) =>
  String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

/* ── Main component ───────────────────────────────────── */
export default function RecommendedPackages() {
  const [activeBudget, setActiveBudget] = useState('all');
  const [activeDest, setActiveDest] = useState('All Destinations');
  const [visible, setVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [liveBookings, setLiveBookings] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth <= 768);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTripInquiries = async () => {
      setInquiriesLoading(true);
      const result = await getTripInquiries({ page: 1, limit: 20 });

      if (!mounted) return;

      const rows = Array.isArray(result?.rows) ? result.rows : [];
      setLiveBookings(rows.map(normalizeInquiry));
      setInquiriesLoading(false);
    };

    loadTripInquiries();

    return () => {
      mounted = false;
    };
  }, []);

  const bookingSource = liveBookings.length ? liveBookings : allBookings.slice(0, 0);
  const destinationOptions = [
    'All Destinations',
    ...Array.from(new Set(bookingSource.map((booking) => booking.dest).filter(Boolean))).sort(),
  ];
  const filtered = filterBookings(activeBudget, activeDest, bookingSource);

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
    <section className="recent-bookings-section">
      <style>{`

           .recent-bookings-section .th-section-copy p {
             font-size: 0.844rem;
           }
           .recent-bookings-section .th-soft-badge {
             max-width: 100%;
             white-space: normal;
             line-height: 1.25;
           }
           .recent-filters {
             gap: 0.438rem;
           }
           .recent-filters > * {
             flex: 0 0 auto;
           }
           .recent-booking-card {
             width: calc(100vw - 1.75rem);
           }
           @media (min-width: 26.313rem) {
           .recent-bookings-section { padding: 1.25rem 0 1.5rem; }
           .recent-bookings-section .th-section-intro {
             width: 100%;
             min-width: 0;
             margin-bottom: 1.375rem;
           }
           .recent-bookings-section .th-section-copy,
           .recent-bookings-section .th-section-actions {
             width: 100%;
             min-width: 0;
           }
           .recent-bookings-section .th-section-copy h2 {
             font-size: clamp(1.563rem, 8.2vw, 2rem);
             line-height: 1.08;
           }
           .recent-bookings-section .th-section-copy p {
             max-width: 100%;
             font-size: 0.875rem;
             line-height: 1.55;
             overflow-wrap: normal;
             word-break: normal;
           }
           .recent-bookings-section .th-section-actions {
             display: grid;
             gap: 0.75rem;
             justify-content: stretch;
           }
           .recent-filters {
             width: 100%;
             max-width: 100%;
             overflow-x: auto;
             flex-wrap: nowrap;
             padding: 1px 2px 0.5rem;
             margin: 0 -2px;
             scrollbar-width: none;
             -webkit-overflow-scrolling: touch;
           }
           .recent-filters::-webkit-scrollbar { display: none; }
           .recent-scroll-actions { display: none; }
           .recent-booking-card { width: calc(100vw - 2.25rem); }
           .responsive-header-row {
             flex-direction: column;
             align-items: flex-start !important;
             gap: 1.5rem !important;
           }
           .filters-container {
             width: 100%;
             order: 2;
           }
           .arrows-container {
             order: 3;
             margin-top: 0.5rem;
           }
           .heading-container {
             order: 1;
           }
}
           @media (min-width: 48.063rem) {
        .booking-cards-wrap {
          display: flex;
          gap: 1.25rem;
          overflow-x: auto;
          padding: 0.25rem 2px 0.75rem;
          scrollbar-width: none;
          -ms-overflow-style: none;
          transition: opacity 0.18s ease;
        }
        .booking-cards-wrap.hidden { opacity: 0; }
        .booking-cards-wrap.shown  { opacity: 1; }
        .booking-card-item {
          animation: fadeSlideIn 0.32s ease both;
        }
        .recent-bookings-section {
          background: transparent;
          padding: 1.5rem 0 2rem;
        }
        .recent-filters {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          min-width: 0;
        }
        .recent-scroll-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .responsive-header-row {
          display: none !important;
        }
        .recent-result-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin: -0.625rem 0 1.125rem;
        }
        .recent-result-row p {
          margin: 0;
          color: #667085;
          font-size: 0.813rem;
          font-weight: 500;
        }
        .recent-result-row > span:last-child {
          color: #667085 !important;
          font-size: 0.813rem !important;
          font-weight: 500;
        }
        .booking-cards-wrap {
          scroll-snap-type: x proximity;
        }
        .booking-cards-wrap::-webkit-scrollbar { display: none; }
        .recent-empty-state {
          flex: 1 0 100%;
          min-height: 8rem;
          display: grid;
          place-items: center;
          border: 1px dashed var(--color-border);
          border-radius: 0.75rem;
          color: #64748b;
          background: var(--color-bg-card);
          font-size: 0.813rem;
          font-weight: 700;
        }
        .recent-booking-card {
          flex-shrink: 0;
          width: 19.375rem;
          max-width: 85vw;
          overflow: hidden;
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          background: var(--color-bg-card);
          box-shadow: 0 0.625rem 1.625rem rgba(15, 23, 42, .07);
          transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
          scroll-snap-align: start;
        }
        .recent-booking-card:hover {
          transform: translateY(-0.25rem);
          border-color: color-mix(in srgb, var(--color-primary) 28%, #e6ebf1);
          box-shadow: 0 1.125rem 2.75rem rgba(15, 23, 42, .12);
        }
        .recent-card-media {
          position: relative;
          height: 11.75rem;
          overflow: hidden;
          background: var(--color-bg-soft);
        }
        .recent-card-media img {
          object-fit: cover;
          transition: transform .5s ease;
        }
        .recent-booking-card:hover .recent-card-media img {
          transform: scale(1.06);
        }
        .recent-card-media::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15, 23, 42, .02) 35%, rgba(15, 23, 42, .46) 100%);
          pointer-events: none;
        }
        .recent-user-badge {
          position: absolute;
          left: 0.75rem;
          top: 0.75rem;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          max-width: calc(100% - 1.5rem);
          padding: 0.313rem 0.688rem 0.313rem 0.313rem;
          border: 1px solid rgba(255,255,255,.24);
          border-radius: var(--radius-full);
          background: rgba(15, 23, 42, .58);
          color: #fff;
          backdrop-filter: blur(0.625rem);
        }
        .recent-user-avatar {
          width: 1.625rem;
          height: 1.625rem;
          flex: 0 0 1.625rem;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 0.688rem;
          font-weight: 800;
        }
        .recent-user-badge span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.688rem;
          font-weight: 600;
        }
        .recent-card-body { padding: 1rem; }
        .recent-card-title {
          min-height: 2.5rem;
          margin: 0 0 0.5rem;
          color: #111827;
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: 0.938rem;
          font-weight: 700;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .recent-card-location {
          display: flex;
          align-items: center;
          gap: 0.313rem;
          margin: 0 0 0.75rem;
          color: #667085;
          font-size: 0.75rem;
          line-height: 1.4;
        }
        .recent-card-location span {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .recent-card-tags {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.875rem;
        }
        .recent-card-type,
        .recent-card-nights {
          display: inline-flex;
          align-items: center;
          min-height: 1.5rem;
          border-radius: 0.438rem;
          padding: 0.188rem 0.563rem;
          font-size: 0.625rem;
          font-weight: 800;
          letter-spacing: .0.375rem;
          text-transform: uppercase;
        }
        .recent-card-nights {
          background: #f3f6fa;
          color: #475467;
          font-size: 0.688rem;
          font-weight: 700;
          letter-spacing: 0;
          text-transform: none;
        }
        .recent-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.625rem;
          border-top: 1px solid #eef2f6;
          padding-top: 0.813rem;
        }
        .recent-card-price {
          color: #111827;
          font-family: var(--font-poppins), Poppins, sans-serif;
          font-size: 1.188rem;
          font-weight: 800;
          line-height: 1;
        }
        .recent-card-price-note {
          margin-top: 0.25rem;
          color: #98a2b3;
          font-size: 0.688rem;
          font-weight: 600;
        }
}
      
      `}</style>

      <div className="container">
        <SectionIntro
          eyebrow="Traveler activity"
          title="Recently booked"
          accent="itineraries"
          subtitle="See what other travelers are planning right now, then open a route that feels close to your next holiday."
          meta={(
            <SoftBadge tone="live">
              {liveBookings.length ? `${liveBookings.length}+ recent trip requests` : '143+ trips booked last week'}
            </SoftBadge>
          )}
          actions={(
            <>
              <div className="recent-filters">
                <DestinationDropdown currentDest={activeDest} onChange={handleDestChange} destinations={destinationOptions} />
                {BUDGET_FILTERS.map((filter) => (
                  <FilterPill
                    key={filter.key}
                    active={activeBudget === filter.key}
                    onClick={() => handleBudgetSort(filter.key)}
                  >
                    {getBudgetLabel(filter.key, filter.label)}
                  </FilterPill>
                ))}
              </div>
              <div className="recent-scroll-actions">
                <CircleButton label="Previous itineraries" onClick={() => scroll(-1)}>
                  &lt;
                </CircleButton>
                <CircleButton label="Next itineraries" onClick={() => scroll(1)}>
                  &gt;
                </CircleButton>
              </div>
            </>
          )}
        />

        {/* ── Top row: left label + filters + arrows ── */}
        <div className="responsive-header-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem', flexWrap: 'wrap' }}>

          {/* Left label */}
          <div className="heading-container" style={{ flexShrink: 0, margin: '0.75rem' }}>
            <h2 style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 900, fontSize: '1.75rem',
              color: '#111827', margin: 0,
              lineHeight: 1.15,
              textTransform: 'uppercase',
              letterSpacing: -0.5,
            }}>
              RECENTLY<br />BOOKED<br />
              <span style={{ color: 'var(--color-primary)' }}>ITINERARIES</span>
            </h2>
            <div style={{
              margin: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: '#fff0f0', border: '1px solid #fecaca',
              borderRadius: '62.438rem', padding: '0.313rem 0.75rem', width: 'fit-content',
            }}>
              <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>❤️</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>
                {liveBookings.length ? `${liveBookings.length}+ recent trip requests` : '143+ trips booked last week'}
              </span>
            </div>
          </div>

          {/* Filter pills */}
          <div className="filters-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
            {/* The Destination Dropdown */}
            <DestinationDropdown currentDest={activeDest} onChange={handleDestChange} destinations={destinationOptions} />

            {/* {BUDGET_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => handleBudgetSort(f.key)}
                style={{
                  padding: '0.438rem 1rem',
                  borderRadius: '62.438rem',
                  border: activeBudget === f.key ? '2px solid var(--color-primary)' : '1.5px solid #d1d5db',
                  background: activeBudget === f.key ? 'var(--color-primary-light)' : 'white',
                  color: activeBudget === f.key ? 'var(--color-primary)' : '#374151',
                  fontWeight: activeBudget === f.key ? 700 : 500,
                  fontSize: '0.813rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))} */}
          </div>

          {/* Prev / Next arrows */}
          <div className="arrows-container" style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            {['‹', '›'].map((arrow, i) => (
              <button
                key={arrow}
                onClick={() => scroll(i === 0 ? -1 : 1)}
                style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                  border: '1.5px solid #d1d5db',
                  background: 'white', color: '#374151', fontSize: '1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', lineHeight: 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 0.25rem rgba(0,0,0,0.08)',
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
        <div className="recent-result-row">
          <span style={{
            background: 'var(--color-primary-light)', border: '1px solid var(--brand-primary-border)',
            color: 'var(--color-primary)', borderRadius: '62.438rem',
            padding: '0.188rem 0.75rem', fontSize: '0.75rem', fontWeight: 700,
          }}>
            {filtered.length} itineraries
          </span>
          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
              {inquiriesLoading
                ? 'loading latest trips'
                : activeDest === 'All Destinations' && activeBudget === 'all'
                  ? (liveBookings.length ? 'showing latest saved trips' : 'no live trips returned')
                  : 'filtered results'}
          </span>
        </div>

        {/* ── Cards horizontal scroll ── */}
        <div
          ref={scrollRef}
          className={`booking-cards-wrap ${visible ? 'shown' : 'hidden'}`}
        >
          {filtered.map((pkg, idx) => (
            <BookingCardV2
              key={pkg.id}
              pkg={pkg}
              animDelay={idx * 40}
            />
          ))}
          {!inquiriesLoading && filtered.length === 0 && (
            <div className="recent-empty-state">
              Live trip inquiries will appear here once the API returns data.
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

/* ── Single card ──────────────────────────────────────── */
function BookingCardV2({ pkg, animDelay }) {
  const searchTerm = pkg.locations?.[0]?.replace(/\s*\([^)]*\)/g, '').trim() || pkg.dest;
  const priceLabel = Number(pkg.price) > 0 ? `Rs ${Number(pkg.price).toLocaleString('en-IN')}` : 'On request';
  const href = pkg.isInquiry
    ? `/itineraries/${encodeURIComponent(pkg.id)}`
    : `/tour?search=${encodeURIComponent(searchTerm)}`;

  return (
    <article className="booking-card-item recent-booking-card" style={{ animationDelay: `${animDelay}ms` }}>
      <div className="recent-card-media">
        <Image
          src={pkg.image}
          alt={pkg.title}
          fill
          sizes="(max-width: 48rem) calc(100vw - 2.25rem), 19.375rem"
        />
        <div className="recent-user-badge">
          <div className="recent-user-avatar" style={{ background: pkg.user.avatarBg }}>
            {pkg.user.avatar}
          </div>
          <span>{pkg.user.name} from {pkg.user.city} - {pkg.user.ago}</span>
        </div>
      </div>

      <div className="recent-card-body">
        <p className="recent-card-title">{pkg.title}</p>
        <p className="recent-card-location">
          <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          <span>{pkg.locations.join(' - ')}</span>
        </p>

        <div className="recent-card-tags">
          <span
            className="recent-card-type"
            style={{
              background: `${pkg.typeColor}18`,
              border: `1px solid ${pkg.typeColor}40`,
              color: pkg.typeColor,
            }}
          >
            {pkg.type}
          </span>
          <span className="recent-card-nights">{pkg.nights} Nights</span>
        </div>

        <div className="recent-card-footer">
          <div>
            <div className="recent-card-price">{priceLabel}</div>
            <div className="recent-card-price-note">{pkg.nights} nights / person</div>
          </div>
          <CardLink href={href}>View Details</CardLink>
        </div>
      </div>
    </article>
  );
}

function BookingCard({ pkg, animDelay, isMobile }) {
  const [hovered, setHovered] = useState(false);
  const searchTerm = pkg.locations?.[0]?.replace(/\s*\([^)]*\)/g, '').trim() || pkg.dest;
  const priceLabel = Number(pkg.price) > 0 ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : 'On request';

  return (
    <div
      className="booking-card-item"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: isMobile ? 'calc(100vw - 2rem)' : 310,
        background: 'var(--color-bg-card)',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        // boxShadow: hovered ? '0 0.75rem 2.5rem rgba(0,0,0,0.14)' : '0 2px 0.75rem rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-0.25rem)' : 'none',
        transition: 'all 0.3s ease',
        animationDelay: `${animDelay}ms`,
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '11.25rem', overflow: 'hidden' }}>
        <Image
          src={pkg.image}
          alt={pkg.title}
          width={600}
          height={360}
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
          position: 'absolute', top: '0.625rem', right: '0.625rem',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(0.375rem)',
          color: 'white', borderRadius: '62.438rem',
          padding: '0.188rem 0.625rem', fontSize: '0.688rem', fontWeight: 700,
        }}>
          ₹{pkg.price.toLocaleString('en-IN')}
        </div> */}

        {/* User badge */}
        <div style={{
          position: 'absolute', top: '0.625rem', left: '0.625rem',
          display: 'flex', alignItems: 'center', gap: '0.438rem',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(0.375rem)',
          borderRadius: '62.438rem',
          padding: '0.313rem 0.75rem 0.313rem 0.313rem',
        }}>
          <div style={{
            width: '1.625rem', height: '1.625rem', borderRadius: '50%',
            background: pkg.user.avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.688rem', color: 'white', flexShrink: 0,
          }}>
            {pkg.user.avatar}
          </div>
          <span style={{ color: 'white', fontSize: '0.688rem', fontWeight: 600 }}>
            {pkg.user.name} from {pkg.user.city} · {pkg.user.ago}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '0.875rem 1rem' }}>
        {/* Title */}
        <p style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 700,
          fontSize: '0.875rem', color: '#111827', margin: '0 0 0.375rem',
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
          fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.625rem',
          display: 'flex', alignItems: 'center', gap: '0.25rem',
        }}>
          <svg viewBox="0 0 24 24" fill="#6b7280" width="11" height="11">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          {pkg.locations.join(' · ')}
        </p>

        {/* Type badge + nights */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.875rem' }}>
          <span style={{
            display: 'inline-block',
            background: pkg.typeColor + '18',
            color: pkg.typeColor,
            border: `1px solid ${pkg.typeColor}40`,
            borderRadius: '0.375rem',
            padding: '2px 0.625rem',
            fontSize: '0.625rem', fontWeight: 800,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}>
            {pkg.type}
          </span>
          <span style={{
            display: 'inline-block',
            background: '#f3f4f6',
            color: '#4b5563',
            borderRadius: '0.375rem',
            padding: '2px 0.563rem',
            fontSize: '0.625rem', fontWeight: 700,
          }}>
            🌙 {pkg.nights} Nights
          </span>
        </div>

        {/* Price + CTA */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #f3f4f6',
          padding: '0.75rem', gap: '0.5rem',
        }}>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.125rem', color: '#111827', lineHeight: 1 }}>
              {priceLabel}
            </div>
            <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>{pkg.nights} nights / person</div>
          </div>
          <Link
            href={pkg.isInquiry ? `/itineraries/${encodeURIComponent(pkg.id)}` : `/tour?search=${encodeURIComponent(searchTerm)}`}
            style={{
              background: 'var(--color-primary)', color: 'white',
              borderRadius: '0.5rem', padding: '0.563rem 1rem',
              fontWeight: 700, fontSize: '0.75rem',
              textDecoration: 'none',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#166534'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
