const API_BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL || '';

const request = async (endpoint, payload = {}) => {
    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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

    /**
     * TripJack Fare Validation
     * POST /tripjack/flight/fare-validate
     */
    fareValidate(payload) {
        return request(
            '/tripjack/flight/fare-validate',
            payload
        );
    },

    /**
     * TripJack Flight Booking
     * POST /tripjack/flight/book
     */
    book(payload) {
        return request(
            '/tripjack/flight/book',
            payload
        );
    },

    /**
     * TripJack Confirm Booking
     * POST /tripjack/flight/confirm-book
     */
    confirmBook(payload) {
        return request(
            '/tripjack/flight/confirm-book',
            payload
        );
    },

    /**
     * TripJack Booking Details
     * POST /tripjack/flight/booking-details
     */
    bookingDetails(payload) {
        return request(
            '/tripjack/flight/booking-details',
            payload
        );
    },
};

export default flightService;