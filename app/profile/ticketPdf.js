import { jsPDF } from "jspdf";

/* ======================================================================
   Flight e-ticket and hotel voucher PDFs (A4, jsPDF built-in Helvetica)
   ====================================================================== */

const C = {
    blue: [23, 101, 193],
    blueDark: [13, 61, 120],
    blueSoft: [235, 243, 252],
    blueLine: [196, 217, 243],
    ink: [17, 24, 39],
    text: [55, 65, 81],
    muted: [107, 114, 128],
    line: [226, 232, 240],
    zebra: [248, 250, 252],
    green: [21, 128, 61],
    greenSoft: [220, 252, 231],
    amber: [161, 98, 7],
    amberSoft: [254, 243, 199],
    red: [185, 28, 28],
    star: [245, 158, 11],
    white: [255, 255, 255],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n) => String(n).padStart(2, "0");

// Helvetica only knows WinAnsi: swap or drop anything else (rupee sign, arrows, emoji)
const clean = (value) =>
    String(value ?? "")
        .replace(/₹\s?/g, "INR ")
        .replace(/[→➜⟶]/g, "-")
        .replace(/[^\x20-\x7E -ÿ–—‘’“”•…]/g, "")
        .replace(/\s+/g, " ")
        .trim();

// "2026-11-21" stays on that day; "2026-11-21T06:05" keeps its local time
const toDate = (value) => {
    if (!value) return null;
    const text = String(value);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
        ? new Date(...text.split("-").map((n, i) => Number(n) - (i === 1 ? 1 : 0)))
        : new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
};
const fmtDay = (value) => {
    const d = toDate(value);
    return d ? `${DAYS[d.getDay()]}, ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "-";
};
const fmtTime = (value) => {
    const d = toDate(value);
    return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "--:--";
};
const fmtDateTime = (value) => {
    const d = toDate(value);
    return d ? `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${fmtTime(d)}` : "-";
};
const fmtDuration = (minutes) => {
    const m = Number(minutes);
    if (!Number.isFinite(m) || m <= 0) return "";
    return `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
};
const money = (value) =>
    `INR ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const title = (value) =>
    String(value || "")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
const terminal = (t) => (t ? (/terminal/i.test(t) ? t : `Terminal ${t}`) : "");
const personName = (p) =>
    [p.title, p.firstName || p.fN, p.lastName || p.lN].filter(Boolean).join(" ") || p.name || p.fullName || "Guest";

/* ---------------------------------------------------------------------
   Brand (name, contact, logo) for the header and footer
   --------------------------------------------------------------------- */

const imageToPng = (src) =>
    new Promise((resolve) => {
        if (!src || typeof window === "undefined") return resolve(null);
        const img = new window.Image();
        const timer = setTimeout(() => resolve(null), 4000);
        img.crossOrigin = "anonymous";
        img.onload = () => {
            clearTimeout(timer);
            try {
                const scale = Math.min(1, 600 / (img.naturalWidth || 1));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
                canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve({ data: canvas.toDataURL("image/png"), w: canvas.width, h: canvas.height });
            } catch {
                resolve(null); // cross-origin image without CORS
            }
        };
        img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
        };
        img.src = src;
    });

const logoUrl = (logo) => {
    if (!logo) return "";
    if (!String(logo).startsWith("/uploads")) return logo;
    const base = process.env.NEXT_PUBLIC_BASE_IMAGE_URL;
    return base ? `${base.replace(/\/$/, "")}/${String(logo).replace(/^\//, "")}` : "";
};

export const loadBrand = async () => {
    let info = {};
    try {
        const response = await fetch("/api/company-info", { cache: "no-store" });
        info = (await response.json())?.data || {};
    } catch {
        info = {};
    }
    const logo = (await imageToPng(logoUrl(info.logo))) || (await imageToPng("/logooo.png"));
    return {
        name: clean(info.displayName || info.companyName || "Travel Forex"),
        phone: clean(info.contact?.phone || ""),
        email: clean(info.contact?.email || ""),
        logo,
    };
};

/* ---------------------------------------------------------------------
   Drawing kit
   --------------------------------------------------------------------- */

const createKit = ({ brand, docTitle, reference }) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 14;
    const CW = W - M * 2;
    const k = { doc, W, H, M, CW, y: 0 };

    k.font = (size, style = "normal", color = C.text) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
    };
    k.text = (value, x, y, options) => doc.text(clean(value), x, y, options);
    k.fill = (color) => doc.setFillColor(...color);
    k.stroke = (color, width = 0.25) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(width);
    };
    k.wrap = (value, width) => doc.splitTextToSize(clean(value), width);
    // one line, cut with "..." when too wide (uses the current font)
    k.fit = (value, width) => {
        let text = clean(value);
        if (doc.getTextWidth(text) <= width) return text;
        while (text.length > 1 && doc.getTextWidth(`${text}...`) > width) text = text.slice(0, -1);
        return `${text}...`;
    };

    const pageTop = () => {
        k.fill(C.blue);
        doc.rect(0, 0, W, 2.2, "F");
        k.font(8, "bold", C.blueDark);
        k.text(`${docTitle}  |  Booking ID ${reference}`, M, 10);
        k.font(8, "normal", C.muted);
        k.text(brand.name, W - M, 10, { align: "right" });
        k.stroke(C.line);
        doc.line(M, 13, W - M, 13);
        k.y = 19;
    };

    k.ensure = (height) => {
        if (k.y + height > H - 22) {
            doc.addPage();
            pageTop();
            return true;
        }
        return false;
    };

    k.header = (statusText, statusOk) => {
        k.fill(C.blue);
        doc.rect(0, 0, W, 2.2, "F");

        if (brand.logo) {
            const h = 13;
            const w = Math.min(48, (brand.logo.w / brand.logo.h) * h);
            doc.addImage(brand.logo.data, "PNG", M, 8, w, (brand.logo.h / brand.logo.w) * w, undefined, "FAST");
        } else {
            k.font(14, "bold", C.blue);
            k.text(brand.name, M, 17);
        }

        k.font(18, "bold", C.blueDark);
        k.text(docTitle.toUpperCase(), W - M, 15, { align: "right" });

        k.font(7.5, "bold", statusOk ? C.green : C.amber);
        const pill = clean(statusText).toUpperCase();
        const pw = doc.getTextWidth(pill) + 8;
        k.fill(statusOk ? C.greenSoft : C.amberSoft);
        doc.roundedRect(W - M - pw, 19, pw, 6, 3, 3, "F");
        k.text(pill, W - M - pw / 2, 23.1, { align: "center" });

        k.stroke(C.line);
        doc.line(M, 31, W - M, 31);
        k.y = 36;
    };

    // highlighted references: first item is the big one
    k.refBand = (items) => {
        const h = 21;
        k.fill(C.blueSoft);
        k.stroke(C.blueLine);
        doc.roundedRect(M, k.y, CW, h, 2.5, 2.5, "FD");
        const widths = [0.3, 0.24, 0.24, 0.22].map((f) => f * CW);
        let x = M;
        items.forEach((item, i) => {
            if (i > 0) {
                k.stroke(C.blueLine);
                doc.line(x, k.y + 4, x, k.y + h - 4);
            }
            k.font(6.8, "bold", C.muted);
            k.text(item.label.toUpperCase(), x + 5, k.y + 7.5);
            k.font(i === 0 ? 13 : 9.5, "bold", i === 0 ? C.blue : C.ink);
            k.text(k.fit(item.value || "-", widths[i] - 9), x + 5, k.y + 14.5);
            if (item.sub) {
                k.font(6.8, "normal", C.muted);
                k.text(k.fit(item.sub, widths[i] - 9), x + 5, k.y + 18.4);
            }
            x += widths[i];
        });
        k.y += h + 7;
    };

    k.section = (heading, aside = "") => {
        k.ensure(18);
        k.fill(C.blue);
        doc.rect(M, k.y - 3.6, 1.2, 4.6, "F");
        k.font(10.5, "bold", C.ink);
        k.text(heading, M + 3.5, k.y);
        if (aside) {
            k.font(7.5, "normal", C.muted);
            k.text(aside, W - M, k.y, { align: "right" });
        }
        k.y += 5;
    };

    /*
     * cols: [{ title, w (fraction of width), align }]
     * rows: cells are strings or { text, sub, bold, color }
     */
    k.table = (cols, rows) => {
        const widths = cols.map((c) => c.w * CW);
        const cellPad = 2.4;
        const head = () => {
            k.fill(C.blueSoft);
            doc.rect(M, k.y, CW, 7.5, "F");
            let x = M;
            k.font(6.8, "bold", C.blueDark);
            cols.forEach((c, i) => {
                const tx = c.align === "right" ? x + widths[i] - cellPad : x + cellPad;
                k.text(c.title.toUpperCase(), tx, k.y + 4.9, { align: c.align === "right" ? "right" : "left" });
                x += widths[i];
            });
            k.y += 7.5;
        };
        k.ensure(18);
        head();
        rows.forEach((row, r) => {
            const cells = row.map((cell) => (cell && typeof cell === "object" ? cell : { text: cell }));
            const layout = cells.map((cell, i) => {
                k.font(8, cell.bold ? "bold" : "normal");
                const lines = k.wrap(cell.text ?? "-", widths[i] - cellPad * 2);
                k.font(6.8);
                const sub = cell.sub ? k.wrap(cell.sub, widths[i] - cellPad * 2) : [];
                return { lines, sub };
            });
            const h = Math.max(8, ...layout.map((l) => l.lines.length * 3.6 + l.sub.length * 3 + 4.6));
            if (k.ensure(h + 2)) head();
            if (r % 2 === 1) {
                k.fill(C.zebra);
                doc.rect(M, k.y, CW, h, "F");
            }
            let x = M;
            cells.forEach((cell, i) => {
                const right = cols[i].align === "right";
                const tx = right ? x + widths[i] - cellPad : x + cellPad;
                k.font(8, cell.bold ? "bold" : "normal", cell.color || C.ink);
                doc.text(layout[i].lines, tx, k.y + 5, { align: right ? "right" : "left" });
                if (layout[i].sub.length) {
                    k.font(6.8, "normal", C.muted);
                    doc.text(layout[i].sub, tx, k.y + 5 + layout[i].lines.length * 3.6, { align: right ? "right" : "left" });
                }
                x += widths[i];
            });
            k.stroke(C.line);
            doc.line(M, k.y + h, M + CW, k.y + h);
            k.y += h;
        });
        k.y += 7;
    };

    // label / value rows, last one is the total
    k.amounts = (rows, totalLabel, total) => {
        const boxW = CW * 0.5;
        const x = M + CW - boxW;
        const h = rows.length * 6 + 15;
        k.ensure(h + 4);
        k.stroke(C.line);
        doc.roundedRect(x, k.y, boxW, h, 2, 2, "S");
        let y = k.y + 6.5;
        rows.forEach(([name, value, color]) => {
            k.font(8, "normal", C.text);
            k.text(name, x + 5, y);
            k.font(8, "normal", color || C.ink);
            k.text(value, x + boxW - 5, y, { align: "right" });
            y += 6;
        });
        k.stroke(C.line);
        doc.line(x + 5, y - 2.5, x + boxW - 5, y - 2.5);
        k.font(9.5, "bold", C.ink);
        k.text(totalLabel, x + 5, y + 4);
        k.font(10.5, "bold", C.blue);
        k.text(money(total), x + boxW - 5, y + 4, { align: "right" });
        return { x, h, boxW };
    };

    k.bullets = (points, x, width) => {
        let y = k.y;
        points.forEach((point) => {
            k.font(7.6, "normal", C.text);
            const lines = k.wrap(point, width - 4);
            k.fill(C.blue);
            doc.circle(x + 0.9, y - 1.1, 0.55, "F");
            doc.text(lines, x + 3.5, y);
            y += lines.length * 3.5 + 1.6;
        });
        return y;
    };

    // two bullet columns side by side: [{ heading, points }, { heading, points }]
    k.infoColumns = (columns) => {
        const colW = (CW - 8) / 2;
        const heights = columns.map((col) => {
            k.font(7.6);
            return 6 + col.points.reduce((sum, p) => sum + k.wrap(p, colW - 4).length * 3.5 + 1.6, 0);
        });
        k.ensure(Math.max(...heights) + 6);
        const top = k.y + 1.5;
        let bottom = top;
        columns.forEach((col, i) => {
            const x = M + i * (colW + 8);
            k.font(8.2, "bold", C.blueDark);
            k.text(col.heading, x, top);
            k.y = top + 5.5;
            bottom = Math.max(bottom, k.bullets(col.points, x, colW));
        });
        k.y = bottom + 4;
    };

    k.helpBox = (reference) => {
        const contact = [brand.phone && `call ${brand.phone}`, brand.email && `email ${brand.email}`].filter(Boolean).join(" or ");
        const line = `For changes, cancellation or any question, ${contact ? `${contact} and` : "contact our support team and"} quote your Booking ID ${reference}.`;
        k.font(8, "normal", C.text);
        const lines = k.wrap(line, CW - 12);
        const h = lines.length * 3.6 + 11;
        k.ensure(h + 2);
        k.fill(C.blueSoft);
        doc.roundedRect(M, k.y, CW, h, 2, 2, "F");
        k.font(8.6, "bold", C.blueDark);
        k.text(`Need help? We're here for you`, M + 6, k.y + 6);
        k.font(8, "normal", C.text);
        doc.text(lines, M + 6, k.y + 10.8);
        k.y += h + 4;
    };

    k.star = (cx, cy, r) => {
        const pts = Array.from({ length: 10 }, (_, i) => {
            const a = -Math.PI / 2 + (i * Math.PI) / 5;
            const rr = i % 2 ? r * 0.45 : r;
            return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
        });
        const segs = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
        k.fill(C.star);
        doc.lines(segs, pts[0][0], pts[0][1], [1, 1], "F", true);
    };

    k.finish = (note) => {
        const pages = doc.getNumberOfPages();
        const contact = [brand.name, brand.phone, brand.email].filter(Boolean).join("  |  ");
        for (let i = 1; i <= pages; i += 1) {
            doc.setPage(i);
            k.stroke(C.line);
            doc.line(M, H - 15, W - M, H - 15);
            k.font(7, "bold", C.text);
            k.text(k.fit(contact, CW - 30), M, H - 10.5);
            k.font(6.5, "normal", C.muted);
            k.text(note, M, H - 6.8);
            k.font(7, "normal", C.muted);
            k.text(`Page ${i} of ${pages}`, W - M, H - 10.5, { align: "right" });
        }
    };

    return k;
};

