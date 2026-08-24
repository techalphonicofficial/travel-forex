'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getForexRates, getForexServiceCharge, convertForexRate, getStoredAuth, getStoredToken } from '@/utils/api';

const currencyOptions = [
  { code: 'INR', name: 'Indian Rupee', country: 'India', symbol: 'Rs' },
  { code: 'USD', name: 'US Dollar', country: 'United States', symbol: '$' },
  { code: 'EUR', name: 'Euro', country: 'Europe', symbol: '€' },
  { code: 'GBP', name: 'British Pound', country: 'United Kingdom', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates', symbol: 'AED' },
  { code: 'SGD', name: 'Singapore Dollar', country: 'Singapore', symbol: 'S$' },
  { code: 'THB', name: 'Thai Baht', country: 'Thailand', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', country: 'Malaysia', symbol: 'RM' },
  { code: 'AUD', name: 'Australian Dollar', country: 'Australia', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', country: 'Canada', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', country: 'Japan', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', country: 'Switzerland', symbol: 'CHF' },
  { code: 'NZD', name: 'New Zealand Dollar', country: 'New Zealand', symbol: 'NZ$' },
  { code: 'IDR', name: 'Indonesian Rupiah', country: 'Indonesia', symbol: 'Rp' },
  { code: 'VND', name: 'Vietnamese Dong', country: 'Vietnam', symbol: '₫' },
  { code: 'LKR', name: 'Sri Lankan Rupee', country: 'Sri Lanka', symbol: 'LKR' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', country: 'Maldives', symbol: 'Rf' }
];

const forexRowsFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (payload?.data && typeof payload.data === 'object') return [payload.data];
  return [];
};

const normalizeForexRate = (item = {}, index = 0) => {
  const rawCode = item.code || item.currency_code || item.currencyCode || item.from_code || item.fromCurrency || item.currency;
  const rawBaseCode = item.base_code || item.baseCode || item.to_code || item.toCurrency || item.quote_code || item.quoteCode;
  const code = String(rawCode || '').trim().toUpperCase();
  const baseCode = String(rawBaseCode || '').trim().toUpperCase();
  const country = String(item.country?.name || item.country_name || item.country || item.countryName || '').trim();
  const name = String(item.currency_name || item.currencyName || item.name || item.label || `${code || baseCode} currency`).trim();
  const rate = Number(item.rate || item.conversion_rate || item.exchange_rate || item.sell_rate || item.value || 1);

  return {
    ...item,
    code: code || baseCode || `FX${index}`,
    baseCode,
    country: country || 'Active rate',
    name,
    rate,
    symbol: item.symbol || item.currency_symbol || code || baseCode,
  };
};

const findForexRateMatch = (rates = [], fromCode, toCode) => {
  const from = String(fromCode || '').toUpperCase();
  const to = String(toCode || '').toUpperCase();

  if (!from || !to || from === to) return { rate: 1 };

  const direct = rates.find((rate) => rate.code === from && rate.baseCode === to && rate.rate);
  if (direct) return { rate: direct.rate, mode: 'direct' };

  const reverse = rates.find((rate) => rate.code === to && rate.baseCode === from && rate.rate);
  if (reverse) return { rate: 1 / reverse.rate, mode: 'reverse' };

  // If calculating through base rate (e.g. cross conversions via INR)
  const fromToInr = rates.find((rate) => rate.code === from && rate.baseCode === 'INR');
  const toToInr = rates.find((rate) => rate.code === to && rate.baseCode === 'INR');
  if (fromToInr && toToInr) {
    return { rate: fromToInr.rate / toToInr.rate, mode: 'cross' };
  }

  return { rate: 1 };
};

export default function ForexSection() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Calculator State
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [amount, setAmount] = useState('1000');
  const [serviceChargeVal, setServiceChargeVal] = useState(250); // Fallback flat service charge
  
  // Lead / Booking form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('Tourism');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync auth state
  useEffect(() => {
    const token = getStoredToken();
    setIsLoggedIn(Boolean(token));
    const authUser = getStoredAuth();
    setCurrentUser(authUser);
    if (authUser) {
      setName(authUser.name || '');
      setEmail(authUser.email || '');
      setPhone(authUser.phone || '');
    }
  }, []);

  // Fetch rates
  useEffect(() => {
    let active = true;
    const fetchRates = async () => {
      try {
        const [ratesRes, chargeRes] = await Promise.all([
          getForexRates(),
          getForexServiceCharge()
        ]);
        if (!active) return;
        const normalized = forexRowsFromPayload(ratesRes).map(normalizeForexRate);
        setRates(normalized);

        // Set service charge
        if (chargeRes?.success && chargeRes?.data) {
          const value = Number(chargeRes.data.value || chargeRes.data.charge || 250);
          setServiceChargeVal(value);
        }
      } catch (err) {
        console.warn('Error fetching forex rates:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchRates();
    return () => { active = false; };
  }, []);

  const rateMatch = useMemo(() => {
    return findForexRateMatch(rates, fromCurrency, toCurrency);
  }, [rates, fromCurrency, toCurrency]);

  const convertedValue = useMemo(() => {
    const amt = Number(amount) || 0;
    return amt * rateMatch.rate;
  }, [amount, rateMatch]);

  const totalPayable = useMemo(() => {
    return convertedValue + serviceChargeVal;
  }, [convertedValue, serviceChargeVal]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError('Please login to place a Forex booking request.');
      return;
    }
    const customerId = currentUser?.id || currentUser?.customer_id || currentUser?.user_id;
    if (!customerId) {
      setError('Invalid customer session. Please re-login.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        customerId,
        fromCurrency,
        toCurrency,
        amount: Number(amount),
        purpose,
        notes: `${notes} | Contact: ${name} (${phone}, ${email})`
      };
      const response = await convertForexRate(payload);
      if (response?.success !== false) {
        setSuccessMsg(response?.message || 'Forex conversion request submitted successfully! Our expert will call you shortly to lock the rate.');
        setNotes('');
      } else {
        setError(response?.message || 'Unable to place your request. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const fromSymbol = currencyOptions.find(c => c.code === fromCurrency)?.symbol || fromCurrency;
  const toSymbol = currencyOptions.find(c => c.code === toCurrency)?.symbol || toCurrency;

  return (
    <section style={{ padding: '80px 0', background: 'var(--color-bg-soft)', color: 'var(--color-text-primary)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative patterns */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,206,46,0.1) 10%, transparent 60%)', opacity: 0.15, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(2,110,181,0.08) 10%, transparent 60%)', opacity: 0.2, pointerEvents: 'none' }} />

      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 10 }}>
            SECURE EXCHANGE
          </p>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 34, color: 'var(--color-text-primary)', marginBottom: 16 }}>
            International Forex Desk
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
            Check real-time conversion rates, compute charges, and lock in the best currency exchange rates instantly.
          </p>
        </div>

        <div className="row g-5 align-items-stretch">
          
          {/* Left Panel: Currency Converter */}
          <div className="col-12 col-lg-7">
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              padding: '36px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-primary)' }}>
                  <span>💸</span> Live Rate Calculator
                </h3>

                {/* Amount Row */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>Enter Amount</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: 18 }}>
                      {fromSymbol}
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '16px 20px 16px 52px',
                        background: 'var(--color-bg-soft)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 14,
                        color: 'var(--color-text-primary)',
                        fontSize: 18,
                        fontWeight: 800,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Currencies Dropdowns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', gap: 10, alignItems: 'center', marginBottom: 28 }} className="forex-grid">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>From</label>
                    <select
                      value={fromCurrency}
                      onChange={e => setFromCurrency(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        background: 'var(--color-bg-soft)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 14,
                        color: 'var(--color-text-primary)',
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {currencyOptions.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleSwap}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'var(--color-primary-light)',
                      border: '1px solid var(--brand-primary-border)',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 20,
                      alignSelf: 'center',
                      boxShadow: 'var(--shadow-xs)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    ⇄
                  </button>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>To</label>
                    <select
                      value={toCurrency}
                      onChange={e => setToCurrency(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        background: 'var(--color-bg-soft)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 14,
                        color: 'var(--color-text-primary)',
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {currencyOptions.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Calculator Summary Ticket */}
              <div style={{
                background: 'var(--color-bg-soft)',
                border: '1px dashed var(--color-border)',
                borderRadius: 16,
                padding: '24px',
                marginTop: 24
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13.5 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Exchange Rate</span>
                  <span style={{ fontWeight: 800 }}>
                    1 {fromCurrency} = {rateMatch.rate.toFixed(4)} {toCurrency}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13.5 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Converted Value</span>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                    {toSymbol} {convertedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13.5 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Service Charges & Taxes</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>
                    + {toSymbol} {serviceChargeVal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>Net Total Payable</span>
                  <span style={{ fontWeight: 900, fontSize: 20, color: '#059669' }}>
                    {toSymbol} {totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Panel: Send Request / Locking Form */}
          <div className="col-12 col-lg-5">
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              padding: '36px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-md)'
            }}>
              <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-primary)' }}>
                    <span>🔒</span> Request Rate Lock
                  </h3>

                  {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: 10, color: '#dc2626', fontSize: 13, marginBottom: 20, fontWeight: 700 }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {successMsg && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: 10, color: '#059669', fontSize: 13, marginBottom: 20, fontWeight: 700 }}>
                      ✅ {successMsg}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                        style={formInputStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Phone</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+91 99999 99999"
                          style={formInputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Email</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="john@example.com"
                          style={formInputStyle}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Purpose of Visit</label>
                      <select
                        value={purpose}
                        onChange={e => setPurpose(e.target.value)}
                        style={formInputStyle}
                      >
                        <option value="Tourism">Leisure Tourism</option>
                        <option value="Education">Education Fees / Study</option>
                        <option value="Business">Business Travel</option>
                        <option value="Medical">Medical Treatment</option>
                        <option value="Employment">Emigration / Employment</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Special Notes (Optional)</label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="E.g., Prefers home delivery / Needs currency notes..."
                        rows={2}
                        style={{ ...formInputStyle, resize: 'none', height: 'auto' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  {isLoggedIn ? (
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: 'var(--gradient-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 14,
                        fontWeight: 800,
                        fontSize: 15,
                        cursor: 'pointer',
                        boxShadow: '0 8px 25px rgba(2,110,181,0.25)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      {submitting ? 'Submitting request...' : 'Book Exchange Request'}
                    </button>
                  ) : (
                    <Link
                      href="/auth/login?redirect=forex"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '16px',
                        background: 'var(--color-bg-soft)',
                        color: 'var(--color-primary)',
                        borderRadius: 14,
                        fontWeight: 800,
                        fontSize: 15,
                        textAlign: 'center',
                        textDecoration: 'none',
                        border: '1px solid var(--brand-primary-border)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-soft)'}
                    >
                      🔑 Login to Send Rate Lock Request
                    </Link>
                  )}
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @media (max-width: 576px) {
          :global(.forex-grid) {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
}

const formInputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--color-bg-soft)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  outline: 'none',
  fontWeight: '500'
};
