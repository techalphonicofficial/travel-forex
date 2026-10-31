'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import '../hotels-booking.css';
import HotelDetails from '../HotelDetails';
import { SELECTED_HOTEL_KEY } from '../hotelUtils';

export default function HotelDetailsPage() {
    const router = useRouter();

    /* null => not hydrated yet, '' => no hotel selected in this tab */
    const stored = useSyncExternalStore(
        () => () => {},
        () => sessionStorage.getItem(SELECTED_HOTEL_KEY) || '',
        () => null
    );

    const hotel = useMemo(() => {
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }, [stored]);

    return (
        <main className="hb-page">
            {hotel?.hotelId && hotel?.search ? (
                <HotelDetails key={hotel.hotelId} hotel={hotel} />
            ) : (
                <div className="hb-container" style={{ paddingTop: 40 }}>
                    <div className="hb-empty">
                        {stored === null ? (
                            <span>Loading hotel…</span>
                        ) : (
                            <>
                                <strong>Hotel not found</strong>
                                <span>Please search again to see the latest prices.</span>
                                <button type="button" className="hb-btn" onClick={() => router.push('/hotel-booking')}>Search hotels</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
