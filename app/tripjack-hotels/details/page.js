'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import HotelDetails from '../HotelDetails';

export default function HotelDetailsPage() {
    const searchParams = useSearchParams();

    const hotelId = searchParams.get('hotelId');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const currency = searchParams.get('currency') || 'INR';
    const nationality = searchParams.get('nationality') || '106';
    const correlationId=searchParams.get('correlationId') || null

    console.log(correlationId,searchParams)

    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        try {
            const savedHotel = sessionStorage.getItem(
                'tripjack_selected_hotel'
            );

            const savedSearch = sessionStorage.getItem(
                'tripjack_hotel_search'
            );

            if (!savedHotel) {
                setError('Hotel details session not found.');
                return;
            }

            const parsedHotel = JSON.parse(savedHotel);

            setHotel(parsedHotel);

            if (savedSearch) {
                const parsedSearch = JSON.parse(savedSearch);

                console.log("Parsed search ",parsedSearch)

                setRooms(parsedSearch.rooms || []);

            
            }
        } catch (err) {
            console.error(
                'Unable to restore TripJack hotel details:',
                err
            );

            setError(
                'Unable to load hotel details. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="container py-5">
                <div className="text-center">
                    <div
                        className="spinner-border text-success"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Loading...
                        </span>
                    </div>

                    <div className="mt-3">
                        Loading hotel details...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger">
                    {error}
                </div>
            </div>
        );
    }

    if (!hotel) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning">
                    Hotel not found.
                </div>
            </div>
        );
    }

    return (
        <HotelDetails
            hotel={hotel}
            checkIn={checkIn}
            checkOut={checkOut}
            rooms={rooms}
            currency={currency}
            nationality={nationality}
            correlationId={correlationId}
        />
    );
}