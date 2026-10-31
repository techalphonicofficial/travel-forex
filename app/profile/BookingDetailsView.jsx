'use client';

import React, { useState } from "react";
import Link from "next/link";

import "./booking-details.css";
import { policySections, splitInclusions, toReadable } from "@/app/tripjack-hotels/hotelUtils";
import { createFlightTicketPdf, createHotelVoucherPdf, loadBrand } from "./ticketPdf";

/* ======================================================================
   Helpers (module level, so they are not re-created on every render)
   ====================================================================== */

const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// "2026-10-03" -> "03 Oct 2026" (no timezone shift, no time part)
const formatDateOnly = (value) => {
    if (!value) return "—";
    const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return String(value);
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatCurrency = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return `₹${number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const label = (value) =>
    String(value || "—")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const statusType = (value) => {
    const text = String(value || "").toLowerCase();
    if (/failed|cancel|rejected|not_confirmed|not_completed/.test(text)) return "danger";
    if (/refunded/.test(text)) return "success";
    if (/confirmed|booked|success|paid|completed/.test(text)) return "success";
    return "pending";
};

const nightsBetween = (from, to) => {
    if (!from || !to) return 0;
    const diff = Math.round(
        (new Date(String(to).slice(0, 10)) - new Date(String(from).slice(0, 10))) / 86400000
    );
    return diff > 0 ? diff : 0;
};

// API sends "Terminal 1" for some and "1" for others
const terminalText = (t) => (t ? (/terminal/i.test(t) ? t : `Terminal ${t}`) : "");

// Readable failure reason from whatever the API sends
const getFailureInfo = (booking) => {
    const data = booking.booking_data || {};
    const err =
        data.bookingError ||
        data.error ||
        (data.stay ?? data.tripjack)?.bookError ||
        (data.stay ?? data.tripjack)?.book?.errors?.[0] ||
        null;

    const message =
        (typeof err === "string" ? err : err?.message || err?.errMsg || err?.details) ||
        booking.failure_reason ||
        booking.error_message ||
        booking.failure_message ||
        data.failureReason ||
        "";

    return {
        message,
        type: err?.type,
        failedAt: err?.failedAt || booking.updated_at,
    };
};

// Fare / baggage changes reported by the provider (flight)
const getFlightAlerts = (booking) => {
    const rows = [];
    (booking.booking_data?.review?.alerts || []).forEach((alert) => {
        Object.entries(alert.miscAlert || {}).forEach(([sector, changes]) => {
            (changes || []).forEach((c) =>
                rows.push(`${sector} · ${c.key}: ${c.oldValue} → ${c.newValue}`)
            );
        });
    });
    return rows;
};

/* ======================================================================
   Small UI components (module level -> no remount on every render)
   ====================================================================== */

const Status = ({ value }) => {
    const type = statusType(value);
    return (
        <span
            style={{
                ...styles.badge,
                ...(type === "success"
                    ? styles.successBadge
                    : type === "danger"
                        ? styles.dangerBadge
                        : styles.pendingBadge),
            }}
        >
            {label(value)}
        </span>
    );
};

const SegmentCard = ({ segment, index, total, cabin, baggage, seat }) => {
    const airline = segment.fD?.aI || {};
    const dep = segment.da || {};
    const arr = segment.aa || {};
    const hasNext = index < total - 1;

    return (
        <div style={styles.segmentCard}>
            <div style={styles.segmentHeader}>
                <div style={styles.airlineIcon}>✈</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={styles.airlineName}>
                        {airline.name || airline.code || "Airline"}
                    </strong>
                    <span style={styles.muted}>
                        {airline.code || ""} {segment.fD?.fN || ""}
                    </span>
                </div>
                <span style={styles.flightTag}>Flight {index + 1}</span>
            </div>

            <div style={styles.route}>
                <div style={styles.routePoint}>
                    <strong style={styles.airportCode}>{dep.code || "—"}</strong>
                    <span style={styles.city}>{dep.city || dep.name || ""}</span>
                    <span style={styles.dateText}>{formatDate(segment.dt)}</span>
                    {dep.terminal && (
                        <span style={styles.terminal}>{terminalText(dep.terminal)}</span>
                    )}
                </div>

                <div style={styles.routeMiddle}>
                    <span style={styles.duration}>
                        {segment.duration != null ? `${segment.duration} min` : "Flight"}
                    </span>
                    <div style={styles.routeLine}>
                        <span style={styles.routeDot} />
                        <span style={styles.routeDash} />
                        <span style={styles.routePlane}>✈</span>
                        <span style={styles.routeDash} />
                        <span style={styles.routeDot} />
                    </div>
                    <span style={styles.routeCaption}>
                        {segment.stops > 0 ? `${segment.stops} stop` : "Non-stop"}
                    </span>
                </div>

                <div style={{ ...styles.routePoint, textAlign: "right" }}>
                    <strong style={styles.airportCode}>{arr.code || "—"}</strong>
                    <span style={styles.city}>{arr.city || arr.name || ""}</span>
                    <span style={styles.dateText}>{formatDate(segment.at)}</span>
                    {arr.terminal && (
                        <span style={styles.terminal}>{terminalText(arr.terminal)}</span>
                    )}
                </div>
            </div>

            <div style={styles.segmentFooter}>
                <span>Aircraft: {segment.fD?.eT || "—"}</span>
                <span>Class: {label(cabin)}</span>
                {baggage?.iB && <span>Check-in: {baggage.iB}</span>}
                {baggage?.cB && <span>Cabin: {baggage.cB}</span>}
                {seat && <span>Seat: {seat}</span>}
            </div>

            {hasNext && segment.cT > 0 && (
                <div style={styles.layover}>
                    Layover at {arr.city || arr.code}: {Math.floor(segment.cT / 60)}h{" "}
                    {segment.cT % 60}m
                </div>
            )}
        </div>
    );
};

const personName = (p) =>
    [p.title, p.firstName || p.fN, p.lastName || p.lN].filter(Boolean).join(" ") ||
    p.name ||
    p.fullName ||
    "Guest";

/* ======================================================================
   Customer page pieces
   ====================================================================== */

// What the customer is told for each booking status
const statusCopy = (code, isHotel) => {
    const what = isHotel ? "hotel" : "airline";
    switch (code) {
        case "BOOKED":
            return { tone: "success", icon: "✓", title: isHotel ? "Your stay is confirmed" : "Your flight is booked", text: isHotel ? "Show the voucher and a photo ID at check-in." : "Download your e-ticket and do web check-in to get the boarding pass." };
        case "BOOKING_IN_PROGRESS":
            return { tone: "pending", icon: "⏳", title: "Payment received", text: `We are confirming your booking with the ${what}. This page updates automatically.` };
        case "PAYMENT_PENDING":
        case "PENDING":
        case "INITIATED":
            return { tone: "pending", icon: "⏳", title: "Payment pending", text: "We have not received the payment for this booking yet. This page updates automatically." };
        case "PAYMENT_FAILED":
            return { tone: "danger", icon: "!", title: "Payment failed", text: "Your booking was not completed. If any amount was deducted, your bank will reverse it within 5–7 working days." };
        case "PAYMENT_NOT_COMPLETED":
            return { tone: "danger", icon: "!", title: "Payment not completed", text: "Your booking was not completed. If any amount was deducted, your bank will reverse it within 5–7 working days." };
        case "NOT_CONFIRMED":
            return { tone: "danger", icon: "!", title: "Booking not confirmed", text: `The fare could not be confirmed with the ${what}, so no payment was taken. Please search again.` };
        case "CANCELLED":
            return { tone: "danger", icon: "✕", title: "Booking cancelled", text: "This booking has been cancelled." };
        case "REFUNDED":
            return { tone: "neutral", icon: "↺", title: "Refunded", text: "The amount for this booking has been refunded." };
        default:
            return { tone: "danger", icon: "!", title: "Booking could not be confirmed", text: `We could not confirm your booking with the ${what}.` };
    }
};

const tripLabel = (tripType) =>
    ({ ONE_WAY: "One way", ROUND_TRIP: "Round trip", MULTI_CITY: "Multi city" })[String(tripType || "").toUpperCase()] || "";

// Airline web check-in pages; other airlines fall back to a web search
const WEB_CHECKIN = {
    "6E": "https://www.goindigo.in/web-check-in.html",
    AI: "https://www.airindia.com/in/en/manage/web-checkin.html",
    IX: "https://www.airindiaexpress.com/checkin-home",
};
const webCheckInUrl = (airline) =>
    WEB_CHECKIN[airline?.code] ||
    `https://www.google.com/search?q=${encodeURIComponent(`${airline?.name || airline?.code || "airline"} web check-in`)}`;

const RefValue = ({ title, value, copyable = true }) => {
    const [copied, setCopied] = useState(false);
    const text = value === null || value === undefined || value === "" ? "—" : String(value);
    const canCopy = copyable && text !== "—";
    return (
        <div className="bd-ref">
            <small>{title}</small>
            <strong>
                {text}
                {canCopy && (
                    <button
                        type="button"
                        aria-label={`Copy ${title}`}
                        onClick={() => {
                            navigator.clipboard?.writeText(text).then(() => {
                                setCopied(true);
                                setTimeout(() => setCopied(false), 1500);
                            }).catch(() => { });
                        }}
                    >
                        {copied ? "Copied" : "Copy"}
                    </button>
                )}
            </strong>
        </div>
    );
};

const Collapse = ({ title, hint, defaultOpen = false, children }) => (
    <details className="bd-collapse" open={defaultOpen}>
        <summary>
            <span>{title}</span>
            {hint && <small>{hint}</small>}
            <i aria-hidden="true" />
        </summary>
        <div className="bd-collapse-body">{children}</div>
    </details>
);

const Points = ({ points }) => (
    <ul className="bd-points">
        {points.map((point, index) => <li key={index}>{point}</li>)}
    </ul>
);

/* ======================================================================
   Booking details (used by /profile/[bookingId] and the My bookings modal)
   ====================================================================== */

export default function BookingDetailsView({ booking, embedded = false }) {
    const [downloading, setDownloading] = useState(false);

    const data = booking.booking_data || {};
    const bookingType = String(
        booking.booking_type || booking.bookingType || booking.type || "FLIGHT"
    ).toUpperCase();
    const isHotel = bookingType.includes("HOTEL");

    const isFailed = statusType(booking.status) === "danger";
    const paymentOk = /success|paid|captured/i.test(booking.payment_status || "");
    const isBooked = String(booking.status || "").toUpperCase() === "BOOKED";

    /* ---------- flight data ---------- */
    const review = data.review || {};
    const segments = isHotel
        ? []
        : (review.tripInfos || []).flatMap((trip) => trip.sI || []).length
            ? (review.tripInfos || []).flatMap((trip) => trip.sI || [])
            : (data.selectedFare || []).flatMap((f) => f.flight?.sI || []);

    const fareDetail = review.totalPriceInfo?.totalFareDetail?.fC || {};
    const adultFare = review.tripInfos?.[0]?.totalPriceList?.[0]?.fd?.ADULT;
    const cabin = adultFare?.cc || review.searchQuery?.cabinClass || "Economy";
    // "15Kilograms" -> "15 kg"
    const bag = (value) => (value ? String(value).replace(/\s*(kilograms?|kgs?)\b/i, " kg") : value);
    const baggage = adultFare?.bI ? { ...adultFare.bI, iB: bag(adultFare.bI.iB), cB: bag(adultFare.bI.cB) } : undefined;
    const seatRows = Array.isArray(data.addOns) && data.addOns.length
        ? data.addOns
            .filter((a) => a.type === "SEAT")
            .map((a) => ({ sectorKey: a.key, passengerIndex: a.passengerIndex, seat: { seatNo: a.code } }))
        : data.seatSelection?.seats || [];
    const seatForSegment = (segmentId) =>
        seatRows.filter((s) => String(s.sectorKey) === String(segmentId)).map((s) => s.seat?.seatNo).join(", ");
    const seatsByPax = {};
    seatRows.forEach((s) => {
        const key = s.passengerIndex ?? 0;
        seatsByPax[key] = [seatsByPax[key], s.seat?.seatNo].filter(Boolean).join(", ");
    });
    const seatTotal = Array.isArray(data.addOns) && data.addOns.length
        ? data.addOns.filter((a) => a.type === "SEAT").reduce((sum, a) => sum + Number(a.amount || 0), 0)
        : Number(data.seatSelection?.totalAmount || 0);
    const addOnItems = Array.isArray(data.addOns) ? data.addOns.filter((a) => a.type !== "SEAT") : [];

    /* ---------- hotel data ---------- */
    const hs = (data.stay ?? data.tripjack)?.summary || {};
    const hotelPricing =
        (data.stay ?? data.tripjack)?.review?.option?.pricing || (data.stay ?? data.tripjack)?.selectedOption?.pricing || {};
    const hotelRoom = hs.rooms?.[0];
    const hotelInfo = {
        name: data.hotel?.hotelName || hs.hotel?.name || booking.hotel_name,
        city: hs.hotel?.city || data.hotel?.city,
        address: hs.hotel?.address || data.hotel?.address,
        rating: hs.hotel?.rating || data.hotel?.starRating,
        checkIn: data.search?.checkIn || hs.stay?.checkIn,
        checkOut: data.search?.checkOut || hs.stay?.checkOut,
        checkInFrom: hs.hotel?.checkInFrom || data.hotel?.checkInFrom,
        checkOutBy: hs.hotel?.checkOutFrom || data.hotel?.checkOutBy,
        roomName: hotelRoom?.name || (data.stay ?? data.tripjack)?.review?.option?.roomInfo?.[0]?.name,
        mealBasis: hotelRoom?.mealBasis || (data.stay ?? data.tripjack)?.review?.option?.mealBasis,
        rooms: data.search?.rooms?.length || hs.rooms?.length,
        confirmation: (data.stay ?? data.tripjack)?.hotelConfirmationNumber || hs.hotelConfirmationNumber,
        refundable:
            hs.cancellation?.refundable ?? (data.stay ?? data.tripjack)?.review?.option?.cancellation?.isRefundable,
    };
    hotelInfo.nights = nightsBetween(hotelInfo.checkIn, hotelInfo.checkOut);

    /* ---------- people ---------- */
    const people = isHotel
        ? data.guests || hs.rooms?.flatMap((r) => r.guests || []) || []
        : data.passengers || data.travellerInfo || data.travellers || [];

    const amount = Number(
        booking.amount ?? fareDetail.TF ?? hotelPricing.totalPrice ?? 0
    );

    const failure = isFailed ? getFailureInfo(booking) : null;
    const flightAlerts = isFailed && !isHotel ? getFlightAlerts(booking) : [];
    const payment = booking.payment_data || {};

    const heading = isHotel
        ? hotelInfo.name || "Hotel booking"
        : segments.length
            ? `${segments[0].da?.city || segments[0].da?.code} → ${segments[segments.length - 1].aa?.city || segments[segments.length - 1].aa?.code
            }`
            : "Flight booking";

    // no airline PNR yet = no ticket to download or check in with
    const flightPnr = data.pnr || data.bookingDetails?.pnr || booking.pnr || "";
    const canDownload = isBooked && (isHotel ? true : segments.length > 0 && Boolean(flightPnr));

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            // values below are declared further down; they are ready by the time the button is clicked
            const brand = await loadBrand();
            const { doc, filename } = isHotel
                ? createHotelVoucherPdf({
                    brand,
                    booking,
                    hotelInfo,
                    guests: people,
                    amount,
                    breakup: {
                        base: breakup.base ?? hotelPricing.basePrice,
                        taxes: breakup.taxes,
                        discount: breakup.discount,
                    },
                    penalties,
                    inclusions,
                    policyBlocks: hotelPolicyBlocks,
                    minCheckInAge: hs.hotel?.minCheckInAge || data.hotel?.minCheckInAge,
                    directionsUrl,
                    paymentOk,
                })
                : createFlightTicketPdf({
                    brand,
                    booking,
                    journeys: (review.tripInfos || []).length ? review.tripInfos : [{ sI: segments }],
                    tripType: data.tripType,
                    passengers: people,
                    addOns: Array.isArray(data.addOns) && data.addOns.length
                        ? data.addOns
                        : seatRows.map((s) => ({ type: "SEAT", key: s.sectorKey, passengerIndex: s.passengerIndex, code: s.seat?.seatNo })),
                    seatsByPax,
                    cabin,
                    baggage,
                    pnr,
                    lowCost,
                    isDomestic,
                    amount,
                    fare: {
                        base: fareDetail.BF,
                        taxes: fareDetail.TAF,
                        seats: seatTotal,
                        extras: addOnItems.reduce((sum, a) => sum + Number(a.amount || 0), 0),
                        txn: payment.merchantTxnNo,
                    },
                    paymentOk,
                });
            doc.save(filename);
        } catch (error) {
            console.error("Unable to download ticket:", error);
            window.alert("Download failed. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const statusCode = String(booking.status || "").trim().toUpperCase();
    const refundedAmount = Number(booking.refunded_amount || 0);


    const copy = statusCopy(statusCode, isHotel);
    const pnr = data.pnr || data.bookingDetails?.pnr || booking.pnr || "";
    const contact = data.contact || data.primaryGuest || {};
    const breakup = data.amountBreakup || {};

    /* flight extras */
    const firstSegment = segments[0];
    const departsAt = firstSegment?.dt ? new Date(firstSegment.dt) : null;
    const upcoming = departsAt && !Number.isNaN(departsAt.getTime()) && departsAt > new Date();
    const airlines = [...new Map(segments.map((s) => [s.fD?.aI?.code, s.fD?.aI])).values()].filter((a) => a?.code);
    const isDomestic = review.searchQuery?.isDomestic !== false;

    /*
     * PNR / e-ticket numbers can arrive after the booking is confirmed.
     * Low-cost airlines issue no separate e-ticket number: the PNR is the ticket.
     */
    const lowCost = segments.length > 0 && segments.every((s) => s.fD?.aI?.isLcc === true);
    const ticketsMissing = !isHotel && isBooked && people.length > 0 && people.some((p) => !(p.ticketNumber || p.ticketNo));
    // automatic checks have ended (trip departed / gave up): stop saying "in a few minutes"
    const ticketingClosed = Boolean(data.ticketing?.gaveUp || (departsAt && !upcoming));
    const ticketNotice = isHotel || !isBooked
        ? null
        : !pnr
            ? ticketingClosed
                ? { tone: "fail", text: "We have not received the airline PNR for this booking. Please contact our support team with your Booking ID so we can resolve this for you." }
                : { tone: "progress", text: "Your booking is confirmed and the airline is generating your PNR. It usually appears here within a few minutes." }
            : ticketsMissing && !lowCost && !ticketingClosed
                ? { tone: "progress", text: "Your booking is confirmed. The airline is issuing your e-ticket numbers, which usually appear here within a few hours. You can use your PNR for web check-in and at the airport in the meantime." }
                : null;
    const pnrPlaceholder = ticketingClosed ? "Not received" : "Being generated";
    const ticketCell = (person) => {
        const ticket = person.ticketNumber || person.ticketNo;
        if (ticket) return ticket;
        if (!isBooked) return "—";
        if (lowCost && (person.pnr || pnr)) return "Use PNR";
        if (ticketingClosed) return "Not received";
        return pnr ? "Being issued" : "Pending";
    };

    /* hotel extras */
    const hotelCoords = hs.hotel?.lat
        ? { lat: hs.hotel.lat, long: hs.hotel.lng }
        : data.hotel?.coordinates?.lat ? data.hotel.coordinates : null;
    const directionsUrl = isHotel
        ? hotelCoords
            ? `https://www.google.com/maps/dir/?api=1&destination=${hotelCoords.lat},${hotelCoords.long}`
            : hotelInfo.name
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([hotelInfo.name, hotelInfo.address, hotelInfo.city].filter(Boolean).join(", "))}`
                : null
        : null;
    const hotelOption = (data.stay ?? data.tripjack)?.review?.option || {};
    const penalties = hotelOption.cancellation?.penalties?.length
        ? hotelOption.cancellation.penalties.map((p) => ({ from: p.from, to: p.to, amount: p.amount }))
        : (hs.cancellation?.penalties || []).map((p) => ({ from: p.fdt, to: p.tdt, amount: p.am }));
    // perks as a list; policy text sent with the room (JSON) as readable points
    const roomInclusions = splitInclusions(hotelOption.inclusions);
    const inclusions = roomInclusions.perks;
    const hotelPolicyBlocks = isHotel
        ? [
            ...(roomInclusions.notes.length ? [{ title: "Property information", groups: roomInclusions.notes }] : []),
            ...policySections(data.hotel || {}).map((section) => ({ title: section.title, groups: section.groups })),
            ...Object.entries(hs.instructions || {})
                .map(([group, value]) => ({ title: label(String(group).toLowerCase()), groups: toReadable(value) }))
                .filter((block) => block.groups.length),
        ]
        : [];

    return (
        <main className={`bd-page${embedded ? " bd-embedded" : ""}`}>
            <div className="bd-wrap">
                {!embedded && <Link href="/profile" className="bd-back">← My bookings</Link>}

                {/* STATUS + REFERENCES + ACTIONS */}
                <section className={`bd-hero bd-tone-${copy.tone}`}>
                    <div className="bd-hero-top">
                        <span className="bd-hero-icon" aria-hidden="true">{copy.icon}</span>
                        <div className="bd-hero-text">
                            <small>{isHotel ? "Hotel booking" : `Flight booking${tripLabel(data.tripType) ? ` · ${tripLabel(data.tripType)}` : ""}`}</small>
                            <h1 id="booking-details-title">{heading}</h1>
                            <p><b>{copy.title}.</b> {copy.text}</p>
                        </div>
                    </div>

                    <div className="bd-refs">
                        <RefValue title="Booking ID" value={booking.booking_reference} />
                        {!isHotel && <RefValue title="Airline PNR" value={pnr || (isBooked ? pnrPlaceholder : "—")} copyable={Boolean(pnr)} />}
                        {isHotel && <RefValue title="Hotel confirmation no." value={hotelInfo.confirmation || (isBooked ? "To be shared by the hotel" : "—")} copyable={Boolean(hotelInfo.confirmation)} />}
                        <RefValue title="Booked on" value={formatDate(booking.created_at)} copyable={false} />
                        <RefValue title={paymentOk ? "Amount paid" : "Amount"} value={formatCurrency(amount)} copyable={false} />
                    </div>

                    {(canDownload || (isBooked && !isHotel && upcoming && flightPnr) || directionsUrl) && (
                        <div className="bd-actions">
                            {canDownload && (
                                <button type="button" className="bd-btn" onClick={handleDownload} disabled={downloading}>
                                    {downloading ? "Preparing PDF…" : isHotel ? "⬇ Download voucher" : "⬇ Download e-ticket"}
                                </button>
                            )}
                            {isBooked && !isHotel && upcoming && flightPnr && airlines.map((airline) => (
                                <a key={airline.code} className="bd-btn bd-btn-outline" href={webCheckInUrl(airline)} target="_blank" rel="noopener noreferrer">
                                    🎫 Web check-in / boarding pass{airlines.length > 1 ? ` · ${airline.name || airline.code}` : ""}
                                </a>
                            ))}
                            {isBooked && directionsUrl && (
                                <a className="bd-btn bd-btn-outline" href={directionsUrl} target="_blank" rel="noopener noreferrer">📍 Get directions</a>
                            )}
                            <Link className="bd-btn bd-btn-ghost" href="/contact">Need help?</Link>
                        </div>
                    )}
                    {isBooked && !isHotel && upcoming && flightPnr && (
                        <p className="bd-hint">
                            The boarding pass is issued by the airline after web check-in. Web check-in usually opens 48 hours
                            (some airlines 24 hours) before departure and closes 60–75 minutes before departure.
                        </p>
                    )}

                    {booking.status === "BOOKING_IN_PROGRESS" && (
                        <div className="bd-progress" role="status"><span className="bd-spinner" /> Confirming your booking, please wait…</div>
                    )}
                    {ticketNotice?.tone === "progress" && (
                        <div className="bd-progress" role="status"><span className="bd-spinner" /> {ticketNotice.text}</div>
                    )}
                    {ticketNotice?.tone === "fail" && (
                        <div className="bd-fail" role="alert">
                            {ticketNotice.text}
                            <Link className="bd-link" href="/contact" style={{ marginTop: 4 }}>Contact support →</Link>
                        </div>
                    )}

                    {(refundedAmount > 0 || (data.refunds || []).length > 0) && (
                        <div className="bd-refund">
                            <strong>Refund {formatCurrency(refundedAmount)}</strong>
                            {(data.refunds || []).map((refund, index) => (
                                <span key={index}>
                                    {formatCurrency(refund.amount)} · {refund.status === "PROCESSING" ? "Processing" : "Refunded"} · {formatDate(refund.completedAt || refund.createdAt)}
                                </span>
                            ))}
                            <span>Refunds reach your original payment method in 5–7 working days.</span>
                        </div>
                    )}

                    {isFailed && !["PAYMENT_FAILED", "PAYMENT_NOT_COMPLETED", "NOT_CONFIRMED"].includes(statusCode) && (
                        <div className="bd-fail" role="alert">
                            {failure?.message && <div>Reason: <strong>{failure.message}</strong></div>}
                            {paymentOk && refundedAmount <= 0 && (
                                <div>Your payment of {formatCurrency(booking.amount)} is safe. A full refund will be processed to your original payment method, usually within 5–7 working days.</div>
                            )}
                            {flightAlerts.length > 0 && (
                                <ul>{flightAlerts.map((row) => <li key={row}>{row}</li>)}</ul>
                            )}
                        </div>
                    )}
                    {isFailed && ["PAYMENT_FAILED", "PAYMENT_NOT_COMPLETED", "NOT_CONFIRMED"].includes(statusCode) && (
                        <Link className="bd-link" href={isHotel ? "/hotel-booking" : "/flights"}>{isHotel ? "Search hotels" : "Search flights"} →</Link>
                    )}
                </section>

                <div className="bd-grid">
                    <div className="bd-main">
                        {/* FLIGHT ITINERARY */}
                        {!isHotel && (
                            <section className="bd-card">
                                <h2>Flight itinerary</h2>
                                {segments.length ? (
                                    <div style={styles.segmentList}>
                                        {segments.map((segment, index) => (
                                            <SegmentCard
                                                key={`${segment.id || segment.fD?.fN || "flight"}-${index}`}
                                                segment={segment}
                                                index={index}
                                                total={segments.length}
                                                cabin={cabin}
                                                baggage={baggage}
                                                seat={seatForSegment(segment.id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="bd-muted">Flight itinerary details are not available.</p>
                                )}
                            </section>
                        )}

                        {/* HOTEL */}
                        {isHotel && (
                            <section className="bd-card">
                                <div className="bd-hotel">
                                    {data.hotel?.image && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={data.hotel.image}
                                            alt={hotelInfo.name || "Hotel"}
                                            onError={(event) => { event.currentTarget.style.display = "none"; }}
                                        />
                                    )}
                                    <div>
                                        <h2 style={{ margin: 0 }}>{hotelInfo.name || "Hotel"}</h2>
                                        {hotelInfo.rating ? <span className="bd-stars">{"★".repeat(Math.round(hotelInfo.rating))}</span> : null}
                                        <p className="bd-muted">{[hotelInfo.address, hotelInfo.city].filter(Boolean).join(", ")}</p>
                                        {directionsUrl && <a className="bd-link" href={directionsUrl} target="_blank" rel="noopener noreferrer">View on map</a>}
                                    </div>
                                </div>

                                <div className="bd-stay">
                                    <div>
                                        <small>Check-in</small>
                                        <strong>{formatDateOnly(hotelInfo.checkIn)}</strong>
                                        <span>From {hotelInfo.checkInFrom || "—"}</span>
                                    </div>
                                    <em>{hotelInfo.nights ? `${hotelInfo.nights} night${hotelInfo.nights > 1 ? "s" : ""}` : "Stay"}</em>
                                    <div style={{ textAlign: "right" }}>
                                        <small>Check-out</small>
                                        <strong>{formatDateOnly(hotelInfo.checkOut)}</strong>
                                        <span>By {hotelInfo.checkOutBy || "—"}</span>
                                    </div>
                                </div>

                                <div className="bd-facts">
                                    <div><small>Room</small><strong>{hotelInfo.roomName || "—"}</strong></div>
                                    <div><small>Meal plan</small><strong>{hotelInfo.mealBasis ? label(String(hotelInfo.mealBasis).toLowerCase()) : "Room only"}</strong></div>
                                    <div><small>Rooms · Guests</small><strong>{hotelInfo.rooms || 1} · {people.length || "—"}</strong></div>
                                    <div>
                                        <small>Cancellation</small>
                                        <strong className={hotelInfo.refundable === false ? "bd-text-danger" : hotelInfo.refundable ? "bd-text-success" : ""}>
                                            {hotelInfo.refundable === false ? "Non-refundable" : hotelInfo.refundable ? "Refundable" : "As per policy"}
                                        </strong>
                                    </div>
                                </div>
                                {inclusions.length > 0 && (
                                    <ul className="bd-inclusions">{inclusions.map((item) => <li key={item}>✓ {item}</li>)}</ul>
                                )}
                            </section>
                        )}

                        {/* TRAVELLERS */}
                        {people.length > 0 && (
                            <section className="bd-card">
                                <h2>{isHotel ? "Guests" : "Travellers"} ({people.length})</h2>
                                <div className="bd-table" role="table">
                                    <div className="bd-tr bd-th" role="row">
                                        <span>Name</span>
                                        <span>{isHotel ? "Room" : "PNR"}</span>
                                        <span>{isHotel ? "ID" : "E-ticket no."}</span>
                                        <span>{isHotel ? "Type" : "Seat"}</span>
                                    </div>
                                    {people.map((person, index) => (
                                        <div className="bd-tr" role="row" key={person.id || index}>
                                            <span data-label="Name">
                                                <b>{personName(person)}</b>
                                                <small>{label(String(person.type || person.paxType || "ADULT").toLowerCase())}{person.isPrimary || person.isLead ? " · Lead" : ""}</small>
                                            </span>
                                            <span data-label={isHotel ? "Room" : "PNR"}>
                                                {isHotel ? `Room ${Number(person.roomIndex ?? 0) + 1}` : isBooked ? person.pnr || pnr || pnrPlaceholder : "—"}
                                            </span>
                                            <span data-label={isHotel ? "ID" : "E-ticket no."}>
                                                {isHotel ? (person.pan ? `PAN ${person.pan}` : person.passportNumber ? `Passport ${person.passportNumber}` : "—") : ticketCell(person)}
                                            </span>
                                            <span data-label={isHotel ? "Type" : "Seat"}>
                                                {isHotel ? (person.age != null && String(person.type).toUpperCase() === "CHILD" ? `Child, ${person.age} yrs` : label(String(person.type || "Adult").toLowerCase())) : seatsByPax[index] || person.seatNumber || "—"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {!isHotel && isBooked && lowCost && pnr && ticketsMissing && (
                                    <p className="bd-muted" style={{ margin: "8px 0 0", fontSize: 12 }}>
                                        {airlines.map((a) => a.name || a.code).join(", ")} does not issue a separate e-ticket number.
                                        Your PNR <b>{pnr}</b> is your ticket reference for web check-in and at the airport.
                                    </p>
                                )}
                                {!isHotel && addOnItems.length > 0 && (
                                    <div className="bd-addons">
                                        <h3>Meals & extra baggage</h3>
                                        {addOnItems.map((item, index) => {
                                            const person = people[item.passengerIndex] || {};
                                            const segment = segments.find((seg) => String(seg.id) === String(item.key));
                                            return (
                                                <div className="bd-row" key={`${item.passengerIndex}-${item.key}-${item.code}-${index}`}>
                                                    <span>{personName(person)}{segment ? ` · ${segment.da?.code}–${segment.aa?.code}` : ""}</span>
                                                    <b>{item.desc || item.code}{item.amount ? ` · ${formatCurrency(item.amount)}` : ""}</b>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* IMPORTANT INFORMATION */}
                        <section className="bd-card">
                            <h2>Important information</h2>
                            {isHotel ? (
                                <>
                                    <Collapse title="Cancellation policy" hint={hotelInfo.refundable === false ? "Non-refundable" : hotelInfo.refundable ? "Refundable" : ""} defaultOpen={isBooked}>
                                        {penalties.length ? (
                                            <div className="bd-penalties">
                                                <div className="bd-row bd-row-head"><span>If you cancel</span><b>Charge</b></div>
                                                {penalties.map((p, index) => (
                                                    <div className="bd-row" key={index}>
                                                        <span>{formatDate(p.from)} – {formatDate(p.to)}</span>
                                                        <b className={Number(p.amount) === 0 ? "bd-text-success" : ""}>{Number(p.amount) === 0 ? "Free" : formatCurrency(p.amount)}</b>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="bd-muted">{hotelInfo.refundable === false ? "This booking is non-refundable." : "Cancellation charges apply as per the hotel policy."}</p>
                                        )}
                                        <p className="bd-muted">To cancel, contact our support team with your Booking ID.</p>
                                    </Collapse>
                                    <Collapse title="Check-in rules">
                                        <Points points={[
                                            `Check-in from ${hotelInfo.checkInFrom || "the hotel's standard time"}, check-out by ${hotelInfo.checkOutBy || "the hotel's standard time"}.`,
                                            (hs.hotel?.minCheckInAge || data.hotel?.minCheckInAge) && `Minimum check-in age is ${hs.hotel?.minCheckInAge || data.hotel?.minCheckInAge} years.`,
                                            "Show this voucher (printed or on your phone) and a valid government photo ID for every guest at check-in.",
                                            "Foreign nationals must carry a passport and a valid visa.",
                                            "Early check-in and late check-out depend on availability and may be charged by the hotel.",
                                            "Extra charges (food, minibar, laundry, security deposit) are payable directly at the hotel.",
                                        ].filter(Boolean)} />
                                    </Collapse>
                                    {hotelPolicyBlocks.map((block, index) => (
                                        <Collapse key={`${block.title}-${index}`} title={block.title}>
                                            {block.groups.map((group, groupIndex) => (
                                                <div key={groupIndex} className="bd-points-group">
                                                    {group.label && <h4>{group.label}</h4>}
                                                    <Points points={group.points} />
                                                </div>
                                            ))}
                                        </Collapse>
                                    ))}
                                </>
                            ) : (
                                <>
                                    <Collapse title="Web check-in & boarding pass" defaultOpen={isBooked && upcoming}>
                                        <Points points={[
                                            "Web check-in is done on the airline's website or app using your PNR and last name.",
                                            "Web check-in usually opens 48 hours before departure (24 hours for some airlines) and closes 60–75 minutes before departure.",
                                            "After web check-in the airline issues your boarding pass; keep it on your phone or print it.",
                                            "Seats not selected during booking are given by the airline at check-in.",
                                        ]} />
                                    </Collapse>
                                    <Collapse title="Baggage" hint={[baggage?.iB && `Check-in ${baggage.iB}`, baggage?.cB && `Cabin ${baggage.cB}`].filter(Boolean).join(" · ")}>
                                        <Points points={[
                                            `Check-in baggage: ${baggage?.iB || "as per airline policy"}.`,
                                            `Cabin baggage: ${baggage?.cB || "as per airline policy"}.`,
                                            "Extra baggage bought at the airport costs more than when booked in advance.",
                                        ]} />
                                    </Collapse>
                                    <Collapse title="At the airport">
                                        <Points points={[
                                            `Reach the airport at least ${isDomestic ? "2 hours" : "3 hours"} before departure.`,
                                            "Carry a valid government photo ID (passport for international travel) matching the name on the ticket.",
                                            "Check the terminal shown above; airlines can change terminals and timings — check with the airline before leaving.",
                                            "Boarding gates close 20–25 minutes before departure.",
                                        ]} />
                                    </Collapse>
                                    <Collapse title="Cancellation & changes">
                                        <Points points={[
                                            "Cancellation and date-change charges are as per the airline fare rules shown at booking, plus our service fee.",
                                            "To cancel or change, contact our support team with your Booking ID and PNR.",
                                            "If you miss the flight (no-show), only the refundable taxes can be claimed.",
                                        ]} />
                                    </Collapse>
                                </>
                            )}
                        </section>
                    </div>

                    {/* SIDE */}
                    <aside className="bd-side">
                        <section className="bd-card">
                            <h2>Payment summary</h2>
                            {isHotel ? (
                                <>
                                    <div className="bd-row"><span>Room charges</span><b>{formatCurrency(breakup.base ?? hotelPricing.basePrice ?? amount)}</b></div>
                                    {Number(breakup.taxes) > 0 && <div className="bd-row"><span>Taxes & fees</span><b>{formatCurrency(breakup.taxes)}</b></div>}
                                    {Number(breakup.discount) > 0 && <div className="bd-row"><span>Discount</span><b className="bd-text-success">− {formatCurrency(breakup.discount)}</b></div>}
                                </>
                            ) : (
                                <>
                                    {fareDetail.BF != null && <div className="bd-row"><span>Base fare</span><b>{formatCurrency(fareDetail.BF)}</b></div>}
                                    {fareDetail.TAF != null && <div className="bd-row"><span>Taxes & fees</span><b>{formatCurrency(fareDetail.TAF)}</b></div>}
                                    {seatTotal > 0 && <div className="bd-row"><span>Seats</span><b>{formatCurrency(seatTotal)}</b></div>}
                                    {addOnItems.length > 0 && (
                                        <div className="bd-row"><span>Meals & baggage</span><b>{formatCurrency(addOnItems.reduce((sum, a) => sum + Number(a.amount || 0), 0))}</b></div>
                                    )}
                                </>
                            )}
                            <div className="bd-row bd-total"><span>{paymentOk ? "Total paid" : "Total"}</span><b>{formatCurrency(amount)}</b></div>
                            <div className="bd-row"><span>Payment</span><Status value={booking.payment_status || "PENDING"} /></div>
                            {payment.merchantTxnNo && <div className="bd-row"><span>Transaction ID</span><b className="bd-mono">{payment.merchantTxnNo}</b></div>}
                        </section>

                        {(contact.email || contact.mobile) && (
                            <section className="bd-card">
                                <h2>Contact details</h2>
                                <p className="bd-muted" style={{ marginTop: 0 }}>Updates about this booking are sent here.</p>
                                {contact.email && <div className="bd-row"><span>Email</span><b>{contact.email}</b></div>}
                                {contact.mobile && <div className="bd-row"><span>Mobile</span><b>{contact.countryCode ? `${contact.countryCode} ` : ""}{contact.mobile}</b></div>}
                            </section>
                        )}

                        <section className="bd-card bd-help">
                            <h2>Need help?</h2>
                            <p className="bd-muted">For cancellation, changes or any question, contact our support team with your Booking ID <b>{booking.booking_reference}</b>.</p>
                            <Link className="bd-btn bd-btn-outline" href="/contact">Contact support</Link>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        width: "100%",
        background: "#f8fafc",
        padding: "24px 16px",
        boxSizing: "border-box",
    },
    pageContent: {
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
    },
    loadingCard: {
        padding: "48px 24px",
        textAlign: "center",
        color: "#475569",
        fontSize: "14px",
    },
    emptyPage: {
        padding: "48px 24px",
        textAlign: "center",
        color: "#b91c1c",
        fontSize: "14px",
    },
    pendingBox: {
        padding: "14px 16px",
        marginBottom: "18px",
        border: "1px solid #fcd34d",
        borderRadius: "10px",
        background: "#fffbeb",
        color: "#92400e",
        fontSize: "13px",
        lineHeight: 1.5,
    },
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
    },
    modal: {
        width: "100%",
        maxWidth: "960px",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        color: "#1f2937",
    },
    header: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        padding: "22px 26px",
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
    },
    eyebrow: {
        display: "block",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "1.2px",
        color: "#2563eb",
        marginBottom: "5px",
    },
    title: {
        fontSize: "23px",
        fontWeight: 700,
        color: "#111827",
        margin: 0,
        overflowWrap: "anywhere",
    },
    subtitle: {
        fontSize: "13px",
        color: "#6b7280",
        margin: "6px 0 0",
        overflowWrap: "anywhere",
    },
    closeButton: {
        width: "36px",
        height: "36px",
        border: "1px solid #e5e7eb",
        borderRadius: "9px",
        background: "#f9fafb",
        color: "#374151",
        fontSize: "26px",
        lineHeight: 1,
        cursor: "pointer",
        flexShrink: 0,
    },
    body: {
        padding: "22px 26px",
        overflowY: "auto",
        flex: 1,
        minHeight: 0,
        background: "#f9fafb",
    },
    failBox: {
        marginBottom: "18px",
        padding: "14px 16px",
        borderRadius: "12px",
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        color: "#7f1d1d",
        fontSize: "13px",
        lineHeight: 1.55,
    },
    failTitle: {
        display: "block",
        fontSize: "15px",
        marginBottom: "6px",
    },
    section: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "18px",
    },
    sectionTitle: {
        fontSize: "16px",
        fontWeight: 700,
        color: "#111827",
        margin: "0 0 18px",
        paddingBottom: "12px",
        borderBottom: "1px solid #f1f5f9",
    },
    infoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "18px 20px",
    },
    infoItem: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        minWidth: 0,
    },
    infoLabel: {
        color: "#6b7280",
        fontSize: "12px",
        fontWeight: 500,
    },
    infoValue: {
        color: "#1f2937",
        fontSize: "13px",
        fontWeight: 600,
        overflowWrap: "anywhere",
    },
    statusRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "28px",
        borderTop: "1px solid #f1f5f9",
        paddingTop: "16px",
        marginTop: "20px",
    },
    badge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
        marginTop: "6px",
    },
    successBadge: { background: "#dcfce7", color: "#166534" },
    dangerBadge: { background: "#fee2e2", color: "#b91c1c" },
    pendingBadge: { background: "#dbeafe", color: "#1d4ed8" },
    segmentList: { display: "flex", flexDirection: "column", gap: "14px" },
    segmentCard: {
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "16px",
        background: "#fff",
    },
    segmentHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "22px",
    },
    airlineIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: "#eff6ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "19px",
    },
    airlineName: { display: "block", fontSize: "14px", color: "#111827" },
    muted: {
        display: "block",
        color: "#6b7280",
        fontSize: "12px",
        marginTop: "3px",
    },
    flightTag: {
        fontSize: "11px",
        color: "#475569",
        background: "#f1f5f9",
        borderRadius: "6px",
        padding: "5px 8px",
    },
    route: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(100px, 1fr) minmax(0, 1fr)",
        alignItems: "center",
        gap: "12px",
    },
    routePoint: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        minWidth: 0,
    },
    airportCode: { fontSize: "24px", fontWeight: 700, color: "#111827" },
    city: { fontSize: "12px", color: "#4b5563", overflowWrap: "anywhere" },
    dateText: { fontSize: "11px", color: "#6b7280" },
    terminal: { fontSize: "11px", color: "#6b7280" },
    routeMiddle: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        minWidth: 0,
    },
    duration: { fontSize: "11px", fontWeight: 600, color: "#475569" },
    routeLine: { width: "100%", display: "flex", alignItems: "center", gap: "3px" },
    routeDot: {
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "#2563eb",
        flexShrink: 0,
    },
    routeDash: { height: "1px", background: "#93c5fd", flex: 1 },
    routePlane: { color: "#2563eb", fontSize: "15px", flexShrink: 0 },
    routeCaption: { fontSize: "10px", color: "#9ca3af" },
    segmentFooter: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px 20px",
        borderTop: "1px solid #f1f5f9",
        marginTop: "18px",
        paddingTop: "12px",
        fontSize: "11px",
        color: "#64748b",
    },
    layover: {
        marginTop: "12px",
        padding: "8px 10px",
        borderRadius: "8px",
        background: "#fffbeb",
        border: "1px solid #fde68a",
        color: "#92400e",
        fontSize: "11px",
        fontWeight: 600,
    },
    hotelName: { display: "block", fontSize: "17px", color: "#111827" },
    stayBox: {
        padding: "16px",
        marginBottom: "20px",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        background: "#f8fafc",
    },
    stayDate: { fontSize: "17px", color: "#111827" },
    details: {
        marginTop: "20px",
        padding: "12px 14px",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        background: "#f9fafb",
    },
    summary: {
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
        color: "#1d4ed8",
    },
    policyTitle: { display: "block", fontSize: "12px", color: "#111827" },
    policyText: {
        margin: "4px 0 0",
        fontSize: "12px",
        lineHeight: 1.55,
        color: "#4b5563",
    },
    passengerList: { display: "flex", flexDirection: "column", gap: "12px" },
    passengerCard: {
        padding: "15px",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        background: "#fff",
    },
    passengerHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "18px",
    },
    avatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "#dbeafe",
        color: "#1d4ed8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: 700,
    },
    passengerName: { display: "block", fontSize: "14px", color: "#111827" },
    amountCard: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "10px",
        padding: "17px",
        marginBottom: "20px",
    },
    amountLabel: { display: "block", fontSize: "12px", color: "#475569" },
    amount: {
        display: "block",
        fontSize: "25px",
        fontWeight: 800,
        color: "#1d4ed8",
        marginTop: "5px",
    },
    empty: {
        padding: "18px",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "13px",
        background: "#f9fafb",
        borderRadius: "8px",
    },
    footer: {
        display: "flex",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: "10px",
        padding: "14px 26px",
        borderTop: "1px solid #e5e7eb",
        background: "#fff",
    },
    downloadButton: {
        padding: "10px 18px",
        borderRadius: "8px",
        border: "1px solid #1d4ed8",
        background: "#2563eb",
        color: "#fff",
        fontWeight: 700,
        fontSize: "13px",
        cursor: "pointer",
    },
    footerButton: {
        padding: "10px 24px",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        background: "#fff",
        color: "#334155",
        fontWeight: 600,
        fontSize: "13px",
        cursor: "pointer",
    },
};
