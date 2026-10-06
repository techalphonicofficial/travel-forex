'use client';

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import flightService from '@/app/services/flightBookingService';

const FLOW_KEY = 'tripjack_passenger_flow';
const SELECTED_FLIGHT_KEY = 'tripjack_selected_flight';

/* =========================================================
   HELPERS
========================================================= */

const parseJSON = (value, fallback = null) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

const money = (value) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const passengerName = (passenger, index) =>
    [passenger?.title, passenger?.firstName, passenger?.lastName]
        .filter(Boolean)
        .join(' ') || `Passenger ${index + 1}`;

const getSeatPosition = (seat) =>
    seat?.seatPosition || {
        row: 0,
        column: 0,
    };

/*
  IMPORTANT:

  One-way TripJack response can be:

  tripSeatMap: {
    tripSeat: {
      sData: {...},
      sInfo: [...]
    }
  }

  Earlier code used Object.entries(tripSeat), which caused:

  sData -> fake sector
  sInfo -> fake sector

  This function keeps that structure as ONE sector.

  For multi-sector responses it supports:
  1. Array of seat maps
  2. Object keyed by sector
*/
const getSeatMaps = (response) => {
    const tripSeat = response?.tripSeatMap?.tripSeat;

    if (!tripSeat) return [];

    // ONE-WAY / SINGLE SECTOR
    if (
        !Array.isArray(tripSeat) &&
        typeof tripSeat === 'object' &&
        Array.isArray(tripSeat.sInfo)
    ) {
        return [
            {
                key: 'sector-0',
                ...tripSeat,
            },
        ];
    }

    // MULTI-SECTOR ARRAY
    if (Array.isArray(tripSeat)) {
        return tripSeat.map((value, index) => ({
            key: value?.key || `sector-${index}`,
            ...(value || {}),
        }));
    }

    // MULTI-SECTOR OBJECT
    if (typeof tripSeat === 'object') {
        return Object.entries(tripSeat)
            .filter(
                ([, value]) =>
                    value &&
                    typeof value === 'object' &&
                    Array.isArray(value.sInfo)
            )
            .map(([key, value]) => ({
                key,
                ...value,
            }));
    }

    return [];
};

