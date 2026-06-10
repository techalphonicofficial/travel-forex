'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createPackageBooking, createRazorpayOrder, getMediaUrl, getPackageBySlug, getPackageReviews, getPartialBookingSettings, getStoredAuth, getStoredToken, validateBookingCoupon, verifyRazorpayPayment } from '@/utils/api';

const DEFAULT_PACKAGE_SLUGS = {
  paris: 'paris-honeymoon-special-6n7d',
  bangkok: 'bangkok-explorer-5n6d',
  thailand: 'bangkok-explorer-5n6d',
};

const PACKAGE_SLUG_ALIASES = {
  'package-25': 'bangkok-explorer-5n6d',
};

const fallbackImage = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80';

const titleCase = (value) =>
  String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getPackageSlug = (destination, packageSlug) => {
  const requestedSlug = packageSlug || DEFAULT_PACKAGE_SLUGS[String(destination || '').toLowerCase()] || destination;
  return PACKAGE_SLUG_ALIASES[requestedSlug] || requestedSlug;
};

const sortByOrder = (items) =>
  [...(items || [])].sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0));

const getActivityEntries = (activities) =>
  Object.entries(activities || {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([day, activityList]) => ({
      day: Number(day),
      activities: Array.isArray(activityList) ? activityList : [],
    }));

const getRenderableActivityEntries = (activities, maxDays) => {
  const limit = Number(maxDays) || Infinity;
  return getActivityEntries(activities)
    .filter((entry) => entry.day <= limit)
    .filter((entry, index, list) => entry.activities.length || index < limit || list.length === 1);
};

const getActivityImages = (pkg) =>
  sortByOrder(pkg?.destinations).flatMap((destinationItem) =>
    getActivityEntries(destinationItem?.activities).flatMap((entry) =>
      entry.activities
        .map((activity) => ({
          id: activity.id || activity.image,
          type: 'image',
          url: getMediaUrl(activity.image),
          alt: activity.name || 'Activity image',
        }))
        .filter((item) => item.url)
    )
  );

const getPackageMedia = (pkg) => {
  const galleryItems = (pkg?.gallery || []).map((item) => ({
    id: item.id || item.url,
    type: item.media_type === 'video' || /\.(mp4|webm|ogg)$/i.test(item.url || '') ? 'video' : 'image',
    url: getMediaUrl(item.url || item.image || item.path),
    poster: getMediaUrl(item.poster_url),
    alt: item.alt_text || item.label || pkg?.name || 'Package media',
  })).filter((item) => item.url);

  const imageItems = [
    {
      id: 'main-image',
      type: 'image',
      url: getMediaUrl(pkg?.main_image),
      alt: pkg?.main_image_alt || pkg?.name || 'Package image',
    },
    ...sortByOrder(pkg?.destinations).map((item) => ({
      id: `destination-${item?.id || item?.destination?.slug}`,
      type: 'image',
      url: getMediaUrl(item?.destination?.feature_image),
      alt: item?.destination?.feature_image_alt || item?.destination?.name || 'Destination image',
    })),
    ...getActivityImages(pkg),
    ...galleryItems.filter((item) => item.type === 'image'),
  ].filter((item) => item.url);

  const uniqueImages = imageItems.filter((item, index, list) => (
    list.findIndex((candidate) => candidate.url === item.url) === index
  ));

  return {
    images: uniqueImages.length ? uniqueImages : [{ id: 'fallback', type: 'image', url: fallbackImage, alt: 'Travel package' }],
    videos: galleryItems.filter((item) => item.type === 'video'),
  };
};

const getDurationLabel = (days) => {
  const safeDays = Number(days) || 0;
  if (!safeDays) return 'Custom itinerary';
  const nights = Math.max(safeDays - 1, 0);
  return `${nights}N/${safeDays}D`;
};

const clampTravellerCount = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(25, parsed));
};

const getPackageIdFromSlug = (slug) => {
  const match = String(slug || '').match(/^package-(\d+)$/i);
  return match ? Number(match[1]) : null;
};

const formatReviewDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Recently reviewed';

  return `Reviewed on : ${date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`;
};

const getStars = (rating) => {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '*'.repeat(safeRating) || '-';
};

const formatTaxPercent = (value) => {
  const percent = Number(value) || 0;
  if (!percent) return '0';
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(/\.?0+$/, '');
};

const getDestinationHotels = (destinationItem) => (
  Array.isArray(destinationItem?.activities?._hotels)
    ? destinationItem.activities._hotels.filter((hotel) => hotel?.name)
    : []
);

const PACKAGE_BOOKING_STORAGE_KEY = 'package_booking_draft';

const writePackageBookingDraft = (draft) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(PACKAGE_BOOKING_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn('Unable to store package booking draft:', error);
  }
};

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') {
    reject(new Error('Razorpay checkout is available only in the browser.'));
    return;
  }

  if (window.Razorpay) {
    resolve(window.Razorpay);
    return;
  }

  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window.Razorpay), { once: true });
    existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = () => resolve(window.Razorpay);
  script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
  document.body.appendChild(script);
});

const hasLoggedInUser = () => Boolean(getStoredToken() && getStoredAuth());

function LoadingView() {
  return (
    <div className="itn-page">
      <main className="itn-container">
        <div className="itn-skeleton itn-skeleton-title" />
        <div className="itn-skeleton itn-skeleton-tabs" />
        <div className="itn-skeleton itn-skeleton-gallery" />
      </main>
      <ItineraryStyles />
    </div>
  );
}