const safeName = (value) => String(value || "booking").replace(/[^a-z0-9_-]+/gi, "-");

/* ---------------------------------------------------------------------
   Flight e-ticket
   --------------------------------------------------------------------- */

const drawSegment = (k, segment, { cabin, baggage, seats }) => {
    const { doc, M, CW } = k;
    const airline = segment.fD?.aI || {};
    const dep = segment.da || {};
    const arr = segment.aa || {};
    const h = 41;
    k.ensure(h + 3);
    const y = k.y;

    k.stroke(C.line);
    k.fill(C.white);
    doc.roundedRect(M, y, CW, h, 2.5, 2.5, "FD");

    // airline column
    const colW = 46;
    k.font(9.5, "bold", C.ink);
    k.text(k.fit(airline.name || airline.code || "Airline", colW - 8), M + 5, y + 8);
    k.font(8.5, "bold", C.blue);
    k.text(`${airline.code || ""} ${segment.fD?.fN || ""}`.trim(), M + 5, y + 13);
    k.font(7.5, "normal", C.text);
    k.text(title(cabin || "Economy"), M + 5, y + 18.5);
    if (segment.fD?.eT) {
        k.font(7, "normal", C.muted);
        k.text(`Aircraft ${segment.fD.eT}`, M + 5, y + 22.5);
    }
    k.stroke(C.line);
    doc.line(M + colW, y + 4, M + colW, y + h - 11);

    // departure / arrival
    const x0 = M + colW + 6;
    const x1 = M + CW - 6;
    const point = (p, time, x, align) => {
        const opt = { align };
        k.font(16, "bold", C.ink);
        k.text(fmtTime(time), x, y + 10, opt);
        k.font(7.2, "normal", C.muted);
        k.text(fmtDay(time), x, y + 14.5, opt);
        k.font(8.5, "bold", C.blueDark);
        k.text(`${p.code || "-"}  ${p.city || ""}`.trim(), x, y + 19.5, opt);
        k.font(6.8, "normal", C.muted);
        k.text(k.fit(p.name || "", 46), x, y + 23.3, opt);
        if (p.terminal) {
            k.font(6.8, "bold", C.text);
            k.text(terminal(p.terminal), x, y + 26.8, opt);
        }
    };
    point(dep, segment.dt, x0, "left");
    point(arr, segment.at, x1, "right");

    // route line
    const lx0 = x0 + 50;
    const lx1 = x1 - 50;
    const mid = (lx0 + lx1) / 2;
    k.font(7.2, "bold", C.text);
    k.text(fmtDuration(segment.duration) || "-", mid, y + 9, { align: "center" });
    k.stroke(C.blueLine, 0.4);
    doc.setLineDashPattern([1, 0.8], 0);
    doc.line(lx0, y + 12, lx1 - 2, y + 12);
    doc.setLineDashPattern([], 0);
    k.fill(C.blue);
    doc.circle(lx0, y + 12, 0.9, "F");
    doc.triangle(lx1 - 2.6, y + 10.4, lx1 - 2.6, y + 13.6, lx1, y + 12, "F");
    k.font(6.8, "normal", C.muted);
    k.text(segment.stops > 0 ? `${segment.stops} technical stop` : "Non-stop", mid, y + 16.5, { align: "center" });

    // footer strip
    k.fill(C.zebra);
    doc.rect(M + 0.3, y + h - 8.5, CW - 0.6, 8.2, "F");
    k.stroke(C.line);
    doc.line(M, y + h - 8.5, M + CW, y + h - 8.5);
    const facts = [
        `Check-in baggage: ${baggage?.iB || "As per airline"}`,
        `Cabin baggage: ${baggage?.cB || "As per airline"}`,
        `Seat: ${seats || "Assigned at check-in"}`,
    ];
    k.font(7.2, "normal", C.text);
    facts.forEach((fact, i) => k.text(k.fit(fact, CW / 3 - 6), M + 5 + (i * CW) / 3, y + h - 3.4));

    k.y += h + 3;
};