const formatDate = (value) => {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const titleCase = (value) => {
    if (!value) return '';

    return value.charAt(0) + value.slice(1).toLowerCase();
};

/*
  Reads selected flight review information.
*/
const getFlightFareInfo = (raw) => {
    if (!raw) return null;

    try {
        const fareDetail =
            raw?.review?.totalPriceInfo?.totalFareDetail?.fC || {};

        const search = raw?.search || {};

        const paxInfo =
            raw?.request?.searchQuery?.paxInfo || {};

        const adults = Number(
            paxInfo.ADULT ?? search.adults ?? 0
        );

        const children = Number(
            paxInfo.CHILD ?? search.children ?? 0
        );

        const infants = Number(
            paxInfo.INFANT ?? search.infants ?? 0
        );

        const total = Number(
            fareDetail.TF ?? fareDetail.NF ?? 0
        );

        if (!total) return null;

        return {
            bookingId: raw?.review?.bookingId || '',
            tripType: raw?.tripType || '',
            from: search.from || '',
            fromCode: search.fromCode || '',
            to: search.to || '',
            toCode: search.toCode || '',
            departureDate: search.departureDate || '',
            cabinClass: search.cabinClass || '',
            adults,
            children,
            infants,
            baseFare: Number(fareDetail.BF || 0),
            taxes: Number(fareDetail.TAF || 0),
            total,
        };
    } catch {
        return null;
    }
};

/*
  Standard aircraft layout:

  A B C | D E F

  Column values:
  1 2 3 | 5 6 7
*/
const SEAT_LETTERS = [
    { column: 1, label: 'A' },
    { column: 2, label: 'B' },
    { column: 3, label: 'C' },
    { column: 5, label: 'D' },
    { column: 6, label: 'E' },
    { column: 7, label: 'F' },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function SeatSelectionPage() {
    const router = useRouter();

    const aircraftScrollRef = useRef(null);

    const [flow, setFlow] = useState(null);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [seatResponse, setSeatResponse] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isReviewed, setIsReviewed] = useState(false);
    const [bookingId, setBookingId] = useState(null);

    const [activePassenger, setActivePassenger] = useState(0);
    const [activeMap, setActiveMap] = useState(0);

    /*
      IMPORTANT:
  
      Seat selection is stored like:
  
      {
        "sector-0": {
          0: seatForPassenger1,
          1: seatForPassenger2
        },
  
        "sector-1": {
          0: seatForPassenger1,
          1: seatForPassenger2
        }
      }
  
      This prevents a seat selected on sector-0 from appearing
      selected on sector-1.
    */
    const [selectedSeats, setSelectedSeats] = useState({});

    const [scrollInfo, setScrollInfo] = useState({
        left: 0,
        max: 0,
        viewport: 0,
        content: 0,
    });

    /* =========================================================
       LOAD BOOKING FLOW
    ========================================================= */

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(FLOW_KEY);

            if (!raw) {
                router.replace('/flights');
                return;
            }

            const parsed = parseJSON(raw);

            if (!parsed) {
                throw new Error('Invalid booking session');
            }

            setFlow(parsed);

            const restoredSeats = {};

            /*
              NEW FORMAT
      
              seatSelection.bySector
            */
            if (
                parsed?.seatSelection?.bySector &&
                typeof parsed.seatSelection.bySector === 'object'
            ) {
                Object.entries(
                    parsed.seatSelection.bySector
                ).forEach(([sectorKey, sectorSeats]) => {
                    restoredSeats[sectorKey] = {
                        ...(sectorSeats || {}),
                    };
                });
            }

            /*
              OLD FORMAT MIGRATION
      
              seatSelection.seats
            */
            else if (
                Array.isArray(parsed?.seatSelection?.seats)
            ) {
                const legacySectorKey =
                    parsed?.seatSelection?.sectorKey ||
                    'sector-0';

                restoredSeats[legacySectorKey] = {};

                parsed.seatSelection.seats.forEach((item) => {
                    if (
                        item?.passengerIndex !== undefined &&
                        item?.seat
                    ) {
                        restoredSeats[legacySectorKey][
                            item.passengerIndex
                        ] = item.seat;
                    }
                });
            }

            setSelectedSeats(restoredSeats);
        } catch (error) {
            console.error(
                'Booking flow load error:',
                error
            );

            toast.error(
                'Unable to load booking session.'
            );

            router.replace('/flights');
        }
    }, [router]);



    //fetching exsting booking id 
    useEffect(() => {
        const savedReviewResponse =
            sessionStorage.getItem('flightReviewResponse');

        if (!savedReviewResponse) {
            return;
        }

        try {
            const parsedResponse =
                JSON.parse(savedReviewResponse);

            const id =
                parsedResponse?.data?.booking?.id;

            if (id) {
                setBookingId(id);
                setIsReviewed(true);
            }

        } catch (error) {
            console.error(
                'Unable to read flight review response:',
                error
            );
        }
    }, []);

    /* =========================================================
       LOAD SELECTED FLIGHT
    ========================================================= */

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(
                SELECTED_FLIGHT_KEY
            );

            setSelectedFlight(parseJSON(raw));
        } catch (error) {
            console.error(
                'Selected flight load error:',
                error
            );
        }
    }, []);

    const flightFare = useMemo(
        () => getFlightFareInfo(selectedFlight),
        [selectedFlight]
    );

    /* =========================================================
       FLIGHT SEGMENTS
    ========================================================= */

    const flightSegments = useMemo(() => {
        try {
            const tripInfos =
                selectedFlight?.review?.tripInfos || [];

            const segments = [];

            tripInfos.forEach((trip) => {
                const segArray =
                    trip?.sI ||
                    trip?.segmentInfo ||
                    trip?.segments ||
                    [];

                segArray.forEach((seg) => {
                    const da =
                        seg?.da ||
                        seg?.origin ||
                        seg?.departure ||
                        {};

                    const aa =
                        seg?.aa ||
                        seg?.destination ||
                        seg?.arrival ||
                        {};

                    const fromCode =
                        da?.code ||
                        da?.airportCode ||
                        da?.iata ||
                        da?.cityCode ||
                        '';

                    const toCode =
                        aa?.code ||
                        aa?.airportCode ||
                        aa?.iata ||
                        aa?.cityCode ||
                        '';

                    if (fromCode && toCode) {
                        segments.push({
                            fromCode,
                            toCode,
                        });
                    }
                });
            });

            return segments;
        } catch {
            return [];
        }
    }, [selectedFlight]);

    /* =========================================================
       LOAD SEAT MAP
    ========================================================= */

    const loadSeats = useCallback(
        async (currentFlow) => {
            try {
                setLoading(true);

                if (!currentFlow?.bookingId) {
                    throw new Error(
                        'TripJack bookingId is missing.'
                    );
                }

                const response =
                    await flightService.seat({
                        bookingId:
                            currentFlow.bookingId,
                    });

                const maps = getSeatMaps(response);

                if (!maps.length) {
                    throw new Error(
                        'Seat map is not available for this flight.'
                    );
                }

                setSeatResponse(response);
                setActiveMap(0);
            } catch (error) {
                console.error(
                    'TripJack Seat API error:',
                    error
                );

                toast.error(
                    error?.response?.data?.message ||
                    error?.message ||
                    'Unable to load seat map.'
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        if (flow) {
            loadSeats(flow);
        }
    }, [flow, loadSeats]);

    /* =========================================================
       DERIVED DATA
    ========================================================= */

    const passengers = useMemo(() => {
        return Array.isArray(flow?.passengers)
            ? flow.passengers
            : [];
    }, [flow]);

    const maps = useMemo(() => {
        return getSeatMaps(seatResponse);
    }, [seatResponse]);

    const currentMap =
        maps[activeMap] || null;

    const seats = useMemo(() => {
        return Array.isArray(
            currentMap?.sInfo
        )
            ? currentMap.sInfo
            : [];
    }, [currentMap]);

    /*
      Group seats by row.
    */
    const rows = useMemo(() => {
        const grouped = {};

        seats.forEach((seat) => {
            const row = Number(
                getSeatPosition(seat).row || 0
            );

            if (!row) return;

            if (!grouped[row]) {
                grouped[row] = [];
            }

            grouped[row].push(seat);
        });

        return Object.entries(grouped)
            .sort(
                ([a], [b]) =>
                    Number(a) - Number(b)
            )
            .map(([row, rowSeats]) => ({
                row: Number(row),
                seats: rowSeats.sort(
                    (a, b) =>
                        Number(
                            getSeatPosition(a).column
                        ) -
                        Number(
                            getSeatPosition(b).column
                        )
                ),
            }));
    }, [seats]);

    /*
      Current sector key.
    */
    const currentSectorKey =
        currentMap?.key ||
        `sector-${activeMap}`;

    /*
      ONLY CURRENT SECTOR selections.
    */
    const currentSectorSeats =
        selectedSeats[currentSectorKey] ||
        {};

    /*
      Number of selected seats in current sector.
    */
    const selectedCount =
        Object.keys(currentSectorSeats).length;

    /*
      Total selected seats across ALL sectors.
    */
    const totalSelectedCount = useMemo(() => {
        return Object.values(
            selectedSeats
        ).reduce(
            (total, sectorSeats) =>
                total +
                Object.keys(
                    sectorSeats || {}
                ).length,
            0
        );
    }, [selectedSeats]);

    /*
      Total seat charge across ALL sectors.
    */
    const seatTotal = useMemo(() => {
        return Object.values(
            selectedSeats
        ).reduce(
            (sectorSum, sectorSeats) =>
                sectorSum +
                Object.values(
                    sectorSeats || {}
                ).reduce(
                    (sum, seat) =>
                        sum +
                        Number(
                            seat?.amount || 0
                        ),
                    0
                ),
            0
        );
    }, [selectedSeats]);

    const grandTotal = useMemo(
        () =>
            (flightFare?.total || 0) +
            seatTotal,
        [flightFare, seatTotal]
    );

    /* =========================================================
       SECTOR LABEL
    ========================================================= */

    const getSectorLabel = useCallback(
        (map, index) => {
            const directFrom =
                map?.originCode ||
                map?.depCode ||
                map?.fromCode ||
                map?.da?.code ||
                map?.origin?.code;

            const directTo =
                map?.destinationCode ||
                map?.arrCode ||
                map?.toCode ||
                map?.aa?.code ||
                map?.destination?.code;

            if (
                directFrom &&
                directTo
            ) {
                return `${directFrom} - ${directTo}`;
            }

            if (
                typeof map?.key === 'string'
            ) {
                const match =
                    map.key.match(
                        /^([A-Z]{3})[-_]([A-Z]{3})$/i
                    );

                if (match) {
                    return `${match[1].toUpperCase()} - ${match[2].toUpperCase()}`;
                }
            }

            const segment =
                flightSegments[index];

            if (
                segment?.fromCode &&
                segment?.toCode
            ) {
                return `${segment.fromCode} - ${segment.toCode}`;
            }

            if (
                maps.length === 1 &&
                flightFare?.fromCode &&
                flightFare?.toCode
            ) {
                return `${flightFare.fromCode} - ${flightFare.toCode}`;
            }

            return `Sector ${index + 1}`;
        },
        [
            flightSegments,
            flightFare,
            maps.length,
        ]
    );

    const travellerCount =
        flightFare
            ? Math.max(
                1,
                (flightFare.adults || 0) +
                (flightFare.children || 0) +
                (flightFare.infants || 0)
            )
            : passengers.length || 1;

    /* =========================================================
       HORIZONTAL SCROLL
    ========================================================= */

    const updateScrollInfo =
        useCallback(() => {
            const element =
                aircraftScrollRef.current;

            if (!element) return;

            const max = Math.max(
                0,
                element.scrollWidth -
                element.clientWidth
            );

            setScrollInfo({
                left: element.scrollLeft,
                max,
                viewport:
                    element.clientWidth,
                content:
                    element.scrollWidth,
            });
        }, []);

    useEffect(() => {
        const element =
            aircraftScrollRef.current;

        if (!element) return;

        updateScrollInfo();

        const handleScroll = () => {
            updateScrollInfo();
        };

        element.addEventListener(
            'scroll',
            handleScroll,
            {
                passive: true,
            }
        );

        window.addEventListener(
            'resize',
            updateScrollInfo
        );

        let resizeObserver = null;

        if (
            typeof ResizeObserver !==
            'undefined'
        ) {
            resizeObserver =
                new ResizeObserver(
                    updateScrollInfo
                );

            resizeObserver.observe(
                element
            );
        }

        return () => {
            element.removeEventListener(
                'scroll',
                handleScroll
            );

            window.removeEventListener(
                'resize',
                updateScrollInfo
            );

            resizeObserver?.disconnect();
        };
    }, [
        activeMap,
        rows.length,
        updateScrollInfo,
    ]);

    /*
      Reset horizontal scroll when sector changes.
    */
    useEffect(() => {
        const element =
            aircraftScrollRef.current;

        if (!element) return;

        element.scrollTo({
            left: 0,
            behavior: 'auto',
        });

        requestAnimationFrame(
            updateScrollInfo
        );
    }, [
        activeMap,
        rows.length,
        updateScrollInfo,
    ]);

    /* =========================================================
       SEAT STATE
    ========================================================= */

    const getSeatState = (seat) => {
        if (seat?.isBooked) {
            return 'booked';
        }

        /*
          IMPORTANT:
          Only current sector is checked.
        */
        const sectorSeats =
            selectedSeats[
            currentSectorKey
            ] || {};

        /*
          Current passenger selected this seat.
        */
        if (
            sectorSeats[
                activePassenger
            ]?.seatNo === seat?.seatNo
        ) {
            return 'selected';
        }

        /*
          Another passenger selected this seat
          ONLY in current sector.
        */
        const assignedToOtherPassenger =
            Object.entries(
                sectorSeats
            ).some(
                ([index, selected]) =>
                    Number(index) !==
                    activePassenger &&
                    selected?.seatNo ===
                    seat?.seatNo
            );

        return assignedToOtherPassenger
            ? 'assigned'
            : 'available';
    };

    /* =========================================================
       CHOOSE SEAT
    ========================================================= */

    const chooseSeat = (seat) => {
        if (!seat) return;

        if (seat.isBooked) return;

        const sectorSeats =
            selectedSeats[
            currentSectorKey
            ] || {};

        /*
          Check if another passenger has selected
          the same seat on the SAME sector.
        */
        const alreadySelectedByOther =
            Object.entries(
                sectorSeats
            ).some(
                ([index, selected]) =>
                    Number(index) !==
                    activePassenger &&
                    selected?.seatNo ===
                    seat.seatNo
            );

        if (alreadySelectedByOther) {
            toast.error(
                'This seat is already selected by another passenger on this sector.'
            );

            return;
        }

        setSelectedSeats(
            (previous) => {
                const next = {
                    ...previous,

                    [currentSectorKey]: {
                        ...(previous[
                            currentSectorKey
                        ] || {}),
                    },
                };

                /*
                  Clicking the same selected seat
                  removes it.
                */
                if (
                    next[currentSectorKey][
                        activePassenger
                    ]?.seatNo ===
                    seat.seatNo
                ) {
                    delete next[
                        currentSectorKey
                    ][activePassenger];
                } else {
                    /*
                      One seat per passenger per sector.
                    */
                    next[
                        currentSectorKey
                    ][activePassenger] =
                        seat;
                }

                return next;
            }
        );
    };

    /* =========================================================
       AIRCRAFT SCROLL
    ========================================================= */

    const scrollAircraft = (
        direction
    ) => {
        const element =
            aircraftScrollRef.current;

        if (!element) return;

        const amount = Math.max(
            260,
            scrollInfo.viewport * 0.7
        );

        element.scrollBy({
            left:
                direction * amount,
            behavior: 'smooth',
        });
    };

    /* =========================================================
       MINI AIRCRAFT NAVIGATION
    ========================================================= */

    const jumpFromOverview = (
        event
    ) => {
        const element =
            aircraftScrollRef.current;

        if (!element) return;

        const rect =
            event.currentTarget.getBoundingClientRect();

        const x = Math.min(
            Math.max(
                event.clientX -
                rect.left,
                0
            ),
            rect.width
        );

        const ratio =
            rect.width > 0
                ? x / rect.width
                : 0;

        element.scrollTo({
            left:
                ratio * scrollInfo.max,
            behavior: 'smooth',
        });
    };

    /* =========================================================
       SAVE & CONTINUE
    ========================================================= */
    const saveAndContinue = async () => {
        if (saving) return;

        try {
            setSaving(true);

            console.log(
                'Booking ID:',
                bookingId
            );

            // ----------------------------------------
            // 1. Validate booking ID
            // ----------------------------------------

            if (!bookingId) {
                throw new Error(
                    'Booking ID not found. Please review the flight first.'
                );
            }

            // ----------------------------------------
            // 2. Continue To Pay
            // Only booking ID is sent
            // ----------------------------------------

            const result =
                await flightService.continueToPay(
                    bookingId
                );

            console.log(
                'Continue To Pay Response:',
                result
            );

            // ----------------------------------------
            // 3. Validate backend response
            // ----------------------------------------

            if (!result?.success) {
                throw new Error(
                    result?.message ||
                    'Unable to initiate payment.'
                );
            }

            // ----------------------------------------
            // 4. Get payment object
            // ----------------------------------------

            const payment =
                result?.data?.payment;

            if (!payment?.success) {
                throw new Error(
                    'Payment initiation failed.'
                );
            }

            // ----------------------------------------
            // 5. Get ICICI response
            // ----------------------------------------

            const iciciResponse =
                payment?.response;

            if (!iciciResponse) {
                throw new Error(
                    'ICICI payment response not received.'
                );
            }

            const redirectURI =
                iciciResponse?.redirectURI;

            const tranCtx =
                iciciResponse?.tranCtx;

            console.log(
                'ICICI redirectURI:',
                redirectURI
            );

            console.log(
                'ICICI tranCtx:',
                tranCtx
            );

            if (!redirectURI) {
                throw new Error(
                    'ICICI redirect URL not received.'
                );
            }

            if (!tranCtx) {
                throw new Error(
                    'ICICI transaction context not received.'
                );
            }

            // ----------------------------------------
            // 6. Get existing flow
            // ----------------------------------------

            const currentFlow =
                JSON.parse(
                    sessionStorage.getItem(
                        FLOW_KEY
                    ) || 'null'
                ) || flow;

            // ----------------------------------------
            // 7. Save payment information
            // ----------------------------------------

            const paymentFlow = {
                ...currentFlow,

                booking: {
                    ...(currentFlow?.booking || {}),

                    internalBookingId:
                        result?.data?.booking?.id ||
                        bookingId,

                    bookingReference:
                        result?.data?.booking
                            ?.bookingReference ||
                        null,

                    status:
                        result?.data?.booking?.status ||
                        'INITIATED',

                    paymentStatus:
                        result?.data?.booking
                            ?.paymentStatus ||
                        'PENDING',
                },

                payment: {
                    paymentId:
                        payment?.paymentId ||
                        null,

                    merchantTxnNo:
                        payment?.merchantTxnNo ||
                        iciciResponse?.merchantTxnNo ||
                        null,

                    gateway:
                        payment?.gateway ||
                        'ICICI_ORANGE_PG',

                    status:
                        payment?.status ||
                        'pending',

                    tranCtx,

                    redirectURI,

                    initiatedAt:
                        new Date().toISOString(),
                },

                updatedAt:
                    new Date().toISOString(),
            };

            sessionStorage.setItem(
                FLOW_KEY,
                JSON.stringify(paymentFlow)
            );

            setFlow(paymentFlow);

            // ----------------------------------------
            // 8. Build ICICI payment URL
            // ----------------------------------------

            const paymentUrl =
                `${redirectURI}?tranCtx=${encodeURIComponent(
                    tranCtx
                )}`;

            console.log(
                'ICICI Payment Redirect:',
                paymentUrl
            );

            // ----------------------------------------
            // 9. DELETE OLD FLIGHT REVIEW RESPONSE
            //
            // Payment response successfully received
            // so old review response is no longer needed.
            // This prevents next booking from using
            // previous booking ID.
            // ----------------------------------------

            sessionStorage.removeItem(
                'flightReviewResponse'
            );

            console.log(
                'flightReviewResponse removed from sessionStorage'
            );

            // ----------------------------------------
            // 10. Redirect to ICICI
            // ----------------------------------------

            toast.success(
                'Booking created. Redirecting to payment...'
            );

            window.location.assign(
                paymentUrl
            );

        } catch (error) {

            console.error(
                'Payment initiation error:',
                error
            );

            toast.error(
                error?.message ||
                'Unable to continue to payment.'
            );

        } finally {

            setSaving(false);

        }
    };

    const handleReviewFlight = async () => {
        if (saving) return;

        if (!passengers.length) {
            toast.error('Passenger information not found.');
            return;
        }

        try {
            setSaving(true);

            // ----------------------------------------
            // 1. Prepare sector-wise seat data
            // ----------------------------------------

            const seatsForBooking = Object.entries(selectedSeats).flatMap(
                ([sectorKey, sectorSeats]) =>
                    Object.entries(sectorSeats || {}).map(
                        ([passengerIndex, seat]) => ({
                            sectorIndex: maps.findIndex(
                                (map) => map.key === sectorKey
                            ),

                            sectorKey,

                            passengerIndex: Number(passengerIndex),

                            passenger:
                                passengers[Number(passengerIndex)] || null,

                            seat: {
                                seatNo:
                                    seat?.seatNo ||
                                    seat?.code ||
                                    null,

                                code:
                                    seat?.code ||
                                    seat?.seatNo ||
                                    null,

                                amount: Number(seat?.amount || 0),

                                isWindow: Boolean(
                                    seat?.isWindow
                                ),

                                isAisle: Boolean(
                                    seat?.isAisle
                                ),

                                isLegroom: Boolean(
                                    seat?.isLegroom ||
                                    seat?.isLegRoom
                                ),

                                isExitRow: Boolean(
                                    seat?.isExitRow
                                ),
                            },
                        })
                    )
            );

            // ----------------------------------------
            // 2. Prepare complete flow
            // ----------------------------------------

            const updatedFlow = {
                ...flow,

                seatSelection: {
                    seats: seatsForBooking,

                    bySector: selectedSeats,

                    totalAmount: seatTotal,

                    flightFare:
                        flightFare?.total || 0,

                    grandTotal,

                    currency: 'INR',

                    selectedCount:
                        seatsForBooking.length,

                    sectorCount:
                        maps.length,

                    skipped:
                        seatsForBooking.length === 0,

                    savedAt:
                        new Date().toISOString(),
                },

                updatedAt:
                    new Date().toISOString(),
            };

            // ----------------------------------------
            // 3. Save updated flow
            // ----------------------------------------

            sessionStorage.setItem(
                FLOW_KEY,
                JSON.stringify(updatedFlow)
            );

            setFlow(updatedFlow);

            // ----------------------------------------
            // 4. Get logged-in user
            // ----------------------------------------

            const auth =
                JSON.parse(
                    localStorage.getItem('wl_auth') || 'null'
                );

            const userId = auth?.id || null;

            if (!userId) {
                toast.error(
                    'User session expired. Please login again.'
                );

                return;
            }

            // ----------------------------------------
            // 5. Prepare booking payload
            // ----------------------------------------

            const bookingPayload = {
                userId,

                bookingType: 'FLIGHT',

                provider: 'TRIPJACK',

                providerBookingId:
                    updatedFlow?.review?.bookingId ||
                    updatedFlow?.booking?.tripjackBookingId ||
                    null,

                providerReference:
                    updatedFlow?.review?.bookingId ||
                    null,

                amount: Number(grandTotal),

                currency: 'INR',

                correlationId:
                    updatedFlow?.request?.correlationId ||
                    null,

                bookingData: {
                    version: 2,

                    tripType:
                        updatedFlow.tripType,

                    search:
                        updatedFlow.search,

                    request:
                        updatedFlow.request,

                    priceIds:
                        updatedFlow.priceIds,

                    review:
                        updatedFlow.review,

                    selectedFare:
                        updatedFlow.selectedFare,

                    passengers:
                        updatedFlow.passengers,

                    contact:
                        updatedFlow.contact,

                    seatSelection:
                        updatedFlow.seatSelection,
                },
            };

            console.log(
                'Flight Review Payload:',
                bookingPayload
            );

            // ----------------------------------------
            // 6. Create booking + Fare Validate
            // ----------------------------------------

            const result =
                await flightService.fareValidate(
                    bookingPayload
                );

            console.log(
                'Flight Review Response:',
                result
            );

            // ----------------------------------------
            // 7. Validate response
            // ----------------------------------------

            if (!result?.success) {
                throw new Error(
                    result?.message ||
                    'Unable to review flight booking.'
                );
            }

            // ----------------------------------------
            // 8. Save complete review response
            // ----------------------------------------

            // ----------------------------------------
            // 8. Save complete review response
            // ----------------------------------------

            sessionStorage.setItem(
                'flightReviewResponse',
                JSON.stringify(result)
            );

            // ----------------------------------------
            // 9. Get booking ID immediately
            // ----------------------------------------

            const reviewedBookingId =
                result?.data?.booking?.id;

            if (!reviewedBookingId) {
                throw new Error(
                    'Booking ID not received from flight review response.'
                );
            }

            // IMPORTANT:
            // Set bookingId immediately instead of waiting
            // for the separate useEffect to read sessionStorage.

            setBookingId(
                reviewedBookingId
            );

            // ----------------------------------------
            // 10. Verify saved response
            // ----------------------------------------

            const savedReviewResponse =
                JSON.parse(
                    sessionStorage.getItem(
                        'flightReviewResponse'
                    ) || 'null'
                );

            if (!savedReviewResponse) {
                throw new Error(
                    'Unable to save flight review response.'
                );
            }

            setIsReviewed(true);

            console.log(
                'Flight Review Booking ID:',
                reviewedBookingId
            );

            toast.success(
                'Flight reviewed successfully.'
            );

        } catch (error) {

            console.error(
                'Flight review error:',
                error
            );

            toast.error(
                error?.message ||
                'Unable to review flight booking.'
            );

        } finally {

            setSaving(false);

        }
    };
    /* =========================================================
       LOADING
    ========================================================= */

    if (loading || !flow) {
        return (
            <>
                <Toaster position="top-right" />

                <main className="page loading-page">
                    <div className="loading-card">
                        <div className="spinner" />

                        <h2>
                            Loading seat map
                        </h2>

                        <p>
                            Fetching live seat
                            availability...
                        </p>
                    </div>
                </main>

                <style jsx>
                    {styles}
                </style>
            </>
        );
    }

    /* =========================================================
       MAIN UI
    ========================================================= */

    return (
        <>
            <Toaster position="top-right" />

            <main className="page">
                <div className="container">

                    {/* HEADER */}

                    <header className="header">
                        <div className="eyebrow">
                            Flight booking
                        </div>

                        <h1>
                            Select your seats
                        </h1>

                        <p>
                            Choose a seat for each
                            passenger. Seat prices are
                            taken from the live
                            TripJack seat map.
                        </p>
                    </header>

                    {/* SECTOR TABS */}

                    {maps.length > 1 && (
                        <div className="tabs">
                            {maps.map(
                                (map, index) => (
                                    <button
                                        key={map.key}
                                        type="button"
                                        className={
                                            index ===
                                                activeMap
                                                ? 'tab active'
                                                : 'tab'
                                        }
                                        onClick={() =>
                                            setActiveMap(
                                                index
                                            )
                                        }
                                    >
                                        {getSectorLabel(
                                            map,
                                            index
                                        )}
                                    </button>
                                )
                            )}
                        </div>
                    )}

                    <div className="layout">

                        {/* MAIN */}

                        <section className="main">

                            {/* PASSENGERS */}

                            <div className="card passengers-card">
                                <div className="section-title">
                                    Select seat for
                                </div>

                                <div className="passengers">
                                    {passengers.map(
                                        (
                                            passenger,
                                            index
                                        ) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={
                                                    index ===
                                                        activePassenger
                                                        ? 'passenger active'
                                                        : 'passenger'
                                                }
                                                onClick={() =>
                                                    setActivePassenger(
                                                        index
                                                    )
                                                }
                                            >
                                                <small>
                                                    Passenger{' '}
                                                    {index + 1}
                                                </small>

                                                <strong>
                                                    {passengerName(
                                                        passenger,
                                                        index
                                                    )}
                                                </strong>

                                                <span>
                                                    {currentSectorSeats[
                                                        index
                                                    ]
                                                        ? `Seat ${currentSectorSeats[index].seatNo}`
                                                        : 'Select a seat'}
                                                </span>
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* AIRCRAFT */}

                            <div className="card aircraft-card">

                                <div className="map-header">
                                    <div>
                                        <strong>
                                            Choose your seat
                                        </strong>

                                        <span>
                                            Scroll horizontally
                                            to view the full
                                            aircraft
                                        </span>
                                    </div>

                                    {scrollInfo.max >
                                        0 && (
                                            <div className="scroll-hint">
                                                <button
                                                    type="button"
                                                    aria-label="Scroll aircraft left"
                                                    onClick={() =>
                                                        scrollAircraft(
                                                            -1
                                                        )
                                                    }
                                                >
                                                    ‹
                                                </button>

                                                <span>
                                                    Scroll
                                                </span>

                                                <button
                                                    type="button"
                                                    aria-label="Scroll aircraft right"
                                                    onClick={() =>
                                                        scrollAircraft(
                                                            1
                                                        )
                                                    }
                                                >
                                                    ›
                                                </button>
                                            </div>
                                        )}
                                </div>

                                {/* MINI AIRCRAFT */}

                                <div className="aircraft-overview-wrap">

                                    <div className="overview-labels">
                                        <span>
                                            Front
                                        </span>

                                        <span>
                                            {rows.length
                                                ? `${rows.length} rows`
                                                : 'Aircraft'}
                                        </span>

                                        <span>
                                            Rear
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="aircraft-overview"
                                        onClick={
                                            jumpFromOverview
                                        }
                                        aria-label="Aircraft overview. Click to move around aircraft."
                                    >
                                        <span className="mini-nose" />

                                        <span className="mini-cabin">
                                            {rows.map(
                                                (
                                                    { row },
                                                    index
                                                ) => (
                                                    <span
                                                        key={row}
                                                        className={
                                                            index %
                                                                3 ===
                                                                0
                                                                ? 'mini-row mini-row-alt'
                                                                : 'mini-row'
                                                        }
                                                    >
                                                        {SEAT_LETTERS.map(
                                                            (
                                                                letter
                                                            ) => (
                                                                <i
                                                                    key={
                                                                        letter.column
                                                                    }
                                                                />
                                                            )
                                                        )}
                                                    </span>
                                                )
                                            )}
                                        </span>

                                        <span className="mini-tail" />

                                        <span
                                            className="overview-viewport"
                                            style={{
                                                width: `${scrollInfo.content
                                                    ? Math.min(
                                                        100,
                                                        (scrollInfo.viewport /
                                                            scrollInfo.content) *
                                                        100
                                                    )
                                                    : 100
                                                    }%`,

                                                left: `${scrollInfo.max
                                                    ? (scrollInfo.left /
                                                        scrollInfo.max) *
                                                    (100 -
                                                        Math.min(
                                                            100,
                                                            (scrollInfo.viewport /
                                                                scrollInfo.content) *
                                                            100
                                                        ))
                                                    : 0
                                                    }%`,
                                            }}
                                        />
                                    </button>

                                    <div className="overview-note">
                                        <span>
                                            Highlighted area =
                                            currently visible
                                            section
                                        </span>

                                        {scrollInfo.max >
                                            0 && (
                                                <b>
                                                    {Math.round(
                                                        (scrollInfo.left /
                                                            scrollInfo.max) *
                                                        100
                                                    )}
                                                    % across
                                                </b>
                                            )}
                                    </div>
                                </div>

                                {/* SCROLLABLE AIRCRAFT */}

                                <div className="aircraft-scroll-shell">

                                    {scrollInfo.max >
                                        0 && (
                                            <button
                                                type="button"
                                                className="map-arrow left"
                                                aria-label="Scroll aircraft left"
                                                onClick={() =>
                                                    scrollAircraft(
                                                        -1
                                                    )
                                                }
                                            >
                                                ‹
                                            </button>
                                        )}

                                    <div
                                        className="aircraft-scroll"
                                        ref={
                                            aircraftScrollRef
                                        }
                                    >
                                        <div className="aircraft">

                                            <div
                                                className="aircraft-shape"
                                                aria-hidden="true"
                                            />

                                            <span
                                                className="wing wing-top"
                                                aria-hidden="true"
                                            />

                                            <span
                                                className="wing wing-bottom"
                                                aria-hidden="true"
                                            />

                                            <span
                                                className="tail-wing tail-wing-top"
                                                aria-hidden="true"
                                            />

                                            <span
                                                className="tail-wing tail-wing-bottom"
                                                aria-hidden="true"
                                            />

                                            <span
                                                className="tail-fin"
                                                aria-hidden="true"
                                            />

                                            <div className="nose">
                                                <span>
                                                    Front
                                                </span>

                                                <small>
                                                    ✈
                                                </small>
                                            </div>

                                            <div className="cabin">

                                                <div className="cabin-top-label">
                                                    {rows.map(
                                                        ({
                                                            row,
                                                        }) => (
                                                            <span
                                                                key={row}
                                                            >
                                                                {row}
                                                            </span>
                                                        )
                                                    )}
                                                </div>

                                                <div className="seat-grid">

                                                    <div className="seat-label-column">
                                                        {SEAT_LETTERS.map(
                                                            (
                                                                letter
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        letter.column
                                                                    }
                                                                >
                                                                    {
                                                                        letter.label
                                                                    }
                                                                </span>
                                                            )
                                                        )}
                                                    </div>

                                                    {rows.map(
                                                        ({
                                                            row,
                                                            seats:
                                                            rowSeats,
                                                        }) => {
                                                            const byColumn =
                                                                {};

                                                            rowSeats.forEach(
                                                                (
                                                                    seat
                                                                ) => {
                                                                    byColumn[
                                                                        Number(
                                                                            getSeatPosition(
                                                                                seat
                                                                            ).column
                                                                        )
                                                                    ] =
                                                                        seat;
                                                                }
                                                            );

                                                            return (
                                                                <div
                                                                    className="seat-column"
                                                                    key={
                                                                        row
                                                                    }
                                                                >
                                                                    {SEAT_LETTERS.map(
                                                                        (
                                                                            letter
                                                                        ) => {
                                                                            const seat =
                                                                                byColumn[
                                                                                letter
                                                                                    .column
                                                                                ];

                                                                            if (
                                                                                !seat
                                                                            ) {
                                                                                return (
                                                                                    <span
                                                                                        className="empty-seat"
                                                                                        key={`${row}-${letter.column}`}
                                                                                    />
                                                                                );
                                                                            }

                                                                            const state =
                                                                                getSeatState(
                                                                                    seat
                                                                                );

                                                                            const premium =
                                                                                Boolean(
                                                                                    seat?.isLegroom ||
                                                                                    seat?.isExitRow
                                                                                );

                                                                            return (
                                                                                <button
                                                                                    key={
                                                                                        seat.seatNo
                                                                                    }
                                                                                    type="button"
                                                                                    disabled={
                                                                                        state ===
                                                                                        'booked' ||
                                                                                        state ===
                                                                                        'assigned'
                                                                                    }
                                                                                    className={`seat ${state} ${premium
                                                                                        ? 'premium'
                                                                                        : ''
                                                                                        }`}
                                                                                    onClick={() =>
                                                                                        chooseSeat(
                                                                                            seat
                                                                                        )
                                                                                    }
                                                                                    title={`${seat.seatNo} • ${money(
                                                                                        seat.amount
                                                                                    )}`}
                                                                                >
                                                                                    <b>
                                                                                        {
                                                                                            seat.seatNo
                                                                                        }
                                                                                    </b>

                                                                                    {Number(
                                                                                        seat.amount ||
                                                                                        0
                                                                                    ) >
                                                                                        0 &&
                                                                                        state !==
                                                                                        'booked' && (
                                                                                            <small>
                                                                                                ₹
                                                                                                {Number(
                                                                                                    seat.amount
                                                                                                )}
                                                                                            </small>
                                                                                        )}
                                                                                </button>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>

                                            <div className="tail">
                                                <span>
                                                    Rear
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {scrollInfo.max >
                                        0 && (
                                            <button
                                                type="button"
                                                className="map-arrow right"
                                                aria-label="Scroll aircraft right"
                                                onClick={() =>
                                                    scrollAircraft(
                                                        1
                                                    )
                                                }
                                            >
                                                ›
                                            </button>
                                        )}
                                </div>
                            </div>

                            {/* LEGEND */}

                            <div className="legend">
                                <span>
                                    <i className="available" />
                                    Available
                                </span>

                                <span>
                                    <i className="selected" />
                                    Selected
                                </span>

                                <span>
                                    <i className="booked" />
                                    Occupied
                                </span>

                                <span>
                                    <i className="premium" />
                                    Extra legroom
                                </span>

                                <span>
                                    <i className="assigned" />
                                    Another passenger
                                </span>
                            </div>
                        </section>

                        {/* DESKTOP SUMMARY */}

                        <aside className="summary card">

                            {flightFare && (
                                <div className="flight-fare">

                                    <div className="flight-route">
                                        <b>
                                            {flightFare.fromCode ||
                                                flightFare.from}
                                        </b>

                                        <span className="route-line" />

                                        <b>
                                            {flightFare.toCode ||
                                                flightFare.to}
                                        </b>
                                    </div>

                                    <div className="flight-meta">
                                        {formatDate(
                                            flightFare.departureDate
                                        )}

                                        {flightFare.cabinClass
                                            ? ` • ${titleCase(
                                                flightFare.cabinClass
                                            )}`
                                            : ''}

                                        {' • '}

                                        {travellerCount}{' '}
                                        traveller
                                        {travellerCount >
                                            1
                                            ? 's'
                                            : ''}
                                    </div>

                                    {(
                                        flightFare.baseFare >
                                        0 ||
                                        flightFare.taxes >
                                        0
                                    ) && (
                                            <div className="flight-fare-breakdown">

                                                {flightFare.baseFare >
                                                    0 && (
                                                        <div>
                                                            <span>
                                                                Base fare
                                                            </span>

                                                            <b>
                                                                {money(
                                                                    flightFare.baseFare
                                                                )}
                                                            </b>
                                                        </div>
                                                    )}

                                                {flightFare.taxes >
                                                    0 && (
                                                        <div>
                                                            <span>
                                                                Taxes & fees
                                                            </span>

                                                            <b>
                                                                {money(
                                                                    flightFare.taxes
                                                                )}
                                                            </b>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                </div>
                            )}

                            <div className="summary-head">
                                <h2>
                                    Seat summary
                                </h2>

                                <small>
                                    {selectedCount} of{' '}
                                    {passengers.length}{' '}
                                    selected on this
                                    sector
                                </small>
                            </div>

                            <div className="summary-body">
                                {passengers.map(
                                    (
                                        passenger,
                                        index
                                    ) => (
                                        <div
                                            className="summary-row"
                                            key={index}
                                        >
                                            <div>
                                                <strong>
                                                    {passengerName(
                                                        passenger,
                                                        index
                                                    )}
                                                </strong>

                                                <small>
                                                    {currentSectorSeats[
                                                        index
                                                    ]
                                                        ? `Seat ${currentSectorSeats[index].seatNo}`
                                                        : 'No seat selected'}
                                                </small>
                                            </div>

                                            <b>
                                                {currentSectorSeats[
                                                    index
                                                ]
                                                    ? money(
                                                        currentSectorSeats[
                                                            index
                                                        ].amount
                                                    )
                                                    : '—'}
                                            </b>
                                        </div>
                                    )
                                )}
                            </div>

                            <div className="total">

                                {flightFare && (
                                    <div>
                                        <span>
                                            Flight fare
                                        </span>

                                        <b>
                                            {money(
                                                flightFare.total
                                            )}
                                        </b>
                                    </div>
                                )}

                                <div>
                                    <span>
                                        Seat charges
                                    </span>

                                    <b>
                                        {money(
                                            seatTotal
                                        )}
                                    </b>
                                </div>

                                <div>
                                    <span>
                                        Selected seats
                                    </span>

                                    <b>
                                        {totalSelectedCount}
                                    </b>
                                </div>

                                <div className="grand">
                                    <span>
                                        Total amount
                                    </span>

                                    <b>
                                        {money(
                                            grandTotal
                                        )}
                                    </b>
                                </div>
                            </div>


                            {isReviewed ? <div className="action">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={
                                        saveAndContinue
                                    }
                                >
                                    {saving
                                        ? 'Saving...'
                                        : 'Continue to Pay'}
                                </button>
                            </div>
                                :
                                <div className="action">
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={
                                            handleReviewFlight
                                        }
                                    >
                                        {saving
                                            ? 'Saving...'
                                            : 'Review Your Booking'}
                                    </button>
                                </div>}
                        </aside>
                    </div>
                </div>

                {/* MOBILE FOOTER */}

                <div className="mobile-bar">
                    <div>
                        <small>
                            {totalSelectedCount}{' '}
                            seat
                            {totalSelectedCount !==
                                1
                                ? 's'
                                : ''}{' '}
                            selected
                        </small>

                        <strong>
                            {money(grandTotal)}
                        </strong>
                    </div>

                    <button
                        type="button"
                        disabled={saving}
                        onClick={
                            saveAndContinue
                        }
                    >
                        {saving
                            ? 'Saving...'
                            : 'Continue'}
                    </button>
                </div>
            </main>

            <style jsx>
                {styles}
            </style>
        </>
    );
}

/* =========================================================
   STYLES
========================================================= */

const styles = `
* {
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #0f172a;
  padding: 28px 16px 70px;
}

.container {
  width: min(1250px, 100%);
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.eyebrow {
  font-size: 12px;
  font-weight: 750;
  color: #64748b;
}

.header h1 {
  margin: 5px 0 0;
  font-size: clamp(24px, 4vw, 32px);
  line-height: 1.15;
  font-weight: 850;
}

.header p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

/* TABS */

.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 5px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  flex: 0 0 auto;
  border: 0;
  border-radius: 10px;
  padding: 10px 16px;
  background: #f1f5f9;
  color: #334155;
  font-weight: 750;
  cursor: pointer;
  white-space: nowrap;
}

.tab.active {
  background: #111827;
  color: #fff;
}

/* LAYOUT */

.layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    330px;
  gap: 20px;
  align-items: start;
}

.main {
  min-width: 0;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
}

/* PASSENGERS */

.passengers-card {
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 850;
  margin-bottom: 12px;
}

.passengers {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.passengers::-webkit-scrollbar {
  display: none;
}

.passenger {
  flex: 0 0 160px;
  text-align: left;
  padding: 11px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
}

.passenger.active {
  border: 2px solid #111827;
  background: #f8fafc;
  padding: 10px 11px;
}

.passenger small,
.passenger strong,
.passenger span {
  display: block;
}

.passenger small {
  font-size: 11px;
  color: #64748b;
  font-weight: 750;
}

.passenger strong {
  margin-top: 3px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.passenger span {
  margin-top: 5px;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
}

.passenger.active span {
  color: #166534;
}

/* AIRCRAFT CARD */

.aircraft-card {
  padding: 0 0 20px;
  overflow: hidden;
}

.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #eef2f7;
}

.map-header strong,
.map-header span {
  display: block;
}

.map-header strong {
  font-size: 14px;
  font-weight: 850;
}

.map-header span {
  margin-top: 3px;
  color: #64748b;
  font-size: 11px;
}

.scroll-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
}

.scroll-hint button {
  width: 30px;
  height: 30px;
  border: 1px solid #dbe3ec;
  background: #fff;
  border-radius: 50%;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: #334155;
}

.scroll-hint span {
  margin: 0;
  font-size: 10px;
  color: #94a3b8;
  font-weight: 750;
}

/* MINI AIRCRAFT */

.aircraft-overview-wrap {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 10px 14px 12px;
  background: rgba(
    251,
    252,
    254,
    .96
  );
  border-bottom: 1px solid #eef2f7;
  backdrop-filter: blur(8px);
}

.overview-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 3px 5px;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.aircraft-overview {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  padding: 5px 12px;
  border: 1px solid #dbe3ec;
  border-radius: 999px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  box-shadow:
    inset 0 1px 3px
    rgba(15, 23, 42, .04);
}

.mini-nose {
  width: 13%;
  height: 36px;
  border-radius:
    50% 0 0 50%;
  background: #eef2f7;
  border-right: 1px solid #d7dee7;
  flex: 0 0 auto;
}

.mini-cabin {
  height: 36px;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px 6px;
  overflow: hidden;
  background: #f8fafc;
}

.mini-row {
  height: 26px;
  min-width: 5px;
  flex: 1;
  display: grid;
  grid-template-rows:
    repeat(6, 1fr);
  gap: 1px;
}

.mini-row i {
  display: block;
  border-radius: 1px;
  background: #cbd5e1;
}

.mini-row i:nth-child(3) {
  margin-bottom: 2px;
}

.mini-row-alt i {
  background: #b8c3d1;
}

.mini-tail {
  width: 10%;
  height: 36px;
  border-radius:
    0 50% 50% 0;
  background: #eef2f7;
  border-left: 1px solid #d7dee7;
  flex: 0 0 auto;
}

.overview-viewport {
  position: absolute;
  top: 2px;
  bottom: 2px;
  border: 2px solid #111827;
  border-radius: 999px;
  background:
    rgba(249, 115, 22, .15);
  box-shadow:
    0 0 0 1px #fff;
  pointer-events: none;
  transition:
    left .08s linear,
    width .08s linear;
}

.overview-note {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  color: #94a3b8;
  font-size: 9px;
}

.overview-note b {
  color: #475569;
  font-weight: 800;
  white-space: nowrap;
}

/* AIRCRAFT SCROLL */

.aircraft-scroll-shell {
  position: relative;
  background:
    linear-gradient(
      180deg,
      #fbfcfe,
      #fff
    );
}

.aircraft-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  padding: 30px 58px 32px;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  overscroll-behavior-x: contain;
  scrollbar-color:
    #9aa5b1
    #edf1f5;
  scrollbar-width: auto;
}

.aircraft-scroll::-webkit-scrollbar {
  height: 11px;
}

.aircraft-scroll::-webkit-scrollbar-track {
  background: #edf1f5;
  border-radius: 20px;
}

.aircraft-scroll::-webkit-scrollbar-thumb {
  background: #8f9aa6;
  border-radius: 20px;
  border: 2px solid #edf1f5;
}

/* AIRCRAFT */

.aircraft {
  position: relative;
  width: max-content;
  min-width: 620px;
  margin: 0 auto;
  display: flex;
  align-items: stretch;
}

.aircraft-shape {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #f4f7fb 45%,
      #e8edf3 100%
    );
  border: 1px solid #d7dee7;
  box-shadow:
    inset 0 1px 0
    rgba(255, 255, 255, .7);

  clip-path: polygon(
    0% 50%,
    1.5% 28%,
    3% 14%,
    5.5% 6%,
    8% 2%,
    92% 2%,
    94.5% 6%,
    97% 14%,
    98.5% 28%,
    100% 50%,
    98.5% 72%,
    97% 86%,
    94.5% 94%,
    92% 98%,
    8% 98%,
    5.5% 94%,
    3% 86%,
    1.5% 72%
  );
}

.wing,
.tail-wing,
.tail-fin {
  position: absolute;
  z-index: 1;
  background:
    linear-gradient(
      180deg,
      #eef2f7,
      #dbe3ec
    );
  border: 1px solid #c7d0dc;
  pointer-events: none;
}

.wing {
  width: 46px;
  height: 24px;
  left: 38%;
  clip-path: polygon(
    8% 100%,
    100% 75%,
    88% 15%,
    0% 45%
  );
}

.wing-top {
  top: -17px;
  transform:
    translateX(-50%);
}

.wing-bottom {
  bottom: -17px;
  transform:
    translateX(-50%)
    scaleY(-1);
}

.tail-wing {
  width: 20px;
  height: 12px;
  left: 91%;
  clip-path: polygon(
    10% 100%,
    100% 70%,
    85% 15%,
    0% 45%
  );
}

.tail-wing-top {
  top: -8px;
  transform:
    translateX(-50%);
}

.tail-wing-bottom {
  bottom: -8px;
  transform:
    translateX(-50%)
    scaleY(-1);
}

.tail-fin {
  left: 96%;
  top: -12px;
  width: 12px;
  height: 16px;
  background:
    linear-gradient(
      180deg,
      #dbe3ec,
      #c7d0dc
    );
  clip-path: polygon(
    0% 100%,
    100% 100%,
    60% 0%
  );
  transform:
    translateX(-50%);
}

/* NOSE / TAIL */

.nose,
.tail {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.nose {
  width: 92px;
}

.tail {
  width: 78px;
}

.nose small,
.tail small {
  font-size: 20px;
  color: #cbd5e1;
}

/* CABIN */

.cabin {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 0 0 auto;
  padding: 14px 10px 17px;
}

.cabin-top-label {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 54px;
  margin-left: 35px;
  margin-bottom: 8px;
}

.cabin-top-label span {
  text-align: center;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
}

/* SEAT GRID */

.seat-grid {
  display: flex;
  align-items: center;
  min-width: max-content;
}

.seat-label-column {
  width: 35px;
  min-width: 35px;
  display: grid;
  grid-template-rows:
    repeat(6, 40px);
  gap: 7px;
  align-items: center;
  justify-items: center;
}

.seat-label-column span {
  color: #64748b;
  font-size: 10px;
  font-weight: 850;
}

.seat-column {
  width: 54px;
  min-width: 54px;
  display: grid;
  grid-template-rows:
    repeat(6, 40px);
  gap: 7px;
  justify-items: center;
}

.seat-column > *:nth-child(3),
.seat-label-column > *:nth-child(3) {
  margin-bottom: 16px;
}

.empty-seat {
  width: 46px;
  height: 40px;
}

.seat {
  width: 46px;
  height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px;
  -webkit-tap-highlight-color:
    transparent;

  transition:
    transform .12s,
    box-shadow .12s,
    background .12s;
}

.seat:active {
  transform: scale(.94);
}

.seat:hover:not(:disabled) {
  box-shadow:
    0 4px 10px
    rgba(15, 23, 42, .08);

  transform:
    translateY(-1px);
}

.seat b {
  font-size: 9px;
  line-height: 1;
}

.seat small {
  margin-top: 2px;
  font-size: 7px;
  line-height: 1;
  font-weight: 800;
}

.seat.selected {
  background: #111827;
  border-color: #111827;
  color: #fff;

  box-shadow:
    0 4px 12px
    rgba(0, 0, 0, .13);
}

.seat.booked {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
  opacity: .65;
}

.seat.assigned {
  background: #dbeafe;
  border-color: #60a5fa;
  color: #1d4ed8;
  cursor: not-allowed;
}

.seat.premium.available {
  background: #fff7ed;
  border-color: #fdba74;
  color: #9a3412;
}

/* MAP ARROWS */

.map-arrow {
  position: absolute;
  z-index: 5;
  top: 50%;
  transform:
    translateY(-50%);

  width: 38px;
  height: 38px;

  border-radius: 50%;
  border: 1px solid #2563eb;
  background: #fff;
  color: #2563eb;

  font-size: 27px;
  line-height: 1;
  cursor: pointer;

  box-shadow:
    0 3px 10px
    rgba(15, 23, 42, .08);
}

.map-arrow.left {
  left: 10px;
}

.map-arrow.right {
  right: 10px;
}

/* LEGEND */

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding: 14px 4px 0;
}

.legend span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #475569;
  font-weight: 650;
}

.legend i {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  border: 1px solid;
  display: inline-block;
}

.legend .available {
  background: #fff;
  border-color: #cbd5e1;
}

.legend .selected {
  background: #111827;
  border-color: #111827;
}

.legend .booked {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.legend .premium {
  background: #fff7ed;
  border-color: #fdba74;
}

.legend .assigned {
  background: #dbeafe;
  border-color: #60a5fa;
}

/* SUMMARY */

.summary {
  position: sticky;
  top: 18px;
  overflow: hidden;
}

.flight-fare {
  padding: 16px 18px;
  border-bottom:
    1px solid #e5e7eb;
}

.flight-route {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flight-route b {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: .02em;
}

.route-line {
  flex: 1;
  height: 1px;
  position: relative;

  background:
    repeating-linear-gradient(
      90deg,
      #cbd5e1 0 4px,
      transparent 4px 8px
    );
}

.route-line::after {
  content: '✈';
  position: absolute;
  top: -8px;
  left: 50%;

  transform:
    translateX(-50%);

  font-size: 11px;
  color: #94a3b8;
}

.flight-meta {
  margin-top: 6px;
  font-size: 11px;
  color: #64748b;
  font-weight: 650;
}

.flight-fare-breakdown {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.flight-fare-breakdown div {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
}

.flight-fare-breakdown b {
  color: #0f172a;
  font-weight: 750;
}

.summary-head {
  padding: 17px 18px;
  border-bottom:
    1px solid #e5e7eb;
}

.summary-head h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 850;
}

.summary-head small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 11px;
}

.summary-body {
  padding: 10px 18px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 0;
  border-bottom:
    1px solid #f1f5f9;
}

.summary-row strong,
.summary-row small {
  display: block;
}

.summary-row strong {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-row small {
  margin-top: 3px;
  color: #94a3b8;
  font-size: 10px;
}

.summary-row b {
  font-size: 12px;
  white-space: nowrap;
}

.total {
  padding: 15px 18px;
  background: #f8fafc;
  border-top:
    1px solid #e5e7eb;
}

.total > div {
  display: flex;
  justify-content: space-between;
  color: #64748b;
  font-size: 12px;
  margin-bottom: 4px;
}

.total b {
  color: #0f172a;
}

.total .grand {
  margin-top: 9px;
  margin-bottom: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 900;
}

.action {
  padding: 15px 18px 18px;
}

.action button,
.mobile-bar button {
  width: 100%;
  border: 0;
  border-radius: 12px;
  background: #111827;
  color: #fff;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 850;
  cursor: pointer;
}

.action button:disabled,
.mobile-bar button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

/* MOBILE BAR */

.mobile-bar {
  display: none;
}

/* LOADING */

.loading-page {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-card {
  width: min(
    390px,
    100%
  );

  padding: 38px 28px;

  border-radius: 18px;

  background: #fff;

  border:
    1px solid #e5e7eb;

  text-align: center;
}

.loading-card h2 {
  margin: 0;
  font-size: 20px;
}

.loading-card p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;

  border:
    4px solid #e5e7eb;

  border-top-color:
    #111827;

  border-radius: 50%;

  animation:
    spin .8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* TABLET */

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .summary {
    position: static;
  }
}

/* MOBILE */

@media (max-width: 640px) {
  .page {
    padding:
      16px 10px 96px;
  }

  .header {
    margin-bottom: 14px;
  }

  .header h1 {
    font-size: 24px;
  }

  .header p {
    font-size: 12px;
  }

  .passengers-card {
    padding: 12px;
    border-radius: 14px;
  }

  .passenger {
    flex-basis: 145px;
    padding: 10px;
  }

  .passenger.active {
    padding: 9px;
  }

  .aircraft-card {
    border-radius: 14px;
    padding-bottom: 14px;
  }

  .map-header {
    padding:
      13px 12px 10px;
  }

  .map-header strong {
    font-size: 13px;
  }

  .map-header span {
    font-size: 10px;
  }

  .scroll-hint span {
    display: none;
  }

  .scroll-hint button {
    width: 28px;
    height: 28px;
  }

  .aircraft-overview-wrap {
    padding:
      9px 10px 10px;
  }

  .aircraft-overview {
    height: 43px;
    padding: 4px 9px;
  }

  .mini-nose,
  .mini-tail {
    height: 33px;
  }

  .mini-cabin {
    height: 33px;
  }

  .overview-note {
    font-size: 8px;
  }

  /*
    Aircraft intentionally stays wider than
    screen. User can horizontally scroll.
  */
  .aircraft-scroll {
    padding:
      26px 50px 28px;
  }

  .wing {
    width: 36px;
    height: 19px;
  }

  .wing-top {
    top: -13px;
  }

  .wing-bottom {
    bottom: -13px;
  }

  .tail-wing {
    width: 16px;
    height: 10px;
  }

  .tail-fin {
    width: 10px;
    height: 13px;
    top: -9px;
  }

  .nose,
  .tail {
    min-width: 46px;
    font-size: 8px;
  }

  .nose small,
  .tail small {
    font-size: 16px;
  }

  .map-arrow {
    width: 34px;
    height: 34px;
    font-size: 24px;
  }

  .map-arrow.left {
    left: 7px;
  }

  .map-arrow.right {
    right: 7px;
  }

  .legend {
    gap: 8px 12px;
  }

  .legend span {
    font-size: 10px;
  }

  .summary {
    display: none;
  }

  .mobile-bar {
    position: fixed;
    z-index: 50;

    left: 0;
    right: 0;
    bottom: 0;

    display: flex;
    align-items: center;
    gap: 12px;

    padding:
      10px 12px
      calc(
        10px +
        env(safe-area-inset-bottom)
      );

    background:
      rgba(
        255,
        255,
        255,
        .97
      );

    border-top:
      1px solid #e2e8f0;

    box-shadow:
      0 -5px 20px
      rgba(
        15,
        23,
        42,
        .08
      );

    backdrop-filter:
      blur(10px);
  }

  .mobile-bar > div {
    min-width: 0;
    flex: 1;
  }

  .mobile-bar small,
  .mobile-bar strong {
    display: block;
  }

  .mobile-bar small {
    color: #64748b;
    font-size: 10px;
  }

  .mobile-bar strong {
    margin-top: 2px;
    font-size: 15px;
    font-weight: 900;
  }

  .mobile-bar button {
    width: auto;
    min-width: 132px;
    padding: 12px 15px;
  }
}

/* VERY SMALL MOBILE */

@media (max-width: 380px) {
  .page {
    padding-left: 8px;
    padding-right: 8px;
  }

  .aircraft-scroll {
    padding-left: 44px;
    padding-right: 44px;
  }

  .mobile-bar button {
    min-width: 112px;
  }

  .overview-note b {
    display: none;
  }
}

/* TOUCH DEVICES */

@media (hover: none) {
  .seat:hover:not(:disabled) {
    transform: none;
    box-shadow: none;
  }
}
`;