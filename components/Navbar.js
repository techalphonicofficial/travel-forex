'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getDestinationHref } from '@/utils/destinationLinks';
import { searchCountryCityLocations } from '@/utils/api';
import toast from 'react-hot-toast';

/* ── Mega-menu data ───────────────────────────────────── */
const destinationCols = [
  [
    { name: 'Bali', tag: 'TRENDING', tagClr: '#ef4444', tagBg: '#fef2f2', href: '/tour?search=Bali' },
    { name: 'Maldives', tag: 'HONEYMOON', tagClr: '#ec4899', tagBg: '#fdf2f8', href: '/tour?search=Maldives' },
    { name: 'Thailand', tag: 'BUDGET', tagClr: '#f59e0b', tagBg: '#fffbeb', href: '/tour?search=Thailand' },
    { name: 'Dubai', tag: null, href: '/tour?search=Dubai' },
    { name: 'Switzerland', tag: null, href: '/tour?search=Switzerland' },
    { name: 'Vietnam', tag: null, href: '/tour?search=Vietnam' },
    { name: 'Abu Dhabi', tag: 'POPULAR', tagClr: '#8b5cf6', tagBg: '#f5f3ff', href: '/tour?search=Abu%20Dhabi' },
  ],
  [
    { name: 'France', tag: null, href: '/tour?search=France' },
    { name: 'Singapore', tag: null, href: '/tour?search=Singapore' },
    { name: 'Australia', tag: null, href: '/tour?search=Australia' },
    { name: 'Spain', tag: null, href: '/tour?search=Spain' },
    { name: 'South Africa', tag: null, href: '/tour?search=South%20Africa' },
    { name: 'Sri Lanka', tag: null, href: '/tour?search=Sri%20Lanka' },
    { name: 'New Zealand', tag: null, href: '/tour?search=New%20Zealand' },
  ],
  [
    { name: 'Mauritius', tag: null, href: '/tour?search=Mauritius' },
    { name: 'Greece', tag: null, href: '/tour?search=Greece' },
    { name: 'Japan', tag: null, href: '/tour?search=Japan' },
    { name: 'Malaysia', tag: null, href: '/tour?search=Malaysia' },
    {
      name: 'Explore 40+ Destinations',
      tag: null,
      href: '/tours?destination',
      isExplore: true,
    },
  ],
];

const packageCols = [
  [
    { name: 'Honeymoon Packages', href: '/packages?type=COUPLE' },
    { name: 'Family Packages', href: '/packages?type=FAMILY' },
    { name: 'Group Packages', href: '/packages?type=GROUP' },
    { name: 'Solo Packages', href: '/packages?type=SOLO' },
  ],
  [
    { name: 'Adventure Tours', href: '/packages?type=ADVENTURE' },
    { name: 'Luxury Tours', href: '/packages?type=LUXURY' },
    { name: 'Budget Tours', href: '/packages?dest=All&price=under50' },
    { name: 'Weekend Getaways', href: '/packages' },
  ],
  [
    { name: 'Beach Holidays', href: '/packages?type=BEACH' },
    { name: 'Wildlife Safaris', href: '/packages?dest=Safari' },
    { name: 'Cultural Tours', href: '/packages?type=CULTURAL' },
    { name: 'View All Packages →', href: '/packages', isExplore: true },
  ],
];

const serviceCols = [
  [
    { name: 'Hotels Booking', tag: 'LIVE', tagClr: '#059669', tagBg: '#ecfdf5', href: '/hotels' },
    { name: 'Flight Booking', tag: 'BEST RATES', tagClr: '#026eb5', tagBg: '#e0f2fe', href: '#flight', isFlightAction: true },
  ],
  [
    { name: 'Domestic Trips', tag: 'EXPLORE', tagClr: '#d97706', tagBg: '#fffbeb', href: '/packages?type=DOMESTIC' },
    { name: 'International Trips', tag: 'POPULAR', tagClr: '#8b5cf6', tagBg: '#f5f3ff', href: '/packages?type=INTERNATIONAL' },
  ],
  [
    { name: 'Customize Packages', tag: 'RECOMMENDED', tagClr: '#ec4899', tagBg: '#fdf2f8', href: '/customize' }
  ]
];

const HOTEL_HREF = '/hotels';

