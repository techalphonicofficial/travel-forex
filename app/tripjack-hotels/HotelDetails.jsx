'use client';

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';
import { useRouter } from 'next/navigation';

import {
    Container,
    Row,
    Col,
    Button,
    Modal,
    Accordion,
    Collapse
} from 'react-bootstrap';
import hotelService from '../services/hotelService';
import Swal from 'sweetalert2';

/* =========================================================
   SMALL HELPERS
   ========================================================= */

const plural = (n, word) =>
    `${n} ${word}${Number(n) === 1 ? '' : 's'}`;

const safeParse = (value) => {
    if (!value) return null;
    if (typeof value === 'object') return value;

    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object'
            ? parsed
            : null;
    } catch {
        return null;
    }
};

/*  Tripjack policy strings come glued together:
    "...per stayNew Year's Eve..." -> split into readable lines  */
const splitGlued = (text) =>
    String(text || '')
        .split(/(?<=[a-z0-9.)])(?=[A-Z][a-z])/)
        .map((line) => line.trim())
        .filter(Boolean);

const prettifyKey = (key) => {
    const text = String(key || '')
        .replace(/_/g, ' ')
        .trim();

    return text.charAt(0).toUpperCase() + text.slice(1);
};

const money = (value, currency = 'INR', digits = 0) => {
    if (
        value === null ||
        value === undefined ||
        Number.isNaN(Number(value))
    ) {
        return '—';
    }

    const amount = Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });

    return currency === 'INR'
        ? `₹${amount}`
        : `${currency} ${amount}`;
};

