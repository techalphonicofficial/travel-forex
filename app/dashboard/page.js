'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import bookingsData from '@/data/bookings.json';
import { useWishlist } from '@/components/WishlistProvider';
import { createRazorpayOrder, getCancellationRules, getCustomerBookings, getMediaUrl, getMyPackageReturnRequests, getStoredAuth, getTripInquiries, payRemainingPackageBooking, submitPackageReturnRequest, submitPackageReview, verifyRazorpayPayment } from '@/utils/api';

const NAV_ITEMS = [
  { id: 'bookings', label: 'My Bookings', icon: '📋' },
  // { id: 'upcoming', label: 'Upcoming Tours', icon: '✈️' },
  { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
  // { id: 'profile', label: 'My Profile', icon: '👤' },
  // { id: 'history', label: 'History', icon: '🕐' },
];

function Countdown({ dateStr }) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      if (!dateStr) {
        setTimeLeft({ unavailable: true });
        return;
      }
      const diff = new Date(dateStr) - new Date();
      if (Number.isNaN(diff)) {
        setTimeLeft({ unavailable: true });
        return;
      }
      if (diff <= 0) return setTimeLeft({ expired: true });
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [dateStr]);

  if (timeLeft.unavailable) return <span style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>Confirmed</span>;
  if (timeLeft.expired) return <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>In progress!</span>;
  const unusedApiBookingCard = ({ booking }) => {
    const amounts = booking.amounts || {};
    const route = Array.isArray(booking.route) ? booking.route.filter(Boolean).join(' -> ') : '';
    const packageSlug = booking.package_slug || booking.package?.slug || '';
    const packageHref = packageSlug
      ? `/tours?destination=${encodeURIComponent(booking.route?.[0] || 'destination')}&view=itinerary&package=${encodeURIComponent(packageSlug)}`
      : '/tours';

    return (
      <article className="dashboard-booking-card">
        <div className="dashboard-booking-media">
          <Image
            src={getBookingImage(booking)}
            alt={booking.package_name || booking.package?.name || 'Package booking'}
            fill
            sizes="180px"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="dashboard-booking-body">
          <div className="dashboard-booking-top">
            <div>
              <span>{booking.booking_reference || 'Package booking'}</span>
              <h3>{booking.package_name || booking.package?.name || 'Booked package'}</h3>
              <p>{route || 'Custom route'}{booking.duration ? ` · ${booking.duration}` : ''}</p>
            </div>
            <span className={`badge ${getPaymentBadgeClass(booking.payment_status)}`}>
              {String(booking.payment_status || 'Booked').replace(/_/g, ' ')}
            </span>
          </div>

          <div className="dashboard-booking-meta">
            <div><span>Booked on</span><strong>{formatBookingDate(booking.created_at)}</strong></div>
            <div><span>Total</span><strong>{formatMoney(amounts.package_total)}</strong></div>
            <div><span>Paid</span><strong>{formatMoney(amounts.paid_amount)}</strong></div>
            <div><span>Balance</span><strong>{formatMoney(amounts.remaining_amount)}</strong></div>
          </div>

          {booking.hotels?.length ? (
            <div className="dashboard-booking-hotels">
              {booking.hotels.slice(0, 3).map((hotel) => (
                <span key={hotel.id || hotel.name}>{hotel.name}</span>
              ))}
              {booking.hotels.length > 3 ? <span>+{booking.hotels.length - 3} more</span> : null}
            </div>
          ) : null}

          <div className="dashboard-booking-actions">
            <Link href={packageHref} className="btn-secondary btn-sm">
              View Package
            </Link>
            <button
              className="btn-secondary btn-sm"
              onClick={() => setReviewingBookingId(reviewingBookingId === booking.id ? null : booking.id)}
              type="button"
            >
              {reviewingBookingId === booking.id ? 'Close Review' : 'Add Review'}
            </button>
            <Link href="/booking/confirmation" className="btn-primary btn-sm">
              View Receipt
            </Link>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="d-flex gap-2">
      {[['Days', timeLeft.days], ['Hrs', timeLeft.hours], ['Min', timeLeft.minutes]].map(([label, val]) => (
        <div
          key={label}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            textAlign: 'center',
            minWidth: 48,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{val ?? '--'}</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

const emptyReviewForm = {
  rating: 5,
  title: '',
  comment: '',
  reviewer_name: '',
  reviewer_email: '',
  reviewer_phone: '',
  media_urls: '',
};

const FALLBACK_CANCELLATION_RULES = [
  {
    id: 'fallback-0',
    min_days_before_departure: 0,
    max_days_before_departure: 3,
    refund_percentage: 0,
    cancellation_percentage: 100,
    description: 'No refund for cancellations within 3 days of departure.',
  },
];

const getCancellationRuleWindow = (rule) => {
  const minDays = Number(rule.min_days_before_departure) || 0;
  const maxDays = Number(rule.max_days_before_departure) || 0;

  if (maxDays >= 9999) return `${minDays}+ days before departure`;
  if (minDays === maxDays) return `${minDays} day${minDays === 1 ? '' : 's'} before departure`;
  return `${minDays}-${maxDays} days before departure`;
};

const getBookingDepartureDate = (booking = {}) => {
  const rawDate =
    booking.departure_date ||
    booking.travel_date ||
    booking.start_date ||
    booking.package?.departure_date ||
    booking.raw_payload?.departure_date ||
    booking.raw_payload?.travel_date ||
    '';
  const parsedDate = rawDate ? new Date(rawDate) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsedDate.toISOString().slice(0, 10);
};

const hasExistingReturnRequest = (booking = {}) => {
  const returnRequest =
    booking.return_request ||
    booking.returnRequest ||
    booking.return_request_details ||
    booking.returnRequestDetails ||
    booking.cancellation_request ||
    booking.cancellationRequest ||
    booking.refund_request ||
    booking.refundRequest ||
    null;
  const statusText = [
    booking.return_status,
    booking.return_request_status,
    booking.returnRequestStatus,
    booking.cancellation_status,
    booking.cancellation_request_status,
    booking.refund_status,
    booking.status,
    booking.payment_status,
    returnRequest?.status,
    returnRequest?.request_status,
  ].filter(Boolean).join(' ').toLowerCase();

  return Boolean(
    returnRequest ||
    booking.has_return_request ||
    booking.return_requested ||
    booking.return_requested_at ||
    booking.cancellation_requested ||
    booking.cancellation_requested_at ||
    booking.refund_requested ||
    booking.refund_requested_at ||
    statusText.includes('return_request') ||
    statusText.includes('return requested') ||
    statusText.includes('return pending') ||
    statusText.includes('refund requested') ||
    statusText.includes('refund pending') ||
    statusText.includes('cancellation requested') ||
    statusText.includes('cancellation pending')
  );
};

function PackageReviewForm({ booking, user, onSubmitted }) {
  const [form, setForm] = useState(() => ({
    ...emptyReviewForm,
    reviewer_name: user?.name || '',
    reviewer_email: user?.email || '',
  }));
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const packageId = booking.package_id || booking.packageId || booking.tourId;

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === 'rating' ? Number(value) : value }));
  };

  const submitReview = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;

    if (!packageId) {
      setMessage('Package information is missing for this booking.');
      return;
    }

    if (!form.rating || !form.comment.trim() || !form.reviewer_name.trim()) {
      setMessage('Please add your name, rating, and review.');
      return;
    }

    const formData = new FormData();
    formData.append('package_id', String(packageId));
    formData.append('rating', String(form.rating));
    formData.append('status', 'approved');
    formData.append('title', form.title.trim());
    formData.append('comment', form.comment.trim());
    formData.append('reviewer_name', form.reviewer_name.trim());
    formData.append('reviewer_email', form.reviewer_email.trim());
    formData.append('reviewer_phone', form.reviewer_phone.trim());
    formData.append('media_urls', form.media_urls.trim());
    if (file) formData.append('media_files', file);

    setSubmitting(true);
    setMessage('');

    const result = await submitPackageReview(formData);

    setSubmitting(false);

    if (result?.success) {
      setForm({
        ...emptyReviewForm,
        reviewer_name: user?.name || '',
        reviewer_email: user?.email || '',
      });
      setFile(null);
      formElement?.reset();
      setMessage('Thanks, your review has been added.');
      onSubmitted?.();
    } else {
      setMessage(result?.message || 'Unable to submit review right now.');
    }
  };

  return (
    <form className="booking-review-form" onSubmit={submitReview}>
      <div className="booking-review-head">
        <strong>Write a review</strong>
        <label className="booking-review-rating">
          Rating
          <select name="rating" value={form.rating} onChange={updateField}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>{rating}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="booking-review-fields">
        <label>
          <span>Name</span>
          <input name="reviewer_name" value={form.reviewer_name} onChange={updateField} placeholder="Your name" />
        </label>
        <label>
          <span>Email</span>
          <input name="reviewer_email" type="email" value={form.reviewer_email} onChange={updateField} placeholder="you@example.com" />
        </label>
        <label>
          <span>Phone</span>
          <input name="reviewer_phone" value={form.reviewer_phone} onChange={updateField} placeholder="Phone number" />
        </label>
        <label>
          <span>Title</span>
          <input name="title" value={form.title} onChange={updateField} placeholder="Excellent package" />
        </label>
        <label className="is-wide">
          <span>Review</span>
          <textarea name="comment" value={form.comment} onChange={updateField} placeholder="Share your experience" />
        </label>
        <label>
          <span>Photo</span>
          <input name="media_files" type="file" accept="image/*,video/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <label>
          <span>Media URL</span>
          <input name="media_urls" value={form.media_urls} onChange={updateField} placeholder="https://..." />
        </label>
      </div>
      <button className="btn-primary btn-sm" disabled={submitting} type="submit">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
      {message ? <p className="booking-review-message">{message}</p> : null}
    </form>
  );
}

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const formatBookingDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getCustomerId = (auth = {}) => (
  auth.id ||
  auth.customer_id ||
  auth.user_id ||
  auth.customerId ||
  auth.user?.id ||
  auth.customer?.id ||
  auth.email ||
  ''
);

