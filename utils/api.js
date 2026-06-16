import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BASE_IMAGE_URL;
const DEFAULT_API_BASE_URL = 'https://tourtravel.yber.in/api/v1';
const DEFAULT_MEDIA_BASE_URL = 'https://tourtravel.yber.in';
export const AUTH_STORAGE_KEY = 'wl_auth';
export const TOKEN_STORAGE_KEY = 'wl_token';
export const AUTH_CHANGED_EVENT = 'wl_auth_changed';

const apiClient = axios.create({
  baseURL: BASE_URL || DEFAULT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const getStoredAuth = () => {
  if (typeof window === 'undefined') return null;

  try {
    const auth = localStorage.getItem(AUTH_STORAGE_KEY);
    return auth ? JSON.parse(auth) : null;
  } catch {
    return null;
  }
};

export const setAuthSession = ({ user, token }) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...user, token }));
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  delete apiClient.defaults.headers.common.Authorization;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  const publicAuthUrls = [
    '/customers/login',
    '/customers/register',
    '/customers/forgot-password',
    '/customers/reset-password',
  ];
  const publicContentUrls = [
    '/pages',
    '/categories',
    '/destinations',
    '/blogs',
    '/reviews',
    '/packages',
  ];
  const isPublicAuthRequest = publicAuthUrls.some((url) => config.url?.startsWith(url));
  const isPublicContentRequest = publicContentUrls.some((url) => config.url?.startsWith(url));

  if (token && !isPublicAuthRequest && !isPublicContentRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isPublicAuthRequest || isPublicContentRequest) {
    delete config.headers.Authorization;
  }

  return config;
});

export const registerCustomer = async ({ firstName, lastName, email, password, phone }) => {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  const response = await apiClient.post('/customers/register', {
    name,
    email,
    password,
    phone,
  });
  const user = response.data?.data?.user;
  const token = user?.token;

  if (user && token) {
    setAuthSession({ user, token });
  }

  return response.data;
};

export const loginCustomer = async ({ email, password }) => {
  const response = await apiClient.post('/customers/login', {
    email,
    password,
  });
  const user = response.data?.data?.user;
  const token = response.data?.data?.token;

  if (user && token) {
    setAuthSession({ user, token });
  }

  return response.data;
};

export const forgotCustomerPassword = async ({ email }) => {
  const response = await apiClient.post('/customers/forgot-password', {
    email,
  });

  return response.data;
};

export const resetCustomerPassword = async ({ email, token, password }) => {
  const response = await apiClient.post('/customers/reset-password', {
    email,
    token,
    password,
  });

  return response.data;
};

export const getCustomerProfile = async () => {
  const response = await apiClient.get('/customers/profile');
  return response.data;
};

export const changeCustomerPassword = async ({ password }) => {
  const response = await apiClient.post('/customers/change-password', {
    password,
  });

  return response.data;
};

let categoriesCache = null;

