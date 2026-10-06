import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

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
    if (/failed|cancel|refund|rejected/.test(text)) return "danger";
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

const maskPan = (pan) =>
    pan && pan.length >= 10 ? `${pan.slice(0, 4)}•••••${pan.slice(-1)}` : "";

// Readable failure reason from whatever the API sends
const getFailureInfo = (booking) => {
    const data = booking.booking_data || {};
    const err =
        data.bookingError ||
        data.error ||
        data.tripjack?.bookError ||
        data.tripjack?.book?.errors?.[0] ||
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

const Info = ({ label: title, value, children }) => (
    <div style={styles.infoItem}>
        <span style={styles.infoLabel}>{title}</span>
        <strong style={styles.infoValue}>
            {children ??
                (value !== null && value !== undefined && value !== ""
                    ? String(value)
                    : "—")}
        </strong>
    </div>
);

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

const Section = ({ title, children }) => (
    <section style={styles.section}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {children}
    </section>
);

const PersonCard = ({ person, index, seat, isHotel }) => {
    const firstName = person.firstName || person.fN || "";
    const lastName = person.lastName || person.lN || "";
    const name =
        [person.title, firstName, lastName].filter(Boolean).join(" ") ||
        person.name ||
        person.fullName ||
        (isHotel ? "Guest" : "Passenger");

    const dob = person.dateOfBirth || person.dob;

    return (
        <div style={styles.passengerCard}>
            <div style={styles.passengerHeader}>
                <div style={styles.avatar}>{name.charAt(0).toUpperCase()}</div>
                <div>
                    <strong style={styles.passengerName}>{name}</strong>
                    <span style={styles.muted}>
                        {isHotel ? "Guest" : "Passenger"} {index + 1}
                        {person.isPrimary ? " · Primary guest" : ""}
                    </span>
                </div>
            </div>

            <div style={styles.infoGrid}>
                <Info
                    label={isHotel ? "Guest type" : "Passenger type"}
                    value={label(person.paxType || person.type || person.passengerType)}
                />
                {person.gender && <Info label="Gender" value={label(person.gender)} />}
                {dob && <Info label="Date of birth" value={formatDateOnly(dob)} />}
                {person.nationality && (
                    <Info label="Nationality" value={person.nationality} />
                )}
                {(person.email || person.emailId) && (
                    <Info label="Email" value={person.email || person.emailId} />
                )}
                {(person.mobile || person.contactNumber || person.phone) && (
                    <Info
                        label="Mobile"
                        value={person.mobile || person.contactNumber || person.phone}
                    />
                )}
                {isHotel && person.pan && (
                    <Info label="PAN" value={maskPan(person.pan)} />
                )}
                {!isHotel && (person.passportNo || person.passportNumber) && (
                    <Info
                        label="Passport number"
                        value={person.passportNo || person.passportNumber}
                    />
                )}
                {!isHotel && (
                    <Info
                        label="Ticket number"
                        value={person.ticketNumber || person.ticketNo || "Not issued yet"}
                    />
                )}
                {!isHotel && (
                    <Info label="Seat" value={seat || person.seatNumber || "Not selected"} />
                )}
            </div>
        </div>
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

/* ======================================================================
   PDF generation
   ====================================================================== */

const PDF_COLORS = {
    navy: [24, 39, 75],
    blue: [61, 91, 245],
    paleBlue: [239, 243, 255],
    ink: [31, 41, 55],
    muted: [100, 116, 139],
    border: [220, 226, 238],
};

const createPdfKit = (footerText) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const { navy, blue, paleBlue, ink, muted, border } = PDF_COLORS;
    const kit = { doc, pageWidth, pageHeight, margin, contentWidth, y: 14, page: 1 };

    kit.setFont = (size, bold = false, color = ink) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
    };

    kit.footer = () => {
        doc.setDrawColor(...border);
        doc.setLineWidth(0.25);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        kit.setFont(7, false, muted);
        doc.text(footerText, margin, pageHeight - 7);
        doc.text(`Page ${kit.page}`, pageWidth - margin, pageHeight - 7, { align: "right" });
    };

    kit.ensureSpace = (height) => {
        if (kit.y + height > pageHeight - 18) {
            kit.footer();
            doc.addPage();
            kit.page += 1;
            kit.y = 16;
        }
    };

    kit.section = (title, subtitle = "") => {
        kit.ensureSpace(14);
        kit.setFont(11, true, navy);
        doc.text(title.toUpperCase(), margin, kit.y + 4);
        if (subtitle) {
            kit.setFont(7.5, false, muted);
            doc.text(subtitle, pageWidth - margin, kit.y + 4, { align: "right" });
        }
        doc.setDrawColor(...border);
        doc.setLineWidth(0.25);
        doc.line(margin, kit.y + 7, pageWidth - margin, kit.y + 7);
        kit.y += 13;
    };

    kit.header = (title, subtitle, statusText) => {
        doc.setFillColor(...blue);
        doc.roundedRect(margin, kit.y, contentWidth, 27, 3, 3, "F");
        kit.setFont(16, true, [255, 255, 255]);
        doc.text(title, margin + 7, kit.y + 11);
        kit.setFont(8, false, [235, 240, 255]);
        doc.text(subtitle, margin + 7, kit.y + 18);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(pageWidth - margin - 35, kit.y + 7, 28, 10, 5, 5, "F");
        kit.setFont(7.5, true, blue);
        doc.text(statusText, pageWidth - margin - 21, kit.y + 13.3, { align: "center" });
        kit.y += 33;
    };

    // items: [{label, value}] x3 on top row, small lines x2 on bottom row
    kit.summary = (top, bottom) => {
        const y0 = kit.y;
        doc.setFillColor(...paleBlue);
        doc.setDrawColor(207, 218, 255);
        doc.roundedRect(margin, y0, contentWidth, 29, 2.5, 2.5, "FD");
        const cols = [
            margin + 6,
            margin + contentWidth * 0.37,
            margin + contentWidth * 0.68,
        ];
        top.forEach((item, i) => {
            kit.setFont(7, false, muted);
            doc.text(item.label.toUpperCase(), cols[i], y0 + 8);
            kit.setFont(i === 2 ? 10 : 8.5, true, i === 2 ? blue : navy);
            doc.text(String(item.value ?? "—"), cols[i], y0 + 16);
        });
        kit.setFont(7, false, muted);
        bottom.forEach((text, i) => doc.text(text, cols[i], y0 + 23));
        kit.y += 36;
    };

    kit.paragraph = (text, size = 7, color = muted) => {
        kit.setFont(size, false, color);
        const lines = doc.splitTextToSize(text, contentWidth);
        kit.ensureSpace(lines.length * (size * 0.45) + 4);
        doc.text(lines, margin, kit.y);
        kit.y += lines.length * (size * 0.45) + 4;
    };

    return kit;
};

// jsPDF built-in Helvetica has no rupee glyph, so "INR" is used.
const pdfMoney = (value) =>
    `INR ${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const personName = (p) =>
    [p.title, p.firstName || p.fN, p.lastName || p.lN].filter(Boolean).join(" ") ||
    p.name ||
    p.fullName ||
    "Guest";

const createFlightTicketPdf = ({ booking, segments, passengers, seatsByPax, cabin, amount }) => {
    const data = booking.booking_data || {};
    const kit = createPdfKit(
        "Travel itinerary - Please verify flight status with the airline before departure"
    );
    const { doc, margin, contentWidth, pageWidth } = kit;
    const { navy, blue, muted, ink, border } = PDF_COLORS;
    const ref = booking.booking_reference || data.bookingId || "—";

    kit.header("FLIGHT E-TICKET", "PASSENGER ITINERARY", label(booking.status || "PENDING").toUpperCase());

    kit.summary(
        [
            { label: "Booking reference", value: ref },
            { label: "Booking date", value: formatDate(booking.created_at) },
            { label: "Total paid", value: pdfMoney(amount) },
        ],
        [
            `PNR: ${data.pnr || data.bookingDetails?.pnr || booking.pnr || "Not available"}`,
            `Payment: ${label(booking.payment_status || "PENDING")}`,
        ]
    );

    kit.section("Flight itinerary", `${segments.length} flight${segments.length === 1 ? "" : "s"}`);

    segments.forEach((segment, index) => {
        const airline = segment.fD?.aI || {};
        const dep = segment.da || {};
        const arr = segment.aa || {};
        const cardHeight = 43;
        kit.ensureSpace(cardHeight + 3);
        const cardY = kit.y;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...border);
        doc.roundedRect(margin, cardY, contentWidth, cardHeight, 2.5, 2.5, "FD");
        doc.setFillColor(247, 249, 255);
        doc.roundedRect(margin + 0.3, cardY + 0.3, contentWidth - 0.6, 11, 2, 2, "F");

        kit.setFont(8.5, true, navy);
        doc.text(
            `${airline.name || airline.code || "Airline"}  ${airline.code || ""}${segment.fD?.fN || ""}`.trim(),
            margin + 5,
            cardY + 7.2
        );
        kit.setFont(7, true, blue);
        doc.text(`FLIGHT ${index + 1}`, pageWidth - margin - 5, cardY + 7.2, { align: "right" });

        const routeY = cardY + 20;
        const leftX = margin + 6;
        const rightX = pageWidth - margin - 6;
        kit.setFont(16, true, blue);
        doc.text(String(dep.code || "—"), leftX, routeY + 1);
        doc.text(String(arr.code || "—"), rightX, routeY + 1, { align: "right" });
        kit.setFont(7, false, muted);
        doc.text(String(dep.city || dep.name || ""), leftX, routeY + 6);
        doc.text(String(arr.city || arr.name || ""), rightX, routeY + 6, { align: "right" });

        const midX = pageWidth / 2;
        doc.setDrawColor(147, 166, 224);
        doc.setLineWidth(0.45);
        doc.line(leftX + 25, routeY - 1, midX - 8, routeY - 1);
        doc.line(midX + 8, routeY - 1, rightX - 25, routeY - 1);
        doc.setFillColor(...blue);
        doc.circle(midX, routeY - 1, 1.5, "F");
        kit.setFont(6.5, false, muted);
        doc.text("TO", midX, routeY - 4, { align: "center" });

        kit.setFont(7, false, ink);
        doc.text(`DEP  ${formatDate(segment.dt)}`, leftX, cardY + 34);
        doc.text(`ARR  ${formatDate(segment.at)}`, midX + 2, cardY + 34);
        kit.setFont(6.5, false, muted);
        const meta = `${terminalText(dep.terminal) || "Terminal -"} to ${
            terminalText(arr.terminal) || "Terminal -"
        }   |   Class: ${label(cabin)}   |   Aircraft: ${segment.fD?.eT || "-"}`;
        doc.text(doc.splitTextToSize(meta, contentWidth - 12), margin + 6, cardY + 39);
        kit.y += cardHeight + 4;
    });

    kit.section("Passenger details", `${passengers.length} passenger${passengers.length === 1 ? "" : "s"}`);

    if (passengers.length) {
        passengers.forEach((p, index) => {
            kit.ensureSpace(23);
            doc.setFillColor(250, 251, 255);
            doc.setDrawColor(...border);
            doc.roundedRect(margin, kit.y, contentWidth, 19, 2, 2, "FD");
            kit.setFont(9, true, navy);
            doc.text(`${index + 1}. ${personName(p)}`, margin + 5, kit.y + 7);
            kit.setFont(7, false, muted);
            doc.text(label(p.paxType || p.type || "Passenger").toUpperCase(), pageWidth - margin - 5, kit.y + 7, { align: "right" });
            kit.setFont(7, false, ink);
            doc.text(`Ticket no.: ${p.ticketNumber || p.ticketNo || "Not available"}`, margin + 5, kit.y + 13);
            doc.text(`Seat: ${seatsByPax[index] || p.seatNumber || "Not assigned"}`, pageWidth - margin - 5, kit.y + 13, { align: "right" });
            kit.y += 23;
        });
    } else {
        kit.paragraph("Passenger details are not available.", 8);
    }

    kit.ensureSpace(16);
    kit.paragraph(
        "Please carry a valid government-issued photo ID and verify flight timings, terminal and baggage allowance with the airline. This document is a booking itinerary, not an airline-issued boarding pass."
    );
    kit.footer();

    const dateValue = segments[0]?.dt || booking.created_at;
    const parsed = dateValue ? new Date(dateValue) : null;
    const flightDate =
        parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : "flight";
    const safeRef = String(ref).replace(/[^a-z0-9_-]+/gi, "-");

    return { doc, filename: `Flight-E-Ticket-${safeRef}-${flightDate}.pdf` };
};

const createHotelVoucherPdf = ({ booking, hotelInfo, guests, amount }) => {
    const kit = createPdfKit("Hotel voucher - Carry a valid photo ID at check-in");
    const { doc, margin, contentWidth, pageWidth } = kit;
    const { navy, blue, muted, ink, border } = PDF_COLORS;
    const ref = booking.booking_reference || "—";

    kit.header("HOTEL VOUCHER", "BOOKING CONFIRMATION", label(booking.status || "PENDING").toUpperCase());

    kit.summary(
        [
            { label: "Booking reference", value: ref },
            { label: "Booking date", value: formatDate(booking.created_at) },
            { label: "Total paid", value: pdfMoney(amount) },
        ],
        [
            `Hotel confirmation: ${hotelInfo.confirmation || "Awaiting from hotel"}`,
            `Payment: ${label(booking.payment_status || "PENDING")}`,
        ]
    );

    kit.section("Hotel");
    kit.ensureSpace(48);
    const y0 = kit.y;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...border);
    doc.roundedRect(margin, y0, contentWidth, 44, 2.5, 2.5, "FD");
    kit.setFont(12, true, navy);
    doc.text(doc.splitTextToSize(hotelInfo.name || "Hotel", contentWidth - 12), margin + 6, y0 + 9);
    kit.setFont(8, false, muted);
    doc.text(
        doc.splitTextToSize(
            [hotelInfo.address, hotelInfo.city].filter(Boolean).join(", ") +
                (hotelInfo.rating ? `  |  ${hotelInfo.rating} star` : ""),
            contentWidth - 12
        ),
        margin + 6,
        y0 + 15
    );

    const colB = margin + contentWidth * 0.37;
    const colC = margin + contentWidth * 0.68;
    kit.setFont(7, false, muted);
    doc.text("CHECK-IN", margin + 6, y0 + 25);
    doc.text("CHECK-OUT", colB, y0 + 25);
    doc.text("STAY", colC, y0 + 25);
    kit.setFont(9, true, blue);
    doc.text(formatDateOnly(hotelInfo.checkIn), margin + 6, y0 + 31);
    doc.text(formatDateOnly(hotelInfo.checkOut), colB, y0 + 31);
    doc.text(hotelInfo.nights ? `${hotelInfo.nights} night${hotelInfo.nights > 1 ? "s" : ""}` : "—", colC, y0 + 31);
    kit.setFont(7, false, ink);
    doc.text(`From ${hotelInfo.checkInFrom || "-"}`, margin + 6, y0 + 36);
    doc.text(`Until ${hotelInfo.checkOutBy || "-"}`, colB, y0 + 36);
    doc.text(`Rooms: ${hotelInfo.rooms || "-"}`, colC, y0 + 36);
    doc.text(
        doc.splitTextToSize(`Room: ${hotelInfo.roomName || "-"}  |  Meal: ${hotelInfo.mealBasis || "-"}`, contentWidth - 12),
        margin + 6,
        y0 + 41
    );
    kit.y += 50;

    kit.section("Guest details", `${guests.length} guest${guests.length === 1 ? "" : "s"}`);
    if (guests.length) {
        guests.forEach((g, index) => {
            kit.ensureSpace(17);
            doc.setFillColor(250, 251, 255);
            doc.setDrawColor(...border);
            doc.roundedRect(margin, kit.y, contentWidth, 13, 2, 2, "FD");
            kit.setFont(9, true, navy);
            doc.text(`${index + 1}. ${personName(g)}`, margin + 5, kit.y + 8);
            kit.setFont(7, false, muted);
            doc.text(label(g.type || "Guest").toUpperCase(), pageWidth - margin - 5, kit.y + 8, { align: "right" });
            kit.y += 17;
        });
    } else {
        kit.paragraph("Guest details are not available.", 8);
    }

    kit.section("Cancellation");
    kit.paragraph(
        hotelInfo.refundable === false
            ? "This booking is non-refundable. Cancelling or not showing up will result in a charge of the full booking amount."
            : hotelInfo.refundable === true
            ? "This booking is refundable as per the cancellation policy shown at the time of booking."
            : "Cancellation policy is not available.",
        8,
        ink
    );
    kit.paragraph(
        "Government-issued photo ID is required at check-in. Extra charges (breakfast, late check-out, airport transfers) are payable directly to the hotel."
    );
    kit.footer();

    const safeRef = String(ref).replace(/[^a-z0-9_-]+/gi, "-");
    return { doc, filename: `Hotel-Voucher-${safeRef}-${String(hotelInfo.checkIn || "").slice(0, 10)}.pdf` };
};

/* ======================================================================
   Main component
   ====================================================================== */

const BookingDetailsModal = ({ booking, onClose }) => {
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!booking) return;

        const handleEscape = (event) => {
            if (event.key === "Escape") onClose?.();
        };

        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [booking, onClose]);

    if (!booking) return null;

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
    const baggage = adultFare?.bI;
    const seatRows = data.seatSelection?.seats || [];
    const seatForSegment = (segmentId) =>
        seatRows.filter((s) => String(s.sectorKey) === String(segmentId)).map((s) => s.seat?.seatNo).join(", ");
    const seatsByPax = {};
    seatRows.forEach((s) => {
        const key = s.passengerIndex ?? 0;
        seatsByPax[key] = [seatsByPax[key], s.seat?.seatNo].filter(Boolean).join(", ");
    });
    const seatTotal = Number(data.seatSelection?.totalAmount || 0);

    /* ---------- hotel data ---------- */
    const hs = data.tripjack?.summary || {};
    const hotelPricing =
        data.tripjack?.review?.option?.pricing || data.tripjack?.selectedOption?.pricing || {};
    const hotelRoom = hs.rooms?.[0];
    const hotelInfo = {
        name: data.hotel?.hotelName || hs.hotel?.name || booking.hotel_name,
        city: hs.hotel?.city,
        address: hs.hotel?.address,
        rating: hs.hotel?.rating,
        checkIn: data.search?.checkIn || hs.stay?.checkIn,
        checkOut: data.search?.checkOut || hs.stay?.checkOut,
        checkInFrom: hs.hotel?.checkInFrom,
        checkOutBy: hs.hotel?.checkOutFrom,
        roomName: hotelRoom?.name || data.tripjack?.review?.option?.roomInfo?.[0]?.name,
        mealBasis: hotelRoom?.mealBasis || data.tripjack?.review?.option?.mealBasis,
        rooms: data.search?.rooms?.length || hs.rooms?.length,
        confirmation: data.tripjack?.hotelConfirmationNumber || hs.hotelConfirmationNumber,
        refundable:
            hs.cancellation?.refundable ?? data.tripjack?.review?.option?.cancellation?.isRefundable,
    };
    hotelInfo.nights = nightsBetween(hotelInfo.checkIn, hotelInfo.checkOut);
    const cancelPenalty = hs.cancellation?.penalties?.[0];

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
        ? `${segments[0].da?.city || segments[0].da?.code} → ${
              segments[segments.length - 1].aa?.city || segments[segments.length - 1].aa?.code
          }`
        : "Flight booking";

    const canDownload = isBooked && (isHotel ? true : segments.length > 0);

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const { doc, filename } = isHotel
                ? createHotelVoucherPdf({ booking, hotelInfo, guests: people, amount })
                : createFlightTicketPdf({
                      booking,
                      segments,
                      passengers: people,
                      seatsByPax,
                      cabin,
                      amount,
                  });
            doc.save(filename);
        } catch (error) {
            console.error("Unable to download ticket:", error);
            window.alert("Download failed. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div
            style={styles.overlay}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose?.();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="booking-details-title"
                style={styles.modal}
            >
                {/* Header */}
                <div style={styles.header}>
                    <div style={{ minWidth: 0 }}>
                        <span style={styles.eyebrow}>
                            MY BOOKINGS · {isHotel ? "HOTEL" : "FLIGHT"}
                        </span>
                        <h2 id="booking-details-title" style={styles.title}>
                            {heading}
                        </h2>
                        <p style={styles.subtitle}>
                            Reference: {booking.booking_reference || "—"}
                        </p>
                    </div>

                    <button type="button" onClick={onClose} aria-label="Close" style={styles.closeButton}>
                        ×
                    </button>
                </div>

                {/* Content */}
                <div style={styles.body}>
                    {/* Failure */}
                    {isFailed && (
                        <div role="alert" style={styles.failBox}>
                            <strong style={styles.failTitle}>Booking failed</strong>
                            <div>
                                Reason:{" "}
                                {failure?.message ? (
                                    <strong>{failure.message}</strong>
                                ) : (
                                    "Provider did not share a reason."
                                )}
                            </div>
                            {failure?.failedAt && (
                                <div style={{ opacity: 0.85 }}>
                                    Failed at: {formatDate(failure.failedAt)}
                                </div>
                            )}
                            {paymentOk && (
                                <div style={{ marginTop: 8, fontWeight: 700 }}>
                                    Payment was successful but the booking was not confirmed.
                                    A refund needs to be checked for this booking.
                                </div>
                            )}
                            {flightAlerts.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <span style={{ fontWeight: 700 }}>Provider alerts</span>
                                    <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                                        {flightAlerts.map((row) => (
                                            <li key={row}>{row}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <Section title="Booking Overview">
                        <div style={styles.infoGrid}>
                            <Info label="Booking reference" value={booking.booking_reference} />
                            <Info label="Booking type" value={isHotel ? "Hotel" : "Flight"} />
                            <Info label="Provider" value={label(booking.provider)} />
                            <Info label="Provider booking ID" value={booking.provider_booking_id} />
                            <Info label="Booking date" value={formatDate(booking.created_at)} />
                            <Info label="Last updated" value={formatDate(booking.updated_at)} />
                            {isHotel && (
                                <Info
                                    label="Hotel confirmation no."
                                    value={hotelInfo.confirmation || "Awaiting from hotel"}
                                />
                            )}
                            {!isHotel && (
                                <Info
                                    label="PNR"
                                    value={data.pnr || data.bookingDetails?.pnr || booking.pnr || "Not available"}
                                />
                            )}
                        </div>

                        <div style={styles.statusRow}>
                            <div>
                                <span style={styles.infoLabel}>Booking status</span>
                                <div>
                                    <Status value={booking.status || "PENDING"} />
                                </div>
                            </div>
                            <div>
                                <span style={styles.infoLabel}>Payment status</span>
                                <div>
                                    <Status value={booking.payment_status || "PENDING"} />
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Flight */}
                    {!isHotel && (
                        <Section title="Flight Itinerary">
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
                                <div style={styles.empty}>Flight itinerary details are not available.</div>
                            )}
                        </Section>
                    )}

                    {/* Hotel */}
                    {isHotel && (
                        <Section title="Hotel Details">
                            <div style={{ marginBottom: 18 }}>
                                <strong style={styles.hotelName}>{hotelInfo.name || "—"}</strong>
                                <span style={styles.muted}>
                                    {[hotelInfo.address, hotelInfo.city].filter(Boolean).join(", ")}
                                    {hotelInfo.rating ? ` · ${hotelInfo.rating}★` : ""}
                                </span>
                            </div>

                            <div style={{ ...styles.route, ...styles.stayBox }}>
                                <div style={styles.routePoint}>
                                    <span style={styles.infoLabel}>Check-in</span>
                                    <strong style={styles.stayDate}>{formatDateOnly(hotelInfo.checkIn)}</strong>
                                    <span style={styles.dateText}>
                                        from {hotelInfo.checkInFrom || "—"}
                                    </span>
                                </div>
                                <div style={styles.routeMiddle}>
                                    <span style={styles.duration}>
                                        {hotelInfo.nights
                                            ? `${hotelInfo.nights} night${hotelInfo.nights > 1 ? "s" : ""}`
                                            : "Stay"}
                                    </span>
                                    <div style={styles.routeLine}>
                                        <span style={styles.routeDot} />
                                        <span style={styles.routeDash} />
                                        <span style={styles.routePlane}>🛏</span>
                                        <span style={styles.routeDash} />
                                        <span style={styles.routeDot} />
                                    </div>
                                </div>
                                <div style={{ ...styles.routePoint, textAlign: "right" }}>
                                    <span style={styles.infoLabel}>Check-out</span>
                                    <strong style={styles.stayDate}>{formatDateOnly(hotelInfo.checkOut)}</strong>
                                    <span style={styles.dateText}>
                                        by {hotelInfo.checkOutBy || "—"}
                                    </span>
                                </div>
                            </div>

                            <div style={styles.infoGrid}>
                                <Info label="Room" value={hotelInfo.roomName} />
                                <Info label="Meal plan" value={hotelInfo.mealBasis} />
                                <Info label="Rooms" value={hotelInfo.rooms} />
                                <Info label="Guests" value={people.length || undefined} />
                                <Info label="Cancellation">
                                    {hotelInfo.refundable === undefined || hotelInfo.refundable === null
                                        ? "—"
                                        : hotelInfo.refundable
                                        ? "Refundable"
                                        : "Non-refundable"}
                                </Info>
                                {cancelPenalty && hotelInfo.refundable === false && (
                                    <Info
                                        label="Cancellation charge"
                                        value={formatCurrency(cancelPenalty.am)}
                                    />
                                )}
                            </div>

                            {(hs.instructions?.CHECKIN_INSTRUCTIONS ||
                                hs.instructions?.FEES ||
                                hs.instructions?.POLICIES) && (
                                <details style={styles.details}>
                                    <summary style={styles.summary}>Hotel policies and check-in notes</summary>
                                    {Object.entries(hs.instructions).map(([group, items]) => (
                                        <div key={group} style={{ marginTop: 12 }}>
                                            <strong style={styles.policyTitle}>{label(group)}</strong>
                                            {Object.entries(items || {}).map(([key, text]) => (
                                                <p key={key} style={styles.policyText}>
                                                    {text}
                                                </p>
                                            ))}
                                        </div>
                                    ))}
                                </details>
                            )}
                        </Section>
                    )}

                    {/* Passengers / Guests */}
                    {people.length > 0 && (
                        <Section
                            title={`${isHotel ? "Guest" : "Passenger"} Details (${people.length})`}
                        >
                            <div style={styles.passengerList}>
                                {people.map((person, index) => (
                                    <PersonCard
                                        key={person.id || person.paxId || index}
                                        person={person}
                                        index={index}
                                        isHotel={isHotel}
                                        seat={seatsByPax[index]}
                                    />
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Payment */}
                    <Section title="Payment Details">
                        <div style={styles.amountCard}>
                            <div>
                                <span style={styles.amountLabel}>Total amount</span>
                                <strong style={styles.amount}>{formatCurrency(amount)}</strong>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <span style={styles.amountLabel}>Payment status</span>
                                <div style={{ marginTop: 8 }}>
                                    <Status value={booking.payment_status || "PENDING"} />
                                </div>
                            </div>
                        </div>

                        <div style={styles.infoGrid}>
                            {isHotel ? (
                                <>
                                    <Info
                                        label="Room price"
                                        value={
                                            hotelPricing.basePrice != null
                                                ? formatCurrency(hotelPricing.basePrice)
                                                : "—"
                                        }
                                    />
                                    <Info
                                        label="Taxes and fees"
                                        value={
                                            hotelPricing.totalPrice != null && hotelPricing.basePrice != null
                                                ? formatCurrency(hotelPricing.totalPrice - hotelPricing.basePrice)
                                                : "—"
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    <Info
                                        label="Base fare"
                                        value={fareDetail.BF != null ? formatCurrency(fareDetail.BF) : "—"}
                                    />
                                    <Info
                                        label="Taxes and fees"
                                        value={fareDetail.TAF != null ? formatCurrency(fareDetail.TAF) : "—"}
                                    />
                                    <Info
                                        label="Total fare"
                                        value={fareDetail.TF != null ? formatCurrency(fareDetail.TF) : "—"}
                                    />
                                    {seatTotal > 0 && (
                                        <Info label="Seat charges" value={formatCurrency(seatTotal)} />
                                    )}
                                </>
                            )}
                            <Info label="Currency" value={booking.currency || "INR"} />
                            {payment.merchantTxnNo && (
                                <Info label="Transaction ID" value={payment.merchantTxnNo} />
                            )}
                        </div>
                    </Section>
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    {canDownload && (
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={downloading}
                            style={{ ...styles.downloadButton, opacity: downloading ? 0.6 : 1 }}
                        >
                            {downloading
                                ? "Preparing PDF..."
                                : isHotel
                                ? "↓ Download Hotel Voucher"
                                : "↓ Download E-Ticket"}
                        </button>
                    )}

                    <button type="button" onClick={onClose} style={styles.footerButton}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
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

export default BookingDetailsModal;