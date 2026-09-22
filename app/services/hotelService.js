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

    book: async (payload) => {
        const response = await axios.post(
            `${API_URL}/tripjack/hotels/book`,
            payload
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
    }
};

export default hotelService;