const getBookingImage = (booking) => (
  getMediaUrl(booking?.package?.main_image) ||
  booking?.hotels?.find((hotel) => hotel?.image)?.image ||
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=900&q=80'
);

const getPaymentBadgeClass = (status) => (
  String(status || '').toLowerCase().includes('verified') ? 'badge-success' : 'badge-primary'
);

const getReturnStatusBadgeClass = (status) => {
  const value = String(status || '').toLowerCase();
  if (value.includes('approved')) return 'badge-success';
  if (value.includes('reject')) return 'badge-danger';
  return 'badge-primary';
};

const defaultDashboardUser = {
  name: 'Traveler',
  email: '',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=75',
};

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') {
    reject(new Error('Razorpay checkout is available only in the browser.'));
    return;
  }

  if (window.Razorpay) {
    resolve(window.Razorpay);
    return;
  }

  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window.Razorpay), { once: true });
    existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = () => resolve(window.Razorpay);
  script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
  document.body.appendChild(script);
});

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookingView, setBookingView] = useState('package');
  const [reviewingBookingId, setReviewingBookingId] = useState(null);
  const [user, setUser] = useState(defaultDashboardUser);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [bookingSummary, setBookingSummary] = useState({ total: 0, totals: {} });
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [returnRequestedBookingIds, setReturnRequestedBookingIds] = useState(() => new Set());
  const [returnRequests, setReturnRequests] = useState([]);
  const [returnRequestSummary, setReturnRequestSummary] = useState({ total: 0 });
  const [returnRequestsLoading, setReturnRequestsLoading] = useState(false);
  const [returnRequestsError, setReturnRequestsError] = useState('');
  const [customBookings, setCustomBookings] = useState([]);
  const [customBookingSummary, setCustomBookingSummary] = useState({ total: 0 });
  const [customBookingsLoading, setCustomBookingsLoading] = useState(false);
  const [customBookingsError, setCustomBookingsError] = useState('');
  const [remainingPayment, setRemainingPayment] = useState({ bookingId: '', message: '', error: '' });
  const [cancellation, setCancellation] = useState({ bookingId: '', reason: '', message: '', error: '', submitting: false });
  const [cancellationRules, setCancellationRules] = useState(FALLBACK_CANCELLATION_RULES);
  const [cancellationRulesLoading, setCancellationRulesLoading] = useState(false);
  const [cancellationRulesError, setCancellationRulesError] = useState('');
  const cancellationCloseTimerRef = useRef(null);
  const cancellationReasonRef = useRef(null);
  const { items: wishlist, removeFromWishlist } = useWishlist();

  const loadCustomerBookings = useCallback(async ({ silent = false } = {}) => {
    const auth = getStoredAuth() || {};
    const customerId = getCustomerId(auth);

    if (!customerId) {
      setCustomerBookings([]);
      setBookingSummary({ total: 0, totals: {} });
      setBookingsLoading(false);
      setBookingsError('Please login to view your bookings.');
      return;
    }

    if (!silent) setBookingsLoading(true);
    setBookingsError('');

    const result = await getCustomerBookings({ customerId, page: 1, limit: 20 });
    const data = result?.data || {};

    if (result?.success) {
      setCustomerBookings(Array.isArray(data.rows) ? data.rows : []);
      setBookingSummary({
        total: Number(data.total) || 0,
        totals: data.totals || {},
        page: Number(data.page) || 1,
        totalPages: Number(data.total_pages) || 1,
      });
    } else {
      setCustomerBookings([]);
      setBookingsError(result?.message || 'Unable to load your bookings.');
    }

    setBookingsLoading(false);
  }, []);

  const loadCustomBookings = useCallback(async () => {
    const auth = getStoredAuth() || {};
    const customerId = getCustomerId(auth);
    const customerEmail = String(auth.email || '').toLowerCase();

    setCustomBookingsLoading(true);
    setCustomBookingsError('');

    const result = await getTripInquiries({ page: 1, limit: 20 });
    const data = result?.data || result || {};
    const rows = Array.isArray(data.rows) ? data.rows : [];
    const filteredRows = rows.filter((item) => {
      if (!customerId && !customerEmail) return true;

      const ids = [
        item.customer_id,
        item.raw_payload?.customer?.id,
      ].filter(Boolean).map(String);
      const emails = [
        item.customer_email,
        item.raw_payload?.customer?.email,
      ].filter(Boolean).map((email) => String(email).toLowerCase());

      return ids.includes(String(customerId)) || emails.includes(customerEmail);
    });

    if (Array.isArray(data.rows)) {
      setCustomBookings(filteredRows);
      setCustomBookingSummary({
        total: filteredRows.length,
        apiTotal: Number(data.total) || rows.length,
        page: Number(data.page) || 1,
        totalPages: Number(data.total_pages) || 1,
      });
    } else {
      setCustomBookings([]);
      setCustomBookingsError(result?.message || 'Unable to load customized bookings.');
    }

    setCustomBookingsLoading(false);
  }, []);

  const loadReturnRequests = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setReturnRequestsLoading(true);
    setReturnRequestsError('');

    const result = await getMyPackageReturnRequests();
    const data = result?.data || {};
    const rows = Array.isArray(data.rows) ? data.rows : [];

    if (result?.success) {
      setReturnRequests(rows);
      setReturnRequestSummary({
        total: Number(data.total) || rows.length,
      });
      setReturnRequestedBookingIds((current) => {
        const next = new Set(current);
        rows.forEach((request) => {
          if (request.booking_id) next.add(String(request.booking_id));
          if (request.booking_reference) next.add(String(request.booking_reference));
          if (request.booking?.id) next.add(String(request.booking.id));
          if (request.booking?.booking_reference) next.add(String(request.booking.booking_reference));
        });
        return next;
      });
    } else {
      setReturnRequests([]);
      setReturnRequestSummary({ total: 0 });
      setReturnRequestsError(result?.message || 'Unable to load return requests.');
    }

    setReturnRequestsLoading(false);
  }, []);

  const loadCancellationRules = useCallback(async () => {
    setCancellationRulesLoading(true);
    setCancellationRulesError('');

    const result = await getCancellationRules();
    const rules = Array.isArray(result?.data) ? result.data.filter((rule) => rule?.is_active !== false) : [];

    if (result?.success && rules.length) {
      setCancellationRules(rules.sort((first, second) => (
        (Number(first.min_days_before_departure) || 0) - (Number(second.min_days_before_departure) || 0)
      )));
    } else {
      setCancellationRules(FALLBACK_CANCELLATION_RULES);
      setCancellationRulesError(result?.message || 'Unable to load live cancellation rules.');
    }

    setCancellationRulesLoading(false);
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      const auth = getStoredAuth() || {};
      setUser({
        ...defaultDashboardUser,
        name: auth.name || auth.full_name || auth.firstName || auth.email || defaultDashboardUser.name,
        email: auth.email || '',
      });
      loadCustomerBookings();
      loadCustomBookings();
      loadReturnRequests();
      loadCancellationRules();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadCancellationRules, loadCustomerBookings, loadCustomBookings, loadReturnRequests]);

  useEffect(() => () => {
    if (cancellationCloseTimerRef.current) {
      window.clearTimeout(cancellationCloseTimerRef.current);
    }
  }, []);

  const dashboardBookings = customerBookings;
  const isVerifiedBooking = (booking) => {
    const statusText = `${booking.payment_status || ''} ${booking.status || ''}`.toLowerCase();
    return statusText.includes('verified') || statusText.includes('completed') || statusText.includes('confirmed');
  };
  const packageBookingCount = Number(bookingSummary.total) || dashboardBookings.length;
  const customBookingCount = Number(customBookingSummary.total) || customBookings.length;
  const completedBookingCount = dashboardBookings.filter(isVerifiedBooking).length;
  const upcomingBookings = dashboardBookings.filter((booking) => !isVerifiedBooking(booking));
  const totalTripCount = packageBookingCount + customBookingCount;
  const completedBookings = bookingsData.filter((b) => b.status === 'Completed');

  const startRemainingPayment = async (booking) => {
    const amounts = booking.amounts || {};
    const remainingAmount = Math.round(Number(amounts.remaining_amount) || 0);
    const bookingId = booking.id || booking.booking_reference;

    if (!bookingId || remainingAmount <= 0) {
      setRemainingPayment({ bookingId: bookingId || '', message: '', error: 'No remaining balance is available for this booking.' });
      return;
    }

    setRemainingPayment({ bookingId, message: 'Creating secure payment order...', error: '' });

    const shortReceiptId = String(booking.booking_reference || bookingId).replace(/[^a-zA-Z0-9_-]/g, '').slice(-24);
    const orderResponse = await createRazorpayOrder({
      amount: remainingAmount,
      currency: 'INR',
      receipt: `rem_${shortReceiptId}`.slice(0, 40),
      notes: {
        booking_id: bookingId,
        booking_reference: booking.booking_reference || '',
        package_id: String(booking.package_id || ''),
        package_name: booking.package_name || booking.package?.name || '',
        payment_type: 'remaining_balance',
        remaining_amount: String(remainingAmount),
        customer_name: booking.customer?.name || user.name || '',
        customer_email: booking.customer?.email || user.email || '',
        customer_phone: booking.customer?.phone || '',
      },
    });

    if (!orderResponse.success) {
      setRemainingPayment({ bookingId, message: '', error: orderResponse.message || 'Unable to create payment order.' });
      return;
    }

    try {
      const Razorpay = await loadRazorpayCheckout();
      const { order, key_id: keyId } = orderResponse.data || {};

      setRemainingPayment({ bookingId, message: 'Opening Razorpay checkout...', error: '' });

      const checkout = new Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Travel Holiday',
        description: `${booking.package_name || booking.package?.name || 'Package'} balance payment`,
        order_id: order.id,
        prefill: {
          name: booking.customer?.name || user.name,
          email: booking.customer?.email || user.email,
          contact: booking.customer?.phone || '',
        },
        notes: order.notes,
        theme: { color: '#026eb5' },
        handler: async (response) => {
          setRemainingPayment({ bookingId, message: 'Verifying remaining payment...', error: '' });
          const verifyResponse = await verifyRazorpayPayment(response);

          if (!verifyResponse.success) {
            setRemainingPayment({
              bookingId,
              message: '',
              error: verifyResponse.message || 'Payment verification failed. Please contact support.',
            });
            return;
          }

          const paymentPayload = {
            amount: remainingAmount,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            payment_verified_at: new Date().toISOString(),
          };
          const payResponse = await payRemainingPackageBooking({ bookingId, payload: paymentPayload });

          if (payResponse.success) {
            setRemainingPayment({
              bookingId,
              message: payResponse.message || `Remaining payment recorded. Payment ID: ${response.razorpay_payment_id}`,
              error: '',
            });
            await loadCustomerBookings({ silent: true });
          } else {
            setRemainingPayment({
              bookingId,
              message: `Payment verified. Payment ID: ${response.razorpay_payment_id}`,
              error: payResponse.message || 'Unable to record remaining payment. Please contact support.',
            });
          }
        },
        modal: {
          ondismiss: () => {
            setRemainingPayment({ bookingId, message: '', error: 'Payment was cancelled.' });
          },
        },
      });

      checkout.open();
    } catch (error) {
      setRemainingPayment({
        bookingId,
        message: '',
        error: error?.message || 'Unable to open Razorpay checkout.',
      });
    }
  };

  const openCancellationRules = (booking) => {
    const bookingId = booking.id || booking.booking_reference || '';
    if (cancellationCloseTimerRef.current) {
      window.clearTimeout(cancellationCloseTimerRef.current);
      cancellationCloseTimerRef.current = null;
    }
    setCancellation((current) => ({
      bookingId,
      reason: current.bookingId === bookingId && cancellationReasonRef.current ? cancellationReasonRef.current.value : '',
      message: '',
      error: '',
      submitting: false,
    }));
  };

  const closeCancellationRules = () => {
    if (cancellationCloseTimerRef.current) {
      window.clearTimeout(cancellationCloseTimerRef.current);
      cancellationCloseTimerRef.current = null;
    }
    setCancellation({ bookingId: '', reason: '', message: '', error: '', submitting: false });
  };

  const submitCancellationRequest = async (booking) => {
    const bookingId = booking.id || booking.booking_reference || '';

    if (!bookingId) {
      setCancellation({ bookingId: '', reason: '', message: '', error: 'Booking id is missing for this cancellation.', submitting: false });
      return;
    }

    setCancellation((current) => ({ ...current, bookingId, submitting: true, message: 'Submitting return request...', error: '' }));

    const remainingAmount = Math.round(Number(booking.amounts?.remaining_amount) || 0);
    const cancellationReason = cancellationReasonRef.current?.value?.trim() || '';
    const response = await submitPackageReturnRequest({
      bookingId,
      payload: {
        departure_date: getBookingDepartureDate(booking),
        cancel_remaining: remainingAmount > 0,
        cancel_remaining_amount: remainingAmount,
        reason: cancellationReason || 'Customer requested cancellation',
      },
    });

    if (response.success) {
      const successMessage = response.message || 'Return request submitted successfully.';
      setCancellation((current) => ({
        ...current,
        bookingId,
        submitting: false,
        message: '',
        error: '',
      }));
      toast.success(successMessage, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        pauseOnHover: true,
        closeOnClick: true,
        theme: 'colored',
      });
      setReturnRequestedBookingIds((current) => {
        const next = new Set(current);
        next.add(String(bookingId));
        if (booking.booking_reference) next.add(String(booking.booking_reference));
        return next;
      });
      cancellationCloseTimerRef.current = window.setTimeout(() => {
        setCancellation({ bookingId: '', reason: '', message: '', error: '', submitting: false });
        cancellationCloseTimerRef.current = null;
      }, 5000);
      await loadCustomerBookings({ silent: true });
      await loadReturnRequests({ silent: true });
    } else {
      const errorMessage = response.message || 'Unable to submit return request.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        pauseOnHover: true,
        closeOnClick: true,
        theme: 'colored',
      });
      if (errorMessage.toLowerCase().includes('pending return request') || errorMessage.toLowerCase().includes('already exists')) {
        setReturnRequestedBookingIds((current) => {
          const next = new Set(current);
          next.add(String(bookingId));
          if (booking.booking_reference) next.add(String(booking.booking_reference));
          return next;
        });
      }
      setCancellation((current) => ({
        ...current,
        bookingId,
        submitting: false,
        message: '',
        error: errorMessage,
      }));
    }
  };

  const BookingCard = ({ booking }) => (
    <div
      style={{
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        gap: 0,
      }}
    >
      <div style={{ position: 'relative', width: 120, flexShrink: 0 }}>
        <Image
          src={booking.image}
          alt={booking.tourTitle}
          fill
          sizes="120px"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div style={{ padding: '16px 20px', flex: 1, minWidth: 0 }}>
        <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              {booking.tourTitle}
            </h3>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              📅 {booking.date} – {booking.endDate} &nbsp;·&nbsp; 👥 {booking.travelers} travelers
            </div>
          </div>
          <span
            className={`badge ${booking.status === 'Upcoming' ? 'badge-primary' : 'badge-success'}`}
            style={{ flexShrink: 0 }}
          >
            {booking.status}
          </span>
        </div>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)', fontFamily: 'Poppins, sans-serif' }}>
              ${booking.totalPrice.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 4 }}>total</span>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Link href={`/tours/${booking.tourSlug}`} className="btn-secondary btn-sm">
              View Tour
            </Link>
            <button
              className="btn-secondary btn-sm"
              onClick={() => setReviewingBookingId(reviewingBookingId === booking.id ? null : booking.id)}
              type="button"
            >
              {reviewingBookingId === booking.id ? 'Close Review' : 'Add Review'}
            </button>
            {booking.status === 'Upcoming' && (
              <Link href={`/booking/confirmation`} className="btn-primary btn-sm">
                E-Ticket
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ApiBookingCard = ({ booking }) => {
    const amounts = booking.amounts || {};
    const remainingAmount = Math.round(Number(amounts.remaining_amount) || 0);
    const bookingId = booking.id || booking.booking_reference || '';
    const isPayingRemaining = remainingPayment.bookingId === bookingId && Boolean(remainingPayment.message) && !remainingPayment.error;
    const isCancellationOpen = cancellation.bookingId === bookingId;
    const isCancelling = isCancellationOpen && cancellation.submitting;
    const statusText = `${booking.payment_status || ''} ${booking.status || ''}`.toLowerCase();
    const isCancelled = statusText.includes('cancel');
    const hasReturnRequest = hasExistingReturnRequest(booking) || returnRequestedBookingIds.has(String(bookingId)) || (
      booking.booking_reference ? returnRequestedBookingIds.has(String(booking.booking_reference)) : false
    );
    const route = Array.isArray(booking.route) ? booking.route.filter(Boolean).join(' -> ') : '';
    const packageSlug = booking.package_slug || booking.package?.slug || '';
    const packageHref = packageSlug
      ? `/tours?destination=${encodeURIComponent(booking.route?.[0] || 'destination')}&view=itinerary&package=${encodeURIComponent(packageSlug)}`
      : '/tours';

    return (
      <article className="dashboard-booking-card">
        <div className="dashboard-booking-media">
          <Image
            src={getBookingImage(booking)}
            alt={booking.package_name || booking.package?.name || 'Package booking'}
            fill
            sizes="180px"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="dashboard-booking-body">
          <div className="dashboard-booking-top">
            <div>
              <h3>{booking.package_name || booking.package?.name || 'Booked package'}</h3>
              <p>{route || 'Custom route'}{booking.duration ? ` - ${booking.duration}` : ''}</p>
            </div>
            <span className={`badge ${getPaymentBadgeClass(booking.payment_status)}`}>
              {String(booking.payment_status || 'Booked').replace(/_/g, ' ')}
            </span>
          </div>
          <div className="dashboard-booking-meta">
            <div><span>Booked on</span><strong>{formatBookingDate(booking.created_at)}</strong></div>
            <div><span>Total</span><strong>{formatMoney(amounts.package_total)}</strong></div>
            <div><span>Paid</span><strong>{formatMoney(amounts.paid_amount)}</strong></div>
            <div><span>Balance</span><strong>{formatMoney(amounts.remaining_amount)}</strong></div>
          </div>
          {booking.hotels?.length ? (
            <div className="dashboard-booking-hotels">
              {booking.hotels.slice(0, 3).map((hotel) => <span key={hotel.id || hotel.name}>{hotel.name}</span>)}
              {booking.hotels.length > 3 ? <span>+{booking.hotels.length - 3} more</span> : null}
            </div>
          ) : null}
          <div className="dashboard-booking-actions">
            <Link href={packageHref} className="btn-secondary btn-sm">View Package</Link>
            <button className="btn-secondary btn-sm" onClick={() => setReviewingBookingId(reviewingBookingId === booking.id ? null : booking.id)} type="button">
              {reviewingBookingId === booking.id ? 'Close Review' : 'Add Review'}
            </button>
            {remainingAmount > 0 ? (
              <button className="btn-primary btn-sm" disabled={isPayingRemaining} onClick={() => startRemainingPayment(booking)} type="button">
                {isPayingRemaining ? 'Please wait...' : `Pay Balance ${formatMoney(remainingAmount)}`}
              </button>
            ) : null}
            {hasReturnRequest ? (
              <button className="btn-danger-soft btn-sm is-disabled" disabled type="button">
                Cancellation Requested
              </button>
            ) : !isCancelled ? (
              <button className="btn-danger-soft btn-sm" disabled={isCancelling} onClick={() => openCancellationRules(booking)} type="button">
                {isCancelling ? 'Submitting...' : 'Cancel Booking'}
              </button>
            ) : null}
            <Link href="/booking/confirmation" className="btn-primary btn-sm">View Receipt</Link>
          </div>
          {isCancellationOpen ? (
            <div className="dashboard-cancel-panel">
              {cancellation.error ? <div className="dashboard-payment-error">{cancellation.error}</div> : null}
              <div className="dashboard-cancel-head">
                <div>
                  <span>Cancellation rules</span>
                  <strong>Review before sending a return request</strong>
                </div>
                <button type="button" onClick={closeCancellationRules} aria-label="Close cancellation rules">x</button>
              </div>
              {cancellationRulesLoading ? (
                <div className="dashboard-cancel-loading">Loading latest cancellation rules...</div>
              ) : (
                <div className="dashboard-cancel-rules">
                  {cancellationRules.map((rule) => (
                    <article key={rule.id || `${rule.min_days_before_departure}-${rule.max_days_before_departure}`}>
                      <div>
                        <span>{getCancellationRuleWindow(rule)}</span>
                        <strong>{Number(rule.refund_percentage) || 0}% refund</strong>
                      </div>
                      <p>{rule.description || `${Number(rule.cancellation_percentage) || 0}% cancellation charge applies.`}</p>
                      <small>{Number(rule.cancellation_percentage) || 0}% cancellation charge</small>
                    </article>
                  ))}
                </div>
              )}
              {cancellationRulesError ? <div className="dashboard-cancel-note">{cancellationRulesError}</div> : null}
              <label>
                Reason optional
                <textarea
                  key={`cancellation-reason-${bookingId}`}
                  ref={cancellationReasonRef}
                  defaultValue={cancellation.reason}
                  placeholder="Tell us why you want to cancel, if you want to share"
                />
              </label>
              <div className="dashboard-cancel-actions">
                <button className="btn-secondary btn-sm" type="button" onClick={closeCancellationRules}>Keep Booking</button>
                <button className="btn-danger-soft btn-sm" type="button" disabled={isCancelling} onClick={() => submitCancellationRequest(booking)}>
                  {isCancelling ? 'Submitting...' : 'Confirm Return Request'}
                </button>
              </div>
            </div>
          ) : null}
          {remainingPayment.bookingId === bookingId && remainingPayment.message ? (
            <div className="dashboard-payment-message">{remainingPayment.message}</div>
          ) : null}
          {remainingPayment.bookingId === bookingId && remainingPayment.error ? (
            <div className="dashboard-payment-error">{remainingPayment.error}</div>
          ) : null}
        </div>
      </article>
    );
  };

  const ReturnRequestCard = ({ request }) => {
    const booking = request.booking || {};
    const amounts = booking.amounts || {};
    const requested = request.requested || {};
    const rule = request.cancellation_rule || {};
    const packageSlug = booking.package_slug || '';
    const packageHref = packageSlug
      ? `/tours?destination=${encodeURIComponent(booking.route?.[0] || 'destination')}&view=itinerary&package=${encodeURIComponent(packageSlug)}`
      : '/tours';

    return (
      <article className="dashboard-return-card">
        <div className="dashboard-return-head">
          <div>
            <span>{request.booking_reference || booking.booking_reference || 'Return request'}</span>
            <h3>{booking.package_name || 'Package return request'}</h3>
            <p>Requested on {formatBookingDate(request.created_at)} · Departure {formatBookingDate(request.departure_date)}</p>
          </div>
          <span className={`badge ${getReturnStatusBadgeClass(request.status)}`}>
            {String(request.status || 'pending').replace(/_/g, ' ')}
          </span>
        </div>

        <div className="dashboard-booking-meta">
          <div><span>Package total</span><strong>{formatMoney(amounts.package_total)}</strong></div>
          <div><span>Paid</span><strong>{formatMoney(amounts.paid_amount)}</strong></div>
          <div><span>Refund requested</span><strong>{formatMoney(requested.refund_amount)}</strong></div>
          <div><span>Balance cancel</span><strong>{formatMoney(requested.cancel_remaining_amount)}</strong></div>
        </div>

        <div className="dashboard-return-rule">
          <div>
            <span>Applied rule</span>
            <strong>{Number(rule.refund_percentage) || 0}% refund · {Number(rule.cancellation_percentage) || 0}% cancellation charge</strong>
          </div>
          <p>{rule.description || 'Cancellation rule will be reviewed by the team.'}</p>
          {Number.isFinite(Number(rule.days_before_departure)) ? <small>{Number(rule.days_before_departure)} days before departure</small> : null}
        </div>

        {request.reason ? <p className="dashboard-custom-notes">Reason: {request.reason}</p> : null}
        {request.admin_notes ? <p className="dashboard-custom-notes">Admin note: {request.admin_notes}</p> : null}

        <div className="dashboard-booking-actions">
          <Link href={packageHref} className="btn-secondary btn-sm">View Package</Link>
          <Link href="/booking/confirmation" className="btn-primary btn-sm">View Receipt</Link>
        </div>
      </article>
    );
  };

  const CustomBookingCard = ({ inquiry }) => {
    const primaryMedia = inquiry.destination_gallery?.find((item) => item.is_primary && item.media_type !== 'video') || inquiry.destination_gallery?.find((item) => item.media_type !== 'video');
    const cities = Array.isArray(inquiry.cities) ? inquiry.cities.map((city) => city.name).filter(Boolean) : [];
    const rooms = Array.isArray(inquiry.rooms) ? inquiry.rooms : [];
    const adults = rooms.reduce((total, room) => total + (Number(room.adults) || 0), 0);
    const children = rooms.reduce((total, room) => total + (Number(room.children) || 0), 0);

    return (
      <article className="dashboard-booking-card">
        <div className="dashboard-booking-media">
          <Image
            src={getMediaUrl(primaryMedia?.url) || 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=900&q=80'}
            alt={primaryMedia?.alt_text || inquiry.destination || 'Customized booking'}
            fill
            sizes="180px"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="dashboard-booking-body">
          <div className="dashboard-booking-top">
            <div>
              <span>{inquiry.source ? String(inquiry.source).replace(/_/g, ' ') : 'Customized booking'}</span>
              <h3>{inquiry.destination || 'Custom destination'}</h3>
              <p>{cities.length ? cities.join(' -> ') : 'Custom route'}{inquiry.duration ? ` - ${inquiry.duration}` : ''}</p>
            </div>
            <span className={`badge ${String(inquiry.status || '').toLowerCase() === 'new' ? 'badge-primary' : 'badge-success'}`}>
              {String(inquiry.status || 'new').replace(/_/g, ' ')}
            </span>
          </div>
          <div className="dashboard-booking-meta">
            <div><span>Departure</span><strong>{inquiry.departure_date || 'Not selected'}</strong></div>
            <div><span>From</span><strong>{inquiry.departure_city || 'Not shared'}</strong></div>
            <div><span>Travellers</span><strong>{Number(inquiry.total_travellers) || adults + children || 0}</strong></div>
            <div><span>Travel type</span><strong>{inquiry.travel_with || 'Custom'}</strong></div>
          </div>
          <div className="dashboard-booking-hotels">
            <span>{adults} adults</span>
            {children ? <span>{children} children</span> : null}
            {rooms.length ? <span>{rooms.length} room plan{rooms.length > 1 ? 's' : ''}</span> : null}
            {inquiry.total_amount && Number(inquiry.total_amount) > 0 ? <span>{formatMoney(inquiry.total_amount)}</span> : null}
          </div>
          {inquiry.notes ? <p className="dashboard-custom-notes">{inquiry.notes}</p> : null}
          <div className="dashboard-booking-actions">
            <Link href={`/customize?dest=${encodeURIComponent(inquiry.destination || '')}`} className="btn-secondary btn-sm">
              Customize Again
            </Link>
            <Link href={`/itineraries/${encodeURIComponent(inquiry.id)}?from=dashboard&review=1#reviews`} className="btn-primary btn-sm">
              View Inquiry
            </Link>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <style jsx global>{`
        .booking-review-form { display: grid; gap: 14px; margin-top: 14px; padding: 18px; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-bg-card); box-shadow: var(--shadow-sm); }
        .booking-review-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        .booking-review-head strong { color: var(--color-text-primary); font-size: 16px; font-weight: 800; }
        .booking-review-rating { display: inline-flex; align-items: center; gap: 8px; color: var(--color-text-secondary); font-size: 13px; font-weight: 800; }
        .booking-review-rating select, .booking-review-fields input, .booking-review-fields textarea { width: 100%; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; color: var(--color-text-primary); font: inherit; font-size: 13px; outline: none; transition: border-color var(--transition-fast), box-shadow var(--transition-fast); }
        .booking-review-rating select { min-width: 76px; padding: 8px 10px; }
        .booking-review-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .booking-review-fields label { display: grid; gap: 6px; color: #475569; font-size: 12px; font-weight: 800; }
        .booking-review-fields input, .booking-review-fields textarea { padding: 11px 12px; }
        .booking-review-fields textarea { min-height: 96px; resize: vertical; }
        .booking-review-fields input:focus, .booking-review-fields textarea:focus, .booking-review-rating select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent); }
        .booking-review-fields .is-wide { grid-column: 1 / -1; }
        .booking-review-message { margin: 0; color: var(--color-primary); font-size: 13px; font-weight: 800; }
        .dashboard-booking-card { display: grid; grid-template-columns: 180px minmax(0, 1fr); overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-bg-card); box-shadow: var(--shadow-sm); }
        .dashboard-booking-media { position: relative; min-height: 210px; background: #e5e7eb; }
        .dashboard-booking-body { display: grid; gap: 14px; padding: 18px 20px; min-width: 0; }
        .dashboard-booking-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
        .dashboard-booking-top span:first-child { display: block; margin-bottom: 5px; color: var(--color-primary); font-size: 11px; font-weight: 900; letter-spacing: .4px; text-transform: uppercase; }
        .dashboard-booking-top h3 { margin: 0 0 5px; color: var(--color-text-primary); font-size: 17px; font-weight: 900; line-height: 1.25; }
        .dashboard-booking-top p { margin: 0; color: var(--color-text-muted); font-size: 13px; font-weight: 700; }
        .dashboard-booking-meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .dashboard-booking-meta div { padding: 10px 12px; border: 1px solid #edf1f5; border-radius: var(--radius-md); background: #f8fafc; min-width: 0; }
        .dashboard-booking-meta span { display: block; color: #64748b; font-size: 10px; font-weight: 900; letter-spacing: .4px; text-transform: uppercase; }
        .dashboard-booking-meta strong { display: block; margin-top: 3px; color: #0f172a; font-size: 13px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dashboard-booking-hotels { display: flex; flex-wrap: wrap; gap: 8px; }
        .dashboard-booking-hotels span { padding: 5px 8px; border-radius: 999px; background: #eef6ff; color: #075985; font-size: 11px; font-weight: 900; }
        .dashboard-booking-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .dashboard-booking-actions button:disabled { opacity: .72; cursor: not-allowed; }
        .btn-danger-soft { display: inline-flex; align-items: center; justify-content: center; border: 1px solid #fecaca; border-radius: var(--radius-md); background: #fff1f2; color: #b91c1c; font-weight: 900; text-decoration: none; transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast); }
        .btn-danger-soft:hover { transform: translateY(-1px); border-color: #fca5a5; background: #ffe4e6; color: #991b1b; }
        .btn-danger-soft.is-disabled, .btn-danger-soft:disabled { transform: none; border-color: #e5e7eb; background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
        .dashboard-cancel-panel { display: grid; gap: 13px; padding: 15px; border: 1px solid #fecaca; border-radius: var(--radius-lg); background: #fff7f7; }
        .dashboard-cancel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .dashboard-cancel-head span { display: block; color: #b91c1c; font-size: 10px; font-weight: 900; letter-spacing: .55px; text-transform: uppercase; }
        .dashboard-cancel-head strong { display: block; margin-top: 3px; color: #0f172a; font-size: 15px; font-weight: 900; }
        .dashboard-cancel-head button { width: 30px; height: 30px; border: 1px solid #fecaca; border-radius: 999px; background: #fff; color: #b91c1c; font-size: 14px; font-weight: 900; flex-shrink: 0; }
        .dashboard-cancel-rules { display: grid; gap: 8px; }
        .dashboard-cancel-rules article { display: grid; gap: 7px; padding: 11px 12px; border: 1px solid #fecaca; border-radius: var(--radius-md); background: #fff; }
        .dashboard-cancel-rules article > div { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
        .dashboard-cancel-rules span { color: #b91c1c; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .35px; }
        .dashboard-cancel-rules strong { color: #0f172a; font-size: 14px; font-weight: 900; white-space: nowrap; }
        .dashboard-cancel-rules p { margin: 0; color: #7f1d1d; font-size: 12px; font-weight: 800; line-height: 1.45; }
        .dashboard-cancel-rules small, .dashboard-cancel-loading, .dashboard-cancel-note { color: #9f1239; font-size: 11px; font-weight: 900; }
        .dashboard-cancel-loading, .dashboard-cancel-note { padding: 10px 12px; border: 1px solid #fecaca; border-radius: var(--radius-md); background: #fff; }
        .dashboard-cancel-panel label { display: grid; gap: 7px; color: #7f1d1d; font-size: 11px; font-weight: 900; letter-spacing: .4px; text-transform: uppercase; }
        .dashboard-cancel-panel textarea { width: 100%; min-height: 86px; resize: vertical; border: 1px solid #fecaca; border-radius: var(--radius-md); background: #fff; color: #0f172a; padding: 11px 12px; font: inherit; font-size: 13px; font-weight: 700; outline: none; text-transform: none; letter-spacing: 0; }
        .dashboard-cancel-panel textarea:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, .14); }
        .dashboard-cancel-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
        .dashboard-payment-message, .dashboard-payment-error { padding: 10px 12px; border-radius: var(--radius-md); font-size: 12px; font-weight: 900; line-height: 1.45; }
        .dashboard-payment-message { border: 1px solid #bbf7d0; background: #f0fdf4; color: #15803d; }
        .dashboard-payment-error { border: 1px solid #fecaca; background: #fff1f2; color: #b91c1c; }
        .dashboard-booking-state { padding: 28px; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-bg-card); color: var(--color-text-muted); font-size: 14px; font-weight: 800; text-align: center; }
        .dashboard-booking-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 22px; }
        .dashboard-booking-summary div { padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-bg-card); box-shadow: var(--shadow-sm); }
        .dashboard-booking-summary span { display: block; color: var(--color-text-muted); font-size: 11px; font-weight: 900; letter-spacing: .5px; text-transform: uppercase; }
        .dashboard-booking-summary strong { display: block; margin-top: 5px; color: var(--color-primary); font-size: 20px; font-weight: 900; font-family: Poppins, sans-serif; }
        .dashboard-booking-tabs { display: inline-flex; gap: 6px; padding: 5px; border: 1px solid var(--color-border); border-radius: 10px; background: #f8fafc; margin-bottom: 22px; }
        .dashboard-booking-tabs button { border: 0; border-radius: 8px; background: transparent; color: #475569; padding: 9px 14px; font-size: 13px; font-weight: 900; cursor: pointer; }
        .dashboard-booking-tabs button.active { background: #fff; color: var(--color-primary); box-shadow: 0 6px 18px rgba(15, 23, 42, .08); }
        .dashboard-return-card { display: grid; gap: 14px; padding: 18px 20px; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-bg-card); box-shadow: var(--shadow-sm); }
        .dashboard-return-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
        .dashboard-return-head span:first-child { display: block; margin-bottom: 5px; color: var(--color-primary); font-size: 11px; font-weight: 900; letter-spacing: .4px; text-transform: uppercase; }
        .dashboard-return-head h3 { margin: 0 0 5px; color: var(--color-text-primary); font-size: 17px; font-weight: 900; line-height: 1.25; }
        .dashboard-return-head p { margin: 0; color: var(--color-text-muted); font-size: 13px; font-weight: 700; }
        .dashboard-return-rule { display: grid; gap: 7px; padding: 12px 14px; border: 1px solid #dbeafe; border-radius: var(--radius-md); background: #f8fbff; }
        .dashboard-return-rule div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
        .dashboard-return-rule span { color: var(--color-primary); font-size: 10px; font-weight: 900; letter-spacing: .45px; text-transform: uppercase; }
        .dashboard-return-rule strong { color: #0f172a; font-size: 13px; font-weight: 900; text-align: right; }
        .dashboard-return-rule p { margin: 0; color: #475569; font-size: 12px; font-weight: 800; line-height: 1.45; }
        .dashboard-return-rule small { color: #64748b; font-size: 11px; font-weight: 900; }
        .dashboard-custom-notes { margin: 0; padding: 10px 12px; border-radius: var(--radius-md); background: #fff7ed; color: #9a3412; font-size: 12px; font-weight: 800; line-height: 1.45; }
        @media (max-width: 700px) {
          .dashboard-hero {
            padding: 118px 16px 42px !important;
            margin-bottom: 26px !important;
          }
          .dashboard-hero h1 {
            font-size: 34px !important;
            line-height: 1.12 !important;
          }
          .dashboard-hero p {
            font-size: 15px !important;
          }
          .dashboard-header-actions {
            width: 100%;
            margin-left: 0 !important;
          }
          .dashboard-header-actions a {
            width: 100%;
            justify-content: center;
          }
          .booking-review-fields { grid-template-columns: 1fr; }
          .dashboard-booking-card { grid-template-columns: 1fr; }
          .dashboard-booking-media { min-height: 190px; }
          .dashboard-booking-top, .dashboard-return-head, .dashboard-return-rule div { display: grid; }
          .dashboard-booking-meta, .dashboard-booking-summary { grid-template-columns: 1fr; }
        }
      `}</style>
      {/* Blog Hero Container */}
      <div className="dashboard-hero" style={{ background: '#111827', padding: '150px 24px 60px', textAlign: 'center', marginBottom: 50 }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 48, fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
          My Dashboard
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Manage your bookings, wishlist, and profile.
        </p>
      </div>

      <div className="container">
        {/* Header */}
        <div className="mb-6 d-flex align-items-center gap-4 flex-wrap" style={{ marginBottom: 40 }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: 'var(--color-text-primary)', marginBottom: 4 }}>
              Welcome back, {user.name.split(' ')[0]}! 👋
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>{user.email}</p>
          </div>
          <div className="ms-auto d-flex gap-2 dashboard-header-actions">
            <Link href="/tours" className="btn-primary btn-sm">
              Browse More Tours
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-5">
          {[
            { icon: '✈️', label: 'Total Trips', value: totalTripCount, color: 'var(--color-primary)' },
            { icon: '📅', label: 'Upcoming', value: upcomingBookings.length, color: '#f59e0b' },
            { icon: '✅', label: 'Completed', value: completedBookingCount, color: 'var(--color-accent)' },
            { icon: '❤️', label: 'Wishlist', value: wishlist.length, color: '#e53935' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="col-6 col-md-3">
              <div
                style={{
                  background: 'var(--color-bg-card)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Layout */}
        <div className="dashboard-layout">
          {/* Sidebar */}
          <div className="dashboard-sidebar">
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Navigation
              </div>
              <div className="d-flex flex-column gap-1">
                {NAV_ITEMS.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`dashboard-nav-item ${activeTab === id ? 'active' : ''}`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
              <button className="dashboard-nav-item" style={{ color: '#e53935', width: '100%' }}>
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            {/* My Bookings */}
            {activeTab === 'bookings' && (
              <div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--color-text-primary)', marginBottom: 24 }}>
                  My Bookings
                </h2>
                <div className="dashboard-booking-tabs" role="tablist" aria-label="Booking type">
                  <button type="button" className={bookingView === 'package' ? 'active' : ''} onClick={() => setBookingView('package')}>
                    My Booking
                  </button>
                  <button type="button" className={bookingView === 'customized' ? 'active' : ''} onClick={() => setBookingView('customized')}>
                    Customized Booking
                  </button>
                  <button type="button" className={bookingView === 'returns' ? 'active' : ''} onClick={() => setBookingView('returns')}>
                    Return Requests
                  </button>
                </div>

                {bookingView === 'package' ? (
                  bookingsLoading ? (
                    <div className="dashboard-booking-state">Loading your bookings...</div>
                  ) : bookingsError ? (
                    <div className="dashboard-booking-state">{bookingsError}</div>
                  ) : dashboardBookings.length ? (
                    <>
                      <div className="dashboard-booking-summary">
                        <div><span>Total booked</span><strong>{formatMoney(bookingSummary.totals?.package_total)}</strong></div>
                        <div><span>Paid amount</span><strong>{formatMoney(bookingSummary.totals?.paid_amount)}</strong></div>
                        <div><span>Remaining</span><strong>{formatMoney(bookingSummary.totals?.remaining_amount)}</strong></div>
                      </div>
                      <div className="d-flex flex-column gap-4">
                        {dashboardBookings.map((booking) => (
                          <div key={booking.id}>
                            <ApiBookingCard booking={booking} />
                            {reviewingBookingId === booking.id ? (
                              <PackageReviewForm
                                booking={booking}
                                onSubmitted={() => setReviewingBookingId(null)}
                                user={user}
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="dashboard-booking-state">No package bookings found yet.</div>
                  )
                ) : bookingView === 'customized' ? (
                  customBookingsLoading ? (
                    <div className="dashboard-booking-state">Loading customized bookings...</div>
                  ) : customBookingsError ? (
                    <div className="dashboard-booking-state">{customBookingsError}</div>
                  ) : customBookings.length ? (
                    <>
                      <div className="dashboard-booking-summary">
                        <div><span>Total requests</span><strong>{customBookingSummary.total}</strong></div>
                        <div><span>Current page</span><strong>{customBookingSummary.page || 1}</strong></div>
                        <div><span>API total</span><strong>{customBookingSummary.apiTotal || customBookingSummary.total}</strong></div>
                      </div>
                      <div className="d-flex flex-column gap-4">
                        {customBookings.map((inquiry) => (
                          <CustomBookingCard key={inquiry.id} inquiry={inquiry} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="dashboard-booking-state">No customized bookings found yet.</div>
                  )
                ) : (
                  returnRequestsLoading ? (
                    <div className="dashboard-booking-state">Loading return requests...</div>
                  ) : returnRequestsError ? (
                    <div className="dashboard-booking-state">{returnRequestsError}</div>
                  ) : returnRequests.length ? (
                    <>
                      <div className="dashboard-booking-summary">
                        <div><span>Total requests</span><strong>{returnRequestSummary.total}</strong></div>
                        <div><span>Pending</span><strong>{returnRequests.filter((request) => String(request.status || '').toLowerCase() === 'pending').length}</strong></div>
                        <div><span>Refund requested</span><strong>{formatMoney(returnRequests.reduce((total, request) => total + (Number(request.requested?.refund_amount) || 0), 0))}</strong></div>
                      </div>
                      <div className="d-flex flex-column gap-4">
                        {returnRequests.map((request) => (
                          <ReturnRequestCard key={request.id} request={request} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="dashboard-booking-state">No return requests found yet.</div>
                  )
                )}
              </div>
            )}

            {/* Upcoming */}
            {activeTab === 'upcoming' && (
              <div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--color-text-primary)', marginBottom: 24 }}>
                  Upcoming Tours — Countdown
                </h2>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-5">
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✈️</div>
                    <p style={{ color: 'var(--color-text-muted)' }}>No upcoming tours. Time to plan your next adventure!</p>
                    <Link href="/tours" className="btn-primary mt-2">Browse Tours</Link>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        style={{
                          background: 'var(--color-bg-card)',
                          borderRadius: 'var(--radius-xl)',
                          padding: 24,
                          border: '1px solid var(--color-border)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                          <div>
                            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{booking.package_name || booking.package?.name || booking.tourTitle}</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>📅 {booking.date}</p>
                          </div>
                          <Countdown dateStr={booking.date} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist */}
            {activeTab === 'wishlist' && (
              <div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 24 }}>
                  My Wishlist ❤️
                </h2>
                {wishlist.length ? (
                  <div className="row g-4">
                    {wishlist.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="col-md-6">
                        <div style={{
                          background: 'var(--color-bg-card)',
                          borderRadius: 'var(--radius-xl)',
                          overflow: 'hidden',
                          border: '1px solid var(--color-border)',
                          boxShadow: 'var(--shadow-sm)',
                          height: '100%',
                        }}>
                          <div style={{ position: 'relative', height: 160, background: '#e5e7eb' }}>
                            {item.image ? (
                              <Image src={item.image} alt={item.title} fill sizes="400px" style={{ objectFit: 'cover' }} />
                            ) : null}
                            <button
                              type="button"
                              className="tour-card-wishlist"
                              onClick={() => removeFromWishlist(item)}
                              aria-label={`Remove ${item.title} from wishlist`}
                              aria-pressed="true"
                              style={{ background: 'rgba(255,87,34,0.92)', color: 'white' }}
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </button>
                          </div>
                          <div style={{ padding: '16px 20px' }}>
                            <div className="d-flex align-items-center gap-2 flex-wrap" style={{ marginBottom: 8 }}>
                              {item.badge ? <span className="badge badge-primary">{item.badge}</span> : null}
                              {item.duration ? <span className="badge">{item.duration}</span> : null}
                            </div>
                            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.title}</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 12 }}>📍 {item.location || 'Holiday package'}</p>
                            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>
                                {item.price ? `Rs ${Number(item.price).toLocaleString('en-IN')}` : 'On request'}
                              </span>
                              <div className="d-flex gap-2">
                                <button type="button" className="btn-secondary btn-sm" onClick={() => removeFromWishlist(item)}>
                                  Remove
                                </button>
                                <Link href={item.href || '/tours'} className="btn-primary btn-sm">Book Now</Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-booking-state">
                    Your wishlist is empty. Save packages with the heart button and they will appear here.
                    <div style={{ marginTop: 14 }}>
                      <Link href="/tours" className="btn-primary btn-sm">Browse Tours</Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 24 }}>
                  My Profile
                </h2>
                <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', padding: 32, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="row g-4">
                    {[
                      { label: 'First Name', value: 'Alex', type: 'text' },
                      { label: 'Last Name', value: 'Johnson', type: 'text' },
                      { label: 'Email', value: user.email, type: 'email' },
                      { label: 'Phone', value: '+1 (555) 123-4567', type: 'tel' },
                      { label: 'Nationality', value: 'United States', type: 'text' },
                      { label: 'Passport Number', value: 'US1234567', type: 'text' },
                    ].map(({ label, value, type }) => (
                      <div key={label} className="col-sm-6">
                        <div className="form-group">
                          <label className="form-label">{label}</label>
                          <input type={type} className="form-input" defaultValue={value} />
                        </div>
                      </div>
                    ))}
                    <div className="col-12">
                      <button className="btn-primary">Save Changes</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            {activeTab === 'history' && (
              <div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 24 }}>
                  Travel History
                </h2>
                <div className="d-flex flex-column gap-4">
                  {completedBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer newestOnTop />
    </div>
  );
}
