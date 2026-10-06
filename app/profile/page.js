'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ToastContainer, toast as toastifyToast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import bookingsData from '@/data/bookings.json';
import { useWishlist } from '@/components/WishlistProvider';
import { getStoredToken, createRazorpayOrder, getCancellationRules, getCustomerBookings, getMediaUrl, getMyPackageReturnRequests, getStoredAuth, getTripInquiries, payRemainingPackageBooking, submitPackageReturnRequest, submitPackageReview, verifyRazorpayPayment, getCustomerProfile, changeCustomerPassword, clearAuthSession } from '@/utils/api';
import BookingDetailsModal from './BookingDetailsModal';

const NAV_ITEMS = [
  { id: 'bookings', label: 'My Bookings', icon: '📋' },
  { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
  { id: 'profile', label: 'My Profile', icon: '👤' },
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
  getMediaUrl(booking?.hotels?.find((hotel) => hotel?.image)?.image) ||
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

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('bookings');

  const handleSignOut = useCallback(() => {
    clearAuthSession();
    toast.success('Signed out successfully');
    router.push('/');
  }, [router]);

  // --- Profile State ---
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoadingProfile(false);
        return;
      }
      try {
        const response = await getCustomerProfile();
        setProfile(response.data);
      } catch (error) {
        console.error('Error loading profile', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setSavingProfile(true);
    try {
      const response = await changeCustomerPassword({ password });
      toast.success(response.message || 'Password updated successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to update password.';
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingLimit] = useState(10);
  const [reviewingBookingId, setReviewingBookingId] = useState(null);
  const [user, setUser] = useState(defaultDashboardUser);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [bookingSummary, setBookingSummary] = useState({ total: 0, page: 1, totalPages: 1 });
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  // Retained state for the profile dashboard's existing summary and request panels.
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
  const [bookingTypeFilter, setBookingTypeFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadCustomerBookings = useCallback(async (page = 1, { silent = false } = {}) => {
    const auth = getStoredAuth() || {};
    const customerId = getCustomerId(auth);
    if (!customerId) {
      setCustomerBookings([]);
      setBookingSummary({ total: 0, page: 1, totalPages: 1 });
      setBookingsLoading(false);
      setBookingsError('Please login to view your bookings.');
      return;
    }

    if (!silent) setBookingsLoading(true);
    setBookingsError('');
    try {
      const result = await getCustomerBookings({ customerId, page, limit: bookingLimit, type: bookingTypeFilter });
      const payload = result?.data || {};
      const rows = Array.isArray(payload) ? payload : (Array.isArray(payload.rows) ? payload.rows : []);
      if (result?.success) {
        setCustomerBookings(rows);
        const meta = result.pagination || payload.pagination || payload;
        setBookingSummary({
          total: Number(meta.totalRecords ?? meta.total ?? rows.length) || 0,
          page: Number(meta.currentPage ?? meta.page ?? page) || page,
          totalPages: Number(meta.totalPages ?? meta.total_pages ?? 1) || 1,
          limit: Number(meta.limit) || bookingLimit,
        });
        setBookingPage(Number(meta.currentPage ?? meta.page ?? page) || page);
      } else {
        setCustomerBookings([]);
        setBookingsError(result?.message || 'Unable to load your bookings.');
      }
    } catch (error) {
      setBookingsError(error?.message || 'Unable to load your bookings.');
    } finally {
      setBookingsLoading(false);
    }
  }, [bookingLimit]);

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
      loadCustomerBookings(bookingTypeFilter);

    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadCancellationRules, loadCustomerBookings, loadCustomBookings, loadReturnRequests,bookingTypeFilter]);

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


  // ---------- helpers ----------
  const inr = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDateTime = (value) =>
    value && !Number.isNaN(new Date(value).getTime())
      ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      : "—";

  // "2026-10-03" -> "03 Oct 2026" (no timezone shift)
  const formatDateOnly = (value) => {
    if (!value) return "—";
    const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return "—";
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const nightsBetween = (from, to) => {
    if (!from || !to) return 0;
    const a = new Date(String(from).slice(0, 10));
    const b = new Date(String(to).slice(0, 10));
    const diff = Math.round((b - a) / 86400000);
    return diff > 0 ? diff : 0;
  };

  const placeLabel = (item) =>
    item
      ? `${item.city || item.name || item.code || ""}${item.code ? ` (${item.code})` : ""
      }`
      : "—";

  const prettyStatus = (v, fallback = "PENDING") =>
    String(v || fallback).replace(/_/g, " ");

  const badgeStyle = (value) => {
    const text = String(value || "").toLowerCase();
    if (/fail|cancel|reject|refund/.test(text)) {
      return { background: "#fee2e2", color: "#991b1b", border: "1px solid #dc2626" };
    }
    if (/booked|success|confirmed|paid|completed/.test(text)) {
      return { background: "#dcfce7", color: "#14532d", border: "1px solid #16a34a" };
    }
    return { background: "#fef3c7", color: "#92400e", border: "1px solid #d97706" };
  };

  const badge = (value, prefix = "") => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 11px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 800,
        letterSpacing: "0.2px",
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        ...badgeStyle(value),
      }}
    >
      {prefix}
      {value}
    </span>
  );

  // Pull a readable failure reason from whatever the API gave us
  const getFailureInfo = (booking) => {
    const bd = booking.booking_data || {};
    const err =
      bd.bookingError ||
      bd.error ||
      bd.tripjack?.bookError ||
      bd.tripjack?.book?.errors?.[0] ||
      null;

    const message =
      (typeof err === "string" ? err : err?.message || err?.errMsg || err?.details) ||
      booking.failure_reason ||
      booking.error_message ||
      booking.failure_message ||
      bd.failureReason ||
      "";

    return {
      message,
      failedAt: err?.failedAt || booking.updated_at,
    };
  };

  // Fare / baggage changes reported by provider (flight)
  const getFlightAlerts = (booking) => {
    const alerts = booking.booking_data?.review?.alerts || [];
    const rows = [];
    alerts.forEach((alert) => {
      Object.entries(alert.miscAlert || {}).forEach(([sector, changes]) => {
        (changes || []).forEach((c) =>
          rows.push(`${sector} · ${c.key}: ${c.oldValue} → ${c.newValue}`)
        );
      });
    });
    return rows;
  };

  const Fact = ({ label, value }) => (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );

  // ---------- component ----------
  const ApiBookingCard = ({ booking, onViewDetails }) => {
    const bd = booking.booking_data || {};
    const type = String(booking.booking_type || "FLIGHT").toUpperCase();
    const isHotel = type === "HOTEL";

    const status = prettyStatus(booking.status);
    const paymentStatus = prettyStatus(booking.payment_status);
    const isFailed = /fail|reject|cancel/i.test(booking.status || "");
    const paymentOk = /success|paid|captured/i.test(booking.payment_status || "");

    const amount = Number(
      booking.amount ??
      (isHotel
        ? bd.tripjack?.summary?.amount
        : bd.review?.totalPriceInfo?.totalFareDetail?.fC?.TF) ??
      0
    );

    // ----- FLIGHT data -----
    const segments = isHotel
      ? []
      : bd.review?.tripInfos?.flatMap((t) => t.sI || []) ||
      bd.selectedFare?.flatMap((f) => f.flight?.sI || []) ||
      [];
    const first = segments[0];
    const last = segments[segments.length - 1];
    const fareInfo = bd.review?.tripInfos?.[0]?.totalPriceList?.[0]?.fd?.ADULT;
    const seats = (bd.seatSelection?.seats || [])
      .map((s) => s.seat?.seatNo)
      .filter(Boolean);

    // ----- HOTEL data -----
    const hotelSummary = bd.tripjack?.summary;
    const hotelName = bd.hotel?.hotelName || hotelSummary?.hotel?.name || "Hotel booking";
    const hotelCity = hotelSummary?.hotel?.city;
    const hotelAddress = hotelSummary?.hotel?.address;
    const hotelRating = hotelSummary?.hotel?.rating;
    const checkIn = bd.search?.checkIn || hotelSummary?.stay?.checkIn;
    const checkOut = bd.search?.checkOut || hotelSummary?.stay?.checkOut;
    const nights = nightsBetween(checkIn, checkOut);
    const room = hotelSummary?.rooms?.[0];
    const roomCount = bd.search?.rooms?.length || hotelSummary?.rooms?.length || 0;
    const refundable =
      hotelSummary?.cancellation?.refundable ??
      bd.tripjack?.review?.option?.cancellation?.isRefundable;

    // ----- passengers / guests -----
    const people = isHotel
      ? bd.guests || []
      : bd.passengers || bd.travellerInfo || [];
    const primaryName = (() => {
      const p = isHotel ? bd.primaryGuest || people[0] : people[0];
      return p ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : "";
    })();

    // ----- failure -----
    const failure = isFailed ? getFailureInfo(booking) : null;
    const flightAlerts = isFailed && !isHotel ? getFlightAlerts(booking) : [];

    const title = isHotel
      ? hotelName
      : first
        ? `${placeLabel(first.da)} → ${placeLabel(last?.aa)}`
        : "Flight booking";

    const handleView = () => onViewDetails?.(booking);

    return (
      <article className="flight-booking-card">
        {/* ---------- head ---------- */}
        <div className="flight-booking-head">
          <div className="flight-booking-title">
            <span className="flight-booking-eyebrow">
              {isHotel ? "🏨 HOTEL" : "✈ FLIGHT"} · {booking.provider || "TRAVEL"}
            </span>

            <h3>{title}</h3>

            {isHotel && (hotelCity || hotelAddress) && (
              <p style={{ marginBottom: 2 }}>
                {[hotelAddress, hotelCity].filter(Boolean).join(", ")}
                {hotelRating ? ` · ${hotelRating}★` : ""}
              </p>
            )}

            <p>
              Booking reference:{" "}
              <strong>
                {booking.booking_reference || booking.provider_reference || booking.id}
              </strong>
            </p>
          </div>

          <div
            className="flight-booking-badges"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            {badge(status)}
            {badge(paymentStatus, "Payment: ")}
          </div>
        </div>

        {/* ---------- failure box ---------- */}
        {isFailed && (
          <div
            role="alert"
            style={{
              margin: "14px 0 0",
              padding: "12px 14px",
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#7f1d1d",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <strong style={{ display: "block", marginBottom: 4 }}>
              Booking failed
            </strong>
            <div>
              Reason:{" "}
              {failure?.message ? (
                <strong>{failure.message}</strong>
              ) : (
                "Provider ne reason share nahi kiya."
              )}
            </div>

            {failure?.failedAt && (
              <div style={{ opacity: 0.85 }}>
                Failed at: {formatDateTime(failure.failedAt)}
              </div>
            )}

            {paymentOk && (
              <div style={{ marginTop: 6, fontWeight: 600 }}>
                Payment successful hai, lekin booking confirm nahi hui. Refund
                check karna hoga.
              </div>
            )}

            {flightAlerts.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {flightAlerts.map((row) => (
                  <li key={row}>{row}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ---------- FLIGHT body ---------- */}
        {!isHotel &&
          (segments.length ? (
            <div className="flight-segments">
              {segments.map((segment, index) => (
                <div
                  className="flight-segment"
                  key={`${segment.id || segment.fD?.fN || "segment"}-${index}`}
                >
                  <div className="flight-airline">
                    <span className="flight-airline-mark">✈</span>
                    <div>
                      <strong>
                        {segment.fD?.aI?.name || segment.fD?.aI?.code || "Airline"}
                      </strong>
                      <small>
                        {segment.fD?.aI?.code || ""} {segment.fD?.fN || ""}
                      </small>
                    </div>
                  </div>

                  <div className="flight-route">
                    <div>
                      <strong>{segment.da?.code || "—"}</strong>
                      <span>{segment.da?.city || segment.da?.name || ""}</span>
                      <small>{formatDateTime(segment.dt)}</small>
                    </div>

                    <div className="flight-route-line">
                      <span>
                        {segment.duration ? `${segment.duration} min` : "Flight"}
                      </span>
                      <i />
                    </div>

                    <div className="flight-arrival">
                      <strong>{segment.aa?.code || "—"}</strong>
                      <span>{segment.aa?.city || segment.aa?.name || ""}</span>
                      <small>{formatDateTime(segment.at)}</small>
                    </div>
                  </div>

                  {segment.cT > 0 && index < segments.length - 1 && (
                    <small style={{ display: "block", marginTop: 6, opacity: 0.7 }}>
                      Layover at {segment.aa?.code}: {segment.cT} min
                    </small>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flight-booking-muted">
              Flight itinerary details are not available.
            </div>
          ))}

        {/* ---------- HOTEL body ---------- */}
        {isHotel &&
          (checkIn || checkOut ? (
            <div className="flight-segments">
              <div className="flight-segment">
                <div className="flight-airline">
                  <span className="flight-airline-mark">🛏</span>
                  <div>
                    <strong>{room?.name || "Room"}</strong>
                    <small>{room?.mealBasis || ""}</small>
                  </div>
                </div>

                <div className="flight-route">
                  <div>
                    <strong>Check-in</strong>
                    <span>{formatDateOnly(checkIn)}</span>
                    <small>from {hotelSummary?.hotel?.checkInFrom || "—"}</small>
                  </div>

                  <div className="flight-route-line">
                    <span>
                      {nights ? `${nights} night${nights > 1 ? "s" : ""}` : "Stay"}
                    </span>
                    <i />
                  </div>

                  <div className="flight-arrival">
                    <strong>Check-out</strong>
                    <span>{formatDateOnly(checkOut)}</span>
                    <small>by {hotelSummary?.hotel?.checkOutFrom || "—"}</small>
                  </div>
                </div>
              </div>

              {refundable !== undefined && refundable !== null && (
                <div style={{ marginTop: 10 }}>
                  {badge(
                    refundable ? "Refundable" : "Non-refundable",
                    ""
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flight-booking-muted">
              Hotel stay details are not available.
            </div>
          ))}

        {/* ---------- footer ---------- */}
        <div className="flight-booking-footer">
          <div className="flight-booking-facts">
            <Fact label="Booked on" value={formatDateTime(booking.created_at)} />

            {isHotel ? (
              <>
                <Fact label="Guests" value={people.length || "—"} />
                <Fact label="Rooms" value={roomCount || "—"} />
              </>
            ) : (
              <>
                <Fact label="Passengers" value={people.length || "—"} />
                {fareInfo?.cc && <Fact label="Cabin" value={fareInfo.cc} />}
                {fareInfo?.bI?.iB && (
                  <Fact label="Check-in bag" value={fareInfo.bI.iB} />
                )}
                {seats.length > 0 && <Fact label="Seats" value={seats.join(", ")} />}
              </>
            )}

            {primaryName && (
              <Fact label={isHotel ? "Primary guest" : "Lead passenger"} value={primaryName} />
            )}

            <Fact
              label="Provider booking ID"
              value={booking.provider_booking_id || "—"}
            />
          </div>

          <div className="flight-booking-total">
            <span>Total amount</span>
            <strong>{inr(amount)}</strong>
          </div>
        </div>

        {/* ---------- action ---------- */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedBooking?.(booking)}

            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 3px 8px rgba(37, 99, 235, 0.25)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #2563eb, #1d4ed8)";
              e.currentTarget.style.boxShadow = "0 5px 12px rgba(37, 99, 235, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #3b82f6, #2563eb)";
              e.currentTarget.style.boxShadow = "0 3px 8px rgba(37, 99, 235, 0.25)";
            }}
          >
            View Details
            <span style={{ fontSize: "16px" }}>→</span>
          </button>
        </div>
      </article>
    );
  };




  const filteredCustomerBookings = customerBookings.filter((booking) => {
    if (bookingTypeFilter === "ALL") return true;

    const type = String(
      booking.booking_type || booking.bookingType || booking.type || ""
    ).toUpperCase();

    return type === bookingTypeFilter;
  });

  return (
    <div style={{ paddingBottom: 80 }}>
      <style jsx global>{`
        .customer-bookings-section { min-width: 0; }
        .customer-bookings-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:22px; }
        .customer-bookings-heading h2 { margin:0 0 5px; color:var(--color-text-primary); font:800 clamp(20px,2.5vw,26px) Poppins,sans-serif; }
        .customer-bookings-heading p { margin:0; color:var(--color-text-muted); font-size:13px; }
        .flight-booking-count { color:var(--color-text-muted); font-size:13px; margin-bottom:12px; }
        .flight-booking-list { display:grid; gap:16px; }
        .flight-booking-card { min-width:0; padding:clamp(14px,2.5vw,22px); border:1px solid var(--color-border); border-radius:16px; background:var(--color-bg-card); box-shadow:var(--shadow-sm); }
        .flight-booking-head { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; }
        .flight-booking-title { min-width:0; }
        .flight-booking-eyebrow { color:var(--color-primary); font-size:10px; font-weight:900; letter-spacing:.7px; }
        .flight-booking-title h3 { margin:5px 0; color:var(--color-text-primary); font-size:clamp(16px,2vw,20px); font-weight:900; overflow-wrap:anywhere; }
        .flight-booking-title p { margin:0; color:var(--color-text-muted); font-size:12px; overflow-wrap:anywhere; }
        .flight-booking-title p strong { color:var(--color-text-primary); }
        .flight-booking-badges { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:6px; }
        .flight-segments { margin-top:17px; border:1px solid var(--color-border); border-radius:12px; overflow:hidden; }
        .flight-segment { display:grid; grid-template-columns:minmax(120px,.65fr) minmax(0,1.7fr); gap:16px; align-items:center; padding:14px; }
        .flight-segment + .flight-segment { border-top:1px dashed var(--color-border); }
        .flight-airline { display:flex; align-items:center; gap:9px; min-width:0; }
        .flight-airline-mark { display:grid; place-items:center; flex:0 0 34px; height:34px; border-radius:10px; background:color-mix(in srgb,var(--color-primary) 10%,transparent); color:var(--color-primary); }
        .flight-airline strong,.flight-airline small { display:block; overflow-wrap:anywhere; }
        .flight-airline strong { font-size:12px; color:var(--color-text-primary); }
        .flight-airline small { color:var(--color-text-muted); font-size:11px; }
        .flight-route { display:grid; grid-template-columns:minmax(60px,1fr) minmax(60px,1fr) minmax(60px,1fr); gap:10px; align-items:center; min-width:0; }
        .flight-route > div:not(.flight-route-line) { display:flex; flex-direction:column; min-width:0; }
        .flight-route strong { font-size:16px; color:var(--color-text-primary); }
        .flight-route span,.flight-route small { color:var(--color-text-muted); font-size:10px; overflow-wrap:anywhere; }
        .flight-route-line { display:flex; flex-direction:column; align-items:center; gap:5px; color:var(--color-text-muted); }
        .flight-route-line i { display:block; width:100%; height:1px; background:var(--color-border); position:relative; }
        .flight-route-line i:after { content:''; position:absolute; right:0; top:-3px; width:7px; height:7px; border-top:1px solid var(--color-text-muted); border-right:1px solid var(--color-text-muted); transform:rotate(45deg); }
        .flight-arrival { text-align:right; }
        .flight-booking-footer { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-top:15px; padding-top:14px; border-top:1px solid var(--color-border); }
        .flight-booking-facts { display:flex; flex-wrap:wrap; gap:20px; min-width:0; }
        .flight-booking-facts div,.flight-booking-total { display:flex; flex-direction:column; gap:3px; min-width:0; }
        .flight-booking-facts span,.flight-booking-total span { color:var(--color-text-muted); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.35px; }
        .flight-booking-facts strong { color:var(--color-text-primary); font-size:11px; overflow-wrap:anywhere; }
        .flight-booking-total { text-align:right; flex-shrink:0; }
        .flight-booking-total strong { color:var(--color-primary); font-size:19px; font-weight:900; white-space:nowrap; }
        .booking-pagination { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:18px; padding:12px 0; color:var(--color-text-muted); font-size:12px; }
        .booking-pagination > div { display:flex; gap:8px; }
        .flight-booking-empty { display:grid; justify-items:center; text-align:center; gap:8px; padding:44px 16px; border:1px dashed var(--color-border); border-radius:14px; background:var(--color-bg-card); }
        .flight-booking-empty > div { display:grid; place-items:center; width:52px; height:52px; border-radius:50%; background:color-mix(in srgb,var(--color-primary) 10%,transparent); color:var(--color-primary); font-size:25px; }
        .flight-booking-empty h3,.flight-booking-empty p { margin:0; }
        .flight-booking-empty h3 { color:var(--color-text-primary); font-size:16px; font-weight:800; }
        .flight-booking-empty p { color:var(--color-text-muted); font-size:13px; }
        .flight-booking-skeleton { display:grid; gap:12px; }
        .flight-booking-skeleton span { display:block; height:150px; border-radius:14px; background:linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9); background-size:200% 100%; animation:booking-shimmer 1.4s infinite; }
        @keyframes booking-shimmer { to { background-position:-200% 0; } }
        @media(max-width:700px) {
          .customer-bookings-heading { align-items:flex-start; }
          .flight-booking-head { flex-direction:column; }
          .flight-booking-badges { justify-content:flex-start; }
          .flight-segment { grid-template-columns:1fr; gap:12px; }
          .flight-booking-footer { align-items:flex-start; flex-direction:column; }
          .flight-booking-total { text-align:left; }
        }
        @media(max-width:420px) {
          .booking-pagination { align-items:flex-start; flex-direction:column; }
          .flight-route { gap:6px; }
          .flight-route strong { font-size:14px; }
          .flight-route span,.flight-route small { font-size:9px; }
        }

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
          My Profile
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Manage your bookings, wishlist, and profile settings.
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
              <button className="dashboard-nav-item" style={{ color: '#e53935', width: '100%' }} onClick={handleSignOut}>
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            {/* My Bookings */}

            {activeTab === 'bookings' && (
              <section className="customer-bookings-section">
                <div className="customer-bookings-heading">
                  <div>
                    <h2>My Bookings</h2>
                    <p>View your flight itinerary, booking status and payment details.</p>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => loadCustomerBookings(bookingPage)}
                    disabled={bookingsLoading}
                  >
                    {bookingsLoading ? 'Refreshing…' : '↻ Refresh'}
                  </button>
                </div>

                {/* Booking filters */}
                <div className="booking-type-filters">
                  {[
                    { label: 'All', value: 'ALL' },
                    { label: 'Hotel', value: 'HOTEL' },
                    { label: 'Flight', value: 'FLIGHT' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      className={`booking-filter-btn ${bookingTypeFilter === filter.value ? 'active' : ''
                        }`}
                      onClick={() => setBookingTypeFilter(filter.value)}
                      aria-pressed={bookingTypeFilter === filter.value}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {bookingsError ? (
                  <div className="dashboard-booking-state" role="alert">
                    <p>{bookingsError}</p>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => loadCustomerBookings(bookingPage)}
                    >
                      Try again
                    </button>
                  </div>
                ) : bookingsLoading ? (
                  <div className="flight-booking-skeleton" aria-label="Loading bookings">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : filteredCustomerBookings.length ? (
                  <>
                    <div className="flight-booking-count">
                      {filteredCustomerBookings.length} booking
                      {filteredCustomerBookings.length === 1 ? '' : 's'} found
                    </div>

                    <div className="flight-booking-list">
                      {filteredCustomerBookings.map((booking) => (
                        <ApiBookingCard
                          key={booking.id || booking.booking_reference}
                          booking={booking}
                        />
                      ))}
                    </div>

                   
                      <nav className="booking-pagination" aria-label="Bookings pagination">
                        <span>
                          Page {bookingSummary.page} of {bookingSummary.totalPages}
                        </span>
                        <div>
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            disabled={bookingsLoading || bookingSummary.page <= 1}
                            onClick={() =>
                              loadCustomerBookings(bookingSummary.page - 1)
                            }
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            disabled={
                              bookingsLoading ||
                              bookingSummary.page >= bookingSummary.totalPages
                            }
                            onClick={() =>
                              loadCustomerBookings(bookingSummary.page + 1)
                            }
                          >
                            Next
                          </button>
                        </div>
                      </nav>
                   
                  </>
                ) : (
                  <div className="flight-booking-empty">
                    <div>✈</div>
                    <h3>
                      {bookingTypeFilter === 'ALL'
                        ? 'No bookings yet'
                        : `No ${bookingTypeFilter.toLowerCase()} bookings found`}
                    </h3>
                    <p>
                      {bookingTypeFilter === 'ALL'
                        ? 'Your confirmed bookings will appear here.'
                        : `You don't have any ${bookingTypeFilter.toLowerCase()} bookings yet.`}
                    </p>
                    <Link href="/tours" className="btn-primary btn-sm">
                      Explore trips
                    </Link>
                  </div>
                )}
              </section>
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

                {loadingProfile ? (
                  <div className="dashboard-booking-state">Loading your profile...</div>
                ) : profile ? (
                  <div className="d-flex flex-column gap-4">
                    {/* Personal Information */}
                    <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', padding: 32, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Personal Information</h3>
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label className="form-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>Full Name</label>
                          <div style={{ fontWeight: 600 }}>{profile.name || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>Email Address</label>
                          <div style={{ fontWeight: 600 }}>{profile.email || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>Phone Number</label>
                          <div style={{ fontWeight: 600 }}>{profile.phone_number || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>Account Status</label>
                          <div style={{ fontWeight: 600 }}>
                            <span className={`badge ${profile.status ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 12, padding: '4px 8px' }}>
                              {profile.status ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Change Password Form */}
                    <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', padding: 32, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Change Password</h3>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24 }}>
                        Keep your account secure by updating your password regularly.
                      </p>
                      <form onSubmit={handlePasswordSubmit}>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>New Password</label>
                            <input
                              type="password"
                              className="form-input"
                              placeholder="Enter new password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>Confirm Password</label>
                            <input
                              type="password"
                              className="form-input"
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-12 mt-4">
                            <button
                              type="submit"
                              className="btn-primary"
                              disabled={savingProfile}
                            >
                              {savingProfile ? 'Updating...' : 'Update Password'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="dashboard-booking-state">Unable to load profile.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer newestOnTop />
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
