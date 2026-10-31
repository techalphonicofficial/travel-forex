'use client';

import React, { useEffect } from "react";
import Link from "next/link";

import BookingDetailsView from "./BookingDetailsView";

/* "View details" on My bookings: the same view as /profile/[reference] */
const BookingDetailsModal = ({ booking, onClose }) => {
    useEffect(() => {
        if (!booking) return undefined;

        const onKeyDown = (event) => {
            if (event.key === "Escape") onClose?.();
        };
        document.addEventListener("keydown", onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [booking, onClose]);

    if (!booking) return null;

    return (
        <div className="bd-modal-backdrop" role="presentation" onClick={onClose}>
            <div
                className="bd-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="booking-details-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="bd-modal-head">
                    <strong>Booking details</strong>
                    <span>
                        {booking.booking_reference && (
                            <Link href={`/profile/${encodeURIComponent(booking.booking_reference)}`} className="bd-link" style={{ marginTop: 0 }}>
                                Open full page
                            </Link>
                        )}
                        <button type="button" className="bd-modal-close" onClick={onClose} aria-label="Close">✕</button>
                    </span>
                </div>
                <div className="bd-modal-body">
                    <BookingDetailsView booking={booking} embedded />
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsModal;