const currencyOptions = [
  { code: 'INR', name: 'Indian Rupee', country: 'India', symbol: 'Rs' },
  { code: 'USD', name: 'US Dollar', country: 'United States', symbol: '$' },
  { code: 'EUR', name: 'Euro', country: 'Europe', symbol: 'EUR' },
  { code: 'GBP', name: 'British Pound', country: 'United Kingdom', symbol: 'GBP' },
  { code: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates', symbol: 'AED' },
  { code: 'SGD', name: 'Singapore Dollar', country: 'Singapore', symbol: 'S$' },
  { code: 'THB', name: 'Thai Baht', country: 'Thailand', symbol: 'THB' },
  { code: 'MYR', name: 'Malaysian Ringgit', country: 'Malaysia', symbol: 'MYR' },
  { code: 'AUD', name: 'Australian Dollar', country: 'Australia', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', country: 'Canada', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', country: 'Japan', symbol: 'JPY' },
  { code: 'CHF', name: 'Swiss Franc', country: 'Switzerland', symbol: 'CHF' },
  { code: 'NZD', name: 'New Zealand Dollar', country: 'New Zealand', symbol: 'NZ$' },
  { code: 'HKD', name: 'Hong Kong Dollar', country: 'Hong Kong', symbol: 'HK$' },
  { code: 'IDR', name: 'Indonesian Rupiah', country: 'Indonesia', symbol: 'IDR' },
  { code: 'VND', name: 'Vietnamese Dong', country: 'Vietnam', symbol: 'VND' },
  { code: 'LKR', name: 'Sri Lankan Rupee', country: 'Sri Lanka', symbol: 'LKR' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', country: 'Maldives', symbol: 'MVR' },
  { code: 'SAR', name: 'Saudi Riyal', country: 'Saudi Arabia', symbol: 'SAR' },
  { code: 'QAR', name: 'Qatari Riyal', country: 'Qatar', symbol: 'QAR' },
];

const emptyForexInquiry = {
  fromCurrency: 'INR',
  toCurrency: 'USD',
  amount: '',
  purpose: 'Travel',
  travelDate: '',
  customerName: '',
  phone: '',
  email: '',
  notes: '',
};

const emptyFlightDraft = {
  tripType: 'Round-trip',
  departureCity: '',
  destinationCity: '',
  departureDate: '',
  returnDate: '',
  adults: 1,
  children: 0,
  cabinClass: 'Economy',
  customerName: '',
  phone: '',
  email: '',
  notes: ''
};

const forexRowsFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (payload?.data && typeof payload.data === 'object') return [payload.data];
  if (payload && typeof payload === 'object' && (payload.code || payload.currency_code || payload.base_code || payload.rate)) return [payload];
  return [];
};

const numberFromForex = (...values) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

const normalizeForexRate = (item = {}, index = 0) => {
  const rawCode = item.code || item.currency_code || item.currencyCode || item.from_code || item.fromCurrency || item.currency;
  const rawBaseCode = item.base_code || item.baseCode || item.to_code || item.toCurrency || item.quote_code || item.quoteCode;
  const code = String(rawCode || '').trim().toUpperCase();
  const baseCode = String(rawBaseCode || '').trim().toUpperCase();
  const country = String(item.country?.name || item.country_name || item.country || item.countryName || '').trim();
  const name = String(item.currency_name || item.currencyName || item.name || item.label || `${code || baseCode} currency`).trim();
  const rate = numberFromForex(
    item.rate,
    item.conversion_rate,
    item.conversionRate,
    item.exchange_rate,
    item.exchangeRate,
    item.sell_rate,
    item.sellRate,
    item.value
  );

  return {
    ...item,
    code: code || baseCode || `FX${index}`,
    baseCode,
    country: country || 'Active forex rate',
    name,
    rate,
    symbol: item.symbol || item.currency_symbol || item.currencySymbol || code || baseCode,
  };
};

const buildForexOptions = (rows = []) => {
  const seen = new Set();
  const normalized = rows
    .map(normalizeForexRate)
    .filter((currency) => currency.code && !currency.code.startsWith('FX'));

  const combined = [...normalized, ...currencyOptions];

  return combined.filter((currency) => {
    const key = currency.code;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const findForexRateMatch = (rates = [], fromCode, toCode) => {
  const from = String(fromCode || '').toUpperCase();
  const to = String(toCode || '').toUpperCase();

  if (!from || !to || from === to) return null;

  const direct = rates.find((rate) => rate.code === from && rate.baseCode === to && rate.rate);
  if (direct) return { rate: direct.rate, source: direct, mode: 'direct' };

  const reverse = rates.find((rate) => rate.code === to && rate.baseCode === from && rate.rate);
  if (reverse) return { rate: 1 / reverse.rate, source: reverse, mode: 'reverse' };

  return null;
};

const formatMoneyValue = (value, code) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';
  return `${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${code}`;
};

const firstObjectFromPayload = (payload) => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (Array.isArray(payload?.data)) return payload.data[0] || null;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows[0] || null;
  if (payload?.data && typeof payload.data === 'object') return payload.data;
  if (payload && typeof payload === 'object') return payload;
  return null;
};

const getCustomerId = (user) => (
  user?.id ||
  user?.customer_id ||
  user?.customerId ||
  user?.user_id ||
  user?.user?.id ||
  user?.customer?.id ||
  null
);

const normalizeForexServiceCharge = (payload) => {
  const item = firstObjectFromPayload(payload);
  if (!item) return null;

  const type = item.type || item.charge_type || item.chargeType || item.service_charge_type || item.serviceChargeType;
  const value = numberFromForex(
    item.value,
    item.amount,
    item.charge,
    item.service_charge,
    item.serviceCharge,
    item.forex_service_charge,
    item.forexServiceCharge
  );

  if (!type && !value) return null;

  return {
    type: String(type || 'fixed').toLowerCase(),
    value,
  };
};

const normalizeForexConversion = (payload, fallback = {}) => {
  const item = firstObjectFromPayload(payload);
  if (!item) return null;

  const rate = numberFromForex(
    item.rate,
    item.conversion_rate,
    item.conversionRate,
    item.exchange_rate,
    item.exchangeRate,
    fallback.rate
  );
  const convertedAmount = numberFromForex(
    item.converted_amount,
    item.convertedAmount,
    item.converted,
    item.destination_amount,
    item.destinationAmount,
    fallback.convertedAmount
  );
  const serviceCharge = numberFromForex(
    item.service_charge,
    item.serviceCharge,
    item.charge_amount,
    item.chargeAmount,
    item.fee,
    fallback.serviceCharge
  );
  const totalAmount = numberFromForex(
    item.total_amount,
    item.totalAmount,
    item.payable_amount,
    item.payableAmount,
    item.final_amount,
    item.finalAmount,
    serviceCharge && convertedAmount ? convertedAmount + serviceCharge : fallback.totalAmount
  );

  return {
    ...item,
    rate,
    convertedAmount,
    serviceCharge,
    totalAmount,
    requestId: item.id || item.request_id || item.requestId || item.forex_request_id || item.forexRequestId,
  };
};

function CurrencyCombobox({ id, label, value, onChange, currencies = currencyOptions, loading = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef(null);
  const selected = currencies.find((currency) => currency.code === value) || null;
  const filteredCurrencies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return currencies;

    return currencies.filter((currency) => (
      String(currency.code || '').toLowerCase().includes(query) ||
      String(currency.name || '').toLowerCase().includes(query) ||
      String(currency.country || '').toLowerCase().includes(query) ||
      String(currency.baseCode || '').toLowerCase().includes(query)
    ));
  }, [currencies, search]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const chooseCurrency = (currency) => {
    onChange(currency.code);
    setSearch('');
    setOpen(false);
  };

  return (
    <label className="forex-currency-field" ref={wrapRef}>
      {label}
      <div className={`forex-currency-combobox${open ? ' is-open' : ''}`}>
        <div className="forex-currency-selected">
          {selected ? (
            <>
              <strong>{selected.code}</strong>
              <span>{selected.name}</span>
              {selected.baseCode ? <em>{selected.baseCode}</em> : null}
            </>
          ) : (
            <span>Select currency</span>
          )}
        </div>
        <input
          id={id}
          type="text"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search code or country"
          autoComplete="off"
        />
        <button type="button" aria-label={`Open ${label} currency list`} onClick={() => setOpen((current) => !current)}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        {open ? (
          <div className="forex-currency-menu">
            {loading ? (
              <div className="forex-currency-empty">Loading active rates...</div>
            ) : filteredCurrencies.length ? filteredCurrencies.map((currency) => (
              <button
                key={`${currency.code}-${currency.baseCode || currency.country || 'currency'}`}
                type="button"
                className={currency.code === value ? 'active' : ''}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseCurrency(currency)}
              >
                <span>
                  <strong>{currency.code}</strong>
                  <small>{currency.name}{currency.baseCode ? ` to ${currency.baseCode}` : ''}</small>
                </span>
                <em>{currency.country}</em>
              </button>
            )) : (
              <div className="forex-currency-empty">No currency found</div>
            )}
          </div>
        ) : null}
      </div>
    </label>
  );
}

/* ── Tag badge component ──────────────────────────────── */
function Tag({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-block',
      background: bg,
      color: color,
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: 0.8,
      padding: '2px 4px',
      borderRadius: 4,
      marginLeft: 6,
      lineHeight: 1.6,
      verticalAlign: 'middle',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
}

/* ── Mega Dropdown ────────────────────────────────────── */
function MegaDropdown({ label, cols, isTransparent, onFlightOpen }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const linkColor = isTransparent ? 'rgba(255,255,255,0.92)' : '#374151';

  return (
    <li ref={ref} style={{ position: 'relative', listStyle: 'none' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: 'pointer',
          color: linkColor, fontSize: 14, fontWeight: 600,
          padding: '6px 2px',
          transition: 'color 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!isTransparent) e.currentTarget.style.color = 'var(--color-primary)'; }}
        onMouseLeave={e => { if (!isTransparent) e.currentTarget.style.color = '#374151'; }}
      >
        {label}
        <svg
          viewBox="0 0 24 24" fill="currentColor" width="14" height="14"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s',
            opacity: 0.7,
          }}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 14px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: 14,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            padding: '20px 24px',
            display: 'flex',
            gap: 0,
            zIndex: 999,
            animation: 'dropIn 0.2s ease',
            minWidth: 540,
          }}
        >
          {cols.map((col, ci) => (
            <div
              key={ci}
              style={{
                flex: 1,
                paddingRight: ci < cols.length - 1 ? 20 : 0,
                marginRight: ci < cols.length - 1 ? 20 : 0,
                borderRight: ci < cols.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}
            >
              {col.map((item) => {
                if (item.isFlightAction) {
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        if (typeof onFlightOpen === 'function') onFlightOpen();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 0',
                        borderBottom: '1px solid #f9fafb',
                        background: 'transparent',
                        border: 'none',
                        color: '#1f2937',
                        fontWeight: 500,
                        fontSize: 13.5,
                        transition: 'color 0.15s',
                        lineHeight: 1.5,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#1f2937'; }}
                    >
                      {item.name}
                      {item.tag && (
                        <Tag label={item.tag} color={item.tagClr} bg={item.tagBg} />
                      )}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f9fafb',
                      textDecoration: 'none',
                      color: item.isExplore ? 'var(--color-primary)' : '#1f2937',
                      fontWeight: item.isExplore ? 700 : 500,
                      fontSize: 13.5,
                      transition: 'color 0.15s',
                      lineHeight: 1.5,
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = item.isExplore ? 'var(--color-primary)' : '#1f2937'; }}
                  >
                    {item.name}
                    {item.tag && (
                      <Tag label={item.tag} color={item.tagClr} bg={item.tagBg} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

/* ── Side Drawer ───────────────────────────────────────── */
function SideDrawer({ isOpen, onClose, allCategories, isLoggedIn, currentUser, onLogout, onForexOpen, onFlightOpen, companyInfo }) {
  const [expanded, setExpanded] = useState(null);
  const displayPhone = companyInfo?.contact?.phone || '+91 8031274154';
  const firstName = isLoggedIn ? currentUser?.name?.split(' ')[0] || 'Traveler' : 'Guest';
  const userInitial = firstName.charAt(0).toUpperCase() || 'G';

  const getNavIcon = (label = '') => {
    const key = label.toLowerCase();
    if (key.includes('service')) return 'SV';
    if (key.includes('holiday') || key.includes('package')) return 'HP';
    if (key.includes('hotel')) return 'HT';
    if (key.includes('forex')) return 'FX';
    if (key.includes('profile')) return 'MP';
    if (key.includes('login')) return 'IN';
    if (key.includes('faq')) return 'QA';
    if (key.includes('contact')) return 'CT';
    if (key.includes('blog')) return 'BL';
    if (key.includes('about')) return 'AB';
    if (key.includes('testimonial')) return 'TS';
    return label.slice(0, 2).toUpperCase();
  };

  const toggleExpand = (label) => {
    setExpanded(expanded === label ? null : label);
  };

  const navGroup = [
    {
      label: 'Services',
      hasSub: true,
      subItems: [
        { label: 'Hotels Booking', href: '/hotels' },
        { label: 'Flight Booking', action: onFlightOpen },
        { label: 'Domestic Trips', href: '/packages?type=DOMESTIC' },
        { label: 'International Trips', href: '/packages?type=INTERNATIONAL' },
        { label: 'Customize Packages', href: '/customize' }
      ]
    },
    {
      label: 'Holiday Tour Packages',
      hasSub: true,
      subItems: packageCols.flat().map((item) => ({
        label: item.name,
        href: item.href,
      })),
    },
    { label: 'Hotels', href: HOTEL_HREF },
    { label: 'Forex', href: '/forex' },
    { label: 'Testimonial', href: '/testimonials' },
    { label: 'FAQ', href: '/contact#faq' },
    { label: 'Contact us', href: '/contact' },
    { label: 'Blog', href: '/blog' },
    { label: 'About us', href: '/about' },
    ...(isLoggedIn
      ? [{ label: 'My Profile', href: '/profile' }]
      : [{ label: 'Login', href: '/auth/login' }]),
  ];

  const dynamicGroups = (allCategories || []).map(cat => ({
    label: cat.name,
    hasSub: (cat.destinations && cat.destinations.length > 0),
    subItems: (cat.destinations || []).map(dest => ({
      label: dest.name,
      href: getDestinationHref(dest)
    }))
  }));

  const navGroups = [...dynamicGroups, ...navGroup];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 2000,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'fixed', top: 0, right: 0,
          width: '100%', maxWidth: 360, height: '100vh',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', zIndex: 2001,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-18px 0 50px rgba(15,23,42,0.22)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #edf2f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 900, letterSpacing: 1.6, textTransform: 'uppercase' }}>
              Travel Menu
            </span>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', padding: 0, color: '#64748b', display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)', color: 'white', boxShadow: '0 14px 30px color-mix(in srgb, var(--color-primary) 24%, transparent)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 900 }}>
              {userInitial}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 17, fontWeight: 850, margin: 0, color: 'white' }}>
                Hello, {firstName}
              </h2>
              <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.74)', fontSize: 12, fontWeight: 700 }}>
                {isLoggedIn ? 'Manage your travel faster' : 'Sign in for saved trips'}
              </p>
            </div>
          </div>
          <div className="d-lg-none mt-3">
            <HeaderSearch isLightHeader={false} />
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 10px' }}>
          {navGroups?.map((group, idx) => {
            const isExpanded = expanded === group.label;
            const hasHref = !!group.href;
            const hasAction = typeof group.action === 'function';
            const navIcon = getNavIcon(group.label);

            const ItemTrigger = (
              <div
                onClick={() => {
                  if (group.hasSub) toggleExpand(group.label);
                  if (hasAction) {
                    group.action();
                    onClose();
                  }
                }}
                style={{
                  padding: '12px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isExpanded ? 'var(--color-primary-light)' : 'white',
                  border: isExpanded ? '1px solid var(--brand-primary-border)' : '1px solid #edf2f7',
                  borderRadius: 14,
                  boxShadow: isExpanded ? '0 10px 22px color-mix(in srgb, var(--color-primary) 14%, transparent)' : '0 4px 12px rgba(15,23,42,0.035)',
                }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 8%, white)'; }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'white'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <span style={{ width: 34, height: 34, flex: '0 0 34px', borderRadius: 11, display: 'grid', placeItems: 'center', background: isExpanded ? 'var(--color-primary)' : 'color-mix(in srgb, var(--color-primary) 10%, white)', color: isExpanded ? 'white' : 'var(--color-primary)', fontSize: 10, fontWeight: 950, letterSpacing: 0.3 }}>
                    {navIcon}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: isExpanded ? 850 : 750, color: isExpanded ? '#0f172a' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {group.label}
                  </span>
                </span>
                <span style={{ width: 28, height: 28, borderRadius: 9, display: 'grid', placeItems: 'center', color: isExpanded ? 'var(--color-primary)' : '#94a3b8', background: isExpanded ? '#fff' : 'color-mix(in srgb, var(--color-primary) 6%, white)' }}>
                  {group.hasSub ? (
                    <svg
                      viewBox="0 0 24 24" fill="currentColor" width="16" height="16"
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </span>
              </div>
            );

            return (
              <div key={idx} style={{ marginBottom: 9 }}>
                {hasHref ? (
                  <Link href={group.href} style={{ textDecoration: 'none' }} onClick={onClose}>
                    {ItemTrigger}
                  </Link>
                ) : hasAction ? (
                  <button type="button" style={{ width: '100%', border: 0, background: 'transparent', padding: 0, textAlign: 'left' }}>
                    {ItemTrigger}
                  </button>
                ) : ItemTrigger}

                {/* Expanded Sub-items */}
                {group.hasSub && isExpanded && (
                  <div style={{ display: 'grid', gap: 7, padding: '10px 4px 4px 48px' }}>
                    {group.subItems.map((sub, sidx) => {
                      const isObj = typeof sub === 'object';
                      const label = isObj ? sub.label : sub;
                      const href = isObj ? sub.href : '#';
                      const hasSubAction = isObj && typeof sub.action === 'function';

                      const ItemContent = (
                        <div
                          style={{
                            padding: '9px 12px',
                            borderRadius: 11,
                            background: '#fff',
                            border: '1px solid #eef2f7',
                            fontSize: '12.5px',
                            fontWeight: 750,
                            color: '#475569',
                            cursor: 'pointer',
                            transition: 'color 0.2s, background 0.2s, border-color 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 8%, white)'; e.currentTarget.style.borderColor = 'var(--brand-primary-border)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#eef2f7'; }}
                        >
                          {label}
                        </div>
                      );

                      if (hasSubAction) {
                        return (
                          <div
                            key={sidx}
                            onClick={() => {
                              sub.action();
                              onClose();
                            }}
                          >
                            {ItemContent}
                          </div>
                        );
                      }

                      return isObj && href !== '#' ? (
                        <Link key={sidx} href={href} style={{ textDecoration: 'none' }} onClick={onClose}>
                          {ItemContent}
                        </Link>
                      ) : (
                        <div key={sidx}>{ItemContent}</div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 18px 20px', background: '#ffffff', borderTop: '1px solid #edf2f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ color: '#0f172a', fontSize: 12, fontWeight: 900 }}>Need help planning?</div>
              <div style={{ marginTop: 2, color: '#64748b', fontSize: 12, fontWeight: 700 }}>{displayPhone}</div>
            </div>
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: '#dc2626',
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 999,
                  padding: '9px 13px',
                }}
              >
                Sign out
              </button>
            ) : (
              <Link href="/auth/login" onClick={onClose} style={{ fontSize: 12, fontWeight: 900, color: 'white', background: 'var(--color-primary)', borderRadius: 999, padding: '10px 14px', textDecoration: 'none' }}>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main Navbar ──────────────────────────────────────── */
import {
  AUTH_CHANGED_EVENT,
  clearAuthSession,
  convertForexRate,
  getCategories,
  getDestinationsByCategory,
  getForexRateByCode,
  getForexRates,
  getForexServiceCharge,
  getStoredAuth,
  getStoredToken,
} from '@/utils/api';

const getLogoUrl = (logo) => {
  if (!logo) return '';
  if (/^(https?:|data:|blob:)/i.test(logo)) return logo;
  if (!String(logo).startsWith('/uploads')) return logo;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_IMAGE_URL || 'https://tourtravel.yber.in';
  return `${baseUrl.replace(/\/$/, '')}/${String(logo).replace(/^\//, '')}`;
};

/* ── Header Search Component ───────────────────────────── */
function HeaderSearch({ isLightHeader }) {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLocationLabel = (loc) => {
    if (loc.type === 'country') return loc.name;
    return `${loc.name}, ${loc.country?.name || 'Country'}`;
  };

  useEffect(() => {
    const query = destination.trim();
    if (selectedLocation && query === getLocationLabel(selectedLocation)) return;
    if (query.length < 2) return;

    let active = true;
    const debounceTimer = setTimeout(async () => {
      const result = await searchCountryCityLocations({ search: query, limit: 10 });
      if (!active) return;
      setLocationSuggestions(result.suggestions || []);
      setLocationLoading(false);
      setLocationOpen(true);
    }, 350);

    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [destination, selectedLocation]);

  const handleSearch = (locToSearch = selectedLocation) => {
    setLocationOpen(false);
    if (locToSearch) {
      if (locToSearch.type === 'country') {
        router.push(`/packages?country=${locToSearch.id}`);
      } else {
        router.push(`/packages?city=${locToSearch.id}`);
      }
      return;
    }
    const q = destination.trim();
    if (q) {
      router.push(`/packages?search=${encodeURIComponent(q)}`);
    } else {
      router.push('/packages');
    }
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="d-none d-lg-flex">
      <div style={{
        display: 'flex', alignItems: 'center', background: isLightHeader ? 'rgba(255,255,255,0.15)' : '#f9fafb',
        border: isLightHeader ? '1.5px solid rgba(255,255,255,0.3)' : '1.5px solid #e5e7eb',
        borderRadius: 20, padding: '4px 12px', width: 220, transition: 'all 0.2s'
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={isLightHeader ? 'white' : '#64748b'} strokeWidth="2.5" width="16" height="16">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={destination}
          onChange={(e) => {
            const val = e.target.value;
            setDestination(val);
            setSelectedLocation(null);
            if (val.trim().length < 2) {
              setLocationSuggestions([]);
              setLocationLoading(false);
              setLocationOpen(false);
            } else {
              setLocationLoading(true);
              setLocationOpen(true);
            }
          }}
          onFocus={() => { if (destination.trim().length >= 2) setLocationOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (locationOpen && locationSuggestions[0]) {
                handleSearch(locationSuggestions[0]);
              } else {
                handleSearch();
              }
            }
          }}
          style={{
            border: 'none', background: 'transparent', outline: 'none',
            color: isLightHeader ? 'white' : '#1f2937', fontSize: 14,
            width: '100%', marginLeft: 8, fontFamily: 'Inter, sans-serif'
          }}
        />
      </div>
      {locationOpen && (locationLoading || locationSuggestions.length > 0) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 280,
          background: '#fff', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 50, overflow: 'hidden', border: '1px solid #e2e8f0'
        }}>
          {locationLoading ? (
            <div style={{ padding: 12, fontSize: 13, color: '#64748b' }}>Searching...</div>
          ) : (
            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
              {locationSuggestions.map((loc, i) => (
                <button
                  key={`hs-${loc.id}-${i}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setDestination(getLocationLabel(loc));
                    setSelectedLocation(loc);
                    handleSearch(loc);
                  }}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    padding: '10px 14px', border: 'none', borderBottom: '1px solid #f1f5f9',
                    background: 'transparent', cursor: 'pointer', textAlign: 'left',
                    alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getLocationLabel(loc)}
                  </span>
                  <span style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 4,
                    background: loc.type === 'country' ? '#e0f2fe' : '#dcfce7',
                    color: loc.type === 'country' ? '#0369a1' : '#15803d',
                    textTransform: 'uppercase', fontWeight: 700
                  }}>
                    {loc.type || 'city'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ brand, companyInfo }) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [atHero, setAtHero] = useState(true);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [forexOpen, setForexOpen] = useState(false);
  const [forexDraft, setForexDraft] = useState(emptyForexInquiry);
  const [forexInquiry, setForexInquiry] = useState('');
  const [forexRates, setForexRates] = useState([]);
  const [forexRatesLoading, setForexRatesLoading] = useState(false);
  const [forexRatesError, setForexRatesError] = useState('');
  const [forexLookupLoading, setForexLookupLoading] = useState(false);
  const [forexLookupRate, setForexLookupRate] = useState(null);
  const [forexServiceCharge, setForexServiceCharge] = useState(null);
  const [forexConversion, setForexConversion] = useState(null);
  const [flightOpen, setFlightOpen] = useState(false);
  const [flightDraft, setFlightDraft] = useState(emptyFlightDraft);
  const [flightLoading, setFlightLoading] = useState(false);
  const pathname = usePathname();

  const isHeroPage = pathname === '/' || pathname === '/packages' || pathname.startsWith('/package') || pathname.startsWith('/tours') || pathname.startsWith('/hotels') || pathname.startsWith('/about') || pathname.startsWith('/blog') || pathname.startsWith('/contact');

  useEffect(() => {
    const fetchNavbarCategoriesAndDests = async () => {
      const allCats = await getCategories();

      // Helper to fetch destinations for a list of categories
      const enrichCategories = async (cats) => {
        return await Promise.all(
          cats.map(async (cat) => {
            const apiDests = await getDestinationsByCategory(cat.id);
            let mappedItems = apiDests.map(item => {
              const tagStr = item.type ? item.type.split(',')[0].trim().toUpperCase() : null;
              return {
                name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
                href: getDestinationHref(item),
                tag: tagStr,
                tagClr: tagStr === 'BEACH' ? '#ef4444' : 'var(--color-primary)',
                tagBg: tagStr === 'BEACH' ? '#fef2f2' : '#e0f2fe'
              };
            });

            if (mappedItems.length > 0) {
              mappedItems.push({
                name: `Explore All →`,
                href: `/tours?destination`,
                isExplore: true
              });
            }

            // Distribute into 3 columns automatically
            const columnCount = 3;
            const itemsPerCol = Math.ceil(mappedItems.length / columnCount) || 1;
            const cols = [];
            for (let i = 0; i < mappedItems.length; i += itemsPerCol) {
              cols.push(mappedItems.slice(i, i + itemsPerCol));
            }
            return { ...cat, destinations: apiDests, cols };
          })
        );
      };

      // Filter for Menu (Desktop)
      const menuCatsRaw = allCats.filter(cat => cat.show_in_menu === true);
      const menuCats = await enrichCategories(menuCatsRaw);
      setCategories(menuCats);

      // Filter for Sidebar (Mobile) - Include both menu and sidebar flagged categories
      const sidebarCatsRaw = allCats.filter(cat => cat.show_in_sidebar == true || cat.show_in_menu == true);
      const sidebarCats = await enrichCategories(sidebarCatsRaw);
      setAllCategories(sidebarCats);
    };
    fetchNavbarCategoriesAndDests();
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      const token = getStoredToken();
      setIsLoggedIn(Boolean(token));
      setCurrentUser(getStoredAuth());
    };

    syncAuthState();
    window.addEventListener('storage', syncAuthState);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
    };
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setAtHero(y < 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawerOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (currentUser) {
      setFlightDraft(prev => ({
        ...prev,
        customerName: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      }));
    } else {
      setFlightDraft(prev => ({
        ...prev,
        customerName: '',
        email: '',
        phone: ''
      }));
    }
  }, [currentUser]);

  const updateFlightDraft = (key, value) => {
    setFlightDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleFlightSubmit = async (event) => {
    event.preventDefault();
    setFlightLoading(true);

    try {
      const passengerStr = `${flightDraft.adults} Adult${flightDraft.adults > 1 ? 's' : ''}${flightDraft.children > 0 ? `, ${flightDraft.children} Child${flightDraft.children > 1 ? 'ren' : ''}` : ''}`;

      const flightDetails = [
        `Flight Booking Inquiry Details:`,
        `- Trip Type: ${flightDraft.tripType}`,
        `- From: ${flightDraft.departureCity}`,
        `- To: ${flightDraft.destinationCity}`,
        `- Departure Date: ${flightDraft.departureDate}`,
        flightDraft.tripType === 'Round-trip' ? `- Return Date: ${flightDraft.returnDate}` : '',
        `- Passengers: ${passengerStr}`,
        `- Cabin Class: ${flightDraft.cabinClass}`,
        `- Customer: ${flightDraft.customerName}`,
        `- Contact: ${flightDraft.phone} | ${flightDraft.email}`,
        flightDraft.notes.trim() ? `- Special Requests: ${flightDraft.notes.trim()}` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        pipeline_id: 3,
        name: flightDraft.customerName || 'Flight Inquiry',
        email: flightDraft.email || '',
        phone: flightDraft.phone || '',
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
        throw new Error(resData?.message || 'Unable to submit your flight inquiry.');
      }

      toast.success(resData.message || 'Flight inquiry submitted successfully! Our team will contact you shortly.');
      setFlightDraft(prev => ({
        ...emptyFlightDraft,
        customerName: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || ''
      }));
      setFlightOpen(false);
    } catch (error) {
      toast.error(error.message || 'Unable to submit your flight inquiry. Please try again.');
    } finally {
      setFlightLoading(false);
    }
  };

  useEffect(() => {
    if (!forexOpen) return undefined;

    let active = true;

    const loadForexRates = async () => {
      setForexRatesLoading(true);
      setForexRatesError('');

      const [result, chargeResult] = await Promise.all([
        getForexRates(),
        getForexServiceCharge(),
      ]);
      if (!active) return;

      const rows = forexRowsFromPayload(result).map(normalizeForexRate).filter((rate) => rate.code);
      setForexRates(rows);
      setForexServiceCharge(normalizeForexServiceCharge(chargeResult));

      if (!rows.length) {
        setForexRatesError(result?.message || 'Active forex rates are not available right now.');
      }

      setForexRatesLoading(false);
    };

    loadForexRates();

    return () => {
      active = false;
    };
  }, [forexOpen]);

  const forexOptions = useMemo(() => buildForexOptions(forexRates), [forexRates]);
  const forexEstimate = useMemo(() => {
    const rows = forexLookupRate ? [forexLookupRate, ...forexRates] : forexRates;
    const match = findForexRateMatch(rows, forexDraft.fromCurrency, forexDraft.toCurrency);
    const amount = Number(forexDraft.amount || 0);

    if (!match || !amount) return { match, convertedAmount: null };

    return {
      match,
      convertedAmount: amount * match.rate,
    };
  }, [forexDraft.amount, forexDraft.fromCurrency, forexDraft.toCurrency, forexLookupRate, forexRates]);

  if (pathname?.startsWith('/auth') || pathname === '/customize') {
    return null;
  }

  const brandLogo = pathname === '/forex'
    ? '/forex-logo-new.png'
    : (getLogoUrl(companyInfo?.company_logo_url) || brand?.logo || '/logooo.png');
  const brandName = brand?.legalName || 'ITS TRAVELS AND TOURS';
  const isTransparent = false;
  const isLightHeader = true;
  const linkColor = isLightHeader ? 'rgba(255,255,255,0.92)' : '#374151';
  const navButtonStyle = {
    padding: '8px 18px',
    borderRadius: 8,
    border: isLightHeader ? '1.5px solid rgba(255,255,255,0.6)' : '1.5px solid #d1d5db',
    color: isLightHeader ? 'white' : '#374151',
    fontWeight: 600,
    fontSize: 15,
    textDecoration: 'none',
    background: isLightHeader ? 'rgba(255,255,255,0.1)' : 'white',
    backdropFilter: 'blur(6px)',
    transition: 'all 0.2s',
  };

  const updateForexDraft = (key, value) => {
    setForexDraft((current) => ({ ...current, [key]: value }));
    setForexConversion(null);
    setForexInquiry('');
  };

  const generateForexInquiry = async (event) => {
    event.preventDefault();
    const customerId = getCustomerId(currentUser);
    const amountValue = Number(forexDraft.amount || 0);

    if (!customerId) {
      setForexRatesError('Please login before creating a forex conversion request.');
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setForexRatesError('Enter a valid conversion amount.');
      return;
    }

    setForexLookupLoading(true);
    setForexRatesError('');
    setForexConversion(null);

    const [lookup, conversionResponse] = await Promise.all([
      getForexRateByCode(forexDraft.fromCurrency),
      convertForexRate({
        customerId,
        fromCurrency: forexDraft.fromCurrency,
        toCurrency: forexDraft.toCurrency,
        amount: amountValue,
      }),
    ]);
    const lookupRows = forexRowsFromPayload(lookup).map(normalizeForexRate).filter((rate) => rate.code);
    const nextLookupRate = lookupRows[0] || null;
    setForexLookupRate(nextLookupRate);

    const fromCurrency = forexOptions.find((currency) => currency.code === forexDraft.fromCurrency);
    const toCurrency = forexOptions.find((currency) => currency.code === forexDraft.toCurrency);
    const amount = amountValue.toLocaleString('en-IN');
    const lookupEstimate = findForexRateMatch(
      nextLookupRate ? [nextLookupRate, ...forexRates] : forexRates,
      forexDraft.fromCurrency,
      forexDraft.toCurrency
    );
    const convertedAmount = lookupEstimate && amountValue ? amountValue * lookupEstimate.rate : null;
    const normalizedConversion = normalizeForexConversion(conversionResponse, {
      rate: lookupEstimate?.rate,
      convertedAmount,
    });
    const contact = [
      forexDraft.customerName && `Name: ${forexDraft.customerName.trim()}`,
      forexDraft.phone && `Phone: ${forexDraft.phone.trim()}`,
      forexDraft.email && `Email: ${forexDraft.email.trim()}`,
    ].filter(Boolean).join(' | ');

    if (conversionResponse?.success === false) {
      setForexRatesError(conversionResponse?.message || 'Unable to create the forex conversion request.');
    }

    setForexConversion(normalizedConversion);
    setForexInquiry([
      `Forex inquiry to convert ${amount} ${fromCurrency?.code || forexDraft.fromCurrency} to ${toCurrency?.code || forexDraft.toCurrency}.`,
      normalizedConversion?.convertedAmount ? `Converted value: ${formatMoneyValue(normalizedConversion.convertedAmount, toCurrency?.code || forexDraft.toCurrency)}.` : convertedAmount ? `Estimated value: ${formatMoneyValue(convertedAmount, toCurrency?.code || forexDraft.toCurrency)} at ${formatMoneyValue(lookupEstimate.rate, toCurrency?.code || forexDraft.toCurrency)} per ${fromCurrency?.code || forexDraft.fromCurrency}.` : 'Rate will be confirmed by the forex team.',
      normalizedConversion?.serviceCharge ? `Service charge: ${formatMoneyValue(normalizedConversion.serviceCharge, toCurrency?.code || forexDraft.toCurrency)}.` : '',
      normalizedConversion?.totalAmount ? `Total amount: ${formatMoneyValue(normalizedConversion.totalAmount, toCurrency?.code || forexDraft.toCurrency)}.` : '',
      normalizedConversion?.requestId ? `Request ID: ${normalizedConversion.requestId}.` : '',
      `Purpose: ${forexDraft.purpose}.`,
      forexDraft.travelDate ? `Travel date: ${forexDraft.travelDate}.` : '',
      contact,
      forexDraft.notes.trim() ? `Notes: ${forexDraft.notes.trim()}` : '',
    ].filter(Boolean).join(' '));

    if (!normalizedConversion && !lookupRows.length && !lookupEstimate) {
      setForexRatesError(lookup?.message || 'No active rate found for the selected currency pair.');
    }

    setForexLookupLoading(false);
  };

  const swapForexCurrencies = () => {
    setForexDraft((current) => ({
      ...current,
      fromCurrency: current.toCurrency,
      toCurrency: current.fromCurrency,
    }));
    setForexConversion(null);
    setForexInquiry('');
  };

  return (
    <>
      {/* Inject keyframe for dropdown animation */}
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .nav-plain-link {
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          padding: 6px 2px;
          transition: color 0.2s;
          position: relative;
        }
        .nav-plain-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 2px;
          background: var(--color-primary);
          border-radius: 999px;
          transition: width 0.25s;
        }
        .nav-plain-link:hover::after,
        .nav-plain-link.active::after { width: 100%; }
        .forex-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.58);
          backdrop-filter: blur(5px);
        }
        .forex-modal {
          width: min(100%, 720px);
          max-height: min(86vh, 760px);
          overflow: auto;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 28px 70px rgba(0,0,0,0.28);
        }
        .forex-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 22px 24px;
          background: linear-gradient(135deg, #083d5b, #108173);
          color: #fff;
        }
        .forex-modal-head span {
          display: block;
          margin-bottom: 6px;
          color: #c9fff2;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .8px;
          text-transform: uppercase;
        }
        .forex-modal-head h2 {
          margin: 0 0 6px;
          font-family: Poppins, sans-serif;
          font-size: 24px;
          font-weight: 900;
        }
        .forex-modal-head p {
          margin: 0;
          color: rgba(255,255,255,.8);
          font-size: 14px;
          line-height: 1.5;
        }
        .forex-modal-close {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255,255,255,.35);
          border-radius: 50%;
          background: rgba(255,255,255,.12);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex: 0 0 auto;
        }
        .forex-modal-form {
          display: grid;
          gap: 16px;
          padding: 20px 22px 22px;
        }
        .forex-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .forex-modal-grid label {
          display: grid;
          gap: 7px;
          color: #334155;
          font-size: 12px;
          font-weight: 900;
        }
        .forex-conversion-row {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 42px minmax(0, 1fr);
          gap: 10px;
          align-items: end;
        }
        .forex-currency-field {
          min-width: 0;
        }
        .forex-currency-combobox {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 42px;
          grid-template-areas:
            "selected toggle"
            "search toggle";
          min-height: 64px;
          border: 1px solid #d8dee8;
          border-radius: 8px;
          background: #fff;
          transition: border-color .18s ease, box-shadow .18s ease;
        }
        .forex-currency-combobox.is-open {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent);
        }
        .forex-currency-selected {
          grid-area: selected;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          padding: 9px 12px 0;
        }
        .forex-currency-selected strong {
          color: #0f172a;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: .3px;
        }
        .forex-currency-selected span {
          min-width: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forex-currency-selected em {
          flex: 0 0 auto;
          padding: 2px 6px;
          border-radius: 999px;
          background: #ecfeff;
          color: #0369a1;
          font-size: 10px;
          font-style: normal;
          font-weight: 900;
        }
        .forex-currency-combobox input {
          grid-area: search;
          min-height: 28px;
          border: 0;
          border-radius: 0;
          padding: 0 12px 8px;
          color: #111827;
          font-size: 13px;
          font-weight: 700;
          outline: none;
        }
        .forex-currency-combobox > button {
          grid-area: toggle;
          border: 0;
          border-left: 1px solid #edf1f5;
          border-radius: 0 8px 8px 0;
          background: #f8fafc;
          color: #334155;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .forex-currency-combobox.is-open > button svg {
          transform: rotate(180deg);
        }
        .forex-currency-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 30;
          max-height: 248px;
          overflow-y: auto;
          border: 1px solid #dbe5ef;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 18px 42px rgba(15,23,42,.18);
          padding: 6px;
        }
        .forex-currency-menu button {
          width: 100%;
          border: 0;
          border-radius: 7px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px;
          text-align: left;
          cursor: pointer;
        }
        .forex-currency-menu button:hover,
        .forex-currency-menu button.active {
          background: #eff6ff;
        }
        .forex-currency-menu button span {
          display: grid;
          gap: 2px;
          min-width: 0;
        }
        .forex-currency-menu button strong {
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
        }
        .forex-currency-menu button small {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forex-currency-menu button em {
          flex: 0 0 auto;
          max-width: 120px;
          color: #0369a1;
          font-size: 11px;
          font-style: normal;
          font-weight: 900;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forex-currency-empty {
          padding: 14px 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          text-align: center;
        }
        .forex-swap-button {
          width: 42px;
          height: 42px;
          margin-bottom: 11px;
          border: 1px solid #cfd9e6;
          border-radius: 50%;
          background: #fff;
          color: var(--color-primary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform .18s ease, background .18s ease, color .18s ease;
        }
        .forex-swap-button:hover {
          background: var(--color-primary);
          color: #fff;
          transform: rotate(180deg);
        }
        .forex-modal-grid input,
        .forex-modal-grid select,
        .forex-modal-grid textarea {
          width: 100%;
          border: 1px solid #d8dee8;
          border-radius: 8px;
          background: #fff;
          color: #111827;
          font: inherit;
          font-size: 14px;
          outline: none;
        }
        .forex-modal-grid input,
        .forex-modal-grid select {
          min-height: 44px;
          padding: 0 12px;
        }
        .forex-modal-grid textarea {
          min-height: 92px;
          padding: 12px;
          resize: vertical;
        }
        .forex-modal-grid .forex-currency-combobox input {
          min-height: 28px;
          border: 0;
          border-radius: 0;
          padding: 0 12px 8px;
        }
        .forex-modal-notes { grid-column: 1 / -1; }
        .forex-rate-preview {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 16px;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          background: #f0f9ff;
          color: #0f172a;
        }
        .forex-rate-preview strong {
          display: block;
          color: #075985;
          font-size: 13px;
          font-weight: 950;
        }
        .forex-rate-preview span {
          display: block;
          margin-top: 3px;
          color: #334155;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.45;
        }
        .forex-rate-preview small {
          flex: 0 0 auto;
          color: #0369a1;
          font-size: 12px;
          font-weight: 900;
          text-align: right;
        }
        .forex-charge-note {
          grid-column: 1 / -1;
          margin-top: -6px;
          color: #475569;
          font-size: 12px;
          font-weight: 850;
        }
        .forex-rate-error {
          grid-column: 1 / -1;
          margin: 0;
          padding: 11px 13px;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          background: #fff7ed;
          color: #9a3412;
          font-size: 13px;
          font-weight: 850;
        }
        .forex-modal-form > button {
          justify-self: start;
          min-height: 44px;
          padding: 0 18px;
          border: 0;
          border-radius: 8px;
          background: var(--color-primary);
          color: #fff;
          font-weight: 900;
          cursor: pointer;
        }
        .forex-modal-form > button:disabled {
          cursor: wait;
          opacity: .72;
        }
        .forex-modal-output {
          padding: 15px 16px;
          border: 1px solid #bfe7d9;
          border-radius: 8px;
          background: #effdf7;
          color: #14532d;
        }
        .forex-modal-output strong {
          display: block;
          margin-bottom: 5px;
          font-size: 13px;
          font-weight: 900;
        }
        .forex-result-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin: 10px 0 12px;
        }
        .forex-result-grid span {
          min-height: 62px;
          padding: 10px;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          background: #f7fee7;
          color: #14532d;
          font-size: 13px;
          font-weight: 900;
          overflow-wrap: anywhere;
        }
        .forex-result-grid b {
          display: block;
          margin-bottom: 4px;
          color: #4d7c0f;
          font-size: 11px;
          text-transform: uppercase;
        }
        .forex-modal-output p {
          margin: 0;
          color: #166534;
          font-size: 14px;
          line-height: 1.55;
        }
        @media (max-width: 640px) {
          .forex-modal-grid { grid-template-columns: 1fr; }
          .forex-conversion-row {
            grid-template-columns: 1fr;
          }
          .forex-swap-button {
            justify-self: center;
            margin: 0;
            transform: rotate(90deg);
          }
          .forex-swap-button:hover {
            transform: rotate(270deg);
          }
          .forex-modal-head { padding: 20px; }
          .forex-modal-form { padding: 18px; }
          .forex-rate-preview {
            align-items: flex-start;
            flex-direction: column;
          }
          .forex-rate-preview small {
            text-align: left;
          }
          .forex-result-grid {
            grid-template-columns: 1fr;
          }
        }

        .flight-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.58);
          backdrop-filter: blur(5px);
        }
        .flight-modal {
          width: min(100%, 680px);
          max-height: min(90vh, 740px);
          overflow: auto;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 24px 60px rgba(15,23,42,0.24);
        }
        .flight-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 24px 28px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
          color: #fff;
        }
        .flight-modal-head span {
          display: block;
          margin-bottom: 6px;
          color: rgba(255,255,255,0.8);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .flight-modal-head h2 {
          margin: 0 0 6px;
          font-family: Poppins, sans-serif;
          font-size: 22px;
          font-weight: 850;
        }
        .flight-modal-head p {
          margin: 0;
          color: rgba(255,255,255,0.76);
          font-size: 13.5px;
          line-height: 1.5;
        }
        .flight-modal-close {
          width: 34px;
          height: 34px;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .flight-modal-close:hover {
          background: rgba(255,255,255,0.2);
        }
        .flight-modal-form {
          display: grid;
          gap: 20px;
          padding: 28px;
        }
        .flight-trip-type-selector {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid #edf2f7;
          padding-bottom: 16px;
        }
        .flight-trip-type-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .flight-trip-type-btn.active {
          background: var(--color-primary-light);
          color: var(--color-primary);
          border: 1.5px solid var(--brand-primary-border);
        }
        .flight-trip-type-btn.inactive {
          background: #f8fafc;
          color: #64748b;
          border: 1.5px solid #e2e8f0;
        }
        .flight-trip-type-btn:hover {
          border-color: var(--brand-primary-border);
        }
        .flight-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .flight-modal-grid label {
          display: grid;
          gap: 7px;
          color: #334155;
          font-size: 12px;
          font-weight: 850;
        }
        .flight-modal-grid input,
        .flight-modal-grid select,
        .flight-modal-grid textarea {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          color: #1e293b;
          font: inherit;
          font-size: 13.5px;
          font-weight: 600;
          outline: none;
          min-height: 42px;
          padding: 0 12px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .flight-modal-grid input:focus,
        .flight-modal-grid select:focus,
        .flight-modal-grid textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }
        .flight-modal-grid textarea {
          min-height: 80px;
          padding: 10px 12px;
          resize: vertical;
        }
        .flight-grid-full {
          grid-column: 1 / -1;
        }
        .flight-submit-btn {
          min-height: 44px;
          padding: 0 24px;
          border: 0;
          border-radius: 8px;
          background: var(--color-primary);
          color: #fff;
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .flight-submit-btn:hover {
          background: var(--color-primary-hover);
        }
        .flight-submit-btn:disabled {
          cursor: not-allowed;
          opacity: 0.72;
        }
        @media (max-width: 640px) {
          .flight-modal-grid { grid-template-columns: 1fr; }
          .flight-modal-head { padding: 20px; }
          .flight-modal-form { padding: 20px; }
        }
        .top-bar-announcement {
          position: relative;
          width: 100%;
          height: 48px;
          z-index: 2200;
          background: linear-gradient(90deg, #1e3a8a 0%, #0ea5e9 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        @media (max-width: 767px) {
          .top-bar-announcement {
            height: 40px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="top-bar-announcement animate-fade-up delay-100">
        <span style={{ marginRight: 16 }}>🎉</span>
        Celebrating 27 Years of Excellence in Travel!
        <span style={{ marginLeft: 16 }}>🌍</span>
      </div>

      <header
        className="navbar-custom scrolled"
        style={{ background: undefined }}
      >

        <div className="container">
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

            {/* Logo */}
            <Link href="/" className="animate-fade-up delay-200" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <Image
                src={brandLogo}
                alt={`${brandName} Logo`}
                width={64}
                height={64}
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
                priority
              />
              {pathname === '/forex' ? (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 900,
                    fontSize: '15px',
                    letterSpacing: '1px',
                    color: isLightHeader ? '#ffffff' : '#1e3a8a',
                    textShadow: isLightHeader ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>
                    Karnation India
                  </span>
                  <span style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: '11px',
                    color: isLightHeader ? 'rgba(255,255,255,0.92)' : '#f97316',
                    textShadow: isLightHeader ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                  }}>
                    Forex Services Pvt. Ltd.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                  <span style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 900,
                    fontSize: '17px',
                    letterSpacing: '1.5px',
                    color: isLightHeader ? '#ffffff' : 'var(--color-primary)',
                    textShadow: isLightHeader ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                    textTransform: 'uppercase'
                  }}>
                    ITS
                  </span>
                  <span style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: isLightHeader ? 'rgba(255,255,255,0.92)' : '#4b5563',
                    textShadow: isLightHeader ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.2px'
                  }}>
                    Travels &amp; Tours
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Center Links (Hidden on Mobile) */}
            <ul style={{
              display: 'flex', alignItems: 'center', gap: 28,
              listStyle: 'none', margin: 0, padding: 0,
              flex: 1, justifyContent: 'center'
            }}
              className="d-none d-lg-flex"
            >
              <Link href="/flights" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLightHeader ? 'rgba(255,255,255,0.92)' : '#374151', textDecoration: 'none', fontWeight: 700, fontSize: 18, transition: 'color 0.2s' }} onMouseEnter={e => { if (!isLightHeader) e.currentTarget.style.color = 'var(--color-primary)'; }} onMouseLeave={e => { if (!isLightHeader) e.currentTarget.style.color = '#374151'; }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6.5 5.5L6 17l-3-1-1.5 1.5 4 2.5 2.5 4 1.5-1.5-1-3 3.5-3.5 5.5 6.5l1.2-.7c.4-.2.7-.6.6-1.1z" /></svg>
                Flights
              </Link>
              <Link href={HOTEL_HREF} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLightHeader ? 'rgba(255,255,255,0.92)' : '#374151', textDecoration: 'none', fontWeight: 700, fontSize: 18, transition: 'color 0.2s' }} onMouseEnter={e => { if (!isLightHeader) e.currentTarget.style.color = 'var(--color-primary)'; }} onMouseLeave={e => { if (!isLightHeader) e.currentTarget.style.color = '#374151'; }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4v18M13 21V3l8 4v14M9 11v.01M9 15v.01M17 11v.01M17 15v.01" /></svg>
                Hotels
              </Link>
              <MegaDropdown
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 18, fontWeight: 700 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12V22M12 2v10M12 12c-5 0-9-4-9-9h18c0 5-4 9-9 9z" /></svg>
                    Holidays
                  </span>
                }
                cols={packageCols}
                isTransparent={isLightHeader}
              />
              <Link href="/cruise" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLightHeader ? 'rgba(255,255,255,0.92)' : '#374151', textDecoration: 'none', fontWeight: 700, fontSize: 18, transition: 'color 0.2s' }} onMouseEnter={e => { if (!isLightHeader) e.currentTarget.style.color = 'var(--color-primary)'; }} onMouseLeave={e => { if (!isLightHeader) e.currentTarget.style.color = '#374151'; }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 21c3 0 5-1.5 7-1.5s4 1.5 7 1.5 5-1.5 7-1.5M2 17c3 0 5-1.5 7-1.5s4 1.5 7 1.5 5-1.5 7-1.5" /><path d="M5 14l2-8h10l2 8" /></svg>
                Cruise
              </Link>
              <Link href="/forex" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLightHeader ? 'rgba(255,255,255,0.92)' : '#374151', textDecoration: 'none', fontWeight: 700, fontSize: 18, transition: 'color 0.2s' }} onMouseEnter={e => { if (!isLightHeader) e.currentTarget.style.color = 'var(--color-primary)'; }} onMouseLeave={e => { if (!isLightHeader) e.currentTarget.style.color = '#374151'; }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8M12 6v2M12 16v2" /></svg>
                Forex
              </Link>

              <MegaDropdown
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 18, fontWeight: 700 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /><circle cx="5" cy="12" r="2" /></svg>
                    More
                  </span>
                }
                cols={[
                  [
                    { name: 'Visa Services', href: '/visa' },
                    { name: 'Euro Rails', href: '/eurorail' },
                    { name: 'Events & Weddings', href: '/events' },
                    { name: 'Conferences', href: '/conferences' }
                  ],
                  ...(categories.length > 0 ? [categories.map(c => ({ name: c.name, href: `/packages?category=${c.id}` }))] : [destinationCols[0]])
                ]}
                isTransparent={isLightHeader}
              />
            </ul>

            {/* Right side controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              <HeaderSearch isLightHeader={isLightHeader} />

              {isLoggedIn ? (
                <Link
                  href="/profile"
                  className="d-none d-lg-inline-flex"
                  style={navButtonStyle}
                >
                  My Profile
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="d-none d-lg-inline-flex"
                  style={{
                    ...navButtonStyle,
                    padding: '8px 22px',
                  }}
                >
                  Login
                </Link>
              )}

              {/* Desktop Hamburger Button / Drawer Toggle */}
              <button
                type="button"
                aria-label="Open travel menu"
                className="d-none d-lg-inline-flex"
                onClick={() => setDrawerOpen(true)}
                style={{
                  width: 40,
                  height: 40,
                  background: isLightHeader ? 'rgba(255,255,255,0.15)' : '#f9fafb',
                  border: isLightHeader ? '1.5px solid rgba(255,255,255,0.3)' : '1.5px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isLightHeader ? 'white' : '#374151',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                </svg>
              </button>

              {/* Hamburger Button / Drawer Toggle */}
              <button
                type="button"
                aria-label="Open travel menu"
                className="d-lg-none"
                onClick={() => setDrawerOpen(true)}
                style={{
                  background: isLightHeader ? 'rgba(255,255,255,0.15)' : '#f9fafb',
                  border: isLightHeader ? '1.5px solid rgba(255,255,255,0.3)' : '1.5px solid #e5e7eb',
                  borderRadius: 8, padding: '7px 10px',
                  transform: 'translateX(-14px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isLightHeader ? 'white' : '#374151',
                  cursor: 'pointer',
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {forexOpen ? (
        <div className="forex-modal-backdrop" role="presentation" onMouseDown={() => setForexOpen(false)}>
          <section className="forex-modal" role="dialog" aria-modal="true" aria-labelledby="forex-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="forex-modal-head">
              <div>
                <span>Forex request</span>
                <h2 id="forex-modal-title">Generate currency inquiry</h2>
                <p>Select currencies to check active forex rates and prepare an inquiry for confirmation.</p>
              </div>
              <button type="button" className="forex-modal-close" aria-label="Close Forex inquiry" onClick={() => setForexOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="forex-modal-form" onSubmit={generateForexInquiry}>
              <div className="forex-modal-grid">
                <div className="forex-conversion-row">
                  <CurrencyCombobox
                    id="forex-from-currency"
                    label="Converting from"
                    value={forexDraft.fromCurrency}
                    onChange={(value) => updateForexDraft('fromCurrency', value)}
                    currencies={forexOptions}
                    loading={forexRatesLoading}
                  />
                  <button type="button" className="forex-swap-button" aria-label="Swap currencies" onClick={swapForexCurrencies}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h11l-3-3" />
                      <path d="M17 17H6l3 3" />
                    </svg>
                  </button>
                  <CurrencyCombobox
                    id="forex-to-currency"
                    label="Converting to"
                    value={forexDraft.toCurrency}
                    onChange={(value) => updateForexDraft('toCurrency', value)}
                    currencies={forexOptions}
                    loading={forexRatesLoading}
                  />
                </div>
                <label>
                  Amount
                  <input type="number" min="1" value={forexDraft.amount} onChange={(event) => updateForexDraft('amount', event.target.value)} placeholder="1000" required />
                </label>
                <label>
                  Purpose
                  <select value={forexDraft.purpose} onChange={(event) => updateForexDraft('purpose', event.target.value)}>
                    <option>Travel</option>
                    <option>Business</option>
                    <option>Education</option>
                    <option>Medical</option>
                  </select>
                </label>
                <label>
                  Date
                  <input type="date" value={forexDraft.travelDate} onChange={(event) => updateForexDraft('travelDate', event.target.value)} />
                </label>
                <label>
                  Customer name
                  <input value={forexDraft.customerName} onChange={(event) => updateForexDraft('customerName', event.target.value)} placeholder="Full name" />
                </label>
                <label>
                  Phone
                  <input value={forexDraft.phone} onChange={(event) => updateForexDraft('phone', event.target.value)} placeholder="+91 98765 43210" />
                </label>
                <label>
                  Email
                  <input type="email" value={forexDraft.email} onChange={(event) => updateForexDraft('email', event.target.value)} placeholder="name@example.com" />
                </label>
                <label className="forex-modal-notes">
                  Notes
                  <textarea value={forexDraft.notes} onChange={(event) => updateForexDraft('notes', event.target.value)} placeholder="Pickup city, delivery preference, or document details" rows="3" />
                </label>
                <div className="forex-rate-preview" aria-live="polite">
                  <div>
                    <strong>{forexLookupLoading || forexRatesLoading ? 'Checking active rates...' : forexConversion ? 'Confirmed conversion' : 'Rate estimate'}</strong>
                    {forexConversion?.convertedAmount ? (
                      <span>
                        {formatMoneyValue(Number(forexDraft.amount || 0), forexDraft.fromCurrency)} converts to {formatMoneyValue(forexConversion.convertedAmount, forexDraft.toCurrency)}.
                      </span>
                    ) : forexEstimate.match && forexEstimate.convertedAmount ? (
                      <span>
                        {formatMoneyValue(Number(forexDraft.amount || 0), forexDraft.fromCurrency)} is approximately {formatMoneyValue(forexEstimate.convertedAmount, forexDraft.toCurrency)}.
                      </span>
                    ) : (
                      <span>{isLoggedIn ? 'Create the request to verify the latest active rate for this currency pair.' : 'Login to create a forex conversion request.'}</span>
                    )}
                  </div>
                  {forexConversion?.rate ? (
                    <small>1 {forexDraft.fromCurrency} = {formatMoneyValue(forexConversion.rate, forexDraft.toCurrency)}</small>
                  ) : forexEstimate.match ? (
                    <small>1 {forexDraft.fromCurrency} = {formatMoneyValue(forexEstimate.match.rate, forexDraft.toCurrency)}</small>
                  ) : (
                    <small>Active API rates</small>
                  )}
                </div>
                {forexServiceCharge ? (
                  <div className="forex-charge-note">
                    Service charge: {forexServiceCharge.value ? `${forexServiceCharge.value}${forexServiceCharge.type.includes('percent') ? '%' : ` ${forexDraft.toCurrency}`}` : 'Configured in CRM'}
                  </div>
                ) : null}
                {forexRatesError ? <p className="forex-rate-error">{forexRatesError}</p> : null}
              </div>
              <button type="submit" disabled={forexLookupLoading || forexRatesLoading}>
                {forexLookupLoading ? 'Creating Request...' : 'Create Forex Request'}
              </button>
              {forexInquiry ? (
                <div className="forex-modal-output">
                  <strong>Forex request summary</strong>
                  {forexConversion ? (
                    <div className="forex-result-grid">
                      {forexConversion.requestId ? <span><b>Request</b>{forexConversion.requestId}</span> : null}
                      {forexConversion.convertedAmount ? <span><b>Converted</b>{formatMoneyValue(forexConversion.convertedAmount, forexDraft.toCurrency)}</span> : null}
                      {forexConversion.serviceCharge ? <span><b>Service charge</b>{formatMoneyValue(forexConversion.serviceCharge, forexDraft.toCurrency)}</span> : null}
                      {forexConversion.totalAmount ? <span><b>Total</b>{formatMoneyValue(forexConversion.totalAmount, forexDraft.toCurrency)}</span> : null}
                    </div>
                  ) : null}
                  <p>{forexInquiry}</p>
                </div>
              ) : null}
            </form>
          </section>
        </div>
      ) : null}

      {flightOpen ? (
        <div className="flight-modal-backdrop" role="presentation" onMouseDown={() => setFlightOpen(false)}>
          <section className="flight-modal" role="dialog" aria-modal="true" aria-labelledby="flight-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flight-modal-head">
              <div>
                <span>Flight Services</span>
                <h2 id="flight-modal-title">Book Flights at Best Rates</h2>
                <p>Send your trip requirements and our team will custom-build options for your journey.</p>
              </div>
              <button type="button" className="flight-modal-close" aria-label="Close Flight inquiry" onClick={() => setFlightOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="flight-modal-form" onSubmit={handleFlightSubmit}>
              <div className="flight-trip-type-selector">
                <button
                  type="button"
                  className={`flight-trip-type-btn ${flightDraft.tripType === 'Round-trip' ? 'active' : 'inactive'}`}
                  onClick={() => updateFlightDraft('tripType', 'Round-trip')}
                >
                  Round-trip
                </button>
                <button
                  type="button"
                  className={`flight-trip-type-btn ${flightDraft.tripType === 'One-way' ? 'active' : 'inactive'}`}
                  onClick={() => updateFlightDraft('tripType', 'One-way')}
                >
                  One-way
                </button>
              </div>

              <div className="flight-modal-grid">
                <label>
                  From
                  <input
                    type="text"
                    value={flightDraft.departureCity}
                    onChange={(event) => updateFlightDraft('departureCity', event.target.value)}
                    placeholder="Departure city or airport"
                    required
                  />
                </label>
                <label>
                  To
                  <input
                    type="text"
                    value={flightDraft.destinationCity}
                    onChange={(event) => updateFlightDraft('destinationCity', event.target.value)}
                    placeholder="Destination city or airport"
                    required
                  />
                </label>

                <label>
                  Departure Date
                  <input
                    type="date"
                    value={flightDraft.departureDate}
                    onChange={(event) => updateFlightDraft('departureDate', event.target.value)}
                    required
                  />
                </label>
                {flightDraft.tripType === 'Round-trip' ? (
                  <label>
                    Return Date
                    <input
                      type="date"
                      value={flightDraft.returnDate}
                      onChange={(event) => updateFlightDraft('returnDate', event.target.value)}
                      required
                    />
                  </label>
                ) : (
                  <label style={{ opacity: 0.5 }}>
                    Return Date
                    <input type="text" placeholder="One-way flight selected" disabled />
                  </label>
                )}

                <label>
                  Adults (12y+)
                  <select
                    value={flightDraft.adults}
                    onChange={(event) => updateFlightDraft('adults', Number(event.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Children (2-12y)
                  <select
                    value={flightDraft.children}
                    onChange={(event) => updateFlightDraft('children', Number(event.target.value))}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </label>

                <label className="flight-grid-full">
                  Cabin Class
                  <select
                    value={flightDraft.cabinClass}
                    onChange={(event) => updateFlightDraft('cabinClass', event.target.value)}
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business</option>
                    <option value="First Class">First Class</option>
                  </select>
                </label>

                <label className="flight-grid-full" style={{ borderTop: '1px solid #edf2f7', paddingTop: '16px', marginTop: '8px' }}>
                  Customer Name
                  <input
                    type="text"
                    value={flightDraft.customerName}
                    onChange={(event) => updateFlightDraft('customerName', event.target.value)}
                    placeholder="Full name"
                    required
                  />
                </label>
                <label>
                  Phone Number
                  <input
                    type="tel"
                    value={flightDraft.phone}
                    onChange={(event) => updateFlightDraft('phone', event.target.value)}
                    placeholder="+91 99999 99999"
                    required
                  />
                </label>
                <label>
                  Email Address
                  <input
                    type="email"
                    value={flightDraft.email}
                    onChange={(event) => updateFlightDraft('email', event.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </label>

                <label className="flight-grid-full">
                  Special Notes / Preferences
                  <textarea
                    value={flightDraft.notes}
                    onChange={(event) => updateFlightDraft('notes', event.target.value)}
                    placeholder="Mention preferred airlines, meal requirements, or flexible date window details"
                    rows="3"
                  />
                </label>
              </div>

              <button type="submit" className="flight-submit-btn" disabled={flightLoading}>
                {flightLoading ? 'Submitting Inquiry...' : 'Submit Flight Inquiry'}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {/* Sidebar Drawer Component */}
      <SideDrawer
        allCategories={allCategories}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onFlightOpen={() => setFlightOpen(true)}
        onLogout={clearAuthSession}
        companyInfo={companyInfo}
      />
    </>
  );
}
