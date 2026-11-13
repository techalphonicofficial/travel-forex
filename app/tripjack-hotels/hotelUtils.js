/*
 * Shared helpers for the hotel booking pages
 * (search / results, hotel details, guest details).
 */

export const SEARCH_KEY = 'tripjack_hotel_search';
export const RESULTS_KEY = 'tripjack_hotel_search_results';
export const SELECTED_HOTEL_KEY = 'tripjack_selected_hotel';
export const BOOKING_CONTEXT_KEY = 'tripjack_booking_context';

export const HOTEL_STEPS = ['Select room', 'Guest details', 'Payment'];
export const INDIA_NATIONALITY = '106';

export const money = (value, currency = 'INR') => {
    const number = Number(value) || 0;
    const symbol = currency === 'INR' ? '₹' : `${currency} `;
    return `${symbol}${Math.round(number).toLocaleString('en-IN')}`;
};

export const formatDate = (value, options = { weekday: 'short', day: '2-digit', month: 'short' }) => {
    if (!value) return '--';
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-IN', options);
};

export const formatDateTime = (value) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const toISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const addDays = (iso, days) => {
    const date = new Date(`${iso}T12:00:00`);
    date.setDate(date.getDate() + days);
    return toISODate(date);
};

export const nightsBetween = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const diff = Math.round((new Date(`${checkOut}T12:00:00`) - new Date(`${checkIn}T12:00:00`)) / 86400000);
    return diff > 0 ? diff : 0;
};

export const titleCase = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

export const generateCorrelationId = (length = 22) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i += 1) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
};

/* rooms in the shape the supplier API expects */
export const toApiRooms = (rooms = []) =>
    rooms.map((room) => {
        const built = { adults: Number(room.adults) || 1 };
        if (Number(room.children) > 0) {
            built.children = Number(room.children);
            built.childAge = (room.childAges || []).slice(0, Number(room.children)).map((age) => Number(age));
        }
        return built;
    });

export const guestCount = (rooms = []) =>
    rooms.reduce(
        (acc, room) => ({
            adults: acc.adults + (Number(room.adults) || 0),
            children: acc.children + (Number(room.children) || 0),
        }),
        { adults: 0, children: 0 }
    );

/* any image size the API sent */
export const imageUrl = (image) => {
    if (!image) return null;
    if (typeof image === 'string') return image;
    const links = image.links || {};
    return (
        links.Standard?.href ||
        links.XL?.href ||
        links.XXL?.href ||
        Object.values(links).find((link) => link?.href)?.href ||
        image.url ||
        null
    );
};

const uniqueBy = (list, key) => {
    const seen = new Set();
    return list.filter((item) => {
        const value = key(item);
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
    });
};

/*
 * Compact hotel object kept in sessionStorage
 * (raw content can be several MB for big cities).
 */
export const slimHotel = (raw, correlationId) => {
    const content = raw?.hotelContent || {};
    const address = content.locale?.address || {};
    const images = Array.isArray(raw?.images) && raw.images.length ? raw.images : Array.isArray(content.images) ? content.images : [];
    const hero = images.find((image) => image?.is_hero_image) || images[0];
    const amenityList = Array.isArray(content.amenities) ? content.amenities : Object.values(content.amenities || {});

    return {
        hotelId: String(raw?.hotelId || content.tjHotelId || ''),
        name: raw?.name || content.name || 'Hotel',
        correlationId: correlationId || raw?.correlationId || null,
        options: Array.isArray(raw?.options) ? raw.options : [],
        image: raw?.image || imageUrl(hero),
        images: uniqueBy(images.map((image) => ({ url: imageUrl(image), caption: image?.caption || '' })), (image) => image.url).slice(0, 40),
        starRating: Number(content.star_rating) || 0,
        propertyType: content.property_type?.name || content.property_type || 'Hotel',
        address: {
            full: address.fulladdr || [address.line_1, address.line_2, address.city].filter(Boolean).join(', '),
            locality: titleCase(address.region || address.city || ''),
            city: titleCase(address.city || ''),
            state: address.statename || '',
            country: address.countryname || '',
            postalCode: address.postal_code || '',
        },
        coordinates: content.locale?.coordinates || null,
        amenities: uniqueBy(amenityList.map((item) => item?.name).filter(Boolean), (name) => name.toLowerCase()),
        policies: content.policies || {},
        descriptions: content.descriptions || {},
    };
};

