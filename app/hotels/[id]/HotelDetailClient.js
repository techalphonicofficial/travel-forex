'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getStoredAuth, submitHotelInquiry } from '@/utils/api';

const fallbackImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const getImages = (hotel) => {
  const gallery = Array.isArray(hotel?.gallery) ? hotel.gallery : [];
  const images = [
    hotel?.image_url ? { id: 'main', url: hotel.image_url, alt_text: hotel.name } : null,
    ...gallery,
  ].filter(Boolean);

  return images.length ? images : [{ id: 'fallback', url: fallbackImage, alt_text: 'Hotel image' }];
};

const getDiscountedPrice = (hotel) => {
  const price = Number(hotel?.price_per_night) || 0;
  const discount = Number(hotel?.discount_percent) || 0;
  return discount > 0 ? Math.max(price - (price * discount) / 100, 0) : price;
};

function GoldStars({ rating, label }) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <span className="gold-stars" aria-label={label || `${safeRating} star rating`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < safeRating ? 'is-filled' : ''}>★</span>
      ))}
    </span>
  );
}

const getLoggedInUserId = () => {
  const auth = getStoredAuth();
  return (
    auth?.user_id ||
    auth?.id ||
    auth?.uuid ||
    auth?.customer_id ||
    auth?.customerId ||
    auth?.user?.user_id ||
    auth?.user?.id ||
    auth?.customer?.id ||
    ''
  );
};

