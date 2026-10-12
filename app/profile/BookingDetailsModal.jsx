import React, { useEffect, useState } from "react";

import { jsPDF } from "jspdf";



/* ======================================================================

   Helpers (module level, so they are not re-created on every render)

   \====================================================================== */



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

        .replace(/\_/g, " ")

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

   \====================================================================== */




const Info = ({ label: title, value, children }) => (
  <div className="booking-info-item">
    <span className="booking-info-label">{title}</span>
    <strong className="booking-info-value">
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
    <span className={`booking-status booking-status-${type}`}>
      {label(value)}
    </span>
  );
};

const PersonCard = ({ person, index, seat, isHotel }) => {
  const firstName = person.firstName || person.fN || "";
  const lastName = person.lastName || person.lN || "";
  const name =
    [person.title, firstName, lastName].filter(Boolean).join(" ") ||
    person.name ||
    person.fullName ||
    (isHotel ? "Guest" : "Passenger");

  const dob = person.dateOfBirth || person.dob;
  const ticketNumber = person.ticketNumber || person.ticketNo;

  return (
    <div className="booking-person-card">
      <div className="booking-person-head">
        <div className="booking-person-avatar">
          {name.charAt(0).toUpperCase()}
        </div>

        <div className="booking-person-name-wrap">
          <strong>{name}</strong>
          <span>
            {isHotel ? "Guest" : "Passenger"} {index + 1}
            {person.isPrimary ? " · Primary" : ""}
          </span>
        </div>
      </div>

      <div className="booking-person-facts">
        <Info
          label={isHotel ? "Guest type" : "Passenger type"}
          value={label(person.paxType || person.type || person.passengerType)}
        />

        {person.email || person.emailId ? (
          <Info label="Email" value={person.email || person.emailId} />
        ) : null}

        {person.mobile || person.contactNumber || person.phone ? (
          <Info
            label="Mobile"
            value={person.mobile || person.contactNumber || person.phone}
          />
        ) : null}

        {!isHotel && ticketNumber ? (
          <Info label="Ticket number" value={ticketNumber} />
        ) : null}

        {!isHotel ? (
          <Info label="Seat" value={seat || person.seatNumber || "Not assigned"} />
        ) : null}

        {!isHotel && person.gender ? (
          <Info label="Gender" value={label(person.gender)} />
        ) : null}

        {!isHotel && dob ? (
          <Info label="Date of birth" value={formatDateOnly(dob)} />
        ) : null}
      </div>
    </div>
  );
};

const SegmentCard = ({ segment, cabin, baggage, seat }) => {
  const airline = segment.fD?.aI || {};
  const dep = segment.da || {};
  const arr = segment.aa || {};

  return (
    <div className="booking-segment">
      <div className="booking-segment-head">
        <div>
          <strong>
            {airline.name || airline.code || "Airline"}
          </strong>
          <span>
            {airline.code || ""} {segment.fD?.fN || ""}
          </span>
        </div>

        <span className="booking-segment-class">
          {label(cabin)}
        </span>
      </div>

      <div className="booking-flight-route">
        <div className="booking-flight-point">
          <strong>{dep.code || "—"}</strong>
          <span>{dep.city || dep.name || "Departure"}</span>
          <time>{formatDate(segment.dt)}</time>
          {dep.terminal && <small>{terminalText(dep.terminal)}</small>}
        </div>

        <div className="booking-flight-middle">
          <span>
            {segment.duration != null
              ? `${Math.floor(Number(segment.duration) / 60)}h ${
                  Number(segment.duration) % 60
                }m`
              : "Flight"}
          </span>
          <div className="booking-flight-line">
            <i />
            <b />
            <em>✈</em>
            <b />
            <i />
          </div>
          <small>
            {Number(segment.stops || 0) > 0
              ? `${segment.stops} stop${segment.stops > 1 ? "s" : ""}`
              : "Non-stop"}
          </small>
        </div>

        <div className="booking-flight-point booking-flight-point-arrival">
          <strong>{arr.code || "—"}</strong>
          <span>{arr.city || arr.name || "Arrival"}</span>
          <time>{formatDate(segment.at)}</time>
          {arr.terminal && <small>{terminalText(arr.terminal)}</small>}
        </div>
      </div>

      <div className="booking-segment-meta">
        {baggage?.iB && <span>Check-in baggage: {baggage.iB}</span>}
        {baggage?.cB && <span>Cabin baggage: {baggage.cB}</span>}
        {seat && <span>Seat: {seat}</span>}
        {segment.fD?.eT && <span>Aircraft: {segment.fD.eT}</span>}
      </div>
    </div>
  );
};