/* cheapest option first */
export const sortOptions = (options = []) =>
    [...options].sort((a, b) => Number(a?.pricing?.totalPrice || 0) - Number(b?.pricing?.totalPrice || 0));

/*
 * Last search results. Big cities (Mumbai, New Delhi: up to 2000 hotels with
 * all room options) do not fit in sessionStorage (~5 MB), so the full results
 * stay in memory for this tab and the stored copy is trimmed step by step
 * until it fits (it is only needed after a page reload).
 */
let memoryResults = null;
const STORED_RESULTS_BUDGET = 2000000; // characters

const RESULT_TRIMS = [
    (hotel) => hotel,
    (hotel) => ({ ...hotel, images: (hotel.images || []).slice(0, 6) }),
    (hotel) => ({ ...hotel, images: (hotel.images || []).slice(0, 3), descriptions: {}, policies: {}, options: sortOptions(hotel.options).slice(0, 10) }),
    (hotel) => ({ ...hotel, images: (hotel.images || []).slice(0, 1), descriptions: {}, policies: {}, amenities: (hotel.amenities || []).slice(0, 12), options: sortOptions(hotel.options).slice(0, 3) }),
];

export const saveSearchResults = (saved) => {
    memoryResults = saved;
    try {
        sessionStorage.removeItem(RESULTS_KEY); // the old copy counts against the quota
    } catch {
        return false;
    }
    const hotels = saved.hotels || [];
    const copies = [
        ...RESULT_TRIMS.map((trim) => () => hotels.map(trim)),
        // still too big: the first hotels only (after a reload)
        () => hotels.slice(0, 400).map(RESULT_TRIMS[RESULT_TRIMS.length - 1]),
    ];
    for (const copy of copies) {
        const text = JSON.stringify({ ...saved, hotels: copy() });
        // leave room for the selected hotel and booking steps (same quota)
        if (text.length > STORED_RESULTS_BUDGET) continue;
        try {
            sessionStorage.setItem(RESULTS_KEY, text);
            return true;
        } catch {
            // quota reached: try a smaller copy
        }
    }
    return false;
};

/* full results of the last search in this tab (null after a reload) */
export const memorySearchResults = () => memoryResults;

export const cheapestOption = (hotel) => sortOptions(hotel?.options || [])[0] || null;

export const isFreeCancellation = (option) => {
    const cancel = option?.cancellation || {};
    if (cancel.isRefundable === false) return false;
    const now = Date.now();
    return (cancel.penalties || []).some((p) => Number(p.amount) === 0 && Date.parse(p.to) > now) || cancel.isRefundable === true;
};

/* Free cancellation until when (end of the zero-charge window) */
export const freeCancellationUntil = (option) => {
    const zero = (option?.cancellation?.penalties || []).filter((p) => Number(p.amount) === 0);
    const until = zero.length ? zero[zero.length - 1].to : option?.deadlineDateTime;
    return until && Date.parse(until) > Date.now() ? until : null;
};

export const roomNames = (option) => {
    const rooms = option?.roomInfo || [];
    const names = [...new Set(rooms.map((room) => room?.name).filter(Boolean))];
    return names.length ? names.join(' + ') : 'Room';
};

export const mealLabel = (value) => {
    const text = String(value || '').trim();
    if (!text) return 'Room only';
    if (/room\s*only/i.test(text)) return 'Room only';
    return text;
};

export const AMENITY_ICONS = [
    [/wi-?fi|internet/i, '📶'],
    [/pool/i, '🏊'],
    [/parking/i, '🅿️'],
    [/breakfast/i, '🍳'],
    [/restaurant|dining/i, '🍽️'],
    [/bar|lounge/i, '🍸'],
    [/gym|fitness/i, '🏋️'],
    [/spa|massage/i, '💆'],
    [/air.?condition|a\/c/i, '❄️'],
    [/airport|shuttle/i, '🚐'],
    [/room service/i, '🛎️'],
    [/laundry/i, '🧺'],
    [/wheelchair|accessible/i, '♿'],
    [/beach/i, '🏖️'],
    [/casino/i, '🎰'],
    [/banquet|meeting|conference|business/i, '💼'],
];

export const amenityIcon = (name) => AMENITY_ICONS.find(([re]) => re.test(name))?.[1] || '✓';

export const readSession = (key) => {
    if (typeof window === 'undefined') return null;
    try {
        return JSON.parse(sessionStorage.getItem(key) || 'null');
    } catch {
        return null;
    }
};

/* ---------- supplier text -> readable sections ---------- */