export default function HotelDetailClient({ hotel: initialHotel, hotelId, city, country }) {
  const [hotel] = useState(() => {
    if (initialHotel || typeof window === 'undefined') return initialHotel;

    try {
      const stored = sessionStorage.getItem(`hotel:${hotelId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [form, setForm] = useState({ room_count: 1, notes: '' });
  const [rooms, setRooms] = useState([{ adults: 2, children: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const images = useMemo(() => getImages(hotel), [hotel]);
  const discountedPrice = getDiscountedPrice(hotel);
  const location = [hotel?.destination?.name || city, hotel?.destination?.country || country].filter(Boolean).join(', ');
  const totalGuests = rooms.reduce((total, room) => total + Number(room.adults || 0) + Number(room.children || 0), 0);

  const syncRooms = (nextRooms) => {
    const nextCount = nextRooms.length;
    setForm((current) => ({ ...current, room_count: nextCount }));
    setRooms(nextRooms);
  };

  const addRoom = () => {
    if (rooms.length >= 8) return;
    syncRooms([...rooms, { adults: 2, children: 0 }]);
  };

  const removeRoom = (index) => {
    if (rooms.length <= 1) return;
    syncRooms(rooms.filter((_, roomIndex) => roomIndex !== index));
  };

  const updateRoom = (index, key, value) => {
    const minValue = key === 'adults' ? 1 : 0;
    const nextValue = Math.max(minValue, Math.min(8, Number(value) || minValue));
    setRooms((current) => current.map((room, roomIndex) => (
      roomIndex === index ? { ...room, [key]: nextValue } : room
    )));
  };

  const stepRoomGuest = (index, key, delta) => {
    const currentValue = Number(rooms[index]?.[key]) || 0;
    updateRoom(index, key, currentValue + delta);
  };

  const submitInquiry = async (event) => {
    event.preventDefault();
    const userId = getLoggedInUserId();

    if (!userId) {
      setLoginPromptOpen(true);
      return;
    }

    setSubmitting(true);
    setMessage('');

    const payload = {
      user_id: userId,
      hotel_id: Number(hotel?.id || hotelId),
      room_count: Number(form.room_count) || rooms.length,
      rooms,
      notes: form.notes.trim(),
    };

    const result = await submitHotelInquiry(payload);
    setSubmitting(false);
    setMessage(result?.success ? result.message || 'Hotel booking submitted successfully.' : result?.message || 'Unable to submit inquiry right now.');
  };

  if (!hotel) {
    return (
      <main className="hotel-detail-page">
        <div className="hotel-detail-container hotel-detail-empty">
          <h1>Hotel unavailable</h1>
          <p>We could not load this hotel right now.</p>
          <Link href={`/hotels?country=${encodeURIComponent(country || 'india')}&city=${encodeURIComponent(city || 'Goa')}`}>Back to hotels</Link>
        </div>
        <HotelDetailStyles />
      </main>
    );
  }

  return (
    <main className="hotel-detail-page">
      <section className="hotel-detail-container hotel-detail-hero">
        <div>
          <Link href={`/hotels?country=${encodeURIComponent(country || '')}&city=${encodeURIComponent(city || '')}`}>Back to hotel results</Link>
          <h1>{hotel.name}</h1>
          <p>{location}</p>
          <div className="hotel-detail-meta">
            <span className="hotel-star-meta"><GoldStars rating={hotel.star_rating} /> {hotel.star_rating}-star</span>
            <span>{Number(hotel.guest_rating || 0).toFixed(1)} guest rating</span>
            <span>{hotel.provider_name || 'Hotel partner'}</span>
          </div>
        </div>
      </section>

      <section className="hotel-detail-container hotel-detail-gallery">
        <div className="hotel-detail-main-image">
          <Image src={images[0]?.url || fallbackImage} alt={images[0]?.alt_text || hotel.name} width={820} height={520} priority />
        </div>
        {images.slice(1, 5).map((image) => (
          <Image key={image.id || image.url} src={image.url} alt={image.alt_text || hotel.name} width={360} height={250} />
        ))}
      </section>

      <section className="hotel-detail-container hotel-detail-layout">
        <div className="hotel-detail-content">
          <section className="hotel-detail-card">
            <h2>About this hotel</h2>
            <p>{hotel.description}</p>
            <div className="hotel-detail-facts">
              <div><strong>{hotel.total_rooms}</strong><span>Total rooms</span></div>
              <div><strong>{formatMoney(discountedPrice)}</strong><span>Per night</span></div>
              <div><strong>{Number(hotel.discount_percent || 0).toFixed(0)}%</strong><span>Discount</span></div>
            </div>
          </section>

          <section className="hotel-detail-card">
            <h2>Amenities</h2>
            <div className="hotel-detail-amenities">
              {(hotel.amenities || []).map((amenity) => <span key={amenity}>{amenity}</span>)}
            </div>
          </section>
        </div>

        <aside className="hotel-inquiry-card">
          <div className="hotel-inquiry-price">
            <span>Starts from</span>
            <strong>{formatMoney(discountedPrice)}</strong>
            <p>per room, per night</p>
            <div className="hotel-inquiry-summary">
              <span>{rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}</span>
              <span>{totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}</span>
            </div>
          </div>
          <form onSubmit={submitInquiry}>
            <div className="hotel-room-toolbar">
              <div>
                <strong>Rooms and guests</strong>
                <span>Customize occupancy for this inquiry</span>
              </div>
              <button type="button" className="hotel-add-room" onClick={addRoom} disabled={rooms.length >= 8}>
                + Add room
              </button>
            </div>
            <div className="hotel-room-list">
              {rooms.map((room, index) => (
                <div className="hotel-room-row" key={index}>
                  <div className="hotel-room-title">
                    <strong>Room {index + 1}</strong>
                    {rooms.length > 1 ? (
                      <button type="button" onClick={() => removeRoom(index)} aria-label={`Remove room ${index + 1}`}>Remove</button>
                    ) : null}
                  </div>
                  <div className="hotel-guest-stepper">
                    <div>
                      <strong>Adults</strong>
                      <span>Age 12+</span>
                    </div>
                    <div className="hotel-stepper-controls">
                      <button type="button" onClick={() => stepRoomGuest(index, 'adults', -1)} disabled={room.adults <= 1} aria-label={`Decrease adults in room ${index + 1}`}>−</button>
                      <output>{room.adults}</output>
                      <button type="button" onClick={() => stepRoomGuest(index, 'adults', 1)} aria-label={`Increase adults in room ${index + 1}`}>+</button>
                    </div>
                  </div>
                  <div className="hotel-guest-stepper">
                    <div>
                      <strong>Children</strong>
                      <span>Age 0-11</span>
                    </div>
                    <div className="hotel-stepper-controls">
                      <button type="button" onClick={() => stepRoomGuest(index, 'children', -1)} disabled={room.children <= 0} aria-label={`Decrease children in room ${index + 1}`}>−</button>
                      <output>{room.children}</output>
                      <button type="button" onClick={() => stepRoomGuest(index, 'children', 1)} aria-label={`Increase children in room ${index + 1}`}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <label>
              Notes
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Special requests, dates, meal plan, room category..." />
            </label>
            <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Send Inquiry'}</button>
            {message ? <p className="hotel-inquiry-message">{message}</p> : null}
          </form>
        </aside>
      </section>
      {loginPromptOpen ? (
        <div className="hotel-login-modal" role="dialog" aria-modal="true" aria-labelledby="hotel-login-title">
          <div className="hotel-login-panel">
            <button
              type="button"
              className="hotel-login-close"
              onClick={() => setLoginPromptOpen(false)}
              aria-label="Close login prompt"
            >
              ×
            </button>
            <h2 id="hotel-login-title">Login required</h2>
            <p>Please login to send this hotel inquiry. We will bring you back to this hotel after login.</p>
            <div className="hotel-login-actions">
              <button type="button" onClick={() => setLoginPromptOpen(false)}>Not now</button>
              <Link href={`/auth/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/hotels')}`}>
                Login to continue
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <HotelDetailStyles />
    </main>
  );
}

function HotelDetailStyles() {
  return (
    <style jsx global>{`
      .hotel-detail-page { min-height: 100vh; padding: 118px 0 72px; background: #f5f7fa; color: #172033; }
      .hotel-detail-container { width: min(100%, 1160px); margin: 0 auto; padding: 0 22px; }
      .hotel-detail-hero { padding-bottom: 22px; }
      .hotel-detail-hero a, .hotel-detail-empty a { color: var(--color-primary); font-size: 13px; font-weight: 900; text-decoration: none; }
      .hotel-detail-hero h1 { margin: 12px 0 6px; font-family: var(--font-poppins), Poppins, sans-serif; font-size: clamp(32px, 5vw, 48px); font-weight: 900; }
      .hotel-detail-hero p { margin: 0; color: #64748b; font-weight: 800; }
      .hotel-detail-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
      .hotel-detail-meta > span { padding: 7px 10px; border: 1px solid #dde5ef; border-radius: 999px; background: #fff; color: #334155; font-size: 12px; font-weight: 900; }
      .hotel-star-meta { display: inline-flex; align-items: center; gap: 7px; }
      .gold-stars { display: inline-flex; align-items: center; gap: 1px; color: #d7dde6; font-size: 14px; line-height: 1; letter-spacing: 0; }
      .gold-stars .is-filled { color: #f6b51e; text-shadow: 0 1px 0 rgba(120, 74, 0, .12); }
      .hotel-detail-gallery { display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 170px 170px; gap: 8px; overflow: hidden; border-radius: 8px; }
      .hotel-detail-gallery img { width: 100%; height: 100%; object-fit: cover; background: #e2e8f0; }
      .hotel-detail-main-image { grid-row: span 2; }
      .hotel-detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start; margin-top: 24px; }
      .hotel-detail-content { display: grid; gap: 18px; }
      .hotel-detail-card, .hotel-inquiry-card, .hotel-detail-empty { border: 1px solid #e1e7ef; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, .05); }
      .hotel-detail-card { padding: 24px; }
      .hotel-detail-card h2 { margin: 0 0 14px; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 22px; font-weight: 900; }
      .hotel-detail-card p { margin: 0; color: #475569; line-height: 1.75; }
      .hotel-detail-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
      .hotel-detail-facts div { padding: 14px; border: 1px solid #edf1f5; border-radius: 8px; background: #f8fafc; }
      .hotel-detail-facts strong { display: block; font-size: 20px; font-weight: 900; color: #0f172a; }
      .hotel-detail-facts span { color: #64748b; font-size: 12px; font-weight: 800; }
      .hotel-detail-amenities { display: flex; flex-wrap: wrap; gap: 10px; }
      .hotel-detail-amenities span { padding: 8px 10px; border-radius: 999px; background: #edf7ff; color: #075985; font-size: 12px; font-weight: 900; }
      .hotel-inquiry-card { position: sticky; top: 92px; padding: 20px; overflow: hidden; border-color: color-mix(in srgb, var(--color-primary) 18%, #e1e7ef); }
      .hotel-inquiry-card::before { content: ''; position: absolute; inset: 0 0 auto; height: 4px; background: var(--gradient-primary); }
      .hotel-inquiry-price { padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid #edf1f5; }
      .hotel-inquiry-card span, .hotel-inquiry-card p { color: #64748b; font-size: 12px; font-weight: 800; }
      .hotel-inquiry-price > strong { display: block; color: #111827; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 30px; font-weight: 900; line-height: 1.08; }
      .hotel-inquiry-summary { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
      .hotel-inquiry-summary span { padding: 6px 9px; border-radius: 999px; background: #f1f7ff; color: #075985; font-size: 11px; font-weight: 900; }
      .hotel-inquiry-card form { display: grid; gap: 13px; }
      .hotel-inquiry-card label { display: grid; gap: 6px; color: #334155; font-size: 12px; font-weight: 900; }
      .hotel-inquiry-card input, .hotel-inquiry-card textarea { width: 100%; border: 1px solid #dbe3ed; border-radius: 8px; padding: 10px 12px; font: inherit; font-size: 13px; outline: none; }
      .hotel-inquiry-card textarea { min-height: 92px; resize: vertical; }
      .hotel-inquiry-card > form > button[type="submit"] { border-radius: 8px; padding: 13px 16px; background: var(--color-primary); color: #fff; font-weight: 900; }
      .hotel-inquiry-card button:disabled { opacity: .55; cursor: not-allowed; }
      .hotel-room-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .hotel-room-toolbar strong { display: block; color: #111827; font-size: 14px; font-weight: 900; }
      .hotel-room-toolbar span { display: block; margin-top: 2px; color: #64748b; font-size: 11px; font-weight: 800; }
      .hotel-add-room { flex: 0 0 auto; border: 1px solid color-mix(in srgb, var(--color-primary) 35%, #dbe3ed); border-radius: 999px; padding: 8px 11px; background: #fff; color: var(--color-primary); font-size: 12px; font-weight: 900; }
      .hotel-room-list { display: grid; gap: 10px; }
      .hotel-room-row { display: grid; gap: 11px; padding: 13px; border: 1px solid #dfe7f0; border-radius: 8px; background: linear-gradient(180deg, #fff 0%, #f8fbff 100%); box-shadow: 0 8px 20px rgba(15, 23, 42, .04); }
      .hotel-room-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .hotel-room-title strong { color: #111827; font-size: 14px; font-weight: 900; }
      .hotel-room-title button { border: 0; background: transparent; color: #dc2626; font-size: 11px; font-weight: 900; }
      .hotel-guest-stepper { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .hotel-guest-stepper > div:first-child strong { display: block; color: #334155; font-size: 13px; font-weight: 900; }
      .hotel-guest-stepper > div:first-child span { color: #94a3b8; font-size: 11px; font-weight: 800; }
      .hotel-stepper-controls { display: inline-grid; grid-template-columns: 32px 34px 32px; align-items: center; border: 1px solid #dbe3ed; border-radius: 999px; background: #fff; overflow: hidden; }
      .hotel-stepper-controls button { width: 32px; height: 32px; display: grid; place-items: center; background: transparent; color: var(--color-primary); font-size: 18px; font-weight: 900; line-height: 1; }
      .hotel-stepper-controls output { color: #0f172a; text-align: center; font-size: 13px; font-weight: 900; }
      .hotel-inquiry-message { margin: 0; color: var(--color-primary); font-size: 13px; font-weight: 900; }
      .hotel-login-modal { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 20px; background: rgba(15, 23, 42, .55); backdrop-filter: blur(8px); }
      .hotel-login-panel { position: relative; width: min(100%, 420px); border: 1px solid #e1e7ef; border-radius: 10px; background: #fff; padding: 26px; box-shadow: 0 28px 80px rgba(15, 23, 42, .28); }
      .hotel-login-close { position: absolute; right: 14px; top: 12px; width: 34px; height: 34px; border-radius: 50%; background: #f1f5f9; color: #334155; font-size: 22px; font-weight: 800; }
      .hotel-login-panel h2 { margin: 0 0 8px; color: #111827; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 24px; font-weight: 900; }
      .hotel-login-panel p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.65; font-weight: 600; }
      .hotel-login-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
      .hotel-login-actions button, .hotel-login-actions a { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; border-radius: 8px; padding: 0 14px; font-size: 13px; font-weight: 900; text-decoration: none; }
      .hotel-login-actions button { border: 1px solid #dbe3ed; background: #fff; color: #475569; }
      .hotel-login-actions a { background: var(--color-primary); color: #fff; }
      .hotel-detail-empty { margin-top: 40px; padding: 40px; text-align: center; }
      @media (max-width: 900px) {
        .hotel-detail-gallery { grid-template-columns: 1fr 1fr; grid-template-rows: 260px 150px 150px; }
        .hotel-detail-main-image { grid-column: span 2; grid-row: auto; }
        .hotel-detail-layout { grid-template-columns: 1fr; }
        .hotel-inquiry-card { position: static; }
      }
      @media (max-width: 640px) {
        .hotel-detail-gallery { display: block; }
        .hotel-detail-gallery img { height: 220px; margin-bottom: 8px; border-radius: 8px; }
        .hotel-detail-facts { grid-template-columns: 1fr; }
        .hotel-room-toolbar { align-items: flex-start; flex-direction: column; }
      }
    `}</style>
  );
}