const personName = (p) =>
  [p.title, p.firstName || p.fN, p.lastName || p.lN]
    .filter(Boolean)
    .join(" ") ||
  p.name ||
  p.fullName ||
  "Guest";

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

    const safeRef = String(ref).replace(/[^a-z0-9\_-]+/gi, "-");



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



    const safeRef = String(ref).replace(/[^a-z0-9\_-]+/gi, "-");

    return { doc, filename: `Hotel-Voucher-${safeRef}-${String(hotelInfo.checkIn || "").slice(0, 10)}.pdf` };

};



/* ======================================================================

   Main component

   \====================================================================== */




/* ==========================================================================
   Customer-facing booking details
   - Shows only information useful to the traveller.
   - Provider / TripJack implementation details are intentionally hidden.
   ========================================================================== */

const BookingDetailsModal = ({ booking, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!booking) return;

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

  const data = booking.booking_data || {};
  const bookingType = String(
    booking.booking_type || booking.bookingType || booking.type || "FLIGHT"
  ).toUpperCase();
  const isHotel = bookingType.includes("HOTEL");

  const isFailed = statusType(booking.status) === "danger";
  const isBooked = String(booking.status || "").toUpperCase() === "BOOKED";
  const paymentOk = /success|paid|captured/i.test(booking.payment_status || "");

  /* ---------- Flight data ---------- */
  const review = data.review || {};

  // Keep journey groups intact. This is important for connecting / return trips.
  const journeys =
    !isHotel && Array.isArray(review.tripInfos)
      ? review.tripInfos
          .map((trip) => (Array.isArray(trip?.sI) ? trip.sI : []))
          .filter((segments) => segments.length)
      : [];

  const segments = journeys.flat();

  const fareDetail = review.totalPriceInfo?.totalFareDetail?.fC || {};
  const adultFare = review.tripInfos?.[0]?.totalPriceList?.[0]?.fd?.ADULT;
  const cabin = adultFare?.cc || review.searchQuery?.cabinClass || "Economy";
  const baggage = adultFare?.bI || {};

  const seatRows = Array.isArray(data.seatSelection?.seats)
    ? data.seatSelection.seats
    : [];

  const seatForSegment = (segmentId) =>
    seatRows
      .filter((row) => String(row.sectorKey) === String(segmentId))
      .map((row) => row.seat?.seatNo)
      .filter(Boolean)
      .join(", ");

  const seatsByPax = {};
  seatRows.forEach((row) => {
    const key = row.passengerIndex ?? 0;
    seatsByPax[key] = [seatsByPax[key], row.seat?.seatNo]
      .filter(Boolean)
      .join(", ");
  });

  const seatTotal = Number(data.seatSelection?.totalAmount || 0);

  /* ---------- Hotel data ---------- */
  const hs = data.tripjack?.summary || {};
  const hotelPricing =
    data.tripjack?.review?.option?.pricing ||
    data.tripjack?.selectedOption?.pricing ||
    {};

  const hotel = hs.hotel || {};
  const selectedRoomInfo =
    data.tripjack?.selectedOption?.roomInfo ||
    data.tripjack?.review?.option?.roomInfo ||
    [];

  const summaryRooms = Array.isArray(hs.rooms) ? hs.rooms : [];
  const searchRooms = Array.isArray(data.search?.rooms) ? data.search.rooms : [];

  const hotelRooms = summaryRooms.length
    ? summaryRooms.map((room, index) => ({
        ...room,
        name:
          room?.name ||
          selectedRoomInfo[index]?.name ||
          selectedRoomInfo[0]?.name ||
          "Room",
        adults: room?.adults ?? searchRooms[index]?.adults,
        children: room?.children ?? searchRooms[index]?.children,
        mealBasis:
          room?.mealBasis ||
          data.tripjack?.selectedOption?.mealBasis ||
          data.tripjack?.review?.option?.mealBasis,
        guests: Array.isArray(room?.guests) ? room.guests : [],
      }))
    : selectedRoomInfo.map((room, index) => ({
        ...room,
        mealBasis:
          data.tripjack?.selectedOption?.mealBasis ||
          data.tripjack?.review?.option?.mealBasis,
        adults: room?.adults ?? searchRooms[index]?.adults,
        children: room?.children ?? searchRooms[index]?.children,
        guests: [],
      }));

  const hotelInfo = {
    name: data.hotel?.hotelName || hs.hotel?.name || booking.hotel_name,
    city: hotel.city,
    address: [hotel.address, hotel.address2].filter(Boolean).join(", "),
    postalCode: hotel.postalCode,
    rating: hotel.rating,
    lat: hotel.lat ?? hotel.latitude ?? data.hotel?.lat ?? data.hotel?.latitude,
    lng:
      hotel.lng ??
      hotel.longitude ??
      data.hotel?.lng ??
      data.hotel?.longitude,
    checkIn: data.search?.checkIn || hs.stay?.checkIn,
    checkOut: data.search?.checkOut || hs.stay?.checkOut,
    checkInFrom: hotel.checkInFrom,
    checkOutBy: hotel.checkOutFrom,
    minCheckInAge: hotel.minCheckInAge,
    roomName:
      hotelRooms[0]?.name ||
      data.tripjack?.selectedOption?.roomInfo?.[0]?.name ||
      data.tripjack?.review?.option?.roomInfo?.[0]?.name,
    mealBasis:
      hotelRooms[0]?.mealBasis ||
      data.tripjack?.selectedOption?.mealBasis ||
      data.tripjack?.review?.option?.mealBasis,
    rooms: hotelRooms.length || searchRooms.length,
    confirmation:
      data.tripjack?.hotelConfirmationNumber || hs.hotelConfirmationNumber,
    refundable:
      hs.cancellation?.refundable ??
      data.tripjack?.review?.option?.cancellation?.isRefundable,
    cancellationPenalties:
      hs.cancellation?.penalties ||
      data.tripjack?.review?.option?.cancellation?.penalties ||
      [],
    instructions: hs.instructions || {},
  };

  hotelInfo.nights = nightsBetween(hotelInfo.checkIn, hotelInfo.checkOut);

  /* ---------- People ---------- */
  const people = isHotel
    ? (Array.isArray(data.guests) && data.guests.length
        ? data.guests
        : hotelRooms.flatMap((room) => room.guests || []))
    : data.passengers || data.travellerInfo || data.travellers || [];

  const amount = Number(
    booking.amount ?? fareDetail.TF ?? hotelPricing.totalPrice ?? 0
  );

  const failure = isFailed ? getFailureInfo(booking) : null;

  const heading = isHotel
    ? hotelInfo.name || "Hotel booking"
    : segments.length
      ? `${segments[0].da?.city || segments[0].da?.code || "Departure"} → ${
          segments[segments.length - 1].aa?.city ||
          segments[segments.length - 1].aa?.code ||
          "Arrival"
        }`
      : "Flight booking";

  const pnr =
    data.pnr ||
    data.bookingDetails?.pnr ||
    data.tripjack?.pnr ||
    booking.pnr ||
    null;

  const mapUrl =
    hotelInfo.lat != null && hotelInfo.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${hotelInfo.lat},${hotelInfo.lng}`
        )}`
      : hotelInfo.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${hotelInfo.name || ""}, ${hotelInfo.address}, ${hotelInfo.city || ""}`
          )}`
        : null;

  const canDownload = isBooked && (isHotel ? true : segments.length > 0);

  const handleDownload = async () => {
    if (downloading) return;

    setDownloading(true);
    try {
      const { doc, filename } = isHotel
        ? createHotelVoucherPdf({
            booking,
            hotelInfo,
            guests: people,
            amount,
          })
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
      console.error("Unable to download booking document:", error);
      window.alert("Unable to prepare the document. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const cancellationText =
    hotelInfo.refundable === true
      ? "Refundable"
      : hotelInfo.refundable === false
        ? "Non-refundable"
        : null;

  const hotelTaxes =
    hotelPricing.totalPrice != null && hotelPricing.basePrice != null
      ? Math.max(
          0,
          Number(hotelPricing.totalPrice) - Number(hotelPricing.basePrice)
        )
      : null;

  const flightTaxes =
    fareDetail.TAF != null ? Number(fareDetail.TAF) : null;

  const renderJourney = (journey, journeyIndex) => {
    const first = journey[0];
    const last = journey[journey.length - 1];

    return (
      <div className="booking-journey" key={`journey-${journeyIndex}`}>
        <div className="booking-journey-head">
          <div>
            <span className="booking-kicker">JOURNEY {journeyIndex + 1}</span>
            <strong className="booking-journey-title">
              {first?.da?.city || first?.da?.code || "Departure"}{" "}
              <span>→</span>{" "}
              {last?.aa?.city || last?.aa?.code || "Arrival"}
            </strong>
          </div>

          <span className="booking-journey-meta">
            {journey.length === 1
              ? "Direct flight"
              : `${journey.length} flight segments`}
          </span>
        </div>

        <div className="booking-segments">
          {journey.map((segment, segmentIndex) => (
            <SegmentCard
              key={`${segment.id || segment.fD?.fN || "segment"}-${journeyIndex}-${segmentIndex}`}
              segment={segment}
              index={segmentIndex}
              total={journey.length}
              cabin={cabin}
              baggage={baggage}
              seat={seatForSegment(segment.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="booking-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <style>{BOOKING_MODAL_CSS}</style>

      <div
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-details-title"
      >
        {/* Header */}
        <header className="booking-modal-header">
          <div className="booking-header-main">
            <div className="booking-type-icon" aria-hidden="true">
              {isHotel ? "⌂" : "✈"}
            </div>

            <div className="booking-header-copy">
              <div className="booking-eyebrow">
                MY BOOKING · {isHotel ? "HOTEL" : "FLIGHT"}
              </div>

              <h2 id="booking-details-title">{heading}</h2>

              <div className="booking-header-meta">
                <span>
                  Booking reference:{" "}
                  <strong>{booking.booking_reference || "—"}</strong>
                </span>
                <Status value={booking.status || "PENDING"} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking details"
            className="booking-close"
          >
            ×
          </button>
        </header>

        <main className="booking-modal-body">
          {/* Failed booking */}
          {isFailed && (
            <div className="booking-alert booking-alert-danger" role="alert">
              <div className="booking-alert-icon">!</div>
              <div>
                <strong>Booking could not be confirmed</strong>
                <p>
                  {failure?.message ||
                    "We could not complete this booking. Please check your booking status before taking further action."}
                </p>
                {paymentOk && (
                  <p className="booking-alert-emphasis">
                    Payment was successful, but the booking is not confirmed.
                    Please check the payment/refund status with support.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Booking summary */}
          <section className="booking-summary-strip">
            <div>
              <span>Booked on</span>
              <strong>{formatDate(booking.created_at)}</strong>
            </div>

            <div>
              <span>Booking status</span>
              <Status value={booking.status || "PENDING"} />
            </div>

            <div>
              <span>Payment</span>
              <Status value={booking.payment_status || "PENDING"} />
            </div>

            <div className="booking-summary-total">
              <span>Total paid</span>
              <strong>{formatCurrency(amount)}</strong>
            </div>
          </section>

          {/* Hotel */}
          {isHotel && (
            <>
              <section className="booking-section booking-hotel-hero">
                <div className="booking-section-heading">
                  <div>
                    <span className="booking-kicker">YOUR STAY</span>
                    <h3>{hotelInfo.name || "Hotel"}</h3>
                    <p>
                      {[hotelInfo.address, hotelInfo.city, hotelInfo.postalCode]
                        .filter(Boolean)
                        .join(", ") || "Hotel address not available"}
                    </p>
                  </div>

                  {hotelInfo.rating != null && (
                    <div className="booking-rating">
                      <span>★</span>
                      <strong>{hotelInfo.rating}</strong>
                      <small>Guest rating</small>
                    </div>
                  )}
                </div>

                <div className="booking-hotel-actions">
                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="booking-map-button"
                    >
                      <span>↗</span> Open in Google Maps
                    </a>
                  )}

                  {hotelInfo.lat != null && hotelInfo.lng != null && (
                    <span className="booking-location-note">
                      Location available
                    </span>
                  )}
                </div>

                <div className="booking-stay-grid">
                  <div className="booking-stay-cell">
                    <span>Check-in</span>
                    <strong>{formatDateOnly(hotelInfo.checkIn)}</strong>
                    {hotelInfo.checkInFrom && (
                      <small>From {hotelInfo.checkInFrom}</small>
                    )}
                  </div>

                  <div className="booking-stay-cell booking-stay-nights">
                    <span>Stay</span>
                    <strong>
                      {hotelInfo.nights
                        ? `${hotelInfo.nights} night${hotelInfo.nights > 1 ? "s" : ""}`
                        : "—"}
                    </strong>
                  </div>

                  <div className="booking-stay-cell">
                    <span>Check-out</span>
                    <strong>{formatDateOnly(hotelInfo.checkOut)}</strong>
                    {hotelInfo.checkOutBy && (
                      <small>By {hotelInfo.checkOutBy}</small>
                    )}
                  </div>
                </div>
              </section>

              <section className="booking-section">
                <SectionHeading
                  eyebrow="ROOM & STAY"
                  title="What you booked"
                />

                {hotelRooms.length ? (
                  <div className="booking-room-list">
                    {hotelRooms.map((room, index) => (
                      <div className="booking-room-card" key={`room-${index}`}>
                        <div className="booking-room-number">{index + 1}</div>

                        <div className="booking-room-content">
                          <strong>{room.name || "Room"}</strong>

                          <div className="booking-room-meta">
                            {room.mealBasis && <span>{room.mealBasis}</span>}
                            {room.adults != null && (
                              <span>
                                {room.adults} adult
                                {Number(room.adults) === 1 ? "" : "s"}
                              </span>
                            )}
                            {room.children != null && Number(room.children) > 0 && (
                              <span>
                                {room.children} child
                                {Number(room.children) === 1 ? "" : "ren"}
                              </span>
                            )}
                          </div>

                          {Array.isArray(room.guests) && room.guests.length > 0 && (
                            <div className="booking-room-guests">
                              {room.guests.map((guest, guestIndex) => (
                                <span key={guestIndex}>
                                  {personName(guest)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="booking-empty">Room details are not available.</div>
                )}

                <div className="booking-facts-grid">
                  {cancellationText && (
                    <Info label="Cancellation" value={cancellationText} />
                  )}

                  {hotelInfo.minCheckInAge != null && (
                    <Info
                      label="Minimum check-in age"
                      value={`${hotelInfo.minCheckInAge}+`}
                    />
                  )}

                  {hotelInfo.confirmation && (
                    <Info
                      label="Hotel confirmation"
                      value={hotelInfo.confirmation}
                    />
                  )}
                </div>

                {hotelInfo.instructions &&
                  Object.keys(hotelInfo.instructions).length > 0 && (
                    <details className="booking-details">
                      <summary>Important hotel notes</summary>

                      {Object.entries(hotelInfo.instructions).map(
                        ([group, items]) => (
                          <div className="booking-policy-group" key={group}>
                            <strong>{label(group)}</strong>

                            {Object.entries(items || {}).map(([key, value]) => (
                              <p key={key}>
                                {typeof value === "string"
                                  ? value
                                  : JSON.stringify(value)}
                              </p>
                            ))}
                          </div>
                        )
                      )}
                    </details>
                  )}
              </section>
            </>
          )}

          {/* Flight */}
          {!isHotel && (
            <section className="booking-section">
              <SectionHeading
                eyebrow="TRIP ITINERARY"
                title={
                  journeys.length > 1
                    ? `${journeys.length} journeys`
                    : "Flight itinerary"
                }
              />

              {journeys.length ? (
                <div className="booking-journey-list">
                  {journeys.map(renderJourney)}
                </div>
              ) : (
                <div className="booking-empty">
                  Flight itinerary details are not available.
                </div>
              )}
            </section>
          )}

          {/* Passenger / guest details */}
          {people.length > 0 && (
            <section className="booking-section">
              <SectionHeading
                eyebrow={isHotel ? "GUESTS" : "PASSENGERS"}
                title={`${isHotel ? "Guest" : "Passenger"} details`}
              />

              <div className="booking-people-list">
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
            </section>
          )}

          {/* Payment */}
          <section className="booking-section">
            <SectionHeading eyebrow="PAYMENT" title="Payment summary" />

            <div className="booking-payment-total">
              <div>
                <span>Total paid</span>
                <strong>{formatCurrency(amount)}</strong>
              </div>

              <div className="booking-payment-status">
                <span>Payment status</span>
                <Status value={booking.payment_status || "PENDING"} />
              </div>
            </div>

            <div className="booking-facts-grid booking-payment-grid">
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
                    label="Taxes & fees"
                    value={
                      hotelTaxes != null ? formatCurrency(hotelTaxes) : "—"
                    }
                  />
                </>
              ) : (
                <>
                  <Info
                    label="Base fare"
                    value={
                      fareDetail.BF != null
                        ? formatCurrency(fareDetail.BF)
                        : "—"
                    }
                  />
                  <Info
                    label="Taxes & fees"
                    value={
                      flightTaxes != null
                        ? formatCurrency(flightTaxes)
                        : "—"
                    }
                  />
                  {seatTotal > 0 && (
                    <Info
                      label="Seat charges"
                      value={formatCurrency(seatTotal)}
                    />
                  )}
                </>
              )}

              <Info label="Currency" value={booking.currency || "INR"} />

              {booking.payment_data?.merchantTxnNo && (
                <Info
                  label="Payment transaction"
                  value={booking.payment_data.merchantTxnNo}
                />
              )}
            </div>
          </section>
        </main>

        <footer className="booking-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="booking-secondary-button"
          >
            Close
          </button>

          {canDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="booking-primary-button"
            >
              {downloading
                ? "Preparing..."
                : isHotel
                  ? "Download hotel voucher"
                  : "Download e-ticket"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

const SectionHeading = ({ eyebrow, title }) => (
  <div className="booking-section-heading-simple">
    <span className="booking-kicker">{eyebrow}</span>
    <h3>{title}</h3>
  </div>
);

const BOOKING_MODAL_CSS = `
  .booking-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.58);
    box-sizing: border-box;
  }

  .booking-modal,
  .booking-modal * {
    box-sizing: border-box;
  }

  .booking-modal {
    width: min(980px, 100%);
    max-height: min(94vh, 920px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    background: #f8fafc;
    color: #172033;
    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .booking-modal-header {
    flex: 0 0 auto;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    padding: 22px 26px;
    border-bottom: 1px solid #e8ebf0;
    background: #ffffff;
  }

  .booking-header-main {
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .booking-type-icon {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    background: #eff4ff;
    color: #3157c8;
    font-size: 19px;
    border: 1px solid #dbe5ff;
  }

  .booking-header-copy {
    min-width: 0;
  }

  .booking-eyebrow,
  .booking-kicker {
    display: block;
    color: #64748b;
    font-size: 10px;
    line-height: 1.2;
    font-weight: 750;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .booking-header-copy h2 {
    margin: 5px 0 7px;
    color: #101828;
    font-size: clamp(20px, 2.6vw, 28px);
    line-height: 1.15;
    letter-spacing: -.02em;
    overflow-wrap: anywhere;
  }

  .booking-header-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 14px;
    color: #667085;
    font-size: 12px;
  }

  .booking-header-meta strong {
    color: #344054;
  }

  .booking-close {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    display: grid;
    place-items: center;
    border: 1px solid #e4e7ec;
    border-radius: 9px;
    background: #ffffff;
    color: #344054;
    font-size: 25px;
    line-height: 1;
    cursor: pointer;
  }

  .booking-close:hover {
    background: #f8fafc;
  }

  .booking-modal-body {
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 20px 26px 24px;
    overscroll-behavior: contain;
  }

  .booking-summary-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
    margin-bottom: 18px;
    overflow: hidden;
    border: 1px solid #e3e8ef;
    border-radius: 13px;
    background: #e3e8ef;
  }

  .booking-summary-strip > div {
    min-width: 0;
    padding: 14px 16px;
    background: #ffffff;
  }

  .booking-summary-strip span,
  .booking-payment-total span {
    display: block;
    margin-bottom: 6px;
    color: #667085;
    font-size: 11px;
  }

  .booking-summary-strip strong {
    display: block;
    color: #1d2939;
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .booking-summary-total strong {
    color: #3157c8 !important;
    font-size: 18px !important;
  }


  .booking-status {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 10px;
    line-height: 1.2;
    font-weight: 750;
    white-space: nowrap;
  }

  .booking-status-success {
    color: #166534;
    background: #dcfce7;
  }

  .booking-status-danger {
    color: #b42318;
    background: #fee4e2;
  }

  .booking-status-pending {
    color: #344054;
    background: #f2f4f7;
  }

  .booking-info-item {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .booking-info-label {
    color: #667085;
    font-size: 10px;
    line-height: 1.2;
  }

  .booking-info-value {
    color: #344054;
    font-size: 12px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .booking-person-card {
    padding: 14px;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    background: #ffffff;
  }

  .booking-person-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 13px;
  }

  .booking-person-avatar {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #f2f4f7;
    color: #475467;
    font-size: 12px;
    font-weight: 750;
  }

  .booking-person-name-wrap {
    min-width: 0;
  }

  .booking-person-name-wrap strong {
    display: block;
    color: #1d2939;
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .booking-person-name-wrap span {
    display: block;
    margin-top: 3px;
    color: #98a2b3;
    font-size: 10px;
  }

  .booking-person-facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
    gap: 12px 16px;
    padding-top: 12px;
    border-top: 1px solid #f2f4f7;
  }

  .booking-segment {
    padding: 17px;
    background: #ffffff;
  }

  .booking-segment-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  .booking-segment-head > div {
    min-width: 0;
  }

  .booking-segment-head strong {
    display: block;
    color: #1d2939;
    font-size: 13px;
  }

  .booking-segment-head span:not(.booking-segment-class) {
    display: block;
    margin-top: 3px;
    color: #98a2b3;
    font-size: 10px;
  }

  .booking-segment-class {
    padding: 5px 8px;
    border: 1px solid #e4e7ec;
    border-radius: 6px;
    color: #667085;
    background: #fafafa;
    font-size: 9px;
    font-weight: 700;
    white-space: nowrap;
  }

  .booking-flight-route {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(120px, .8fr) minmax(0, 1fr);
    gap: 15px;
    align-items: center;
  }

  .booking-flight-point {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .booking-flight-point strong {
    color: #182230;
    font-size: 24px;
    line-height: 1;
    letter-spacing: -.03em;
  }

  .booking-flight-point span {
    color: #475467;
    font-size: 11px;
    overflow-wrap: anywhere;
  }

  .booking-flight-point time {
    color: #344054;
    font-size: 11px;
    font-weight: 650;
  }

  .booking-flight-point small {
    color: #98a2b3;
    font-size: 9px;
  }

  .booking-flight-point-arrival {
    text-align: right;
    align-items: flex-end;
  }

  .booking-flight-middle {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
  }

  .booking-flight-middle > span {
    color: #667085;
    font-size: 10px;
    font-weight: 650;
  }

  .booking-flight-middle > small {
    color: #98a2b3;
    font-size: 9px;
  }

  .booking-flight-line {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .booking-flight-line i {
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    border-radius: 50%;
    background: #3157c8;
  }

  .booking-flight-line b {
    height: 1px;
    flex: 1;
    background: #cbd5e1;
  }

  .booking-flight-line em {
    color: #3157c8;
    font-size: 13px;
    line-height: 1;
    font-style: normal;
  }

  .booking-segment-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px 16px;
    margin-top: 16px;
    padding-top: 11px;
    border-top: 1px solid #f2f4f7;
    color: #667085;
    font-size: 10px;
  }

  .booking-section {
    margin-bottom: 18px;
    padding: 20px;
    border: 1px solid #e3e8ef;
    border-radius: 14px;
    background: #ffffff;
  }

  .booking-section-heading-simple {
    margin-bottom: 17px;
  }

  .booking-section-heading-simple h3,
  .booking-section-heading h3 {
    margin: 4px 0 0;
    color: #182230;
    font-size: 17px;
    line-height: 1.25;
    letter-spacing: -.01em;
  }

  .booking-hotel-hero {
    padding: 22px;
  }

  .booking-section-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .booking-section-heading h3 {
    margin: 5px 0 5px;
    font-size: 22px;
  }

  .booking-section-heading p {
    margin: 0;
    max-width: 680px;
    color: #667085;
    font-size: 13px;
    line-height: 1.55;
  }

  .booking-rating {
    min-width: 84px;
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    column-gap: 5px;
    padding: 9px 11px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fafafa;
  }

  .booking-rating span {
    color: #b7791f;
    font-size: 15px;
  }

  .booking-rating strong {
    color: #344054;
    font-size: 14px;
  }

  .booking-rating small {
    grid-column: 1 / -1;
    color: #98a2b3;
    font-size: 9px;
  }

  .booking-hotel-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin: 17px 0;
    padding-top: 16px;
    border-top: 1px solid #eef1f5;
  }

  .booking-map-button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 12px;
    border: 1px solid #d0d5dd;
    border-radius: 8px;
    color: #344054;
    background: #ffffff;
    font-size: 12px;
    font-weight: 650;
    text-decoration: none;
  }

  .booking-map-button:hover {
    background: #f8fafc;
  }

  .booking-location-note {
    color: #98a2b3;
    font-size: 11px;
  }

  .booking-stay-grid {
    display: grid;
    grid-template-columns: 1fr .8fr 1fr;
    overflow: hidden;
    border: 1px solid #e4e7ec;
    border-radius: 11px;
  }

  .booking-stay-cell {
    min-width: 0;
    padding: 15px 16px;
    background: #fbfcfd;
  }

  .booking-stay-cell + .booking-stay-cell {
    border-left: 1px solid #e4e7ec;
  }

  .booking-stay-cell:nth-child(2) {
    background: #f7f9fc;
    text-align: center;
  }

  .booking-stay-cell:last-child {
    text-align: right;
  }

  .booking-stay-cell span {
    display: block;
    margin-bottom: 5px;
    color: #667085;
    font-size: 10px;
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .booking-stay-cell strong {
    display: block;
    color: #182230;
    font-size: 14px;
  }

  .booking-stay-cell small {
    display: block;
    margin-top: 4px;
    color: #98a2b3;
    font-size: 10px;
  }

  .booking-journey-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .booking-journey {
    overflow: hidden;
    border: 1px solid #e4e7ec;
    border-radius: 12px;
  }

  .booking-journey-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    background: #fafbfc;
    border-bottom: 1px solid #eef1f5;
  }

  .booking-journey-title {
    display: block;
    margin-top: 4px;
    color: #344054;
    font-size: 13px;
  }

  .booking-journey-title span {
    margin: 0 4px;
    color: #98a2b3;
  }

  .booking-journey-meta {
    color: #667085;
    font-size: 10px;
    white-space: nowrap;
  }

  .booking-segments {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .booking-segment {
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .booking-segment + .booking-segment {
    border-top: 1px dashed #d0d5dd !important;
  }

  .booking-room-list,
  .booking-people-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .booking-room-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    background: #ffffff;
  }

  .booking-room-number {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    display: grid;
    place-items: center;
    border-radius: 7px;
    background: #f2f4f7;
    color: #475467;
    font-size: 11px;
    font-weight: 750;
  }

  .booking-room-content {
    min-width: 0;
  }

  .booking-room-content > strong {
    color: #1d2939;
    font-size: 13px;
  }

  .booking-room-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .booking-room-meta span,
  .booking-room-guests span {
    padding: 4px 7px;
    border-radius: 6px;
    background: #f8fafc;
    color: #667085;
    font-size: 10px;
  }

  .booking-room-guests {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .booking-facts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px 18px;
    margin-top: 17px;
  }

  .booking-details {
    margin-top: 17px;
    padding: 12px 14px;
    border: 1px solid #e4e7ec;
    border-radius: 9px;
    background: #fafbfc;
  }

  .booking-details summary {
    cursor: pointer;
    color: #475467;
    font-size: 12px;
    font-weight: 650;
  }

  .booking-policy-group {
    margin-top: 13px;
  }

  .booking-policy-group > strong {
    color: #344054;
    font-size: 11px;
  }

  .booking-policy-group p {
    margin: 5px 0 0;
    color: #667085;
    font-size: 11px;
    line-height: 1.55;
  }

  .booking-payment-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 18px;
    padding: 16px;
    border: 1px solid #dbe5ff;
    border-radius: 11px;
    background: #f7f9ff;
  }

  .booking-payment-total strong {
    display: block;
    color: #3157c8;
    font-size: 23px;
    line-height: 1.1;
  }

  .booking-payment-status {
    text-align: right;
  }

  .booking-alert {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    margin-bottom: 18px;
    padding: 13px 15px;
    border-radius: 11px;
    font-size: 12px;
    line-height: 1.5;
  }

  .booking-alert-icon {
    width: 22px;
    height: 22px;
    flex: 0 0 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-weight: 800;
  }

  .booking-alert strong {
    display: block;
    margin-bottom: 2px;
  }

  .booking-alert p {
    margin: 0;
  }

  .booking-alert-emphasis {
    margin-top: 5px !important;
    font-weight: 650;
  }

  .booking-alert-danger {
    color: #7a271a;
    border: 1px solid #fecdca;
    background: #fff6f4;
  }

  .booking-alert-danger .booking-alert-icon {
    color: #b42318;
    background: #fee4e2;
  }

  .booking-empty {
    padding: 18px;
    border: 1px dashed #d0d5dd;
    border-radius: 9px;
    color: #667085;
    background: #fafbfc;
    text-align: center;
    font-size: 12px;
  }

  .booking-modal-footer {
    flex: 0 0 auto;
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    padding: 13px 26px;
    border-top: 1px solid #e4e7ec;
    background: #ffffff;
  }

  .booking-primary-button,
  .booking-secondary-button {
    min-height: 38px;
    padding: 0 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
  }

  .booking-primary-button {
    border: 1px solid #3157c8;
    background: #3157c8;
    color: #ffffff;
  }

  .booking-primary-button:hover {
    background: #2849ad;
  }

  .booking-primary-button:disabled {
    opacity: .55;
    cursor: wait;
  }

  .booking-secondary-button {
    border: 1px solid #d0d5dd;
    background: #ffffff;
    color: #344054;
  }

  @media (max-width: 720px) {

    .booking-flight-route {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .booking-flight-middle {
      order: 2;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      width: 100%;
      gap: 8px;
    }

    .booking-flight-middle > span {
      order: 1;
    }

    .booking-flight-line {
      order: 2;
      min-width: 0;
    }

    .booking-flight-middle > small {
      order: 3;
    }

    .booking-flight-point-arrival {
      text-align: left;
      align-items: flex-start;
    }

    .booking-modal-overlay {
      align-items: stretch;
      padding: 0;
    }

    .booking-modal {
      width: 100%;
      max-height: 100dvh;
      border-radius: 0;
      border-left: 0;
      border-right: 0;
    }

    .booking-modal-header {
      padding: 17px 16px;
    }

    .booking-modal-body {
      padding: 14px 14px 18px;
    }

    .booking-summary-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .booking-summary-total {
      grid-column: span 2;
    }

    .booking-section {
      padding: 16px;
      margin-bottom: 13px;
      border-radius: 11px;
    }

    .booking-hotel-hero {
      padding: 17px;
    }

    .booking-section-heading,
    .booking-journey-head {
      align-items: flex-start;
      flex-direction: column;
    }

    .booking-rating {
      min-width: auto;
    }

    .booking-stay-grid {
      grid-template-columns: 1fr;
    }

    .booking-stay-cell + .booking-stay-cell {
      border-left: 0;
      border-top: 1px solid #e4e7ec;
    }

    .booking-stay-cell:nth-child(2),
    .booking-stay-cell:last-child {
      text-align: left;
    }

    .booking-modal-footer {
      padding: 11px 14px;
    }

    .booking-modal-footer button {
      flex: 1;
    }
  }

  @media (max-width: 520px) {
    .booking-summary-strip {
      grid-template-columns: 1fr;
    }

    .booking-summary-total {
      grid-column: auto;
    }

    .booking-summary-strip > div {
      padding: 12px 13px;
    }

    .booking-header-meta {
      align-items: flex-start;
      flex-direction: column;
      gap: 6px;
    }

    .booking-header-copy h2 {
      font-size: 19px;
    }

    .booking-type-icon {
      width: 36px;
      height: 36px;
      flex-basis: 36px;
    }

    .booking-close {
      width: 34px;
      height: 34px;
      flex-basis: 34px;
    }

    .booking-payment-total {
      align-items: flex-start;
      flex-direction: column;
    }

    .booking-payment-status {
      text-align: left;
    }

    .booking-primary-button,
    .booking-secondary-button {
      font-size: 11px;
      padding: 0 10px;
    }
  }
`;

export default BookingDetailsModal;