function Activity({ activity, destinationImage }) {
  const isLeisure = activity?.isLeisure;
  const time = activity?.duration || 'Activity';
  const activityImage = getMediaUrl(activity?.image) || destinationImage;

  return (
    <div className={`itn-activity ${isLeisure ? 'is-leisure' : ''}`}>
      {activityImage && !isLeisure ? (
        <span className="itn-activity-photo">
          <Image src={activityImage} alt="" width={32} height={32} />
        </span>
      ) : (
        <span className="itn-dot">{isLeisure ? '+' : 'i'}</span>
      )}
      <div>
        <small>{time}</small>
        <p>
          {isLeisure ? (
            <>
              At leisure.
            </>
          ) : (
            <>
              <strong>{activity?.name || 'Planned activity'}</strong>
              {activity?.description ? <em>{activity.description}</em> : null}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function DayRow({ day, activities, destinationImage }) {
  const visibleActivities = activities?.length
    ? activities
    : [{ id: `leisure-${day}`, duration: 'Full day', isLeisure: true }];

  return (
    <div className="itn-day-row">
      <div className="itn-day">Day {String(day).padStart(2, '0')}</div>
      <div className="itn-day-activities" data-count={Math.min(visibleActivities.length, 3)}>
        {visibleActivities.map((activity, index) => (
          <Activity
            key={activity?.id || `${day}-${index}`}
            activity={activity}
            destinationImage={index === 1 ? destinationImage : ''}
          />
        ))}
      </div>
    </div>
  );
}

function DestinationCard({ item, startDay, showTemperature, remainingDays }) {
  const destinationName = item?.destination?.name || 'Destination';
  const destinationImage = getMediaUrl(item?.destination?.feature_image);
  const maxRowsForDestination = Math.max(1, Math.min(
    Number(remainingDays) || Number(item?.nights) || 1,
    Math.max(Number(item?.nights) || 1, getActivityEntries(item?.activities).filter((entry) => entry.activities.length).length || 1)
  ));
  const activityEntries = getRenderableActivityEntries(item?.activities, maxRowsForDestination);
  const rowCount = Math.max(Number(item?.nights) || 1, activityEntries.length || 1);

  return (
    <div className="itn-city-card">
      <div className="itn-city-head">
        <strong>{destinationName}</strong>
        <span>- {Number(item?.nights) || 0} {Number(item?.nights) === 1 ? 'Night' : 'Nights'}</span>
        {showTemperature ? (
          <>
            <span>- Temperature</span>
            <span className="itn-temp">High: 30&deg;C <i /> Low: 26&deg;C</span>
          </>
        ) : null}
      </div>
      {Array.from({ length: rowCount }).map((_, index) => {
        const entry = activityEntries.find((activityEntry) => activityEntry.day === index + 1);
        return (
          <DayRow
            key={`${item?.id || destinationName}-${index}`}
            day={startDay + index}
            activities={entry?.activities || []}
            destinationImage={destinationImage}
          />
        );
      })}
    </div>
  );
}

function TransferConnector({ destinationName }) {
  return (
    <div className="itn-transfer-bridge" aria-hidden="true">
      <svg viewBox="0 0 330 86" preserveAspectRatio="none">
        <path d="M70 0 C70 38 165 24 165 45 C165 66 260 48 260 86" />
      </svg>
      <span className="itn-transfer-dot itn-transfer-dot-start" />
      <span className="itn-transfer-dot itn-transfer-dot-end" />
      <span className="itn-transfer-icon" />
      <p>Get transferred to {destinationName}</p>
    </div>
  );
}

function HotelStayCard({ hotel }) {
  const image = getMediaUrl(hotel?.image) || fallbackImage;
  const starRating = Math.max(0, Math.min(5, Math.round(Number(hotel?.starRating) || 0)));
  const guestRating = Number(hotel?.guestRating) || 0;
  const rooms = Math.max(1, Number(hotel?.rooms) || 1);
  const nights = Math.max(1, Number(hotel?.nights) || 1);
  const pricePerNight = Number(hotel?.pricePerNight) || 0;
  const priceLabel = pricePerNight > 0 ? `Rs ${pricePerNight.toLocaleString('en-IN')}` : 'Included';

  return (
    <article className="itn-hotel-card">
      <Image src={image} alt={hotel?.name || 'Hotel stay'} width={420} height={260} />
      <div className="itn-hotel-body">
        <span>{hotel.destinationName}</span>
        <h3>{hotel.name}</h3>
        <div className="itn-hotel-stars" aria-label={`${starRating} star hotel`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <i key={`hotel-star-${hotel.key}-${index}`} className={index < starRating ? 'is-filled' : ''}>★</i>
          ))}
          {guestRating > 0 ? <strong>{guestRating.toFixed(1)} guest rating</strong> : null}
        </div>
        <div className="itn-hotel-facts">
          <p><strong>{rooms}</strong> {rooms === 1 ? 'Room' : 'Rooms'}</p>
          <p><strong>{nights}</strong> {nights === 1 ? 'Night' : 'Nights'}</p>
          <p><strong>{priceLabel}</strong> / night</p>
        </div>
        {hotel.notes ? <p className="itn-hotel-note">{hotel.notes}</p> : null}
      </div>
    </article>
  );
}

function ItineraryStyles() {
  return (
    <style jsx global>{`
      .itn-page { background: #fff; padding: 112px 0 80px; color: var(--color-text-primary); font-family: var(--font-inter), Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.55; text-rendering: geometricPrecision; }
      .itn-container { width: min(100%, 1160px); margin: 0 auto; padding: 0 22px; }
      .itn-title { padding: 18px 0 16px; }
      .itn-title p { margin: 0 0 7px; color: var(--color-primary); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .45px; }
      .itn-title h1 { margin: 0; font-family: var(--font-poppins), Poppins, sans-serif; font-size: clamp(32px, 4vw, 44px); font-weight: 800; letter-spacing: 0; line-height: 1.08; }
      .itn-title-summary { max-width: 720px; margin: 13px 0 0; color: #526173; font-size: 15px; font-weight: 400; line-height: 1.72; }
      .itn-print-brief { display: none; }
      .itn-print-note, .itn-print-footer { display: none; }
      .itn-route-ribbon { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 18px; }
      .itn-route-ribbon span { display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 999px; background: linear-gradient(180deg, #fff, var(--color-bg-soft)); color: #263445; font-size: 13px; font-weight: 700; box-shadow: var(--shadow-xs); }
      .itn-route-ribbon i { width: 24px; height: 1px; background: var(--color-primary); position: relative; }
      .itn-route-ribbon i::after { content: ''; position: absolute; right: -1px; top: 50%; width: 6px; height: 6px; border-top: 1px solid var(--color-primary); border-right: 1px solid var(--color-primary); transform: translateY(-50%) rotate(45deg); }
      .itn-tabs { display: flex; gap: 28px; border-bottom: 1px solid var(--color-border); margin-bottom: 24px; overflow-x: auto; }
      .itn-tabs a { padding: 12px 0; font-size: 14px; font-weight: 700; color: var(--color-text-secondary); border-bottom: 3px solid transparent; white-space: nowrap; }
      .itn-tabs a.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
      .itn-gallery { display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 150px 150px; gap: 8px; overflow: hidden; border-radius: 8px; margin-bottom: 42px; }
      .itn-gallery img, .itn-video, .itn-video video { width: 100%; height: 100%; object-fit: cover; background: var(--color-bg-soft); }
      .itn-gallery-main { grid-row: span 2; }
      .itn-video { grid-row: span 2; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; padding: 16px; color: #fff; background: linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 85%, #111827), #111827); }
      .itn-video video { position: absolute; inset: 0; opacity: .72; }
      .itn-video strong, .itn-video button, .itn-video div { position: relative; z-index: 1; }
      .itn-video div { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.18); font-size: 12px; font-weight: 800; }
      .itn-video button, .itn-more { border: 1px solid var(--color-primary); color: var(--color-primary); background: #fff; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 800; }
      .itn-media-modal { position: fixed; inset: 0; z-index: 500; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(8, 14, 25, .82); backdrop-filter: blur(8px); }
      .itn-media-panel { width: min(100%, 980px); max-height: 88vh; overflow: auto; border-radius: 10px; background: #fff; box-shadow: var(--shadow-xl); }
      .itn-media-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px; background: #fff; border-bottom: 1px solid var(--color-border); }
      .itn-media-head h3 { margin: 0; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 18px; font-weight: 800; }
      .itn-media-head button { width: 34px; height: 34px; border-radius: 50%; background: var(--color-bg-soft); color: var(--color-text-primary); font-weight: 900; }
      .itn-media-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; padding: 18px; }
      .itn-media-item { overflow: hidden; border-radius: 8px; background: var(--color-bg-soft); border: 1px solid var(--color-border); }
      .itn-media-item img, .itn-media-item video { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
      .itn-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 48px; align-items: start; }
      .itn-section h2 { margin: 0 0 20px; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 19px; font-weight: 700; letter-spacing: 0; }
      .itn-section h2::after { content: ''; display: block; width: 42px; height: 3px; margin-top: 8px; border-radius: 999px; background: var(--gradient-primary); }
      .itn-proof-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; margin-bottom: 46px; }
      .itn-proof { display: grid; grid-template-columns: 30px 1fr; gap: 12px; }
      .itn-proof > span { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--color-primary-light); color: var(--color-primary); font-weight: 900; }
      .itn-proof strong { color: #263445; font-size: 14px; font-weight: 700; }
      .itn-proof p, .itn-review p { margin: 4px 0 0; color: #5e6a78; font-size: 13px; font-weight: 400; line-height: 1.6; }
      .itn-itinerary-wrap { max-width: 860px; position: relative; padding-left: 8px; }
      .itn-itinerary-wrap::before { content: ''; position: absolute; left: -18px; top: 20px; bottom: 18px; width: 3px; border-radius: 999px; background: linear-gradient(180deg, #b9dcf5, color-mix(in srgb, var(--color-primary) 14%, transparent)); opacity: .7; }
      .itn-city-card { border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 0; background: #fff; box-shadow: 0 18px 46px rgba(15, 23, 42, .07); }
      .itn-city-head { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; min-height: 64px; background: linear-gradient(90deg, #cfeeff 0%, #e9f6ff 100%); padding: 15px 19px; color: #334155; font-size: 15px; }
      .itn-city-head strong { font-family: var(--font-poppins), Poppins, sans-serif; font-size: 21px; font-weight: 800; color: #243746; letter-spacing: 0; }
      .itn-city-head span { color: #43566a; font-size: 15px; font-weight: 700; }
      .itn-temp { display: inline-flex; align-items: center; gap: 8px; margin-left: 4px; padding: 2px 9px; border: 1px solid var(--color-primary); border-radius: 999px; background: #fff; color: #0f172a !important; font-size: 12px; font-weight: 800 !important; white-space: nowrap; }
      .itn-temp i { width: 3px; height: 3px; border-radius: 50%; background: #9ca3af; }
      .itn-day-row { display: grid; grid-template-columns: 82px 1fr; min-height: 88px; border-top: 1px solid #cbd5e1; }
      .itn-day { padding: 18px 14px; color: #475569; font-size: 15px; font-weight: 500; border-right: 1px solid #cbd5e1; background: #fff; white-space: nowrap; }
      .itn-day-activities { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .itn-day-activities[data-count="1"] { grid-template-columns: 1fr; }
      .itn-day-activities[data-count="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .itn-activity { display: grid; grid-template-columns: 34px 1fr; gap: 12px; min-height: 106px; padding: 20px 18px; border-right: 1px solid #cbd5e1; background: linear-gradient(180deg, #fff 0%, #fbfdff 100%); transition: background var(--transition-fast); }
      .itn-activity:hover { background: #f5fbff; }
      .itn-activity:last-child { border-right: 0; }
      .itn-dot, .itn-activity-photo { width: 32px; height: 32px; margin-top: 1px; border-radius: 50%; display: grid; place-items: center; overflow: hidden; background: #6b7280; color: #fff; font-size: 11px; font-weight: 800; box-shadow: 0 1px 0 rgba(15, 23, 42, .08); }
      .itn-activity-photo img { width: 100%; height: 100%; object-fit: cover; }
      .itn-activity small { color: #142967; font-size: 9px; font-weight: 800; text-transform: uppercase; line-height: 1.1; letter-spacing: .18px; }
      .itn-activity p { margin: 4px 0 0; color: #1f3655; font-size: 13px; font-weight: 400; line-height: 1.42; }
      .itn-activity strong { display: block; margin: 8px 0 0; color: #020617; font-size: 16px; font-weight: 700; line-height: 1.28; }
      .itn-activity em { display: block; margin-top: 4px; color: #1f3655; font-style: normal; font-size: 13px; font-weight: 400; line-height: 1.42; }
      .itn-activity.is-leisure { grid-template-columns: 1fr; }
      .itn-activity.is-leisure .itn-dot { display: none; }
      .itn-transfer-bridge { position: relative; height: 90px; max-width: 360px; margin: -1px auto 0; color: #0f172a; text-align: center; }
      .itn-transfer-bridge svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .itn-transfer-bridge path { fill: none; stroke: #d2d2d2; stroke-width: 4; stroke-linecap: round; }
      .itn-transfer-dot { position: absolute; width: 16px; height: 16px; border-radius: 50%; background: #aaa; transform: translate(-50%, -50%); }
      .itn-transfer-dot-start { left: 21%; top: 0; }
      .itn-transfer-dot-end { left: 79%; top: 100%; }
      .itn-transfer-icon { position: absolute; left: 50%; top: 36px; transform: translate(-50%, -50%); width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: #4f5878; color: #fff; font-size: 0; font-weight: 900; }
      .itn-transfer-icon::before { content: ''; width: 14px; height: 8px; border: 2px solid currentColor; border-radius: 5px 5px 3px 3px; }
      .itn-transfer-icon::after { content: ''; position: absolute; width: 18px; height: 2px; background: currentColor; border-radius: 999px; transform: translateY(7px); }
      .itn-transfer-bridge p { position: absolute; left: 50%; bottom: 13px; width: max-content; max-width: min(360px, 80vw); transform: translateX(-50%); margin: 0; color: #111827; font-size: 15px; font-weight: 600; }
      .itn-hotels { margin-top: 48px; }
      .itn-hotels-head { margin-bottom: 18px; }
      .itn-hotels-head p { max-width: 680px; margin: -10px 0 0; color: #64748b; font-size: 13px; font-weight: 500; line-height: 1.6; }
      .itn-hotel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(245px, 1fr)); gap: 16px; }
      .itn-hotel-card { overflow: hidden; border: 1px solid #dbe7f3; border-radius: 8px; background: #fff; box-shadow: 0 16px 38px rgba(15, 23, 42, .08); }
      .itn-hotel-card img { width: 100%; height: 184px; object-fit: cover; background: var(--color-bg-soft); }
      .itn-hotel-body { display: grid; gap: 9px; padding: 15px; }
      .itn-hotel-body > span { color: var(--color-primary); font-size: 11px; font-weight: 900; letter-spacing: .45px; text-transform: uppercase; }
      .itn-hotel-body h3 { margin: 0; color: #0f172a; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 17px; font-weight: 800; line-height: 1.25; }
      .itn-hotel-stars { display: flex; align-items: center; flex-wrap: wrap; gap: 3px; color: #f4b400; font-size: 13px; line-height: 1; }
      .itn-hotel-stars i { color: #d7dee8; font-style: normal; }
      .itn-hotel-stars i.is-filled { color: #f4b400; }
      .itn-hotel-stars strong { margin-left: 6px; color: #475569; font-size: 12px; font-weight: 800; line-height: 1.2; }
      .itn-hotel-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .itn-hotel-facts p { min-height: 58px; display: grid; align-content: center; gap: 2px; margin: 0; padding: 8px; border: 1px solid #e2edf7; border-radius: 8px; background: #f8fbff; color: #64748b; font-size: 11px; font-weight: 800; text-align: center; }
      .itn-hotel-facts strong { display: block; color: #0f172a; font-size: 13px; font-weight: 900; }
      .itn-hotel-note { margin: 0; padding: 10px 12px; border-radius: 8px; background: #fff8e7; color: #6b4e16; font-size: 12px; font-weight: 700; line-height: 1.5; }
      .itn-sidebar { position: sticky; top: 92px; display: grid; gap: 20px; }
      .itn-card, .itn-rating, .itn-whatsapp { border: 1px solid var(--color-border); border-radius: 8px; background: #fff; box-shadow: var(--shadow-sm); }
      .itn-price-card { position: relative; overflow: hidden; display: grid; gap: 16px; padding: 18px; border-color: color-mix(in srgb, var(--color-primary) 24%, var(--color-border)); background: linear-gradient(135deg, #fff 0%, #f3faff 62%, color-mix(in srgb, var(--color-primary-light) 42%, #fff) 100%); }
      .itn-price-card::before { content: ''; position: absolute; right: -38px; top: -48px; width: 128px; height: 128px; border-radius: 50%; background: color-mix(in srgb, var(--color-primary) 12%, transparent); }
      .itn-price-card::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--gradient-primary); }
      .itn-price-card > div { position: relative; z-index: 1; display: grid; gap: 4px; }
      .itn-price-card span { color: var(--color-primary); font-size: 11px; font-weight: 800; letter-spacing: .55px; text-transform: uppercase; }
      .itn-price-card strong { color: var(--color-text-primary); font-family: var(--font-poppins), Poppins, sans-serif; font-size: 28px; font-weight: 800; line-height: 1.05; }
      .itn-price-card small { color: var(--color-text-secondary); font-size: 12px; font-weight: 600; }
      .itn-price-tax { color: #315273; font-size: 12px; font-style: normal; font-weight: 800; line-height: 1.3; }
      .itn-payment-options { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr; gap: 9px; }
      .itn-payment-options label { position: relative; display: grid; grid-template-columns: 18px 1fr auto; align-items: center; gap: 8px 10px; padding: 11px 12px; border: 1px solid #d6e4f0; border-radius: 8px; background: rgba(255,255,255,.82); cursor: pointer; transition: border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast); }
      .itn-payment-options label.is-selected { border-color: var(--color-primary); background: #fff; box-shadow: 0 8px 22px color-mix(in srgb, var(--color-primary) 12%, transparent); }
      .itn-payment-options input { width: 16px; height: 16px; accent-color: var(--color-primary); }
      .itn-payment-options span { color: #334155; font-size: 12px; font-weight: 900; letter-spacing: 0; text-transform: none; }
      .itn-payment-options strong { color: var(--color-primary); font-family: var(--font-poppins), Poppins, sans-serif; font-size: 15px; font-weight: 900; line-height: 1.1; text-align: right; }
      .itn-payment-options small { grid-column: 2 / -1; color: #64748b; font-size: 11px; font-weight: 800; line-height: 1.3; }
      .itn-price-card button { position: relative; z-index: 1; width: 100%; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 13px 16px; border-radius: 8px; background: var(--gradient-primary); color: #fff; font-size: 14px; font-weight: 800; box-shadow: 0 10px 22px color-mix(in srgb, var(--color-primary) 28%, transparent); transition: transform var(--transition-fast), box-shadow var(--transition-fast); }
      .itn-price-card button span { color: inherit; font-size: 14px; font-weight: 900; letter-spacing: 0; text-transform: none; }
      .itn-price-card button small { color: rgba(255,255,255,.84); font-size: 11px; font-weight: 800; letter-spacing: .25px; text-transform: uppercase; }
      .itn-price-card button:hover { transform: translateY(-1px); box-shadow: 0 14px 28px color-mix(in srgb, var(--color-primary) 34%, transparent); }
      .itn-price-travellers { position: relative; z-index: 1; display: grid; gap: 8px; padding: 12px; border: 1px solid #d6e4f0; border-radius: 8px; background: rgba(255,255,255,.82); }
      .itn-price-travellers > div { display: grid; grid-template-columns: 38px 1fr 38px; align-items: center; gap: 8px; }
      .itn-price-travellers button { width: 38px; height: 38px; padding: 0; display: grid; place-items: center; border: 1px solid #c9dbea; border-radius: 8px; background: #fff; color: var(--color-primary); font-size: 20px; font-weight: 900; box-shadow: none; }
      .itn-price-travellers button:hover { transform: none; box-shadow: none; border-color: var(--color-primary); }
      .itn-price-travellers input { width: 100%; height: 38px; border: 1px solid #c9dbea; border-radius: 8px; background: #fff; color: #0f172a; font-size: 15px; font-weight: 900; text-align: center; outline: none; }
      .itn-unlock { padding: 22px; text-align: center; }
      .itn-unlock a { color: var(--color-primary); font-size: 12px; font-weight: 800; }
      .itn-unlock button { width: 100%; margin-top: 18px; padding: 16px; border-radius: 8px; background: var(--gradient-primary); color: #fff; font-weight: 800; }
      .itn-whatsapp { position: relative; width: 100%; min-height: 78px; display: grid; grid-template-columns: 48px 1fr 28px; align-items: center; gap: 12px; padding: 15px 16px; overflow: hidden; color: var(--color-text-primary); text-align: left; background: linear-gradient(135deg, #fff 0%, #f3faff 100%); border: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-border)); border-radius: 8px; box-shadow: 0 12px 30px rgba(2, 110, 181, .11); transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast); }
      .itn-whatsapp::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #25d366; }
      .itn-whatsapp::after { content: ''; position: absolute; right: -34px; top: -44px; width: 104px; height: 104px; border-radius: 50%; background: color-mix(in srgb, var(--color-primary) 10%, transparent); }
      .itn-whatsapp:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--color-primary) 42%, var(--color-border)); box-shadow: 0 18px 40px rgba(2, 110, 181, .18); }
      .itn-whatsapp-icon { position: relative; z-index: 1; width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: #25d366; box-shadow: 0 9px 20px rgba(37, 211, 102, .28); }
      .itn-whatsapp-icon svg { width: 32px; height: 32px; filter: drop-shadow(0 1px 1px rgba(0,0,0,.14)); }
      .itn-whatsapp-icon svg path:first-child { fill: none; stroke: #fff; stroke-width: 5; stroke-linejoin: round; }
      .itn-whatsapp-icon svg path:last-child { fill: #fff; }
      .itn-whatsapp-copy { position: relative; z-index: 1; display: grid; gap: 3px; min-width: 0; line-height: 1.15; text-align: left; }
      .itn-whatsapp-copy span { color: var(--color-primary); font-size: 10px; font-weight: 800; letter-spacing: .55px; text-transform: uppercase; }
      .itn-whatsapp-copy strong { color: var(--color-text-primary); font-family: var(--font-poppins), Poppins, sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 0; white-space: normal; }
      .itn-whatsapp-arrow { position: relative; z-index: 1; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--color-primary); color: #fff; font-size: 16px; font-weight: 900; }
      .itn-route { overflow: hidden; padding: 0; border-color: #e3e7ec; border-radius: 10px; box-shadow: 0 16px 42px rgba(15, 23, 42, .07); }
      .itn-route h3 { margin: 0; padding: 16px 18px 15px; border-bottom: 1px solid #eef1f4; color: #7b7f86; font-size: 12px; font-weight: 800; line-height: 1; text-align: center; text-transform: uppercase; letter-spacing: .35px; }
      .itn-route-timeline { position: relative; display: grid; padding: 18px 18px 20px; background: linear-gradient(180deg, #fff 0%, #fcfdff 100%); }
      .itn-route-group { display: contents; }
      .itn-route-step { position: relative; display: grid; grid-template-columns: 42px 1fr; align-items: center; min-height: 36px; }
      .itn-route-step + .itn-route-step, .itn-route-group + .itn-route-step { margin-top: 2px; }
      .itn-route-rail { position: absolute; left: 21px; top: 0; bottom: 0; width: 1px; background: #d8dde4; }
      .itn-route-step:first-child .itn-route-rail { top: 16px; }
      .itn-route-step:last-child .itn-route-rail { bottom: 16px; }
      .itn-route-dot { position: relative; z-index: 1; justify-self: center; width: 10px; height: 10px; border-radius: 50%; background: #aeb4bc; box-shadow: 0 0 0 4px #fff; }
      .itn-route-icon { position: relative; z-index: 1; justify-self: center; width: 18px; height: 18px; border-radius: 50%; background: #fff; color: #6b7280; box-shadow: 0 0 0 3px #fff; }
      .itn-route-icon.is-plane::before { content: ''; position: absolute; left: 3px; top: 8px; width: 12px; height: 2px; border-radius: 999px; background: currentColor; transform: rotate(-38deg); }
      .itn-route-icon.is-plane::after { content: ''; position: absolute; left: 7px; top: 4px; width: 6px; height: 10px; border-top: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(-38deg); }
      .itn-route-icon.is-transfer::before, .itn-route-icon.is-transfer::after { content: ''; position: absolute; left: 4px; top: 8px; width: 10px; height: 2px; border-radius: 999px; background: currentColor; }
      .itn-route-icon.is-transfer::after { transform: rotate(90deg); }
      .itn-route-step p { margin: 0; color: #767b82; font-size: 13px; font-weight: 400; line-height: 1.35; }
      .itn-route-step strong { color: #555b64; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 17px; font-weight: 600; line-height: 1.25; letter-spacing: 0; }
      .itn-route-step.is-city { min-height: 40px; }
      .itn-route-step.is-note { min-height: 34px; }
      .itn-actions { display: grid; overflow: hidden; border-color: #e7ebef; box-shadow: 0 12px 30px rgba(15, 23, 42, .05); }
      .itn-actions button { padding: 13px 16px; color: #53606d; font-size: 13px; font-weight: 700; text-align: left; }
      .itn-actions button + button { border-top: 1px solid #eef1f4; }
      .itn-costing { padding: 0 12px 14px; border-top: 1px solid var(--color-border); color: var(--color-text-secondary); }
      .itn-costing strong { display: block; margin-top: 12px; color: var(--color-primary); font-family: var(--font-poppins), Poppins, sans-serif; font-size: 24px; font-weight: 800; line-height: 1.1; }
      .itn-costing span { display: block; margin-top: 4px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .3px; }
      .itn-costing p { margin: 8px 0 0; font-size: 12px; line-height: 1.5; }
      .itn-list { padding: 18px; border-color: #e7ebef; box-shadow: 0 12px 30px rgba(15, 23, 42, .05); }
      .itn-list h3 { margin: 0 0 14px; color: #737982; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .35px; text-align: center; }
      .itn-list ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
      .itn-list li { display: grid; grid-template-columns: 20px 1fr; gap: 8px; color: #475569; font-size: 13px; font-weight: 500; line-height: 1.4; }
      .itn-list li span { color: var(--color-primary); font-size: 14px; font-weight: 900; }
      .itn-rating { padding: 26px; text-align: center; }
      .itn-rating strong { display: block; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 44px; font-weight: 800; line-height: 1; }
      .itn-rating span, .itn-stars { color: #f7b500; font-weight: 900; }
      .itn-rating p { margin: 6px 0 0; color: var(--color-text-secondary); font-size: 13px; font-weight: 700; }
      .itn-booking-modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 18px; overflow-y: auto; scrollbar-width: none; background: rgba(5, 12, 26, .72); backdrop-filter: blur(10px); }
      .itn-booking-modal::-webkit-scrollbar { display: none; }
      .itn-booking-panel { position: relative; width: min(100%, 760px); margin: auto 0; overflow: hidden; border: 1px solid rgba(255,255,255,.42); border-radius: 10px; background: #fff; box-shadow: 0 28px 80px rgba(2, 8, 23, .34); }
      .itn-booking-close { position: absolute; top: 14px; right: 14px; z-index: 2; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.14); color: #fff; font-size: 18px; font-weight: 900; }
      .itn-booking-hero { position: relative; overflow: hidden; padding: 26px 28px 30px; background: linear-gradient(135deg, #07142a 0%, var(--color-primary) 76%); color: #fff; }
      .itn-booking-hero::after { content: ''; position: absolute; right: -38px; top: -52px; width: 138px; height: 138px; border-radius: 50%; background: rgba(255,255,255,.14); }
      .itn-booking-hero span { color: #bfdbfe; font-size: 11px; font-weight: 900; letter-spacing: .9px; text-transform: uppercase; }
      .itn-booking-hero h2 { position: relative; z-index: 1; margin: 8px 0 6px; color: #fff; font-family: var(--font-poppins), Poppins, sans-serif; font-size: clamp(24px, 4vw, 34px); font-weight: 900; line-height: 1.08; }
      .itn-booking-hero p { position: relative; z-index: 1; margin: 0; color: rgba(255,255,255,.78); font-size: 13px; font-weight: 700; }
      .itn-booking-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 18px 20px 0; }
      .itn-booking-summary > div { padding: 15px; border: 1px solid #dbe7f3; border-radius: 8px; background: #f8fbff; }
      .itn-booking-summary span { display: block; margin-bottom: 4px; color: var(--color-primary); font-size: 10px; font-weight: 900; letter-spacing: .55px; text-transform: uppercase; }
      .itn-booking-summary strong { display: block; color: #0f172a; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 23px; font-weight: 900; line-height: 1.08; }
      .itn-booking-summary p { grid-column: 1 / -1; margin: 0; color: #64748b; font-size: 12px; font-weight: 700; line-height: 1.5; }
      .itn-booking-payment-choice { margin: 16px 20px 0; padding: 15px; border: 1px solid #dbe7f3; border-radius: 8px; background: #fff; }
      .itn-booking-payment-choice .itn-payment-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .itn-booking-section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .itn-booking-section-title span { color: var(--color-primary); font-size: 11px; font-weight: 900; letter-spacing: .75px; text-transform: uppercase; }
      .itn-booking-section-title strong { color: #0f172a; font-size: 13px; font-weight: 900; }
      .itn-booking-travellers { margin: 16px 20px 0; padding: 15px; border: 1px solid #dbe7f3; border-radius: 8px; background: linear-gradient(180deg, #fff 0%, #f8fbff 100%); }
      .itn-traveller-count-row { display: grid; grid-template-columns: minmax(0, 1fr) 168px; align-items: center; gap: 14px; padding: 12px; border: 1px solid #e3edf7; border-radius: 8px; background: #fff; }
      .itn-traveller-count-row span, .itn-guest-card > strong { display: block; color: var(--color-primary); font-size: 10px; font-weight: 900; letter-spacing: .55px; text-transform: uppercase; }
      .itn-traveller-count-row strong { display: block; margin-top: 4px; color: #0f172a; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 21px; font-weight: 900; line-height: 1.08; }
      .itn-traveller-count-row small { display: block; margin-top: 4px; color: #64748b; font-size: 12px; font-weight: 800; }
      .itn-traveller-stepper { display: grid; grid-template-columns: 42px 1fr 42px; gap: 8px; }
      .itn-traveller-stepper button { width: 42px; height: 42px; border: 1px solid #c9dbea; border-radius: 8px; background: #fff; color: var(--color-primary); font-size: 20px; font-weight: 900; }
      .itn-traveller-stepper input { width: 100%; height: 42px; border: 1px solid #c9dbea; border-radius: 8px; color: #0f172a; font-size: 15px; font-weight: 900; text-align: center; outline: none; }
      .itn-traveller-stepper input:focus, .itn-guest-card input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent); }
      .itn-guest-list { display: grid; gap: 10px; margin-top: 12px; }
      .itn-guest-card { display: grid; grid-template-columns: 1fr 86px 1fr 1fr; gap: 10px; align-items: end; padding: 12px; border: 1px solid #e3edf7; border-radius: 8px; background: #fff; }
      .itn-guest-card > strong { grid-column: 1 / -1; margin-bottom: -2px; }
      .itn-guest-card label { display: grid; gap: 6px; color: #334155; font-size: 11px; font-weight: 900; letter-spacing: .35px; text-transform: uppercase; }
      .itn-guest-card input { width: 100%; height: 42px; border: 1px solid #d8e2ee; border-radius: 8px; padding: 0 12px; color: #0f172a; font-size: 13px; font-weight: 800; outline: none; }
      .itn-booking-hotels { margin: 16px 20px 0; padding: 15px; border: 1px solid #dbe7f3; border-radius: 8px; background: linear-gradient(180deg, #fff 0%, #f8fbff 100%); }
      .itn-booking-hotel-list { display: grid; gap: 10px; }
      .itn-booking-hotel { display: grid; grid-template-columns: 86px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 10px; border: 1px solid #e3edf7; border-radius: 8px; background: #fff; }
      .itn-booking-hotel img { width: 86px; height: 66px; object-fit: cover; border-radius: 8px; background: var(--color-bg-soft); }
      .itn-booking-hotel div { min-width: 0; }
      .itn-booking-hotel div > span { color: var(--color-primary); font-size: 10px; font-weight: 900; letter-spacing: .45px; text-transform: uppercase; }
      .itn-booking-hotel div > strong { display: block; margin-top: 3px; color: #0f172a; font-size: 14px; font-weight: 900; line-height: 1.25; }
      .itn-booking-hotel p { margin: 5px 0 0; color: #64748b; font-size: 12px; font-weight: 800; }
      .itn-booking-hotel p b { color: #f4b400; font-weight: 900; letter-spacing: .8px; }
      .itn-booking-hotel ul { display: grid; gap: 5px; margin: 0; padding: 0; list-style: none; color: #475569; font-size: 12px; font-weight: 800; text-align: right; white-space: nowrap; }
      .itn-booking-breakdown { display: grid; gap: 0; margin: 16px 20px 0; overflow: hidden; border: 1px solid #dbe7f3; border-radius: 8px; background: #fff; }
      .itn-booking-breakdown div { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; border-bottom: 1px solid #edf3f9; }
      .itn-booking-breakdown div:last-child { border-bottom: 0; background: #f8fbff; }
      .itn-booking-breakdown span { color: #64748b; font-size: 12px; font-weight: 800; }
      .itn-booking-breakdown strong { color: #0f172a; font-size: 13px; font-weight: 900; text-align: right; }
      .itn-booking-form { display: grid; gap: 12px; padding: 18px 20px 0; }
      .itn-booking-form label { display: grid; gap: 7px; color: #334155; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .45px; }
      .itn-booking-form input, .itn-booking-form textarea { width: 100%; border: 1px solid #d8e2ee; border-radius: 8px; color: #0f172a; font-size: 14px; font-weight: 700; outline: none; }
      .itn-booking-form input { height: 46px; padding: 0 14px; }
      .itn-booking-form textarea { min-height: 96px; resize: vertical; padding: 12px 14px; line-height: 1.45; text-transform: none; letter-spacing: 0; }
      .itn-booking-form input:focus, .itn-booking-form textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent); }
      .itn-coupon-field { display: grid; gap: 8px; }
      .itn-coupon-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
      .itn-coupon-row input { text-transform: uppercase; }
      .itn-coupon-row button { height: 46px; min-width: 82px; padding: 0 14px; border: 1px solid var(--color-primary); border-radius: 8px; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .3px; }
      .itn-coupon-row button:disabled { border-color: #d8e2ee; background: #eef4f9; color: #94a3b8; cursor: not-allowed; }
      .itn-coupon-note { color: #0f8a4b; font-size: 12px; font-weight: 800; text-transform: none; letter-spacing: 0; }
      .itn-coupon-error { color: #b91c1c; font-size: 12px; font-weight: 800; text-transform: none; letter-spacing: 0; }
      .itn-booking-error, .itn-booking-message { margin: 14px 20px 0; padding: 12px 14px; border-radius: 8px; font-size: 13px; font-weight: 800; line-height: 1.45; }
      .itn-booking-error { border: 1px solid #fecaca; background: #fff1f2; color: #b91c1c; }
      .itn-booking-message { border: 1px solid #bbf7d0; background: #f0fdf4; color: #15803d; }
      .itn-booking-result { margin: 14px 20px 0; padding: 16px; border: 1px solid #bfe7d9; border-radius: 8px; background: #f8fffb; box-shadow: 0 8px 22px rgba(15, 23, 42, .05); }
      .itn-booking-result-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #d8f3e7; }
      .itn-booking-result-head span, .itn-booking-result-grid span { display: block; color: #64748b; font-size: 11px; font-weight: 900; letter-spacing: .4px; text-transform: uppercase; }
      .itn-booking-result-head strong { color: #14532d; font-size: 15px; font-weight: 900; text-align: right; word-break: break-word; }
      .itn-booking-result-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding-top: 12px; }
      .itn-booking-result-grid div { min-width: 0; }
      .itn-booking-result-grid strong { display: block; margin-top: 3px; color: #0f172a; font-size: 13px; font-weight: 900; word-break: break-word; }
      .itn-booking-result p { margin: 14px 0 0; color: #166534; font-size: 13px; font-weight: 800; line-height: 1.45; }
      .itn-booking-actions { display: grid; grid-template-columns: 120px 1fr; gap: 12px; padding: 20px; }
      .itn-booking-actions button, .itn-booking-actions a { height: 48px; border-radius: 8px; font-size: 14px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
      .itn-booking-actions button:first-child { border: 1px solid #d8e2ee; background: #fff; color: #475569; }
      .itn-booking-actions button:last-child, .itn-booking-actions a { background: var(--gradient-primary); color: #fff; box-shadow: 0 12px 24px color-mix(in srgb, var(--color-primary) 25%, transparent); }
      .itn-booking-actions button:disabled { cursor: not-allowed; opacity: .64; box-shadow: none; }
      .itn-login-panel { position: relative; width: min(100%, 440px); overflow: hidden; border-radius: 10px; background: #fff; box-shadow: 0 28px 80px rgba(2, 8, 23, .34); }
      .itn-login-copy { display: grid; gap: 4px; padding: 20px; text-align: center; }
      .itn-login-copy strong { color: #0f172a; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 30px; font-weight: 900; line-height: 1; }
      .itn-login-copy span { color: var(--color-primary); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .5px; }
      .itn-login-copy p { margin: 10px auto 0; max-width: 340px; color: #64748b; font-size: 13px; font-weight: 700; line-height: 1.5; }
      .itn-reviews { margin-top: 90px; }
      .itn-review { display: grid; grid-template-columns: 54px 1fr; gap: 14px; padding: 18px 0; border-bottom: 1px solid var(--color-border); }
      .itn-review h3 { margin: 7px 0 0; color: #263445; font-size: 14px; font-weight: 800; line-height: 1.35; }
      .itn-avatar { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: var(--gradient-warm); color: #fff; font-size: 22px; font-weight: 900; }
      .itn-review-summary, .itn-review-empty { margin: 0 0 8px; padding: 16px 18px; border: 1px solid var(--color-border); border-radius: 8px; background: linear-gradient(180deg, #fff, var(--color-bg-soft)); }
      .itn-review-summary { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .itn-review-summary strong { font-family: var(--font-poppins), Poppins, sans-serif; font-size: 28px; font-weight: 800; line-height: 1; }
      .itn-review-summary span { color: #f7b500; font-weight: 900; }
      .itn-review-summary p, .itn-review-empty { color: var(--color-text-secondary); font-size: 13px; font-weight: 700; }
      .itn-review-summary p { margin: 0; }
      .itn-stars span { margin-left: 8px; color: var(--color-text-secondary); font-size: 12px; }
      .itn-more { display: block; min-width: 280px; margin: 28px auto 0; }
      .itn-error { padding: 140px 22px 80px; max-width: 760px; margin: 0 auto; text-align: center; }
      .itn-error h1 { font-size: clamp(28px, 4vw, 42px); margin-bottom: 12px; }
      .itn-error p { color: var(--color-text-secondary); margin-bottom: 24px; }
      .itn-skeleton { border-radius: 8px; background: linear-gradient(90deg, var(--color-border), var(--color-bg-soft), var(--color-border)); background-size: 300% 100%; animation: itnPulse 1.4s infinite; }
      .itn-skeleton-title { width: min(100%, 620px); height: 44px; margin: 38px 0 20px; }
      .itn-skeleton-tabs { width: 360px; height: 42px; margin-bottom: 24px; }
      .itn-skeleton-gallery { width: 100%; height: 308px; }
      @keyframes itnPulse { to { background-position: -300% 0; } }
      @media (max-width: 991px) {
        .itn-layout { grid-template-columns: 1fr; gap: 32px; }
        .itn-sidebar { position: static; grid-row: 1; }
        .itn-gallery { grid-template-columns: 1fr 1fr; grid-template-rows: 240px 150px 150px; }
        .itn-gallery-main, .itn-video { grid-column: span 2; grid-row: auto; }
      }
      @media (max-width: 700px) {
        .itn-page { padding-top: 92px; }
        .itn-gallery { display: block; }
        .itn-gallery img, .itn-video { height: 220px; margin-bottom: 8px; border-radius: 8px; }
        .itn-media-modal { padding: 12px; }
        .itn-media-grid { grid-template-columns: 1fr; padding: 12px; }
        .itn-proof-grid, .itn-day-activities, .itn-day-activities[data-count="3"] { grid-template-columns: 1fr; }
        .itn-day-row { grid-template-columns: 1fr; }
        .itn-day, .itn-activity { border-right: 0; }
        .itn-day { border-bottom: 1px solid #d4d9df; }
        .itn-activity { border-top: 1px solid #d4d9df; }
        .itn-city-head { flex-wrap: wrap; }
        .itn-transfer-bridge { height: 76px; max-width: 280px; }
        .itn-transfer-bridge p { bottom: 8px; font-size: 13px; }
        .itn-tabs { gap: 20px; }
        .itn-hotel-grid, .itn-hotel-facts { grid-template-columns: 1fr; }
        .itn-hotel-card img { height: 210px; }
        .itn-booking-modal { padding: 10px; }
        .itn-booking-panel { margin: 0; }
        .itn-booking-summary, .itn-booking-actions, .itn-booking-payment-choice .itn-payment-options, .itn-traveller-count-row, .itn-guest-card { grid-template-columns: 1fr; }
        .itn-booking-hotel { grid-template-columns: 74px 1fr; align-items: start; }
        .itn-booking-hotel img { width: 74px; height: 64px; }
        .itn-booking-hotel ul { grid-column: 1 / -1; grid-template-columns: repeat(3, 1fr); text-align: left; white-space: normal; }
      }
      @media print {
        @page {
          size: A4;
          margin: 14mm 12mm 16mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html,
        body {
          width: 210mm;
          background: #fff !important;
          color: #101827 !important;
        }
        .navbar-custom,
        .footer,
        .itn-tabs,
        .itn-gallery,
        .itn-sidebar,
        .itn-reviews,
        .itn-booking-modal,
        .itn-media-modal { display: none !important; }
        .itn-page {
          padding: 0 !important;
          background: #fff !important;
          color: #101827 !important;
          font-size: 10.5pt !important;
          line-height: 1.45 !important;
        }
        .itn-container { width: 100% !important; max-width: none !important; padding: 0 !important; }
        .itn-title {
          position: relative;
          min-height: 128px;
          margin: 0 0 12mm !important;
          padding: 14mm 12mm 12mm !important;
          border-radius: 0 0 14px 14px;
          background: linear-gradient(135deg, #061124 0%, #0a3275 68%, #0b74b8 100%) !important;
          color: #fff !important;
          overflow: hidden;
        }
        .itn-title::after {
          content: '';
          position: absolute;
          right: -28mm;
          top: -35mm;
          width: 82mm;
          height: 82mm;
          border-radius: 999px;
          background: rgba(255,255,255,.12);
        }
        .itn-title p {
          position: relative;
          z-index: 1;
          margin-bottom: 5mm !important;
          color: #bde5ff !important;
          font-size: 8.5pt !important;
          letter-spacing: 1.4px !important;
        }
        .itn-title h1 {
          position: relative;
          z-index: 1;
          max-width: 160mm;
          color: #fff !important;
          font-size: 25pt !important;
          line-height: 1.08 !important;
          letter-spacing: 0 !important;
        }
        .itn-title-summary {
          position: relative;
          z-index: 1;
          max-width: 150mm;
          margin-top: 5mm !important;
          color: rgba(255,255,255,.84) !important;
          font-size: 10pt !important;
          line-height: 1.55 !important;
        }
        .itn-route-ribbon { margin-top: 7mm !important; gap: 6px !important; }
        .itn-route-ribbon span {
          border-color: rgba(255,255,255,.25) !important;
          background: rgba(255,255,255,.12) !important;
          color: #fff !important;
          box-shadow: none !important;
          font-size: 8.5pt !important;
          padding: 5px 9px !important;
        }
        .itn-route-ribbon i,
        .itn-route-ribbon i::after { background: #f8c640 !important; border-color: #f8c640 !important; }
        .itn-print-brief {
          display: block !important;
          margin: 0 0 9mm !important;
          padding: 0 !important;
          break-inside: avoid;
        }
        .itn-print-brand {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 4mm;
          border-bottom: 1px solid #d9e2ef;
        }
        .itn-print-brand span {
          color: #0572b8;
          font-size: 13pt;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .6px;
        }
        .itn-print-brand strong {
          color: #64748b;
          font-size: 9pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.1px;
        }
        .itn-print-route-map {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0;
          margin: 6mm 0 1mm;
          padding: 5mm;
          border: 1px solid #d9e2ef;
          border-radius: 10px;
          background: linear-gradient(135deg, #f8fbff 0%, #eef8ff 100%) !important;
          overflow: hidden;
        }
        .itn-print-route-map::after {
          content: '';
          position: absolute;
          right: -15mm;
          bottom: -22mm;
          width: 48mm;
          height: 48mm;
          border-radius: 999px;
          background: rgba(5, 114, 184, .08);
        }
        .itn-print-route-map span {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #0f2742;
          font-size: 9pt;
          font-weight: 900;
          white-space: nowrap;
        }
        .itn-print-route-map i {
          width: 8mm;
          height: 8mm;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          background: #0572b8 !important;
          color: #fff;
          font-size: 6.8pt;
          font-style: normal;
          font-weight: 900;
        }
        .itn-print-route-map b {
          width: 18mm;
          height: 1px;
          margin: 0 4mm;
          background: #9acfed !important;
          position: relative;
        }
        .itn-print-route-map b::after {
          content: '';
          position: absolute;
          right: -1px;
          top: 50%;
          width: 5px;
          height: 5px;
          border-top: 1px solid #0572b8;
          border-right: 1px solid #0572b8;
          transform: translateY(-50%) rotate(45deg);
        }
        .itn-print-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 5mm;
        }
        .itn-print-grid > div {
          min-height: 24mm;
          padding: 4mm;
          border: 1px solid #d9e2ef;
          border-radius: 8px;
          background: #f8fbff !important;
        }
        .itn-print-grid span,
        .itn-print-lists h3 {
          display: block;
          margin: 0 0 2mm;
          color: #0572b8;
          font-size: 7.5pt;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .7px;
        }
        .itn-print-grid strong {
          display: block;
          color: #101827;
          font-size: 10.2pt;
          font-weight: 800;
          line-height: 1.28;
        }
        .itn-print-lists {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 5mm;
        }
        .itn-print-lists > div {
          padding: 4mm;
          border: 1px solid #d9e2ef;
          border-radius: 8px;
          background: #fff !important;
        }
        .itn-print-lists ul {
          margin: 0;
          padding-left: 16px;
          color: #334155;
          font-size: 9pt;
          line-height: 1.45;
        }
        .itn-print-lists li + li { margin-top: 1.5mm; }
        .itn-layout { display: block !important; }
        .itn-section { break-inside: auto; }
        .itn-section h2 {
          margin: 0 0 5mm !important;
          color: #101827 !important;
          font-size: 16pt !important;
          page-break-after: avoid;
        }
        .itn-section h2::after {
          width: 30mm !important;
          height: 2px !important;
          margin-top: 2mm !important;
          background: #0572b8 !important;
        }
        .itn-print-note {
          display: block !important;
          margin: -2mm 0 5mm !important;
          color: #64748b !important;
          font-size: 9pt !important;
          font-weight: 600 !important;
        }
        .itn-proof-grid {
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 7px !important;
          margin-bottom: 9mm !important;
          break-inside: avoid;
        }
        .itn-proof {
          display: block !important;
          min-height: 28mm;
          padding: 4mm;
          border: 1px solid #d9e2ef;
          border-radius: 8px;
          background: #fbfdff !important;
        }
        .itn-proof > span { display: none !important; }
        .itn-proof strong { color: #101827 !important; font-size: 9.5pt !important; }
        .itn-proof p { color: #475569 !important; font-size: 8.5pt !important; line-height: 1.42 !important; }
        .itn-itinerary-wrap {
          max-width: none !important;
          padding-left: 0 !important;
        }
        .itn-itinerary-wrap::before,
        .itn-transfer-bridge { display: none !important; }
        .itn-city-card {
          margin: 0 0 6mm !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px !important;
          box-shadow: none !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .itn-city-head {
          min-height: auto !important;
          padding: 4mm 5mm !important;
          background: #eaf6ff !important;
          border-bottom: 1px solid #cbd5e1 !important;
        }
        .itn-city-head strong { font-size: 13pt !important; color: #0f2742 !important; }
        .itn-city-head span { font-size: 9.5pt !important; color: #334155 !important; }
        .itn-temp { display: none !important; }
        .itn-day-row {
          grid-template-columns: 24mm 1fr !important;
          min-height: auto !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .itn-day {
          padding: 4mm !important;
          color: #334155 !important;
          font-size: 9pt !important;
          font-weight: 800 !important;
          background: #fff !important;
        }
        .itn-day-activities,
        .itn-day-activities[data-count="3"] {
          display: block !important;
        }
        .itn-activity {
          display: grid !important;
          grid-template-columns: 8mm 1fr !important;
          min-height: auto !important;
          padding: 4mm !important;
          border-right: 0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background: #fff !important;
          break-inside: avoid;
        }
        .itn-activity:last-child { border-bottom: 0 !important; }
        .itn-activity:hover { background: #fff !important; }
        .itn-dot,
        .itn-activity-photo {
          width: 6mm !important;
          height: 6mm !important;
          background: #0572b8 !important;
          color: #fff !important;
          box-shadow: none !important;
        }
        .itn-activity-photo img { display: none !important; }
        .itn-activity small {
          color: #0572b8 !important;
          font-size: 7pt !important;
          letter-spacing: .5px !important;
        }
        .itn-activity p,
        .itn-activity em {
          color: #334155 !important;
          font-size: 9pt !important;
          line-height: 1.4 !important;
        }
        .itn-activity strong {
          margin-top: 1mm !important;
          color: #101827 !important;
          font-size: 10.5pt !important;
        }
        .itn-hotels {
          margin-top: 8mm !important;
          break-inside: auto;
        }
        .itn-hotels-head p {
          margin: -3mm 0 4mm !important;
          color: #64748b !important;
          font-size: 8.5pt !important;
        }
        .itn-hotel-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 6px !important;
        }
        .itn-hotel-card {
          box-shadow: none !important;
          border-color: #d9e2ef !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .itn-hotel-card img {
          height: 32mm !important;
        }
        .itn-hotel-body {
          gap: 2mm !important;
          padding: 4mm !important;
        }
        .itn-hotel-body h3 {
          font-size: 11pt !important;
        }
        .itn-hotel-stars strong,
        .itn-hotel-note,
        .itn-hotel-facts p {
          font-size: 8pt !important;
        }
        .itn-hotel-facts {
          gap: 4px !important;
        }
        .itn-hotel-facts p {
          min-height: auto !important;
          padding: 2mm !important;
        }
        .itn-print-footer {
          display: grid !important;
          gap: 1mm;
          margin-top: 8mm;
          padding: 5mm 6mm;
          border: 1px solid #d9e2ef;
          border-radius: 10px;
          background: #f8fbff !important;
          break-inside: avoid;
        }
        .itn-print-footer strong {
          color: #0572b8;
          font-size: 10pt;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .7px;
        }
        .itn-print-footer span {
          color: #475569;
          font-size: 9pt;
          font-weight: 600;
        }
      }
    `}</style>
  );
}

export default function TourItineraryView({ destination, packageSlug }) {
  const router = useRouter();
  const resolvedSlug = getPackageSlug(destination, packageSlug);
  const packageIdFromQuery = getPackageIdFromSlug(packageSlug);
  const [pkg, setPkg] = useState(null);
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ count: 0, average_rating: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [costingOpen, setCostingOpen] = useState(false);
  const [partialBooking, setPartialBooking] = useState(null);
  const [paymentMode, setPaymentMode] = useState('partial');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ name: '', email: '', phone: '', couponCode: '', notes: '' });
  const [travellerCount, setTravellerCount] = useState(1);
  const [guestTravellers, setGuestTravellers] = useState([]);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [couponValidation, setCouponValidation] = useState(null);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadPackage = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError('');

      const packageData = await getPackageBySlug(resolvedSlug);

      if (!mounted) return;

      if (!packageData) {
        setError('Unable to load this itinerary right now.');
        setPkg(null);
      } else {
        setPkg(packageData);
      }

      setLoading(false);
    };

    loadPackage();

    const refetchFreshPackage = () => {
      if (document.visibilityState === 'visible') {
        loadPackage({ silent: true });
      }
    };

    window.addEventListener('focus', refetchFreshPackage);
    window.addEventListener('pageshow', refetchFreshPackage);
    document.addEventListener('visibilitychange', refetchFreshPackage);

    return () => {
      mounted = false;
      window.removeEventListener('focus', refetchFreshPackage);
      window.removeEventListener('pageshow', refetchFreshPackage);
      document.removeEventListener('visibilitychange', refetchFreshPackage);
    };
  }, [resolvedSlug]);

  useEffect(() => {
    let mounted = true;

    const loadPartialBookingSettings = async () => {
      const settings = await getPartialBookingSettings();

      if (mounted) {
        setPartialBooking(settings);
      }
    };

    loadPartialBookingSettings();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadCompanyInfo = async () => {
      try {
        const response = await fetch('/api/company-info', {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        const payload = await response.json();

        if (mounted && payload?.success) {
          setCompany(payload.data);
        }
      } catch (error) {
        console.warn('Company info unavailable:', error);
      }
    };

    loadCompanyInfo();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const packageId = packageIdFromQuery || pkg?.id;
    const packageReviewSlug = pkg?.slug || (!packageIdFromQuery ? resolvedSlug : '');

    if (!packageId && !packageReviewSlug) {
      return undefined;
    }

    let mounted = true;

    const loadPackageReviews = async () => {
      setReviewsLoading(true);

      const result = await getPackageReviews({
        packageId,
        packageSlug: packageId ? undefined : packageReviewSlug,
        status: 'approved',
      });

      if (!mounted) return;

      setReviews(result.reviews);
      setReviewSummary(result.summary || { count: 0, average_rating: 0 });
      setReviewsLoading(false);
    };

    loadPackageReviews();

    return () => {
      mounted = false;
    };
  }, [pkg?.id, pkg?.slug, packageIdFromQuery, resolvedSlug]);

  useEffect(() => {
    if (!bookingResult?.success) return undefined;

    const redirectTimer = window.setTimeout(() => {
      router.replace('/');
    }, 4500);

    return () => window.clearTimeout(redirectTimer);
  }, [bookingResult, router]);

  const media = useMemo(() => getPackageMedia(pkg), [pkg]);
  const mediaItems = useMemo(() => [...media.images, ...media.videos], [media]);
  const destinations = useMemo(() => sortByOrder(pkg?.destinations), [pkg]);
  const itinerarySections = useMemo(() => destinations.map((item, index) => {
    const startDay = destinations.slice(0, index).reduce((total, previousItem) => {
      const entries = getActivityEntries(previousItem?.activities).filter((entry) => entry.activities.length);
      return total + Math.max(Number(previousItem?.nights) || 1, entries.length || 1);
    }, 1);
    const remainingDays = Math.max((Number(pkg?.duration_days) || 0) - startDay + 1, 1);

    return { item, startDay, remainingDays };
  }), [destinations, pkg?.duration_days]);
  const packageHotels = useMemo(() => destinations.flatMap((item, destinationIndex) => (
    getDestinationHotels(item).map((hotel, hotelIndex) => ({
      ...hotel,
      destinationName: item?.destination?.name || `Stay ${destinationIndex + 1}`,
      key: hotel?.id || `${item?.id || destinationIndex}-${hotelIndex}`,
    }))
  )), [destinations]);
  const destinationNames = destinations.map((item) => item?.destination?.name).filter(Boolean);
  const routeStart = destinationNames[0] || titleCase(destination || pkg?.name || 'Destination');
  const routeEnd = destinationNames[destinationNames.length - 1] || titleCase(destination || pkg?.name || 'Destination');
  const includedItems = pkg?.inclusions || [];
  const excludedItems = pkg?.exclusions || [];
  const reviewCount = Number(reviewSummary?.count) || reviews.length;
  const averageRating = Number(reviewSummary?.average_rating) || (
    reviews.length
      ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length
      : 0
  );
  const ratingLabel = averageRating ? averageRating.toFixed(1) : 'New';

  if (loading) {
    return <LoadingView />;
  }

  if (error || !pkg) {
    return (
      <div className="itn-page">
        <div className="itn-error">
          <h1>Itinerary unavailable</h1>
          <p>{error || 'We could not find this package.'}</p>
          <Link href={`/tours?destination=${encodeURIComponent(destination || 'paris')}`} className="btn-primary">
            Back to packages
          </Link>
        </div>
        <ItineraryStyles />
      </div>
    );
  }

  const packageUnitAmount = Number(pkg.price) || 0;
  const packageBaseAmount = packageUnitAmount * travellerCount;
  const taxType = String(pkg.tax_type || '').trim();
  const taxPercent = Math.max(0, Number(pkg.tax_percent) || 0);
  const couponCode = bookingForm.couponCode.trim().toUpperCase();
  const validatedCouponCode = String(couponValidation?.data?.coupon?.code || '').trim().toUpperCase();
  const activeCouponData = couponValidation?.success && couponCode && validatedCouponCode === couponCode ? couponValidation.data : null;
  const activeCouponAmounts = activeCouponData?.amounts || null;
  const couponDiscountAmount = Math.max(0, Number(activeCouponAmounts?.coupon_discount_amount) || 0);
  const packageDisplayBaseAmount = activeCouponAmounts ? Number(activeCouponAmounts.package_base_amount) || 0 : packageBaseAmount;
  const taxAmount = activeCouponAmounts
    ? Number(activeCouponAmounts.tax_amount) || 0
    : packageBaseAmount > 0 && taxPercent > 0
      ? Math.round((packageBaseAmount * taxPercent) / 100)
      : 0;
  const packageTotal = activeCouponAmounts ? Number(activeCouponAmounts.package_total) || 0 : packageBaseAmount + taxAmount;
  const priceLabel = packageDisplayBaseAmount > 0 ? `Rs ${packageDisplayBaseAmount.toLocaleString('en-IN')}` : 'On req';
  const originalPriceLabel = packageBaseAmount > 0 ? `Rs ${packageBaseAmount.toLocaleString('en-IN')}` : 'On req';
  const unitPriceLabel = packageUnitAmount > 0 ? `Rs ${packageUnitAmount.toLocaleString('en-IN')}` : 'On req';
  const travellerLabel = `${travellerCount} ${travellerCount === 1 ? 'traveller' : 'travellers'}`;
  const taxLabel = taxPercent > 0 ? `${taxType || 'Tax'} ${formatTaxPercent(taxPercent)}%` : taxType || 'Tax';
  const taxAmountLabel = taxAmount > 0 ? `Rs ${taxAmount.toLocaleString('en-IN')}` : 'Rs 0';
  const couponDiscountLabel = couponDiscountAmount > 0 ? `- Rs ${couponDiscountAmount.toLocaleString('en-IN')}` : 'Rs 0';
  const packageTotalLabel = packageTotal > 0 ? `Rs ${packageTotal.toLocaleString('en-IN')}` : 'On request';
  const partialBookingPercentage = Math.max(0, Math.min(100, Number(partialBooking?.partial_booking_percentage) || 0));
  const partialBookingEnabled = Boolean(partialBooking?.partial_booking_enabled) && partialBookingPercentage > 0 && packageTotal > 0;
  const bookingAmount = partialBookingEnabled ? Math.round((packageTotal * partialBookingPercentage) / 100) : 0;
  const bookingAmountLabel = bookingAmount > 0 ? `Rs ${bookingAmount.toLocaleString('en-IN')}` : '';
  const partialRemainingAmount = partialBookingEnabled ? Math.max(packageTotal - bookingAmount, 0) : 0;
  const partialRemainingAmountLabel = partialRemainingAmount > 0 ? `Rs ${partialRemainingAmount.toLocaleString('en-IN')}` : 'Rs 0';
  const selectedPaymentMode = partialBookingEnabled && paymentMode === 'partial' ? 'partial' : 'full';
  const isPartialPayment = selectedPaymentMode === 'partial';
  const amountToPay = activeCouponAmounts?.paid_amount != null ? Number(activeCouponAmounts.paid_amount) || 0 : isPartialPayment ? bookingAmount : packageTotal;
  const amountToPayLabel = amountToPay > 0 ? `Rs ${amountToPay.toLocaleString('en-IN')}` : 'On reques';
  const remainingAmount = activeCouponAmounts?.remaining_amount != null ? Math.max(Number(activeCouponAmounts.remaining_amount) || 0, 0) : Math.max(packageTotal - amountToPay, 0);
  const remainingAmountLabel = remainingAmount > 0 ? `Rs ${remainingAmount.toLocaleString('en-IN')}` : 'Rs 0';
  const duePercentLabel = isPartialPayment ? `${partialBookingPercentage}%` : '100%';
  const remainingPercent = isPartialPayment ? Math.max(0, 100 - partialBookingPercentage) : 0;
  const paymentModeLabel = isPartialPayment ? 'Partial booking' : 'Full payment';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const loginRedirectUrl = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/tours';
  const bookingResultData = bookingResult?.data || bookingResult?.booking || null;
  const bookingResultAmounts = bookingResultData?.amounts || {};
  const bookingHotels = packageHotels.map((hotel) => {
    const rooms = Math.max(1, Number(hotel?.rooms) || 1);
    const nights = Math.max(1, Number(hotel?.nights) || 1);
    const pricePerNight = Number(hotel?.pricePerNight) || 0;

    return {
      id: hotel?.id || null,
      hotel_id: hotel?.hotelId || null,
      name: hotel?.name || '',
      destination: hotel?.destinationName || '',
      image: getMediaUrl(hotel?.image) || '',
      notes: hotel?.notes || '',
      rooms,
      nights,
      star_rating: Number(hotel?.starRating) || 0,
      guest_rating: Number(hotel?.guestRating) || 0,
      price_per_night: pricePerNight,
      estimated_amount: pricePerNight * nights * rooms,
    };
  });
  const bookingHotelsTotal = bookingHotels.reduce((total, hotel) => total + hotel.estimated_amount, 0);
  const bookingTravellers = [
    {
      type: 'lead',
      sequence: 1,
      name: bookingForm.name,
      email: bookingForm.email,
      phone: bookingForm.phone,
    },
    ...guestTravellers.slice(0, Math.max(travellerCount - 1, 0)).map((traveller, index) => ({
      type: 'guest',
      sequence: index + 2,
      name: traveller.name || '',
      age: traveller.age || '',
      email: traveller.email || '',
      phone: traveller.phone || '',
    })),
  ];
  const buildBookingDraft = (overrides = {}) => {
    const auth = getStoredAuth() || {};

    return {
      package_id: pkg.id || null,
      package_slug: pkg.slug || resolvedSlug,
      package_name: pkg.name,
      package_price: packageDisplayBaseAmount,
      package_unit_price: packageUnitAmount,
      original_package_base_amount: packageBaseAmount,
      package_base_amount: packageDisplayBaseAmount,
      tax_type: taxType || null,
      tax_percent: taxPercent,
      tax_amount: taxAmount,
      package_total: packageTotal,
      duration: getDurationLabel(pkg.duration_days),
      route: destinationNames,
      traveller_count: travellerCount,
      travelers_count: travellerCount,
      total_travellers: travellerCount,
      travelers: bookingTravellers,
      travellers: bookingTravellers,
      guest_travellers: bookingTravellers.slice(1),
      hotels: bookingHotels,
      hotel_count: bookingHotels.length,
      hotel_estimated_amount: bookingHotelsTotal,
      partial_booking_enabled: isPartialPayment,
      partial_booking_percentage: isPartialPayment ? partialBookingPercentage : 100,
      payable_now: amountToPay,
      remaining_amount: remainingAmount,
      remaining_percentage: remainingPercent,
      coupon_code: couponCode,
      promo_code: couponCode,
      coupon_discount_amount: couponDiscountAmount,
      coupon_validation: activeCouponData,
      notes: bookingForm.notes || '',
      customer_notes: bookingForm.notes || '',
      customer: {
        id: auth.id || auth.customer_id || auth.user_id || auth.customerId || auth.user?.id || auth.customer?.id || null,
        name: bookingForm.name || auth.name || auth.full_name || auth.firstName || '',
        email: bookingForm.email || auth.email || '',
        phone: bookingForm.phone || auth.mobile || auth.phone || '',
      },
      status: 'draft',
      page_url: currentUrl,
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  };
  const companyName =
    company?.companyName ||
    company?.legalName ||
    company?.brandName ||
    company?.displayName ||
    'Travel Holiday';
  const whatsappNumber = String(company?.contact?.whatsapp || company?.contact?.phone || '').replace(/[^\d]/g, '');
  const whatsappUrl = whatsappNumber
    ? `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(`I want help with ${pkg.name}: ${currentUrl}`)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(`I want help with ${pkg.name}: ${currentUrl}`)}`;
  const mailQuote = () => {
    const subject = `Quote request: ${pkg.name}`;
    const body = [
      `Hi Travel Holiday team,`,
      '',
      `Please mail me the quote for ${pkg.name}.`,
      `Duration: ${getDurationLabel(pkg.duration_days)}`,
      `Route: ${destinationNames.join(' -> ') || 'Custom route'}`,
      `Package link: ${currentUrl}`,
    ].join('\n');

    window.location.assign(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };
  const openCancellationPolicy = () => {
    window.location.assign('/cancellation');
  };
  const openBookingModal = () => {
    if (!hasLoggedInUser()) {
      writePackageBookingDraft(buildBookingDraft({ status: 'login_required' }));
      setLoginPromptOpen(true);
      return;
    }

    const auth = getStoredAuth() || {};
    const nextForm = {
      name: bookingForm.name || auth.name || auth.full_name || auth.firstName || '',
      email: bookingForm.email || auth.email || '',
      phone: bookingForm.phone || auth.phone || auth.mobile || '',
      couponCode: bookingForm.couponCode || '',
      notes: bookingForm.notes || '',
    };
    setBookingForm((current) => ({
      name: current.name || nextForm.name,
      email: current.email || nextForm.email,
      phone: current.phone || nextForm.phone,
      couponCode: current.couponCode || nextForm.couponCode,
      notes: current.notes || nextForm.notes,
    }));
    const nextTravellers = [
      {
        type: 'lead',
        sequence: 1,
        name: nextForm.name,
        email: nextForm.email,
        phone: nextForm.phone,
      },
      ...guestTravellers.slice(0, Math.max(travellerCount - 1, 0)).map((traveller, index) => ({
        type: 'guest',
        sequence: index + 2,
        name: traveller.name || '',
        age: traveller.age || '',
        email: traveller.email || '',
        phone: traveller.phone || '',
      })),
    ];
    writePackageBookingDraft(buildBookingDraft({
      status: 'draft',
      customer: {
        id: auth.id || auth.customer_id || auth.user_id || auth.customerId || auth.user?.id || auth.customer?.id || null,
        ...nextForm,
      },
      notes: nextForm.notes || '',
      customer_notes: nextForm.notes || '',
      coupon_code: nextForm.couponCode.trim().toUpperCase(),
      promo_code: nextForm.couponCode.trim().toUpperCase(),
      travelers: nextTravellers,
      travellers: nextTravellers,
      guest_travellers: nextTravellers.slice(1),
    }));
    setPaymentMessage('');
    setPaymentError('');
    setBookingResult(null);
    setBookingModalOpen(true);
  };
  const updateBookingField = (field, value) => {
    const nextForm = { ...bookingForm, [field]: value };
    const auth = getStoredAuth() || {};
    const nextTravellers = [
      {
        type: 'lead',
        sequence: 1,
        name: nextForm.name,
        email: nextForm.email,
        phone: nextForm.phone,
      },
      ...guestTravellers.slice(0, Math.max(travellerCount - 1, 0)).map((traveller, index) => ({
        type: 'guest',
        sequence: index + 2,
        name: traveller.name || '',
        age: traveller.age || '',
        email: traveller.email || '',
        phone: traveller.phone || '',
      })),
    ];

    setBookingForm(nextForm);
    if (field === 'couponCode') {
      setCouponValidation(null);
      setCouponMessage('');
      setCouponError('');
    }
    writePackageBookingDraft(buildBookingDraft({
      status: 'draft',
      customer: {
        id: auth.id || auth.customer_id || auth.user_id || auth.customerId || auth.user?.id || auth.customer?.id || null,
        ...nextForm,
      },
      coupon_code: nextForm.couponCode.trim().toUpperCase(),
      promo_code: nextForm.couponCode.trim().toUpperCase(),
      travelers: nextTravellers,
      travellers: nextTravellers,
      guest_travellers: nextTravellers.slice(1),
    }));
  };
  const updateTravellerCount = (value) => {
    const nextCount = clampTravellerCount(value);
    setCouponValidation(null);
    setCouponMessage('');
    setCouponError('');
    setTravellerCount(nextCount);
    setGuestTravellers((current) => {
      const guestCount = Math.max(nextCount - 1, 0);
      return Array.from({ length: guestCount }, (_, index) => (
        current[index] || { name: '', age: '', email: '', phone: '' }
      ));
    });
  };
  const updateGuestTraveller = (index, field, value) => {
    setGuestTravellers((current) => {
      const nextGuests = Array.from({ length: Math.max(travellerCount - 1, 0) }, (_, guestIndex) => (
        current[guestIndex] || { name: '', age: '', email: '', phone: '' }
      ));
      nextGuests[index] = {
        ...nextGuests[index],
        [field]: value,
      };

      return nextGuests;
    });
  };
  const updatePaymentMode = (mode) => {
    setPaymentMode(mode);
    setCouponValidation(null);
    setCouponMessage('');
    setCouponError('');
  };
  const validateCouponCode = async () => {
    const code = couponCode;

    if (!code) {
      setCouponValidation(null);
      setCouponMessage('');
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponValidating(true);
    setCouponMessage('');
    setCouponError('');

    const auth = getStoredAuth() || {};
    const customerId = auth.id || auth.customer_id || auth.user_id || auth.customerId || auth.user?.id || auth.customer?.id || '';
    const payload = {
      package_id: pkg.id || packageIdFromQuery || null,
      package_slug: pkg.slug || resolvedSlug,
      coupon_code: code,
      coupon: {
        code,
      },
      package_base_amount: packageBaseAmount,
      tax_percent: taxPercent,
      payable_now: amountToPay,
      customer: {
        id: customerId,
        email: bookingForm.email || auth.email || '',
      },
    };

    const response = await validateBookingCoupon(payload);
    setCouponValidating(false);

    if (response.success) {
      setCouponValidation(response);
      setCouponMessage(response.message || 'Coupon is valid.');
      setCouponError('');
      writePackageBookingDraft(buildBookingDraft({
        status: 'coupon_validated',
        coupon_code: code,
        promo_code: code,
        coupon_validation: response.data || response,
      }));
      return;
    }

    setCouponValidation(null);
    setCouponMessage('');
    setCouponError(response.message || 'Coupon is not valid for this booking.');
  };
  const startRazorpayPayment = async () => {
    if (!hasLoggedInUser()) {
      writePackageBookingDraft(buildBookingDraft({ status: 'login_required' }));
      setBookingModalOpen(false);
      setLoginPromptOpen(true);
      setPaymentProcessing(false);
      setPaymentMessage('');
      setPaymentError('Please login before booking this package.');
      return;
    }

    if (!amountToPay || amountToPay <= 0) {
      setPaymentError('This package does not have an online payable amount. Please contact us for booking.');
      return;
    }

    if (!bookingForm.name.trim() || !bookingForm.phone.trim()) {
      setPaymentError('Please enter your name and phone number before payment.');
      return;
    }

    setPaymentProcessing(true);
    setPaymentError('');
    setPaymentMessage('Creating a secure payment order...');

    const auth = getStoredAuth() || {};
    const customerId = auth.id || auth.customer_id || auth.user_id || auth.customerId || auth.user?.id || auth.customer?.id || '';
    writePackageBookingDraft(buildBookingDraft({ status: 'creating_order' }));
    const orderResponse = await createRazorpayOrder({
      amount: amountToPay,
      currency: 'INR',
      notes: {
        package_id: String(pkg.id || ''),
        package_name: pkg.name,
        booking_type: selectedPaymentMode,
        booking_percentage: isPartialPayment ? String(partialBookingPercentage) : '100',
        traveller_count: String(travellerCount),
        package_total: String(packageTotal),
        package_base_amount: String(packageDisplayBaseAmount),
        coupon_discount_amount: String(couponDiscountAmount),
        payable_now: String(amountToPay),
        remaining_amount: String(remainingAmount),
        coupon_code: couponCode,
        customer_name: bookingForm.name,
        customer_phone: bookingForm.phone,
        customer_id: String(customerId),
        guest_names: guestTravellers.map((traveller) => traveller.name).filter(Boolean).join(', ').slice(0, 240),
      },
    });

    if (!orderResponse.success) {
      setPaymentProcessing(false);
      setPaymentMessage('');
      setPaymentError(orderResponse.message || 'Unable to create payment order.');
      writePackageBookingDraft(buildBookingDraft({
        status: 'order_failed',
        payment_error: orderResponse.message || 'Unable to create payment order.',
      }));
      return;
    }

    try {
      const Razorpay = await loadRazorpayCheckout();
      const { order, key_id: keyId } = orderResponse.data || {};

      setPaymentMessage('Opening Razorpay checkout...');
      writePackageBookingDraft(buildBookingDraft({
        status: 'order_created',
        razorpay_order_id: order?.id || null,
      }));

      const checkout = new Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: companyName,
        description: `${pkg.name} booking for ${travellerLabel}`,
        order_id: order.id,
        prefill: {
          name: bookingForm.name,
          email: bookingForm.email,
          contact: bookingForm.phone,
        },
        notes: order.notes,
        theme: { color: '#026eb5' },
        handler: async (response) => {
          setPaymentMessage('Verifying payment...');
          const verifyResponse = await verifyRazorpayPayment(response);

          if (verifyResponse.success) {
            const verifiedBookingPayload = buildBookingDraft({
              status: 'payment_verified',
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              payment_verified_at: new Date().toISOString(),
            });

            setPaymentMessage('Payment verified. Creating your booking record...');
            setPaymentError('');
            writePackageBookingDraft(verifiedBookingPayload);

            const bookingResponse = await createPackageBooking(verifiedBookingPayload);

            if (bookingResponse.success) {
              setBookingResult(bookingResponse);
              setPaymentMessage(`Booking created successfully. Redirecting to homepage shortly...`);
              setPaymentError('');
              writePackageBookingDraft({
                ...verifiedBookingPayload,
                status: 'booking_created',
                booking_response: bookingResponse.data || bookingResponse.booking || bookingResponse,
                booking_created_at: new Date().toISOString(),
              });
            } else {
              setBookingResult(null);
              setPaymentMessage(`Payment successful. Payment ID: ${response.razorpay_payment_id}`);
              setPaymentError(bookingResponse.message || 'Payment is verified, but booking creation failed. Please contact support.');
              writePackageBookingDraft({
                ...verifiedBookingPayload,
                status: 'booking_create_failed',
                booking_error: bookingResponse.message || 'Booking creation failed.',
              });
            }
          } else {
            setPaymentError(verifyResponse.message || 'Payment verification failed. Please contact support.');
            setPaymentMessage('');
            writePackageBookingDraft(buildBookingDraft({
              status: 'payment_verification_failed',
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              payment_error: verifyResponse.message || 'Payment verification failed.',
            }));
          }

          setPaymentProcessing(false);
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setPaymentMessage('');
            writePackageBookingDraft(buildBookingDraft({
              status: 'payment_cancelled',
              razorpay_order_id: order?.id || null,
            }));
          },
        },
      });

      checkout.open();
    } catch (error) {
      setPaymentProcessing(false);
      setPaymentMessage('');
      setPaymentError(error?.message || 'Unable to open Razorpay checkout.');
      writePackageBookingDraft(buildBookingDraft({
        status: 'checkout_failed',
        payment_error: error?.message || 'Unable to open Razorpay checkout.',
      }));
    }
  };
  const printItinerary = () => {
    const previousTitle = document.title;
    document.title = `${pkg.name} Itinerary`;
    window.addEventListener('afterprint', () => {
      document.title = previousTitle;
    }, { once: true });
    window.print();
  };
  const printDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="itn-page">
      <main className="itn-container">
        <header className="itn-title">
          <p>{getDurationLabel(pkg.duration_days)} handcrafted itinerary</p>
          <h1>{pkg.name}</h1>
          {pkg.description ? <div className="itn-title-summary">{pkg.description}</div> : null}
          {destinationNames.length ? (
            <div className="itn-route-ribbon" aria-label="Trip route">
              {destinationNames.map((name, index) => (
                <span key={`${name}-ribbon`}>
                  {name}
                  {index < destinationNames.length - 1 ? <i /> : null}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <section className="itn-print-brief" aria-label="Printable itinerary summary">
          <div className="itn-print-brand">
            <span>Travel Holiday</span>
            <strong>Trip itinerary - {printDate}</strong>
          </div>
          <div className="itn-print-route-map" aria-hidden="true">
            {(destinationNames.length ? destinationNames : [titleCase(destination || pkg.name)]).map((name, index, list) => (
              <span key={`print-route-${name}-${index}`}>
                <i>{String(index + 1).padStart(2, '0')}</i>
                {name}
                {index < list.length - 1 ? <b /> : null}
              </span>
            ))}
          </div>
          <div className="itn-print-grid">
            <div>
              <span>Package Price</span>
              <strong>{priceLabel}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{getDurationLabel(pkg.duration_days)}</strong>
            </div>
            <div>
              <span>Route</span>
              <strong>{destinationNames.join(' to ') || titleCase(destination || pkg.name)}</strong>
            </div>
            <div>
              <span>Trip Style</span>
              <strong>{pkg.is_customizable ? 'Customizable holiday' : 'Curated package'}</strong>
            </div>
          </div>
          <div className="itn-print-lists">
            {includedItems.length ? (
              <div>
                <h3>Inclusions</h3>
                <ul>
                  {includedItems.slice(0, 8).map((item) => <li key={`print-inc-${item.id}`}>{item.text}</li>)}
                </ul>
              </div>
            ) : null}
            {excludedItems.length ? (
              <div>
                <h3>Exclusions</h3>
                <ul>
                  {excludedItems.slice(0, 8).map((item) => <li key={`print-exc-${item.id}`}>{item.text}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        </section>

        <nav className="itn-tabs">
          <a href="#trip" className="active">Your Trip</a>
          <a href="#inclusions">Inclusions</a>
          {packageHotels.length ? <a href="#hotels">Hotels</a> : null}
          <a href="#reviews">Reviews</a>
        </nav>

        <section className="itn-gallery" aria-label="Trip gallery">
          <Image className="itn-gallery-main" src={media.images[0]?.url || fallbackImage} alt={media.images[0]?.alt || pkg.name} width={760} height={420} priority />
          <Image src={media.images[1]?.url || media.images[0]?.url || fallbackImage} alt={media.images[1]?.alt || `${pkg.name} highlight`} width={380} height={206} />
          <Image src={media.images[2]?.url || media.images[0]?.url || fallbackImage} alt={media.images[2]?.alt || `${pkg.name} experience`} width={380} height={206} />
          <div className="itn-video">
            {media.videos[0] ? (
              <video src={media.videos[0].url} poster={media.videos[0].poster || undefined} muted loop playsInline autoPlay />
            ) : null}
            <div>Play</div>
            <strong>{media.videos[0] ? 'Package video' : (destinationNames.length ? destinationNames.join(' + ') : titleCase(destination))}</strong>
            <button type="button" onClick={() => setMediaOpen(true)}>View All Media</button>
          </div>
        </section>

        {mediaOpen ? (
          <div className="itn-media-modal" role="dialog" aria-modal="true" aria-label="Package media">
            <div className="itn-media-panel">
              <div className="itn-media-head">
                <h3>All Media</h3>
                <button type="button" onClick={() => setMediaOpen(false)} aria-label="Close media">x</button>
              </div>
              <div className="itn-media-grid">
                {mediaItems.map((item) => (
                  <div className="itn-media-item" key={`${item.type}-${item.id || item.url}`}>
                    {item.type === 'video' ? (
                      <video src={item.url} poster={item.poster || undefined} controls playsInline />
                    ) : (
                      <Image src={item.url} alt={item.alt || 'Package media'} width={520} height={325} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="itn-layout" id="trip">
          <div>
            <section className="itn-section" id="inclusions">
              <h2>Why choose Travel Holiday?</h2>
              <div className="itn-proof-grid">
                {[
                  ['Customizable package', pkg.is_customizable ? 'This itinerary can be adjusted to your travel style.' : 'Our team can help you plan details.'],
                  ['Curated destinations', destinationNames.length ? destinationNames.join(', ') : 'Hand-picked destination route.'],
                  ['Duration', getDurationLabel(pkg.duration_days)],
                  ['Included experiences', `${includedItems.length} inclusions added to this package.`],
                ].map(([title, text]) => (
                  <div className="itn-proof" key={title}>
                    <span>+</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="itn-section">
              <h2>Itinerary</h2>
              <p className="itn-print-note">Your day-wise travel plan, prepared for a clean print copy.</p>
              <div className="itn-itinerary-wrap">
                {itinerarySections.map(({ item, startDay, remainingDays }, index) => (
                  <div key={item?.id || item?.destination?.slug || index}>
                    <DestinationCard item={item} startDay={startDay} showTemperature={index > 0} remainingDays={remainingDays} />
                    {index < itinerarySections.length - 1 ? (
                      <TransferConnector destinationName={itinerarySections[index + 1]?.item?.destination?.name || 'next destination'} />
                    ) : null}
                  </div>
                ))}
              </div>
              {packageHotels.length ? (
                <div className="itn-hotels" id="hotels">
                  <div className="itn-hotels-head">
                    <h2>Hotels included</h2>
                    <p>Hand-picked stays attached to this itinerary, shown by destination with rooms, nights, rating, and nightly pricing.</p>
                  </div>
                  <div className="itn-hotel-grid">
                    {packageHotels.map((hotel) => (
                      <HotelStayCard key={hotel.key} hotel={hotel} />
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="itn-print-footer">
                <strong>End of itinerary</strong>
                <span>For booking changes or hotel upgrades, contact Travel Holiday before confirmation.</span>
              </div>
            </section>

            <section className="itn-section itn-reviews" id="reviews">
              <h2>Travel Holiday Original Reviews</h2>
              {reviewsLoading ? (
                <div className="itn-review-empty">Loading reviews...</div>
              ) : reviews.length ? (
                <>
                  <div className="itn-review-summary">
                    <strong>{averageRating.toFixed(1)}</strong>
                    <span>{getStars(averageRating)}</span>
                    <p>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'} for this package</p>
                  </div>
                  {reviews.map((review) => {
                    const name = review.reviewer_name || review.customer?.name || 'Travel Holiday guest';
                    const comment = review.comment || review.title || 'The guest rated this package highly.';

                    return (
                      <article className="itn-review" key={review.id || `${name}-${review.created_at}`}>
                        <div className="itn-avatar">{name.charAt(0).toUpperCase()}</div>
                        <div>
                          <strong>{name}</strong>
                          <div className="itn-stars">
                            {getStars(review.rating)}
                            <span>{formatReviewDate(review.created_at)}</span>
                          </div>
                          {review.title ? <h3>{review.title}</h3> : null}
                          <p>{comment}</p>
                        </div>
                      </article>
                    );
                  })}
                </>
              ) : (
                <div className="itn-review-empty">No reviews are available for this package yet.</div>
              )}
            </section>
          </div>

          <aside className="itn-sidebar">
            <div className="itn-card itn-price-card">
              <div>
                <span>Package price</span>
                <strong>{unitPriceLabel}</strong>
                <small>Per traveller</small>
                {travellerCount > 1 ? <em className="itn-price-tax">Group base {priceLabel}</em> : null}
                {taxAmount > 0 ? <em className="itn-price-tax">+ {taxAmountLabel} {taxLabel}</em> : null}
                {taxAmount > 0 ? <em className="itn-price-tax">Total {packageTotalLabel}</em> : null}
                <small>{getDurationLabel(pkg.duration_days)} · {destinationNames.join(' + ') || 'Custom route'}</small>
              </div>
              <div className="itn-price-travellers" aria-label="Travellers for this booking">
                <span>Travellers</span>
                <div>
                  <button type="button" onClick={() => updateTravellerCount(travellerCount - 1)} aria-label="Reduce travellers">-</button>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={travellerCount}
                    onChange={(event) => updateTravellerCount(event.target.value)}
                    aria-label="Traveller count"
                  />
                  <button type="button" onClick={() => updateTravellerCount(travellerCount + 1)} aria-label="Add traveller">+</button>
                </div>
                <small>{travellerLabel} selected</small>
              </div>
              {partialBookingEnabled ? (
                <div className="itn-payment-options" role="radiogroup" aria-label="Choose payment amount">
                  <label className={isPartialPayment ? 'is-selected' : ''}>
                    <input
                      type="radio"
                      name="sidebar-payment-mode"
                      value="partial"
                      checked={isPartialPayment}
                      onChange={() => updatePaymentMode('partial')}
                    />
                    <span>Pay {partialBookingPercentage}% now</span>
                    <strong>{bookingAmountLabel}</strong>
                    <small>Balance {partialRemainingAmountLabel}</small>
                  </label>
                  <label className={!isPartialPayment ? 'is-selected' : ''}>
                    <input
                      type="radio"
                      name="sidebar-payment-mode"
                      value="full"
                      checked={!isPartialPayment}
                      onChange={() => updatePaymentMode('full')}
                    />
                    <span>Pay full amount</span>
                    <strong>{packageTotalLabel}</strong>
                    <small>No remaining balance</small>
                  </label>
                </div>
              ) : null}
              <button type="button" onClick={openBookingModal}>
                <span>{amountToPay > 0 ? `Book Now - Pay ${amountToPayLabel}` : 'Book Now'}</span>
                {partialBookingEnabled ? <small>{isPartialPayment ? `${partialBookingPercentage}% of total booking amount` : '100% of total booking amount'}</small> : null}
              </button>
            </div>
            <button
              type="button"
              className="itn-whatsapp"
              onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
            >
              <span className="itn-whatsapp-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" focusable="false">
                  <path d="M32 6.5C18.4 6.5 7.4 17.3 7.4 30.7c0 4.7 1.4 9.1 3.8 12.8L8.5 56.8l13.7-3.2c3.1 1 6.4 1.6 9.8 1.6 13.6 0 24.6-10.8 24.6-24.2S45.6 6.5 32 6.5Z" />
                  <path d="M22.6 18.7c-.6-1.4-1.2-1.4-1.8-1.4h-1.5c-.5 0-1.4.2-2.1 1-1.2 1.3-3.1 3.1-3.1 7.4 0 4.4 3.2 8.6 3.7 9.2.5.6 6.2 9.9 15.4 13.5 7.6 3 9.2 2.4 10.8 2.3 1.7-.2 5.3-2.2 6.1-4.3.8-2.1.8-3.9.5-4.3-.2-.4-.8-.6-1.8-1.1l-5.5-2.7c-.8-.4-1.5-.6-2.1.4-.6.9-2.4 2.7-3 3.3-.5.6-1.1.7-2 .2-1-.5-4-1.5-7.6-4.6-2.8-2.5-4.7-5.6-5.3-6.6-.5-.9-.1-1.5.4-2 .4-.4 1-.9 1.4-1.5.5-.5.6-.9 1-1.5.3-.6.2-1.1-.1-1.6l-2.5-5.7Z" />
                </svg>
              </span>
              <span className="itn-whatsapp-copy">
                <span>Trip support on WhatsApp</span>
                <strong>Chat with {companyName}</strong>
              </span>
              <span className="itn-whatsapp-arrow" aria-hidden="true">&gt;</span>
            </button>
            <div className="itn-card itn-route">
              <h3>Your Route</h3>
              <div className="itn-route-timeline">
                <div className="itn-route-step is-note">
                  <span className="itn-route-rail" />
                  <span className="itn-route-icon is-plane" aria-hidden="true" />
                  <p>Arrival at {routeStart}</p>
                </div>
                {(destinationNames.length ? destinationNames : [titleCase(destination || pkg.name)]).map((name, index, list) => (
                  <div className="itn-route-group" key={`${name}-${index}`}>
                    <div className="itn-route-step is-city">
                      <span className="itn-route-rail" />
                      <span className="itn-route-dot" aria-hidden="true" />
                      <strong>{name}</strong>
                    </div>
                    {index < list.length - 1 ? (
                      <div className="itn-route-step is-note">
                        <span className="itn-route-rail" />
                        <span className="itn-route-icon is-transfer" aria-hidden="true" />
                        <p>Transfer by flight</p>
                      </div>
                    ) : null}
                  </div>
                ))}
                <div className="itn-route-step is-note">
                  <span className="itn-route-rail" />
                  <span className="itn-route-icon is-plane" aria-hidden="true" />
                  <p>Departure from {routeEnd}</p>
                </div>
              </div>
            </div>
            {includedItems.length ? (
              <div className="itn-card itn-list">
                <h3>Inclusions</h3>
                <ul>
                  {includedItems.map((item) => (
                    <li key={item.id}><span>+</span>{item.text}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {excludedItems.length ? (
              <div className="itn-card itn-list">
                <h3>Exclusions</h3>
                <ul>
                  {excludedItems.map((item) => (
                    <li key={item.id}><span>-</span>{item.text}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="itn-card itn-actions">
              <button type="button" onClick={() => setCostingOpen((open) => !open)} aria-expanded={costingOpen}>
                Costing for:
              </button>
              {costingOpen ? (
                <div className="itn-costing">
                  <strong>{priceLabel}</strong>
                  <span>for {getDurationLabel(pkg.duration_days)}</span>
                  <p>Final costing may vary by travel date, hotel category, flight choices, and customization.</p>
                </div>
              ) : null}
              <button type="button" onClick={mailQuote}>Mail this quote</button>
              <button type="button" onClick={openCancellationPolicy}>Cancellation Policy</button>
              <button type="button" onClick={printItinerary}>Print itinerary</button>
            </div>
            <div className="itn-rating">
              <strong>{ratingLabel}</strong>
              <span>{averageRating ? getStars(averageRating) : 'Awaiting reviews'}</span>
              <p>{reviewCount ? `From ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}</p>
            </div>
          </aside>
        </div>
      </main>

      {bookingModalOpen ? (
        <div className="itn-booking-modal" role="dialog" aria-modal="true" aria-label="Complete package booking">
          <div className="itn-booking-panel">
            <button
              type="button"
              className="itn-booking-close"
              onClick={() => {
                if (!paymentProcessing) setBookingModalOpen(false);
              }}
              aria-label="Close booking popup"
            >
              x
            </button>
            <div className="itn-booking-hero">
              <span>Secure package booking</span>
              <h2>{pkg.name}</h2>
              <p>{getDurationLabel(pkg.duration_days)} - {destinationNames.join(' + ') || 'Custom route'}</p>
            </div>
            <section className="itn-booking-travellers">
              <div className="itn-booking-section-title">
                <span>Travellers</span>
                <strong>Book this package for yourself and friends</strong>
              </div>
              <div className="itn-traveller-count-row">
                <div>
                  <span>Total travellers</span>
                  <strong>{travellerLabel}</strong>
                  <small>{unitPriceLabel} per traveller before taxes</small>
                </div>
                <div className="itn-traveller-stepper">
                  <button type="button" onClick={() => updateTravellerCount(travellerCount - 1)} aria-label="Reduce travellers">-</button>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={travellerCount}
                    onChange={(event) => updateTravellerCount(event.target.value)}
                    aria-label="Total travellers"
                  />
                  <button type="button" onClick={() => updateTravellerCount(travellerCount + 1)} aria-label="Add traveller">+</button>
                </div>
              </div>
              {guestTravellers.length ? (
                <div className="itn-guest-list">
                  {guestTravellers.map((traveller, index) => (
                    <div className="itn-guest-card" key={`guest-traveller-${index}`}>
                      <strong>Traveller {index + 2}</strong>
                      <label>
                        Name
                        <input
                          type="text"
                          value={traveller.name}
                          onChange={(event) => updateGuestTraveller(index, 'name', event.target.value)}
                          placeholder="Friend name"
                        />
                      </label>
                      <label>
                        Age
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={traveller.age}
                          onChange={(event) => updateGuestTraveller(index, 'age', event.target.value)}
                          placeholder="Age"
                        />
                      </label>
                      <label>
                        Phone
                        <input
                          type="tel"
                          value={traveller.phone}
                          onChange={(event) => updateGuestTraveller(index, 'phone', event.target.value)}
                          placeholder="Optional"
                        />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          value={traveller.email}
                          onChange={(event) => updateGuestTraveller(index, 'email', event.target.value)}
                          placeholder="Optional"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
            <div className="itn-booking-summary">
              <div>
                <span>Package base</span>
                <strong>{priceLabel}</strong>
              </div>
              <div>
                <span>Travellers</span>
                <strong>{travellerLabel}</strong>
              </div>
              <div>
                <span>{taxLabel}</span>
                <strong>{taxAmountLabel}</strong>
              </div>
              <div>
                <span>Booking total</span>
                <strong>{packageTotalLabel}</strong>
              </div>
              <div>
                <span>{partialBookingEnabled ? `${duePercentLabel} due now` : 'Amount due now'}</span>
                <strong>{amountToPayLabel}</strong>
              </div>
              <div>
                <span>Remaining balance</span>
                <strong>{remainingAmountLabel}</strong>
              </div>
              <div>
                <span>Payment mode</span>
                <strong>{paymentModeLabel}</strong>
              </div>
              {isPartialPayment ? (
                <p>{duePercentLabel} is collected now. The remaining {remainingPercent}% ({remainingAmountLabel}) can be collected after confirmation as per travel policy.</p>
              ) : (
                <p>Full package amount is payable now. There will be no remaining balance after successful payment verification.</p>
              )}
            </div>
            {partialBookingEnabled ? (
              <section className="itn-booking-payment-choice" aria-label="Payment amount">
                <div className="itn-booking-section-title">
                  <span>Payment option</span>
                  <strong>Choose how much to pay now</strong>
                </div>
                <div className="itn-payment-options" role="radiogroup" aria-label="Choose booking payment amount">
                  <label className={isPartialPayment ? 'is-selected' : ''}>
                    <input
                      type="radio"
                      name="modal-payment-mode"
                      value="partial"
                      checked={isPartialPayment}
                      onChange={() => updatePaymentMode('partial')}
                    />
                    <span>Partial payment</span>
                    <strong>{bookingAmountLabel}</strong>
                    <small>{partialBookingPercentage}% now, {partialRemainingAmountLabel} later</small>
                  </label>
                  <label className={!isPartialPayment ? 'is-selected' : ''}>
                    <input
                      type="radio"
                      name="modal-payment-mode"
                      value="full"
                      checked={!isPartialPayment}
                      onChange={() => updatePaymentMode('full')}
                    />
                    <span>Full payment</span>
                    <strong>{packageTotalLabel}</strong>
                    <small>Pay 100% and keep zero balance</small>
                  </label>
                </div>
              </section>
            ) : null}
            {packageHotels.length ? (
              <section className="itn-booking-hotels" aria-label="Hotels included in this booking">
                <div className="itn-booking-section-title">
                  <span>Hotel stays</span>
                  <strong>{packageHotels.length} {packageHotels.length === 1 ? 'hotel' : 'hotels'} included</strong>
                </div>
                <div className="itn-booking-hotel-list">
                  {packageHotels.map((hotel) => {
                    const hotelStars = Math.max(0, Math.min(5, Math.round(Number(hotel?.starRating) || 0)));
                    const hotelRooms = Math.max(1, Number(hotel?.rooms) || 1);
                    const hotelNights = Math.max(1, Number(hotel?.nights) || 1);
                    const hotelPrice = Number(hotel?.pricePerNight) || 0;
                    const hotelPriceLabel = hotelPrice > 0 ? `Rs ${hotelPrice.toLocaleString('en-IN')}` : 'Included';

                    return (
                      <article className="itn-booking-hotel" key={`booking-hotel-${hotel.key}`}>
                        <Image src={getMediaUrl(hotel?.image) || fallbackImage} alt="" width={96} height={72} />
                        <div>
                          <span>{hotel.destinationName}</span>
                          <strong>{hotel.name}</strong>
                          <p>
                            <b>{'★'.repeat(hotelStars) || 'No star rating'}</b>
                            {Number(hotel?.guestRating) ? ` ${Number(hotel.guestRating).toFixed(1)} guest rating` : ''}
                          </p>
                        </div>
                        <ul>
                          <li>{hotelRooms} {hotelRooms === 1 ? 'room' : 'rooms'}</li>
                          <li>{hotelNights} {hotelNights === 1 ? 'night' : 'nights'}</li>
                          <li>{hotelPriceLabel} / night</li>
                        </ul>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
            <div className="itn-booking-breakdown">
              <div><span>Per traveller price</span><strong>{unitPriceLabel}</strong></div>
              <div><span>Travellers</span><strong>{travellerLabel}</strong></div>
              <div><span>Base package</span><strong>{priceLabel}</strong></div>
              {couponDiscountAmount > 0 ? <div><span>Original package</span><strong>{originalPriceLabel}</strong></div> : null}
              {couponDiscountAmount > 0 ? <div><span>Coupon discount</span><strong>{couponDiscountLabel}</strong></div> : null}
              <div><span>{taxLabel}</span><strong>{taxAmountLabel}</strong></div>
              <div><span>Booking total</span><strong>{packageTotalLabel}</strong></div>
              {couponCode ? <div><span>Coupon code</span><strong>{couponCode}</strong></div> : null}
              <div><span>Payable now</span><strong>{amountToPayLabel}</strong></div>
              <div><span>Balance later</span><strong>{remainingAmountLabel}</strong></div>
              <div><span>Payment gateway fee</span><strong>Added by gateway if applicable</strong></div>
            </div>
            <div className="itn-booking-form">
              <label>
                Lead traveller name
                <input
                  type="text"
                  value={bookingForm.name}
                  onChange={(event) => updateBookingField('name', event.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label>
                Lead traveller email
                <input
                  type="email"
                  value={bookingForm.email}
                  onChange={(event) => updateBookingField('email', event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Lead traveller phone
                <input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(event) => updateBookingField('phone', event.target.value)}
                  placeholder="Phone number"
                />
              </label>
              <label>
                Coupon code optional
                <span className="itn-coupon-field">
                  <span className="itn-coupon-row">
                    <input
                      type="text"
                      value={bookingForm.couponCode}
                      onChange={(event) => updateBookingField('couponCode', event.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      disabled={!couponCode || couponValidating}
                      onClick={validateCouponCode}
                    >
                      {couponValidating ? 'Checking' : 'Apply'}
                    </button>
                  </span>
                  {couponMessage ? <span className="itn-coupon-note">{couponMessage}</span> : null}
                  {couponError ? <span className="itn-coupon-error">{couponError}</span> : null}
                </span>
              </label>
              <label>
                Notes optional
                <textarea
                  value={bookingForm.notes}
                  onChange={(event) => updateBookingField('notes', event.target.value)}
                  placeholder="Meal preference, pickup request, room preference, or anything we should know"
                />
              </label>
            </div>
            {paymentError ? <div className="itn-booking-error">{paymentError}</div> : null}
            {paymentMessage ? <div className="itn-booking-message">{paymentMessage}</div> : null}
            {bookingResultData ? (
              <div className="itn-booking-result">
                <div className="itn-booking-result-head">
                  <span>Booking response</span>
                  <strong>{bookingResultData.booking_reference || bookingResultData.id || 'Booking recorded'}</strong>
                </div>
                <div className="itn-booking-result-grid">
                  <div>
                    <span>Package</span>
                    <strong>{bookingResultData.package_name || pkg.name}</strong>
                  </div>
                  <div>
                    <span>Payment status</span>
                    <strong>{bookingResultData.payment_status || 'payment_verified'}</strong>
                  </div>
                  <div>
                    <span>Paid amount</span>
                    <strong>Rs {Number(bookingResultAmounts.paid_amount || amountToPay).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span>Remaining</span>
                    <strong>Rs {Number(bookingResultAmounts.remaining_amount || remainingAmount).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span>Accounting</span>
                    <strong>{bookingResultData.accounting_status || 'recorded'}</strong>
                  </div>
                  <div>
                    <span>Payment ID</span>
                    <strong>{bookingResultData.razorpay_payment_id || 'Verified'}</strong>
                  </div>
                </div>
                <p>{bookingResult?.message || 'Booking created successfully.'} Redirecting to homepage in a few seconds.</p>
              </div>
            ) : null}
            <div className="itn-booking-actions">
              <button type="button" onClick={() => setBookingModalOpen(false)} disabled={paymentProcessing}>
                Not now
              </button>
              <button type="button" onClick={startRazorpayPayment} disabled={paymentProcessing || !amountToPay}>
                {paymentProcessing ? 'Please wait...' : `Pay ${amountToPayLabel}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {loginPromptOpen ? (
        <div className="itn-booking-modal" role="dialog" aria-modal="true" aria-label="Login required">
          <div className="itn-login-panel">
            <button type="button" className="itn-booking-close" onClick={() => setLoginPromptOpen(false)} aria-label="Close login prompt">
              x
            </button>
            <div className="itn-booking-hero">
              <span>Login required</span>
              <h2>Sign in to book this package</h2>
              <p>Your booking amount and package details will be attached to your customer account.</p>
            </div>
            <div className="itn-login-copy">
              <strong>{amountToPayLabel}</strong>
              <span>{isPartialPayment ? `${duePercentLabel} of ${packageTotalLabel} due now` : 'Full amount due now'}</span>
              <p>After login, you will return to this itinerary and can continue payment securely with Razorpay.</p>
            </div>
            <div className="itn-booking-actions">
              <button type="button" onClick={() => setLoginPromptOpen(false)}>Not now</button>
              <Link href={`/auth/login?redirect=${encodeURIComponent(loginRedirectUrl)}`}>
                Login to continue
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <ItineraryStyles />
    </div>
  );
}
