'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getBookingDetailsByBookingReference } from "@/utils/api";
import BookingDetailsView from "../BookingDetailsView";
import "../booking-details.css";

const Page = () => {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");

    useEffect(() => {
        if (!bookingId) return;

        let active = true;
        let timer;

        const isPendingStatus = (value) =>
            ["PENDING", "BOOKING_PENDING", "BOOKING_IN_PROGRESS", "PROCESSING", "INITIATED", "ON_HOLD", "PAYMENT_PENDING"].includes(
                String(value || "").trim().toUpperCase()
            );

        let attempts = 0;
        // every 3s for the first 2 minutes, then every 10s
        const nextDelay = () => (++attempts < 40 ? 3000 : 10000);

        const fetchBookingDetails = async () => {
            try {
                const response = await getBookingDetailsByBookingReference(bookingId);
                if (!active) return;

                if (response?.success === false) {
                    if ([401, 403].includes(response.status)) {
                        setFetchError("LOGIN");
                        return;
                    }
                    if (response.status === 404) {
                        setFetchError("Booking not found. Please check the booking reference.");
                        return;
                    }
                    throw new Error(response.message || "Unable to fetch booking details.");
                }

                const result = response?.data?.data ?? response?.data ?? response;
                setBooking(result);
                setFetchError("");

                const currentStatus =
                    result?.status ??
                    result?.order?.status ??
                    result?.booking?.status;

                // booked flight still waiting for the PNR / e-ticket numbers
                const ticketing = result?.booking_data?.ticketing;
                const waitingForTickets =
                    String(currentStatus || "").toUpperCase() === "BOOKED" &&
                    ticketing && !ticketing.complete && !ticketing.gaveUp;

                if (isPendingStatus(currentStatus)) {
                    timer = setTimeout(fetchBookingDetails, nextDelay());
                } else if (waitingForTickets) {
                    timer = setTimeout(fetchBookingDetails, 2 * 60 * 1000);
                }
            } catch (error) {
                if (!active) return;
                console.error("Error fetching booking details:", error);
                setFetchError(error?.message || "Unable to fetch booking details.");
                // Retry while the booking state is not yet available.
                timer = setTimeout(fetchBookingDetails, nextDelay());
            } finally {
                if (active) setLoading(false);
            }
        };

        setLoading(true);
        fetchBookingDetails();

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [bookingId]);

    if (loading && !booking) {
        return (
            <main className="bd-page">
                <div className="bd-wrap">
                    <div className="bd-card">Loading booking details...</div>
                </div>
            </main>
        );
    }

    if (!booking) {
        return (
            <main className="bd-page">
                <div className="bd-wrap">
                    <div role="alert" className="bd-card">
                        {fetchError === "LOGIN" ? (
                            <>
                                Please log in to view this booking.{" "}
                                <a
                                    href={`/auth/login?redirect=${encodeURIComponent(`/profile/${bookingId}`)}`}
                                    style={{ color: "#1765c1", fontWeight: 700 }}
                                >
                                    Log in
                                </a>
                            </>
                        ) : (
                            fetchError || "Booking details are not available."
                        )}
                    </div>
                </div>
            </main>
        );
    }

    return <BookingDetailsView booking={booking} />;
};

export default Page;