export const createFlightTicketPdf = ({
    brand, booking, journeys, tripType, passengers, addOns, seatsByPax, cabin, baggage,
    pnr, lowCost, isDomestic, amount, fare, paymentOk,
}) => {
    const ref = booking.booking_reference || "-";
    const k = createKit({ brand, docTitle: "E-Ticket", reference: ref });
    const { doc, M, CW } = k;
    const isBooked = String(booking.status || "").toUpperCase() === "BOOKED";
    const segments = journeys.flatMap((j) => j.sI || []);
    const airlines = [...new Set(segments.map((s) => s.fD?.aI?.name || s.fD?.aI?.code).filter(Boolean))];

    k.header(isBooked ? "Confirmed" : title(booking.status || "Pending"), isBooked);

    const counts = passengers.reduce((acc, p) => {
        const type = title(p.paxType || p.type || "Adult");
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    k.refBand([
        { label: "Airline PNR", value: pnr || "Being generated", sub: airlines.join(", ") },
        { label: "Booking ID", value: ref },
        { label: "Booked on", value: fmtDateTime(booking.created_at) },
        {
            label: "Trip",
            value: { ONE_WAY: "One way", ROUND_TRIP: "Round trip", MULTI_CITY: "Multi city" }[String(tripType || "").toUpperCase()] || "Flight",
            sub: Object.entries(counts).map(([type, n]) => `${n} ${type}${n > 1 ? "s" : ""}`).join(", "),
        },
    ]);

    /* itinerary */
    const roundTrip = String(tripType || "").toUpperCase() === "ROUND_TRIP";
    journeys.forEach((journey, j) => {
        const sI = journey.sI || [];
        if (!sI.length) return;
        const first = sI[0];
        const last = sI[sI.length - 1];
        const tag = roundTrip ? (j === 0 ? "Onward" : "Return") : journeys.length > 1 ? `Flight ${j + 1}` : "Onward";
        const total = toDate(last.at) && toDate(first.dt) ? Math.round((toDate(last.at) - toDate(first.dt)) / 60000) : 0;
        const stops = sI.length - 1;
        k.section(
            `${tag}: ${first.da?.city || first.da?.code} to ${last.aa?.city || last.aa?.code}`,
            [fmtDay(first.dt), stops ? `${stops} stop${stops > 1 ? "s" : ""}` : "Non-stop", fmtDuration(total)].filter(Boolean).join("  |  ")
        );
        const jBaggage = journey.totalPriceList?.[0]?.fd?.ADULT?.bI;
        const kg = (v) => (v ? String(v).replace(/\s*(kilograms?|kgs?)\b/i, " kg") : v);
        const segBaggage = jBaggage ? { iB: kg(jBaggage.iB), cB: kg(jBaggage.cB) } : baggage;

        sI.forEach((segment, s) => {
            const seats = addOns
                .filter((a) => a.type === "SEAT" && String(a.key) === String(segment.id))
                .map((a) => a.code)
                .join(", ");
            drawSegment(k, segment, { cabin, baggage: segBaggage, seats });
            if (s < sI.length - 1) {
                const wait = segment.cT || (toDate(sI[s + 1].dt) && toDate(segment.at) ? Math.round((toDate(sI[s + 1].dt) - toDate(segment.at)) / 60000) : 0);
                const text = `Layover in ${segment.aa?.city || segment.aa?.code}${wait ? `  |  ${fmtDuration(wait)}` : ""}${segment.aa?.code !== sI[s + 1].da?.code ? "  |  Change of airport" : ""}`;
                k.ensure(10);
                k.font(7.4, "bold", C.amber);
                const w = doc.getTextWidth(clean(text)) + 10;
                k.fill(C.amberSoft);
                doc.roundedRect(M + (CW - w) / 2, k.y, w, 6.4, 3.2, 3.2, "F");
                k.text(text, M + CW / 2, k.y + 4.4, { align: "center" });
                k.y += 9.5;
            }
        });
        k.y += 4;
    });

    /* passengers */
    k.section("Passengers", `${passengers.length} traveller${passengers.length === 1 ? "" : "s"}`);
    k.table(
        [
            { title: "#", w: 0.05 },
            { title: "Passenger", w: 0.3 },
            { title: "Airline PNR", w: 0.15 },
            { title: "E-ticket no.", w: 0.19 },
            { title: "Seat", w: 0.1 },
            { title: "Meal / Baggage", w: 0.21 },
        ],
        passengers.map((p, i) => {
            const ticket = p.ticketNumber || p.ticketNo;
            const extras = addOns
                .filter((a) => a.type !== "SEAT" && a.passengerIndex === i)
                .map((a) => a.desc || a.code);
            return [
                String(i + 1),
                { text: personName(p), bold: true, sub: title(p.paxType || p.type || "Adult") },
                { text: p.pnr || pnr || "Pending", bold: Boolean(p.pnr || pnr) },
                ticket
                    ? { text: ticket }
                    : { text: lowCost && (p.pnr || pnr) ? "PNR is your ticket" : "Being issued", color: C.muted },
                seatsByPax[i] || p.seatNumber || "-",
                extras.length ? extras.join(", ") : "-",
            ];
        })
    );
    if (lowCost && pnr && passengers.some((p) => !(p.ticketNumber || p.ticketNo))) {
        k.y -= 3;
        k.font(7.2, "normal", C.muted);
        const lines = k.wrap(`${airlines.join(", ") || "This airline"} does not issue separate e-ticket numbers. Your PNR ${pnr} is your ticket reference for web check-in and at the airport.`, CW);
        k.ensure(lines.length * 3.4 + 4);
        doc.text(lines, M, k.y);
        k.y += lines.length * 3.4 + 5;
    }

    /* fare */
    k.section("Fare summary");
    const top = k.y;
    const rows = [
        fare.base != null && ["Base fare", money(fare.base)],
        fare.taxes != null && ["Taxes & fees", money(fare.taxes)],
        fare.seats > 0 && ["Seats", money(fare.seats)],
        fare.extras > 0 && ["Meals & baggage", money(fare.extras)],
    ].filter(Boolean);
    const box = k.amounts(rows, paymentOk ? "Total paid" : "Total", amount);
    // left of the fare box: payment facts
    k.font(7, "bold", C.muted);
    k.text("PAYMENT STATUS", M, top + 6);
    k.font(9, "bold", paymentOk ? C.green : C.amber);
    k.text(paymentOk ? "Paid" : title(booking.payment_status || "Pending"), M, top + 11);
    if (fare.txn) {
        k.font(7, "bold", C.muted);
        k.text("TRANSACTION ID", M, top + 18);
        k.font(8, "normal", C.ink);
        k.text(k.fit(fare.txn, box.x - M - 6), M, top + 23);
    }
    k.y = top + box.h + 8;

    /* information */
    k.section("Important information");
    k.infoColumns([
        {
            heading: "Before you fly",
            points: [
                "This e-ticket is not a boarding pass. Complete web check-in on the airline's website or app using your PNR and last name to get your boarding pass.",
                "Web check-in usually opens 48 hours (some airlines 24 hours) before departure and closes 60-75 minutes before departure.",
                `Reach the airport at least ${isDomestic ? "2 hours" : "3 hours"} before departure. Boarding gates close 20-25 minutes before departure.`,
                `Carry a valid government photo ID${isDomestic ? "" : " and passport with the required visas"} matching the name on this ticket.`,
            ],
        },
        {
            heading: "Baggage, changes & cancellation",
            points: [
                "Baggage allowance is per passenger as shown above. Extra baggage bought at the airport costs more.",
                "Flight timings and terminals can change. Please check the flight status with the airline before leaving for the airport.",
                "Cancellation and date-change charges apply as per the airline fare rules, plus our service fee.",
                "If you miss the flight (no-show), only the refundable taxes can be claimed.",
            ],
        },
    ]);
    k.helpBox(ref);
    k.finish("This is a computer-generated e-ticket and does not require a signature.");

    const flightDate = toDate(segments[0]?.dt || booking.created_at);
    const datePart = flightDate ? `${flightDate.getFullYear()}-${pad(flightDate.getMonth() + 1)}-${pad(flightDate.getDate())}` : "flight";
    return { doc, filename: `Flight-E-Ticket-${safeName(ref)}-${datePart}.pdf` };
};

/* ---------------------------------------------------------------------
   Hotel voucher
   --------------------------------------------------------------------- */

export const createHotelVoucherPdf = ({
    brand, booking, hotelInfo, guests, amount, breakup, penalties, inclusions, policyBlocks,
    minCheckInAge, directionsUrl, paymentOk,
}) => {
    const ref = booking.booking_reference || "-";
    const k = createKit({ brand, docTitle: "Hotel Voucher", reference: ref });
    const { doc, M, CW } = k;
    const isBooked = String(booking.status || "").toUpperCase() === "BOOKED";
    const nights = hotelInfo.nights;
    const adults = guests.filter((g) => String(g.type || "ADULT").toUpperCase() !== "CHILD").length;
    const children = guests.length - adults;

    k.header(isBooked ? "Confirmed" : title(booking.status || "Pending"), isBooked);
    k.refBand([
        { label: "Hotel confirmation no.", value: hotelInfo.confirmation || "To be shared by hotel" },
        { label: "Booking ID", value: ref },
        { label: "Booked on", value: fmtDateTime(booking.created_at) },
        {
            label: "Rooms & guests",
            value: `${hotelInfo.rooms || 1} Room${(hotelInfo.rooms || 1) > 1 ? "s" : ""}`,
            sub: [adults && `${adults} Adult${adults > 1 ? "s" : ""}`, children && `${children} Child${children > 1 ? "ren" : ""}`].filter(Boolean).join(", "),
        },
    ]);

    /* property */
    k.section("Property");
    k.font(13, "bold", C.ink);
    const nameLines = k.wrap(hotelInfo.name || "Hotel", CW - 12).slice(0, 2);
    k.font(7.8);
    const addressLines = k.wrap([hotelInfo.address, hotelInfo.city].filter(Boolean).join(", "), CW - 12).slice(0, 3);
    const rating = Math.round(Number(hotelInfo.rating) || 0);
    const cardH = 8 + nameLines.length * 5.4 + (rating ? 5 : 0) + addressLines.length * 3.6 + (directionsUrl ? 5 : 0) + 3;
    k.ensure(cardH + 2);
    let y = k.y;
    k.stroke(C.line);
    doc.roundedRect(M, y, CW, cardH, 2.5, 2.5, "S");
    y += 8;
    k.font(13, "bold", C.ink);
    doc.text(nameLines, M + 6, y);
    y += (nameLines.length - 1) * 5.4 + 5;
    if (rating) {
        for (let i = 0; i < Math.min(rating, 7); i += 1) k.star(M + 7.5 + i * 4.2, y - 1.2, 1.6);
        k.font(7.2, "normal", C.muted);
        k.text(`${rating}-star hotel`, M + 9 + Math.min(rating, 7) * 4.2, y);
        y += 5;
    }
    k.font(7.8, "normal", C.text);
    doc.text(addressLines, M + 6, y);
    y += addressLines.length * 3.6;
    if (directionsUrl) {
        k.font(7.8, "bold", C.blue);
        doc.textWithLink("View location on map", M + 6, y + 1.5, { url: directionsUrl });
    }
    k.y += cardH + 5;

    /* stay */
    k.ensure(30);
    y = k.y;
    k.fill(C.blueSoft);
    k.stroke(C.blueLine);
    doc.roundedRect(M, y, CW, 24, 2.5, 2.5, "FD");
    const stayCol = (heading, date, time, x, align) => {
        k.font(6.8, "bold", C.muted);
        k.text(heading, x, y + 7, { align });
        k.font(11.5, "bold", C.ink);
        k.text(fmtDay(date), x, y + 13.5, { align });
        k.font(7.5, "normal", C.text);
        k.text(time, x, y + 18.5, { align });
    };
    stayCol("CHECK-IN", hotelInfo.checkIn, `From ${hotelInfo.checkInFrom || "standard time"}`, M + 7, "left");
    stayCol("CHECK-OUT", hotelInfo.checkOut, `Until ${hotelInfo.checkOutBy || "standard time"}`, M + CW - 7, "right");
    const mid = M + CW / 2;
    k.stroke(C.blueLine, 0.4);
    doc.line(mid - 30, y + 12, mid + 30, y + 12);
    k.fill(C.white);
    doc.roundedRect(mid - 15, y + 8.5, 30, 7, 3.5, 3.5, "FD");
    k.font(8, "bold", C.blue);
    k.text(nights ? `${nights} Night${nights > 1 ? "s" : ""}` : "Stay", mid, y + 13.1, { align: "center" });
    k.y += 31;

    /* room */
    k.section("Room details");
    const refundText = hotelInfo.refundable === false ? "Non-refundable" : hotelInfo.refundable ? "Refundable" : "As per policy";
    k.table(
        [
            { title: "Room type", w: 0.44 },
            { title: "Meal plan", w: 0.28 },
            { title: "Cancellation", w: 0.28 },
        ],
        [[
            { text: hotelInfo.roomName || "-", bold: true },
            hotelInfo.mealBasis ? title(hotelInfo.mealBasis) : "Room only",
            { text: refundText, bold: true, color: hotelInfo.refundable === false ? C.red : hotelInfo.refundable ? C.green : C.ink },
        ]]
    );
    if (inclusions.length) {
        k.y -= 3;
        k.font(7.6, "bold", C.blueDark);
        k.ensure(10);
        k.text("Inclusions", M, k.y);
        k.y += 4.5;
        k.y = k.bullets(inclusions.slice(0, 10), M, CW) + 4;
    }

    /* guests */
    k.section("Guests", `${guests.length} guest${guests.length === 1 ? "" : "s"}`);
    k.table(
        [
            { title: "#", w: 0.06 },
            { title: "Guest name", w: 0.5 },
            { title: "Type", w: 0.24 },
            { title: "Room", w: 0.2 },
        ],
        guests.map((g, i) => [
            String(i + 1),
            { text: personName(g), bold: true, sub: g.isPrimary || g.isLead || (i === 0 && !guests.some((x) => x.isPrimary || x.isLead)) ? "Lead guest" : "" },
            String(g.type).toUpperCase() === "CHILD" && g.age != null ? `Child, ${g.age} yrs` : title(g.type || "Adult"),
            `Room ${Number(g.roomIndex ?? 0) + 1}`,
        ])
    );

    /* payment */
    k.section("Payment summary");
    const top = k.y;
    const box = k.amounts(
        [
            ["Room charges", money(breakup.base ?? amount)],
            Number(breakup.taxes) > 0 && ["Taxes & fees", money(breakup.taxes)],
            Number(breakup.discount) > 0 && ["Discount", `- ${money(breakup.discount)}`, C.green],
        ].filter(Boolean),
        paymentOk ? "Total paid" : "Total",
        amount
    );
    k.font(7, "bold", C.muted);
    k.text("PAYMENT STATUS", M, top + 6);
    k.font(9, "bold", paymentOk ? C.green : C.amber);
    k.text(paymentOk ? "Paid" : title(booking.payment_status || "Pending"), M, top + 11);
    k.font(7.2, "normal", C.muted);
    doc.text(k.wrap("Taxes are included. Charges for extra services are payable directly at the hotel.", box.x - M - 8), M, top + 18);
    k.y = top + box.h + 8;

    /* cancellation */
    k.section("Cancellation policy", refundText);
    if (penalties.length) {
        k.table(
            [
                { title: "If you cancel between", w: 0.7 },
                { title: "Cancellation charge", w: 0.3, align: "right" },
            ],
            penalties.map((p) => [
                `${fmtDateTime(p.from)}  -  ${fmtDateTime(p.to)}`,
                Number(p.amount) === 0 ? { text: "Free cancellation", bold: true, color: C.green } : { text: money(p.amount), bold: true },
            ])
        );
    } else {
        k.font(8, "normal", C.text);
        const lines = k.wrap(hotelInfo.refundable === false ? "This booking is non-refundable. Cancelling or not showing up will be charged the full booking amount." : "Cancellation charges apply as per the hotel policy.", CW);
        k.ensure(lines.length * 3.6 + 6);
        doc.text(lines, M, k.y);
        k.y += lines.length * 3.6 + 6;
    }

    /* check-in rules + hotel policies */
    k.section("Important information");
    const rules = [
        "Show this voucher (printed or on your phone) and a valid government photo ID for every guest at check-in.",
        minCheckInAge && `Minimum check-in age is ${minCheckInAge} years.`,
        "Foreign nationals must carry a passport and a valid visa.",
        "Early check-in and late check-out depend on availability and may be charged by the hotel.",
        "The hotel may ask for a refundable security deposit at check-in.",
        "Extra charges (food, minibar, laundry, transfers) are payable directly at the hotel.",
    ].filter(Boolean);
    const half = Math.ceil(rules.length / 2);
    k.infoColumns([
        { heading: "At check-in", points: rules.slice(0, half) },
        { heading: "During your stay", points: rules.slice(half) },
    ]);

    let budget = 24; // keep long supplier policy text from running for pages
    policyBlocks.forEach((block) => {
        if (budget <= 0) return;
        const points = block.groups
            .flatMap((g) => g.points.map((p) => (g.label ? `${g.label}: ${p}` : p)))
            .slice(0, budget);
        if (!points.length) return;
        budget -= points.length;
        k.ensure(14);
        k.font(8.2, "bold", C.blueDark);
        k.text(block.title, M, k.y);
        k.y += 5;
        // bullets() does not page-break, so split long blocks across pages here
        points.forEach((point) => {
            k.font(7.6);
            k.ensure(k.wrap(point, CW - 4).length * 3.5 + 3);
            k.y = k.bullets([point], M, CW);
        });
        k.y += 3;
    });

    k.helpBox(ref);
    k.finish("This is a computer-generated voucher and does not require a signature.");

    return { doc, filename: `Hotel-Voucher-${safeName(ref)}-${String(hotelInfo.checkIn || "").slice(0, 10)}.pdf` };
};
