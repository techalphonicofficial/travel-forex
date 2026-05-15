import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
export const AUTH_STORAGE_KEY = 'wl_auth';
export const TOKEN_STORAGE_KEY = 'wl_token';
export const AUTH_CHANGED_EVENT = 'wl_auth_changed';

const apiClient = axios.create({
  baseURL: BASE_URL,
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
  const isPublicAuthRequest = publicAuthUrls.some((url) => config.url?.startsWith(url));

  if (token && !isPublicAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isPublicAuthRequest) {
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
    const response = await apiClient.get('/categories');
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

export const getDestinationsByCategory = async (categoryId) => {
  if (destinationsCache[categoryId]) return destinationsCache[categoryId];

  try {
    const response = await apiClient.get(`/destinations?category_id=${categoryId}`);
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
