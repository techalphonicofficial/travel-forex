'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';

import {
    ChipRow,
    DestinationGrid,
    Faq,
    RecentSearches,
    SectionHead,
    Steps,
    TrustStrip,
    clearRecent,
    readRecent,
} from '@/components/travel-landing/LandingSections';
import { HOTEL_RECENT_KEY } from './HotelSearchForm';
import { formatDate, guestCount, titleCase } from './hotelUtils';

const photo = (id) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;

// city regions from the supplier's city list (same ids the search box uses)
const region = (cityRegionId, cityName, fullRegionName, countryName, regionType = 'CITY') => ({
    type: 'CITY',
    cityRegionId,
    cityName,
    regionName: cityName,
    fullRegionName,
    countryName,
    regionType,
    label: cityName,
});

const DESTINATIONS = [
    { name: 'Goa', subtitle: 'Beaches, shacks & resorts', tag: 'Most searched', image: photo('photo-1512343879784-a960bf40e7f2'), destination: region('699356', 'GOA', 'GOA, INDIA', 'INDIA', 'PROVINCE_STATE') },
    { name: 'New Delhi', subtitle: 'Business & heritage stays', image: photo('photo-1587474260584-136574528ed5'), destination: region('727635', 'NEW DELHI', 'NEW DELHI, NATIONAL CAPITAL TERRITORY OF DELHI, INDIA', 'INDIA') },
    { name: 'Mumbai', subtitle: 'Sea-facing city hotels', image: photo('photo-1529253355930-ddbe423a2ac7'), destination: region('740051', 'MUMBAI', 'MUMBAI, MAHARASHTRA, INDIA', 'INDIA') },
    { name: 'Jaipur', subtitle: 'Palaces & havelis', image: photo('photo-1477587458883-47145ed94245'), destination: region('739239', 'JAIPUR', 'JAIPUR, RAJASTHAN, INDIA', 'INDIA') },
    { name: 'Agra', subtitle: 'Stays near the Taj Mahal', image: photo('photo-1564507592333-c60657eea523'), destination: region('740325', 'AGRA', 'AGRA, UTTAR PRADESH, INDIA', 'INDIA') },
    { name: 'Kochi', subtitle: 'Gateway to Kerala backwaters', image: photo('photo-1602216056096-3b40cc0c9944'), destination: region('697282', 'KOCHI', 'KOCHI, KERALA, INDIA', 'INDIA') },
    { name: 'Manali', subtitle: 'Mountain views & cottages', image: photo('photo-1626621341517-bbf3d9990a23'), destination: region('656671', 'MANALI', 'MANALI, HIMACHAL PRADESH, INDIA', 'INDIA') },
    { name: 'Dubai', subtitle: 'Skyline & beach hotels', image: photo('photo-1512453979798-5ea266f8880c'), destination: region('697010', 'DUBAI', 'DUBAI, DUBAI, UNITED ARAB EMIRATES', 'UNITED ARAB EMIRATES') },
    { name: 'Singapore', subtitle: 'Marina Bay & city stays', image: photo('photo-1525625293386-3f8f99389edd'), destination: region('738005', 'SINGAPORE', 'SINGAPORE, SINGAPORE', 'SINGAPORE') },
];

// typed into the search box, so the suggestions show that chain's hotels
const BRANDS = ['Taj', 'ITC', 'The Oberoi', 'Marriott', 'Radisson', 'Hyatt', 'Novotel', 'Holiday Inn', 'Lemon Tree', 'Ginger', 'Sarovar', 'Hilton']
    .map((label) => ({ label, icon: '🏨' }));

const TRUST = [
    { icon: '🏨', title: '1 lakh+ hotels in India', text: 'Hotels, resorts, homestays and more, plus stays abroad.' },
    { icon: '🧾', title: 'Prices with taxes', text: 'The total you see includes taxes and fees.' },
    { icon: '↩️', title: 'Free cancellation', text: 'On many rooms; the deadline is shown before you book.' },
    { icon: '🔒', title: 'Secure payment', text: 'Pay online through our bank payment gateway.' },
];

