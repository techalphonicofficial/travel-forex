'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Row,
    Col,
    Form,
    Button,
    Card,
    Badge,
    Spinner,
    Modal,
    Dropdown,
    ButtonGroup,
    Alert,
    Placeholder,
    Collapse,
    Offcanvas,
    Accordion,
} from 'react-bootstrap';

import hotelService from '../services/hotelService';
import TripJackHotelCard from './TripJackHotelCard';
import HotelDetails from './HotelDetails';
import HotelSearchForm from './HotelSearchForm';
import HotelFilters from './HotelFilters';

/* =========================================================
   CONSTANTS
========================================================= */

const today = new Date().toISOString().split('T')[0];

const defaultRoom = () => ({
    adults: 2,
    children: 0,
    childAges: [],
});

const SORT_OPTIONS = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Guest Rating' },
    { value: 'name', label: 'Name (A-Z)' },
];

const RATING_FILTERS = [0, 3, 4, 4.5, 5];

/* =========================================================
   HELPERS
========================================================= */

const generateCorrelationId = (length = 22) => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let id = '';

    for (let i = 0; i < length; i += 1) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }

    return id;
};

const formatPrice = (value, currency = 'INR') => {
    const amount = Number(value || 0);

    if (!amount) {
        return 'Price on request';
    }

    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${currency} ${amount.toLocaleString('en-IN')}`;
    }
};

/* =========================================================
   CITY HELPERS
========================================================= */

const getCityRegionId = (city) =>
    city?.cityRegionId ||
    city?.regionId ||
    city?.city_region_id ||
    city?.cityRegion?.id ||
    city?.region?.id ||
    null;

const getCityName = (city) =>
    city?.cityName ||
    city?.name ||
    city?.city ||
    city?.destination ||
    city?.regionName ||
    '';

const getCityCountry = (city) =>
    city?.countryName ||
    city?.country?.name ||
    city?.country ||
    '';

const extractCities = (response) => {
    const candidates = [
        response?.data?.cities,
        response?.data?.results,
        response?.data,
        response?.cities,
        response?.results,
    ];

    const value = candidates.find(Array.isArray);

    if (!Array.isArray(value)) {
        return [];
    }

    return value;
};

/* =========================================================
   HID HELPERS
========================================================= */

const extractHids = (response) => {
    const hotels = response?.data?.hotels;

    if (!Array.isArray(hotels)) {
        console.warn('TripJack HIDs: hotels array not found');
        return [];
    }

    const hids = hotels
        .map((hotel) => {
            if (typeof hotel !== 'object' || hotel === null) {
                return null;
            }

            return (
                hotel?.hotelContent?.tjHotelId ||
                hotel?.hotelContent?.hotelId ||
                hotel?.tjHotelId ||
                hotel?.hotelId ||
                hotel?.hid ||
                hotel?.id ||
                hotel?.hotelCode
            );
        })
        .filter(Boolean)
        .map(String)
        .slice(0, 100);

    return hids;
};

/* =========================================================
   HOTEL HELPERS - CRITICAL FOR YOUR API STRUCTURE
========================================================= */

const getHotelId = (hotel) =>
    hotel?.hotelId ||
    hotel?.hotelContent?.tjHotelId ||
    hotel?.hotelContent?.hotelId ||
    hotel?.hid ||
    hotel?.id ||
    hotel?.hotelCode;

const getHotelUnicaId = (hotel) =>
    hotel?.hotelContent?.unicaId ||
    hotel?.unicaId ||
    null;

const getHotelName = (hotel) =>
    hotel?.name ||
    hotel?.hotelContent?.name ||
    hotel?.hotelName ||
    hotel?.propertyName ||
    'Hotel';

const getHotelImage = (hotel) => {
    // First check direct image
    if (hotel?.image) return hotel.image;

    // Check images array from your API
    if (Array.isArray(hotel?.images) && hotel.images.length > 0) {
        // Prefer hero image
        const heroImage = hotel.images.find((img) => img?.is_hero_image);
        if (heroImage?.links) {
            return (
                heroImage.links?.original ||
                heroImage.links?.large ||
                heroImage.links?.medium ||
                heroImage.links?.small ||
                null
            );
        }

        // Fallback to first image
        const firstImage = hotel.images[0];
        if (firstImage?.links) {
            return (
                firstImage.links?.original ||
                firstImage.links?.large ||
                firstImage.links?.medium ||
                firstImage.links?.small ||
                null
            );
        }
    }

    // Check other possible image fields
    const images = [
        hotel?.imageUrl,
        hotel?.image_url,
        hotel?.thumbnail,
        hotel?.thumbnailUrl,
        hotel?.gallery?.[0]?.url,
    ];

    return images.find(Boolean) || null;
};

const getHotelImages = (hotel) => {
    if (Array.isArray(hotel?.images) && hotel.images.length > 0) {
        return hotel.images
            .map((img) => {
                if (!img?.links) return null;
                return (
                    img.links?.original ||
                    img.links?.large ||
                    img.links?.medium ||
                    img.links?.small ||
                    null
                );
            })
            .filter(Boolean);
    }
    return [];
};

const getHotelLocation = (hotel) => {
    // Check hotelContent for address
    const content = hotel?.hotelContent;

    if (content?.address) {
        return content.address;
    }

    if (content?.city) {
        return content.city;
    }

    const location =
        hotel?.address ||
        hotel?.location ||
        hotel?.city ||
        hotel?.destination ||
        '';

    if (typeof location === 'string') {
        return location;
    }

    return [
        location?.city,
        location?.name,
        location?.country,
    ]
        .filter(Boolean)
        .join(', ');
};

const getHotelRating = (hotel) => {
    // Check options for star rating
    const options = hotel?.options || [];
    for (const opt of options) {
        if (opt?.starRating) return Number(opt.starRating);
        if (opt?.hotelRating) return Number(opt.hotelRating);
        if (opt?.rating) return Number(opt.rating);
    }

    return Number(
        hotel?.rating ||
        hotel?.starRating ||
        hotel?.star_rating ||
        hotel?.category ||
        hotel?.hotelContent?.star_rating ||
        hotel?.hotelContent?.rating ||
        0
    );
};

const getHotelPrice = (hotel) => {
    // Check options array first
    const options = hotel?.options || [];
    let minPrice = Infinity;

    for (const opt of options) {
        const price =
            opt?.price ||
            opt?.totalPrice ||
            opt?.amount ||
            opt?.pricing?.price ||
            opt?.pricing?.total ||
            opt?.netPrice ||
            opt?.grossPrice ||
            0;

        const numPrice = Number(price);
        if (numPrice > 0 && numPrice < minPrice) {
            minPrice = numPrice;
        }
    }

    if (minPrice !== Infinity) return minPrice;

    // Fallback to direct fields
    return Number(
        hotel?.price ||
        hotel?.minPrice ||
        hotel?.startingPrice ||
        hotel?.pricePerNight ||
        hotel?.pricing?.price ||
        hotel?.rooms?.[0]?.price ||
        0
    );
};

const getHotelCurrency = (hotel) => {
    const options = hotel?.options || [];
    for (const opt of options) {
        if (opt?.currency) return opt.currency;
        if (opt?.pricing?.currency) return opt.pricing.currency;
    }
    return hotel?.currency || 'INR';
};

const getAmenities = (hotel) => {
    // Check hotelContent for amenities
    const contentAmenities = hotel?.hotelContent?.amenities;
    if (Array.isArray(contentAmenities)) {
        return contentAmenities
            .map((item) => {
                if (typeof item === 'string') return item;
                return item?.name || item?.label || item?.title;
            })
            .filter(Boolean)
            .slice(0, 5);
    }

    const amenities =
        hotel?.amenities ||
        hotel?.facilities ||
        hotel?.propertyAmenities ||
        [];

    if (!Array.isArray(amenities)) {
        return [];
    }

    return amenities
        .map((item) => {
            if (typeof item === 'string') return item;
            return item?.name || item?.label || item?.title;
        })
        .filter(Boolean)
        .slice(0, 5);
};

const isHotelActive = (hotel) => {
    if (hotel?.hotelContent?.is_active === false) return false;
    if (hotel?.is_active === false) return false;
    return true;
};

const getOptionsCount = (hotel) => {
    if (!Array.isArray(hotel?.options)) return 0;
    return hotel.options.length;
};

const hasAvailability = (hotel) => {
    const options = hotel?.options || [];
    if (options.length === 0) return false;

    return options.some((opt) => {
        const status =
            opt?.status ||
            opt?.availability ||
            opt?.isAvailable;
        if (status === false) return false;
        if (typeof status === 'string') {
            return status.toLowerCase() !== 'unavailable';
        }
        return true;
    });
};

const getCancellationPolicy = (hotel) => {
    const options = hotel?.options || [];
    for (const opt of options) {
        if (opt?.cancellationPolicy) {
            return opt.cancellationPolicy;
        }
        if (opt?.isRefundable !== undefined) {
            return opt.isRefundable ? 'Refundable' : 'Non-refundable';
        }
    }
    return null;
};

const extractHotels = (response) => {
    const candidates = [
        response?.data?.hotels,
        response?.data?.searchResults,
        response?.data?.hotelResults,
        response?.data?.results,
        response?.data,
        response?.hotels,
        response?.searchResults,
        response?.hotelResults,
        response?.results,
    ];

    const value = candidates.find(Array.isArray);

    return Array.isArray(value) ? value : [];
};

/* =========================================================
   ICONS
========================================================= */

function StarRating({ rating }) {
    const stars = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));

    return (
        <div className="d-flex gap-1" aria-label={`${rating} star hotel`}>
            {Array.from({ length: 5 }).map((_, index) => (
                <span
                    key={index}
                    className={index < stars ? 'tj-star active' : 'tj-star'}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20a6 6 0 0 1 12 0" />
            <path d="M16 5a3 3 0 0 1 0 6M18 20a5 5 0 0 0-2.2-4.15" />
        </svg>
    );
}

function MapPinIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
        </svg>
    );
}

function FilterIcon({ size = 16 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
        </svg>
    );
}

function FieldIcon({ children }) {
    return <span className="tj-field-icon">{children}</span>;
}

/* =========================================================
   LOADING CARD
========================================================= */

function LoadingCard() {
    return (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-3">
            <Row className="g-0">
                <Col md={4}>
                    <Placeholder
                        as="div"
                        animation="glow"
                        className="w-100 h-100"
                        style={{ minHeight: 220 }}
                    >
                        <Placeholder xs={12} className="w-100 h-100 rounded-0" />
                    </Placeholder>
                </Col>

                <Col md={8} className="p-4">
                    <Placeholder as="p" animation="glow" className="mb-1">
                        <Placeholder xs={6} size="lg" />
                    </Placeholder>

                    <Placeholder as="p" animation="glow" className="mb-1">
                        <Placeholder xs={4} />
                    </Placeholder>

                    <Placeholder as="p" animation="glow">
                        <Placeholder xs={8} />
                    </Placeholder>

                    <Placeholder.Button variant="secondary" xs={4} className="mt-4" />
                </Col>
            </Row>
        </Card>
    );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function TripJackHotelsClient() {
    const router = useRouter();
    const [form, setForm] = useState({
        destination: '',
        checkIn: '',
        checkOut: '',
        rooms: [defaultRoom()],
        currency: 'INR',
        nationality: '',
    });

    const [hotels, setHotels] = useState([]);
    const [correctionId, setCorerectionId] = useState(null)
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [sortBy, setSortBy] = useState('recommended');
    const [filterRating, setFilterRating] = useState(0);
    const [guestMenuOpen, setGuestMenuOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    /* =====================================================
       FILTER STATES
    ===================================================== */

    const [priceRange, setPriceRange] = useState([0, 100000]);
    const [filterAmenities, setFilterAmenities] = useState([]);
    const [filterRefundable, setFilterRefundable] = useState(false);
    const [filterAvailable, setFilterAvailable] = useState(false);

    /* =====================================================
       CITY STATE
    ===================================================== */

    const [citySuggestions, setCitySuggestions] = useState([]);
    const [cityLoading, setCityLoading] = useState(false);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);

    /* =====================================================
       HID STATE
    ===================================================== */

    const [availableHids, setAvailableHids] = useState([]);
    const [hidsLoading, setHidsLoading] = useState(false);

    /* =====================================================
       REFS
    ===================================================== */

    const citySearchTimer = useRef(null);
    const cityRequestRef = useRef(0);
    const searchRequestRef = useRef(0);
    const selectedCityNameRef = useRef('');

    /* =====================================================
       CLEANUP
    ===================================================== */



    // Nationalities managemnet

    const [nationalities, setNationalities] = useState([]);
    const [nationalitiesLoading, setNationalitiesLoading] = useState(false);
    const [residenceCountry, setResidenceCountry] = useState('');





    useEffect(() => {
        return () => {
            if (citySearchTimer.current) {
                clearTimeout(citySearchTimer.current);
            }
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadNationalities = async () => {
            try {
                setNationalitiesLoading(true);

                const response =
                    await hotelService.getNationalities();

                const list =
                    response?.data?.nationalityInfos ||
                    response?.nationalityInfos ||
                    [];

                if (cancelled) {
                    return;
                }

                const normalizedList = Array.isArray(list)
                    ? list
                    : [];

                setNationalities(normalizedList);

                const india = normalizedList.find(
                    (item) =>
                        item?.code === 'IN' ||
                        item?.isoCode === 'IND' ||
                        String(item?.countryName || '').toLowerCase() ===
                        'india'
                );

                if (india?.countryId) {
                    const indiaCountryId =
                        String(india.countryId);

                    setForm((current) => ({
                        ...current,
                        nationality:
                            current.nationality ||
                            indiaCountryId,
                    }));

                    setResidenceCountry((current) =>
                        current || indiaCountryId
                    );
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error(
                    'Failed to load TripJack nationalities:',
                    error
                );

                setNationalities([]);
            } finally {
                if (!cancelled) {
                    setNationalitiesLoading(false);
                }
            }
        };

        loadNationalities();

        return () => {
            cancelled = true;
        };
    }, []);

    /* =====================================================
       CITY SEARCH
    ===================================================== */

    useEffect(() => {
        const query = form.destination?.trim() || '';

        if (selectedCity && query === selectedCityNameRef.current) {
            return;
        }

        if (citySearchTimer.current) {
            clearTimeout(citySearchTimer.current);
        }

        if (query.length < 2) {
            setCitySuggestions([]);
            setShowCitySuggestions(false);
            setCityLoading(false);
            return;
        }

        const requestId = ++cityRequestRef.current;

        citySearchTimer.current = setTimeout(async () => {
            try {
                setCityLoading(true);

                const response = await hotelService.citySearch(query);

                if (requestId !== cityRequestRef.current) {
                    return;
                }

                const cities = extractCities(response)
                    .filter((city) => getCityRegionId(city))
                    .slice(0, 10);

                setCitySuggestions(cities);
                setShowCitySuggestions(cities.length > 0);
            } catch (err) {
                if (requestId !== cityRequestRef.current) {
                    return;
                }

                console.error('TripJack city search error:', err);
                setCitySuggestions([]);
                setShowCitySuggestions(false);
            } finally {
                if (requestId === cityRequestRef.current) {
                    setCityLoading(false);
                }
            }
        }, 350);

        return () => {
            if (citySearchTimer.current) {
                clearTimeout(citySearchTimer.current);
            }
        };
    }, [form.destination, selectedCity]);

    /* =====================================================
       GUEST SUMMARY
    ===================================================== */

    const guestSummary = useMemo(() => {
        const adults = form.rooms.reduce(
            (total, room) => total + Number(room.adults || 0),
            0
        );

        const children = form.rooms.reduce(
            (total, room) => total + Number(room.children || 0),
            0
        );

        return `${adults} Adults, ${children} Children, ${form.rooms.length} Room${form.rooms.length > 1 ? 's' : ''
            }`;
    }, [form.rooms]);

    /* =====================================================
       COMPUTED: ALL AMENITIES
    ===================================================== */

    const allAmenities = useMemo(() => {
        const amenitySet = new Set();
        hotels.forEach((hotel) => {
            getAmenities(hotel).forEach((a) => {
                if (a) amenitySet.add(a);
            });
        });
        return Array.from(amenitySet).sort().slice(0, 15);
    }, [hotels]);

    /* =====================================================
       COMPUTED: MAX PRICE
    ===================================================== */

    const maxPrice = useMemo(() => {
        if (hotels.length === 0) return 100000;
        const prices = hotels
            .map((h) => getHotelPrice(h))
            .filter((p) => p > 0);
        if (prices.length === 0) return 100000;
        return Math.ceil(Math.max(...prices) / 1000) * 1000;
    }, [hotels]);

    /* =====================================================
       FILTER + SORT
    ===================================================== */

    const filteredHotels = useMemo(() => {
        let result = [...hotels];

        // Filter: Active only
        result = result.filter((hotel) => isHotelActive(hotel));

        // Filter: Rating
        if (filterRating > 0) {
            result = result.filter(
                (hotel) => getHotelRating(hotel) >= filterRating
            );
        }

        // Filter: Price range
        result = result.filter((hotel) => {
            const price = getHotelPrice(hotel);
            if (price === 0) return true; // Include price-on-request
            return price >= priceRange[0] && price <= priceRange[1];
        });

        // Filter: Availability
        if (filterAvailable) {
            result = result.filter((hotel) => hasAvailability(hotel));
        }

        // Filter: Refundable
        if (filterRefundable) {
            result = result.filter((hotel) => {
                const policy = getCancellationPolicy(hotel);
                return policy && policy.toLowerCase().includes('refund');
            });
        }

        // Filter: Amenities
        if (filterAmenities.length > 0) {
            result = result.filter((hotel) => {
                const hotelAmenities = getAmenities(hotel).map((a) =>
                    a.toLowerCase()
                );
                return filterAmenities.every((a) =>
                    hotelAmenities.includes(a.toLowerCase())
                );
            });
        }

        // Sort
        switch (sortBy) {
            case 'price-low':
                result.sort(
                    (a, b) => getHotelPrice(a) - getHotelPrice(b)
                );
                break;
            case 'price-high':
                result.sort(
                    (a, b) => getHotelPrice(b) - getHotelPrice(a)
                );
                break;
            case 'rating':
                result.sort(
                    (a, b) => getHotelRating(b) - getHotelRating(a)
                );
                break;
            case 'name':
                result.sort((a, b) =>
                    getHotelName(a).localeCompare(getHotelName(b))
                );
                break;
            default:
                // Recommended: available first, then by rating
                result.sort((a, b) => {
                    const aAvail = hasAvailability(a) ? 1 : 0;
                    const bAvail = hasAvailability(b) ? 1 : 0;
                    if (aAvail !== bAvail) return bAvail - aAvail;
                    return getHotelRating(b) - getHotelRating(a);
                });
        }

        return result;
    }, [
        hotels,
        filterRating,
        priceRange,
        filterAvailable,
        filterRefundable,
        filterAmenities,
        sortBy,
    ]);

    /* =====================================================
       FORM
    ===================================================== */

    const updateForm = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    /* =====================================================
       DESTINATION CHANGE
    ===================================================== */

    const handleDestinationChange = (value) => {
        updateForm('destination', value);
        setSelectedCity(null);
        selectedCityNameRef.current = '';
        setAvailableHids([]);
        setCitySuggestions([]);
        setShowCitySuggestions(false);
        setSearched(false);
        setHotels([]);
        setError('');
    };

    /* =====================================================
       CITY SELECT
    ===================================================== */

    const handleCitySelect = async (city) => {
        const regionId = getCityRegionId(city);
        const cityName = getCityName(city);
        const countryName = getCityCountry(city) || 'INDIA';

        if (!regionId) {
            setError('Selected city does not have a valid TripJack region.');
            return;
        }

        setSelectedCity(city);
        selectedCityNameRef.current = cityName;
        updateForm('destination', cityName);
        setCitySuggestions([]);
        setShowCitySuggestions(false);
        setError('');
        setHotels([]);
        setSearched(false);
        setAvailableHids([]);
        setHidsLoading(true);

        try {
            const response = await hotelService.hotelIdsByRegion({
                regionIds: [String(regionId)],
                countryName,
                page: 0,
                size: 2000,
            });

            const hids = extractHids(response);
            setAvailableHids(hids);

            console.log(`Loaded ${hids.length} hotels for ${cityName}`);
        } catch (err) {
            console.error('HIDs API error:', err);
            setAvailableHids([]);
            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                'Unable to load hotels for this destination.'
            );
        } finally {
            setHidsLoading(false);
        }
    };

    /* =====================================================
       ROOM CONTROLS
    ===================================================== */

    const updateRoomCount = (index, field, delta) => {
        setForm((current) => {
            const rooms = [...current.rooms];
            const room = { ...rooms[index] };

            if (field === 'adults') {
                room.adults = Math.max(
                    1,
                    Math.min(9, Number(room.adults) + delta)
                );
            } else {
                const nextChildren = Math.max(
                    0,
                    Math.min(6, Number(room.children) + delta)
                );

                const childAges = [...(room.childAges || [])];

                if (nextChildren > childAges.length) {
                    while (childAges.length < nextChildren) {
                        childAges.push(1);
                    }
                } else {
                    childAges.length = nextChildren;
                }

                room.children = nextChildren;
                room.childAges = childAges;
            }

            rooms[index] = room;

            return {
                ...current,
                rooms,
            };
        });
    };

    const updateChildAge = (roomIndex, childIndex, age) => {
        setForm((current) => {
            const rooms = [...current.rooms];
            const room = { ...rooms[roomIndex] };
            const childAges = [...(room.childAges || [])];

            childAges[childIndex] = Math.max(0, Math.min(17, Number(age)));

            room.childAges = childAges;
            rooms[roomIndex] = room;

            return {
                ...current,
                rooms,
            };
        });
    };

    const addRoom = () => {
        setForm((current) => ({
            ...current,
            rooms: [...current.rooms, defaultRoom()],
        }));
    };

    const removeRoom = (index) => {
        setForm((current) => ({
            ...current,
            rooms:
                current.rooms.length === 1
                    ? current.rooms
                    : current.rooms.filter((_, i) => i !== index),
        }));
    };

    /* =====================================================
       HOTEL LISTING SEARCH
    ===================================================== */

    const searchHotels = async (event) => {
        if (event?.preventDefault) {
            event.preventDefault();
        }

        setError('');

        if (!selectedCity) {
            setError('Please select a destination from the suggestions.');
            return;
        }

        if (hidsLoading) {
            setError('Hotels are still loading for this destination. Please wait.');
            return;
        }

        if (!availableHids.length) {
            setError('No hotels are available for this destination.');
            return;
        }

        if (!form.checkIn) {
            setError('Please select check-in date.');
            return;
        }

        if (!form.checkOut) {
            setError('Please select check-out date.');
            return;
        }

        if (form.checkOut <= form.checkIn) {
            setError('Check-out date must be after check-in date.');
            return;
        }

        if (!form.nationality) {
            setError('Please select nationality.');
            return;
        }

        const requestId = ++searchRequestRef.current;

        setLoading(true);
        setSearched(false);
        setHotels([]);

        try {
            const rooms = form.rooms.map((room) => {
                const built = {
                    adults: Number(room.adults) || 1,
                };

                if (Number(room.children) > 0) {
                    built.children = Number(room.children);
                    built.childAge = (room.childAges || []).map((age) =>
                        Number(age)
                    );
                }

                return built;
            });

            const payload = {
                checkIn: form.checkIn,
                checkOut: form.checkOut,
                rooms,
                currency: form.currency,
                correlationId: generateCorrelationId(),
                nationality: String(form.nationality),
                timeoutMs: 13000,
                hids: availableHids,
            };

            const response = await hotelService.listing(payload);

            if (requestId !== searchRequestRef.current) {
                return;
            }


            const resultHotels = extractHotels(response);
            setCorerectionId(response.data.correlationId)
            setHotels(resultHotels);
            setSearched(true);

            // Reset price range based on new results
            if (resultHotels.length > 0) {
                const prices = resultHotels
                    .map((h) => getHotelPrice(h))
                    .filter((p) => p > 0);
                if (prices.length > 0) {
                    const max = Math.ceil(Math.max(...prices) / 1000) * 1000;
                    setPriceRange([0, max]);
                }
            }

            if (!resultHotels.length) {
                setError(
                    'No hotels found for the selected destination and dates.'
                );
            }
        } catch (err) {
            if (requestId !== searchRequestRef.current) {
                return;
            }

            console.error('Hotel listing error:', err);

            const apiError = err?.response?.data;
            const message =
                apiError?.message ||
                apiError?.error ||
                apiError?.errors?.[0]?.message ||
                err?.message ||
                'Unable to search hotels right now. Please try again.';

            setError(message);
            setHotels([]);
            setSearched(true);
        } finally {
            if (requestId === searchRequestRef.current) {
                setLoading(false);
            }
        }
    };

    /* =====================================================
       RESET FILTERS
    ===================================================== */

    const resetFilters = () => {
        setFilterRating(0);
        setPriceRange([0, maxPrice]);
        setFilterAmenities([]);
        setFilterRefundable(false);
        setFilterAvailable(false);
    };

    /* =====================================================
       RENDER
    ===================================================== */



    const openHotelDetails = (hotel) => {
        if (!hotel) {
            setError('Unable to open hotel details.');
            return;
        }

        const hotelId = getHotelId(hotel);

        if (!hotelId) {
            setError('Hotel ID is missing. Please try again.');
            return;
        }

        try {
            sessionStorage.setItem(
                'tripjack_selected_hotel',
                JSON.stringify(hotel)
            );

            sessionStorage.setItem(
                'tripjack_hotel_search',
                JSON.stringify({
                    rooms: form.rooms,
                    correlationId:hotel.correctionId,
                    destination: form.destination,
                })
            );
        } catch (storageError) {
            console.error(
                'Unable to save TripJack hotel search context:',
                storageError
            );
        }


        const params = new URLSearchParams({
            hotelId: String(hotelId),
            checkIn: form.checkIn,
            checkOut: form.checkOut,
            currency: form.currency,
            nationality: String(form.nationality || ''),
            correlationId:correctionId
        });

        router.push(
            `/tripjack-hotels/details?${params.toString()}`
        );
    };
    return (
        <>
            <main className="tj-page">
                {/* =========================================
                    HERO
                ========================================= */}

                <section className="tj-hero text-white">
                    <Container className="pt-5">
                        <Badge className="tj-eyebrow-badge mb-3">
                            TRAVEL FOREX · HOTEL COLLECTION
                        </Badge>

                        <h1
                            className="display-4 fw-bold mb-3"
                            style={{ letterSpacing: '-1.5px' }}
                        >
                            Find stays that feel
                            <br />
                            <span className="tj-accent">worth the journey.</span>
                        </h1>

                        <p
                            className="lead text-white-50"
                            style={{ maxWidth: 600 }}
                        >
                            Discover handpicked hotels, resorts and stays around
                            the world with flexible booking options.
                        </p>
                    </Container>
                </section>

                {/* =========================================
                    SEARCH CARD
                ========================================= */}

                <Container className="tj-search-wrap">
                    <HotelSearchForm
                        form={form}
                        loading={loading}

                        nationalities={nationalities}
                        nationalitiesLoading={nationalitiesLoading}

                        residenceCountry={residenceCountry}
                        setResidenceCountry={setResidenceCountry}
                        hidsLoading={hidsLoading}

                        selectedCity={selectedCity}
                        citySuggestions={citySuggestions}
                        cityLoading={cityLoading}
                        showCitySuggestions={showCitySuggestions}

                        guestMenuOpen={guestMenuOpen}
                        setGuestMenuOpen={setGuestMenuOpen}

                        showAdvanced={showAdvanced}
                        setShowAdvanced={setShowAdvanced}

                        guestSummary={guestSummary}

                        updateForm={updateForm}
                        handleDestinationChange={handleDestinationChange}
                        handleCitySelect={handleCitySelect}

                        getCityName={getCityName}
                        getCityCountry={getCityCountry}
                        getCityRegionId={getCityRegionId}

                        updateRoomCount={updateRoomCount}
                        updateChildAge={updateChildAge}
                        addRoom={addRoom}
                        removeRoom={removeRoom}

                        onSubmit={searchHotels}

                        onShowCitySuggestions={() => {
                            if (
                                !selectedCity &&
                                citySuggestions.length > 0
                            ) {
                                setShowCitySuggestions(true);
                            }
                        }}

                        onHideCitySuggestions={() => {
                            setTimeout(() => {
                                setShowCitySuggestions(false);
                            }, 180);
                        }}
                    />
                </Container>

                {/* =========================================
                    RESULTS
                ========================================= */}

                <section className="py-5">
                    <Container fluid className="px-3 px-md-4">
                        <Row>
                            {/* FILTER SIDEBAR - DESKTOP */}
                            {searched && hotels.length > 0 && (
                                <Col lg={3} xl={2} className="d-none d-lg-block">
                                    <Card className="border-0 shadow-sm rounded-4 p-4 sticky-top tj-filter-card">
                                        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                            <FilterIcon />
                                            Filters
                                        </h5>

                                        <HotelFilters
                                            filterRating={filterRating}
                                            setFilterRating={setFilterRating}

                                            priceRange={priceRange}
                                            setPriceRange={setPriceRange}
                                            maxPrice={maxPrice}

                                            filterAmenities={filterAmenities}
                                            setFilterAmenities={setFilterAmenities}
                                            allAmenities={allAmenities}

                                            filterRefundable={filterRefundable}
                                            setFilterRefundable={setFilterRefundable}

                                            filterAvailable={filterAvailable}
                                            setFilterAvailable={setFilterAvailable}

                                            onReset={resetFilters}
                                        />
                                    </Card>
                                </Col>
                            )}

                            {/* MAIN CONTENT */}
                            <Col lg={searched && hotels.length > 0 ? 9 : 12} xl={searched && hotels.length > 0 ? 10 : 12}>
                                {/* HEADER */}
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-3">
                                    <div>
                                        <span className="tj-eyebrow-text">
                                            TRIPJACK COLLECTION
                                        </span>

                                        <h2 className="fw-bold mb-0 mt-1">
                                            {searched
                                                ? `${filteredHotels.length} stays found`
                                                : 'Explore available stays'}
                                        </h2>

                                        {form.destination && (
                                            <p className="text-muted mb-0 mt-1">
                                                Hotels in {form.destination}
                                            </p>
                                        )}
                                    </div>

                                    {searched && hotels.length > 0 && (
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            {/* Mobile Filter Button */}
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="d-lg-none"
                                                onClick={() =>
                                                    setShowFilters(true)
                                                }
                                            >
                                                <FilterIcon /> Filters
                                            </Button>

                                            <Form.Label className="mb-0 small text-muted">
                                                Sort by
                                            </Form.Label>

                                            <Form.Select
                                                size="sm"
                                                style={{ width: 200 }}
                                                value={sortBy}
                                                onChange={(e) =>
                                                    setSortBy(e.target.value)
                                                }
                                            >
                                                {SORT_OPTIONS.map((opt) => (
                                                    <option
                                                        key={opt.value}
                                                        value={opt.value}
                                                    >
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </div>
                                    )}
                                </div>

                                {/* QUICK FILTERS */}
                                {searched && hotels.length > 0 && (
                                    <ButtonGroup className="mb-3 flex-wrap">
                                        <Button
                                            variant={
                                                filterRating === 0
                                                    ? 'dark'
                                                    : 'outline-secondary'
                                            }
                                            size="sm"
                                            onClick={() => setFilterRating(0)}
                                        >
                                            All hotels
                                        </Button>

                                        {[3, 4, 4.5, 5].map((rating) => (
                                            <Button
                                                key={rating}
                                                variant={
                                                    filterRating === rating
                                                        ? 'dark'
                                                        : 'outline-secondary'
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setFilterRating(rating)
                                                }
                                            >
                                                ★ {rating}+
                                            </Button>
                                        ))}
                                    </ButtonGroup>
                                )}

                                {/* LOADING */}
                                {loading && (
                                    <>
                                        <LoadingCard />
                                        <LoadingCard />
                                        <LoadingCard />
                                    </>
                                )}

                                {/* ERROR */}
                                {!loading && error && (
                                    <Alert
                                        variant="danger"
                                        className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 rounded-4 shadow-sm"
                                    >
                                        <div>
                                            <Alert.Heading className="fs-6 mb-1">
                                                {error}
                                            </Alert.Heading>

                                            <p className="mb-0 small">{error}</p>
                                        </div>

                                        {selectedCity &&
                                            availableHids.length > 0 && (
                                                <Button
                                                    variant="dark"
                                                    size="sm"
                                                    onClick={searchHotels}
                                                >
                                                    Try again
                                                </Button>
                                            )}
                                    </Alert>
                                )}

                                {/* NO RESULTS */}
                                {!loading &&
                                    !error &&
                                    searched &&
                                    filteredHotels.length === 0 && (
                                        <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                                            <div className="fs-1 mb-2">🏨</div>

                                            <h3 className="fw-bold">
                                                No stays found
                                            </h3>

                                            <p className="text-muted mb-0">
                                                Try changing your dates or
                                                destination and search again.
                                            </p>

                                            {(filterRating > 0 ||
                                                filterAmenities.length > 0 ||
                                                filterRefundable ||
                                                filterAvailable) && (
                                                    <Button
                                                        variant="outline-primary"
                                                        className="mt-3"
                                                        onClick={resetFilters}
                                                    >
                                                        Clear all filters
                                                    </Button>
                                                )}
                                        </div>
                                    )}

                                {/* HOTEL RESULTS */}
                                {!loading &&
                                    !error &&
                                    filteredHotels.length > 0 &&
                                    filteredHotels.map((hotel, index) => (
                                        <TripJackHotelCard
                                            key={getHotelId(hotel) || index}
                                            hotel={hotel}
                                            onSelect={openHotelDetails}
                                        />
                                    ))}

                                {/* INITIAL STATE */}
                                {!searched && !loading && (
                                    <Card className="border-0 shadow-sm rounded-4 p-4 tj-inspiration">
                                        <Row className="align-items-center g-4">
                                            <Col md={7}>
                                                <span className="tj-eyebrow-text">
                                                    READY WHEN YOU ARE
                                                </span>

                                                <h3 className="fw-bold mt-2">
                                                    Your next stay starts here.
                                                </h3>

                                                <p className="text-muted mb-0">
                                                    Enter your destination and
                                                    dates above to discover
                                                    available hotels.
                                                </p>
                                            </Col>

                                            <Col md={5}>
                                                <Row className="text-center g-3">
                                                    <Col xs={4}>
                                                        <div className="fw-bold tj-teal-text">
                                                            Global
                                                        </div>

                                                        <div className="small text-muted">
                                                            Destinations
                                                        </div>
                                                    </Col>

                                                    <Col xs={4}>
                                                        <div className="fw-bold tj-teal-text">
                                                            Flexible
                                                        </div>

                                                        <div className="small text-muted">
                                                            Stay options
                                                        </div>
                                                    </Col>

                                                    <Col xs={4}>
                                                        <div className="fw-bold tj-teal-text">
                                                            Secure
                                                        </div>

                                                        <div className="small text-muted">
                                                            Booking flow
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </Card>
                                )}
                            </Col>
                        </Row>
                    </Container>
                </section>
            </main>

            {/* =============================================
                MOBILE FILTER OFFCANVAS
            ============================================= */}

            <Offcanvas
                show={showFilters}
                onHide={() => setShowFilters(false)}
                placement="start"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title className="fw-bold">
                        <FilterIcon /> Filters
                    </Offcanvas.Title>
                </Offcanvas.Header>

                <Offcanvas.Body>
                    <HotelFilters
                        filterRating={filterRating}
                        setFilterRating={setFilterRating}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        maxPrice={maxPrice}
                        filterAmenities={filterAmenities}
                        setFilterAmenities={setFilterAmenities}
                        allAmenities={allAmenities}
                        filterRefundable={filterRefundable}
                        setFilterRefundable={setFilterRefundable}
                        filterAvailable={filterAvailable}
                        setFilterAvailable={setFilterAvailable}
                        onReset={resetFilters}
                    />

                    <div className="d-grid mt-4">
                        <Button
                            className="tj-btn-primary fw-bold border-0"
                            onClick={() => setShowFilters(false)}
                        >
                            Show {filteredHotels.length} Results
                        </Button>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>

            {/* =============================================
                HOTEL SELECTED MODAL
            ============================================= */}
            <Modal
                show={!!selectedHotel}
                onHide={() => setSelectedHotel(null)}
                centered
                size="xl"
                fullscreen="xl-down"
                style={{ zIndex: 9999 }}
            >
                <Modal.Body className="p-0 overflow-hidden">
                    <div
                        className="overflow-auto"
                        style={{
                            maxHeight: '90vh',
                        }}
                    >

                        <HotelDetails
                            hotel={selectedHotel}
                            onBack={() => setSelectedHotel(null)}
                            checkIn={form.checkIn}
                            checkOut={form.checkOut}
                            rooms={form.rooms}
                            currency={form.currency}
                            nationality={form.nationality}
                            onSelectRoom={(option) => {
                                console.log('Selected room:', option);
                            }}
                            correlationId={correctionId}
                        />
                    </div>
                </Modal.Body>
            </Modal>

            {/* =============================================
                STYLES
            ============================================= */}

            <style jsx global>{`
                :root {
                    --tj-teal: #087f8c;
                    --tj-teal-dark: #066d78;
                    --tj-teal-light: #eafafa;
                }

                .tj-page {
                    background: #f5f7fa;
                    min-height: 100vh;
                }

                .tj-hero {
                    background: linear-gradient(
                        125deg,
                        #071b2c 0%,
                        #0a3344 52%,
                        #0b5360 100%
                    );
                    padding-bottom: 100px;
                }

                .tj-accent {
                    color: #72e2dc;
                }

                .tj-eyebrow-badge {
                    background: rgba(126, 229, 225, 0.15);
                    color: #7ee5e1;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 1.5px;
                    padding: 8px 14px;
                }

                .tj-eyebrow-text {
                    display: inline-block;
                    color: var(--tj-teal);
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                }

                .tj-search-wrap {
                    margin-top: -80px;
                    position: relative;
                    z-index: 20;
                }

                @media (max-width: 767.98px) {
                    .tj-search-wrap {
                        margin-top: -50px;
                    }
                }

                .tj-field {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border: 1px solid #e3e8ef;
                    border-radius: 14px;
                    background: #fff;
                    padding: 8px 12px;
                    min-height: 62px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }

                .tj-field:focus-within {
                    border-color: var(--tj-teal);
                    box-shadow: 0 0 0 3px rgba(8, 127, 140, 0.1);
                }

                .tj-field-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    flex: 0 0 36px;
                    border-radius: 10px;
                    background: var(--tj-teal-light);
                    color: var(--tj-teal);
                }

                .tj-field-icon svg {
                    width: 18px;
                    height: 18px;
                }

                .tj-inline-icon svg {
                    width: 16px;
                    height: 16px;
                }

                .tj-field-label {
                    display: block;
                    margin-bottom: 2px;
                    color: #7b8798;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .tj-field-input {
                    border: 0 !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    font-weight: 700;
                    font-size: 13px;
                }

                /* DESTINATION */
                .tj-destination-field {
                    position: relative;
                    z-index: 100;
                }

                .tj-destination-wrapper {
                    position: relative;
                    min-width: 0;
                }

                .tj-city-loading {
                    position: absolute;
                    right: 2px;
                    bottom: 3px;
                    z-index: 5;
                    color: var(--tj-teal);
                }

                .tj-city-loading .spinner-border {
                    width: 16px;
                    height: 16px;
                    border-width: 2px;
                }

                .tj-hids-status {
                    position: absolute;
                    right: 0;
                    bottom: 2px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--tj-teal);
                    font-size: 10px;
                    font-weight: 700;
                    background: #fff;
                    padding-left: 6px;
                }

                .tj-hids-status .spinner-border {
                    width: 14px;
                    height: 14px;
                    border-width: 2px;
                }

                .tj-city-suggestions {
                    position: absolute;
                    top: calc(100% + 12px);
                    left: -48px;
                    right: -12px;
                    z-index: 99999;
                    background: #fff;
                    border: 1px solid rgba(15, 23, 42, 0.08);
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
                    overflow-y: auto;
                    padding: 7px;
                    max-height: 320px;
                }

                .tj-city-suggestion {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: 0;
                    background: transparent;
                    padding: 12px 14px;
                    border-radius: 12px;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.18s ease, transform 0.18s ease;
                }

                .tj-city-suggestion:hover {
                    background: #f1f8fa;
                    transform: translateX(2px);
                }

                .tj-city-suggestion-icon {
                    width: 38px;
                    height: 38px;
                    flex: 0 0 38px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 11px;
                    background: rgba(8, 127, 140, 0.1);
                    color: var(--tj-teal);
                }

                .tj-city-suggestion-icon svg {
                    width: 18px;
                    height: 18px;
                }

                .tj-city-suggestion-content {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .tj-city-suggestion-content strong {
                    color: #111827;
                    font-size: 14px;
                    font-weight: 700;
                }

                .tj-city-suggestion-content small {
                    color: #6b7280;
                    font-size: 12px;
                }

                /* GUESTS */
                .tj-guest-toggle {
                    cursor: pointer;
                    user-select: none;
                }

                .tj-guest-toggle::after {
                    display: none;
                }

                .tj-guest-menu {
                    min-width: 300px;
                }

                .tj-counter-btn {
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--tj-teal);
                    line-height: 1;
                }

                /* BUTTONS */
                .tj-btn-primary {
                    background: var(--tj-teal);
                }

                .tj-btn-primary:hover,
                .tj-btn-primary:focus {
                    background: var(--tj-teal-dark);
                }

                .tj-btn-primary:disabled {
                    background: #6d9da3;
                    border-color: #6d9da3;
                    opacity: 0.8;
                }

                .tj-teal-text {
                    color: var(--tj-teal) !important;
                }

                /* HOTEL */
                .tj-star {
                    color: #d7dee7;
                }

                .tj-star.active {
                    color: #f2ae25;
                }

                .tj-hotel-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .tj-hotel-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.09) !important;
                }

                /* INSPIRATION */
                .tj-inspiration {
                    background: radial-gradient(
                            circle at 90% 0%,
                            rgba(66, 195, 196, 0.1),
                            transparent 35%
                        ),
                        #fff;
                }

                /* FILTER SIDEBAR */
                .tj-filter-card {
                    max-height: calc(100vh - 120px);
                    overflow-y: auto;
                }

                .tj-filter-sidebar {
                    font-size: 14px;
                }

                .tj-filter-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 22px;
                    height: 22px;
                    background: var(--tj-teal-light);
                    color: var(--tj-teal);
                    border-radius: 6px;
                    font-size: 12px;
                }

                .tj-filter-check .form-check-input:checked {
                    background-color: var(--tj-teal);
                    border-color: var(--tj-teal);
                }

                .tj-filter-check .form-check-input:focus {
                    border-color: var(--tj-teal);
                    box-shadow: 0 0 0 0.2rem rgba(8, 127, 140, 0.15);
                }

                .tj-filter-check label {
                    font-size: 13px;
                    color: #4b5563;
                }

                /* Responsive tweaks */
                @media (max-width: 991.98px) {
                    .tj-filter-card {
                        display: none;
                    }
                }

                @media (max-width: 767.98px) {
                    .tj-city-suggestions {
                        left: -48px;
                        right: -12px;
                    }
                }
            `}</style>
        </>
    );
}