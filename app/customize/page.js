'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DestinationPicker from '@/components/DestinationPicker';
import { customizeBooking, getCrowdLevelsBySlug, getDestinations, getHomeCategories, getMediaUrl, getRelatedDestinationsByCountry, getStoredAuth, searchAirports } from '@/utils/api';
import { getProjectConfig } from '@/utils/projectConfig';

const TRAVELLERS = [
  { name: 'Couple', img: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&q=80' },
  { name: 'Family', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80' },
  { name: 'Friends', img: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=400&q=80' },
  { name: 'Solo', img: 'https://images.unsplash.com/photo-1506869640319-fea1a2753689?w=400&q=80' },
  { name: 'Senior citizen', img: 'https://images.unsplash.com/photo-1518155317743-a8ff43ca6f5f?w=400&q=80' }
];

const getFallbackTravellerImage = (name) => {
  const match = TRAVELLERS.find((item) => item.name.toLowerCase() === String(name || '').toLowerCase());
  return match?.img || TRAVELLERS[0].img;
};

const getLogoUrl = (logo) => {
  if (!logo) return '';
  if (/^(https?:|data:|blob:)/i.test(logo)) return logo;
  if (!String(logo).startsWith('/uploads')) return logo;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_IMAGE_URL || 'https://tourtravel.yber.in';
  return `${baseUrl.replace(/\/$/, '')}/${String(logo).replace(/^\//, '')}`;
};

const DURATIONS = ['3-4 Days', '5-6 Days', '7-8 Days', '9-15 Days'];
const AIRPORTS_PAGE_LIMIT = 20;

const INITIAL_CUSTOMIZE_DATA = {
  destination: '',
  travelWith: '',
  rooms: [{ id: 1, adults: 2, children: 0, childAges: [] }],
  duration: '',
  departureCity: '',
  departureDate: '',
  cities: []
};

const CUSTOMIZE_PAYLOAD_KEY = 'customize_itinerary_payload';
const CONFIRMED_CUSTOMIZE_PAYLOAD_KEY = 'confirmed_itinerary_payload';

const readStoredCustomizePayload = () => {
  if (typeof window === 'undefined') return null;

  const stored =
    sessionStorage.getItem(CUSTOMIZE_PAYLOAD_KEY) ||
    localStorage.getItem(CUSTOMIZE_PAYLOAD_KEY);

  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const writeStoredCustomizePayload = (key, payload) => {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(payload);

  sessionStorage.setItem(key, serialized);
  localStorage.setItem(key, serialized);
};

const getTotalTravellers = (rooms = []) =>
  rooms.reduce((acc, room) => acc + (Number(room.adults) || 0) + (Number(room.children) || 0), 0);

const normalizeDraftData = (draftData) => ({
  ...INITIAL_CUSTOMIZE_DATA,
  ...(draftData && typeof draftData === 'object' ? draftData : {}),
  rooms: Array.isArray(draftData?.rooms) && draftData.rooms.length ? draftData.rooms : INITIAL_CUSTOMIZE_DATA.rooms,
  cities: Array.isArray(draftData?.cities) ? draftData.cities : [],
});

const CUSTOMIZE_URL_KEYS = [
  'step',
  'subStep',
  'dest',
  'traveller',
  'duration',
  'departureCity',
  'departureDate',
  'rooms',
  'cities',
];

const parseJsonParam = (value, fallback) => {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};




const getUrlStep = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? Math.min(Math.max(parsed, 0), 5) : 0;
};

const formatDestinationParam = (value) => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const createDestinationSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const createDateKey = (year, monthIndex, day) =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getMonthStart = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);

const formatAirportOption = (airport) => {
  const city = airport?.municipality || airport?.name || 'Airport';
  const code = airport?.iata_code || airport?.gps_code || airport?.ident || '';
  return code ? `${city}, ${code}` : city;
};

const hasMoreAirportPages = (result, page, limit) => {
  const pagination = result?.pagination;

  if (pagination) {
    if (typeof pagination.has_next_page === 'boolean') return pagination.has_next_page;
    if (typeof pagination.hasNextPage === 'boolean') return pagination.hasNextPage;
    if (pagination.total_pages) return page < Number(pagination.total_pages);
    if (pagination.totalPages) return page < Number(pagination.totalPages);
    if (pagination.total && pagination.limit) return page * Number(pagination.limit) < Number(pagination.total);
  }

  return (result?.data || []).length >= limit;
};




const normalizeRelatedDestination = (destination) => ({
  id: destination.id || destination.slug || destination.name,
  name: destination.name || destination.title || 'Destination',
  subtitle: destination.title || destination.country || destination.state || 'Recommended destination',
  type: destination.type || destination.tax_rule_type || 'DESTINATION',
  country: destination.country || '',
  state: destination.state || '',
  tags: Array.isArray(destination.tags) ? destination.tags : [],
  img: getMediaUrl(destination.feature_image),
  alt: destination.feature_image_alt || destination.name || destination.title || 'Destination',
  raw: destination,
});

const normalizePickerDestination = (destination) => ({
  id: destination.id || destination.slug || destination.name,
  name: destination.name || destination.title || 'Destination',
  subtitle: destination.title || destination.country || destination.state || destination.type || 'Explore holiday packages',
  type: destination.type || '',
  slug: destination.slug || createDestinationSlug(destination.name || destination.title),
  categories: Array.isArray(destination.categories) ? destination.categories : [],
  image: getMediaUrl(destination.feature_image || destination.image || destination.image_url || destination.thumbnail),
  alt: destination.feature_image_alt || destination.alt_text || destination.name || destination.title || 'Destination',
  raw: destination,
});

const readCustomizeUrlDraft = () => {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const hasCustomizeParams = CUSTOMIZE_URL_KEYS.some((key) => params.has(key));
  if (!hasCustomizeParams) return null;

  const data = normalizeDraftData({
    destination: formatDestinationParam(params.get('dest') || params.get('destination') || ''),
    travelWith: params.get('traveller') || '',
    duration: params.get('duration') || '',
    departureCity: params.get('departureCity') || '',
    departureDate: params.get('departureDate') || '',
    rooms: parseJsonParam(params.get('rooms'), INITIAL_CUSTOMIZE_DATA.rooms),
    cities: parseJsonParam(params.get('cities'), []),
  });

  return {
    data,
    step: getUrlStep(params.get('step')),
    subStep: params.get('subStep') || '',
  };
};

const writeCustomizeUrlDraft = ({ data, step, subStep }) => {
  if (typeof window === 'undefined') return;

  const normalizedData = normalizeDraftData(data);
  const params = new URLSearchParams(window.location.search);

  CUSTOMIZE_URL_KEYS.forEach((key) => params.delete(key));

  params.set('step', String(step));
  if (subStep) params.set('subStep', subStep);
  if (normalizedData.destination) params.set('dest', normalizedData.destination);
  if (normalizedData.travelWith) params.set('traveller', normalizedData.travelWith);
  if (normalizedData.duration) params.set('duration', normalizedData.duration);
  if (normalizedData.departureCity) params.set('departureCity', normalizedData.departureCity);
  if (normalizedData.departureDate) params.set('departureDate', normalizedData.departureDate);
  if (normalizedData.rooms.length) params.set('rooms', JSON.stringify(normalizedData.rooms));
  if (normalizedData.cities.length) params.set('cities', JSON.stringify(normalizedData.cities));

  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;

  if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(null, '', nextUrl);
  }
};

export default function CustomizeFlow() {
  const router = useRouter();
  const brand = getProjectConfig();
  const [companyInfo, setCompanyInfo] = useState(null);
  const brandLogo = getLogoUrl(companyInfo?.logo || companyInfo?.company_logo_url);
  const brandName = companyInfo?.legalName || companyInfo?.companyName || companyInfo?.brandName || brand.legalName;
  const [step, setStep] = useState(0);
  const [subStep, setSubStep] = useState(''); // 'room-config', 'login-modal'
  const [calendarBaseDate, setCalendarBaseDate] = useState(() => getMonthStart());
  const [travellerOptions, setTravellerOptions] = useState(TRAVELLERS);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [destinationsError, setDestinationsError] = useState('');
  const [relatedCities, setRelatedCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState('');
  const [departureSearch, setDepartureSearch] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [airportOptions, setAirportOptions] = useState([]);
  const [airportPage, setAirportPage] = useState(1);
  const [airportsHasMore, setAirportsHasMore] = useState(false);
  const [airportNearbyCoords, setAirportNearbyCoords] = useState(null);
  const [airportsLoading, setAirportsLoading] = useState(false);
  const [airportsLoadingMore, setAirportsLoadingMore] = useState(false);
  const [airportsError, setAirportsError] = useState('');
  const [crowdLevels, setCrowdLevels] = useState({});
  const [crowdLoading, setCrowdLoading] = useState(false);
  const [crowdError, setCrowdError] = useState('');

  const [data, setData] = useState(INITIAL_CUSTOMIZE_DATA);
  const [urlReady, setUrlReady] = useState(false);
  const [itineraryPayload, setItineraryPayload] = useState(null);
  const [confirmedItineraryPayload, setConfirmedItineraryPayload] = useState(null);
  const [itinerarySubmitState, setItinerarySubmitState] = useState('idle');
  const [itinerarySubmitResponse, setItinerarySubmitResponse] = useState(null);
  const [itinerarySubmitError, setItinerarySubmitError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadDestinations = async () => {
      setDestinationsLoading(true);
      setDestinationsError('');

      const destinations = await getDestinations();
      console.log('Destinations API response:', destinations);

      if (!mounted) return;

      if (destinations.length) {
        setDestinationOptions(destinations.map(normalizePickerDestination));
      } else {
        setDestinationOptions([]);
        setDestinationsError('No destinations are available right now.');
      }

      setDestinationsLoading(false);
    };

    const loadTravellerOptions = async () => {
      const categories = await getHomeCategories();
      if (!mounted || !categories?.length) return;

      setTravellerOptions(
        categories
          .slice()
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((category) => ({
            id: category.id || category.slug || category.name,
            name: category.name,
            img: getMediaUrl(category.feature_image) || getFallbackTravellerImage(category.name),
            alt: category.feature_image_alt || category.name,
            slug: category.slug,
            category,
          }))
      );
    };

    const loadCompanyInfo = async () => {
      try {
        const response = await fetch('/api/company-info', {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        const payload = await response.json();

        if (mounted && payload?.success) {
          setCompanyInfo(payload.data);
        }
      } catch (error) {
        console.warn('Company info unavailable:', error);
      }
    };

    loadDestinations();
    loadTravellerOptions();
    loadCompanyInfo();

    return () => {
      mounted = false;
    };
  }, []);

  // Load the draft from URL params so the flow can be shared or restored without localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const frame = requestAnimationFrame(() => {
      const urlDraft = readCustomizeUrlDraft();

      if (!urlDraft) {
        setUrlReady(true);
        return;
      }

      const nextData = normalizeDraftData(urlDraft.data);
      let nextStep = urlDraft.step || (nextData.destination ? 1 : 0);
      let nextSubStep = urlDraft.subStep || '';

      if (nextData.destination && nextData.travelWith && !urlDraft.step) {
        if (nextData.travelWith === 'Couple') {
          nextData.rooms = [{ id: 1, adults: 2, children: 0, childAges: [] }];
          nextStep = 2;
        } else if (nextData.travelWith === 'Solo') {
          nextData.rooms = [{ id: 1, adults: 1, children: 0, childAges: [] }];
          nextStep = 2;
        } else {
          nextStep = 1;
          nextSubStep = 'room-config';
        }
      }

      setData(nextData);
      setStep(nextStep);
      setSubStep(nextSubStep);
      setUrlReady(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    writeCustomizeUrlDraft({ data, step, subStep });
  }, [data, step, subStep, urlReady]);

  useEffect(() => {
    if (itinerarySubmitState !== 'success') return undefined;

    const redirectTimer = window.setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => window.clearTimeout(redirectTimer);
  }, [itinerarySubmitState, router]);

  useEffect(() => {
    const destinationSlug = createDestinationSlug(data.destination);

    if (!destinationSlug) {
      return undefined;
    }

    let mounted = true;

    const loadRelatedCities = async () => {
      setCitiesLoading(true);
      setCitiesError('');

      const destinations = await getRelatedDestinationsByCountry(destinationSlug);

      if (!mounted) return;

      if (destinations.length) {
        setRelatedCities(destinations.map(normalizeRelatedDestination));
      } else {
        setRelatedCities([]);
        setCitiesError('Related destinations are not available right now.');
      }

      setCitiesLoading(false);
    };

    loadRelatedCities();

    return () => {
      mounted = false;
    };
  }, [data.destination]);

  useEffect(() => {
    let mounted = true;
    const searchTerm = departureSearch.trim();
    const nearbyCoords = airportNearbyCoords;

    const timer = setTimeout(async () => {
      setAirportsLoading(true);
      setAirportsLoadingMore(false);
      setAirportsError('');
      setAirportPage(1);

      const result = await searchAirports({
        search: searchTerm,
        lat: nearbyCoords?.lat,
        lng: nearbyCoords?.lng,
        page: 1,
        limit: AIRPORTS_PAGE_LIMIT,
      });

      if (!mounted) return;

      setAirportOptions(result.data);
      setAirportsHasMore(hasMoreAirportPages(result, 1, AIRPORTS_PAGE_LIMIT));
      setAirportsError(result.data.length ? '' : 'No matching airports found.');
      if (nearbyCoords) {
        setLocationStatus(result.data.length ? 'Nearby airports loaded.' : 'No nearby airports found.');
      }
      setAirportsLoading(false);
    }, searchTerm ? 300 : (nearbyCoords ? 0 : 0));

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [departureSearch, airportNearbyCoords]);

  useEffect(() => {
    const destinationSlug = createDestinationSlug(data.destination);

    if (!destinationSlug) {
      setCrowdLevels({});
      setCrowdLoading(false);
      setCrowdError('');
      return undefined;
    }

    const controller = new AbortController();
    let mounted = true;

    const loadCrowdLevels = async () => {
      setCrowdLoading(true);
      setCrowdError('');

      try {
        const levels = await getCrowdLevelsBySlug(destinationSlug, { signal: controller.signal });

        if (!mounted) return;

        setCrowdLevels(
          levels.reduce((acc, item) => {
            if (item?.date && item?.crowd_level) {
              acc[item.date] = String(item.crowd_level).toLowerCase();
            }
            return acc;
          }, {})
        );
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
        if (mounted) {
          setCrowdLevels({});
          setCrowdError('Crowd levels are not available right now.');
        }
      } finally {
        if (mounted) {
          setCrowdLoading(false);
        }
      }
    };

    loadCrowdLevels(); 

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [data.destination]);

  // Navigation Handlers
  const goNext = (overrideStep = null) => setStep(prev => overrideStep !== null ? overrideStep : prev + 1);

  const handleDestination = (dest) => {
    setData(d => {
      const updated = { ...d, destination: dest, cities: [] };
      if (updated.travelWith) {
        if (subStep === 'room-config') {
          setStep(1);
          setSubStep('room-config');
        } else if (updated.travelWith === 'Couple') {
          updated.rooms = [{ id: 1, adults: 2, children: 0, childAges: [] }];
          setStep(2);
        } else if (updated.travelWith === 'Solo') {
          updated.rooms = [{ id: 1, adults: 1, children: 0, childAges: [] }];
          setStep(2);
        } else {
          setStep(1);
          setSubStep('room-config');
        }
      } else {
        setStep(1);
      }
      return updated;
    });
  };

  const handleTravellerType = (type) => {
    setData(d => ({ ...d, travelWith: type }));
    if (type === 'Couple') {
      setData(d => ({ ...d, rooms: [{ id: 1, adults: 2, children: 0, childAges: [] }] }));
      goNext();
    } else if (type === 'Solo') {
      setData(d => ({ ...d, rooms: [{ id: 1, adults: 1, children: 0, childAges: [] }] }));
      goNext();
    } else {
      setSubStep('room-config');
    }
  };

  const updateRoom = (roomId, field, val) => {
    setData(d => {
      const newRooms = d.rooms.map(r => {
        if (r.id === roomId) {
          const updated = { ...r, [field]: val };
          if (field === 'children') {
            const currentAges = updated.childAges || [];
            updated.childAges = Array(val).fill(3).map((_, i) => currentAges[i] || 3);
          }
          return updated;
        }
        return r;
      });
      return { ...d, rooms: newRooms };
    });
  };

  const removeRoom = (roomId) => {
    setData(d => {
      if (d.rooms.length <= 1) return d;
      const newRooms = d.rooms.filter(r => r.id !== roomId);
      return { ...d, rooms: newRooms };
    });
  };

  const handleRoomConfigSave = () => { setSubStep(''); goNext(); };
  const handleDuration = (dur) => { setData(d => ({ ...d, duration: dur })); goNext(); };
  const handleCity = (city) => { setData(d => ({ ...d, departureCity: city })); goNext(); };
  const handleDate = (date) => { setData(d => ({ ...d, departureDate: date })); goNext(); };

  const loadMoreAirports = async () => {
    if (airportsLoading || airportsLoadingMore || !airportsHasMore) return;

    const nextPage = airportPage + 1;
    const searchTerm = departureSearch.trim();

    setAirportsLoadingMore(true);
    setAirportsError('');

    const result = await searchAirports({
      search: searchTerm,
      lat: airportNearbyCoords?.lat,
      lng: airportNearbyCoords?.lng,
      page: nextPage,
      limit: AIRPORTS_PAGE_LIMIT,
    });

    setAirportOptions(prev => [...prev, ...result.data]);
    setAirportPage(nextPage);
    setAirportsHasMore(hasMoreAirportPages(result, nextPage, AIRPORTS_PAGE_LIMIT));
    setAirportsError(result.data.length ? '' : 'No more airports found.');
    setAirportsLoadingMore(false);
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('Location is not supported by this browser.');
      return;
    }

    setLocationStatus('Requesting location permission...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLocation = `Current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        console.log('Current location data:', {
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          departureCity: currentLocation,
        });
        setLocationStatus('Location detected. Finding nearby airports...');
        setDepartureSearch('');
        setAirportNearbyCoords({ lat: latitude, lng: longitude });
      },
      (error) => {
        const messages = {
          [error.PERMISSION_DENIED]: 'Location permission was denied.',
          [error.POSITION_UNAVAILABLE]: 'Unable to detect your current location.',
          [error.TIMEOUT]: 'Location request timed out. Please try again.',
        };

        setLocationStatus(messages[error.code] || 'Unable to access your location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleCityToggle = (cityName) => {
    setData(d => {
      const exists = d.cities.includes(cityName);
      const newCities = exists ? d.cities.filter(c => c !== cityName) : [...d.cities, cityName];
      return { ...d, cities: newCities };
    });
  };

  const buildItineraryPayload = () => {
    const auth = getStoredAuth();
    const selectedCityDetails = data.cities.map((cityName) => {
      const city = getCityByName(cityName);

      return {
        name: cityName,
        id: city?.id || null,
        country: city?.country || '',
        state: city?.state || '',
        type: city?.type || '',
        tags: city?.tags || [],
      };
    });

    return {
      customer: {
        id: auth?.id || auth?.customer_id || auth?.user_id || null,
        name: auth?.name || '',
        email: auth?.email || '',
        phone: auth?.phone || '',
      },
      trip: {
        destination: data.destination,
        destination_slug: createDestinationSlug(data.destination),
        travel_with: data.travelWith,
        duration: data.duration,
        departure_city: data.departureCity,
        departure_date: data.departureDate,
        total_travellers: getTotalTravellers(data.rooms),
        rooms: data.rooms.map((room) => ({
          adults: Number(room.adults) || 0,
          children: Number(room.children) || 0,
          child_ages: room.childAges || [],
        })),
        cities: selectedCityDetails,
      },
      source: 'customize_flow',
      created_at: new Date().toISOString(),
    };
  };

  const handleBuildItinerary = () => {
    const auth = getStoredAuth();

    if (!auth?.token) {
      const returnUrl = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/customize';
      router.push(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    const payload = buildItineraryPayload();
    setItineraryPayload(payload);
    setItinerarySubmitState('idle');
    setItinerarySubmitResponse(null);
    setItinerarySubmitError('');
    console.log('Build itinerary payload:', payload);

    if (typeof window !== 'undefined') {
      writeStoredCustomizePayload(CUSTOMIZE_PAYLOAD_KEY, payload);
    }

    setSubStep('login-modal');
  };

  const handleConfirmItinerary = async () => {
    const payload = itineraryPayload || readStoredCustomizePayload() || buildItineraryPayload();

    setConfirmedItineraryPayload(payload);
    setItineraryPayload(payload);
    setItinerarySubmitState('submitting');
    setItinerarySubmitResponse(null);
    setItinerarySubmitError('');
    console.log('Confirmed itinerary payload:', payload);

    if (typeof window !== 'undefined') {
      writeStoredCustomizePayload(CUSTOMIZE_PAYLOAD_KEY, payload);
      writeStoredCustomizePayload(CONFIRMED_CUSTOMIZE_PAYLOAD_KEY, payload);
    }

    try {
      const response = await customizeBooking(payload);
      setItinerarySubmitResponse(response);
      setItinerarySubmitState('success');
    } catch (error) {
      setItinerarySubmitError(
        error?.response?.data?.message ||
        error?.message ||
        'Unable to save your customized itinerary. Please try again.'
      );
      setItinerarySubmitResponse(error?.response?.data || null);
      setItinerarySubmitState('error');
    }
  };

  // 1-Based Breadcrumbs
  const BREADCRUMBS = [
    { label: data.destination || 'Destination', active: step === 0 },
    { label: data.travelWith ? `${data.travelWith} (${data.rooms.reduce((acc, r) => acc + r.adults + r.children, 0)} Pax, ${data.rooms.length} Room)` : 'Travellers', active: step === 1 },
    { label: data.duration || 'Duration', active: step === 2 },
    { label: data.departureCity ? data.departureCity.split(',')[0] : 'Departure City', active: step === 3 },
    { label: data.departureDate || 'Departure Date', active: step === 4 },
    { label: data.cities.length ? `${data.cities.length} Citys` : 'Cities', active: step === 5 },
  ];

  /* ─────────────────────────────────────────────────────────────────
     Step 1: Destination
  ───────────────────────────────────────────────────────────────── */
  const renderDestination = () => (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <DestinationPicker
        destinations={destinationOptions}
        error={destinationsError}
        loading={destinationsLoading}
        onPick={handleDestination}
      />
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     Step 2: Travellers & Room Config
  ───────────────────────────────────────────────────────────────── */
  const renderTravellers = () => {
    if (subStep === 'room-config') {
      return (
        <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 40, fontFamily: 'Poppins, sans-serif' }}>Select your rooms</h2>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {data.rooms.map((r, index) => (
              <div key={r.id} style={{ border: '1px solid #fef08a', borderRadius: 12, padding: 24, background: '#fefce8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: 0, letterSpacing: 1 }}>ROOM {index + 1}</p>
                  {index > 0 && (
                    <button onClick={() => removeRoom(r.id)} style={{ border: 'none', background: 'transparent', color: '#e11d48', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>REMOVE</button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>Adults</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => updateRoom(r.id, 'adults', Math.max(1, r.adults - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 18 }}>-</button>
                    <span style={{ fontSize: 16, fontWeight: 600, width: 20, textAlign: 'center' }}>{r.adults}</span>
                    <button onClick={() => updateRoom(r.id, 'adults', r.adults + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 18 }}>+</button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', display: 'block' }}>Children</span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>0 to 15 yrs</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => updateRoom(r.id, 'children', Math.max(0, r.children - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 18 }}>-</button>
                    <span style={{ fontSize: 16, fontWeight: 600, width: 20, textAlign: 'center' }}>{r.children}</span>
                    <button onClick={() => updateRoom(r.id, 'children', r.children + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 18 }}>+</button>
                  </div>
                </div>

                {r.children > 0 && r.childAges.map((age, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px dashed #d1d5db' }}>
                    <span style={{ fontSize: 14, color: '#4b5563' }}>Age of Child {i + 1}</span>
                    <select value={age} onChange={(e) => {
                      const newAges = [...r.childAges]; newAges[i] = parseInt(e.target.value); updateRoom(r.id, 'childAges', newAges);
                    }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', outline: 'none' }}>
                      {[...Array(16)].map((_, idx) => <option key={idx} value={idx}>{idx} {idx <= 1 ? 'Year' : 'Years'}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <button onClick={() => setData(d => ({ ...d, rooms: [...d.rooms, { id: Date.now(), adults: 2, children: 0, childAges: [] }] }))}
                style={{ flex: 1, padding: 16, borderRadius: 8, border: '1px solid var(--color-primary)', background: '#ecfdf5', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer' }}>+ Add new room</button>
              <button onClick={handleRoomConfigSave} style={{ flex: 1, padding: 16, borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Save & Proceed</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="cust-step-panel">
        <h2 className="cust-step-title">Who are you travelling with?</h2>
        <div className="cust-traveller-grid">
          {travellerOptions.map(t => (
            <button key={t.id || t.name} type="button" onClick={() => handleTravellerType(t.name)} className="cust-traveller-card">
              <div className="cust-traveller-image">
                <img src={t.img} alt={t.alt || t.name} />
              </div>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────────
     Step 3: Duration
  ───────────────────────────────────────────────────────────────── */
  const renderDuration = () => (
    <div style={{ textAlign: 'center', maxWidth: 800, margin: '40px auto', animation: 'fadeIn 0.3s' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 40px', fontFamily: 'Poppins, sans-serif' }}>What&apos;s the duration of your holiday?</h2>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        {DURATIONS.map((dur, i) => (
          <div key={dur} onClick={() => handleDuration(dur)}
            style={{ width: 140, padding: 30, borderRadius: '70px 70px 20px 20px', border: '1px solid #e5e7eb', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', cursor: 'pointer', position: 'relative', height: 180, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ position: 'absolute', top: 50, fontSize: 40 }}>🧳</div>
            {i === 1 && <div style={{ position: 'absolute', top: -12, background: 'var(--color-primary)', color: 'white', fontSize: 10, padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>OUR PICK</div>}
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1f2937' }}>{dur}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     Step 4: Departure City
  ───────────────────────────────────────────────────────────────── */
  const renderDepartureCity = () => (
    <div style={{ maxWidth: 600, margin: '40px auto', animation: 'fadeIn 0.3s' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 30px', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>Where are you travelling from?</h2>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search"
          value={departureSearch}
          onChange={(event) => {
            setDepartureSearch(event.target.value);
            setAirportNearbyCoords(null);
            setLocationStatus('');
          }}
          style={{ width: '100%', padding: '16px 58px 16px 48px', borderRadius: 12, border: '2px solid var(--color-secondary)', fontSize: 16, outline: 'none' }}
        />
        <svg style={{ position: 'absolute', left: 16, top: 18, color: '#9ca3af' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          aria-label="Use current location"
          title="Use current location"
          style={{
            position: 'absolute',
            right: 10,
            top: 9,
            width: 40,
            height: 40,
            borderRadius: 10,
            border: 'none',
            background: 'var(--color-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 18px color-mix(in srgb, var(--color-primary) 24%, transparent)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-4.35 7-11a7 7 0 0 0-14 0c0 6.65 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </button>
      </div>
      {locationStatus && (
        <p style={{ margin: '-10px 0 18px', color: locationStatus.includes('denied') || locationStatus.includes('Unable') || locationStatus.includes('not supported') ? '#b91c1c' : '#047857', fontSize: 13, fontWeight: 600 }}>
          {locationStatus}
        </p>
      )}
      <div style={{ background: 'white', borderTop: '1px solid #e5e7eb', maxHeight: 420, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        {airportsLoading && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', fontSize: 14, color: '#6b7280', fontWeight: 600 }}>
            Loading airports...
          </div>
        )}
        {!airportsLoading && airportOptions.map((airport) => {
          const city = formatAirportOption(airport);
          return (
            <div key={airport.id || airport.ident || city} onClick={() => handleCity(city)}
            style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 500, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div>{city}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
                {airport.name}{airport.type ? ` · ${airport.type.replace(/_/g, ' ')}` : ''}
              </div>
            </div>
          );
        })}
        {!airportsLoading && !airportOptions.length && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
            {airportsError || 'No airports found.'}
          </div>
        )}
        {!airportsLoading && airportOptions.length > 0 && airportsHasMore && (
          <div style={{ padding: 16, borderBottom: '1px solid #f3f4f6', background: 'white' }}>
            <button
              type="button"
              onClick={loadMoreAirports}
              disabled={airportsLoadingMore}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--color-primary)',
                background: airportsLoadingMore ? '#f3f4f6' : '#ecfdf5',
                color: airportsLoadingMore ? '#9ca3af' : 'var(--color-primary)',
                fontSize: 14,
                fontWeight: 700,
                cursor: airportsLoadingMore ? 'not-allowed' : 'pointer',
              }}
            >
              {airportsLoadingMore ? 'Loading more airports...' : 'Load more airports'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     Step 5: Departure Date (Triple Calendar View)
  ───────────────────────────────────────────────────────────────── */
  const renderDepartureDate = () => {
    const today = getTodayStart();
    const currentMonthStart = getMonthStart(today);
    const isPreviousDisabled = getMonthStart(calendarBaseDate).getTime() <= currentMonthStart.getTime();

    const changeMonth = (dir) => {
      setCalendarBaseDate(prev => {
        const baseMonth = getMonthStart(prev);

        if (dir < 0 && baseMonth.getTime() <= currentMonthStart.getTime()) {
          return baseMonth;
        }

        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + dir);
        const nextMonth = getMonthStart(newDate);

        return nextMonth.getTime() < currentMonthStart.getTime() ? currentMonthStart : nextMonth;
      });
    };

    const renderMonth = (dateObj) => {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthStr = monthNames[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      const monthIndex = dateObj.getMonth();

      const startDay = new Date(year, monthIndex, 1).getDay();
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const blanks = Array.from({ length: startDay }, (_, i) => i);
      const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      return (
        <div className="departure-month" style={{ flex: 1, minWidth: 260 }}>
          <h4 style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, margin: '0 0 20px' }}>
            {monthStr} <span style={{ color: '#6b7280', fontWeight: 400 }}>· {year}</span>
          </h4>

          <div className="departure-weekdays" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 12, textAlign: 'center' }}>
            {days.map(d => <div className="departure-weekday" key={d} style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{d}</div>)}
          </div>
          <div className="departure-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 4px', textAlign: 'center' }}>
            {blanks.map(b => <div className="departure-blank-day" key={`blank-${b}`} />)}
            {dates.map(date => {
              const calendarDate = new Date(year, monthIndex, date);
              const isPastDate = calendarDate.getTime() < today.getTime();
              const dateKey = createDateKey(year, monthIndex, date);
              const crowdLevel = crowdLevels[dateKey];
              const isLowCrowd = crowdLevel === 'low';
              const isHighCrowd = crowdLevel === 'high';
              const hasCrowdLevel = !isPastDate && (isLowCrowd || isHighCrowd);
              const borderCol = isPastDate ? 'transparent' : (isLowCrowd ? 'var(--color-primary)' : (isHighCrowd ? '#f59e0b' : 'transparent'));
              const textCol = isPastDate ? '#d1d5db' : (hasCrowdLevel ? '#111827' : '#6b7280');
              return (
                <div className="departure-day-cell" key={date} onClick={() => { if (!isPastDate) handleDate(`${monthStr} ${date}, ${year}`); }}
                  title={isPastDate ? 'Past dates are unavailable' : (hasCrowdLevel ? `${crowdLevel.charAt(0).toUpperCase() + crowdLevel.slice(1)} crowd` : undefined)}
                  style={{
                    height: 32, width: 32, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', cursor: isPastDate ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: textCol,
                    border: `1.5px solid ${borderCol}`,
                    background: isPastDate ? '#f9fafb' : (isLowCrowd ? '#ecfdf5' : (isHighCrowd ? '#fffbeb' : 'transparent')),
                    opacity: isPastDate ? 0.65 : 1,
                    transition: 'all 0.2s'
                  }}>
                  {date}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const months = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(calendarBaseDate);
      d.setMonth(d.getMonth() + i);
      months.push(d);
    }
    const hasCrowdLevels = Object.keys(crowdLevels).length > 0;

    return (
      <div className="departure-calendar-step" style={{ maxWidth: 1000, margin: '40px auto', animation: 'fadeIn 0.3s' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 30px', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>When is your departure date?</h2>

        <div className="departure-calendar-card" style={{ background: 'white', padding: '32px 40px', borderRadius: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative' }}>
          {/* Navigation Arrows */}
          <div
            onClick={() => { if (!isPreviousDisabled) changeMonth(-1); }}
            aria-disabled={isPreviousDisabled}
            title={isPreviousDisabled ? 'Earlier months are unavailable' : 'Previous month'}
            style={{ position: 'absolute', left: 24, top: 32, width: 28, height: 28, borderRadius: '50%', background: '#ecfdf5', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', zIndex: 10 }}>❮</div>
          <div
            onClick={() => changeMonth(1)}
            style={{ position: 'absolute', right: 24, top: 32, width: 28, height: 28, borderRadius: '50%', background: '#ecfdf5', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', zIndex: 10 }}>❯</div>

          <div className="departure-months-wrap" style={{ display: 'flex', gap: 40, justifyContent: 'space-between', padding: '0 20px' }}>
            {months.map((m, idx) => (
              <div className="departure-month-wrap" key={idx} style={{ flex: 1 }}>
                {renderMonth(m)}
              </div>
            ))}
          </div>

          {/* {(crowdLoading || crowdError || data.destination) && (
            <p style={{ margin: '28px 0 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: crowdError ? '#b91c1c' : '#6b7280' }}>
              {crowdLoading
                ? `Loading crowd levels for ${data.destination}...`
                : (crowdError || (hasCrowdLevels
                  ? `Showing crowd levels for ${data.destination}.`
                  : `No crowd levels found for ${data.destination} yet.`))}
            </p>
          )} */}

          <div className="departure-crowd-legend" style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--color-primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Low crowd</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #f59e0b' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>High Crowd</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────────
     Step 6: Cities Grid 
  ───────────────────────────────────────────────────────────────── */
  const activeCities = data.destination ? relatedCities : [];

  const getCityImage = (cityName) =>
    activeCities.find(c => c.name === cityName)?.img || '';

  const getCityByName = (cityName) =>
    activeCities.find(c => c.name === cityName) || null;

  const renderCities = () => (
    <div style={{ maxWidth: 1100, margin: '40px auto', textAlign: 'center', animation: 'fadeIn 0.3s', paddingBottom: 100 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 10px', fontFamily: 'Poppins, sans-serif' }}>Choose cities</h2>
      <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 30px' }}>
        {data.destination ? `Related destinations for ${data.destination}` : 'Recommended destinations'}
      </p>

      <div style={{ margin: '0 auto 40px', maxWidth: 600, position: 'relative' }}>
        <input type="text" placeholder="Find a city" style={{ width: '100%', padding: '16px 24px', paddingLeft: 48, borderRadius: 12, border: '2px solid var(--color-secondary)', fontSize: 16, outline: 'none' }} />
        <svg style={{ position: 'absolute', left: 20, top: 18, color: '#9ca3af' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
      </div>

      {citiesLoading && (
        <div style={{ color: '#6b7280', fontWeight: 700, marginBottom: 24 }}>Loading related destinations...</div>
      )}

      {data.destination && !citiesLoading && citiesError && (
        <div style={{ color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', maxWidth: 520, margin: '0 auto 24px', fontSize: 13 }}>
          {citiesError}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
        {activeCities.map(c => {
          const selected = data.cities.includes(c.name);
          return (
            <div key={c.id || c.name} onClick={() => handleCityToggle(c.name)}
              style={{
                width: 220, background: 'white', borderRadius: '110px 110px 16px 16px', overflow: 'hidden',
                border: selected ? '2px solid var(--color-primary)' : '1px solid #e5e7eb',
                boxShadow: selected ? '0 8px 20px rgba(16,185,129,0.15)' : '0 4px 12px rgba(0,0,0,0.04)',
                cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
              }}>
              <div style={{ height: 200, width: '100%', borderRadius: '110px 110px 0 0', overflow: 'hidden' }}>
                {c.img ? (
                  <img src={c.img} alt={c.alt || c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%)' }} />
                )}
                {/* {selected && (
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✓</div>
                )} */}
              </div>
              <div style={{ padding: '20px 16px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#111827' }}>{c.name},</h4>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280' }}>{c.country || c.subtitle}</p>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: 1, marginBottom: 12 }}>{c.type}</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {c.tags.map(tag => (
                    <span key={tag} style={{ background: '#fef3c7', color: '#92400e', fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 999, border: '1px dashed #f59e0b' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Black Action Bar */}
      {data.cities.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          background: '#0a0a0a', display: 'flex', alignItems: 'center', padding: '12px 16px',
          borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', zIndex: 100,
          animation: 'fadeIn 0.3s'
        }}>


          <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between'>
            <div className='d-flex align-items-center'>
              {/* Overlapping Avatars */}
              <div className='d-flex align-items-center' style={{ marginRight: 16, width: 32, height: 32 }}>
                {data.cities.slice(0, 3).map((cityName, idx) => {
                  const cityImg = getCityImage(cityName);
                  return (
                    cityImg ? (
                      <img key={cityName} src={cityImg} style={{
                        width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
                        border: '2px solid #0a0a0a', marginLeft: idx > 0 ? -12 : 0, zIndex: 3 - idx
                      }} alt="City" />
                    ) : (
                      <div key={cityName} style={{
                        width: 32, height: 32, borderRadius: '50%', background: '#1f2937',
                        border: '2px solid #0a0a0a', marginLeft: idx > 0 ? -12 : 0, zIndex: 3 - idx
                      }} />
                    )
                  );
                })}
                {data.cities.length > 3 && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#374151', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, border: '2px solid #0a0a0a', marginLeft: -8, zIndex: 0, padding: '8px' }}>
                    +{data.cities.length - 3}
                  </div>
                )}
              </div>

              <div style={{ color: 'white', fontSize: 13, fontWeight: 500, marginRight: 24, marginLeft: 32, whiteSpace: 'nowrap' }}>
                {data.cities.length > 2 ? 'Itinerary could overshoot by 4 days' : `${data.cities[data.cities.length - 1]}! Great choice, keep adding`}
              </div>

            </div>
            <div>
              <button onClick={() => setSubStep('edit-cities')} style={{ background: '#e5e7eb', color: '#111827', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
                Edit
              </button>
              <button onClick={handleBuildItinerary} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '8px 24px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Build itinerary
              </button>

            </div>

          </div>


        </div>
      )}
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     Modal: Edit Cities
  ───────────────────────────────────────────────────────────────── */
  const renderEditCitiesModal = () => (
    <div className="customize-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setSubStep('')} />

      <div className="customize-edit-modal" style={{ position: 'relative', width: 500, maxHeight: '80vh', background: 'white', borderRadius: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
          <button onClick={() => setSubStep('')} style={{ position: 'absolute', top: 20, right: 20, width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: '1px solid #d1d5db', fontSize: 14, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px', fontFamily: 'Poppins, sans-serif' }}>Cities you will be visiting</h2>
          {data.cities.length > 2 && (
            <>
              <p style={{ color: '#e11d48', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Itinerary could overshoot by 4 days</p>
              <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>Try removing a few cities to keep the duration under 3-4 days.</p>
            </>
          )}
        </div>

        {/* Scrollable List */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.cities.map(cityName => {
              const cityObj = getCityByName(cityName);
              return (
                <div key={cityName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {cityObj?.img ? (
                      <img src={cityObj.img} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt={cityName} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0 }} />
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{cityName}, <span style={{ fontWeight: 400 }}>{cityObj?.country || 'Destination'}</span></p>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{cityObj?.subtitle}</p>
                    </div>
                  </div>
                  <button onClick={() => handleCityToggle(cityName)} style={{ width: 28, height: 28, borderRadius: 8, background: 'transparent', border: '1px solid #d1d5db', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     Final Mobile Number Modal
  ───────────────────────────────────────────────────────────────── */
  const renderLoginModal = () => (
    <div className="customize-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSubStep('')} />

      <div className="customize-login-modal" style={{ position: 'relative', width: 800, height: 450, background: 'white', borderRadius: 16, display: 'flex', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

        {/* Left Side Branding */}
        <div style={{
          width: '45%', background: 'var(--color-primary)', padding: 40, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
          {/* Radial Rays Background Mock */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'repeating-conic-gradient(from 0deg, transparent 0deg 10deg, #fff 10deg 20deg)' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
              {brandLogo ? (
                <img src={brandLogo} alt={`${brandName} Logo`} style={{ width: 80, height: 80, objectFit: 'contain' }} />
              ) : null}
            </div>
            <h3 style={{ color: 'white', fontSize: 22, fontWeight: 500, margin: '0 0 10px', letterSpacing: 1 }}>YOUR</h3>
            <h2 style={{ color: '#fef08a', fontSize: 36, fontWeight: 900, margin: '0 0 16px', lineHeight: 1.1, textShadow: '0 4px 12px rgba(0,0,0,0.3)', fontFamily: 'Poppins, sans-serif' }}>
              SOOPER HIT<br />HOLIDAY
            </h2>
            <h3 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: 1 }}>STARTS HERE</h3>
          </div>
        </div>

        {/* Right Side Form */}
        <div style={{ width: '55%', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <button onClick={() => setSubStep('')} style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', border: 'none', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', color: '#6b7280' }}>✕</button>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 500, color: '#111827', margin: '0 0 24px', lineHeight: 1.4 }}>Enter mobile number to<br />save itinerary</h2>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 60, height: 48, borderRadius: 8, border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500 }}>+91</div>
              <input type="tel" placeholder="Enter your mobile number" style={{ flex: 1, height: 48, borderRadius: 8, border: '1px solid #d1d5db', padding: '0 16px', fontSize: 16, outline: 'none' }} />
            </div>

            <button onClick={() => alert("Itinerary Saved! Redirecting to Dashboard...")} style={{ width: '100%', padding: 16, borderRadius: 8, background: '#fbbf24', color: '#fff', border: '1px dashed #059669', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.border = 'none'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fbbf24'; e.currentTarget.style.color = 'white'; e.currentTarget.style.border = '1px dashed #059669'; }}>
              View customized itinerary
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  const renderItineraryReviewModal = () => {
    const payload = itineraryPayload || readStoredCustomizePayload() || buildItineraryPayload();
    const responseData = itinerarySubmitResponse?.data || itinerarySubmitResponse?.booking || itinerarySubmitResponse?.itinerary || itinerarySubmitResponse;
    const responseRows = responseData && typeof responseData === 'object'
      ? Object.entries(responseData)
          .filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object')
          .slice(0, 8)
      : [];
    const summaryRows = [
      ['Destination', payload.trip.destination],
      ['Travel with', payload.trip.travel_with],
      ['Duration', payload.trip.duration],
      ['Departure city', payload.trip.departure_city],
      ['Departure date', payload.trip.departure_date],
      ['Travellers', `${payload.trip.total_travellers} pax, ${payload.trip.rooms.length} room${payload.trip.rooms.length > 1 ? 's' : ''}`],
      ['Cities', payload.trip.cities.map((city) => city.name).join(', ')],
    ];

    return (
      <div className="customize-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSubStep('')} />

        <div className="customize-review-modal" style={{ position: 'relative', width: 900, maxWidth: 'calc(100vw - 32px)', maxHeight: '86vh', background: 'white', borderRadius: 16, display: 'flex', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          <div style={{ width: '36%', background: 'var(--color-primary)', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'repeating-conic-gradient(from 0deg, transparent 0deg 10deg, #fff 10deg 20deg)' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                {brandLogo ? (
                  <img src={brandLogo} alt={`${brandName} Logo`} style={{ width: 80, height: 80, objectFit: 'contain' }} />
                ) : null}
              </div>
              <h3 style={{ color: 'white', fontSize: 20, fontWeight: 500, margin: '0 0 10px', letterSpacing: 1 }}>REVIEW YOUR</h3>
              <h2 style={{ color: '#fef08a', fontSize: 34, fontWeight: 900, margin: '0 0 16px', lineHeight: 1.1, textShadow: '0 4px 12px rgba(0,0,0,0.3)', fontFamily: 'Poppins, sans-serif' }}>
                {itinerarySubmitState === 'success' ? (
                  <>
                    ITINERARY<br />SAVED
                  </>
                ) : (
                  <>
                    HOLIDAY<br />PLAN
                  </>
                )}
              </h2>
              <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                {itinerarySubmitState === 'submitting' ? 'BUILDING NOW' : itinerarySubmitState === 'success' ? 'READY TO VIEW' : 'CONFIRM TO CONTINUE'}
              </h3>
            </div>
          </div>

          <div style={{ width: '64%', padding: '36px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <button onClick={() => setSubStep('')} style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', border: 'none', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', color: '#6b7280' }}>x</button>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 8px', lineHeight: 1.3 }}>
              {itinerarySubmitState === 'success' ? 'Your customized itinerary is saved' : 'Confirm your itinerary details'}
            </h2>
            <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: 13, lineHeight: 1.5 }}>
              {itinerarySubmitState === 'success'
                ? (itinerarySubmitResponse?.message || 'We have saved your trip request and will use these details for your itinerary.')
                : 'Please review the selected trip data before building the itinerary.'}
            </p>

            {itinerarySubmitState === 'error' && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                {itinerarySubmitError}
              </div>
            )}

            {itinerarySubmitState === 'success' && (
              <div style={{ padding: 14, borderRadius: 10, background: '#ecfdf5', border: '1px solid #bbf7d0', marginBottom: 16 }}>
                <div style={{ color: '#047857', fontSize: 13, fontWeight: 900, marginBottom: responseRows.length ? 10 : 0 }}>
                  {itinerarySubmitResponse?.success === false ? 'Request received' : 'Saved successfully'}
                </div>
                {/* {responseRows.length > 0 && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {responseRows.map(([label, value]) => (
                      <div key={label} style={{ display: 'grid', gridTemplateColumns: '132px 1fr', gap: 10, fontSize: 12 }}>
                        <span style={{ color: '#047857', fontWeight: 800, textTransform: 'capitalize' }}>{String(label).replace(/_/g, ' ')}</span>
                        <span style={{ color: '#064e3b', fontWeight: 700 }}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )} */}
              </div>
            )}

            <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
              {summaryRows.map(([label, value]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, alignItems: 'start', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 700 }}>{label}</span>
                  <span style={{ color: '#111827', fontSize: 13, fontWeight: 700, lineHeight: 1.45 }}>{value || '-'}</span>
                </div>
              ))}
            </div>

            {/* <pre style={{ maxHeight: 180, overflow: 'auto', margin: '0 0 20px', padding: 14, borderRadius: 8, background: '#0f172a', color: '#e5e7eb', fontSize: 11, lineHeight: 1.5, textAlign: 'left' }}>
              {JSON.stringify(payload, null, 2)}
            </pre> */}

            {itinerarySubmitState === 'success' ? (
              <button onClick={() => setSubStep('')} style={{ width: '100%', padding: 16, borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                Done
              </button>
            ) : (
              <button
                onClick={handleConfirmItinerary}
                disabled={itinerarySubmitState === 'submitting'}
                style={{
                  width: '100%',
                  padding: 16,
                  borderRadius: 8,
                  background: itinerarySubmitState === 'submitting' ? '#94a3b8' : 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: itinerarySubmitState === 'submitting' ? 'not-allowed' : 'pointer',
                }}
              >
                {itinerarySubmitState === 'submitting' ? 'Saving itinerary...' : 'Confirm and build itinerary'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="customize-shell">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes segPulse { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 45%, transparent); } 50% { box-shadow: 0 0 0 4px transparent; } }

        .customize-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(circle at 50% 10%, rgba(254, 240, 138, 0.72) 0%, rgba(254, 252, 232, 0.9) 33%, rgba(255,255,255,0.98) 72%),
            linear-gradient(180deg, #fef9c3 0%, #ffffff 82%);
          color: #07111f;
        }

        /* ── DESKTOP header ── */
        .cust-header {
          background: #090d14;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          position: sticky;
          top: 0;
          z-index: 999;
          gap: 20px;
          box-shadow: 0 10px 22px rgba(8, 13, 20, 0.2);
        }
        .cust-logo { width: 148px; height: 48px; object-fit: contain; flex-shrink: 0; }
        .cust-breadcrumbs {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          font-size: 15px; font-weight: 700;
          overflow-x: auto; flex: 1;
          scrollbar-width: none; -ms-overflow-style: none;
          white-space: nowrap; padding: 4px 0;
        }
        .cust-breadcrumbs::-webkit-scrollbar { display: none; }
        .cust-crumb-item { display: inline-flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .cust-close {
          width: 32px; height: 32px; background: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          text-decoration: none; color: #233049; font-weight: 800; font-size: 15px; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        }

        .cust-content {
          flex: 1;
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 96px 24px 40px;
        }
        .cust-step-panel {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          text-align: center;
          animation: fadeIn 0.3s;
        }
        .cust-step-title {
          font-family: Poppins, sans-serif;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 800;
          color: #07111f;
          margin: 0 0 40px;
        }
        .cust-traveller-grid {
          display: flex;
          justify-content: center;
          align-items: stretch;
          flex-wrap: wrap;
          gap: 16px;
        }
        .cust-traveller-card {
          width: 200px;
          min-height: 240px;
          padding: 12px 12px 14px;
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          background: rgba(255, 255, 255, 0.94);
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          font-family: inherit;
        }
        .cust-traveller-card:hover {
          transform: translateY(-6px);
          border-color: var(--color-primary);
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
        }
        .cust-traveller-image {
          width: 176px;
          height: 174px;
          border-radius: 92px 92px 10px 10px;
          overflow: hidden;
          background: #e5e7eb;
          margin-bottom: 14px;
        }
        .cust-traveller-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .cust-traveller-card span {
          font-size: 18px;
          font-weight: 800;
          color: #07111f;
          line-height: 1.25;
        }
        .cust-review-footer {
          background: transparent;
          padding: 18px 24px 14px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .cust-review-inner {
          width: min(830px, 100%);
          display: flex;
          gap: 24px;
          align-items: center;
          color: #07111f;
        }

        /* ── MOBILE header – hidden on desktop ── */
        .cust-mobile-header { display: none; }

        @media (max-width: 767.98px) {
          /* Hide desktop breadcrumb bar, show mobile header */
          .cust-header { display: none; }
          .cust-mobile-header {
            display: flex;
            flex-direction: column;
            background: #0d1117;
            position: sticky;
            top: 0;
            z-index: 999;
          }

          /* Top row */
          .cust-mob-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            gap: 10px;
          }
          .cust-mob-logo {
            width: 44px; height: 44px; object-fit: contain; flex-shrink: 0;
            border-radius: 8px;
          }
          .cust-mob-title {
            flex: 1;
            text-align: center;
          }
          .cust-mob-title-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #4b5563;
            margin-bottom: 1px;
          }
          .cust-mob-title-step {
            font-size: 14px;
            font-weight: 700;
            color: white;
            font-family: Poppins, sans-serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .cust-mob-close {
            width: 30px; height: 30px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            text-decoration: none;
            color: white;
            font-size: 13px;
            font-weight: 700;
            flex-shrink: 0;
            backdrop-filter: blur(4px);
          }

          /* Segmented progress track */
          .cust-mob-progress {
            display: flex;
            align-items: center;
            gap: 3px;
            padding: 0 16px 10px;
          }
          .cust-seg {
            flex: 1;
            height: 3px;
            border-radius: 999px;
            background: rgba(255,255,255,0.1);
            transition: background 0.35s ease, box-shadow 0.35s ease;
            cursor: default;
            position: relative;
            overflow: hidden;
          }
          .cust-seg.done {
            background: rgba(2,110,181,0.55);
          }
          .cust-seg.active {
            background: var(--color-primary);
            animation: segPulse 2s infinite;
          }
          /* Shimmer on active segment */
          .cust-seg.active::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
            animation: shimmer 1.8s infinite;
          }
          @keyframes shimmer {
            from { transform: translateX(-100%); }
            to   { transform: translateX(100%); }
          }

          /* Step counter badge */
          .cust-mob-badge {
            font-size: 10px;
            font-weight: 700;
            color: var(--color-primary);
            background: color-mix(in srgb, var(--color-primary) 12%, transparent);
            border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
            border-radius: 999px;
            padding: 2px 8px;
            letter-spacing: 0.5px;
            flex-shrink: 0;
          }
          .cust-content {
            padding: 42px 16px 28px;
            align-items: flex-start;
          }
          .cust-step-title {
            font-size: 24px;
            margin-bottom: 28px;
          }
          .cust-traveller-grid {
            gap: 12px;
          }
          .cust-traveller-card {
            width: calc(50% - 6px);
            min-height: 206px;
            padding: 10px;
          }
          .cust-traveller-image {
            width: 100%;
            height: 146px;
            border-radius: 76px 76px 10px 10px;
          }
          .cust-traveller-card span {
            font-size: 15px;
          }
          .cust-review-footer {
            padding: 12px 16px 18px;
          }
          .cust-review-inner {
            display: block;
          }
          .cust-review-divider,
          .cust-review-score {
            display: none;
          }
          .departure-calendar-step {
            width: 100%;
            margin: 22px auto !important;
          }
          .departure-calendar-step > h2 {
            font-size: 24px !important;
            line-height: 1.18 !important;
            margin: 0 0 24px !important;
            padding: 0 4px;
          }
          .departure-calendar-card {
            width: 100%;
            padding: 24px 10px 26px !important;
            border-radius: 0 !important;
            border-left: 0 !important;
            border-right: 0 !important;
            box-shadow: none !important;
            overflow: hidden;
          }
          .departure-calendar-card > div[title="Previous month"],
          .departure-calendar-card > div[title="Earlier months are unavailable"] {
            left: 12px !important;
            top: 20px !important;
          }
          .departure-calendar-card > div[style*="right: 24px"] {
            right: 12px !important;
            top: 20px !important;
          }
          .departure-months-wrap {
            display: block !important;
            padding: 0 !important;
          }
          .departure-month-wrap {
            display: none;
          }
          .departure-month-wrap:first-child {
            display: block;
          }
          .departure-month {
            min-width: 0 !important;
            width: 100%;
          }
          .departure-month h4 {
            margin-bottom: 18px !important;
            min-height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 42px;
          }
          .departure-weekdays,
          .departure-days-grid {
            width: 100%;
            grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          }
          .departure-weekdays {
            gap: 0 !important;
            margin-bottom: 8px !important;
          }
          .departure-days-grid {
            gap: 6px 0 !important;
          }
          .departure-weekday {
            font-size: 10px !important;
            min-width: 0;
          }
          .departure-day-cell {
            width: 34px !important;
            height: 34px !important;
            max-width: calc((100vw - 34px) / 7) !important;
            margin: 0 auto !important;
            font-size: 12px !important;
          }
          .departure-blank-day {
            min-height: 34px;
          }
          .departure-crowd-legend {
            flex-wrap: wrap;
            gap: 14px 20px !important;
            margin-top: 28px !important;
          }
          .customize-modal-overlay {
            align-items: flex-start !important;
            justify-content: center !important;
            padding: 14px !important;
            overflow-y: auto;
          }
          .customize-edit-modal,
          .customize-login-modal,
          .customize-review-modal {
            width: 100% !important;
            max-width: calc(100vw - 28px) !important;
            height: auto !important;
            max-height: calc(100svh - 28px) !important;
            border-radius: 14px !important;
            overflow-y: auto !important;
          }
          .customize-login-modal,
          .customize-review-modal {
            display: block !important;
          }
          .customize-login-modal > div:first-of-type,
          .customize-review-modal > div:first-of-type {
            width: 100% !important;
            min-height: 170px;
            padding: 24px !important;
          }
          .customize-login-modal > div:nth-of-type(2),
          .customize-review-modal > div:nth-of-type(2) {
            width: 100% !important;
            padding: 24px 20px !important;
          }
          .customize-review-modal [style*="grid-template-columns: 140px 1fr"],
          .customize-review-modal [style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
            gap: 4px !important;
          }
        }

        @media (max-width: 380px) {
          .departure-calendar-card {
            padding-left: 6px !important;
            padding-right: 6px !important;
          }
          .departure-day-cell {
            width: 30px !important;
            height: 30px !important;
            font-size: 11px !important;
          }
          .departure-blank-day {
            min-height: 30px;
          }
        }
      `}</style>

      {subStep === 'login-modal' && renderItineraryReviewModal()}
      {subStep === 'edit-cities' && renderEditCitiesModal()}

      {/* ── DESKTOP Header ── */}
      <header className="cust-header">
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {brandLogo ? (
            <img
              src={brandLogo}
              alt={`${brandName} Logo`}
              className="cust-logo"
            />
          ) : null}
        </Link>
        <div className="cust-breadcrumbs">
          {BREADCRUMBS.map((crumb, i) => (
            <div key={i} className="cust-crumb-item">
              <span
                style={{
                  color: crumb.active ? 'var(--color-primary)' : (i < step ? 'white' : '#6b7280'),
                  borderBottom: crumb.active ? '2px solid var(--color-primary)' : 'none',
                  paddingBottom: 9,
                  cursor: 'default',
                  whiteSpace: 'nowrap',
                }}
              >
                {crumb.label}
              </span>
              {i < BREADCRUMBS.length - 1 && <span style={{ color: '#334155', flexShrink: 0 }}>.</span>}
            </div>
          ))}
        </div>
        <Link href="/" className="cust-close">x</Link>
      </header>

      {/* ── MOBILE Header – unique step-tracker design ── */}
      <div className="cust-mobile-header">
        {/* Top row: Logo + current step title + close */}
        <div className="cust-mob-top">
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={`${brandName} Logo`}
                className="cust-mob-logo"
              />
            ) : null}
          </Link>

          <div className="cust-mob-title">
            <div className="cust-mob-title-label">Step {step + 1} of {BREADCRUMBS.length}</div>
            <div className="cust-mob-title-step">{BREADCRUMBS[step]?.label}</div>
          </div>

          <Link href="/" className="cust-mob-close">x</Link>
        </div>

        {/* Segmented progress bar */}
        <div className="cust-mob-progress">
          {BREADCRUMBS.map((_, i) => (
            <div
              key={i}
              className={`cust-seg${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}
              title={BREADCRUMBS[i]?.label}
            />
          ))}
          <span className="cust-mob-badge">{step + 1}/{BREADCRUMBS.length}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="cust-content">
        {step === 0 && renderDestination()}
        {step === 1 && renderTravellers()}
        {step === 2 && renderDuration()}
        {step === 3 && renderDepartureCity()}
        {step === 4 && renderDepartureDate()}
        {step === 5 && renderCities()}
      </main>

      {/* Bottom Review Block */}
      {step < 5 && (
        <footer className="cust-review-footer">
          <div className="cust-review-inner">
            <div style={{ display: 'flex', gap: 12, flex: 1 }}>
              <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} alt="User" />
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#4b5563', lineHeight: 1.4 }}>&quot;This is my honest review of my experience with ITS TRAVELS AND TOURS whose services my partner and I used to book our memorable New Zealand honeymoon...&quot;</p>
                <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>Tejas Kinger, New Zealand</p>
              </div>
            </div>
            <div className="cust-review-divider" style={{ width: 1, height: 40, background: '#e5e7eb' }} />
            <div className="cust-review-score" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>4.6 / 5</span>
                <span style={{ color: '#fbbf24', fontSize: 14 }}>★</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>8250 reviews</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
