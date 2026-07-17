'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const WISHLIST_STORAGE_KEY = 'travel_holiday_wishlist';

const WishlistContext = createContext(null);

const normalizeWishlistItem = (item = {}) => {
  const type = item.type || 'tour';
  const rawId = item.id || item.slug || item.href || item.title;
  const id = String(rawId || '').trim();

  if (!id) return null;

  return {
    id,
    type,
    title: item.title || item.name || 'Saved trip',
    location: item.location || item.destination || item.country || '',
    image: item.image || item.feature_image || '',
    price: Number(item.price || item.amount || 0),
    href: item.href || item.url || '/tours',
    slug: item.slug || '',
    duration: item.duration || item.nights || '',
    badge: item.badge || item.packageType || item.category || '',
    savedAt: item.savedAt || new Date().toISOString(),
  };
};

const getWishlistKey = (item) => `${item.type}:${item.id}`;

const getWishlistKeyFromInput = (itemOrId, type = 'tour') => {
  if (typeof itemOrId !== 'object') return `${type}:${itemOrId}`;

  const normalized = normalizeWishlistItem(itemOrId);
  return normalized ? getWishlistKey(normalized) : '';
};

const readStoredWishlist = () => {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeWishlistItem).filter(Boolean) : [];
  } catch {
    return [];
  }
};

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const syncWishlist = () => setItems(readStoredWishlist());
    const syncTimer = window.setTimeout(syncWishlist, 0);

    window.addEventListener('storage', syncWishlist);
    window.addEventListener('travel_holiday_wishlist_changed', syncWishlist);

    return () => {
      window.clearTimeout(syncTimer);
      window.removeEventListener('storage', syncWishlist);
      window.removeEventListener('travel_holiday_wishlist_changed', syncWishlist);
    };
  }, []);

  const persistItems = useCallback((nextItems) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(nextItems));
    window.dispatchEvent(new Event('travel_holiday_wishlist_changed'));
  }, []);

  const addToWishlist = useCallback((item) => {
    const normalized = normalizeWishlistItem(item);
    if (!normalized) return;

    setItems((current) => {
      const next = [
        normalized,
        ...current.filter((entry) => getWishlistKey(entry) !== getWishlistKey(normalized)),
      ];
      persistItems(next);
      return next;
    });
  }, [persistItems]);

  const removeFromWishlist = useCallback((itemOrId, type = 'tour') => {
    const key = getWishlistKeyFromInput(itemOrId, type);
    if (!key) return;

    setItems((current) => {
      const next = current.filter((item) => getWishlistKey(item) !== key);
      persistItems(next);
      return next;
    });
  }, [persistItems]);

  const toggleWishlist = useCallback((item) => {
    const normalized = normalizeWishlistItem(item);
    if (!normalized) return false;

    const key = getWishlistKey(normalized);
    let added = false;

    setItems((current) => {
      const exists = current.some((entry) => getWishlistKey(entry) === key);
      const next = exists
        ? current.filter((entry) => getWishlistKey(entry) !== key)
        : [normalized, ...current];

      added = !exists;
      persistItems(next);
      return next;
    });

    return added;
  }, [persistItems]);

  const clearWishlist = useCallback(() => {
    setItems([]);
    persistItems([]);
  }, [persistItems]);

  const isWishlisted = useCallback((itemOrId, type = 'tour') => {
    const key = getWishlistKeyFromInput(itemOrId, type);
    if (!key) return false;

    return items.some((item) => getWishlistKey(item) === key);
  }, [items]);

  const value = useMemo(() => ({
    items,
    count: items.length,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    isWishlisted,
  }), [addToWishlist, clearWishlist, isWishlisted, items, removeFromWishlist, toggleWishlist]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error('useWishlist must be used inside WishlistProvider');
  }

  return context;
};