export const plainText = (value) =>
    String(value || '')
        .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

// supplier sends some fields as JSON inside a string (sometimes twice)
const parseNested = (value) => {
    if (typeof value !== 'string') return value;
    const text = value.trim();
    if (!/^[[{"]/.test(text)) return value;
    try {
        return parseNested(JSON.parse(text));
    } catch {
        return value;
    }
};

const humanizeKey = (key) => {
    const text = String(key || '').replace(/[_-]+/g, ' ').trim();
    return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : '';
};

/* "a. b.c" -> ['a.', 'b.', 'c'] : one point per sentence / line */
export const toPoints = (text) =>
    plainText(text)
        // new line, double space, sentence end, or sentences glued together ("PM.No", "childrenRollaway")
        .split(/\n+|\s{2,}|(?<=[.!?])\s+(?=[A-Z(])|(?<=[A-Za-z0-9)][.!?])(?=[A-Z][a-z])|(?<=[a-z]{4})(?=[A-Z][a-z]{2})/)
        .map((line) => line.replace(/^[-•*]\s*/, '').replace(/\s{2,}/g, ' ').trim())
        .filter((line) => line.length > 1);

/* any value (string, JSON string, object, array) -> [{ label, points[] }] */
export const toReadable = (value, label = '') => {
    const parsed = parseNested(value);
    if (parsed === null || parsed === undefined || parsed === '') return [];
    if (Array.isArray(parsed)) return parsed.flatMap((item) => toReadable(item, label));
    if (typeof parsed === 'object') {
        return Object.entries(parsed).flatMap(([key, item]) => toReadable(item, humanizeKey(key)));
    }
    const points = toPoints(String(parsed));
    return points.length ? [{ label, points }] : [];
};

const POLICY_TITLES = {
    special_instructions: 'Check-in instructions',
    know_before_you_go: 'Know before you go',
    mandatory_fees: 'Fees payable at the hotel',
    optional_fees: 'Optional fees',
    instructions: 'Instructions',
    pets: 'Pet policy',
};

/* hotel policies (except check-in times) -> [{ key, title, groups }] */
export const policySections = (hotel) =>
    Object.entries(hotel?.policies || {})
        .filter(([key]) => key !== 'checkInCheckOut')
        .map(([key, value]) => {
            const title = POLICY_TITLES[key] || humanizeKey(key);
            const sameAsTitle = (label) => !label || label.toLowerCase().replace(/\s/g, '') === key.replace(/_/g, '').toLowerCase()
                || label.toLowerCase() === title.toLowerCase();
            const groups = toReadable(value).map((group) => ({ ...group, label: sameAsTitle(group.label) ? '' : group.label }));
            return { key, title, groups };
        })
        .filter((section) => section.groups.length);

const DESCRIPTION_TITLES = {
    headline: 'Highlights',
    location: 'Location',
    rooms: 'Rooms',
    amenities: 'Amenities',
    dining: 'Dining',
    business_amenities: 'Business & events',
    attractions: 'Nearby attractions',
    spoken_languages: 'Languages spoken',
    renovations: 'Renovations',
    national_ratings: 'Ratings',
};
const DESCRIPTION_ORDER = ['headline', 'location', 'rooms', 'amenities', 'dining', 'business_amenities', 'attractions', 'spoken_languages'];

/* hotel descriptions (the "default" entry holds more of them) -> [{ key, title, points }] */
export const descriptionSections = (hotel) => {
    const map = new Map();
    const add = (key, value) => {
        const points = toReadable(value).flatMap((group) => group.points);
        if (points.length && !map.has(key)) map.set(key, points);
    };
    Object.entries(hotel?.descriptions || {}).forEach(([key, value]) => {
        const parsed = parseNested(value);
        if (key === 'default' && parsed && typeof parsed === 'object') {
            Object.entries(parsed).forEach(([innerKey, innerValue]) => add(innerKey, innerValue));
        } else {
            add(key, parsed);
        }
    });
    return [...map.entries()]
        .map(([key, points]) => ({ key, title: DESCRIPTION_TITLES[key] || humanizeKey(key), points }))
        .sort((a, b) => {
            const ia = DESCRIPTION_ORDER.indexOf(a.key);
            const ib = DESCRIPTION_ORDER.indexOf(b.key);
            return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        });
};

/* ---------- search box: cities + hotels in one list ---------- */

const isIndia = (item) => String(item?.countryName || '').trim().toUpperCase() === 'INDIA';
const score = (item) => (Number.isFinite(Number(item?.matchRank)) ? Number(item.matchRank) : 3);

/*
 * Merge city and hotel suggestions like the supplier's search box.
 * matchRank (from the API, already in the supplier's order):
 *   India: 0 exact, 1 starts with, 2 word starts with, 3 anywhere,
 *          3.5 an area of a matching place ("Vasant Vihar" for "delhi")
 *   abroad: the same + 5, except the exact name of a big destination
 *          (vicinity / state: "Bali", "Paris and vicinity") = 0.5
 *  - Indian places always stay; big foreign destinations always stay.
 *  - Other foreign places stay only when no Indian place matched strongly
 *    and no hotel matched ("delhi" drops Delhi, USA; "noida" drops Noidan,
 *    France; "radisson" drops Radisson, Canada).
 *  - Places first (up to 6 when hotels matched too), then hotels, then weak
 *    foreign places.
 */
export const mergeDestinationSuggestions = (cities = [], hotels = [], limit = 10) => {
    const hotelItems = hotels.map((item, order) => ({ ...item, kind: 'HOTEL', order }));
    const strongIndianPlace = cities.some((item) => isIndia(item) && score(item) <= 1);
    const keepForeign = (item) => score(item) <= 0.5 || (!strongIndianPlace && !hotelItems.length);

    // one row per place (the same place can come as city and vicinity)
    const seen = new Set();
    const cityItems = cities
        .filter((item) => isIndia(item) || keepForeign(item))
        .filter((item) => {
            const key = `${String(item.cityName || '').toUpperCase()}|${String(item.countryName || '').toUpperCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, hotelItems.length ? 6 : limit)
        .map((item, order) => ({ ...item, kind: 'CITY', order }));

    const group = (item) => (item.kind === 'HOTEL' ? 1 : score(item) < 5 ? 0 : 2);
    return [...cityItems, ...hotelItems]
        .sort((a, b) => group(a) - group(b) || a.order - b.order)
        .slice(0, limit);
};

/* second line of a place: "NOIDA, UTTAR PRADESH, INDIA" -> "UTTAR PRADESH, INDIA" */
export const placeSubtitle = (item) => {
    const full = String(item?.fullRegionName || '').trim();
    const name = String(item?.cityName || '').trim();
    if (name && full.toUpperCase().startsWith(`${name.toUpperCase()}, `)) return full.slice(name.length + 2);
    return full || item?.countryName || '';
};

/*
 * Room inclusions mix short perks ("Free WiFi") with long policy text that
 * the supplier sends as JSON split over several entries
 * ('{"Special Instructions":"…', '…more…', '…"}'). Perks are kept as tags;
 * the policy pieces are joined, parsed and turned into readable groups.
 */
export const splitInclusions = (inclusions = []) => {
    const perks = [];
    const notes = [];
    let buffer = '';

    const flush = (text) => {
        let groups = toReadable(text);
        // still not valid JSON (cut-off text): drop the JSON punctuation
        if (groups.some((group) => group.points.some((point) => /^[{["]/.test(point)))) {
            const cleaned = text
                .replace(/^[\s{["]+|[\s}\]"]+$/g, '')
                .replace(/"\s*,\s*"/g, '. ')
                .replace(/"?([A-Za-z_ ]{3,40})"\s*:\s*"/g, '$1: ');
            groups = toReadable(cleaned);
        }
        notes.push(...groups);
    };

    (Array.isArray(inclusions) ? inclusions : []).forEach((item) => {
        const text = String(typeof item === 'string' ? item : item?.name || item?.description || '').trim();
        if (!text) return;
        if (!buffer && text.length <= 60 && !/^[{["]/.test(text)) {
            perks.push(plainText(text));
            return;
        }
        buffer = buffer ? `${buffer}; ${text}` : text;
        if (!/^[{["]/.test(buffer)) {
            flush(buffer);
            buffer = '';
            return;
        }
        try {
            JSON.parse(buffer);
            flush(buffer);
            buffer = '';
        } catch {
            // JSON continues in the next entry
        }
    });
    if (buffer) flush(buffer);

    // one group per heading
    const merged = [];
    notes.forEach((group) => {
        const label = group.label === 'Optional' ? 'Optional fees' : group.label;
        const same = merged.find((g) => g.label === label);
        if (same) same.points.push(...group.points);
        else merged.push({ label, points: [...group.points] });
    });
    return { perks: [...new Set(perks.filter(Boolean))], notes: merged };
};
