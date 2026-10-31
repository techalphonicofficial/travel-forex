'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import './seat-selection.css';
import flightService from '@/app/services/flightBookingService';
import BookingTopBar, { getSessionExpiry, useSessionTimer } from '../BookingTopBar';

/* =========================================================
   CONSTANTS
========================================================= */

const FLOW_KEY = 'tripjack_passenger_flow';
const PAX_LABELS = { ADULT: 'Adult', CHILD: 'Child', INFANT: 'Infant' };

/* TripJack ssrInfo keys → our add-on types */
const SSR_TYPES = { SEAT: 'SEAT', MEAL: 'MEAL', BAGGAGE: 'BAGGAGE' };

const TAB_LABELS = {
    SEAT: 'Seats',
    MEAL: 'Meals',
    BAGGAGE: 'Extra baggage',
    EXTRA: 'Other services',
};

// Fast Forward and similar services fail at the airline, so they are hidden for now.
const EXTRA_SERVICES_ENABLED = process.env.NEXT_PUBLIC_FLIGHT_EXTRA_SERVICES === 'true';

/* =========================================================
   HELPERS
========================================================= */

const money = (value) =>
    `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatTime = (value) => {
    const match = String(value || '').match(/T(\d{2}:\d{2})/);
    return match ? match[1] : '--';
};

const humanize = (value) =>
    String(value || '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const getTrips = (review) => {
    const value = review?.tripInfos || [];
    if (Array.isArray(value)) return value;
    return Object.values(value || {}).filter(Array.isArray).flat();
};

/* Segments with their SSR options (only priced options can be bought) */
const getSegments = (review) =>
    getTrips(review).flatMap((trip) =>
        (Array.isArray(trip?.sI) ? trip.sI : []).map((segment) => {
            const ssr = segment?.ssrInfo || {};
            const options = { MEAL: [], BAGGAGE: [], EXTRA: [] };

            Object.entries(ssr).forEach(([key, list]) => {
                if (key === 'SEAT' || !Array.isArray(list)) return;
                const type = SSR_TYPES[key] || 'EXTRA';
                list
                    .filter((option) => option?.code && option?.amount != null)
                    .forEach((option) =>
                        options[type].push({
                            code: String(option.code),
                            amount: Number(option.amount) || 0,
                            desc: option.desc || humanize(option.code),
                            group: humanize(key),
                            image: option.image || option.imageUrl || option.img || null,
                        })
                    );
            });

            return {
                key: String(segment?.id),
                from: segment?.da?.code,
                to: segment?.aa?.code,
                fromCity: segment?.da?.city,
                toCity: segment?.aa?.city,
                dt: segment?.dt,
                airline: segment?.fD?.aI?.name,
                flightNo: `${segment?.fD?.aI?.code || ''}-${segment?.fD?.fN || ''}`,
                options,
            };
        })
    );

/* TripJack seat map → { [segmentKey]: { rows, columns, seats[] } } */
const parseSeatMap = (response) => {
    const tripSeat = response?.tripSeatMap?.tripSeat || {};
    const maps = {};

    Object.entries(tripSeat).forEach(([key, value]) => {
        const seats = (Array.isArray(value?.sInfo) ? value.sInfo : [])
            .filter((seat) => seat?.code || seat?.seatNo)
            .map((seat) => ({
                code: String(seat.code || seat.seatNo),
                seatNo: String(seat.seatNo || seat.code),
                row: Number(seat?.seatPosition?.row) || 0,
                column: Number(seat?.seatPosition?.column) || 0,
                amount: Number(seat?.amount) || 0,
                booked: seat?.isBooked === true,
                legroom: seat?.isLegroom === true,
                exit: seat?.isExitRow === true,
                window: seat?.isWindow === true,
                aisle: seat?.isAisle === true,
            }));

        if (!seats.length) return;

        maps[String(key)] = {
            rows: Math.max(Number(value?.sData?.row) || 0, ...seats.map((seat) => seat.row)),
            columns: Math.max(Number(value?.sData?.column) || 0, ...seats.map((seat) => seat.column)),
            seats,
        };
    });

    return maps;
};

/* Meal look-up from the description: veg / non-veg mark + an icon */
const getMealLook = (desc) => {
    const text = String(desc || '').toLowerCase();
    const nonVeg = /chicken|mutton|egg|fish|prawn|lamb|meat|non[\s-]?veg|keema|tuna|ham\b|bacon/.test(text);
    const veg = !nonVeg && /veg|paneer|dal|poha|upma|idli|dosa|aloo|cheese|corn|mushroom|fruit|salad|jain/.test(text);
    let icon = '🍽️';
    if (/biryani|rice|pulao|khichdi/.test(text)) icon = '🍛';
    else if (/sandwich|burger|wrap|roll|sub\b/.test(text)) icon = '🥪';
    else if (/tea|coffee|chai|beverage|drink|juice/.test(text)) icon = '☕';
    else if (/cake|muffin|cookie|dessert|sweet|brownie/.test(text)) icon = '🧁';
    else if (/pasta|noodle/.test(text)) icon = '🍝';
    else if (/poha|upma|idli|dosa|breakfast|omelette|paratha/.test(text)) icon = '🍳';
    else if (/salad|fruit/.test(text)) icon = '🥗';
    else if (/snack|nuts|chips|combo/.test(text)) icon = '🍱';
    return { icon, diet: nonVeg ? 'nonveg' : veg ? 'veg' : null };
};

/* "Excess Baggage - 15 Kg" → "15 Kg" */
const getBaggageWeight = (desc) => {
    const match = String(desc || '').match(/(\d+(?:\.\d+)?)\s*(kg|kgs|kilograms?|pc|piece|pieces)/i);
    if (!match) return desc;
    return /p/i.test(match[2]) ? `${match[1]} Piece${match[1] === '1' ? '' : 's'}` : `${match[1]} Kg`;
};

function SuitcaseIcon() {
    return (
        <svg viewBox="0 0 40 48" width="34" height="40" aria-hidden="true">
            <rect x="14" y="2" width="12" height="7" rx="2.5" fill="none" stroke="#1765c1" strokeWidth="2.5" />
            <rect x="6" y="9" width="28" height="33" rx="5" fill="#1d7be0" />
            <rect x="6" y="9" width="28" height="33" rx="5" fill="url(#ss-bag-shine)" />
            <line x1="15" y1="14" x2="15" y2="37" stroke="#0f5bb5" strokeWidth="2" />
            <line x1="25" y1="14" x2="25" y2="37" stroke="#0f5bb5" strokeWidth="2" />
            <circle cx="12" cy="44.5" r="2.5" fill="#334155" />
            <circle cx="28" cy="44.5" r="2.5" fill="#334155" />
            <defs>
                <linearGradient id="ss-bag-shine" x1="0" x2="1">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.25" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
}

const seatTone = (seat) => {
    if (seat.booked) return 'booked';
    if (seat.exit) return 'exit';
    if (seat.legroom) return 'legroom';
    if (!seat.amount) return 'free';
    return 'paid';
};

/* Stable string of the current selection (to reuse an already created booking) */
const selectionHash = (addOns) =>
    JSON.stringify(
        [...addOns].sort((a, b) =>
            `${a.passengerIndex}${a.type}${a.key}${a.code}`.localeCompare(`${b.passengerIndex}${b.type}${b.key}${b.code}`)
        )
    );

/* =========================================================
   PAGE
========================================================= */

function AddOnsForm({ flow }) {
    const router = useRouter();

    const review = useMemo(() => flow.review || {}, [flow]);
    const conditions = useMemo(() => review?.conditions || {}, [review]);
    const passengers = useMemo(() => (Array.isArray(flow.passengers) ? flow.passengers : []), [flow]);
    const segments = useMemo(() => getSegments(review), [review]);

    /* Infants sit on an adult's lap: adult N carries infant N */
    const seatPassengers = useMemo(() => {
        const infants = passengers.filter((p) => p.type === 'INFANT').length;
        let adultNo = 0;
        return passengers
            .map((p, index) => {
                if (p.type === 'INFANT') return null;
                const withInfant = p.type === 'ADULT' && adultNo++ < infants;
                const sameType = passengers.slice(0, index + 1).filter((item) => item.type === p.type).length;
                return {
                    index,
                    type: p.type,
                    name: `${p.title || ''} ${p.firstName || ''} ${p.lastName || ''}`.trim() || `${PAX_LABELS[p.type]} ${sameType}`,
                    label: `${PAX_LABELS[p.type]} ${sameType}`,
                    initials: `${(p.firstName || PAX_LABELS[p.type])[0]}${(p.lastName || '')[0] || ''}`.toUpperCase(),
                    withInfant,
                    exitAllowed: p.type === 'ADULT' && !withInfant,
                };
            })
            .filter(Boolean);
    }, [passengers]);

    const seatsAllowed = conditions?.isa !== false && conditions?.fsc?.issi !== false;
    const mandatory = { SEAT: Boolean(conditions?.ifsm), MEAL: Boolean(conditions?.ifmm), BAGGAGE: Boolean(conditions?.ifbm) };

    /* ---------- seat map (TripJack /seat) ---------- */

    const [seatState, setSeatState] = useState(() => (seatsAllowed && review?.bookingId ? { loading: true } : { maps: {} }));

    useEffect(() => {
        if (!seatsAllowed || !review?.bookingId) return undefined;
        let active = true;
        flightService
            .seat({ bookingId: review.bookingId })
            .then((data) => { if (active) setSeatState({ maps: parseSeatMap(data) }); })
            .catch((error) => {
                if (!active) return;
                // airline does not offer seat selection on this itinerary: not an error
                const notOffered = /not applicable|not available|not allowed/i.test(error?.message || '');
                setSeatState({ maps: {}, error: !notOffered });
            });
        return () => { active = false; };
    }, [seatsAllowed, review]);

    const seatMaps = seatState.maps || {};

    const tabs = useMemo(() => {
        const list = [];
        if (seatsAllowed) list.push('SEAT');
        if (conditions?.fsc?.ismi !== false && segments.some((s) => s.options.MEAL.length)) list.push('MEAL');
        if (conditions?.fsc?.isbi !== false && segments.some((s) => s.options.BAGGAGE.some((o) => o.amount > 0))) list.push('BAGGAGE');
        if (EXTRA_SERVICES_ENABLED && segments.some((s) => s.options.EXTRA.some((o) => o.amount > 0))) list.push('EXTRA');
        return list;
    }, [seatsAllowed, conditions, segments]);

    /* ---------- selection: { [`${passengerIndex}|${type}|${segmentKey}`]: option } ---------- */

    const [selection, setSelection] = useState(() => {
        const saved = {};
        (Array.isArray(flow.addOns) ? flow.addOns : []).forEach((item) => {
            if (item.type === 'EXTRA' && !EXTRA_SERVICES_ENABLED) return;
            const slot = item.type === 'EXTRA'
                ? `${item.passengerIndex}|EXTRA|${item.key}|${item.code}`
                : `${item.passengerIndex}|${item.type}|${item.key}`;
            saved[slot] = item;
        });
        return saved;
    });

    const [tab, setTab] = useState(null);
    const [segmentKey, setSegmentKey] = useState(segments[0]?.key || null);
    const [activePax, setActivePax] = useState(seatPassengers[0]?.index ?? 0);
    const [payment, setPayment] = useState(null);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [busy, setBusy] = useState(false);

    const activeTab = tabs.includes(tab) ? tab : tabs[0] || null;
    const segment = segments.find((s) => s.key === segmentKey) || segments[0];

    const addOns = useMemo(() => Object.values(selection), [selection]);
    const addOnTotals = useMemo(() => addOns.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + Number(item.amount || 0);
        acc.total += Number(item.amount || 0);
        return acc;
    }, { total: 0 }), [addOns]);

    const fare = Number(review?.totalPriceInfo?.totalFareDetail?.fC?.TF || 0);
    const total = fare + addOnTotals.total;

    const expiresAt = getSessionExpiry(flow);
    const secondsLeft = useSessionTimer(expiresAt);
    const sessionExpired = secondsLeft === 0;

    /* ---------- updates ---------- */

    const persist = (nextSelection) => {
        try {
            const current = JSON.parse(sessionStorage.getItem(FLOW_KEY) || 'null') || flow;
            sessionStorage.setItem(FLOW_KEY, JSON.stringify({
                ...current,
                addOns: Object.values(nextSelection).map(({ passengerIndex, type, key, code, amount, desc }) => ({ passengerIndex, type, key, code, amount, desc })),
                updatedAt: new Date().toISOString(),
            }));
        } catch {
            /* storage disabled */
        }
    };

    const updateSelection = (updater) => {
        setPayment(null);
        setSelection((prev) => {
            const next = updater(prev);
            persist(next);
            return next;
        });
    };

    const pickSeat = (seat) => {
        if (seat.booked || !segment) return;
        const pax = seatPassengers.find((p) => p.index === activePax);
        if (!pax) return;

        const ownerSlot = Object.entries(selection).find(([slot, item]) => item.type === 'SEAT' && item.key === segment.key && item.code === seat.code)?.[0];
        const mySlot = `${pax.index}|SEAT|${segment.key}`;

        if (ownerSlot && ownerSlot !== mySlot) {
            toast.error(`Seat ${seat.seatNo} is already selected for another traveller.`);
            return;
        }
        if (ownerSlot === mySlot) {
            updateSelection((prev) => {
                const next = { ...prev };
                delete next[mySlot];
                return next;
            });
            return;
        }
        if (seat.exit && !pax.exitAllowed) {
            toast.error(
                pax.type === 'CHILD'
                    ? 'Children cannot sit in an emergency exit row.'
                    : 'Travellers with an infant cannot sit in an emergency exit row.'
            );
            return;
        }

        updateSelection((prev) => ({
            ...prev,
            [mySlot]: { passengerIndex: pax.index, type: 'SEAT', key: segment.key, code: seat.code, amount: seat.amount, desc: `Seat ${seat.seatNo}` },
        }));

        // Next traveller without a seat on this flight
        const next = seatPassengers.find((p) => p.index !== pax.index && !selection[`${p.index}|SEAT|${segment.key}`]);
        if (next) {
            setActivePax(next.index);
            return;
        }

        // Everyone seated here: move to the next flight that still needs seats
        const nextSegment = segments.find((seg) =>
            seg.key !== segment.key &&
            seatMaps[seg.key] &&
            seatPassengers.some((p) => !selection[`${p.index}|SEAT|${seg.key}`])
        );
        if (nextSegment) {
            const firstMissing = seatPassengers.find((p) => !selection[`${p.index}|SEAT|${nextSegment.key}`]);
            setSegmentKey(nextSegment.key);
            if (firstMissing) setActivePax(firstMissing.index);
            toast.success(`Seats selected for ${segment.from} → ${segment.to}. Now choose seats for ${nextSegment.from} → ${nextSegment.to}.`, { duration: 3000 });
        }
    };

    /* How many travellers have an add-on of this type on a flight */
    const segmentStatus = (seg, type) => {
        const picked = seatPassengers
            .map((p) => selection[`${p.index}|${type}|${seg.key}`])
            .filter(Boolean);
        return { count: picked.length, total: seatPassengers.length, codes: picked.map((item) => item.code) };
    };

    const pickOption = (passengerIndex, type, option) => {
        const slot = `${passengerIndex}|${type}|${segment.key}`;
        updateSelection((prev) => {
            const next = { ...prev };
            if (!option) delete next[slot];
            else next[slot] = { passengerIndex, type, key: segment.key, code: option.code, amount: option.amount, desc: option.desc };
            return next;
        });
    };

    const toggleExtra = (passengerIndex, option) => {
        const slot = `${passengerIndex}|EXTRA|${segment.key}|${option.code}`;
        updateSelection((prev) => {
            const next = { ...prev };
            if (next[slot]) delete next[slot];
            else next[slot] = { passengerIndex, type: 'EXTRA', key: segment.key, code: option.code, amount: option.amount, desc: option.desc };
            return next;
        });
    };

    /* ---------- mandatory check ---------- */

    const missingMandatory = () => {
        for (const type of ['SEAT', 'MEAL', 'BAGGAGE']) {
            if (!mandatory[type] || !tabs.includes(type)) continue;
            for (const seg of segments) {
                const offered = type === 'SEAT' ? Boolean(seatMaps[seg.key]) : seg.options[type].length > 0;
                if (!offered) continue;
                const missing = seatPassengers.find((p) => !selection[`${p.index}|${type}|${seg.key}`]);
                if (missing) return { type, segment: seg, passenger: missing };
            }
        }
        return null;
    };

    /* ---------- continue → booking (server amount) → payment summary ---------- */

    const handleContinue = async () => {
        if (busy || sessionExpired) return;

        if (activeTab === 'SEAT' && seatState.loading) {
            toast('Seat map is still loading…');
            return;
        }

        const missing = missingMandatory();
        if (missing) {
            setTab(missing.type);
            setSegmentKey(missing.segment.key);
            setActivePax(missing.passenger.index);
            toast.error(`${TAB_LABELS[missing.type]} selection is mandatory for ${missing.passenger.label} on ${missing.segment.from} → ${missing.segment.to}.`);
            return;
        }

        const auth = (() => {
            try { return JSON.parse(localStorage.getItem('wl_auth') || 'null'); } catch { return null; }
        })();
        if (!auth?.id || !localStorage.getItem('wl_token')) {
            toast('Please log in to continue with your booking.', { icon: '🔒' });
            router.push(`/auth/login?redirect=${encodeURIComponent('/flights/seat-selection')}`);
            return;
        }

        const items = addOns.map(({ passengerIndex, type, key, code }) => ({ passengerIndex, type, key, code }));
        const hash = selectionHash(items);
        const current = JSON.parse(sessionStorage.getItem(FLOW_KEY) || 'null') || flow;

        // Same selection already confirmed → reuse that booking
        if (current?.booking?.internalBookingId && current?.booking?.addOnHash === hash && current?.booking?.amount) {
            setPayment({ bookingId: current.booking.internalBookingId, amount: current.booking.amount, breakup: current.booking.amountBreakup });
            return;
        }

        try {
            setBusy(true);

            const result = await flightService.createBooking({
                bookingType: 'FLIGHT',
                provider: 'TRIPJACK',
                providerBookingId: review?.bookingId || null,
                amount: total,
                currency: 'INR',
                bookingData: {
                    version: 2,
                    tripType: current.tripType,
                    search: current.search,
                    request: current.request,
                    priceIds: current.priceIds,
                    review: current.review,
                    selectedFare: current.selectedFare,
                    passengers: current.passengers,
                    contact: current.contact,
                    gstInfo: current.gstInfo || null,
                    emergencyContact: current.emergencyContact || null,
                    addOns: items,
                },
            });

            const booking = result?.data?.booking;
            const amount = Number(result?.data?.amountBreakup?.total ?? booking?.amount);

            if (!result?.success || !booking?.id || !amount) {
                throw new Error(result?.message || 'Unable to confirm your booking.');
            }

            sessionStorage.setItem(FLOW_KEY, JSON.stringify({
                ...current,
                addOns: addOns.map(({ passengerIndex, type, key, code, amount: price, desc }) => ({ passengerIndex, type, key, code, amount: price, desc })),
                booking: {
                    ...(current.booking || {}),
                    internalBookingId: booking.id,
                    bookingReference: booking.bookingReference || null,
                    amount,
                    amountBreakup: result?.data?.amountBreakup || null,
                    addOnHash: hash,
                    status: booking.status || 'INITIATED',
                },
                updatedAt: new Date().toISOString(),
            }));

            if (Math.abs(amount - total) >= 1) {
                toast(`Price updated by the airline: ${money(amount)}`, { icon: 'ℹ️' });
            }

            setPayment({ bookingId: booking.id, amount, breakup: result?.data?.amountBreakup });
        } catch (error) {
            const message = error?.message || 'Unable to confirm your booking.';
            if (/token|unauthor/i.test(message)) {
                toast.error('Your login session has expired. Please log in again.');
                router.push(`/auth/login?redirect=${encodeURIComponent('/flights/seat-selection')}`);
                return;
            }
            toast.error(message, { duration: 6000 });
        } finally {
            setBusy(false);
        }
    };

    const handlePay = async () => {
        if (!payment?.bookingId || busy) return;
        if (!acceptTerms) {
            toast.error('Please accept the fare rules and terms to continue.');
            return;
        }

        try {
            setBusy(true);
            const result = await flightService.continueToPay(payment.bookingId);
            const gateway = result?.data?.payment;
            const redirectURI = gateway?.response?.redirectURI;
            const tranCtx = gateway?.response?.tranCtx;

            if (!result?.success || !gateway?.success || !redirectURI || !tranCtx) {
                throw new Error(result?.message || 'Unable to start the payment. Please try again.');
            }
            if (!/^https:\/\//i.test(redirectURI)) {
                throw new Error('Invalid payment gateway address.');
            }

            const current = JSON.parse(sessionStorage.getItem(FLOW_KEY) || 'null') || flow;
            sessionStorage.setItem(FLOW_KEY, JSON.stringify({
                ...current,
                payment: {
                    paymentId: gateway?.paymentId || null,
                    merchantTxnNo: gateway?.merchantTxnNo || gateway?.response?.merchantTxnNo || null,
                    gateway: gateway?.gateway || 'ICICI_ORANGE_PG',
                    status: 'PENDING',
                    initiatedAt: new Date().toISOString(),
                },
                updatedAt: new Date().toISOString(),
            }));

            window.location.assign(`${redirectURI}?tranCtx=${encodeURIComponent(tranCtx)}`);
        } catch (error) {
            toast.error(error?.message || 'Unable to start the payment.', { duration: 6000 });
            setBusy(false);
        }
    };

    /* ---------- render pieces ---------- */

    const renderPassengerList = (type) => (
        <div className="ss-pax-list">
            {seatPassengers.map((pax) => {
                const item = type === 'EXTRA_LIST'
                    ? (() => {
                        const list = addOns.filter((x) => x.type === 'EXTRA' && x.passengerIndex === pax.index && x.key === segment?.key);
                        return list.length ? { desc: list.map((x) => x.desc).join(', '), amount: list.reduce((sum, x) => sum + Number(x.amount || 0), 0) } : null;
                    })()
                    : selection[`${pax.index}|${type}|${segment?.key}`];
                return (
                    <button
                        type="button"
                        key={pax.index}
                        className={`ss-pax ${activePax === pax.index ? 'active' : ''}`}
                        onClick={() => setActivePax(pax.index)}
                    >
                        <span className="ss-avatar">{pax.initials}</span>
                        <span className="ss-pax-info">
                            <strong>{pax.name}</strong>
                            <small>
                                {item ? `${item.desc} • ${item.amount ? money(item.amount) : 'Free'}` : `${pax.label}${pax.withInfant ? ' • with infant' : ''}`}
                            </small>
                        </span>
                    </button>
                );
            })}
        </div>
    );

    const renderSeatMap = () => {
        if (seatState.loading) return <div className="ss-empty"><span className="ss-spinner" /> Loading seat map…</div>;
        const map = seatMaps[segment?.key];
        if (!map) {
            return (
                <div className="ss-empty">
                    {seatState.error
                        ? 'Seat map could not be loaded right now. You can continue; seats will be assigned at check-in.'
                        : 'Seat selection is not available for this flight. Seats will be assigned at check-in.'}
                </div>
            );
        }

        const byPosition = new Map(map.seats.map((seat) => [`${seat.row}-${seat.column}`, seat]));
        const rows = [...new Set(map.seats.map((seat) => seat.row))].sort((a, b) => a - b);
        // Nose on the left: right-hand seats (F) on top, left-hand seats (A) at the bottom
        const lanes = Array.from({ length: map.columns }, (_, i) => map.columns - i);
        const usedColumns = new Set(map.seats.map((seat) => seat.column));
        const letters = Object.fromEntries(map.seats.map((seat) => [seat.column, seat.seatNo.replace(/^\d+/, '')]));
        const exitRows = new Set(map.seats.filter((seat) => seat.exit).map((seat) => seat.row));
        const aisleLanes = lanes.filter((lane) => !usedColumns.has(lane));
        const numberLane = aisleLanes[Math.floor(aisleLanes.length / 2)] ?? null;
        const takenBy = Object.fromEntries(
            addOns.filter((item) => item.type === 'SEAT' && item.key === segment.key).map((item) => [item.code, item.passengerIndex])
        );
        const paidAmounts = map.seats.filter((seat) => !seat.booked && seat.amount > 0).map((seat) => seat.amount);
        const priceRange = paidAmounts.length ? `${money(Math.min(...paidAmounts))} – ${money(Math.max(...paidAmounts))}` : null;

        return (
            <>
                <div className="ss-legend">
                    <span><i className="free" /> Free</span>
                    <span><i className="paid" /> Paid{priceRange ? ` (${priceRange})` : ''}</span>
                    <span><i className="legroom" /> Extra legroom</span>
                    <span><i className="exit" /> Exit row</span>
                    <span><i className="booked" /> Occupied</span>
                    <span><i className="selected" /> Selected</span>
                </div>

                <div className="ss-plane-scroll">
                    <div className="ss-plane-h">
                        <span className="ss-wing top" aria-hidden="true" />
                        <span className="ss-wing bottom" aria-hidden="true" />

                        <div className="ss-cockpit" aria-hidden="true">
                            <span>✈</span>
                            <small>Front</small>
                        </div>

                        <div
                            className="ss-cabin"
                            style={{
                                gridTemplateColumns: `20px repeat(${rows.length}, 30px)`,
                                gridTemplateRows: lanes.map((lane) => (usedColumns.has(lane) ? '30px' : '22px')).join(' '),
                            }}
                        >
                            {lanes.map((lane) => (
                                <div className="ss-lane" key={lane} style={{ display: 'contents' }}>
                                    <span className="ss-lane-label">{usedColumns.has(lane) ? letters[lane] : ''}</span>
                                    {rows.map((row) => {
                                        if (!usedColumns.has(lane)) {
                                            return (
                                                <span key={row} className={`ss-aisle-cell ${exitRows.has(row) ? 'exit' : ''}`}>
                                                    {lane === numberLane ? row : ''}
                                                </span>
                                            );
                                        }
                                        const seat = byPosition.get(`${row}-${lane}`);
                                        if (!seat) return <span key={row} />;
                                        const owner = takenBy[seat.code];
                                        const ownerPax = seatPassengers.find((p) => p.index === owner);
                                        const tone = owner !== undefined ? 'selected' : seatTone(seat);
                                        return (
                                            <button
                                                type="button"
                                                key={row}
                                                className={`ss-seat ${tone}`}
                                                disabled={seat.booked}
                                                onClick={() => pickSeat(seat)}
                                                title={`${seat.seatNo} • ${seat.booked ? 'Occupied' : seat.amount ? money(seat.amount) : 'Free'}${seat.legroom ? ' • Extra legroom' : ''}${seat.exit ? ' • Exit row' : ''}${seat.window ? ' • Window' : seat.aisle ? ' • Aisle' : ''}`}
                                                aria-label={`Seat ${seat.seatNo}${seat.booked ? ' occupied' : ''}`}
                                            >
                                                {ownerPax ? ownerPax.initials : seat.booked ? '×' : ''}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        <div className="ss-tail" aria-hidden="true" />
                    </div>
                </div>
                <p className="ss-scroll-hint">Scroll sideways to see all rows • Row numbers are shown in the aisle</p>
            </>
        );
    };

    /* All flights × all travellers */
    const renderSeatSummary = () => {
        const seatSegments = segments.filter((seg) => seatMaps[seg.key]);
        if (!seatSegments.length) return null;

        return (
            <div className="ss-seat-summary">
                <div className="ss-seat-summary-head">
                    <strong>Your seats</strong>
                    <small>
                        {seatSegments.reduce((sum, seg) => sum + segmentStatus(seg, 'SEAT').count, 0)} of {seatSegments.length * seatPassengers.length} selected
                    </small>
                </div>
                <div className="ss-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Traveller</th>
                                {seatSegments.map((seg) => (
                                    <th key={seg.key}>
                                        {seg.from} → {seg.to}
                                        <small>{segmentStatus(seg, 'SEAT').count}/{seatPassengers.length}</small>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {seatPassengers.map((pax) => (
                                <tr key={pax.index}>
                                    <td>{pax.name}</td>
                                    {seatSegments.map((seg) => {
                                        const item = selection[`${pax.index}|SEAT|${seg.key}`];
                                        return (
                                            <td key={seg.key}>
                                                <button
                                                    type="button"
                                                    className={item ? 'picked' : ''}
                                                    onClick={() => {
                                                        setSegmentKey(seg.key);
                                                        setActivePax(pax.index);
                                                    }}
                                                >
                                                    {item ? `${item.code} • ${item.amount ? money(item.amount) : 'Free'}` : 'Select'}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderOptions = (type) => {
        const options = (segment?.options?.[type] || []).filter((option) => type === 'MEAL' || option.amount > 0);
        if (!options.length) {
            return <div className="ss-empty">{TAB_LABELS[type]} {type === 'MEAL' ? 'are' : 'is'} not available on this flight.</div>;
        }

        const pax = seatPassengers.find((p) => p.index === activePax) || seatPassengers[0];
        const slotFor = (option) => (type === 'EXTRA'
            ? `${pax?.index}|EXTRA|${segment.key}|${option.code}`
            : `${pax?.index}|${type}|${segment.key}`);
        const isPicked = (option) => {
            const item = selection[slotFor(option)];
            return Boolean(item && item.code === option.code);
        };
        // how many travellers on this flight already have this option
        const takenCount = (option) => addOns.filter((item) => item.type === type && item.key === segment.key && item.code === option.code).length;

        const add = (option) => {
            if (!pax) return;
            if (type === 'EXTRA') {
                if (!isPicked(option)) toggleExtra(pax.index, option);
                return;
            }
            pickOption(pax.index, type, option);
            // move on to the next traveller who has nothing yet
            const next = seatPassengers.find((p) => p.index !== pax.index && !selection[`${p.index}|${type}|${segment.key}`]);
            if (next) setActivePax(next.index);
        };
        const remove = (option) => {
            if (!pax || !isPicked(option)) return;
            if (type === 'EXTRA') toggleExtra(pax.index, option);
            else pickOption(pax.index, type, null);
        };

        return (
            <div className="ss-addon-wrap">
                <p className="ss-hint">
                    Adding for <b>{pax?.name}</b>{segment ? ` on ${segment.from} → ${segment.to}` : ''}.
                    {type === 'EXTRA' ? ' You can add more than one service.' : ` One ${type === 'MEAL' ? 'meal' : 'baggage option'} per traveller per flight.`}
                </p>
                {renderPassengerList(type === 'EXTRA' ? 'EXTRA_LIST' : type)}

                <div className={`ss-addon-grid ${type === 'MEAL' ? 'meal' : ''}`}>
                    {options.map((option) => {
                        const picked = isPicked(option);
                        const count = takenCount(option);
                        const look = type === 'MEAL' ? getMealLook(option.desc) : null;
                        return (
                            <div className={`ss-addon-card ${picked ? 'picked' : ''}`} key={option.code}>
                                <div className="ss-addon-media">
                                    {option.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={option.image} alt="" loading="lazy" />
                                    ) : type === 'BAGGAGE' ? (
                                        <SuitcaseIcon />
                                    ) : type === 'MEAL' ? (
                                        <span className="ss-food">{look.icon}</span>
                                    ) : (
                                        <span className="ss-food">⚡</span>
                                    )}
                                </div>

                                <div className="ss-addon-body">
                                    <div className="ss-addon-title">
                                        {look?.diet && <i className={`ss-diet ${look.diet}`} title={look.diet === 'veg' ? 'Vegetarian' : 'Non-vegetarian'} />}
                                        <strong>{type === 'BAGGAGE' ? getBaggageWeight(option.desc) : option.desc}</strong>
                                    </div>
                                    {type === 'BAGGAGE' && <small>Extra check-in baggage</small>}
                                    {count > 0 && <small className="ss-taken">Added for {count} traveller{count > 1 ? 's' : ''}</small>}

                                    <div className="ss-addon-foot">
                                        <b>{option.amount ? money(option.amount) : 'Free'}</b>
                                        <div className="ss-stepper" aria-label={`${option.desc} for ${pax?.name}`}>
                                            <button type="button" onClick={() => remove(option)} disabled={!picked} aria-label="Remove">−</button>
                                            <span>{picked ? 1 : 0}</span>
                                            <button type="button" onClick={() => add(option)} disabled={picked} aria-label="Add">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    /* ---------- render ---------- */

    return (
        <>
            <BookingTopBar
                step={2}
                onBack={() => router.push('/flights/passenger-details')}
                backLabel="Travellers"
                secondsLeft={secondsLeft}
                total={total}
                totalLabel="Total"
                continueLabel={busy && !payment ? 'Please wait…' : addOns.length ? 'Continue' : 'Skip & continue'}
                onContinue={handleContinue}
                continueDisabled={busy || sessionExpired}
            />

            <div className="ss-container ss-layout">
                <section className="ss-main">
                    <div className="ss-head">
                        <h1>Seats, meals &amp; add-ons</h1>
                        <p>All add-ons are optional{Object.values(mandatory).some(Boolean) ? ' unless marked required' : ''}. Infants travel on an adult’s lap and do not get a seat.</p>
                    </div>

                    {tabs.length > 0 ? (
                        <div className="ss-card">
                            <div className="ss-tabs" role="tablist">
                                {tabs.map((type) => (
                                    <button
                                        type="button"
                                        role="tab"
                                        key={type}
                                        aria-selected={activeTab === type}
                                        className={activeTab === type ? 'active' : ''}
                                        onClick={() => setTab(type)}
                                    >
                                        {TAB_LABELS[type]}
                                        {mandatory[type] && <em>Required</em>}
                                        {addOnTotals[type] > 0 && <small>{money(addOnTotals[type])}</small>}
                                    </button>
                                ))}
                            </div>

                            {segments.length > 1 && (
                                <div className="ss-segments">
                                    {segments.map((seg, index) => {
                                        const type = activeTab === 'EXTRA' ? null : activeTab;
                                        const status = type ? segmentStatus(seg, type) : null;
                                        const offered = type === 'SEAT' ? Boolean(seatMaps[seg.key]) : true;
                                        const done = status && offered && status.count === status.total;
                                        return (
                                            <button
                                                type="button"
                                                key={seg.key}
                                                className={`${segment?.key === seg.key ? 'active' : ''} ${done ? 'done' : ''}`}
                                                onClick={() => setSegmentKey(seg.key)}
                                            >
                                                <span className="ss-seg-no">{done ? '✓' : index + 1}</span>
                                                <span className="ss-seg-info">
                                                    <strong>{seg.from} → {seg.to}</strong>
                                                    <small>{seg.flightNo} • {formatTime(seg.dt)}</small>
                                                    {status && offered && (
                                                        <em>
                                                            {status.count}/{status.total} {type === 'SEAT' ? 'seats' : type === 'MEAL' ? 'meals' : 'added'}
                                                            {type === 'SEAT' && status.codes.length > 0 && ` • ${status.codes.join(', ')}`}
                                                        </em>
                                                    )}
                                                    {type === 'SEAT' && !offered && !seatState.loading && <em>Not available</em>}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'SEAT' ? (
                                <div className="ss-seat-layout">
                                    <p className="ss-hint">
                                        Choosing for <b>{seatPassengers.find((p) => p.index === activePax)?.name}</b>
                                        {segment ? ` on ${segment.from} → ${segment.to}` : ''}. Tap a traveller to change.
                                    </p>
                                    {renderPassengerList('SEAT')}
                                    <div className="ss-map-wrap">{renderSeatMap()}</div>
                                    {renderSeatSummary()}
                                </div>
                            ) : (
                                renderOptions(activeTab)
                            )}
                        </div>
                    ) : (
                        <div className="ss-card ss-empty">
                            Seats, meals and extra baggage are not available for online selection on this fare. You can continue to payment.
                        </div>
                    )}
                </section>

                <aside className="ss-sidebar">
                    <section className="ss-card">
                        <h2>Fare summary</h2>
                        <div className="ss-fare-row"><span>Flight fare</span><strong>{money(fare)}</strong></div>
                        {['SEAT', 'MEAL', 'BAGGAGE', 'EXTRA'].filter((type) => addOnTotals[type] > 0).map((type) => (
                            <div className="ss-fare-row" key={type}><span>{TAB_LABELS[type]}</span><strong>{money(addOnTotals[type])}</strong></div>
                        ))}
                        <div className="ss-fare-total">
                            <div><strong>Total amount</strong><small>Final amount is confirmed before payment</small></div>
                            <strong>{money(total)}</strong>
                        </div>

                        {addOns.length > 0 && (
                            <ul className="ss-selected">
                                {addOns.map((item) => {
                                    const pax = seatPassengers.find((p) => p.index === item.passengerIndex);
                                    const seg = segments.find((s) => s.key === item.key);
                                    return (
                                        <li key={`${item.passengerIndex}-${item.type}-${item.key}-${item.code}`}>
                                            <span>{pax?.label} • {seg?.from}-{seg?.to}</span>
                                            <b>{item.desc}</b>
                                            <em>{item.amount ? money(item.amount) : 'Free'}</em>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </aside>
            </div>

            {/* PAYMENT SUMMARY (amount confirmed by the server) */}
            {payment && (
                <div className="ss-modal" role="dialog" aria-modal="true">
                    <div className="ss-modal-card">
                        <h3>Review &amp; pay</h3>
                        <div className="ss-fare-row"><span>Flight fare</span><strong>{money(payment.breakup?.fare ?? fare)}</strong></div>
                        {Number(payment.breakup?.addOns) > 0 && (
                            <div className="ss-fare-row"><span>Seats, meals &amp; add-ons</span><strong>{money(payment.breakup.addOns)}</strong></div>
                        )}
                        <div className="ss-fare-total">
                            <div><strong>Amount payable</strong><small>Inclusive of all taxes</small></div>
                            <strong>{money(payment.amount)}</strong>
                        </div>

                        <label className="ss-terms">
                            <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
                            <span>
                                I have read and accept the fare rules, the{' '}
                                <a href="/terms" target="_blank" rel="noopener noreferrer">terms of use</a> and the{' '}
                                <a href="/cancellation" target="_blank" rel="noopener noreferrer">cancellation &amp; refund policy</a>.
                            </span>
                        </label>

                        <div className="ss-modal-actions">
                            <button type="button" className="ss-btn ss-btn-outline" disabled={busy} onClick={() => setPayment(null)}>
                                Back
                            </button>
                            <button type="button" className="ss-btn" disabled={busy || !acceptTerms} onClick={handlePay}>
                                {busy ? 'Redirecting…' : `Pay ${money(payment.amount)} securely`}
                            </button>
                        </div>
                        <p className="ss-secure">🔒 You will be redirected to the secure ICICI payment page.</p>
                    </div>
                </div>
            )}

            {sessionExpired && (
                <div className="ss-modal" role="dialog" aria-modal="true">
                    <div className="ss-modal-card">
                        <h3>Your session has expired</h3>
                        <p>Flight prices and availability change frequently. Please search again to get the latest fares.</p>
                        <button type="button" className="ss-btn" onClick={() => router.push('/flights')}>Search flights</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default function SeatSelectionPage() {
    const router = useRouter();

    const stored = useSyncExternalStore(
        () => () => {},
        () => sessionStorage.getItem(FLOW_KEY) || '',
        () => null
    );

    const flow = useMemo(() => {
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }, [stored]);

    const ready = flow?.review && Array.isArray(flow?.passengers) && flow.passengers.some((p) => p?.firstName);

    return (
        <>
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
            <main className="flight-ss-page">
                {ready ? (
                    <AddOnsForm flow={flow} />
                ) : (
                    <div className="ss-container">
                        <div className="ss-card ss-empty ss-page-empty">
                            {stored === null ? (
                                <p>Loading…</p>
                            ) : (
                                <>
                                    <h2>Traveller details missing</h2>
                                    <p>Please add traveller details before choosing seats and meals.</p>
                                    <button type="button" className="ss-btn" onClick={() => router.push(flow?.review ? '/flights/passenger-details' : '/flights')}>
                                        {flow?.review ? 'Add traveller details' : 'Search flights'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
