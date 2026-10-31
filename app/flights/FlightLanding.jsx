'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';

import {
    DestinationGrid,
    Faq,
    RecentSearches,
    SectionHead,
    TrustStrip,
    clearRecent,
    readRecent,
} from '@/components/travel-landing/LandingSections';

export const FLIGHT_RECENT_KEY = 'tf_flight_recent_searches';

const photo = (id) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;

// tapping a destination fills "To" and keeps the departure city
const DESTINATIONS = [
    { name: 'Goa', subtitle: 'GOI · Beaches & resorts', tag: 'Popular', image: photo('photo-1512343879784-a960bf40e7f2'), to: 'Goa', toCode: 'GOI' },
    { name: 'Delhi', subtitle: 'DEL · Capital city', image: photo('photo-1587474260584-136574528ed5'), to: 'Delhi', toCode: 'DEL' },
    { name: 'Mumbai', subtitle: 'BOM · City of dreams', image: photo('photo-1529253355930-ddbe423a2ac7'), to: 'Mumbai', toCode: 'BOM' },
    { name: 'Jaipur', subtitle: 'JAI · The Pink City', image: photo('photo-1477587458883-47145ed94245'), to: 'Jaipur', toCode: 'JAI' },
    { name: 'Kochi', subtitle: 'COK · Kerala backwaters', image: photo('photo-1602216056096-3b40cc0c9944'), to: 'Kochi', toCode: 'COK' },
    { name: 'Dubai', subtitle: 'DXB · Shopping & skyline', image: photo('photo-1512453979798-5ea266f8880c'), to: 'Dubai', toCode: 'DXB' },
    { name: 'Singapore', subtitle: 'SIN · Marina Bay', image: photo('photo-1525625293386-3f8f99389edd'), to: 'Singapore', toCode: 'SIN' },
    { name: 'Bangkok', subtitle: 'BKK · Street food & temples', image: photo('photo-1508009603885-50cf7c579365'), to: 'Bangkok', toCode: 'BKK' },
    { name: 'London', subtitle: 'LHR · Thames & museums', image: photo('photo-1513635269975-59663e0ac1ad'), to: 'London', toCode: 'LHR' },
];

const TRUST = [
    { icon: '✈️', title: 'Live airline fares', text: 'Domestic and international flights with fares at the time of search.' },
    { icon: '🎓', title: 'Special fares', text: 'Student, senior citizen, armed forces and doctors & nurses fares.' },
    { icon: '💺', title: 'Seats & meals', text: 'Pick seats, meals and extra baggage before you pay, where offered.' },
    { icon: '🔒', title: 'Secure payment', text: 'Pay online through our bank payment gateway and get your e-ticket.' },
];

const FAQ = [
    { q: 'When do I get my PNR and e-ticket?', a: 'Your PNR usually appears within a few minutes of payment in My Profile → My Bookings. Full-service airlines may take a few hours to issue e-ticket numbers; low-cost airlines use the PNR as the ticket reference.' },
    { q: 'How do I get my boarding pass?', a: 'The airline issues the boarding pass after web check-in on its website or app, using your PNR and last name. Web check-in usually opens 48 hours (some airlines 24 hours) before departure.' },
    { q: 'Who can book special fares?', a: 'Students, senior citizens, armed forces personnel and doctors & nurses can choose their fare type before searching. Carry a valid ID for the fare type; the airline can check it at the airport.' },
    { q: 'What ID do I need at the airport?', a: 'A valid government photo ID for domestic flights and a passport (with visa where needed) for international flights. The name must match the ticket.' },
    { q: 'How early should I reach the airport?', a: 'At least 2 hours before departure for domestic flights and 3 hours for international flights. Boarding gates close 20–25 minutes before departure.' },
    { q: 'Can I cancel or change my flight?', a: 'Yes, as per the airline fare rules shown before booking, plus our service fee. Contact our support team with your Booking ID and PNR.' },
];

const formatDay = (value) => {
    if (!value) return '';
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

/* Sections under the flight search box */
export default function FlightLanding({ onPreset }) {
    const stored = useSyncExternalStore(
        () => () => {},
        () => localStorage.getItem(FLIGHT_RECENT_KEY) || '',
        () => ''
    );
    const [cleared, setCleared] = useState(false);
    const recent = cleared || !stored ? [] : readRecent(FLIGHT_RECENT_KEY).map((item) => {
        const s = item.search || {};
        const travellers = Number(s.adults || 1) + Number(s.children || 0) + Number(s.infants || 0);
        return {
            ...item,
            icon: item.tripType === 'ROUND_TRIP' ? '⇄' : '✈️',
            title: `${s.fromCode || s.from} → ${s.toCode || s.to}`,
            subtitle: `${formatDay(s.departureDate)}${item.tripType === 'ROUND_TRIP' && s.returnDate ? ` – ${formatDay(s.returnDate)}` : ''} · ${travellers} traveller${travellers > 1 ? 's' : ''}`,
        };
    });

    return (
        <div className="tl-wrap">
            {recent.length > 0 && (
                <section className="tl-section">
                    <RecentSearches
                        items={recent}
                        onPick={(item) => onPreset({ tripType: item.tripType, search: item.search })}
                        onClear={() => {
                            clearRecent(FLIGHT_RECENT_KEY);
                            setCleared(true);
                        }}
                    />
                </section>
            )}

            <section className="tl-section">
                <SectionHead kicker="Trending" title="Popular destinations" text="Tap a destination to fill it in; choose your departure city and date." />
                <DestinationGrid items={DESTINATIONS} onPick={(item) => onPreset({ to: item.to, toCode: item.toCode })} actionLabel="Fly to" />
            </section>

            <section className="tl-section">
                <TrustStrip items={TRUST} />
            </section>

            <section className="tl-section">
                <SectionHead kicker="Before you fly" title="Travel tips & FAQs" />
                <div className="tl-split">
                    <Faq items={FAQ} />
                    <aside className="tl-help">
                        <h3>Need help with a flight booking?</h3>
                        <p>Our support team can help with cancellations, date changes and extra baggage.</p>
                        <ul>
                            <li>Keep your Booking ID and PNR handy</li>
                            <li>Download your e-ticket from My Profile</li>
                        </ul>
                        <Link href="/contact">Contact support</Link>
                    </aside>
                </div>
            </section>
        </div>
    );
}
