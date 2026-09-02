'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { getForexRates, getForexServiceCharge, convertForexRate, getStoredAuth, getStoredToken, getMediaUrl } from '@/utils/api';

const currencyOptions = [
  { code: 'INR', name: 'Indian Rupee', country: 'India', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', country: 'United States', symbol: '$' },
  { code: 'EUR', name: 'Euro', country: 'Europe', symbol: '€' },
  { code: 'GBP', name: 'British Pound', country: 'United Kingdom', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates', symbol: 'AED' },
  { code: 'SGD', name: 'Singapore Dollar', country: 'Singapore', symbol: 'S$' },
  { code: 'THB', name: 'Thai Baht', country: 'Thailand', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', country: 'Malaysia', symbol: 'RM' },
  { code: 'AUD', name: 'Australian Dollar', country: 'Australia', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', country: 'Canada', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', country: 'Japan', symbol: '¥' }
];

const forexRowsFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

const normalizeForexRate = (item = {}, index = 0) => {
  const rawCode = item.code || item.currency_code || item.currencyCode || item.from_code || item.fromCurrency || item.currency;
  const rawBaseCode = item.base_code || item.baseCode || item.to_code || item.toCurrency || item.quote_code || item.quoteCode;
  const code = String(rawCode || '').trim().toUpperCase();
  const baseCode = String(rawBaseCode || '').trim().toUpperCase();
  const name = String(item.currency_name || item.currencyName || item.name || item.label || `${code} currency`).trim();
  const rate = Number(item.rate || item.conversion_rate || item.exchange_rate || item.sell_rate || item.value || 1);

  return {
    ...item,
    code: code || baseCode || `FX${index}`,
    baseCode: baseCode || 'INR',
    name,
    rate,
    symbol: item.symbol || item.currency_symbol || code
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

  // Cross conversion via INR
  const fromToInr = rates.find((rate) => rate.code === from && rate.baseCode === 'INR');
  const toToInr = rates.find((rate) => rate.code === to && rate.baseCode === 'INR');
  if (fromToInr && toToInr) {
    return { rate: fromToInr.rate / toToInr.rate, mode: 'cross' };
  }

  // Fallbacks using standard values for common currency conversions to INR
  const standardToInr = {
    USD: 85.65,
    EUR: 99.10,
    GBP: 116.05,
    AED: 23.40,
    SGD: 63.80,
    THB: 2.35,
    MYR: 18.20,
    AUD: 56.40,
    CAD: 62.10,
    JPY: 0.54
  };

  if (to === 'INR' && standardToInr[from]) {
    return { rate: standardToInr[from], mode: 'fallback' };
  }
  if (from === 'INR' && standardToInr[to]) {
    return { rate: 1 / standardToInr[to], mode: 'fallback' };
  }

  return { rate: 1 };
};

export default function ForexBasePage({ pageType = 'currency', pageData }) {
  const router = useRouter();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceChargeVal, setServiceChargeVal] = useState(250);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Hero section tabs: 'buy' | 'sell' | 'alert' | 'callback'
  const [heroTab, setHeroTab] = useState('buy');

  // Interactive Calculator State
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [calcAmount, setCalcAmount] = useState('1000');

  // Rate Alert State
  const [alertTargetCurrency, setAlertTargetCurrency] = useState('USD');
  const [alertTargetRate, setAlertTargetRate] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [alertPhone, setAlertPhone] = useState('');
  const [submittingAlert, setSubmittingAlert] = useState(false);

  // Callback State
  const [cbName, setCbName] = useState('');
  const [cbPhone, setCbPhone] = useState('');
  const [cbMsg, setCbMsg] = useState('');
  const [submittingCallback, setSubmittingCallback] = useState(false);

  // Lead Generation Form State (Get Best Forex Rate)
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCurrency, setLeadCurrency] = useState('USD');
  const [leadAmount, setLeadAmount] = useState('1000');
  const [leadPurpose, setLeadPurpose] = useState('Tourism');
  const [submittingLead, setSubmittingLead] = useState(false);

  // Rate Lock Form State
  const [lockPurpose, setLockPurpose] = useState('Tourism');
  const [lockNotes, setLockNotes] = useState('');
  const [submittingLock, setSubmittingLock] = useState(false);

  // Accordion lists
  const [activeDocIndex, setActiveDocIndex] = useState(0); // 0: Purchase, 1: Student
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);

  const leadFormRef = useRef(null);
  const calculatorRef = useRef(null);

  // Load user details & rates
  useEffect(() => {
    const token = getStoredToken();
    setIsLoggedIn(Boolean(token));
    const authUser = getStoredAuth();
    setCurrentUser(authUser);
    if (authUser) {
      setLeadName(authUser.name || '');
      setLeadEmail(authUser.email || '');
      setLeadPhone(authUser.phone || '');
      setCbName(authUser.name || '');
      setCbPhone(authUser.phone || '');
      setAlertEmail(authUser.email || '');
      setAlertPhone(authUser.phone || '');
    }
  }, []);

  useEffect(() => {
    if (selectedTestimonial) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedTestimonial]);

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

  // Calculator logic
  const rateMatch = useMemo(() => {
    return findForexRateMatch(rates, fromCurrency, toCurrency);
  }, [rates, fromCurrency, toCurrency]);

  const convertedValue = useMemo(() => {
    const amt = Number(calcAmount) || 0;
    return amt * rateMatch.rate;
  }, [calcAmount, rateMatch]);

  const totalPayable = useMemo(() => {
    if (heroTab === 'sell') {
      const payable = convertedValue - serviceChargeVal;
      return payable > 0 ? payable : 0;
    }
    return convertedValue + serviceChargeVal;
  }, [convertedValue, serviceChargeVal, heroTab]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const selectDestination = (currencyCode) => {
    setFromCurrency(currencyCode);
    setToCurrency('INR');
    setHeroTab('buy');
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const liveRatesData = useMemo(() => {
    const currenciesToDisplay = ['USD', 'EUR', 'GBP', 'AED'];
    return currenciesToDisplay.map((code) => {
      const match = findForexRateMatch(rates, code, 'INR');
      const mid = match.rate;

      const buyRate = mid * 0.995;
      const sellRate = mid * 1.005;

      return {
        code,
        name: code === 'USD' ? 'US Dollar' : code === 'EUR' ? 'Euro' : code === 'GBP' ? 'British Pound' : 'UAE Dirham',
        symbol: code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : 'AED',
        buyRate: buyRate.toFixed(2),
        sellRate: sellRate.toFixed(2)
      };
    });
  }, [rates]);

  // Request Rate Lock submission
  const handleRateLockSubmit = async (e) => {
    const token = getStoredToken();
    if (!token) {
      toast.error('Please login first to continue.');
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('Please login to place a Forex booking request.');
      return;
    }
    const customerId = currentUser?.id || currentUser?.customer_id || currentUser?.user_id;
    if (!customerId) {
      toast.error('Invalid user session. Please log in again.');
      return;
    }

    setSubmittingLock(true);
    try {
      const payload = {
        customerId,
        fromCurrency,
        toCurrency,
        amount: Number(calcAmount),
        purpose: lockPurpose,
        notes: `Rate Lock Request (${heroTab.toUpperCase()}) | Notes: ${lockNotes}`
      };
      const response = await convertForexRate(payload);
      if (response?.success !== false) {
        toast.success('Rate Lock request submitted! Our expert will call you shortly to verify your identity and confirm rates.');
        setLockNotes('');
      } else {
        toast.error(response?.message || 'Unable to submit rate lock request. Please try again.');
      }
    } catch (err) {
      toast.error('Submission failed. Check your internet connection.');
    } finally {
      setSubmittingLock(false);
    }
  };

  // Rate Alert submission
  const handleRateAlertSubmit = async (e) => {
    const token = getStoredToken();
    if (!token) {
      toast.error('Please login first to continue.');
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    e.preventDefault();
    setSubmittingAlert(true);
    try {
      const alertDetails = `Rate Alert Request:\n- Target Currency: ${alertTargetCurrency}\n- Target Rate: ${alertTargetRate} INR\n- Contact: ${alertEmail} | ${alertPhone}`;
      const payload = {
        pipeline_id: 3,
        name: `Rate Alert: ${alertTargetCurrency}`,
        email: alertEmail,
        phone: alertPhone,
        source: 'Website Forex Page',
        notes: alertDetails,
        custom_fields: {
          subject: 'Forex Rate Alert Request',
          message: alertDetails
        }
      };

      const response = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data?.success) {
        toast.success(`Success! We'll alert you as soon as ${alertTargetCurrency} reaches ${alertTargetRate} INR.`);
        setAlertTargetRate('');
      } else {
        throw new Error(data?.message || 'Inquiry submission failed.');
      }
    } catch (err) {
      toast.error(err.message || 'Unable to schedule rate alert. Please try again.');
    } finally {
      setSubmittingAlert(false);
    }
  };

  // Callback submission
  const handleCallbackSubmit = async (e) => {
    const token = getStoredToken();
    if (!token) {
      toast.error('Please login first to continue.');
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    e.preventDefault();
    setSubmittingCallback(true);
    try {
      const callbackDetails = `Callback Requested on Forex Desk:\n- Customer Name: ${cbName}\n- Contact: ${cbPhone}\n- Message: ${cbMsg}`;
      const payload = {
        pipeline_id: 3,
        name: cbName || 'Forex Callback Lead',
        email: currentUser?.email || '',
        phone: cbPhone,
        source: 'Website Forex Page',
        notes: callbackDetails,
        custom_fields: {
          subject: 'Forex Desk Callback Request',
          message: callbackDetails
        }
      };

      const response = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data?.success) {
        toast.success(`Callback requested! Our currency desk advisor will reach out on ${cbPhone} shortly.`);
        setCbMsg('');
      } else {
        throw new Error(data?.message || 'Callback submission failed.');
      }
    } catch (err) {
      toast.error(err.message || 'Unable to submit callback request. Please try again.');
    } finally {
      setSubmittingCallback(false);
    }
  };

  // Lead Generation Form Submission
  const handleLeadFormSubmit = async (e) => {
    const token = getStoredToken();
    if (!token) {
      toast.error('Please login first to continue.');
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    e.preventDefault();
    setSubmittingLead(true);
    try {
      const leadDetails = `Quote Requested (Get Best Forex Rate):\n- Client Name: ${leadName}\n- Mobile: ${leadPhone}\n- Email: ${leadEmail}\n- Interest: Convert ${leadAmount} ${leadCurrency} to INR\n- Purpose: ${leadPurpose}`;
      const payload = {
        pipeline_id: 3,
        name: leadName || 'Forex Best Rate Lead',
        email: leadEmail,
        phone: leadPhone,
        source: 'Website Forex Lead Form',
        notes: leadDetails,
        custom_fields: {
          subject: 'Get Best Forex Rate Quote',
          message: leadDetails
        }
      };

      const response = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data?.success) {
        toast.success('Quote request submitted! We will email/call you with discounted premium exchange rates.');
        setLeadAmount('');
      } else {
        throw new Error(data?.message || 'Lead submission failed.');
      }
    } catch (err) {
      toast.error(err.message || 'Unable to submit quote request. Please check details.');
    } finally {
      setSubmittingLead(false);
    }
  };

  const scrollToRates = (e) => {
    e.preventDefault();
    document.getElementById('live-rates-table')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLeadForm = (e) => {
    e.preventDefault();
    leadFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const parseJSON = (data) => {
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch (e) { return {}; }
    }
    return data || {};
  };

  const faqCMS = pageData?.details?.find(d => d.key === 'FAQ-key');
  const faqJson = parseJSON(faqCMS?.json_data);
  const faqs = faqJson?.faqs || [
    {
      q: 'What documents are required to buy foreign currency in India?',
      a: 'As per RBI guidelines, you require a valid Indian Passport, PAN Card, Visa for the destination country, and a confirmed air ticket. These documents are verified to ensure compliance under the Liberalized Remittance Scheme (LRS).'
    },
    {
      q: 'How much foreign currency cash can I carry abroad?',
      a: 'Travelers are permitted to carry up to USD 3,000 (or equivalent in other currencies) in currency notes per trip. The remaining amount up to USD 250,000 per financial year can be loaded onto a convenient multi-currency Forex Card.'
    },
    {
      q: 'What is a Multi-Currency Forex Card and how does it work?',
      a: 'A Forex Card is a prepaid travel card loaded with foreign currencies. It acts like a debit card abroad—permitting cash withdrawals at ATMs and payments at shopping stores. It locks in the exchange rate when loaded, insulating you from market fluctuations.'
    },
    {
      q: 'How long does the doorstep delivery of cash/card take?',
      a: 'Once your documents are verified and payment is realized, your physical currency notes or activated Forex card will be delivered to your door within 12 to 24 hours (available in most metropolitan cities across India).'
    },
    {
      q: 'Are the exchange rates updated daily?',
      a: 'Yes, our exchange rates are connected to interbank currency feeds and updated in real-time throughout the day to ensure you receive the most competitive market rates available.'
    }
  ];

  const heroCMS = pageData?.details?.find(d => d.key === 'hero_key');
  const heroJson = parseJSON(heroCMS?.json_data);
  const heroTitleTop = heroCMS?.title || '✦ RBI Authorized Partner';
  const heroTitleMain = heroJson?.heading_content;
  const heroDesc = heroJson?.body;
  const heroBgImage = getMediaUrl(heroJson?.media_url);

  const cta1CMS = pageData?.details?.find(d => d.key === 'cta_key_1');
  const cta1Json = parseJSON(cta1CMS?.json_data);
  const cta1Text = cta1Json?.btn_text;
  const cta1Link = cta1Json?.btn_link;

  const cta2CMS = pageData?.details?.find(d => d.key === 'cta_key_2');
  const cta2Json = parseJSON(cta2CMS?.json_data);
  const cta2Text = cta2Json?.btn_text;
  const cta2Link = cta2Json?.btn_link;

  const forexRateCMS = pageData?.details?.find(d => d.key === 'forex_rate_key');
  const forexRateJson = parseJSON(forexRateCMS?.json_data);
  const forexRateTitleTop = forexRateCMS?.title || 'Real-time Exchange';
  const forexRateTitleMain = forexRateJson?.heading_content || 'Live Forex Rates';
  const forexRateDesc = forexRateJson?.block_desc || 'We fetch rates live from interbank feeds. Check current buy and sell rates for top currencies.';

  const heroCurrencyCMS = pageData?.details?.find(d => d.key === 'hero_key_curency');
  const heroCurrencyJson = parseJSON(heroCurrencyCMS?.json_data);
  const heroCurrencyHTML = heroCurrencyJson?.body;

  const servicesCMS = pageData?.details?.find(d => d.key === 'Our-Forex-Services');
  const servicesJson = parseJSON(servicesCMS?.json_data);
  const servicesTitleTop = servicesCMS?.title || 'Wide Portfolio';
  const servicesTitleMain = servicesJson?.heading_content || 'Our Forex Services';
  const servicesDesc = servicesJson?.block_desc || 'We provide fully digital and offline solutions to cater to all foreign currency needs.';
  const dynamicForexTabs = Array.isArray(servicesJson?.tabs) && servicesJson.tabs.length > 0 ? servicesJson.tabs : [
    { title: 'Foreign Currency Notes', icon: '💵', content: '<p>Get genuine currency notes in major global denominations delivered to your doorstep.</p>', badge: 'USD EUR GBP AUD CAD' },
    { title: 'Forex Card', icon: '💳', content: '<p>Secure and load multiple currencies. Accepted worldwide at offline stores, ATMs and online websites.</p>', badge: '✓ Instant Activation ✓ Secure CHIP & PIN ✓ Easy Online Reloading' },
    { title: 'International Transfer', icon: '🌐', content: '<p>Wire transfers directly to foreign bank accounts securely and quickly.</p>', badge: 'Education Fees Medical Care Family support' },
    { title: 'Currency Buy Back', icon: '🔄', content: '<p>Have leftover foreign currency from your recent trip? Sell it back to us at premium exchange rates instantly.</p>', badge: 'Sell leftover currency →' }
  ];

  const extractTestimonialData = (htmlStr) => {
    if (!htmlStr) return { role: '', text: '' };
    const roleMatch = htmlStr.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
    const role = roleMatch ? roleMatch[1].replace(/&nbsp;/g, '').trim() : '';
    
    const textMatch = htmlStr.match(/<i[^>]*>([\s\S]*?)<\/i>/i);
    let text = textMatch ? textMatch[1].trim() : htmlStr.replace(/<[^>]+>/g, '').trim();
    
    text = text.replace(/^["“”]|["“”]$/g, '').trim();
    
    return { role, text };
  };

  const testimonialsCMS = pageData?.details?.find(d => d.key === 'testimonials');
  const testimonialsJson = parseJSON(testimonialsCMS?.json_data);
  const testimonialsTitleTop = testimonialsCMS?.title || 'Testimonials';
  const testimonialsTitleMain = testimonialsJson?.heading_content || 'Loved by Travelers & Students';
  const testimonialsDesc = testimonialsJson?.block_desc || 'Check out reviews from our corporate travelers and study-abroad families.';
  const dynamicTestimonials = Array.isArray(testimonialsJson?.tabs) && testimonialsJson.tabs.length > 0 
    ? testimonialsJson.tabs.map(t => ({ ...t, parsed: extractTestimonialData(t.content) }))
    : [
        { badge: "★★★★★", parsed: { text: "Locked in a great rate for USD on a Monday, and the cash notes were delivered directly to my office in Gurgaon by Tuesday morning. Zero hassle outward remittance!", role: "Leisure Traveler (USA trip)" }, title: "Priya Sharma" },
        { badge: "★★★★★", parsed: { text: "Paying tuition fees for my son's MBA at NYU was a major stress. The outward bank remittance was executed under 24 hours at rates much lower than local banks. High trust service.", role: "Supporting Parent (remittance)" }, title: "Dr. Rajesh Gupta" },
        { badge: "★★★★★", parsed: { text: "My Multi-Currency Card worked perfectly at retail stores and local transit terminals throughout London and Paris. Easy reloading via their platform when I ran short of money.", role: "Student Traveler (UK & Europe)" }, title: "Ananya Mehta" }
      ];

  const [displayRates, setDisplayRates] = useState(liveRatesData);

  useEffect(() => {
    if (heroCurrencyHTML) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(heroCurrencyHTML, 'text/html');
        const rows = Array.from(doc.querySelectorAll('tbody tr'));
        const parsedRates = rows.map(row => {
          const tds = row.querySelectorAll('td');
          if (tds.length < 3) return null;

          const ps = tds[0].querySelectorAll('p');
          let parts = [];
          if (ps.length >= 3) {
            parts = Array.from(ps).map(p => p.textContent.trim());
          } else {
            parts = Array.from(tds[0].querySelectorAll('strong')).map(s => s.textContent.trim());
          }

          const symbol = parts[0] || '';
          const code = parts[1] || '';
          const name = parts[2] || '';

          const match = findForexRateMatch(rates, code, 'INR');
          let finalBuyRate, finalSellRate;

          if (match && match.rate && match.rate !== 1) {
            finalBuyRate = (match.rate * 0.995).toFixed(2);
            finalSellRate = (match.rate * 1.005).toFixed(2);
          } else {
            const buyRateStr = tds[1].textContent.replace(/[^\d.]/g, '');
            const sellRateStr = tds[2].textContent.replace(/[^\d.]/g, '');
            finalBuyRate = Number(buyRateStr).toFixed(2);
            finalSellRate = Number(sellRateStr).toFixed(2);
          }

          const validFromStr = tds[4]?.textContent.trim() || '';

          return {
            code,
            name,
            symbol,
            buyRate: finalBuyRate,
            sellRate: finalSellRate,
            validFrom: validFromStr
          };
        }).filter(r => r && r.code);

        if (parsedRates.length > 0) {
          setDisplayRates(parsedRates);
        }
      } catch (e) {
        console.error('Failed to parse CMS table', e);
      }
    } else if (liveRatesData && liveRatesData.length > 0) {
      setDisplayRates(liveRatesData);
    }
  }, [heroCurrencyHTML, rates, liveRatesData]);

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)', minHeight: '100vh', fontFamily: 'var(--font-inter), sans-serif' }}>

      {/* 1. HERO SECTION (Dynamic Dark Blue Theme Banner matching Flights/Hotels) */}
      <section className="forex-hero" style={heroBgImage ? { backgroundImage: `url('${heroBgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '10%', right: '-15%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,206,46,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-15%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" ref={calculatorRef}>
          <div className="row align-items-center g-5">
            {/* Title / Description */}
            <div className="col-12 col-lg-6">
              <span style={{
                color: 'var(--color-secondary)',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 12
              }}>
                {heroTitleTop}
              </span>
              <h1 style={{
                fontFamily: 'var(--font-poppins), sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(32px, 5vw, 48px)',
                lineHeight: 1.15,
                marginBottom: 20,
                color: 'white'
              }}>
                {heroTitleMain ? (
                  <span dangerouslySetInnerHTML={{ __html: heroTitleMain }} />
                ) : (
                  <>
                    {pageType === 'currency' && <>Buy/Sell <span style={{ color: 'var(--color-secondary)' }}>Foreign Currency</span></>}
                    {pageType === 'card' && <>Get Your Multi-Currency <span style={{ color: 'var(--color-secondary)' }}>Forex Card</span></>}
                    {pageType === 'transfer' && <>Fast & Secure <span style={{ color: 'var(--color-secondary)' }}>International Transfer</span></>}
                  </>
                )}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 1.6, marginBottom: 30, maxWidth: '520px' }}>
                {heroDesc ? (
                  <span dangerouslySetInnerHTML={{ __html: heroDesc }} />
                ) : (
                  <>
                    {pageType === 'currency' && "Get genuine currency notes in major global denominations delivered to your doorstep at the best live exchange rates."}
                    {pageType === 'card' && "Secure and load multiple currencies. Accepted worldwide at offline stores, ATMs and online websites with zero markup fees."}
                    {pageType === 'transfer' && "Secure instant international tuition remittances, medical payments, and business transfers. Lock in competitive live rates today."}
                  </>
                )}
              </p>

              {heroJson?.points && heroJson.points.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 30 }}>
                  {heroJson.points.map((pt, i) => (
                    <div key={i} style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      borderRadius: 99,
                      padding: '6px 16px',
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'white'
                    }}>
                      {pt.title}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
                <a href={cta1Link || "#lead-form"} onClick={!cta1Link ? scrollToLeadForm : undefined} className="btn-primary" style={{ padding: '14px 28px', textDecoration: 'none', color: '#0f172a', background: 'var(--color-secondary)' }}>
                  {cta1Text || (pageType === 'currency' ? 'Inquire Currency' : pageType === 'card' ? 'Apply Forex Card' : 'Start Transfer')}
                </a>
                <a href={cta2Link || "#live-rates-table"} onClick={!cta2Link ? scrollToRates : undefined} style={{
                  color: 'white',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  padding: '13px 26px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(4px)',
                  textDecoration: 'none'
                }}>
                  {cta2Text || 'Get Live Exchange Rates'}
                </a>
              </div>
            </div>

            {/* Converter Panel Card (White Container for high contrast against dark background) */}
            <div className="col-12 col-lg-6">
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="table-responsive" style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <table className="table table-hover" style={{ margin: 0, background: 'transparent' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-bg-soft)' }}>
                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-primary)', fontWeight: 800 }}>Currency</th>
                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', color: '#059669', fontWeight: 800 }}>Buy Rate</th>
                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', color: '#d97706', fontWeight: 800 }}>Sell Rate</th>
                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 800 }}>Valid from</th>
                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', textAlign: 'right', color: 'var(--color-text-secondary)' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRates.map((row) => (
                        <tr key={row.code} style={{ verticalAlign: 'middle', borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '18px 24px', color: 'var(--color-text-primary)', fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: 'var(--color-bg-soft)',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: 14,
                                color: 'var(--color-primary)'
                              }}>
                                {row.symbol}
                              </span>
                              <div>
                                <div style={{ color: 'var(--color-text-primary)' }}>{row.code}</div>
                                <small style={{ color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500 }}>{row.name}</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '18px 24px', color: '#059669', fontWeight: 800, fontSize: 15 }}>
                            ₹{row.buyRate}
                          </td>
                          <td style={{ padding: '18px 24px', color: '#d97706', fontWeight: 800, fontSize: 15 }}>
                            ₹{row.sellRate}
                          </td>
                          <td style={{ padding: '18px 24px', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 13 }}>
                            {row.validFrom || new Date().toLocaleDateString('en-GB')}
                          </td>
                          <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => selectDestination(row.code)}
                              style={{
                                padding: '6px 16px',
                                background: 'var(--color-primary-light)',
                                border: '1px solid var(--brand-primary-border)',
                                borderRadius: 8,
                                color: 'var(--color-primary)',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--color-primary)';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'var(--color-primary-light)';
                                e.currentTarget.style.color = 'var(--color-primary)';
                              }}
                            >
                              Lock Rate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 15, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Rates auto-sync active. Interbank standard spread applied.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE FOREX RATES */}
      <section id="live-rates-table" style={{ padding: '80px 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 45 }}>
            <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
              {forexRateTitleTop}
            </span>
            <h2 style={{ fontFamily: 'var(--font-poppins), sans-serif', fontWeight: 900, fontSize: 32, marginTop: 8, color: 'var(--color-text-primary)' }}>
              {forexRateTitleMain}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, maxWidth: '600px', margin: '10px auto 0' }}>
              {forexRateDesc}
            </p>
          </div>

          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              boxShadow: 'var(--shadow-xl)',
              padding: '28px',
              color: 'var(--color-text-primary)'
            }}>

              {/* Custom Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: pageType === 'transfer' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: 4,
                background: 'var(--color-bg-soft)',
                padding: 4,
                borderRadius: 12,
                marginBottom: 24
              }}>
                {(pageType === 'currency'
                  ? [
                    { id: 'buy', label: 'Buy Forex' },
                    { id: 'sell', label: 'Sell Forex' },
                    { id: 'callback', label: 'Callback' }
                  ]
                  : pageType === 'card'
                    ? [
                      { id: 'buy_card', label: 'Buy Card' },
                      { id: 'reload', label: 'Reload Card' },
                      { id: 'callback', label: 'Callback' }
                    ]
                    : [
                      { id: 'send', label: 'Send Money' },
                      { id: 'callback', label: 'Callback' }
                    ]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setHeroTab(tab.id)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: 9,
                      fontSize: 12,
                      fontWeight: 800,
                      color: heroTab === tab.id ? '#0f172a' : 'var(--color-text-secondary)',
                      background: heroTab === tab.id ? 'var(--color-secondary)' : 'transparent',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2px'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Render: Calculator */}
              {['buy', 'sell', 'buy_card', 'reload', 'send'].includes(heroTab) && (
                <div>
                  {/* Amount Input */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
                      Enter Amount
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: 16 }}>
                        {currencyOptions.find(c => c.code === fromCurrency)?.symbol || fromCurrency}
                      </span>
                      <input
                        type="number"
                        value={calcAmount}
                        onChange={(e) => setCalcAmount(e.target.value)}
                        placeholder="0.00"
                        style={{
                          width: '100%',
                          padding: '14px 18px 14px 44px',
                          background: 'var(--color-bg-soft)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 12,
                          color: 'var(--color-text-primary)',
                          fontSize: 18,
                          fontWeight: 800,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Currencies Dropdown with Swap */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 1fr', gap: 8, alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                        {['buy', 'buy_card', 'reload', 'send'].includes(heroTab) ? 'You Pay' : 'You Sell'}
                      </label>
                      <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'var(--color-bg-soft)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 12,
                          color: 'var(--color-text-primary)',
                          fontWeight: 700,
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {currencyOptions.map((c) => (
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
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'var(--color-primary-light)',
                        border: '1px solid var(--brand-primary-border)',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 18,
                        alignSelf: 'center',
                        boxShadow: 'var(--shadow-xs)',
                        transition: 'transform 0.2s',
                        fontSize: 14
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                      title="Swap Currencies"
                    >
                      ⇄
                    </button>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                        {['buy', 'buy_card', 'reload', 'send'].includes(heroTab) ? 'You Get' : 'You Pay'}
                      </label>
                      <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'var(--color-bg-soft)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 12,
                          color: 'var(--color-text-primary)',
                          fontWeight: 700,
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {currencyOptions.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Calc Summary Card */}
                  <div style={{
                    background: 'var(--color-bg-soft)',
                    border: '1px dashed var(--color-border)',
                    borderRadius: 16,
                    padding: '16px',
                    marginBottom: 20
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Exchange Rate</span>
                      <span style={{ fontWeight: 700 }}>
                        1 {fromCurrency} = {rateMatch.rate.toFixed(4)} {toCurrency}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Converted Value</span>
                      <span style={{ fontWeight: 850, color: 'var(--color-primary)' }}>
                        {currencyOptions.find(c => c.code === toCurrency)?.symbol || toCurrency} {convertedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Charges & Taxes</span>
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>
                        {['buy', 'buy_card', 'reload', 'send'].includes(heroTab) ? '+' : '-'} {currencyOptions.find(c => c.code === toCurrency)?.symbol || toCurrency} {serviceChargeVal}
                      </span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Net Payable Amount</span>
                      <span style={{ fontWeight: 900, fontSize: 18, color: '#059669' }}>
                        {currencyOptions.find(c => c.code === toCurrency)?.symbol || toCurrency} {totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Submit Form (Rate Lock Inquiry) */}
                  <form onSubmit={handleRateLockSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Purpose</label>
                        <select
                          value={lockPurpose}
                          onChange={e => setLockPurpose(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'var(--color-bg-soft)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            color: 'var(--color-text-primary)',
                            fontSize: 13,
                            fontWeight: 600,
                            outline: 'none'
                          }}
                        >
                          <option value="Tourism">Leisure Tourism</option>
                          <option value="Education">Education Remittance</option>
                          <option value="Business">Business Travel</option>
                          <option value="Medical">Medical Expenses</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Notes (Optional)</label>
                        <input
                          type="text"
                          value={lockNotes}
                          onChange={e => setLockNotes(e.target.value)}
                          placeholder="Eg: Home delivery"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'var(--color-bg-soft)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            color: 'var(--color-text-primary)',
                            fontSize: 13,
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {isLoggedIn ? (
                      <button
                        type="submit"
                        disabled={submittingLock}
                        style={{
                          width: '100%',
                          padding: '14px',
                          background: 'var(--gradient-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 12,
                          fontWeight: 800,
                          fontSize: 14,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 8px 25px rgba(2,110,181,0.25)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                      >
                        {submittingLock ? 'Booking Request...' : 'Book & Lock This Rate'}
                      </button>
                    ) : (
                      <Link
                        href={`/auth/login?redirect=forex`}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '14px',
                          background: 'var(--color-bg-soft)',
                          color: 'var(--color-primary)',
                          borderRadius: 12,
                          fontWeight: 800,
                          fontSize: 14,
                          textAlign: 'center',
                          textDecoration: 'none',
                          border: '1px solid var(--brand-primary-border)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-soft)'}
                      >
                        🔑 Login to Book Exchange Request
                      </Link>
                    )}
                  </form>
                </div>
              )}

              {/* Tab Render: Rate Alert */}
              {heroTab === 'alert' && (
                <form onSubmit={handleRateAlertSubmit}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 15, color: 'var(--color-primary)' }}>
                    Set Live Exchange Rate Alert
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                    We will scan global exchange rates and alert you immediately via Email/SMS when your target rate is triggered.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 15 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Currency</label>
                      <select
                        value={alertTargetCurrency}
                        onChange={e => setAlertTargetCurrency(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--color-bg-soft)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 10,
                          color: 'var(--color-text-primary)',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      >
                        {currencyOptions.filter(c => c.code !== 'INR').map(c => (
                          <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Target Rate (INR)</label>
                      <input
                        type="number"
                        required
                        value={alertTargetRate}
                        onChange={e => setAlertTargetRate(e.target.value)}
                        placeholder="Eg: 86.50"
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--color-bg-soft)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 10,
                          color: 'var(--color-text-primary)',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Contact Information</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <input
                        type="email"
                        required
                        value={alertEmail}
                        onChange={e => setAlertEmail(e.target.value)}
                        placeholder="Email Address"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg-soft)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          color: 'var(--color-text-primary)',
                          fontSize: 13,
                          outline: 'none'
                        }}
                      />
                      <input
                        type="tel"
                        required
                        value={alertPhone}
                        onChange={e => setAlertPhone(e.target.value)}
                        placeholder="Mobile Number"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--color-bg-soft)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          color: 'var(--color-text-primary)',
                          fontSize: 13,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAlert}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    {submittingAlert ? 'Setting Alert...' : 'Set Rate Alert'}
                  </button>
                </form>
              )}

              {/* Tab Render: Callback */}
              {heroTab === 'callback' && (
                <form onSubmit={handleCallbackSubmit}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 15, color: 'var(--color-primary)' }}>
                    Request a Callback
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                    Leave your details and a dedicated Forex Expert from our team will contact you back under 10 minutes.
                  </p>

                  <div style={{ marginBottom: 15 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Name</label>
                    <input
                      type="text"
                      required
                      value={cbName}
                      onChange={e => setCbName(e.target.value)}
                      placeholder="John Doe"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--color-bg-soft)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        color: 'var(--color-text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 15 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={cbPhone}
                      onChange={e => setCbPhone(e.target.value)}
                      placeholder="+91 99999 99999"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--color-bg-soft)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        color: 'var(--color-text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Brief Inquiry Notes</label>
                    <textarea
                      value={cbMsg}
                      onChange={e => setCbMsg(e.target.value)}
                      placeholder="E.g., Need $5000 in notes and forex card for student travel to Boston."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--color-bg-soft)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        color: 'var(--color-text-primary)',
                        outline: 'none',
                        resize: 'none'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingCallback}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    {submittingCallback ? 'Submitting...' : 'Request Quote Callback'}
                  </button>
                </form>
              )}

            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <a href="#lead-form" onClick={scrollToLeadForm} className="btn-primary" style={{ padding: '15px 30px', textDecoration: 'none', background: 'var(--color-secondary)', color: '#0f172a', fontSize: 15, fontWeight: 800, display: 'inline-block' }}>
              Apply Forex Card Now
            </a>
          </div>
        </div>
      </section>

      {/* 3. FOREX SERVICES SECTION */}
      <section style={{ padding: '80px 0', background: 'var(--color-bg-soft)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
              {servicesTitleTop}
            </span>
            <h2 style={{ fontFamily: 'var(--font-poppins), sans-serif', fontWeight: 900, fontSize: 32, marginTop: 8, color: 'var(--color-text-primary)' }}>
              {servicesTitleMain}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, maxWidth: '600px', margin: '10px auto 0' }}>
              {servicesDesc}
            </p>
          </div>

          <div className="row g-4">
            {dynamicForexTabs.map((tab, idx) => {
              const renderBadge = (badgeText) => {
                if (!badgeText) return null;
                
                if (badgeText.includes('✓')) {
                  const items = badgeText.split('✓').filter(Boolean).map(i => i.trim());
                  return (
                    <ul style={{ paddingLeft: 16, margin: '12px 0 0', fontSize: 12, color: 'var(--color-text-secondary)', display: 'grid', gap: 4, listStyleType: 'none' }}>
                      {items.map((it, i) => <li key={i}>✓ {it}</li>)}
                    </ul>
                  );
                }
                
                if (badgeText.includes('→') || badgeText.toLowerCase().includes('sell')) {
                  return (
                    <div style={{ marginTop: 15 }}>
                      <button
                        onClick={() => {
                          setHeroTab('sell');
                          calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 12, fontWeight: 800, cursor: 'pointer', padding: 0 }}
                      >
                        {badgeText}
                      </button>
                    </div>
                  );
                }
                
                if (idx === 0 || badgeText.includes('USD')) {
                  return (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 15 }}>
                      {badgeText.split(' ').map(c => (
                        <span key={c} style={{ background: 'var(--color-primary-light)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>{c}</span>
                      ))}
                    </div>
                  );
                }
                
                if (idx === 2 || badgeText.includes('Education')) {
                  let items = badgeText.split(/(Education Fees|Medical Care|Family support)/).filter(s => s.trim().length > 0);
                  if (items.length === 1 && items[0] === badgeText) {
                    items = badgeText.includes(',') ? badgeText.split(',') : [badgeText];
                  }
                  return (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 15 }}>
                      {items.map(c => (
                        <span key={c} style={{ background: 'var(--color-bg-soft)', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>{c.trim()}</span>
                      ))}
                    </div>
                  );
                }
                
                return <div style={{ marginTop: 15, fontSize: 12 }}>{badgeText}</div>;
              };

              return (
                <div key={idx} className="col-12 col-md-6 col-lg-3">
                  <div className="card-base" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', padding: '30px 24px', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 20 }}>
                    <div style={{ marginBottom: 20, textAlign: 'center' }}>
                      {tab.img ? (
                        <img src={getMediaUrl(tab.img)} alt={tab.title} style={{ height: 72, width: 'auto', objectFit: 'contain', margin: '0 auto' }} />
                      ) : (
                        <div style={{ fontSize: 48, textAlign: 'center' }}>{tab.icon || '💵'}</div>
                      )}
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 10 }}>{tab.title}</h3>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 13.5, lineHeight: 1.5, flexGrow: 1 }} dangerouslySetInnerHTML={{ __html: tab.content || '' }} />
                    {renderBadge(tab.badge)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US */}
      <section style={{ padding: '80px 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-12 col-lg-5">
              <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
                Why Choose Us
              </span>
              <h2 style={{ fontFamily: 'var(--font-poppins), sans-serif', fontWeight: 900, fontSize: 34, marginTop: 8, marginBottom: 20 }}>
                India's Safest & Best Rate Forex Platform
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 30 }}>
                We streamline currency booking under strict RBI guidelines, offering verified zero-markup card services, transparent rates, and fast door delivery.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div style={{ background: 'var(--color-bg-soft)', padding: 15, borderRadius: 12, border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-primary)' }}>50K+</h4>
                  <small style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>Happy Clients</small>
                </div>
                <div style={{ background: 'var(--color-bg-soft)', padding: 15, borderRadius: 12, border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-primary)' }}>100%</h4>
                  <small style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>Secure Transact</small>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                {[
                  { title: 'RBI Authorized Partner', desc: 'Operating with full licensing, complying with strict regulatory audit checks.' },
                  { title: 'Best Exchange Rates', desc: 'Zero additional markup or hidden commissions. The rate you see is the rate you pay.' },
                  { title: 'Doorstep Delivery', desc: 'Physically secure deliveries of currencies and card packages directly to home or work.' },
                  { title: 'Secure Transactions', desc: 'State-of-the-art encrypted gateways for payments and quick documentation lockers.' },
                  { title: '24x7 Support', desc: 'Around-the-clock emergency support. Block cards, resolve queries anytime.' },
                  { title: 'Fast Processing', desc: 'Realization, verification, and currency package deliveries within 24 hours.' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 16,
                    padding: 20
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{
                        color: 'var(--color-primary)',
                        fontSize: 16,
                        fontWeight: 900,
                        background: 'var(--color-primary-light)',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0
                      }}>✓</span>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>{item.title}</h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 12.5, margin: 0, lineHeight: 1.45 }}>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* 7. INTERNATIONAL MONEY TRANSFER */}
      <section style={{ padding: '80px 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-12 col-lg-6">
              <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
                Secure Remittances
              </span>
              <h2 style={{ fontFamily: 'var(--font-poppins), sans-serif', fontWeight: 900, fontSize: 34, marginTop: 8, marginBottom: 20, color: 'var(--color-text-primary)' }}>
                Send Money Abroad in 3 Simple Steps
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                We provide frictionless overseas outward remittances under RBI LRS framework. Transfer tuition fees directly to foreign universities or maintain family support abroad at the lowest transaction charges.
              </p>

              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 12 }}>Preferred Purposes:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 30 }}>
                {['Study Abroad Tuition Fees', 'Overseas Medical Treatment', 'International Business Travel', 'Close Family Maintenance'].map((p) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: '#059669', fontWeight: 900 }}>✓</span> {p}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div style={{
                background: 'var(--color-bg-soft)',
                border: '1px solid var(--color-border)',
                borderRadius: 24,
                padding: 30
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 12, color: 'var(--color-text-primary)' }}>
                  Required Document Guidelines
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                  To process outward bank remittance, ensure you have active digital copies of these KYC items:
                </p>

                <div style={{ display: 'grid', gap: 15 }}>
                  {[
                    { item: 'PAN Card', desc: 'Mandatory matching name verification for tax LRS limits.' },
                    { item: 'Indian Passport', desc: 'Valid identity credential representing nationality.' },
                    { item: 'Destination Visa', desc: 'Proof of entry compliance matching stay duration.' },
                    { item: 'Confirmed Air Ticket', desc: 'Confirmed booking itinerary representing flight travel dates.' }
                  ].map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                        fontWeight: 900,
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 2px', color: 'var(--color-text-primary)' }}>{doc.item}</h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, margin: 0 }}>{doc.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. DOCUMENTS REQUIRED ACCORDION */}
      <section style={{ padding: '80px 0', background: 'var(--color-bg-soft)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: 45 }}>
            <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
              RBI Guidelines
            </span>
            <h2 style={{ fontFamily: 'var(--font-poppins), sans-serif', fontWeight: 900, fontSize: 32, marginTop: 8, color: 'var(--color-text-primary)' }}>
              Documents Required Checklist
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, margin: '8px 0 0' }}>
              Toggle the options below to check documentation compliance.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {/* Purchase Accordion */}
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setActiveDocIndex(activeDocIndex === 0 ? null : 0)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'none',
                  color: 'var(--color-text-primary)',
                  fontWeight: 800,
                  fontSize: 15,
                  textAlign: 'left'
                }}
              >
                <span>📁 For Forex Purchase / Card Loading</span>
                <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 800 }}>
                  {activeDocIndex === 0 ? '▲ Hide' : '▼ View'}
                </span>
              </button>
              {activeDocIndex === 0 && (
                <div style={{ padding: '0 24px 24px', color: 'var(--color-text-secondary)', fontSize: 13.5, borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ marginTop: 15 }}>Under RBI guidelines, ensure you submit copies of:</p>
                  <ul style={{ display: 'grid', gap: 6, margin: '10px 0 0', paddingLeft: 18 }}>
                    <li><strong>PAN Card:</strong> Linked to your Aadhaar number.</li>
                    <li><strong>Passport:</strong> First and last biographical information pages.</li>
                    <li><strong>Air Ticket:</strong> Confirmed passenger ticket indicating departures from India.</li>
                    <li><strong>Valid Visa:</strong> Digital copy of tourist/student visa approval.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Student Remittance Accordion */}
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setActiveDocIndex(activeDocIndex === 1 ? null : 1)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'none',
                  color: 'var(--color-text-primary)',
                  fontWeight: 800,
                  fontSize: 15,
                  textAlign: 'left'
                }}
              >
                <span>🎓 For Student Tuition Remittance</span>
                <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 800 }}>
                  {activeDocIndex === 1 ? '▲ Hide' : '▼ View'}
                </span>
              </button>
              {activeDocIndex === 1 && (
                <div style={{ padding: '0 24px 24px', color: 'var(--color-text-secondary)', fontSize: 13.5, borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ marginTop: 15 }}>For outward money transfer toward university fees/living maintenance abroad:</p>
                  <ul style={{ display: 'grid', gap: 6, margin: '10px 0 0', paddingLeft: 18 }}>
                    <li><strong>Admission Letter:</strong> Official offer indicating course timelines and bank details.</li>
                    <li><strong>PAN Card:</strong> PAN card copy of the student or supporting parent/remitter.</li>
                    <li><strong>Passport:</strong> Travel document proof of the student.</li>
                    <li><strong>Fee Invoice:</strong> Detailed breakdown of university tuition/hostel boarding fees.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 9. CURRENCY CALCULATOR */}
      <section style={{ padding: '80px 0', background: 'var(--color-bg)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 24,
            padding: 36,
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10, color: 'var(--color-primary)' }}>Interactive Currency Calculator</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14.5, marginBottom: 25 }}>
              Check quick conversions for common amounts using live mid-market rates.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 25 }}>
              {[100, 500, 1000, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setCalcAmount(String(amt))}
                  style={{
                    padding: '8px 18px',
                    background: Number(calcAmount) === amt ? 'var(--color-primary)' : 'var(--color-bg-soft)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    color: Number(calcAmount) === amt ? 'white' : 'var(--color-text-primary)',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {amt} USD
                </button>
              ))}
            </div>

            <div style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 900,
              color: 'var(--color-text-primary)',
              margin: '20px 0'
            }}>
              {calcAmount} USD = <span style={{ color: 'var(--color-primary)' }}>₹{(Number(calcAmount) * (findForexRateMatch(rates, 'USD', 'INR').rate)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <small style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 600 }}>Calculated at live market rate 1 USD = ₹{(findForexRateMatch(rates, 'USD', 'INR').rate).toFixed(2)}. Service taxes excluded.</small>
          </div>
        </div>
      </section>

      {/* 10. CUSTOMER REVIEWS */}
      <section style={{ padding: '80px 0', background: 'var(--color-bg-soft)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
              {testimonialsTitleTop}
            </span>
            <h2 style={{ fontFamily: 'var(--font-poppins), sans-serif', fontWeight: 900, fontSize: 32, marginTop: 8, color: 'var(--color-text-primary)' }}>
              {testimonialsTitleMain}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, maxWidth: '500px', margin: '10px auto 0' }}>
              {testimonialsDesc}
            </p>
          </div>

          <div className="row g-4">
            {dynamicTestimonials.map((rev, idx) => (
              <div key={idx} className="col-12 col-lg-4" onClick={() => setSelectedTestimonial(rev)} style={{ cursor: 'pointer' }}>
                <div style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 20,
                  padding: 30,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <div>
                    <div style={{ color: 'var(--color-secondary)', fontSize: 20, marginBottom: 15 }}>{rev.badge || '★★★★★'}</div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{rev.parsed?.text}"
                    </p>
                  </div>
                  <div style={{ marginTop: 20, borderTop: '1px solid var(--color-border)', paddingTop: 15 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 2px' }}>{rev.title}</h4>
                    <small style={{ color: 'var(--color-text-secondary)', fontSize: 11.5, fontWeight: 600 }}>{rev.parsed?.role}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FAQ SECTION */}
      <section style={{ padding: '80px 0', background: 'var(--color-bg)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
              Common Queries
            </span>
            <h2 style={{ fontFamily: 'var(--font-poppins), sans-serif', fontWeight: 900, fontSize: 32, marginTop: 8, color: 'var(--color-text-primary)' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 15 }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  overflow: 'hidden'
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaqIndex(activeFaqIndex === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    color: 'var(--color-text-primary)',
                    fontWeight: 700,
                    fontSize: 14.5,
                    textAlign: 'left'
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: 'var(--color-primary)', fontSize: 12 }}>
                    {activeFaqIndex === idx ? '▲' : '▼'}
                  </span>
                </button>
                {activeFaqIndex === idx && (
                  <div style={{
                    padding: '0 24px 20px',
                    color: 'var(--color-text-secondary)',
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    borderTop: '1px solid var(--color-border)'
                  }}>
                    <p style={{ marginTop: 15, marginBottom: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. LEAD GENERATION FORM */}
      <section id="lead-form" ref={leadFormRef} style={{
        padding: '100px 0',
        background: 'transparent',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 24,
            padding: 40,
            boxShadow: 'var(--shadow-lg)',
            color: 'var(--color-text-primary)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
                Quick Quote
              </span>
              <h2 style={{ fontFamily: 'var(--font-poppins), sans-serif', fontWeight: 900, fontSize: 28, marginTop: 8 }}>
                {pageType === 'currency' && "Buy/Sell Currency Inquiry"}
                {pageType === 'card' && "Apply for Forex Card"}
                {pageType === 'transfer' && "Initiate International Transfer"}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 13.5, marginTop: 4 }}>
                {pageType === 'currency' && "Fill out the form and secure wholesale rates from our desk advisors."}
                {pageType === 'card' && "Fill out the form to request a zero-markup Forex card with instant loading."}
                {pageType === 'transfer' && "Fill out the form to get the best transfer rates for tuition or medical payments."}
              </p>
            </div>

            <form onSubmit={handleLeadFormSubmit}>
              <div style={{ display: 'grid', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Name</label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={e => setLeadName(e.target.value)}
                    placeholder="E.g., John Doe"
                    style={formInputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={leadPhone}
                      onChange={e => setLeadPhone(e.target.value)}
                      placeholder="+91 99999 99999"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      placeholder="john@example.com"
                      style={formInputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Currency</label>
                    <select
                      value={leadCurrency}
                      onChange={e => setLeadCurrency(e.target.value)}
                      style={formInputStyle}
                    >
                      {currencyOptions.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Estimated Amount</label>
                    <input
                      type="number"
                      required
                      value={leadAmount}
                      onChange={e => setLeadAmount(e.target.value)}
                      placeholder="1000"
                      style={formInputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>Purpose of Transaction</label>
                  <select
                    value={leadPurpose}
                    onChange={e => setLeadPurpose(e.target.value)}
                    style={formInputStyle}
                  >
                    <option value="Tourism">Tourism / Personal Spends</option>
                    <option value="Education">Education Tuition / Living Expenses</option>
                    <option value="Business">Business Travel Outward Remittance</option>
                    <option value="Medical">Medical Emergency Outward Spends</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submittingLead}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 900,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(2,110,181,0.3)',
                    marginTop: 10,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  {submittingLead ? 'Submitting Inquiry...' : 'Request Wholesale Rate Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Testimonial Modal */}
      {selectedTestimonial && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }} onClick={() => setSelectedTestimonial(null)}>
          <div style={{
            background: 'var(--color-bg-card)', 
            borderRadius: 20, 
            padding: 40, 
            maxWidth: 600, 
            width: '100%',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedTestimonial(null)}
              style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--color-text-secondary)' }}
            >
              &times;
            </button>
            
            {selectedTestimonial.img && (
              <img src={getMediaUrl(selectedTestimonial.img)} alt={selectedTestimonial.title} style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 20, border: '4px solid var(--color-bg-soft)' }} />
            )}
            
            <div style={{ color: 'var(--color-secondary)', fontSize: 24, marginBottom: 15 }}>
              {selectedTestimonial.badge || '★★★★★'}
            </div>
            
            <p style={{ color: 'var(--color-text-primary)', fontSize: 18, lineHeight: 1.6, fontStyle: 'italic', marginBottom: 25 }}>
              "{selectedTestimonial.parsed?.text}"
            </p>
            
            <h4 style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text-primary)', margin: '0 0 5px' }}>
              {selectedTestimonial.title}
            </h4>
            <span style={{ color: 'var(--color-primary)', fontSize: 14, fontWeight: 700 }}>
              {selectedTestimonial.parsed?.role}
            </span>
          </div>
        </div>
      )}

      <style jsx global>{`
        .forex-hero {
          padding: 48px 0 40px;
          background: url('https://images.unsplash.com/photo-1508962914676-134849a727f0?w=1920&q=80');
          background-size: cover;
          background-position: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 991px) {
          .forex-hero {
            padding: 36px 0 32px;
          }
        }
      `}</style>
    </div>
  );
}

const formInputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--color-bg-soft)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  outline: 'none',
  fontWeight: '500'
};