const formatDateTime = (value) => {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDate = (value) => {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const uniqueParts = (text) => {
    const seen = new Set();

    return String(text || '')
        .split(',')
        .map((part) => part.trim())
        .filter((part) => {
            const key = part.toLowerCase();
            if (!part || seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .join(', ');
};

const scrollToId = (id) => {
    if (typeof document === 'undefined') return;

    document
        .getElementById(id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* =========================================================
   TRIPJACK DATA HELPERS
   ========================================================= */

/*  links can be XXL / Original / Standard / Unknown ...  */
const getImageUrl = (image) => {
    const links = image?.links || {};

    return (
        links.XXL?.href ||
        links.Original?.href ||
        links.Standard?.href ||
        links.XL?.href ||
        Object.values(links)[0]?.href ||
        null
    );
};

const getImages = (hotel) => {
    const list =
        Array.isArray(hotel?.images) && hotel.images.length
            ? hotel.images
            : Array.isArray(hotel?.hotelContent?.images)
                ? hotel.hotelContent.images
                : [];

    const hero = list.find((image) => image?.is_hero_image);

    const urls = [
        typeof hotel?.image === 'string' ? hotel.image : null,
        getImageUrl(hero),
        ...list.map(getImageUrl)
    ].filter(Boolean);

    return [...new Set(urls)];
};

/*  amenities is an OBJECT {"0": {...}, "1": {...}} not an array,
    and has duplicates (Wheelchair Accessible x12 etc.)  */
const getAmenities = (hotel) => {
    const raw =
        hotel?.hotelContent?.amenities ?? hotel?.amenities ?? [];

    const list = Array.isArray(raw)
        ? raw
        : Object.values(raw || {});

    const seen = new Set();

    return list
        .map((item) =>
            typeof item === 'string'
                ? item
                : item?.name || item?.description
        )
        .filter(Boolean)
        .filter((name) => {
            const key = name.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

const getDescriptions = (hotel) => {
    const descriptions =
        hotel?.hotelContent?.descriptions || {};

    const fromDefault = safeParse(descriptions.default) || {};

    const direct = Object.fromEntries(
        Object.entries(descriptions).filter(
            ([key, value]) => key !== 'default' && value
        )
    );

    return { ...fromDefault, ...direct };
};

const parseDistances = (text) => {
    if (!text) return { places: [], airports: [] };

    const clean = String(text).replace(
        /Distances are displayed.*?kilometer\.?/i,
        ''
    );

    const [placesPart, airportsPart = ''] = clean.split(
        /The nearest airports are:/i
    );

    const parse = (chunk) =>
        Array.from(
            chunk.matchAll(
                /\s*(.+?)\s-\s(\d+(?:\.\d+)?\s*km\s*\/\s*\d+(?:\.\d+)?\s*mi)/g
            )
        ).map((match) => ({
            name: match[1].trim(),
            distance: match[2].trim()
        }));

    return {
        places: parse(placesPart),
        airports: parse(airportsPart)
    };
};

const policyBlocks = (raw) => {
    if (!raw) return [];

    const parsed = safeParse(raw);

    if (!parsed) {
        return [{ title: null, items: splitGlued(raw) }];
    }

    return Object.entries(parsed)
        .filter(([, value]) => value)
        .map(([key, value]) => ({
            title: prettifyKey(key),
            items: splitGlued(value)
        }));
};

const getOptionTotal = (option) => {
    const value =
        option?.pricing?.totalPrice ??
        option?.price?.totalPrice ??
        null;

    return value === null ? null : Number(value);
};

const getGuestTotals = (option) => {
    const rooms = Array.isArray(option?.roomInfo)
        ? option.roomInfo
        : [];

    return rooms.reduce(
        (acc, room) => ({
            rooms: acc.rooms + 1,
            adults: acc.adults + (Number(room?.adults) || 0),
            children: acc.children + (Number(room?.children) || 0)
        }),
        { rooms: 0, adults: 0, children: 0 }
    );
};

const guestText = (room) => {
    const parts = [plural(room?.adults || 0, 'adult')];

    if (room?.children > 0) {
        parts.push(
            `${room.children} ${room.children === 1 ? 'child' : 'children'}`
        );
    }

    return parts.join(', ');
};

const describeCancellation = (option) => {
    const cancellation = option?.cancellation;
    const currency = option?.pricing?.currency || 'INR';

    if (!cancellation) {
        return {
            tone: 'muted',
            summary: 'Cancellation policy not provided',
            lines: []
        };
    }

    const penalties = Array.isArray(cancellation.penalties)
        ? cancellation.penalties
        : [];

    const lines = penalties.map((penalty) => {
        const from = formatDateTime(penalty?.from);
        const to = formatDateTime(penalty?.to);
        const amount = money(penalty?.amount, currency, 2);

        return `${from}${to ? ` to ${to}` : ''}: ${amount} cancellation charge`;
    });

    if (cancellation.isRefundable) {
        const firstPenalty = penalties[0]?.from;

        return {
            tone: 'good',
            summary: firstPenalty
                ? `Free cancellation until ${formatDateTime(firstPenalty)}`
                : 'Free cancellation available',
            lines
        };
    }

    return {
        tone: 'bad',
        summary: 'Non-refundable — full amount is charged on cancellation',
        lines
    };
};

const getInclusions = (option) =>
    (Array.isArray(option?.inclusions) ? option.inclusions : [])
        .map((item) =>
            typeof item === 'string' ? item : item?.name || item?.description
        )
        .filter(Boolean);

const buildViewModel = (hotel) => {
    const content = hotel?.hotelContent || {};
    const locale = content.locale || {};
    const address = locale.address || {};
    const coords = locale.coordinates || {};

    const options = Array.isArray(hotel?.options) ? hotel.options : [];

    const priced = options.filter(
        (option) => getOptionTotal(option) !== null
    );

    const cheapest = priced.length
        ? priced.reduce((a, b) =>
            getOptionTotal(b) < getOptionTotal(a) ? b : a
        )
        : options[0] || null;

    const currency =
        cheapest?.pricing?.currency ||
        cheapest?.price?.currency ||
        hotel?.currency ||
        'INR';

    /* ---------- descriptions ---------- */

    const descs = getDescriptions(hotel);
    const rawDefault = content?.descriptions?.default;
    const plainDefault =
        rawDefault && !safeParse(rawDefault) ? String(rawDefault) : '';

    const headline = descs.headline ? String(descs.headline) : '';

    const overview =
        (headline.length > 90 ? headline : '') ||
        plainDefault ||
        hotel?.description ||
        content?.description ||
        '';

    const tagline =
        headline && headline.length <= 90 ? headline : '';

    const infoBlocks = [
        { key: 'rooms', title: 'Rooms' },
        { key: 'dining', title: 'Dining' },
        { key: 'amenities', title: 'Facilities & activities' },
        { key: 'business_amenities', title: 'Business & parking' }
    ]
        .map((block) => ({ ...block, text: descs[block.key] }))
        .filter((block) => block.text);

    /* ---------- location ---------- */

    const rawAddress =
        address.fulladdr ||
        [address.line_1, address.city, address.countryname]
            .filter(Boolean)
            .join(', ');

    const lat = Number(coords.lat);
    const lng = Number(coords.long ?? coords.lng);
    const hasCoords =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        (lat !== 0 || lng !== 0);

    /* ---------- policies ---------- */

    const policies = content.policies || {};
    const checkIn = policies.checkInCheckOut || {};

    /* ---------- room groups ---------- */

    const groupMap = new Map();

    options.forEach((option) => {
        const rooms = Array.isArray(option?.roomInfo)
            ? option.roomInfo
            : [];

        const key =
            rooms.map((room) => room?.id || room?.name).join('|') ||
            option?.roomName ||
            option?.name ||
            option?.optionId ||
            'room';

        if (!groupMap.has(key)) {
            const counts = new Map();

            rooms.forEach((room) => {
                const name = room?.name || 'Room';
                counts.set(name, (counts.get(name) || 0) + 1);
            });

            const title =
                [...counts.entries()]
                    .map(([name, count]) =>
                        count > 1 ? `${name} × ${count}` : name
                    )
                    .join(' + ') ||
                option?.roomName ||
                option?.name ||
                'Room';

            groupMap.set(key, { key, title, rooms, plans: [] });
        }

        groupMap.get(key).plans.push(option);
    });

    const groups = [...groupMap.values()].map((group) => ({
        ...group,
        plans: [...group.plans].sort(
            (a, b) =>
                (getOptionTotal(a) ?? Infinity) -
                (getOptionTotal(b) ?? Infinity)
        )
    }));

    const allNonRefundable =
        options.length > 0 &&
        options.every((option) => option?.cancellation?.isRefundable === false);

    const distances = parseDistances(descs.attractions);

    const languages = String(descs.spoken_languages || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    const payments = String(descs.onsite_payments || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    const chainName =
        content?.chain?.name && content.chain.name !== 'None'
            ? content.chain.name
            : '';

    const stars = Math.max(
        0,
        Math.min(
            5,
            Math.round(
                Number(
                    content.star_rating ||
                    hotel?.starRating ||
                    hotel?.rating ||
                    hotel?.hotelRating ||
                    0
                )
            ) || 0
        )
    );

    return {
        name: hotel?.name || hotel?.hotelName || content?.name || 'Hotel',
        stars,
        propertyType: content?.property_type?.name || '',
        chainName,
        brandName: content?.chain?.brand?.name || '',
        tagline,
        overview,
        infoBlocks,
        address: uniqueParts(rawAddress),
        phone: Array.isArray(locale.phone) ? locale.phone[0] : locale.phone || '',
        lat,
        lng,
        hasCoords,
        locationText: descs.location || '',
        distances,
        images: getImages(hotel),
        amenities: getAmenities(hotel),
        options,
        groups,
        cheapest,
        currency,
        allNonRefundable,
        checkIn,
        feesBlocks: policyBlocks(policies.mandatory_fees),
        instructionBlocks: policyBlocks(policies.special_instructions),
        knowBlocks: policyBlocks(policies.know_before_you_go),
        languages,
        payments
    };
};

/* =========================================================
   ICONS
   ========================================================= */

const ICONS = {
    pin: (
        <>
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </>
    ),
    back: <path d="m15 18-6-6 6-6" />,
    left: <path d="m15 18-6-6 6-6" />,
    right: <path d="m9 18 6-6-6-6" />,
    check: <path d="M20 6 9 17l-5-5" />,
    clock: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
        </>
    ),
    phone: (
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    ),
    camera: (
        <>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
            <circle cx="12" cy="13" r="4" />
        </>
    ),
    user: (
        <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </>
    )
};

const Icon = ({ name, size = 16 }) => (
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
        focusable="false"
    >
        {ICONS[name]}
    </svg>
);

const Stars = ({ count }) =>
    count > 0 ? (
        <span
            className="hd-stars"
            role="img"
            aria-label={`${count} star hotel`}
        >
            {Array.from({ length: count }, (_, i) => (
                <span key={i}>★</span>
            ))}
        </span>
    ) : null;

const SafeImg = ({ src, alt, className = '', ...rest }) => {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return (
            <div
                className={`hd-img-fallback ${className}`}
                role="img"
                aria-label={alt}
            >
                Photo unavailable
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            loading="lazy"
            onError={() => setFailed(true)}
            {...rest}
        />
    );
};

/* =========================================================
   POLICY BLOCKS
   ========================================================= */

const PolicyBlocks = ({ blocks }) => (
    <div className="d-flex flex-column gap-3">
        {blocks.map((block, index) => (
            <div key={`${block.title}-${index}`}>
                {block.title && (
                    <div className="fw-semibold mb-1">{block.title}</div>
                )}

                <ul className="hd-plain-list">
                    {block.items.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            </div>
        ))}
    </div>
);

/* =========================================================
   ROOM PLAN ROW
   ========================================================= */

const PlanRow = ({
    option,
    isLowest,
    open,
    onToggle,
    onSelect,
    nights
}) => {
    const pricing = option?.pricing || option?.price || {};
    const currency = pricing.currency || 'INR';
    const total = getOptionTotal(option);
    const cancel = describeCancellation(option);
    const inclusions = getInclusions(option);
    const compliance = option?.compliance || {};
    const meal = option?.mealBasis || option?.mealType;

    const perNight =
        nights && total !== null ? total / nights : null;

    return (
        <div className={`hd-plan ${isLowest ? 'is-lowest' : ''}`}>
            <div className="hd-plan-main">
                <div className="hd-chips mb-2">
                    {meal && (
                        <span className="hd-chip hd-chip-meal">
                            {meal}
                        </span>
                    )}

                    {option?.cancellation && (
                        <span
                            className={`hd-chip ${option.cancellation.isRefundable
                                ? 'hd-chip-good'
                                : 'hd-chip-bad'
                                }`}
                        >
                            {option.cancellation.isRefundable
                                ? 'Refundable'
                                : 'Non-refundable'}
                        </span>
                    )}

                    {inclusions.map((item) => (
                        <span className="hd-chip" key={item}>
                            {item}
                        </span>
                    ))}

                    {compliance.passportRequired && (
                        <span className="hd-chip hd-chip-quiet">
                            Passport required
                        </span>
                    )}

                    {compliance.panRequired && (
                        <span className="hd-chip hd-chip-quiet">
                            PAN required
                        </span>
                    )}

                    {isLowest && (
                        <span className="hd-chip hd-chip-accent">
                            Lowest price
                        </span>
                    )}
                </div>

                <div className={`hd-cancel hd-cancel-${cancel.tone}`}>
                    {cancel.summary}
                </div>

                <button
                    type="button"
                    className="hd-link mt-2"
                    onClick={onToggle}
                    aria-expanded={open}
                >
                    {open ? 'Hide' : 'Show'} price breakdown & cancellation
                </button>

                <Collapse in={open}>
                    <div>
                        <div className="hd-breakdown">
                            <dl>
                                <div>
                                    <dt>Room price</dt>
                                    <dd>{money(pricing.basePrice, currency, 2)}</dd>
                                </div>

                                <div>
                                    <dt>Taxes</dt>
                                    <dd>{money(pricing.taxes, currency, 2)}</dd>
                                </div>

                                {Number(pricing.mf) > 0 && (
                                    <div>
                                        <dt>Service fee</dt>
                                        <dd>{money(pricing.mf, currency, 2)}</dd>
                                    </div>
                                )}

                                {Number(pricing.mft) > 0 && (
                                    <div>
                                        <dt>Tax on service fee</dt>
                                        <dd>{money(pricing.mft, currency, 2)}</dd>
                                    </div>
                                )}

                                {Number(pricing.discount) > 0 && (
                                    <div>
                                        <dt>Discount</dt>
                                        <dd>
                                            −{money(pricing.discount, currency, 2)}
                                        </dd>
                                    </div>
                                )}

                                <div className="hd-breakdown-total">
                                    <dt>Total</dt>
                                    <dd>{money(total, currency, 2)}</dd>
                                </div>
                            </dl>

                            {cancel.lines.length > 0 && (
                                <div className="hd-penalties">
                                    <div className="fw-semibold mb-1">
                                        Cancellation charges
                                    </div>

                                    <ul>
                                        {cancel.lines.map((line) => (
                                            <li key={line}>{line}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </Collapse>
            </div>

            <div className="hd-plan-price">
                <div className="hd-price">
                    {money(total, currency)}
                </div>

                <div className="hd-price-note">
                    Total, taxes & fees included
                </div>

                {perNight !== null && (
                    <div className="hd-price-note">
                        ≈ {money(perNight, currency)} / night
                    </div>
                )}

                <Button
                    variant="success"
                    className="hd-btn mt-2"
                    onClick={() => onSelect?.(option)}
                >
                    Select room
                </Button>
            </div>
        </div>
    );
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

const HotelDetails = ({
    hotel,
    onBack,
    checkIn,
    checkOut,
    rooms = [],
    currency = 'INR',
    nationality,
    correlationId
}) => {
   const router=useRouter()
    const [photoIndex, setPhotoIndex] = useState(null);
    const [openPlan, setOpenPlan] = useState(null);
    const [showAllAmenities, setShowAllAmenities] = useState(false);
    const [amenityQuery, setAmenityQuery] = useState('');
    const [activeSection, setActiveSection] = useState('overview');
    const [pricingLoading, setPricingLoading] = useState(false);
    const [pricingError, setPricingError] = useState('');
    const [pricingData, setPricingData] = useState(null);
    const [reviewHash, setReviewHash] = useState(null)

    const pricedHotel = useMemo(() => {
        if (!hotel) return null;

        const pricingRoot =
            pricingData?.data ||
            pricingData?.result ||
            pricingData;

        const pricingOptions =
            pricingRoot?.options ||
            pricingRoot?.roomOptions ||
            pricingRoot?.rooms ||
            [];

        if (!Array.isArray(pricingOptions) || pricingOptions.length === 0) {
            return hotel;
        }

        return {
            ...hotel,

            options: pricingOptions,

            // Pricing response ke metadata preserve karo
            correlationId:
                correlationId,

            reviewHash:
                pricingRoot?.reviewHash ||
                hotel?.reviewHash,
        };
    }, [hotel, pricingData]);

    const vm = useMemo(
        () => (pricedHotel ? buildViewModel(pricedHotel) : null),
        [pricedHotel]
    );
    const imageCount = vm?.images.length || 0;

    const nights = useMemo(() => {
        if (!checkIn || !checkOut) return null;

        const diff = Math.round(
            (new Date(checkOut) - new Date(checkIn)) / 86400000
        );

        return diff > 0 ? diff : null;
    }, [checkIn, checkOut]);

    const openGallery = useCallback((index = 0) => {
        setPhotoIndex(index);
    }, []);

    const closeGallery = useCallback(() => setPhotoIndex(null), []);

    const nextPhoto = useCallback(() => {
        setPhotoIndex((current) =>
            current === null || !imageCount
                ? current
                : (current + 1) % imageCount
        );
    }, [imageCount]);

    const prevPhoto = useCallback(() => {
        setPhotoIndex((current) =>
            current === null || !imageCount
                ? current
                : (current - 1 + imageCount) % imageCount
        );
    }, [imageCount]);

    //fetching real time pricing 

    useEffect(() => {
        if (!hotel) return;
        const hid =
            hotel?.hid ||
            hotel?.hotelId ||
            hotel?.id;


        if (!correlationId) {
            setPricingError('Pricing correlationId is missing.');
            return;
        }

        // if (!hid) {
        //     setPricingError('Hotel ID is missing.');
        //     return;
        // }

        if (!checkIn || !checkOut) {
            setPricingError('Check-in and check-out dates are required.');
            return;
        }

        if (!nationality) {
            setPricingError('Nationality is required.');
            return;
        }

        let cancelled = false;

        const fetchPricing = async () => {
            setPricingLoading(true);
            setPricingError('');
            setPricingData(null);

            try {
                const pricingRooms = rooms.map((room) => {
                    const built = {
                        adults: Number(room?.adults) || 1,
                    };

                    if (Number(room?.children) > 0) {
                        built.children = Number(room.children);

                        built.childAge = (room.childAges || []).map((age) =>
                            Number(age)
                        );
                    }

                    return built;
                });

                const payload = {
                    correlationId,
                    hid: String(hid),
                    checkIn,
                    checkOut,
                    rooms: pricingRooms,
                    currency,
                    nationality: String(nationality),
                    timeoutMs: 13000,
                };


                const response = await hotelService.pricing(payload);
                console.log(response.data.hotelId + "," + hotel.hotelId)
                setReviewHash(response.data.reviewHash)
                if (cancelled) return;
                setPricingData(response);
            } catch (error) {
                if (cancelled) return;

                console.error('Hotel pricing error:', error);

                const apiError = error?.response?.data;

                const message =
                    apiError?.message ||
                    apiError?.error ||
                    apiError?.errors?.[0]?.message ||
                    error?.message ||
                    'Unable to fetch hotel pricing.';

                setPricingError(message);
            } finally {
                if (!cancelled) {
                    setPricingLoading(false);
                }
            }
        };

        fetchPricing();

        return () => {
            cancelled = true;
        };
    }, [
        hotel,
        checkIn,
        checkOut,
        rooms,
        currency,
        nationality,
    ]);

    /* keyboard arrows inside the lightbox */
    useEffect(() => {
        if (photoIndex === null) return undefined;

        const onKey = (event) => {
            if (event.key === 'ArrowRight') nextPhoto();
            if (event.key === 'ArrowLeft') prevPhoto();
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [photoIndex, nextPhoto, prevPhoto]);

    /* highlight the section that is currently in view */
    useEffect(() => {
        if (!vm || typeof IntersectionObserver === 'undefined') {
            return undefined;
        }

        const elements = [
            'overview',
            'rooms',
            'amenities',
            'location',
            'policies'
        ]
            .map((id) => document.getElementById(id))
            .filter(Boolean);

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top -
                            b.boundingClientRect.top
                    )[0];

                if (visible) setActiveSection(visible.target.id);
            },
            { rootMargin: '-110px 0px -60% 0px', threshold: 0 }
        );

        elements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, [vm]);

    /* ---------- not found ---------- */

    if (!hotel || !vm) {
        return (
            <Container className="py-5">
                <style>{STYLES}</style>

                <div className="hd-root hd-card text-center py-5 px-3">
                    <h5 className="mb-2">Hotel not found</h5>

                    <p className="text-muted mb-3">
                        We couldn&apos;t load the selected hotel. Please go back and
                        try again.
                    </p>

                    {onBack && (
                        <Button
                            variant="success"
                            className="hd-btn"
                            onClick={onBack}
                        >
                            Back to hotels
                        </Button>
                    )}
                </div>
            </Container>
        );
    }

    /* ---------- derived ---------- */

    const {
        name,
        stars,
        images,
        options,
        groups,
        cheapest,
        // currency,
        amenities
    } = vm;

    const visibleCount =
        images.length >= 5 ? 5 : images.length >= 3 ? 3 : images.length;

    const galleryImages = images.slice(0, visibleCount);

    const cheapestTotal = cheapest ? getOptionTotal(cheapest) : null;
    const cheapestGuests = cheapest ? getGuestTotals(cheapest) : null;
    const cheapestCancel = cheapest ? describeCancellation(cheapest) : null;

    const lowestId = cheapest?.optionId;

    const filteredAmenities = amenities.filter((item) =>
        item.toLowerCase().includes(amenityQuery.trim().toLowerCase())
    );

    const shownAmenities =
        showAllAmenities || amenityQuery
            ? filteredAmenities
            : filteredAmenities.slice(0, 18);

    const facts = [
        vm.checkIn.checkin_from && {
            icon: 'clock',
            label: 'Check-in',
            value: `From ${vm.checkIn.checkin_from}`
        },
        vm.checkIn.checkout_from && {
            icon: 'clock',
            label: 'Check-out',
            value: vm.checkIn.checkout_from
        },
        vm.checkIn.checkin_min_age && {
            icon: 'user',
            label: 'Minimum check-in age',
            value: `${vm.checkIn.checkin_min_age} years`
        },
        vm.phone && {
            icon: 'phone',
            label: 'Hotel phone',
            value: vm.phone,
            href: `tel:${String(vm.phone).replace(/[^\d+]/g, '')}`
        }
    ].filter(Boolean);

    const hasLocation =
        vm.hasCoords ||
        vm.distances.places.length > 0 ||
        vm.distances.airports.length > 0 ||
        vm.locationText;

    const hasPolicies =
        facts.length > 0 ||
        vm.feesBlocks.length > 0 ||
        vm.instructionBlocks.length > 0 ||
        vm.knowBlocks.length > 0 ||
        vm.languages.length > 0 ||
        vm.payments.length > 0 ||
        options.length > 0;

    const navItems = [
        { id: 'overview', label: 'Overview' },
        { id: 'rooms', label: 'Rooms' },
        amenities.length > 0 && { id: 'amenities', label: 'Amenities' },
        hasLocation && { id: 'location', label: 'Location' },
        hasPolicies && { id: 'policies', label: 'Policies' }
    ].filter(Boolean);

    const mapsLink = vm.hasCoords
        ? `https://www.google.com/maps/search/?api=1&query=${vm.lat},${vm.lng}`
        : vm.address
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${name} ${vm.address}`
            )}`
            : null;

    const thumbStart = Math.max(0, (photoIndex ?? 0) - 8);
    const thumbEnd = Math.min(imageCount, (photoIndex ?? 0) + 9);

    /* =====================================================
       RENDER
       ===================================================== */




    //Handle hotel selection 
    const onSelectRoom = async (option) => {
        try {
            const payload = {
                optionId: option?.optionId,
                reviewHash: pricingData?.reviewHash || reviewHash,
                correlationId:
                    pricingData?.correlationId || correlationId,
                hid: String(
                    hotel?.tjHotelId ||
                    hotel?.hotelId ||
                    hotel?.hid
                ),
            };

            const response = await hotelService.review(payload);

            console.log('Review Response:', response);

            const reviewData = response?.data;

            // OPTION SOLD OUT
            const soldOutError =
                reviewData?.errors?.find(
                    (error) =>
                        error?.errorType === 'OPTION_SOLD_OUT'
                );

            if (soldOutError) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Room No Longer Available',
                    text: 'This room option is no longer available. Please select another room.',
                    confirmButtonText: 'Choose Another Room',
                    confirmButtonColor: '#198754',
                });

                return;
            }

            // OTHER TRIPJACK ERRORS
            if (reviewData?.status?.success === false) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Unable to Continue',
                    text:
                        reviewData?.errors?.[0]?.message ||
                        'Unable to review this room. Please try again.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#198754',
                });

                return;
            }

            // ==========================================
            // REVIEW SUCCESS
            // ==========================================

            console.log(
                'Review Successful:',
                reviewData
            );

            /*
             * Guest Details page ke liye complete context save
             */
            const bookingContext = {
                hotel: {
                    hotelId: String(
                        hotel?.tjHotelId ||
                        hotel?.hotelId ||
                        hotel?.hid ||
                        ''
                    ),
                    hotelName:
                        hotel?.name ||
                        hotel?.hotelName ||
                        '',
                },

                search: {
                    checkIn,
                    checkOut,
                    rooms,
                    currency,
                    nationality,
                },

                review: reviewData,

                selectedOption: option,

                correlationId:
                    pricingData?.correlationId ||
                    correlationId,

                reviewHash:
                    pricingData?.reviewHash ||
                    reviewHash,
            };

            sessionStorage.setItem(
                'tripjack_booking_context',
                JSON.stringify(bookingContext)
            );

            // Guest Details page
            router.push(
                '/tripjack-hotels/guest-details'
            );

        } catch (error) {
            console.error(
                'Hotel Review Error:',
                error
            );

            await Swal.fire({
                icon: 'error',
                title: 'Something Went Wrong',
                text:
                    error?.response?.data?.message ||
                    error?.message ||
                    'Unable to review the selected room. Please try again.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#198754',
            });
        }
    };

    return (
        <div className="hd-root">
            <style>{STYLES}</style>

            <Container className="pt-3 pt-lg-4 pb-5">
                {/* ---------- back ---------- */}

                {onBack && (
                    <button
                        type="button"
                        className="hd-back mb-3"
                        onClick={onBack}
                    >
                        <Icon name="back" />
                        Back to hotels
                    </button>
                )}

                {/* ---------- header ---------- */}

                <header className="hd-card hd-header mb-3">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        {vm.propertyType && (
                            <span className="hd-chip hd-chip-quiet">
                                {vm.propertyType}
                            </span>
                        )}

                        {vm.chainName && (
                            <span className="hd-chip hd-chip-quiet">
                                {vm.brandName
                                    ? `${vm.chainName} · ${vm.brandName}`
                                    : vm.chainName}
                            </span>
                        )}
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3">
                        <h1 className="hd-title">{name}</h1>
                        <Stars count={stars} />
                    </div>

                    {vm.tagline && (
                        <p className="hd-tagline">{vm.tagline}</p>
                    )}

                    <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
                        {vm.address && (
                            <span className="hd-meta">
                                <Icon name="pin" />
                                {vm.address}
                            </span>
                        )}

                        {mapsLink && (
                            <a
                                className="hd-link"
                                href={mapsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View on map
                            </a>
                        )}
                    </div>
                </header>

                {/* ---------- gallery ---------- */}

                {galleryImages.length > 0 && (
                    <div className="hd-gallery-wrap mb-3">
                        <div
                            className={`hd-gallery hd-g-${galleryImages.length}`}
                        >
                            {galleryImages.map((src, index) => (
                                <button
                                    type="button"
                                    key={src}
                                    className={`hd-cell ${index === 0 ? 'is-main' : ''
                                        } ${index > 0 ? 'd-none d-md-block' : ''}`}
                                    onClick={() => openGallery(index)}
                                    aria-label={`Open photo ${index + 1} of ${images.length}`}
                                >
                                    <SafeImg
                                        src={src}
                                        alt={`${name} photo ${index + 1}`}
                                        loading={index === 0 ? 'eager' : 'lazy'}
                                    />
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="hd-allphotos"
                            onClick={() => openGallery(0)}
                        >
                            <Icon name="camera" />
                            {images.length > 1
                                ? `View all ${images.length} photos`
                                : 'View photo'}
                        </button>
                    </div>
                )}

                {/* ---------- section nav ---------- */}

                <nav className="hd-nav mb-3" aria-label="Page sections">
                    {navItems.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={`hd-nav-item ${activeSection === item.id ? 'is-active' : ''
                                }`}
                            onClick={() => scrollToId(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <Row className="g-4">
                    {/* =================================================
                        LEFT
                    ================================================= */}

                    <Col xs={12} lg={8}>
                        {/* ---------- overview ---------- */}

                        <section id="overview" className="hd-card hd-section">
                            <h2 className="hd-h2">About this hotel</h2>

                            {vm.overview ? (
                                <p className="hd-body">{vm.overview}</p>
                            ) : (
                                vm.infoBlocks.length === 0 && (
                                    <p className="text-muted mb-0">
                                        Hotel description is not available.
                                    </p>
                                )
                            )}

                            {facts.length > 0 && (
                                <div className="hd-facts">
                                    {facts.map((fact) => (
                                        <div
                                            className="hd-fact"
                                            key={fact.label}
                                        >
                                            <span className="hd-fact-icon">
                                                <Icon name={fact.icon} />
                                            </span>

                                            <div>
                                                <div className="hd-fact-label">
                                                    {fact.label}
                                                </div>

                                                {fact.href ? (
                                                    <a
                                                        className="hd-fact-value"
                                                        href={fact.href}
                                                    >
                                                        {fact.value}
                                                    </a>
                                                ) : (
                                                    <div className="hd-fact-value">
                                                        {fact.value}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {vm.infoBlocks.length > 0 && (
                                <div className="hd-info-grid">
                                    {vm.infoBlocks.map((block) => (
                                        <div key={block.key}>
                                            <h3 className="hd-h3">
                                                {block.title}
                                            </h3>

                                            <p className="hd-body mb-0">
                                                {block.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>


                        {pricingLoading && (
                            <div className="text-center py-5">
                                <div
                                    className="spinner-border text-success mb-3"
                                    role="status"
                                >
                                    <span className="visually-hidden">
                                        Loading...
                                    </span>
                                </div>

                                <div className="fw-semibold">
                                    Fetching latest room prices...
                                </div>

                                <div className="text-muted small mt-1">
                                    Please wait while we check availability.
                                </div>
                            </div>
                        )}

                        {pricingError && !pricingLoading && (
                            <div className="alert alert-danger">
                                <div className="fw-semibold mb-1">
                                    Unable to load room pricing
                                </div>

                                <div className="small">
                                    {pricingError}
                                </div>
                            </div>
                        )}

                        {/* ---------- rooms ---------- */}

                        <section id="rooms" className="hd-card hd-section">
                            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                                <h2 className="hd-h2 mb-0">Choose your room</h2>

                                {options.length > 0 && (
                                    <span className="hd-chip hd-chip-quiet">
                                        {plural(options.length, 'option')}
                                    </span>
                                )}
                            </div>

                            {options.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    No rooms are available for these dates.
                                    {onBack && (
                                        <div className="mt-3">
                                            <Button
                                                variant="outline-success"
                                                className="hd-btn"
                                                onClick={onBack}
                                            >
                                                Change search
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {groups.map((group) => (
                                        <div className="hd-room" key={group.key}>
                                            <div className="hd-room-head">
                                                <h3 className="hd-room-title">
                                                    {group.title}
                                                </h3>

                                                <div className="hd-chips">
                                                    {group.rooms.map(
                                                        (room, index) => (
                                                            <span
                                                                className="hd-chip hd-chip-quiet"
                                                                key={index}
                                                            >
                                                                <Icon
                                                                    name="user"
                                                                    size={13}
                                                                />
                                                                {group.rooms
                                                                    .length > 1
                                                                    ? `Room ${index + 1
                                                                    }: `
                                                                    : ''}
                                                                {guestText(room)}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            <div className="hd-plans">
                                                {group.plans.map(
                                                    (option, index) => {
                                                        const planKey =
                                                            option?.optionId ||
                                                            `${group.key}-${index}`;

                                                        return (
                                                            <PlanRow
                                                                key={planKey}
                                                                option={option}
                                                                nights={nights}
                                                                isLowest={
                                                                    options.length >
                                                                    1 &&
                                                                    option?.optionId ===
                                                                    lowestId
                                                                }
                                                                open={
                                                                    openPlan ===
                                                                    planKey
                                                                }
                                                                onToggle={() =>
                                                                    setOpenPlan(
                                                                        (current) =>
                                                                            current ===
                                                                                planKey
                                                                                ? null
                                                                                : planKey
                                                                    )
                                                                }
                                                                onSelect={
                                                                    onSelectRoom
                                                                }
                                                            />
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ---------- amenities ---------- */}

                        {amenities.length > 0 && (
                            <section
                                id="amenities"
                                className="hd-card hd-section"
                            >
                                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                    <h2 className="hd-h2 mb-0">
                                        Amenities
                                        <span className="hd-count">
                                            {amenities.length}
                                        </span>
                                    </h2>

                                    {amenities.length > 18 && (
                                        <input
                                            type="search"
                                            className="hd-search"
                                            placeholder="Search amenities"
                                            value={amenityQuery}
                                            onChange={(event) =>
                                                setAmenityQuery(
                                                    event.target.value
                                                )
                                            }
                                            aria-label="Search amenities"
                                        />
                                    )}
                                </div>

                                {shownAmenities.length === 0 ? (
                                    <p className="text-muted mb-0">
                                        No amenity matches your search.
                                    </p>
                                ) : (
                                    <ul className="hd-amenities">
                                        {shownAmenities.map((item) => (
                                            <li key={item}>
                                                <Icon name="check" size={15} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {!amenityQuery &&
                                    filteredAmenities.length > 18 && (
                                        <Button
                                            variant="outline-success"
                                            className="hd-btn mt-3"
                                            onClick={() =>
                                                setShowAllAmenities(
                                                    (value) => !value
                                                )
                                            }
                                        >
                                            {showAllAmenities
                                                ? 'Show fewer'
                                                : `Show all ${filteredAmenities.length} amenities`}
                                        </Button>
                                    )}
                            </section>
                        )}

                        {/* ---------- location ---------- */}

                        {hasLocation && (
                            <section
                                id="location"
                                className="hd-card hd-section"
                            >
                                <h2 className="hd-h2">Location</h2>

                                {vm.address && (
                                    <p className="hd-meta mb-2">
                                        <Icon name="pin" />
                                        {vm.address}
                                    </p>
                                )}

                                {vm.locationText && (
                                    <p className="hd-body">
                                        {vm.locationText}
                                    </p>
                                )}

                                {vm.hasCoords && (
                                    <div className="hd-map">
                                        <iframe
                                            title={`Map of ${name}`}
                                            src={`https://www.google.com/maps?q=${vm.lat},${vm.lng}&z=15&output=embed`}
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            allowFullScreen
                                        />
                                    </div>
                                )}

                                {mapsLink && (
                                    <a
                                        className="btn btn-outline-success hd-btn mt-3"
                                        href={mapsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Open in Google Maps
                                    </a>
                                )}

                                {(vm.distances.places.length > 0 ||
                                    vm.distances.airports.length > 0) && (
                                        <div className="hd-distances">
                                            {vm.distances.places.length > 0 && (
                                                <div>
                                                    <h3 className="hd-h3">
                                                        What&apos;s nearby
                                                    </h3>

                                                    <ul className="hd-dist-list">
                                                        {vm.distances.places.map(
                                                            (place) => (
                                                                <li
                                                                    key={`${place.name}-${place.distance}`}
                                                                >
                                                                    <span>
                                                                        {place.name}
                                                                    </span>
                                                                    <span className="hd-dist">
                                                                        {place.distance}
                                                                    </span>
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {vm.distances.airports.length > 0 && (
                                                <div>
                                                    <h3 className="hd-h3">
                                                        Nearest airports
                                                    </h3>

                                                    <ul className="hd-dist-list">
                                                        {vm.distances.airports.map(
                                                            (place) => (
                                                                <li
                                                                    key={`${place.name}-${place.distance}`}
                                                                >
                                                                    <span>
                                                                        {place.name}
                                                                    </span>
                                                                    <span className="hd-dist">
                                                                        {place.distance}
                                                                    </span>
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </section>
                        )}

                        {/* ---------- policies ---------- */}

                        {hasPolicies && (
                            <section
                                id="policies"
                                className="hd-card hd-section"
                            >
                                <h2 className="hd-h2">Policies & good to know</h2>

                                <Accordion
                                    flush
                                    defaultActiveKey="cancel"
                                    className="hd-accordion"
                                >
                                    {options.length > 0 && (
                                        <Accordion.Item eventKey="cancel">
                                            <Accordion.Header>
                                                Cancellation
                                            </Accordion.Header>

                                            <Accordion.Body>
                                                <p className="mb-2">
                                                    {vm.allNonRefundable
                                                        ? 'All available rates for these dates are non-refundable. The full amount is charged if you cancel or do not show up.'
                                                        : 'Cancellation terms depend on the rate you choose. Open "Show price breakdown & cancellation" on any room to see the exact dates and charges.'}
                                                </p>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    )}

                                    {facts.length > 0 && (
                                        <Accordion.Item eventKey="checkin">
                                            <Accordion.Header>
                                                Check-in & check-out
                                            </Accordion.Header>

                                            <Accordion.Body>
                                                <ul className="hd-plain-list">
                                                    {vm.checkIn.checkin_from && (
                                                        <li>
                                                            Check-in from{' '}
                                                            <strong>
                                                                {vm.checkIn.checkin_from}
                                                            </strong>
                                                            {vm.checkIn.checkin_till &&
                                                                `, until ${vm.checkIn.checkin_till}`}
                                                        </li>
                                                    )}

                                                    {vm.checkIn.checkout_from && (
                                                        <li>
                                                            Check-out by{' '}
                                                            <strong>
                                                                {vm.checkIn.checkout_from}
                                                            </strong>
                                                        </li>
                                                    )}

                                                    {vm.checkIn.checkin_min_age && (
                                                        <li>
                                                            Minimum check-in age:{' '}
                                                            <strong>
                                                                {vm.checkIn.checkin_min_age}
                                                            </strong>
                                                        </li>
                                                    )}
                                                </ul>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    )}

                                    {vm.feesBlocks.length > 0 && (
                                        <Accordion.Item eventKey="fees">
                                            <Accordion.Header>
                                                Fees & deposits
                                            </Accordion.Header>

                                            <Accordion.Body>
                                                <PolicyBlocks
                                                    blocks={vm.feesBlocks}
                                                />
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    )}

                                    {vm.instructionBlocks.length > 0 && (
                                        <Accordion.Item eventKey="instructions">
                                            <Accordion.Header>
                                                Important instructions
                                            </Accordion.Header>

                                            <Accordion.Body>
                                                <PolicyBlocks
                                                    blocks={vm.instructionBlocks}
                                                />
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    )}

                                    {vm.knowBlocks.length > 0 && (
                                        <Accordion.Item eventKey="know">
                                            <Accordion.Header>
                                                Know before you go
                                            </Accordion.Header>

                                            <Accordion.Body>
                                                <PolicyBlocks
                                                    blocks={vm.knowBlocks}
                                                />
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    )}

                                    {(vm.languages.length > 0 ||
                                        vm.payments.length > 0) && (
                                            <Accordion.Item eventKey="more">
                                                <Accordion.Header>
                                                    Payments & languages
                                                </Accordion.Header>

                                                <Accordion.Body>
                                                    {vm.payments.length > 0 && (
                                                        <div className="mb-3">
                                                            <div className="fw-semibold mb-2">
                                                                Accepted at the hotel
                                                            </div>

                                                            <div className="hd-chips">
                                                                {vm.payments.map(
                                                                    (item) => (
                                                                        <span
                                                                            className="hd-chip hd-chip-quiet"
                                                                            key={item}
                                                                        >
                                                                            {item}
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {vm.languages.length > 0 && (
                                                        <div>
                                                            <div className="fw-semibold mb-2">
                                                                Languages spoken
                                                            </div>

                                                            <div className="hd-chips">
                                                                {vm.languages.map(
                                                                    (item) => (
                                                                        <span
                                                                            className="hd-chip hd-chip-quiet"
                                                                            key={item}
                                                                        >
                                                                            {item}
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        )}
                                </Accordion>
                            </section>
                        )}
                    </Col>

                    {/* =================================================
                        RIGHT — SUMMARY
                    ================================================= */}

                    <Col xs={12} lg={4} className="d-none d-lg-block">
                        <aside className="hd-card hd-summary">
                            <h2 className="hd-h2">Your stay</h2>

                            <div className="hd-sum-row">
                                <span>Hotel</span>
                                <strong>{name}</strong>
                            </div>

                            {checkIn && checkOut && (
                                <div className="hd-sum-row">
                                    <span>Dates</span>
                                    <strong>
                                        {formatDate(checkIn)} –{' '}
                                        {formatDate(checkOut)}
                                        {nights ? ` (${plural(nights, 'night')})` : ''}
                                    </strong>
                                </div>
                            )}

                            {cheapestGuests && cheapestGuests.rooms > 0 && (
                                <div className="hd-sum-row">
                                    <span>Guests</span>
                                    <strong>
                                        {plural(cheapestGuests.rooms, 'room')},{' '}
                                        {plural(cheapestGuests.adults, 'adult')}
                                        {cheapestGuests.children > 0 &&
                                            `, ${cheapestGuests.children} ${cheapestGuests.children === 1
                                                ? 'child'
                                                : 'children'
                                            }`}
                                    </strong>
                                </div>
                            )}

                            {cheapest?.mealBasis && (
                                <div className="hd-sum-row">
                                    <span>Meal plan</span>
                                    <strong>{cheapest.mealBasis}</strong>
                                </div>
                            )}

                            {cheapestCancel && cheapest?.cancellation && (
                                <div className="hd-sum-row">
                                    <span>Cancellation</span>
                                    <strong
                                        className={`hd-cancel-${cheapestCancel.tone}`}
                                    >
                                        {cheapest.cancellation.isRefundable
                                            ? 'Refundable'
                                            : 'Non-refundable'}
                                    </strong>
                                </div>
                            )}

                            <hr className="hd-hr" />

                            {cheapestTotal !== null && (
                                <>
                                    <div className="hd-price-note">
                                        {options.length > 1
                                            ? 'Starting from'
                                            : 'Total'}
                                    </div>

                                    <div className="hd-price hd-price-lg">
                                        {money(cheapestTotal, currency)}
                                    </div>

                                    <div className="hd-price-note">
                                        Taxes & fees included
                                        {nights
                                            ? ` · ≈ ${money(
                                                cheapestTotal / nights,
                                                currency
                                            )} / night`
                                            : ''}
                                    </div>
                                </>
                            )}

                            <Button
                                variant="success"
                                className="hd-btn w-100 mt-3"
                                onClick={() => onSelectRoom?.(cheapest)}
                                disabled={!cheapest}
                            >
                                Select lowest-price room
                            </Button>

                            <Button
                                variant="outline-success"
                                className="hd-btn w-100 mt-2"
                                onClick={() => scrollToId('rooms')}
                                disabled={options.length === 0}
                            >
                                Compare all rooms
                            </Button>
                        </aside>
                    </Col>
                </Row>
            </Container>

            {/* ---------- mobile sticky booking bar ---------- */}

            {cheapestTotal !== null && (
                <div className="hd-mobilebar d-lg-none">
                    <div>
                        <div className="hd-price-note">
                            {options.length > 1 ? 'From' : 'Total'}
                        </div>

                        <div className="hd-price">
                            {money(cheapestTotal, currency)}
                        </div>
                    </div>

                    <Button
                        variant="success"
                        className="hd-btn"
                        onClick={() => scrollToId('rooms')}
                    >
                        View rooms
                    </Button>
                </div>
            )}

            {/* ---------- lightbox ---------- */}

            <Modal
                show={photoIndex !== null}
                onHide={closeGallery}
                fullscreen
                className="hd-lightbox"
                style={{ zIndex: 99999 }}
            >
                <Modal.Header closeButton closeVariant="white">
                    <Modal.Title as="div" className="hd-lb-title">
                        {name}
                        <span className="hd-lb-count">
                            {(photoIndex ?? 0) + 1} / {imageCount}
                        </span>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="hd-lb-stage">
                        <button
                            type="button"
                            className="hd-lb-nav is-prev"
                            onClick={prevPhoto}
                            aria-label="Previous photo"
                        >
                            <Icon name="left" size={26} />
                        </button>

                        {photoIndex !== null && images[photoIndex] && (
                            <SafeImg
                                key={images[photoIndex]}
                                src={images[photoIndex]}
                                alt={`${name} photo ${photoIndex + 1}`}
                                className="hd-lb-image"
                                loading="eager"
                            />
                        )}

                        <button
                            type="button"
                            className="hd-lb-nav is-next"
                            onClick={nextPhoto}
                            aria-label="Next photo"
                        >
                            <Icon name="right" size={26} />
                        </button>
                    </div>

                    <div className="hd-thumbs">
                        {images
                            .slice(thumbStart, thumbEnd)
                            .map((src, offset) => {
                                const index = thumbStart + offset;

                                return (
                                    <button
                                        type="button"
                                        key={src}
                                        className={`hd-thumb ${index === photoIndex
                                            ? 'is-active'
                                            : ''
                                            }`}
                                        onClick={() => setPhotoIndex(index)}
                                        aria-label={`Go to photo ${index + 1}`}
                                    >
                                        <SafeImg src={src} alt="" />
                                    </button>
                                );
                            })}
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

/* =========================================================
   STYLES  (scoped with the hd- prefix)
   Tip: if your site has a fixed navbar, set --hd-sticky-top
   on .hd-root to its height (e.g. 64px).
   ========================================================= */

const STYLES = `
.hd-root {
    --hd-ink: #16251d;
    --hd-muted: #5f6f66;
    --hd-line: #e3e9e4;
    --hd-surface: #ffffff;
    --hd-bg: #f4f7f4;
    --hd-accent: #157347;
    --hd-accent-soft: #e8f3ec;
    --hd-warn: #b42318;
    --hd-warn-soft: #fdecea;
    --hd-star: #e0a100;
    --hd-sticky-top: 0px;
    background: var(--hd-bg);
    color: var(--hd-ink);
    min-height: 100vh;
    padding-bottom: 88px;
}
@media (min-width: 992px) { .hd-root { padding-bottom: 0; } }

.hd-card {
    background: var(--hd-surface);
    border: 1px solid var(--hd-line);
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(16, 40, 28, .04);
}
.hd-header { padding: 1.25rem; }
@media (min-width: 992px) { .hd-header { padding: 1.5rem 1.75rem; } }

.hd-section { padding: 1.25rem; margin-bottom: 1.5rem; scroll-margin-top: calc(var(--hd-sticky-top) + 64px); }
@media (min-width: 992px) { .hd-section { padding: 1.75rem; } }

.hd-title { font-size: clamp(1.4rem, 1rem + 1.6vw, 2.1rem); font-weight: 750; line-height: 1.15; margin: 0; letter-spacing: -0.01em; }
.hd-tagline { margin: .35rem 0 0; color: var(--hd-muted); font-size: 1.02rem; }
.hd-stars { color: var(--hd-star); letter-spacing: 2px; font-size: 1.15rem; line-height: 1; }
.hd-meta { display: inline-flex; align-items: flex-start; gap: .4rem; color: var(--hd-muted); font-size: .95rem; }
.hd-meta svg { margin-top: .2rem; flex: none; }

.hd-h2 { font-size: 1.2rem; font-weight: 700; margin: 0 0 1rem; letter-spacing: -0.005em; }
.hd-h3 { font-size: 1rem; font-weight: 650; margin: 0 0 .4rem; }
.hd-body { color: #33443a; line-height: 1.65; max-width: 75ch; }
.hd-count { margin-left: .5rem; font-size: .8rem; font-weight: 600; color: var(--hd-muted); background: var(--hd-bg); border-radius: 999px; padding: .15rem .55rem; vertical-align: middle; }

.hd-back { display: inline-flex; align-items: center; gap: .35rem; background: none; border: 0; padding: .25rem .1rem; color: var(--hd-ink); font-weight: 600; }
.hd-back:hover { color: var(--hd-accent); }

.hd-link { background: none; border: 0; padding: 0; color: var(--hd-accent); font-weight: 600; font-size: .92rem; text-decoration: none; }
.hd-link:hover { text-decoration: underline; }

.hd-btn { border-radius: 12px !important; font-weight: 600 !important; padding: .6rem 1.1rem !important; }
.hd-btn:focus-visible, .hd-nav-item:focus-visible, .hd-link:focus-visible, .hd-back:focus-visible,
.hd-cell:focus-visible, .hd-allphotos:focus-visible, .hd-thumb:focus-visible, .hd-lb-nav:focus-visible { outline: 3px solid rgba(21, 115, 71, .45); outline-offset: 2px; }

/* chips */
.hd-chips { display: flex; flex-wrap: wrap; gap: .4rem; }
.hd-chip { display: inline-flex; align-items: center; gap: .3rem; padding: .22rem .65rem; border-radius: 999px; font-size: .8rem; font-weight: 600; background: var(--hd-accent-soft); color: #14563a; border: 1px solid transparent; }
.hd-chip-quiet { background: #f0f3f1; color: #3d4d44; }
.hd-chip-good { background: #e3f4ea; color: #0d6b3f; }
.hd-chip-bad { background: var(--hd-warn-soft); color: var(--hd-warn); }
.hd-chip-meal { background: #fff4d6; color: #7a5600; }
.hd-chip-accent { background: var(--hd-accent); color: #fff; }

/* gallery */
.hd-gallery-wrap { position: relative; border-radius: 16px; overflow: hidden; }
.hd-gallery { display: grid; gap: 6px; height: 260px; grid-template-columns: 1fr; }
@media (min-width: 768px) {
    .hd-gallery { height: 420px; }
    .hd-g-2 { grid-template-columns: 1fr 1fr; }
    .hd-g-3, .hd-g-5 { grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr; }
    .hd-g-5 { grid-template-columns: 2fr 1fr 1fr; }
    .hd-g-3 .is-main, .hd-g-5 .is-main { grid-row: span 2; }
}
.hd-cell { position: relative; padding: 0; border: 0; overflow: hidden; background: #dfe6e1; min-height: 0; }
.hd-cell img, .hd-cell .hd-img-fallback { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s ease; }
.hd-cell:hover img { transform: scale(1.03); }
.hd-img-fallback { display: flex; align-items: center; justify-content: center; background: #e6ece8; color: var(--hd-muted); font-size: .85rem; }
.hd-allphotos { position: absolute; right: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: .45rem; background: rgba(255,255,255,.96); border: 0; border-radius: 12px; padding: .55rem .9rem; font-weight: 650; font-size: .9rem; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
.hd-allphotos:hover { background: #fff; }

/* section nav */
.hd-nav { position: sticky; top: var(--hd-sticky-top); z-index: 20; display: flex; gap: .35rem; overflow-x: auto; padding: .5rem; background: rgba(255,255,255,.96); backdrop-filter: blur(6px); border: 1px solid var(--hd-line); border-radius: 14px; scrollbar-width: none; }
.hd-nav::-webkit-scrollbar { display: none; }
.hd-nav-item { flex: none; border: 0; background: transparent; padding: .45rem .95rem; border-radius: 10px; font-weight: 600; font-size: .92rem; color: var(--hd-muted); }
.hd-nav-item:hover { color: var(--hd-ink); background: var(--hd-bg); }
.hd-nav-item.is-active { background: var(--hd-accent-soft); color: #14563a; }

/* facts */
.hd-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: .75rem; margin: 1.25rem 0; }
.hd-fact { display: flex; gap: .7rem; align-items: center; padding: .75rem .85rem; border: 1px solid var(--hd-line); border-radius: 12px; background: #fbfcfb; }
.hd-fact-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: var(--hd-accent-soft); color: var(--hd-accent); flex: none; }
.hd-fact-label { font-size: .78rem; color: var(--hd-muted); }
.hd-fact-value { font-weight: 650; font-size: .95rem; color: var(--hd-ink); text-decoration: none; word-break: break-word; }
a.hd-fact-value:hover { color: var(--hd-accent); }
.hd-info-grid { display: grid; gap: 1.25rem; grid-template-columns: 1fr; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--hd-line); }
@media (min-width: 768px) { .hd-info-grid { grid-template-columns: 1fr 1fr; } }

/* rooms */
.hd-room { border: 1px solid var(--hd-line); border-radius: 14px; overflow: hidden; }
.hd-room-head { padding: 1rem 1.1rem; background: #f8faf8; border-bottom: 1px solid var(--hd-line); }
.hd-room-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 .5rem; }
.hd-plans { display: flex; flex-direction: column; }
.hd-plan { display: flex; flex-direction: column; gap: 1rem; padding: 1rem 1.1rem; }
.hd-plan + .hd-plan { border-top: 1px dashed var(--hd-line); }
.hd-plan.is-lowest { background: rgba(232, 243, 236, .45); }
@media (min-width: 768px) {
    .hd-plan { flex-direction: row; align-items: flex-start; justify-content: space-between; }
    .hd-plan-main { flex: 1; min-width: 0; }
    .hd-plan-price { flex: none; width: 220px; text-align: right; }
}
.hd-plan-price .btn { width: 100%; }
@media (max-width: 767.98px) {
    .hd-plan-price { border-top: 1px solid var(--hd-line); padding-top: .85rem; }
}
.hd-cancel { font-size: .9rem; font-weight: 600; }
.hd-cancel-good { color: #0d6b3f; }
.hd-cancel-bad { color: var(--hd-warn); }
.hd-cancel-muted { color: var(--hd-muted); }

.hd-price { font-size: 1.5rem; font-weight: 750; letter-spacing: -0.01em; line-height: 1.1; }
.hd-price-lg { font-size: 2rem; }
.hd-price-note { font-size: .8rem; color: var(--hd-muted); }

.hd-breakdown { margin-top: .85rem; padding: .9rem 1rem; background: #f8faf8; border: 1px solid var(--hd-line); border-radius: 12px; font-size: .9rem; }
.hd-breakdown dl { margin: 0; }
.hd-breakdown dl > div { display: flex; justify-content: space-between; gap: 1rem; padding: .2rem 0; }
.hd-breakdown dt { font-weight: 500; color: var(--hd-muted); }
.hd-breakdown dd { margin: 0; font-weight: 600; }
.hd-breakdown-total { border-top: 1px solid var(--hd-line); margin-top: .35rem; padding-top: .5rem !important; }
.hd-breakdown-total dt, .hd-breakdown-total dd { color: var(--hd-ink); font-weight: 700; }
.hd-penalties { margin-top: .85rem; }
.hd-penalties ul { margin: 0; padding-left: 1.1rem; color: #33443a; }

/* amenities */
.hd-amenities { list-style: none; margin: 0; padding: 0; display: grid; gap: .55rem; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
.hd-amenities li { display: flex; align-items: center; gap: .5rem; padding: .55rem .7rem; border: 1px solid var(--hd-line); border-radius: 10px; font-size: .9rem; color: #2f4036; }
.hd-amenities svg { color: var(--hd-accent); flex: none; }
.hd-search { border: 1px solid var(--hd-line); border-radius: 10px; padding: .45rem .8rem; font-size: .9rem; min-width: 200px; max-width: 100%; }
.hd-search:focus { outline: 3px solid rgba(21, 115, 71, .25); border-color: var(--hd-accent); }

/* location */
.hd-map { border-radius: 14px; overflow: hidden; border: 1px solid var(--hd-line); height: 280px; margin-top: .5rem; }
@media (min-width: 768px) { .hd-map { height: 340px; } }
.hd-map iframe { width: 100%; height: 100%; border: 0; display: block; }
.hd-distances { display: grid; gap: 1.5rem; grid-template-columns: 1fr; margin-top: 1.5rem; }
@media (min-width: 768px) { .hd-distances { grid-template-columns: 1fr 1fr; } }
.hd-dist-list { list-style: none; margin: 0; padding: 0; }
.hd-dist-list li { display: flex; justify-content: space-between; gap: 1rem; padding: .5rem 0; border-bottom: 1px solid var(--hd-line); font-size: .92rem; }
.hd-dist { color: var(--hd-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }

/* policies */
.hd-accordion .accordion-item { border-color: var(--hd-line); }
.hd-accordion .accordion-button { font-weight: 650; padding-left: 0; padding-right: 0; background: transparent; box-shadow: none; }
.hd-accordion .accordion-button:not(.collapsed) { color: var(--hd-accent); }
.hd-accordion .accordion-body { padding-left: 0; padding-right: 0; }
.hd-plain-list { margin: 0; padding-left: 1.1rem; color: #33443a; line-height: 1.6; }
.hd-plain-list li + li { margin-top: .25rem; }

/* summary */
.hd-summary { position: sticky; top: calc(var(--hd-sticky-top) + 72px); padding: 1.5rem; }
.hd-sum-row { display: flex; justify-content: space-between; gap: 1rem; padding: .4rem 0; font-size: .92rem; }
.hd-sum-row span { color: var(--hd-muted); }
.hd-sum-row strong { text-align: right; font-weight: 650; }
.hd-hr { border: 0; border-top: 1px solid var(--hd-line); margin: 1rem 0; opacity: 1; }

/* mobile bar */
.hd-mobilebar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 1030; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .75rem 1rem calc(.75rem + env(safe-area-inset-bottom)); background: #fff; border-top: 1px solid var(--hd-line); box-shadow: 0 -6px 20px rgba(16, 40, 28, .08); }

/* lightbox */
.hd-lightbox .modal-content { background: #0d1410; color: #fff; }
.hd-lightbox .modal-header { border-bottom: 1px solid rgba(255,255,255,.12); }
.hd-lightbox .modal-body { display: flex; flex-direction: column; padding: 0; min-height: 0; }
.hd-lb-title { font-size: 1rem; font-weight: 650; display: flex; gap: .75rem; align-items: baseline; }
.hd-lb-count { font-size: .85rem; opacity: .7; font-weight: 500; }
.hd-lb-stage { position: relative; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: .5rem 3.25rem; }
.hd-lb-image { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; }
.hd-lb-stage .hd-img-fallback { width: 100%; height: 100%; background: #1a231d; color: #b9c5bd; }
.hd-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; width: 44px; height: 44px; border-radius: 50%; border: 0; display: grid; place-items: center; background: rgba(255,255,255,.14); color: #fff; }
.hd-lb-nav:hover { background: rgba(255,255,255,.28); }
.hd-lb-nav.is-prev { left: .5rem; }
.hd-lb-nav.is-next { right: .5rem; }
.hd-thumbs { display: flex; gap: .4rem; overflow-x: auto; padding: .6rem; justify-content: center; }
.hd-thumb { flex: none; width: 76px; height: 54px; padding: 0; border: 2px solid transparent; border-radius: 8px; overflow: hidden; opacity: .6; background: #1a231d; }
.hd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hd-thumb.is-active { border-color: #fff; opacity: 1; }
@media (max-width: 575.98px) {
    .hd-lb-stage { padding: .5rem; }
    .hd-lb-nav { width: 38px; height: 38px; }
    .hd-thumb { width: 60px; height: 44px; }
}

@media (prefers-reduced-motion: reduce) {
    .hd-cell img { transition: none; }
    .hd-cell:hover img { transform: none; }
}
`;

export default HotelDetails;