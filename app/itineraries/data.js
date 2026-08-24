export const sampleItinerary = {
    title: 'Breathtaking Bali: 8 Days Honeymoon Special',
    duration: '7 Nights / 8 Days',
    travelers: '2 Adults',
    destinations: ['Seminyak (3N)', 'Ubud (4N)'],
    badges: ['CUSTOMIZABLE', 'BESTSELLER'],
    rating: 4.8,
    reviews: 1250,
    price: 75656,
    originalPrice: 85000,
    gallery: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
        'https://images.unsplash.com/photo-1514282401047-d79a71a590e8',
        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff',
        'https://images.unsplash.com/photo-1543832923-44667a44c804',
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c'
    ],
    itinerary: [
        {
            day: 1,
            title: 'Arrival in Bali & Transfer to Seminyak',
            desc: 'Upon arrival at Denpasar Airport, meet our representative and transfer to your luxury pool villa in Seminyak. Spend the evening at leisure or explore the nearby beaches.',
            image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4'
        },
        {
            day: 2,
            title: 'Seminyak Beach & Personal Leisure',
            desc: 'Wake up to a beautiful breakfast. The day is yours to explore the trendy cafes, boutique shops, and the stunning Seminyak beach. Romantic sunset dinner included.',
            image: 'https://images.unsplash.com/photo-1439853949212-36089f89cce1'
        },
        {
            day: 3,
            title: 'Uluwatu Temple & Kecak Dance',
            desc: 'Visit the iconic Uluwatu Temple perched on a cliff edge. Witness the traditional Kecak Fire Dance as the sun sets over the Indian Ocean.',
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c'
        }
    ],
    hotels: [
        { name: 'The Kayon Jungle Resort', stars: 5, type: 'Pool Villa', image: 'https://images.unsplash.com/photo-1543832923-44667a44c804', location: 'Ubud' },
        { name: 'W Bali - Seminyak', stars: 5, type: 'Luxury Room', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c', location: 'Seminyak' }
    ],
    highlights: [
        'Stay in 5-star Luxury Pool Villas in Seminyak & Ubud',
        'Private Candle Light Sunset Dinner for Couples',
        'Experienced English-speaking Private Driver',
        'Witness the famous Kecak Fire Dance at Uluwatu',
        'Hassle-free airport pick-up and drop-off'
    ],
    transfers: [
        { title: 'Airport Pick-up', type: 'Private Car', desc: 'Standard Sedan with English speaking driver', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2' },
        { title: 'Intercity Transfer', type: 'Private Van', desc: 'Comfortable ac van for Seminyak to Ubud', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2' }
    ],
    activities: [
        { name: 'Kecak Fire Dance', location: 'Uluwatu', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c' },
        { name: 'Ubud Swing Experience', location: 'Ubud Jungle', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4' },
        { name: 'Tegenungan Waterfall', location: 'Gianyar', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8' },
        { name: 'Tegenungan Waterfal', location: 'Gianyar', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8' }
    ],
    policies: [
        { title: 'Cancellation Policy', items: ['Cancellation before 30 days: 100% refund', 'Cancellation 15-30 days: 50% refund', 'Cancellation less than 15 days: No refund'] },
        { title: 'Child Policy', items: ['Under 5 years: Complimentary', '5-12 years: 50% of adult rate', 'Above 12 years: Full rate'] }
    ],
    inclusions: [
        '2 nights stay in Ubud',
        '3 nights stay in Kuta',
        'Ubud Wonders: Volcano, Waterfalls, Rice Fields & Exhilarating Swing Thrills',
        'Iconic Bali Experience: Handara Gate, Tanah Lot Temple',
        'West Nusa Penida Private Tour with Return Boat Tickets and Lunch',
        'Airport transfer - Denpasar Bali Airport to Ubud Hotel',
        'Airport transfer - Kuta Hotel to Denpasar Bali Airport'
    ],
    exclusions: [
        'Meals not mentioned in the itinerary or inclusions',
        'Expenses of personal nature',
        'International Flights'
    ],
    visaInfo: {
        title: 'Visa on arrival for Indonesia',
        type: 'ON_ARRIVAL',
        image: 'https://images.unsplash.com/photo-1554224155-1696413565d3'
    },
    reviews_list: [
        { user: 'Rahul Sharma', rating: 5, date: 'Mar 2024', text: 'Amazing experience! Everything was well organized by the team. The hotels were top-notch.', avatar: 'https://i.pravatar.cc/150?u=rahul' },
        { user: 'Sneha Gupta', rating: 4, date: 'Feb 2024', text: 'Great honeymoon trip. Ubud villas were really beautiful. Highly recommended!', avatar: 'https://i.pravatar.cc/150?u=sneha' }
    ],
    faqs: [
        { q: 'Is Visa included in the package?', a: 'Visa on arrival is available for Indian citizens. The fee of approximately $35 is to be paid directly at the airport.' },
        { q: 'Can I customize the hotels?', a: 'Yes, you can choose from our hand-picked selection of luxury resorts and villas.' }
    ]
};

export const navTabs = [
    { id: 'overview', label: 'Your Trip', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' },
    { id: 'itinerary', label: 'Day By Day', icon: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z' },
    { id: 'inclusions', label: 'Inclusions', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' },
    { id: 'reviews', label: 'Reviews', icon: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z' }
];