const STEPS = [
    { title: 'Search', text: 'Type a city, area or hotel name and pick your dates and guests.' },
    { title: 'Choose a room', text: 'Compare rooms, meal plans and cancellation rules side by side.' },
    { title: 'Book & pay', text: 'Add guest details, pay securely and get your booking voucher.' },
];

const FAQ = [
    { q: 'Can I search by hotel name?', a: 'Yes. Type the hotel or chain name (for example Taj, Radisson or Lemon Tree) in the search box and pick the hotel from the list to see its rooms directly.' },
    { q: 'Are taxes included in the price?', a: 'Yes. The total price shown on every room includes taxes and fees. Optional charges such as rollaway beds or city tax, where the hotel lists them, are shown under Property information.' },
    { q: 'How do I know if a room is refundable?', a: 'Each room shows "Free cancellation till …" or "Non-refundable". Open the cancellation policy to see the exact charge for each date before you pay.' },
    { q: 'Which ID do I need at check-in?', a: 'Every guest needs a valid government photo ID. Foreign nationals need a passport and a valid visa. Some hotels also ask for the PAN of the lead guest, which you enter while booking.' },
    { q: 'Where do I find my booking voucher?', a: 'After payment, open My Profile → My Bookings. You can download the hotel voucher there and see your hotel confirmation number once the hotel shares it.' },
];

const recentTitle = (item) => item.destination?.hotelName || titleCase(item.destination?.cityName) || 'Hotel search';

/* Sections under the hotel search box before the first search */
export default function HotelLanding({ onPreset }) {
    const stored = useSyncExternalStore(
        () => () => {},
        () => localStorage.getItem(HOTEL_RECENT_KEY) || '',
        () => ''
    );
    const [cleared, setCleared] = useState(false);
    const recent = cleared || !stored ? [] : readRecent(HOTEL_RECENT_KEY).map((item) => {
        const guests = guestCount(item.rooms || []);
        return {
            ...item,
            icon: item.destination?.type === 'HOTEL' ? '🏨' : '📍',
            title: recentTitle(item),
            subtitle: `${formatDate(item.checkIn)} – ${formatDate(item.checkOut)} · ${guests.adults + guests.children} guest${guests.adults + guests.children > 1 ? 's' : ''}`,
        };
    });

    const pick = (preset) => {
        onPreset({ ...preset, nonce: Date.now() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="tl-wrap">
            {recent.length > 0 && (
                <section className="tl-section">
                    <RecentSearches
                        items={recent}
                        onPick={(item) => pick({ search: item })}
                        onClear={() => {
                            clearRecent(HOTEL_RECENT_KEY);
                            setCleared(true);
                        }}
                    />
                </section>
            )}

            <section className="tl-section">
                <TrustStrip items={TRUST} />
            </section>

            <section className="tl-section">
                <SectionHead kicker="Explore" title="Popular destinations" text="Pick a destination to start your search." />
                <DestinationGrid items={DESTINATIONS} onPick={(item) => pick({ destination: item.destination })} actionLabel="Find hotels" />
            </section>

            <section className="tl-section">
                <SectionHead kicker="Search by name" title="Popular hotel chains" text="Tap a chain to see its hotels in the search box." />
                <ChipRow items={BRANDS} onPick={(item) => pick({ query: item.label })} />
            </section>

            <section className="tl-section">
                <SectionHead kicker="How it works" title="Book your stay in 3 steps" />
                <Steps items={STEPS} />
            </section>

            <section className="tl-section">
                <SectionHead kicker="Help" title="Frequently asked questions" />
                <div className="tl-split">
                    <Faq items={FAQ} />
                    <aside className="tl-help">
                        <h3>Need help with a booking?</h3>
                        <p>Our support team can help with room choices, changes and cancellations.</p>
                        <ul>
                            <li>Keep your Booking ID handy</li>
                            <li>Manage bookings in My Profile</li>
                        </ul>
                        <Link href="/contact">Contact support</Link>
                    </aside>
                </div>
            </section>
        </div>
    );
}
