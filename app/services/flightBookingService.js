const API_BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL || '';

/* Logged-in user's JWT (set by utils/api setAuthSession) */
const getAuthHeader = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('wl_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (endpoint, payload = {}) => {
    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(payload),
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            'Flight request failed'
        );
    }

    /*
     * TripJack sends some failures with HTTP 200 and
     * status.success = false (e.g. "Access Denied", no fares).
     */
    if (data?.status?.success === false) {
        throw new Error(
            data?.errors?.[0]?.message ||
            'Flight request failed'
        );
    }

    return data;
};

const flightService = {
    /**
     * TripJack Flight Search
     * POST /tripjack/flight/search
     */
    search(payload) {
        return request(
            '/tripjack/flight/search',
            payload
        );
    },

    /**
     * TripJack Fare Rule
     * POST /tripjack/flight/fare-rule
     */
    fareRule(payload) {
        return request(
            '/tripjack/flight/fare-rule',
            payload
        );
    },

    /**
     * TripJack Flight Review
     * POST /tripjack/flight/review
     */
    review(payload) {
        return request(
            '/tripjack/flight/review',
            payload
        );
    },

    /**
     * TripJack Seat Map
     * POST /tripjack/flight/seat
     */
    seat(payload) {
        return request(
            '/tripjack/flight/seat',
            payload
        );
    },

    /*
     * Fare validate, book and booking details run only on the server
     * after a verified payment (see createBooking / continueToPay).
     */

    /**
     * Create booking + TripJack fare validate (server sets the amount)
     * POST /bookings  (login required)
     */
    createBooking(payload) {
        return request(
            '/bookings',
            payload
        );
    },

    /**
     * Start ICICI payment for a confirmed booking (login required)
     * POST /bookings/continue-to-pay/:bookingId
     */
    continueToPay(bookingId) {
        return request(
            `/bookings/continue-to-pay/${bookingId}`
        );
    }

};

export default flightService;