export const getCategories = async () => {
  if (categoriesCache) return categoriesCache;

  try {
    const response = typeof window === 'undefined'
      ? await apiClient.get('/categories')
      : await axios.get('/api/categories', {
        params: { _t: Date.now() },
        validateStatus: () => true,
      });
    if (response.data && response.data.success) {
      categoriesCache = response.data.data;
      return categoriesCache;
    }
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

let destinationsCache = {};

let allDestinationsCache = null;

export const getDestinations = async (filters = {}) => {
  const params = cleanParams(filters);
  const cacheKey = JSON.stringify(params);

  if (!cacheKey || cacheKey === '{}') {
    if (allDestinationsCache) return allDestinationsCache;
  }

  try {
    const response = typeof window === 'undefined'
      ? await apiClient.get('/destinations', { params })
      : await axios.get('/api/destinations', {
        params: { ...params, _t: Date.now() },
        validateStatus: () => true,
      });

    const data = normalizeApiData(response) || [];

    if (!cacheKey || cacheKey === '{}') {
      allDestinationsCache = data;
    }

    return data;
  } catch (error) {
    console.warn('Destinations unavailable:', error?.message || error);
    return [];
  }
};

export const getDestinationsByCategory = async (categoryId) => {
  if (destinationsCache[categoryId]) return destinationsCache[categoryId];


  try {
    const response = typeof window === 'undefined'
      ? await apiClient.get(`/destinations?category_id=${categoryId}`)
      : await axios.get('/api/destinations', {
        params: { category_id: categoryId, _t: Date.now() },
        validateStatus: () => true,
      });
    if (response.data && response.data.success) {
      destinationsCache[categoryId] = response.data.data;
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching destinations for category ${categoryId}:`, error);
    return [];
  }
};

const normalizeApiData = (response) => {
  if (response.data && response.data.success) {
    return response.data.data;
  }
  return null;
};

const normalizeApiPagination = (response) => response.data?.pagination || null;

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const base = BASE_IMAGE_URL || DEFAULT_MEDIA_BASE_URL;
  return `${base.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
};

export const getReviews = async (params = {}) => {
  try {
    const response = await axios.get('/api/reviews', {
      params: { status: 'all', ...params, _t: Date.now() },
      validateStatus: () => true,
    });
    if (response.data && response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.warn('Reviews unavailable:', error?.message || error);
    return [];
  }
};

export const likeReview = async (reviewId) => {
  if (!reviewId) {
    return { success: false, message: 'Review id is required' };
  }

  try {
    const response = await axios.post(`/api/reviews/${encodeURIComponent(reviewId)}/like`, null, {
      headers: { accept: 'application/json' },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to like review' };
  } catch (error) {
    console.warn('Review like unavailable:', error?.message || error);
    return { success: false, message: 'Unable to like review' };
  }
};

export const getPackageReviews = async ({ packageId, packageSlug, status = 'approved' } = {}) => {
  if (!packageId && !packageSlug) {
    return { reviews: [], summary: { count: 0, average_rating: 0 }, package: null, total: 0 };
  }

  try {
    const response = await axios.get('/api/reviews', {
      params: {
        ...(packageId ? { package_id: packageId } : {}),
        ...(packageSlug ? { package_slug: packageSlug } : {}),
        status,
        _t: Date.now(),
      },
      validateStatus: () => true,
    });

    if (response.data?.success) {
      return {
        reviews: response.data.data || [],
        summary: response.data.summary || { count: 0, average_rating: 0 },
        package: response.data.package || null,
        total: Number(response.data.total) || Number(response.data.summary?.count) || 0,
      };
    }
  } catch (error) {
    console.warn('Package reviews unavailable:', error?.message || error);
  }

  return { reviews: [], summary: { count: 0, average_rating: 0 }, package: null, total: 0 };
};

export const submitPackageReview = async (formData) => {
  try {
    const response = await axios.post('/api/reviews', formData, {
      headers: { accept: '*/*' },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to submit review' };
  } catch (error) {
    console.warn('Package review submission unavailable:', error?.message || error);
    return { success: false, message: 'Unable to submit review' };
  }
};

export const getTripInquiryReviews = async ({ inquiryId, status = 'approved' } = {}) => {
  if (!inquiryId) {
    return { reviews: [], summary: { count: 0, average_rating: 0 }, total: 0 };
  }

  try {
    const response = await axios.get('/api/reviews', {
      params: {
        inquiry_id: inquiryId,
        review_type: 'trip_inquiry',
        status,
        _t: Date.now(),
      },
      validateStatus: () => true,
    });

    if (response.data?.success) {
      const reviews = Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data.data?.rows)
          ? response.data.data.rows
          : Array.isArray(response.data.rows)
            ? response.data.rows
            : [];
      return {
        reviews,
        summary: response.data.summary || { count: reviews.length, average_rating: 0 },
        total: Number(response.data.total) || Number(response.data.summary?.count) || reviews.length,
      };
    }
  } catch (error) {
    console.warn('Trip inquiry reviews unavailable:', error?.message || error);
  }

  return { reviews: [], summary: { count: 0, average_rating: 0 }, total: 0 };
};

export const submitTripInquiryReview = async ({ inquiryId, review }) => {
  const payload = {
    inquiry_id: String(inquiryId || ''),
    rating: Number(review.rating || 5),
    title: review.title || '',
    comment: review.comment || '',
    reviewer_name: review.name || '',
    reviewer_email: review.email || '',
    reviewer_phone: review.phone || '',
    status: 'approved',
  };

  try {
    const response = await axios.post('/api/reviews', payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to submit review' };
  } catch (error) {
    console.warn('Trip inquiry review submission unavailable:', error?.message || error);
    return { success: false, message: 'Unable to submit review' };
  }
};

export const customizeBooking = async (payload) => {
  const response = await axios.post('/api/bookings/customize', payload, {
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
);

export const getForexRates = async (filters = {}) => {
  try {
    const response = await axios.get('/api/forex-rates', {
      params: {
        ...cleanParams(filters),
        _t: Date.now(),
      },
      headers: {
        accept: '*/*',
      },
      validateStatus: () => true,
    });

    return response.data || { success: response.status >= 200 && response.status < 300, data: [] };
  } catch (error) {
    console.warn('Forex rates unavailable:', error?.message || error);
    return { success: false, data: [], message: 'Unable to load forex rates.' };
  }
};

export const getForexRateByCode = async (code) => {
  if (!code) {
    return { success: false, data: null, message: 'Currency code is required.' };
  }

  try {
    const response = await axios.get(`/api/forex-rates/${encodeURIComponent(code)}`, {
      params: { _t: Date.now() },
      headers: {
        accept: '*/*',
      },
      validateStatus: () => true,
    });

    return response.data || { success: response.status >= 200 && response.status < 300, data: null };
  } catch (error) {
    console.warn(`Forex rate unavailable for ${code}:`, error?.message || error);
    return { success: false, data: null, message: 'Unable to load forex rate.' };
  }
};

export const convertForexRate = async ({ customerId, fromCurrency, toCurrency, amount } = {}) => {
  if (!customerId) {
    return { success: false, message: 'Please login before creating a forex request.' };
  }

  try {
    const response = await axios.get('/api/forex-rates/convert', {
      params: {
        customer_id: customerId,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount,
        _t: Date.now(),
      },
      headers: {
        accept: '*/*',
      },
      validateStatus: () => true,
    });

    return response.data || { success: response.status >= 200 && response.status < 300, data: null };
  } catch (error) {
    console.warn('Forex conversion unavailable:', error?.message || error);
    return { success: false, data: null, message: 'Unable to create forex conversion request.' };
  }
};

export const getForexServiceCharge = async () => {
  try {
    const response = await axios.get('/api/crm/settings/forex-service-charge', {
      params: { _t: Date.now() },
      headers: {
        accept: '*/*',
      },
      validateStatus: () => true,
    });

    return response.data || { success: response.status >= 200 && response.status < 300, data: null };
  } catch (error) {
    console.warn('Forex service charge unavailable:', error?.message || error);
    return { success: false, data: null, message: 'Unable to load forex service charge.' };
  }
};

export const getHomePage = async () => {
  try {
    const response = await axios.get('/api/pages/slug/home', {
      baseURL: typeof window === 'undefined' ? 'http://localhost:3000' : undefined,
      params: { _t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      validateStatus: () => true,
    });

    if (!response.data?.success && response.status >= 400) {
      console.warn('Home page CMS unavailable:', response.data?.message || `HTTP ${response.status}`);
      return null;
    }

    return normalizeApiData(response);
  } catch (error) {
    console.warn('Home page CMS unavailable:', error?.message || error);
    return null;
  }
};

export const getPageBySlug = async (slug) => {
  try {
    const response = await apiClient.get(`/pages/slug/${slug}`);
    return normalizeApiData(response);
  } catch (error) {
    console.error(`Error fetching page "${slug}":`, error);
    return null;
  }
};

export const getBlogs = async ({ page = 1, limit = 10, slug } = {}) => {
  try {
    const response = await apiClient.get('/blogs', {
      params: {
        page,
        limit,
        ...(slug ? { slug } : {}),
      },
      headers: {
        accept: 'application/json',
      },
    });

    return {
      data: normalizeApiData(response) || [],
      pagination: normalizeApiPagination(response),
    };
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return { data: [], pagination: null };
  }
};

export const getBlogBySlug = async (slug) => {
  const endpoints = [
    `/blogs/${slug}`,
    `/blogs/slug/${slug}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint, {
        headers: {
          accept: 'application/json',
        },
      });
      const data = normalizeApiData(response);
      if (data && !Array.isArray(data)) return data;
      if (Array.isArray(data)) {
        const match = data.find((blog) => blog.slug === slug);
        if (match) return match;
      }
    } catch {
      // Try the next likely backend route shape.
    }
  }

  const blogs = await getBlogs({ page: 1, limit: 100, slug });
  return blogs.data.find((blog) => blog.slug === slug) || null;
};

export const getRelatedBlogs = async (slug, limit = 3) => {
  try {
    const response = await apiClient.get(`/blogs/${slug}/related`, {
      params: { limit },
      headers: {
        accept: 'application/json',
      },
    });

    return normalizeApiData(response) || [];
  } catch (error) {
    console.error(`Error fetching related blogs for "${slug}":`, error);
    return [];
  }
};

export const getHomeCategories = async ({ force = false } = {}) => {
  try {
    const response = await axios.get('/api/home-categories', {
      params: { _t: Date.now() },
      validateStatus: () => true,
    });
    return normalizeApiData(response) || [];
  } catch (error) {
    console.warn('Home categories unavailable:', error?.message || error);
    return [];
  }
};

let homeDestinationsCache = {};

export const getHomeDestinations = async (type) => {
  if (homeDestinationsCache[type]) return homeDestinationsCache[type];

  const endpoint = type === 'visa-free' ? '/destinations/visa-free' : '/destinations/trending';
  const proxyEndpoint = type === 'visa-free' ? '/api/destinations/visa-free' : '/api/destinations/trending';

  try {
    const response = typeof window === 'undefined'
      ? await apiClient.get(endpoint)
      : await axios.get(proxyEndpoint, {
        params: { _t: Date.now() },
        validateStatus: () => true,
      });
    homeDestinationsCache[type] = normalizeApiData(response) || [];
    return homeDestinationsCache[type];
  } catch (error) {
    console.error(`Error fetching ${type} destinations:`, error);
    return [];
  }
};

let relatedDestinationsCache = {};

export const getRelatedDestinationsByCountry = async (slug) => {
  if (!slug) return [];
  if (relatedDestinationsCache[slug]) return relatedDestinationsCache[slug];

  try {
    const response = await apiClient.get(`/destinations/slug/${slug}/related-by-country`, {
      headers: {
        accept: '*/*',
      },
    });

    relatedDestinationsCache[slug] = normalizeApiData(response) || [];
    return relatedDestinationsCache[slug];
  } catch (error) {
    console.error(`Error fetching related destinations for "${slug}":`, error);
    return [];
  }
};

export const getCrowdLevelsBySlug = async (slug, options = {}) => {
  if (!slug) return [];

  try {
    const response = await apiClient.get(`/bookings/crowd-levels/slug/${slug}`, {
      signal: options.signal,
      headers: {
        accept: '*/*',
      },
    });

    return normalizeApiData(response) || [];
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
      throw error;
    }

    console.error(`Error fetching crowd levels for "${slug}":`, error);
    throw error;
  }
};

export const searchAirports = async ({ search = '', lat, lng, page = 1, limit = 20 } = {}) => {
  try {
    const params = {
      page,
      limit,
      ...(search ? { search } : {}),
      ...(lat !== undefined && lat !== null ? { lat } : {}),
      ...(lng !== undefined && lng !== null ? { lng } : {}),
    };

    const response = await axios.get('/api/airports/search', {
      params,
      validateStatus: () => true,
    });
    const rawData = normalizeApiData(response);
    const airports = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.rows) ? rawData.rows : []);
    const pagination = normalizeApiPagination(response) || (
      rawData?.count !== undefined
        ? {
            page,
            limit,
            total: Number(rawData.count) || 0,
            total_pages: Math.ceil((Number(rawData.count) || 0) / limit),
          }
        : null
    );

    return {
      data: airports,
      pagination,
    };
  } catch (error) {
    console.warn('Airport search unavailable:', error?.message || error);
    return { data: [], pagination: null };
  }
};

export const getPackages = async (filters = {}) => {
  try {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    const response = await axios.get('/api/packages', {
      params: { ...params, _t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      validateStatus: () => true,
    });
    return normalizeApiData(response) || [];
  } catch (error) {
    console.error('Error fetching packages:', error);
    return [];
  }
};

export const getPackageFilters = async (filters = {}) => {
  try {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    const response = await axios.get('/api/packages/filters', {
      params: { ...params, _t: Date.now() },
      validateStatus: () => true,
    });

    return normalizeApiData(response);
  } catch (error) {
    console.warn('Package filters unavailable:', error?.message || error);
    return null;
  }
};

export const getPartialBookingSettings = async () => {
  try {
    const response = await axios.get('/api/crm/settings/partial-booking', {
      params: { _t: Date.now() },
      validateStatus: () => true,
    });

    return normalizeApiData(response);
  } catch (error) {
    console.warn('Partial booking settings unavailable:', error?.message || error);
    return null;
  }
};

export const createRazorpayOrder = async (payload) => {
  try {
    const response = await axios.post('/api/payments/razorpay/order', payload, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to create Razorpay order' };
  } catch (error) {
    console.warn('Razorpay order unavailable:', error?.message || error);
    return { success: false, message: 'Unable to create Razorpay order' };
  }
};

export const verifyRazorpayPayment = async (payload) => {
  try {
    const response = await axios.post('/api/payments/razorpay/verify', payload, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to verify payment' };
  } catch (error) {
    console.warn('Razorpay verification unavailable:', error?.message || error);
    return { success: false, message: 'Unable to verify payment' };
  }
};

export const createPackageBooking = async (payload) => {
  const token = getStoredToken();

  if (!token) {
    return { success: false, message: 'Please login before booking this package.' };
  }

  try {
    const response = await axios.post('/api/bookings/create-booking', payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to create package booking' };
  } catch (error) {
    console.warn('Package booking unavailable:', error?.message || error);
    return { success: false, message: 'Unable to create package booking' };
  }
};

export const validateBookingCoupon = async (payload) => {
  try {
    const response = await axios.post('/api/bookings/coupons/validate', payload, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to validate coupon' };
  } catch (error) {
    console.warn('Coupon validation unavailable:', error?.message || error);
    return { success: false, message: 'Unable to validate coupon' };
  }
};

export const getCustomerBookings = async ({ customerId, page = 1, limit = 20, status = '' } = {}) => {
  if (!customerId) {
    return { success: false, message: 'Customer id is required.', data: { rows: [] } };
  }

  try {
    const token = getStoredToken();
    const response = await axios.get(`/api/bookings/customer/${encodeURIComponent(customerId)}`, {
      params: {
        page,
        limit,
        ...(status ? { status } : {}),
      },
      headers: {
        accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to load bookings', data: { rows: [] } };
  } catch (error) {
    console.warn('Customer bookings unavailable:', error?.message || error);
    return { success: false, message: 'Unable to load bookings', data: { rows: [] } };
  }
};

export const getCancellationRules = async () => {
  try {
    const response = await axios.get('/api/bookings/cancellation-rules', {
      headers: { accept: '*/*' },
      params: { _t: Date.now() },
      validateStatus: () => true,
    });

    return response.data || { success: false, data: [], message: 'Unable to load cancellation rules' };
  } catch (error) {
    console.warn('Cancellation rules unavailable:', error?.message || error);
    return { success: false, data: [], message: 'Unable to load cancellation rules' };
  }
};

export const payRemainingPackageBooking = async ({ bookingId, payload }) => {
  if (!bookingId) {
    return { success: false, message: 'Booking id is required.' };
  }

  try {
    const token = getStoredToken();
    const response = await axios.post(`/api/bookings/package/${encodeURIComponent(bookingId)}/pay-remaining`, payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to record remaining payment' };
  } catch (error) {
    console.warn('Remaining payment unavailable:', error?.message || error);
    return { success: false, message: 'Unable to record remaining payment' };
  }
};

export const submitPackageReturnRequest = async ({ bookingId, payload = {} }) => {
  if (!bookingId) {
    return { success: false, message: 'Booking id is required.' };
  }

  try {
    const token = getStoredToken();
    const response = await axios.post(`/api/bookings/package/${encodeURIComponent(bookingId)}/return-request`, payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to submit return request' };
  } catch (error) {
    console.warn('Booking return request unavailable:', error?.message || error);
    return { success: false, message: 'Unable to submit return request' };
  }
};

export const getMyPackageReturnRequests = async () => {
  try {
    const token = getStoredToken();
    const response = await axios.get('/api/bookings/package/return-requests/my', {
      headers: {
        accept: '*/*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      params: { _t: Date.now() },
      validateStatus: () => true,
    });

    return response.data || { success: false, data: { total: 0, rows: [] }, message: 'Unable to load return requests' };
  } catch (error) {
    console.warn('Package return requests unavailable:', error?.message || error);
    return { success: false, data: { total: 0, rows: [] }, message: 'Unable to load return requests' };
  }
};

export const getHotels = async (filters = {}) => {
  try {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    const response = await axios.get('/api/hotels', {
      params: { ...params, _t: Date.now() },
      validateStatus: () => true,
    });
    const data = normalizeApiData(response);

    return {
      rows: Array.isArray(data?.rows) ? data.rows : [],
      count: Number(data?.count) || 0,
      pagination: data?.pagination || null,
    };
  } catch (error) {
    console.warn('Hotels unavailable:', error?.message || error);
    return { rows: [], count: 0, pagination: null };
  }
};

export const searchCountryCityLocations = async ({ search = '', limit = 20 } = {}) => {
  const query = String(search || '').trim();

  if (!query) {
    return { countries: [], cities: [], suggestions: [] };
  }

  try {
    const response = await axios.get('/api/locations/country-city', {
      params: { search: query, limit, _t: Date.now() },
      validateStatus: () => true,
    });
    const data = normalizeApiData(response) || {};
    const countries = Array.isArray(data.countries) ? data.countries : [];
    const cities = Array.isArray(data.cities) ? data.cities : [];
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [...countries, ...cities];

    return { countries, cities, suggestions };
  } catch (error) {
    console.warn('Location suggestions unavailable:', error?.message || error);
    return { countries: [], cities: [], suggestions: [] };
  }
};

export const submitHotelInquiry = async (payload) => {
  try {
    const response = await axios.post('/api/hotel-inquiries', payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to submit hotel booking' };
  } catch (error) {
    console.warn('Hotel booking unavailable:', error?.message || error);
    return { success: false, message: 'Unable to submit hotel booking' };
  }
};

export const getTripInquiries = async ({ page = 1, limit = 20, search = '', status = '' } = {}) => {
  try {
    const params = {
      page,
      limit,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      _t: Date.now(),
    };
    const response = await axios.get('/api/trip-inquiries', {
      params,
      validateStatus: () => true,
    });

    return response.data?.success ? response.data.data : { rows: [] };
  } catch (error) {
    console.warn('Trip inquiries unavailable:', error?.message || error);
    return { rows: [] };
  }
};

export const getTripInquiryById = async (id) => {
  if (!id) return null;

  try {
    const response = await axios.get(`/api/trip-inquiries/${encodeURIComponent(id)}`, {
      params: { _t: Date.now() },
      headers: { accept: '*/*' },
      validateStatus: () => true,
    });

    return normalizeApiData(response);
  } catch (error) {
    console.warn(`Trip inquiry "${id}" unavailable:`, error?.message || error);
    return null;
  }
};

export const submitTripInquiry = async (payload) => {
  try {
    const response = await axios.post('/api/trip-inquiries', payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });

    return response.data || { success: false, message: 'Unable to submit inquiry' };
  } catch (error) {
    console.warn('Trip inquiry submission unavailable:', error?.message || error);
    return { success: false, message: 'Unable to submit inquiry' };
  }
};

export const getCrmPipelineForm = async (pipelineId) => {
  if (!pipelineId) return null;

  try {
    const response = await axios.get(`/api/crm/pipelines/${encodeURIComponent(pipelineId)}/form`, {
      headers: {
        accept: 'application/json',
      },
      params: { _t: Date.now() },
      validateStatus: () => true,
    });

    return normalizeApiData(response);
  } catch (error) {
    console.warn(`CRM pipeline form "${pipelineId}" unavailable:`, error?.message || error);
    return null;
  }
};

export const getPackageBySlug = async (slug) => {
  if (!slug) return null;

  try {
    const response = await axios.get(`/api/packages/${encodeURIComponent(slug)}`, {
      params: { _t: Date.now() },
      headers: {
        accept: '*/*',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      validateStatus: () => true,
    });

    return normalizeApiData(response);
  } catch (error) {
    console.error(`Error fetching package "${slug}":`, error);
    return null;
  }
};

export const getPackagesByDestination = async (slug) => {
  if (destinationsCache[slug]) return destinationsCache[slug];

  try {
    const response = await apiClient.get(`/destinations/slug/${slug}`);
    if (response.data && response.data.success) {
      destinationsCache[slug] = response.data.data;
      return response?.data?.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching destinations for category ${slug}:`, error);
    return [];
  }
};

export default apiClient;
