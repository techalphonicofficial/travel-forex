import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

const hotelService = {
    listing: async (payload) => {
        const response = await axios.post(
            `${API_URL}/tripjack/hotels/listing`,
            payload
        );

        return response.data;
    },

    pricing: async (payload) => {
        const response = await axios.post(
            `${API_URL}/tripjack/hotels/pricing`,
            payload
        );

        return response.data;
    },

    review: async (payload) => {
        const response = await axios.post(
            `${API_URL}/tripjack/hotels/review`,
            payload
        );

        return response.data;
    },

    /*
     * Create hotel booking + start payment (login required).
     * The server re-checks the room price; never trust the browser amount.
     */
    book: async (payload) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('wl_token') : null;
        const response = await axios.post(
            `${API_URL}/bookings/hotel`,
            payload,
            {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                validateStatus: () => true,
            }
        );

        if (response.status === 401 || response.status === 403) {
            const error = new Error('Your login session has expired. Please log in again.');
            error.code = 'LOGIN_REQUIRED';
            throw error;
        }

        if (response.status < 200 || response.status >= 300 || response.data?.success === false) {
            const error = new Error(response.data?.message || 'Unable to start the booking. Please try again.');
            error.status = response.status;
            throw error;
        }

        return response.data;
    },

    /* hotels by name for the search box */
    hotelNameSearch: async (query) => {
        const response = await axios.get(
            `${API_URL}/tripjack/content/hotel-search`,
            { params: { query, limit: 6 } }
        );

        return response.data;
    },

    citySearch: async (query) => {
        const response = await axios.get(
            `${API_URL}/tripjack/content/city-search`,
            {
                params: {
                    query,
                },
            }
        );

        return response.data;
    },

    hotelIdsByRegion: async (payload) => {
        const response = await axios.post(
            `${API_URL}/tripjack/content/hids-by-region`,
            payload
        );

        return response.data;
    },

    async getNationalities() {
        const response = await axios.get(
            `${API_URL}/tripjack/hotels/nationalities`
        );

        return response.data;
    },

     async createBooking(){
        const response = await axios.get(
            `${API_URL}/tripjack/hotels/nationalities`
        );

        return response.data;
    }
};

export default hotelService;