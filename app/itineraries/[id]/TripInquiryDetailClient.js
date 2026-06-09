'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getCrmPipelineForm, getMediaUrl, getTripInquiryById, getTripInquiryReviews, submitTripInquiryReview } from '@/utils/api';

const fallbackImage = 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80';

const titleCase = (value) =>
  String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getDurationCopy = (duration) => {
  const firstNumber = Number(String(duration || '').match(/\d+/)?.[0]) || 3;
  const nights = Math.max(firstNumber - 1, 1);
  return `${nights}N/${firstNumber}D`;
};

const getPriceLabel = (trip) => {
  const amount = Number(trip?.total_amount || trip?.base_price || 0);
  return amount > 0 ? `Rs ${amount.toLocaleString('en-IN')}` : 'On request';
};

const CUSTOMIZE_INQUIRY_PIPELINE_ID = 6;

const normalizePipelineFields = (formConfig) => {
  if (!formConfig?.fields?.length) return [];

  return [...formConfig.fields]
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map((field) => ({
      id: field.id,
      label: field.label || field.field_key,
      fieldKey: field.field_key,
      fieldType: String(field.field_type || 'text').toLowerCase(),
      options: Array.isArray(field.options) ? field.options : [],
      isRequired: Boolean(field.is_required),
    }))
    .filter((field) => field.fieldKey);
};

const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(String(url || ''));

const normalizeMediaItem = (item, trip, index) => {
  const rawUrl = typeof item === 'string' ? item : item?.url || item?.feature_image;
  const url = getMediaUrl(rawUrl);

  if (!url) return null;

  const mediaType = typeof item === 'object' ? item.media_type || item.type : '';
  const type = mediaType === 'video' || isVideoUrl(url) ? 'video' : 'image';

  return {
    id: typeof item === 'object' && item?.id ? item.id : `${url}-${index}`,
    type,
    url,
    poster: getMediaUrl(typeof item === 'object' ? item.poster_url : ''),
    alt:
      (typeof item === 'object' && (item.alt_text || item.label)) ||
      trip?.destination_info?.feature_image_alt ||
      trip?.destination ||
      'Trip media',
  };
};

const getTripMedia = (trip) => {
  const rawMedia = [
    trip?.destination_info?.feature_image
      ? {
        id: 'feature',
        url: trip.destination_info.feature_image,
        media_type: 'image',
        alt_text: trip.destination_info.feature_image_alt,
      }
      : null,
    ...(Array.isArray(trip?.gallery) ? trip.gallery : []),
    ...(Array.isArray(trip?.destination_gallery) ? trip.destination_gallery : []),
    ...(Array.isArray(trip?.destination_info?.gallery) ? trip.destination_info.gallery : []),
    ...(Array.isArray(trip?.cities) ? trip.cities.flatMap((city) => city.gallery || []) : []),
  ].filter(Boolean);

  const all = rawMedia
    .map((item, index) => normalizeMediaItem(item, trip, index))
    .filter(Boolean)
    .filter((item, index, list) => list.findIndex((candidate) => candidate.url === item.url) === index);

  const images = all.filter((item) => item.type === 'image');
  const videos = all.filter((item) => item.type === 'video');
  const safeImages = images.length ? images : [{ id: 'fallback', type: 'image', url: fallbackImage, alt: 'Trip image' }];

  return {
    images: safeImages,
    videos,
    all: [...safeImages, ...videos],
  };
};

const getCityActivities = (city, trip) => {
  const fromCity = Array.isArray(city?.activities) ? city.activities : [];
  const fromDestination = Array.isArray(trip?.destination_info?.activities_data) ? trip.destination_info.activities_data : [];
  return fromCity.length ? fromCity : fromDestination;
};

const getActivityImage = (activity, city, trip) =>
  getMediaUrl(activity?.image || activity?.feature_image || activity?.url) ||
  getMediaUrl(city?.feature_image || city?.image || city?.gallery?.[0]?.url || city?.gallery?.[0]?.feature_image) ||
  getMediaUrl(trip?.destination_info?.feature_image);

const getActivityTitle = (activity) =>
  activity?.name || activity?.title || activity?.location || 'Planned experience';

const getActivityDescription = (activity) =>
  activity?.description || activity?.subtitle || activity?.details || activity?.location || 'Curated activity for this day.';

const getCityNightCount = (city, rowCount) => {
  const explicitNights = Number(city?.nights || city?.night_count || city?.duration_nights);
  return explicitNights > 0 ? explicitNights : Math.max(rowCount - 1, 1);
};

function LoadingView() {
  return (
    <main className="bi-page">
      <div className="bi-container">
        <div className="bi-skeleton bi-skeleton-title" />
        <div className="bi-skeleton bi-skeleton-gallery" />
      </div>
      <BookedItineraryStyles />
    </main>
  );
}

function ActivityCell({ activity, city, trip, index }) {
  const image = getActivityImage(activity, city, trip);
  const time = activity?.time || activity?.duration || activity?.slot || (index === 0 ? 'Full day' : 'Activity');
  const title = getActivityTitle(activity);
  const description = getActivityDescription(activity);

  return (
    <div className="bi-activity">
      {image ? (
        <span className="bi-activity-photo">
          <Image src={image} alt="" width={34} height={34} />
        </span>
      ) : (
        <span className="bi-activity-dot">{index + 1}</span>
      )}
      <div>
        <small>{time}</small>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

function DayRow({ day, activities, city, trip }) {
  const safeActivities = activities?.length
    ? activities
    : [{ time: 'Full day', location: 'At leisure', description: 'Time to explore the destination at your own pace.' }];

  return (
    <div className="bi-day-row">
      <div className="bi-day-label">Day {String(day).padStart(2, '0')}</div>
      <div className="bi-day-cells" data-count={Math.min(safeActivities.length, 3)}>
        {safeActivities.map((activity, index) => (
          <ActivityCell
            key={`${day}-${activity.id || activity.time || activity.name || activity.location || index}-${index}`}
            activity={activity}
            city={city}
            trip={trip}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function CityItinerary({ city, startDay, trip, showTemperature }) {
  const activities = getCityActivities(city, trip);
  const rowCount = Math.max(activities.length, 1);
  const nightCount = getCityNightCount(city, rowCount);

  return (
    <div className="bi-city-card">
      <div className="bi-city-head">
        <strong>{titleCase(city?.name || trip?.destination)}</strong>
        <span>- {nightCount} {nightCount === 1 ? 'Night' : 'Nights'}</span>
        {showTemperature || city?.temperature || city?.high_temperature || city?.low_temperature ? (
          <>
            <span>- Temperature</span>
            <span className="bi-temp">
              High: {city?.high_temperature || city?.temperature?.high || '30'}&deg;C
              <i />
              Low: {city?.low_temperature || city?.temperature?.low || '26'}&deg;C
            </span>
          </>
        ) : null}
      </div>
      {Array.from({ length: rowCount }).map((_, index) => {
        const entry = activities.find((item) => Number(item.dayNumber) === index + 1) || activities[index];
        return (
          <DayRow
            key={`${city?.id || city?.name || 'city'}-${index}`}
            day={startDay + index}
            activities={entry?.activities || []}
            city={city}
            trip={trip}
          />
        );
      })}
    </div>
  );
}

function TransferConnector({ destinationName }) {
  return (
    <div className="bi-transfer-bridge" aria-label={`Transfer to ${destinationName}`}>
      <svg viewBox="0 0 330 86" preserveAspectRatio="none" aria-hidden="true">
        <path d="M70 0 C70 38 165 24 165 45 C165 66 260 48 260 86" />
      </svg>
      <span className="bi-transfer-dot bi-transfer-dot-start" aria-hidden="true" />
      <span className="bi-transfer-dot bi-transfer-dot-end" aria-hidden="true" />
      <span className="bi-transfer-icon" aria-hidden="true" />
      <p>Get transferred to {destinationName}</p>
    </div>
  );
}

function BookedItineraryStyles() {
  return (
    <style jsx global>{`
      .bi-page { background: #fff; padding: 112px 0 80px; color: var(--color-text-primary); font-family: var(--font-inter), Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.55; text-rendering: geometricPrecision; }
      .bi-container { width: min(100%, 1160px); margin: 0 auto; padding: 0 22px; }
      .bi-title { padding: 18px 0 16px; }
      .bi-title p { margin: 0 0 7px; color: var(--color-primary); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .45px; }
      .bi-title h1 { margin: 0; font-family: var(--font-poppins), Poppins, sans-serif; font-size: clamp(32px, 4vw, 44px); font-weight: 800; letter-spacing: 0; line-height: 1.08; }
      .bi-title-summary { max-width: 720px; margin-top: 13px; color: #526173; font-size: 15px; font-weight: 400; line-height: 1.72; }
      .bi-route-ribbon { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
      .bi-route-ribbon span { padding: 8px 13px; border: 1px solid var(--color-border); border-radius: 999px; background: #fff; color: #263445; font-size: 13px; font-weight: 700; box-shadow: var(--shadow-xs); }
      .bi-tabs { display: flex; gap: 28px; border-bottom: 1px solid var(--color-border); margin-bottom: 24px; overflow-x: auto; }
      .bi-tabs a { padding: 12px 0; font-size: 14px; font-weight: 700; color: var(--color-text-secondary); border-bottom: 3px solid transparent; white-space: nowrap; }
      .bi-tabs a.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
      .bi-gallery { display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 150px 150px; gap: 8px; overflow: hidden; border-radius: 8px; margin-bottom: 42px; }
      .bi-gallery img { width: 100%; height: 100%; object-fit: cover; background: var(--color-bg-soft); }
      .bi-gallery-main { grid-row: span 2; }
      .bi-video-tile { grid-row: span 2; position: relative; display: grid; place-items: center; align-content: center; gap: 12px; overflow: hidden; text-align: center; color: #fff; background: linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 82%, #111827), #111827); }
      .bi-video-tile::before { content: ''; position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(15, 23, 42, .14), rgba(15, 23, 42, .64)); }
      .bi-video-tile video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .bi-video-tile strong, .bi-video-tile button, .bi-play-badge { position: relative; z-index: 2; }
      .bi-play-badge { width: 58px; height: 58px; border: 1px solid rgba(255,255,255,.42); border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.2); box-shadow: 0 16px 42px rgba(15, 23, 42, .24); font-size: 12px; font-weight: 800; backdrop-filter: blur(8px); }
      .bi-video-tile button, .bi-more { border: 1px solid var(--color-primary); color: var(--color-primary); background: #fff; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 800; }
      .bi-media-modal { position: fixed; inset: 0; z-index: 500; display: grid; place-items: center; padding: 24px; background: rgba(15, 23, 42, .72); backdrop-filter: blur(10px); }
      .bi-media-panel { width: min(100%, 1040px); max-height: min(86vh, 820px); overflow: hidden; border-radius: 14px; background: #fff; box-shadow: 0 28px 90px rgba(15, 23, 42, .38); }
      .bi-media-head { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 20px; border-bottom: 1px solid var(--color-border); }
      .bi-media-head h3 { margin: 0; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 20px; font-weight: 800; }
      .bi-media-head button { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: var(--color-bg-soft); color: var(--color-text-primary); font-size: 22px; font-weight: 800; }
      .bi-media-grid { max-height: calc(min(86vh, 820px) - 76px); overflow: auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; padding: 18px; }
      .bi-media-item { overflow: hidden; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-bg-soft); box-shadow: var(--shadow-xs); }
      .bi-media-item img, .bi-media-item video { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
      .bi-media-item video { background: #020617; }
      .bi-media-caption { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; color: var(--color-text-secondary); font-size: 12px; font-weight: 700; }
      .bi-media-caption span { color: var(--color-primary); text-transform: uppercase; letter-spacing: .6px; }
      .bi-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 48px; align-items: start; }
      .bi-section h2 { margin: 0 0 20px; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 19px; font-weight: 700; letter-spacing: 0; }
      .bi-section h2::after { content: ''; display: block; width: 42px; height: 3px; margin-top: 8px; border-radius: 999px; background: var(--gradient-primary); }
      .bi-proof-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; margin-bottom: 46px; }
      .bi-proof { display: grid; grid-template-columns: 30px 1fr; gap: 12px; }
      .bi-proof > span { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--color-primary-light); color: var(--color-primary); font-weight: 900; }
      .bi-proof strong { color: #263445; font-size: 14px; font-weight: 700; }
      .bi-proof p, .bi-review p { margin: 4px 0 0; color: #5e6a78; font-size: 13px; font-weight: 400; line-height: 1.6; }
      .bi-itinerary-wrap { max-width: 860px; position: relative; padding-left: 8px; }
      .bi-itinerary-wrap::before { content: ''; position: absolute; left: -18px; top: 20px; bottom: 18px; width: 3px; border-radius: 999px; background: linear-gradient(180deg, #b9dcf5, color-mix(in srgb, var(--color-primary) 14%, transparent)); opacity: .7; }
      .bi-city-card { border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 18px 46px rgba(15, 23, 42, .07); }
      .bi-city-head { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; min-height: 64px; background: linear-gradient(90deg, #cfeeff 0%, #e9f6ff 100%); padding: 15px 19px; color: #334155; font-size: 15px; }
      .bi-city-head strong { font-family: var(--font-poppins), Poppins, sans-serif; font-size: 21px; font-weight: 800; color: #243746; letter-spacing: 0; }
      .bi-city-head span { color: #43566a; font-size: 15px; font-weight: 700; }
      .bi-temp { display: inline-flex; align-items: center; gap: 8px; margin-left: 4px; padding: 3px 10px; border: 1px solid var(--color-primary); border-radius: 999px; background: #fff; color: #0f172a !important; font-size: 12px; font-weight: 900 !important; white-space: nowrap; }
      .bi-temp i { width: 3px; height: 3px; border-radius: 50%; background: #9ca3af; }
      .bi-day-row { display: grid; grid-template-columns: 82px 1fr; min-height: 88px; border-top: 1px solid #cbd5e1; }
      .bi-day-label { padding: 18px 14px; color: #475569; font-size: 15px; font-weight: 500; border-right: 1px solid #cbd5e1; background: #fff; white-space: nowrap; }
      .bi-day-cells { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .bi-day-cells[data-count="1"] { grid-template-columns: 1fr; }
      .bi-day-cells[data-count="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .bi-activity { display: grid; grid-template-columns: 34px 1fr; gap: 12px; min-height: 106px; padding: 20px 18px; border-right: 1px solid #cbd5e1; background: linear-gradient(180deg, #fff 0%, #fbfdff 100%); transition: background var(--transition-fast); }
      .bi-activity:hover { background: #f5fbff; }
      .bi-activity:last-child { border-right: 0; }
      .bi-activity-dot, .bi-activity-photo { width: 32px; height: 32px; margin-top: 1px; border-radius: 50%; display: grid; place-items: center; overflow: hidden; background: #6b7280; color: #fff; font-size: 11px; font-weight: 900; box-shadow: 0 1px 0 rgba(15, 23, 42, .08); }
      .bi-activity-photo img { width: 100%; height: 100%; object-fit: cover; }
      .bi-activity small { display: block; color: #142967; font-size: 9px; font-weight: 800; text-transform: uppercase; line-height: 1.1; letter-spacing: .18px; }
      .bi-activity strong { display: block; margin-top: 8px; color: #020617; font-size: 16px; font-weight: 700; line-height: 1.28; }
      .bi-activity p { margin: 4px 0 0; color: #1f3655; font-size: 13px; font-weight: 400; line-height: 1.42; }
      .bi-transfer-bridge { position: relative; height: 98px; max-width: 380px; margin: -1px auto 0; color: #0f172a; text-align: center; }
      .bi-transfer-bridge svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .bi-transfer-bridge path { fill: none; stroke: #d0d0d0; stroke-width: 4; stroke-linecap: round; }
      .bi-transfer-dot { position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #aaa; transform: translate(-50%, -50%); }
      .bi-transfer-dot-start { left: 21%; top: 0; }
      .bi-transfer-dot-end { left: 79%; top: 100%; }
      .bi-transfer-icon { position: absolute; left: 50%; top: 39px; transform: translate(-50%, -50%); width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: #4f5878; color: #fff; }
      .bi-transfer-icon::before { content: ''; width: 15px; height: 8px; border: 2px solid currentColor; border-radius: 5px 5px 3px 3px; }
      .bi-transfer-icon::after { content: ''; position: absolute; width: 19px; height: 2px; background: currentColor; border-radius: 999px; transform: translateY(8px); }
      .bi-transfer-bridge p { position: absolute; left: 50%; bottom: 14px; width: max-content; max-width: min(380px, 82vw); transform: translateX(-50%); margin: 0; color: #111827; font-size: 15px; font-weight: 600; }
      .bi-sidebar { position: sticky; top: 92px; display: grid; gap: 20px; }
      .bi-card, .bi-rating, .bi-whatsapp { border: 1px solid var(--color-border); border-radius: 8px; background: #fff; box-shadow: var(--shadow-sm); }
      .bi-price-card { position: relative; overflow: hidden; display: grid; gap: 16px; padding: 18px; border-color: color-mix(in srgb, var(--color-primary) 24%, var(--color-border)); background: linear-gradient(135deg, #fff 0%, #f3faff 62%, color-mix(in srgb, var(--color-primary-light) 42%, #fff) 100%); }
      .bi-price-card::before { content: ''; position: absolute; right: -38px; top: -48px; width: 128px; height: 128px; border-radius: 50%; background: color-mix(in srgb, var(--color-primary) 12%, transparent); }
      .bi-price-card::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--gradient-primary); }
      .bi-price-card > div, .bi-price-card button { position: relative; z-index: 1; }
      .bi-price-card span { color: var(--color-primary); font-size: 11px; font-weight: 800; letter-spacing: .55px; text-transform: uppercase; }
      .bi-price-card strong { color: var(--color-text-primary); font-family: var(--font-poppins), Poppins, sans-serif; font-size: 28px; font-weight: 800; line-height: 1.05; }
      .bi-price-card small { color: var(--color-text-secondary); font-size: 12px; font-weight: 600; }
      .bi-price-card button, .bi-unlock button { width: 100%; padding: 14px 16px; border-radius: 8px; background: var(--gradient-primary); color: #fff; font-size: 14px; font-weight: 800; }
      .bi-unlock { padding: 22px; text-align: center; }
      .bi-unlock a { color: var(--color-primary); font-size: 12px; font-weight: 800; }
      .bi-unlock button { margin-top: 18px; }
      .bi-whatsapp { position: relative; min-height: 78px; display: grid; grid-template-columns: 48px 1fr 28px; align-items: center; gap: 12px; padding: 15px 16px; overflow: hidden; text-align: left; background: linear-gradient(135deg, #fff 0%, #f3faff 100%); border-color: color-mix(in srgb, var(--color-primary) 18%, var(--color-border)); }
      .bi-whatsapp::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #25d366; }
      .bi-whatsapp-icon { position: relative; z-index: 1; width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: #25d366; color: #fff; font-size: 24px; font-weight: 900; }
      .bi-whatsapp-copy { position: relative; z-index: 1; display: grid; gap: 3px; min-width: 0; line-height: 1.15; }
      .bi-whatsapp-copy span { color: var(--color-primary); font-size: 10px; font-weight: 800; letter-spacing: .55px; text-transform: uppercase; }
      .bi-whatsapp-copy strong { color: var(--color-text-primary); font-family: var(--font-poppins), Poppins, sans-serif; font-size: 15px; font-weight: 700; }
      .bi-whatsapp-arrow { position: relative; z-index: 1; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--color-primary); color: #fff; font-size: 16px; font-weight: 900; }
      .bi-route { overflow: hidden; padding: 0; border-color: #e3e7ec; border-radius: 10px; box-shadow: 0 16px 42px rgba(15, 23, 42, .07); }
      .bi-route h3 { margin: 0; padding: 16px 18px 15px; border-bottom: 1px solid #eef1f4; color: #7b7f86; font-size: 12px; font-weight: 800; line-height: 1; text-align: center; text-transform: uppercase; letter-spacing: .35px; }
      .bi-route-timeline { position: relative; display: grid; padding: 18px 18px 20px; background: linear-gradient(180deg, #fff 0%, #fcfdff 100%); }
      .bi-route-group { display: contents; }
      .bi-route-step { position: relative; display: grid; grid-template-columns: 42px 1fr; align-items: center; min-height: 36px; }
      .bi-route-step + .bi-route-step, .bi-route-group + .bi-route-step { margin-top: 2px; }
      .bi-route-rail { position: absolute; left: 21px; top: 0; bottom: 0; width: 1px; background: #d8dde4; }
      .bi-route-step:first-child .bi-route-rail { top: 16px; }
      .bi-route-step:last-child .bi-route-rail { bottom: 16px; }
      .bi-route-dot { position: relative; z-index: 1; justify-self: center; width: 10px; height: 10px; border-radius: 50%; background: #aeb4bc; box-shadow: 0 0 0 4px #fff; }
      .bi-route-icon { position: relative; z-index: 1; justify-self: center; width: 18px; height: 18px; border-radius: 50%; background: #fff; color: #6b7280; box-shadow: 0 0 0 3px #fff; }
      .bi-route-icon.is-plane::before { content: ''; position: absolute; left: 3px; top: 8px; width: 12px; height: 2px; border-radius: 999px; background: currentColor; transform: rotate(-38deg); }
      .bi-route-icon.is-plane::after { content: ''; position: absolute; left: 7px; top: 4px; width: 6px; height: 10px; border-top: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(-38deg); }
      .bi-route-icon.is-transfer::before, .bi-route-icon.is-transfer::after { content: ''; position: absolute; left: 4px; top: 8px; width: 10px; height: 2px; border-radius: 999px; background: currentColor; }
      .bi-route-icon.is-transfer::after { transform: rotate(90deg); }
      .bi-route-step p { margin: 0; color: #767b82; font-size: 13px; font-weight: 400; line-height: 1.35; }
      .bi-route-step strong { color: #555b64; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 17px; font-weight: 600; line-height: 1.25; letter-spacing: 0; }
      .bi-route-step.is-city { min-height: 40px; }
      .bi-route-step.is-note { min-height: 34px; }
      .bi-list { padding: 18px; border-color: #e7ebef; box-shadow: 0 12px 30px rgba(15, 23, 42, .05); }
      .bi-list h3 { margin: 0 0 14px; color: #737982; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .35px; text-align: center; }
      .bi-list ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 11px; }
      .bi-list li { display: grid; grid-template-columns: 20px 1fr; gap: 8px; color: #475569; font-size: 13px; font-weight: 500; line-height: 1.4; }
      .bi-list li span { color: var(--color-primary); font-size: 14px; font-weight: 900; }
      .bi-actions { overflow: hidden; border-color: #e7ebef; box-shadow: 0 12px 30px rgba(15, 23, 42, .05); }
      .bi-actions button { display: block; width: 100%; padding: 13px 16px; border-bottom: 1px solid #eef1f4; color: #53606d; text-align: left; font-size: 13px; font-weight: 700; }
      .bi-actions button:last-child { border-bottom: 0; }
      .bi-rating { padding: 26px; text-align: center; }
      .bi-rating strong { display: block; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 44px; font-weight: 800; line-height: 1; }
      .bi-rating span, .bi-stars { color: #f7b500; font-weight: 900; }
      .bi-rating p { margin: 6px 0 0; color: var(--color-text-secondary); font-size: 13px; font-weight: 700; }
      .bi-reviews { margin-top: 90px; }
      .bi-review-form { display: grid; gap: 14px; margin: 0 0 22px; padding: 18px; border: 1px solid var(--color-border); border-radius: 8px; background: #fbfdff; box-shadow: var(--shadow-sm); }
      .bi-review-form-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
      .bi-review-form-head strong { font-size: 16px; font-weight: 900; color: var(--color-text-primary); }
      .bi-review-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .bi-review-form label { display: grid; gap: 6px; color: #475569; font-size: 12px; font-weight: 900; }
      .bi-review-form input, .bi-review-form select, .bi-review-form textarea { width: 100%; border: 1px solid #d8e2ee; border-radius: 8px; background: #fff; color: #0f172a; font: inherit; font-size: 13px; outline: none; }
      .bi-review-form input, .bi-review-form select { height: 42px; padding: 0 12px; }
      .bi-review-form textarea { min-height: 96px; padding: 12px; resize: vertical; }
      .bi-review-form .is-wide { grid-column: 1 / -1; }
      .bi-review-form button { justify-self: start; min-height: 42px; padding: 0 16px; border-radius: 8px; background: var(--gradient-primary); color: #fff; font-size: 13px; font-weight: 900; }
      .bi-review-message { margin: 0; padding: 10px 12px; border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4; color: #15803d; font-size: 12px; font-weight: 900; }
      .bi-inquiry-modal { position: fixed; inset: 0; z-index: 520; display: grid; place-items: center; padding: 22px; background: rgba(15, 23, 42, .68); backdrop-filter: blur(10px); }
      .bi-inquiry-panel { width: min(100%, 560px); max-height: min(88vh, 760px); overflow: auto; border: 1px solid #dbe7f3; border-radius: 10px; background: #fff; box-shadow: 0 28px 90px rgba(15, 23, 42, .34); }
      .bi-inquiry-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 16px; border-bottom: 1px solid #edf3f9; }
      .bi-inquiry-head span { color: var(--color-primary); font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .55px; }
      .bi-inquiry-head h2 { margin: 3px 0 0; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 22px; font-weight: 900; line-height: 1.15; }
      .bi-inquiry-close { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 8px; background: #eef4f9; color: #0f172a; font-size: 20px; font-weight: 900; }
      .bi-inquiry-form { display: grid; gap: 13px; padding: 20px 22px 22px; }
      .bi-inquiry-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .bi-inquiry-form label { display: grid; gap: 7px; color: #334155; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .35px; }
      .bi-inquiry-form label.is-wide { grid-column: 1 / -1; }
      .bi-inquiry-form input, .bi-inquiry-form select, .bi-inquiry-form textarea { width: 100%; border: 1px solid #d8e2ee; border-radius: 8px; background: #fff; color: #0f172a; font: inherit; font-size: 14px; font-weight: 700; outline: none; }
      .bi-inquiry-form input, .bi-inquiry-form select { height: 44px; padding: 0 12px; }
      .bi-inquiry-form textarea { min-height: 108px; padding: 12px; resize: vertical; line-height: 1.45; text-transform: none; letter-spacing: 0; }
      .bi-inquiry-form input:focus, .bi-inquiry-form select:focus, .bi-inquiry-form textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent); }
      .bi-inquiry-trip { display: grid; gap: 6px; padding: 13px 14px; border: 1px solid #dbe7f3; border-radius: 8px; background: #f8fbff; color: #475569; font-size: 12px; font-weight: 800; }
      .bi-inquiry-trip strong { color: #0f172a; font-size: 14px; font-weight: 900; }
      .bi-inquiry-submit { min-height: 46px; border-radius: 8px; background: var(--gradient-primary); color: #fff; font-size: 14px; font-weight: 900; }
      .bi-inquiry-submit:disabled { opacity: .65; cursor: not-allowed; }
      .bi-inquiry-message, .bi-inquiry-error { margin: 0; padding: 10px 12px; border-radius: 8px; font-size: 12px; font-weight: 900; line-height: 1.45; }
      .bi-inquiry-message { border: 1px solid #bbf7d0; background: #f0fdf4; color: #15803d; }
      .bi-inquiry-error { border: 1px solid #fecaca; background: #fff1f2; color: #b91c1c; }
      .bi-review { display: grid; grid-template-columns: 54px 1fr; gap: 14px; padding: 18px 0; border-bottom: 1px solid var(--color-border); }
      .bi-review-empty { margin: 0 0 10px; padding: 14px 16px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-soft); color: var(--color-text-secondary); font-size: 13px; font-weight: 800; }
      .bi-avatar { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: var(--gradient-warm); color: #fff; font-size: 22px; font-weight: 900; }
      .bi-stars span { margin-left: 8px; color: var(--color-text-secondary); font-size: 12px; }
      .bi-more { display: block; min-width: 280px; margin: 28px auto 0; }
      .bi-error { padding: 140px 22px 80px; max-width: 760px; margin: 0 auto; text-align: center; }
      .bi-error p { color: var(--color-text-secondary); margin-bottom: 24px; }
      .bi-skeleton { border-radius: 8px; background: linear-gradient(90deg, var(--color-border), var(--color-bg-soft), var(--color-border)); background-size: 300% 100%; animation: biPulse 1.4s infinite; }
      .bi-skeleton-title { width: min(100%, 620px); height: 44px; margin: 38px 0 20px; }
      .bi-skeleton-gallery { width: 100%; height: 308px; }
      @keyframes biPulse { to { background-position: -300% 0; } }
      @media (max-width: 991px) {
        .bi-layout { grid-template-columns: 1fr; gap: 32px; }
        .bi-sidebar { position: static; grid-row: 1; }
        .bi-gallery { grid-template-columns: 1fr 1fr; grid-template-rows: 240px 150px 150px; }
        .bi-gallery-main, .bi-video-tile { grid-column: span 2; grid-row: auto; }
      }
      @media (max-width: 700px) {
        .bi-page { padding-top: 92px; }
        .bi-gallery { display: block; }
        .bi-gallery img, .bi-gallery video, .bi-video-tile { height: 220px; margin-bottom: 8px; border-radius: 8px; }
        .bi-media-modal { padding: 12px; }
        .bi-media-panel { max-height: 88vh; border-radius: 10px; }
        .bi-media-grid { grid-template-columns: 1fr; max-height: calc(88vh - 76px); padding: 12px; }
        .bi-proof-grid, .bi-day-cells, .bi-day-cells[data-count="3"] { grid-template-columns: 1fr; }
        .bi-inquiry-grid { grid-template-columns: 1fr; }
        .bi-review-form-grid { grid-template-columns: 1fr; }
        .bi-day-row { grid-template-columns: 1fr; }
        .bi-day-label, .bi-activity { border-right: 0; }
        .bi-day-label { border-bottom: 1px solid #d4d9df; }
        .bi-activity { border-top: 1px solid #d4d9df; }
        .bi-city-head { flex-wrap: wrap; }
        .bi-transfer-bridge { height: 78px; max-width: 280px; }
        .bi-transfer-bridge p { bottom: 8px; font-size: 13px; }
      }
    `}</style>
  );
}

export default function TripInquiryDetailClient({ id }) {
  const [trip, setTrip] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [priceUnlocked, setPriceUnlocked] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryError, setInquiryError] = useState('');
  const [pipelineForm, setPipelineForm] = useState(null);
  const [pipelineFormLoading, setPipelineFormLoading] = useState(false);
  const [pipelineFormError, setPipelineFormError] = useState('');
  const [inquiryForm, setInquiryForm] = useState({});
  const [canAddReview, setCanAddReview] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [dynamicReviews, setDynamicReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    name: '',
    email: '',
    title: '',
    comment: '',
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      const data = await getTripInquiryById(id);

      if (!mounted) return;

      if (!data) {
        setError('Unable to load this itinerary right now.');
        setTrip(null);
      } else {
        setTrip(data);
        setInquiryForm((current) => ({
          ...current,
          name: current.name || data.customer_name || data.raw_payload?.customer?.name || '',
          email: current.email || data.customer_email || data.raw_payload?.customer?.email || '',
          phone: current.phone || data.customer_phone || data.raw_payload?.customer?.phone || '',
        }));
        setReviewForm((current) => ({
          ...current,
          name: current.name || data.customer_name || data.raw_payload?.customer?.name || '',
          email: current.email || data.customer_email || data.raw_payload?.customer?.email || '',
        }));
      }
      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      setReviewsLoading(true);
      const result = await getTripInquiryReviews({ inquiryId: id });

      if (!mounted) return;

      setDynamicReviews(result.reviews || []);
      setReviewsLoading(false);
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (loading || !trip || typeof window === 'undefined') return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const reviewAllowed = params.get('from') === 'dashboard' && params.get('review') === '1';

      setCanAddReview(reviewAllowed);
      if (window.location.hash === '#reviews') {
        if (reviewAllowed) setReviewFormOpen(true);
        document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [loading, trip]);

  useEffect(() => {
    let mounted = true;

    const loadCompanyInfo = async () => {
      try {
        const response = await fetch('/api/company-info', {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        const payload = await response.json();
        if (mounted && payload?.success) setCompany(payload.data);
      } catch {
        // Company details are decorative here, so fallback copy is enough.
      }
    };

    loadCompanyInfo();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mediaOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMediaOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mediaOpen]);

  useEffect(() => {
    if (!inquiryOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !inquirySubmitting) setInquiryOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [inquiryOpen, inquirySubmitting]);

  const media = useMemo(() => getTripMedia(trip), [trip]);
  const cities = trip?.cities?.length ? trip.cities : [{ name: trip?.destination, activities: trip?.destination_info?.activities_data || [] }];
  const destinationNames = cities.map((city) => titleCase(city?.name)).filter(Boolean);
  const tagItems = trip?.destination_info?.tags?.length ? trip.destination_info.tags : cities.flatMap((city) => city.tags || []);
  const activityCount = cities.reduce((count, city) => count + getCityActivities(city, trip).reduce((sum, day) => sum + (day.activities?.length || 0), 0), 0);

  if (loading) return <LoadingView />;

  if (error || !trip) {
    return (
      <main className="bi-page">
        <div className="bi-error">
          <h1>Itinerary unavailable</h1>
          <p>{error || 'We could not find this itinerary.'}</p>
          <Link href="/" className="btn-primary">Back to home</Link>
        </div>
        <BookedItineraryStyles />
      </main>
    );
  }

  const durationCopy = getDurationCopy(trip.duration);
  const priceLabel = getPriceLabel(trip);
  const companyName = company?.companyName || company?.legalName || company?.brandName || company?.displayName || 'Travel Holiday';
  const routeStart = titleCase(trip.departure_city || destinationNames[0] || trip.destination || 'Your city');
  const routeEnd = destinationNames[destinationNames.length - 1] || titleCase(trip.destination || 'Destination');
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const itinerarySummary = cities.map((city, cityIndex) => {
    const activities = getCityActivities(city, trip);
    const rowCount = Math.max(activities.length, 1);
    const startDay = cities.slice(0, cityIndex).reduce((total, previousCity) => {
      return total + Math.max(getCityActivities(previousCity, trip).length, 1);
    }, 1);
    const nightCount = getCityNightCount(city, rowCount);
    const cityName = titleCase(city?.name || trip.destination);
    const cityLines = [`${cityName} - ${nightCount} ${nightCount === 1 ? 'Night' : 'Nights'}`];

    Array.from({ length: rowCount }).forEach((_, dayIndex) => {
      const entry = activities.find((item) => Number(item.dayNumber) === dayIndex + 1) || activities[dayIndex];
      const dayActivities = entry?.activities?.length
        ? entry.activities
        : [{ time: 'Full day', name: 'At leisure', description: 'Time to explore the destination at your own pace.' }];
      const activityText = dayActivities
        .map((activity) => {
          const time = activity?.time || activity?.duration || activity?.slot || 'Activity';
          const title = getActivityTitle(activity);
          const description = getActivityDescription(activity);
          return `${time} - ${title}${description ? `: ${description}` : ''}`;
        })
        .join('; ');

      cityLines.push(`Day ${String(startDay + dayIndex).padStart(2, '0')}: ${activityText}`);
    });

    if (cityIndex < cities.length - 1) {
      cityLines.push(`Transfer to ${titleCase(cities[cityIndex + 1]?.name || trip.destination || 'next destination')}`);
    }

    return cityLines.join('\n');
  }).join('\n\n');
  const whatsappNumber = String(company?.contact?.whatsapp || company?.contact?.phone || '').replace(/[^\d]/g, '');
  const whatsappUrl = whatsappNumber
    ? `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(`I want help with itinerary ${trip.id}: ${currentUrl}`)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(`I want help with itinerary ${trip.id}: ${currentUrl}`)}`;
  const mailQuote = () => {
    window.location.assign(`mailto:?subject=${encodeURIComponent(`Quote request: ${trip.destination}`)}&body=${encodeURIComponent(`Please mail me the quote for itinerary ${trip.id}.\n${currentUrl}`)}`);
  };
  const printItinerary = () => {
    document.title = `${trip.destination} Itinerary`;
    window.print();
  };
  const getInquiryPrefill = () => ({
    name: inquiryForm.name || trip.customer_name || trip.raw_payload?.customer?.name || '',
    email: inquiryForm.email || trip.customer_email || trip.raw_payload?.customer?.email || '',
    phone: inquiryForm.phone || trip.customer_phone || trip.raw_payload?.customer?.phone || '',
    custom_package_title: inquiryForm.custom_package_title || `${titleCase(trip.destination)} itinerary`,
    custom_package_id: currentUrl || inquiryForm.custom_package_id ,
    itenary: inquiryForm.itenary || itinerarySummary,
  });
  const openInquiryForm = async () => {
    setInquiryMessage('');
    setInquiryError('');
    setInquiryOpen(true);

    if (!pipelineForm) {
      setPipelineFormLoading(true);
      setPipelineFormError('');
      const formConfig = await getCrmPipelineForm(CUSTOMIZE_INQUIRY_PIPELINE_ID);
      setPipelineFormLoading(false);

      if (formConfig?.fields?.length) {
        setPipelineForm(formConfig);
        const prefill = getInquiryPrefill();
        setInquiryForm((current) => ({
          ...prefill,
          ...current,
        }));
      } else {
        setPipelineFormError('Unable to load inquiry form fields.');
      }
    }
  };
  const updateInquiryForm = (field, value) => {
    setInquiryForm((current) => ({ ...current, [field]: value }));
  };
  const pipelineFields = normalizePipelineFields(pipelineForm);
  const getInquiryFieldValue = (fieldKey) => inquiryForm[fieldKey] || getInquiryPrefill()[fieldKey] || '';
  const renderInquiryField = (field) => {
    const value = getInquiryFieldValue(field.fieldKey);
    const labelText = `${field.label}${field.isRequired ? ' *' : ''}`;

    if (field.fieldType === 'textarea') {
      return (
        <label className="is-wide" key={field.id || field.fieldKey}>
          {labelText}
          <textarea
            value={value}
            onChange={(event) => updateInquiryForm(field.fieldKey, event.target.value)}
            placeholder={field.label}
            required={field.isRequired}
          />
        </label>
      );
    }

    if (field.fieldType === 'select') {
      return (
        <label key={field.id || field.fieldKey}>
          {labelText}
          <select
            value={value}
            onChange={(event) => updateInquiryForm(field.fieldKey, event.target.value)}
            required={field.isRequired}
          >
            <option value="">Select {field.label}</option>
            {field.options.map((option) => {
              const optionLabel = typeof option === 'string' ? option : option.label || option.name || option.value;
              const optionValue = typeof option === 'string' ? option : option.value || option.id || optionLabel;
              return optionLabel ? <option key={String(optionValue)} value={String(optionValue)}>{optionLabel}</option> : null;
            })}
          </select>
        </label>
      );
    }

    const inputType = field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : 'text';

    return (
      <label key={field.id || field.fieldKey}>
        {labelText}
        <input
          type={inputType}
          value={value}
          onChange={(event) => updateInquiryForm(field.fieldKey, event.target.value)}
          placeholder={field.label}
          required={field.isRequired}
        />
      </label>
    );
  };
  const submitInquiryForm = async (event) => {
    event.preventDefault();

    const missingField = pipelineFields.find((field) => field.isRequired && !String(getInquiryFieldValue(field.fieldKey)).trim());
    if (missingField) {
      setInquiryError(`Please enter ${missingField.label}.`);
      setInquiryMessage('');
      return;
    }

    setInquirySubmitting(true);
    setInquiryError('');
    setInquiryMessage('');

    const formFields = pipelineFields.reduce((values, field) => ({
      ...values,
      [field.fieldKey]: String(getInquiryFieldValue(field.fieldKey)).trim(),
    }), {});
    const payload = {
      pipeline_id: pipelineForm?.id || CUSTOMIZE_INQUIRY_PIPELINE_ID,
      name: formFields.name || '',
      email: formFields.email || '',
      phone: formFields.phone || '',
      source: 'Itinerary Send Inquiry',
      notes: formFields.itenary || `Please contact me about itinerary ${id}.`,
      custom_fields: {
        ...formFields,
        inquiry_id: id,
        trip_inquiry_id: id,
        existing_trip_inquiry_id: id,
        page_url: currentUrl,
        itinerary_url: currentUrl,
        destination: trip.destination,
        duration: trip.duration || durationCopy,
        departure_city: trip.departure_city || '',
        departure_date: trip.departure_date || '',
        total_travellers: trip.total_travellers || 1,
        travel_with: trip.travel_with || '',
        route: destinationNames.join(' + '),
        price_label: priceLabel,
      },
    };

    try {
      const response = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        setInquiryMessage(result.message || 'Inquiry submitted successfully. Our team will contact you shortly.');
        setInquiryError('');
        return;
      }

      setInquiryMessage('');
      setInquiryError(result?.message || 'Unable to submit inquiry right now.');
    } catch (error) {
      setInquiryMessage('');
      setInquiryError(error?.message || 'Unable to submit inquiry right now.');
    } finally {
      setInquirySubmitting(false);
    }
  };
  const updateReviewForm = (field, value) => {
    setReviewForm((current) => ({ ...current, [field]: field === 'rating' ? Number(value) : value }));
  };
  const submitItineraryReview = async (event) => {
    event.preventDefault();

    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) {
      setReviewMessage('Please add your name and review before submitting.');
      return;
    }

    const nextReview = {
      name: reviewForm.name.trim(),
      email: reviewForm.email.trim(),
      rating: Number(reviewForm.rating) || 5,
      title: reviewForm.title.trim() || `${titleCase(trip.destination)} itinerary review`,
      comment: reviewForm.comment.trim(),
    };

    setReviewSubmitting(true);
    setReviewMessage('');

    const result = await submitTripInquiryReview({
      inquiryId: id,
      review: nextReview,
    });

    setReviewSubmitting(false);

    if (result?.success) {
      setReviewForm((current) => ({ ...current, title: '', comment: '', rating: 5 }));
      setReviewMessage('Thanks, your review has been posted.');
      const reviewsResult = await getTripInquiryReviews({ inquiryId: id });
      setDynamicReviews(reviewsResult.reviews || []);
    } else {
      setReviewMessage(result?.message || 'Unable to submit review right now.');
    }
  };

  return (
    <main className="bi-page">
      <div className="bi-container">
        <header className="bi-title">
          <p>{durationCopy} handcrafted itinerary</p>
          <h1>{titleCase(trip.destination)} Explorer - {durationCopy}</h1>
          <div className="bi-title-summary">
            {trip.destination_info?.title || `${trip.travel_with || 'Custom'} trip from ${trip.departure_city || 'your city'} for ${trip.total_travellers || 1} travellers.`}
          </div>
          <div className="bi-route-ribbon">
            {destinationNames.map((name) => <span key={name}>{name}</span>)}
          </div>
        </header>

        <nav className="bi-tabs">
          <a href="#trip" className="active">Your Trip</a>
          <a href="#inclusions">Inclusions</a>
          <a href="#reviews">Reviews</a>
        </nav>

        <section className="bi-gallery" aria-label="Trip gallery">
          <Image className="bi-gallery-main" src={media.images[0]?.url || fallbackImage} alt={media.images[0]?.alt || trip.destination} width={760} height={420} priority />
          <Image src={media.images[1]?.url || media.images[0]?.url || fallbackImage} alt={media.images[1]?.alt || `${trip.destination} highlight`} width={380} height={206} />
          <Image src={media.images[2]?.url || media.images[0]?.url || fallbackImage} alt={media.images[2]?.alt || `${trip.destination} experience`} width={380} height={206} />
          <div className="bi-video-tile">
            {media.videos[0] ? (
              <video
                src={media.videos[0].url}
                poster={media.videos[0].poster || media.images[0]?.url}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                aria-label={media.videos[0].alt || 'Trip video preview'}
              />
            ) : null}
            <div className="bi-play-badge">Play</div>
            <strong>{media.videos.length ? 'Package video' : 'Trip media'}</strong>
            <button type="button" onClick={() => setMediaOpen(true)}>View All Media</button>
          </div>
        </section>

        {mediaOpen ? (
          <div className="bi-media-modal" role="dialog" aria-modal="true" aria-label="All trip media" onClick={() => setMediaOpen(false)}>
            <div className="bi-media-panel" onClick={(event) => event.stopPropagation()}>
              <div className="bi-media-head">
                <h3>All Media</h3>
                <button type="button" aria-label="Close media viewer" onClick={() => setMediaOpen(false)}>x</button>
              </div>
              <div className="bi-media-grid">
                {media.all.map((item, index) => (
                  <figure className="bi-media-item" key={`${item.id}-${item.url}`}>
                    {item.type === 'video' ? (
                      <video src={item.url} poster={item.poster || media.images[0]?.url} controls playsInline preload="metadata">
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <Image src={item.url} alt={item.alt || `${trip.destination} media`} width={640} height={400} />
                    )}
                    <figcaption className="bi-media-caption">
                      <span>{item.type}</span>
                      {item.alt || `Media ${index + 1}`}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="bi-layout" id="trip">
          <div>
            <section className="bi-section" id="inclusions">
              <h2>Why choose Travel Holiday?</h2>
              <div className="bi-proof-grid">
                {[
                  ['Customizable package', trip.destination_info?.is_customizable ? 'This itinerary can be adjusted to your travel style.' : 'Our team can help you plan details.'],
                  ['Curated destinations', destinationNames.join(', ') || titleCase(trip.destination)],
                  ['Duration', trip.duration || durationCopy],
                  ['Included experiences', `${activityCount || 0} activities added to this itinerary.`],
                ].map(([title, text]) => (
                  <div className="bi-proof" key={title}>
                    <span>+</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bi-section">
              <h2>Itinerary</h2>
              <div className="bi-itinerary-wrap">
                {cities.map((city, index) => {
                  const startDay = cities.slice(0, index).reduce((total, previousCity) => {
                    return total + Math.max(getCityActivities(previousCity, trip).length, 1);
                  }, 1);

                  return (
                    <div key={city?.id || city?.name || index}>
                      <CityItinerary city={city} startDay={startDay} trip={trip} showTemperature={index > 0} />
                      {index < cities.length - 1 ? (
                        <TransferConnector destinationName={titleCase(cities[index + 1]?.name || trip?.destination || 'next destination')} />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bi-section bi-reviews" id="reviews">
              <h2>Travel Holiday Original Reviews</h2>
              {canAddReview ? (
                <form className="bi-review-form" onSubmit={submitItineraryReview}>
                  <div className="bi-review-form-head">
                    <strong>Add your review for this itinerary</strong>
                    <button type="button" onClick={() => setReviewFormOpen((open) => !open)}>
                      {reviewFormOpen ? 'Hide review form' : 'Write Review'}
                    </button>
                  </div>
                  {reviewFormOpen ? (
                    <>
                      <div className="bi-review-form-grid">
                        <label>
                          Rating
                          <select value={reviewForm.rating} onChange={(event) => updateReviewForm('rating', event.target.value)}>
                            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}
                          </select>
                        </label>
                        <label>
                          Name
                          <input value={reviewForm.name} onChange={(event) => updateReviewForm('name', event.target.value)} placeholder="Your name" />
                        </label>
                        <label>
                          Email
                          <input type="email" value={reviewForm.email} onChange={(event) => updateReviewForm('email', event.target.value)} placeholder="you@example.com" />
                        </label>
                        <label>
                          Title
                          <input value={reviewForm.title} onChange={(event) => updateReviewForm('title', event.target.value)} placeholder="Beautiful custom trip" />
                        </label>
                        <label className="is-wide">
                          Review
                          <textarea value={reviewForm.comment} onChange={(event) => updateReviewForm('comment', event.target.value)} placeholder="Share your experience with this itinerary" />
                        </label>
                      </div>
                      <button type="submit" disabled={reviewSubmitting}>{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</button>
                    </>
                  ) : null}
                  {reviewMessage ? <p className="bi-review-message">{reviewMessage}</p> : null}
                </form>
              ) : null}
              {reviewsLoading ? <div className="bi-review-empty">Loading posted reviews...</div> : null}
              {dynamicReviews.map((review) => {
                const name = review.reviewer_name || review.name || review.customer?.name || 'Travel Holiday guest';
                const rating = Number(review.rating) || 5;
                const reviewDate = review.created_at || review.updated_at || review.date;
                const dateLabel = reviewDate
                  ? new Date(reviewDate).toLocaleDateString('en-IN')
                  : 'Recently reviewed';

                return (
                  <article className="bi-review" key={review.id || `${name}-${reviewDate || review.comment}`}>
                    <div className="bi-avatar">{name.charAt(0).toUpperCase()}</div>
                    <div>
                      <strong>{name}</strong>
                      <div className="bi-stars">{'*'.repeat(rating)} <span>Reviewed on : {dateLabel}</span></div>
                      {review.title ? <p><strong>{review.title}</strong></p> : null}
                      <p>{review.comment || review.description || 'The guest rated this itinerary highly.'}</p>
                    </div>
                  </article>
                );
              })}
              {!reviewsLoading && !dynamicReviews.length ? (
                <div className="bi-review-empty">No posted reviews are available for this itinerary yet.</div>
              ) : null}
            </section>
          </div>

          <aside className="bi-sidebar">
            <div className="bi-card bi-price-card">
              <div>
                <span>Package price</span>
                {priceUnlocked ? (
                  <div>
                    <strong>{priceLabel}</strong>
                    <div>
                      <small>{durationCopy} - {destinationNames.join(' + ') || titleCase(trip.destination)}</small>
                    </div>
                  </div>
                ) : null}
              </div>
              <button type="button" onClick={() => (priceUnlocked ? openInquiryForm() : setPriceUnlocked(true))}>
                {priceUnlocked ? 'Send Inquiry' : 'Unlock Price'}
              </button>
            </div>
            <div className="bi-card bi-unlock">
              <Link href="/customize">Edit Travel Details</Link>
              <button type="button" onClick={() => { window.location.assign('/customize'); }}>Unlock your itinerary</button>
            </div>
            <button type="button" className="bi-whatsapp" onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}>
              <span className="bi-whatsapp-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" focusable="false" width="30" height="30">
                  <path fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" d="M32 6.5C18.4 6.5 7.4 17.3 7.4 30.7c0 4.7 1.4 9.1 3.8 12.8L8.5 56.8l13.7-3.2c3.1 1 6.4 1.6 9.8 1.6 13.6 0 24.6-10.8 24.6-24.2S45.6 6.5 32 6.5Z" />
                  <path fill="currentColor" d="M22.6 18.7c-.6-1.4-1.2-1.4-1.8-1.4h-1.5c-.5 0-1.4.2-2.1 1-1.2 1.3-3.1 3.1-3.1 7.4 0 4.4 3.2 8.6 3.7 9.2.5.6 6.2 9.9 15.4 13.5 7.6 3 9.2 2.4 10.8 2.3 1.7-.2 5.3-2.2 6.1-4.3.8-2.1.8-3.9.5-4.3-.2-.4-.8-.6-1.8-1.1l-5.5-2.7c-.8-.4-1.5-.6-2.1.4-.6.9-2.4 2.7-3 3.3-.5.6-1.1.7-2 .2-1-.5-4-1.5-7.6-4.6-2.8-2.5-4.7-5.6-5.3-6.6-.5-.9-.1-1.5.4-2 .4-.4 1-.9 1.4-1.5.5-.5.6-.9 1-1.5.3-.6.2-1.1-.1-1.6l-2.5-5.7Z" />
                </svg>
              </span>
              <span className="bi-whatsapp-copy">
                <span>Trip support on WhatsApp</span>
                <strong>Chat with {companyName}</strong>
              </span>
              <span className="bi-whatsapp-arrow" aria-hidden="true">&gt;</span>
            </button>
            <div className="bi-card bi-route">
              <h3>Your Route</h3>
              <div className="bi-route-timeline">
                <div className="bi-route-step is-note">
                  <span className="bi-route-rail" />
                  <span className="bi-route-icon is-plane" aria-hidden="true" />
                  <p>Arrival at {routeStart}</p>
                </div>
                {(destinationNames.length ? destinationNames : [titleCase(trip.destination)]).map((name, index, list) => (
                  <div className="bi-route-group" key={`${name}-${index}`}>
                    <div className="bi-route-step is-city">
                      <span className="bi-route-rail" />
                      <span className="bi-route-dot" aria-hidden="true" />
                      <strong>{name}</strong>
                    </div>
                    {index < list.length - 1 ? (
                      <div className="bi-route-step is-note">
                        <span className="bi-route-rail" />
                        <span className="bi-route-icon is-transfer" aria-hidden="true" />
                        <p>Transfer by flight</p>
                      </div>
                    ) : null}
                  </div>
                ))}
                <div className="bi-route-step is-note">
                  <span className="bi-route-rail" />
                  <span className="bi-route-icon is-plane" aria-hidden="true" />
                  <p>Departure from {routeEnd}</p>
                </div>
              </div>
            </div>
            <div className="bi-card bi-list">
              <h3>Inclusions</h3>
              <ul>
                <li><span>+</span>{trip.total_travellers || 1} travellers</li>
                <li><span>+</span>{trip.departure_date || 'Flexible departure'}</li>
                <li><span>+</span>{activityCount || 'Curated'} planned experiences</li>
              </ul>
            </div>
            <div className="bi-card bi-list">
              <h3>Trip Details</h3>
              <ul>
                <li><span>-</span>Status: {titleCase(trip.status)}</li>
                <li><span>-</span>Travel style: {trip.travel_with || 'Custom'}</li>
                <li><span>-</span>{tagItems.length ? tagItems.join(', ') : 'Destination expert support'}</li>
              </ul>
            </div>
            <div className="bi-card bi-actions">
              <button type="button">Costing for:</button>
              <button type="button" onClick={mailQuote}>Mail this quote</button>
              <button type="button" onClick={() => { window.location.assign('/cancellation'); }}>Cancellation Policy</button>
              <button type="button" onClick={printItinerary}>Download PDF</button>
              <button type="button" onClick={printItinerary}>Print Itinerary PDF</button>
            </div>
            <div className="bi-rating"><strong>4.7</strong><span>*****</span><p>From 8250 verified reviews</p></div>
          </aside>
        </div>
      </div>

      {inquiryOpen ? (
        <div className="bi-inquiry-modal" role="presentation" onMouseDown={() => { if (!inquirySubmitting) setInquiryOpen(false); }}>
          <section className="bi-inquiry-panel" role="dialog" aria-modal="true" aria-label="Send itinerary inquiry" onMouseDown={(event) => event.stopPropagation()}>
            <div className="bi-inquiry-head">
              <div>
                <span>Send inquiry</span>
                <h2>{titleCase(trip.destination)} itinerary</h2>
              </div>
              <button type="button" className="bi-inquiry-close" onClick={() => setInquiryOpen(false)} disabled={inquirySubmitting} aria-label="Close inquiry form">
                x
              </button>
            </div>
            <form className="bi-inquiry-form" onSubmit={submitInquiryForm}>
              <div className="bi-inquiry-trip">
                <strong>{durationCopy} - {destinationNames.join(' + ') || titleCase(trip.destination)}</strong>
                {/* <span>{currentUrl}</span> */}
              </div>
              {pipelineFormLoading ? <p className="bi-inquiry-message">Loading inquiry form...</p> : null}
              {pipelineFormError ? <p className="bi-inquiry-error">{pipelineFormError}</p> : null}
              {pipelineFields.length ? (
                <div className="bi-inquiry-grid">
                  {pipelineFields.map(renderInquiryField)}
                </div>
              ) : null}
              {inquiryError ? <p className="bi-inquiry-error">{inquiryError}</p> : null}
              {inquiryMessage ? <p className="bi-inquiry-message">{inquiryMessage}</p> : null}
              <button type="submit" className="bi-inquiry-submit" disabled={inquirySubmitting || pipelineFormLoading || !pipelineFields.length}>
                {inquirySubmitting ? 'Submitting...' : 'Submit Inquiry'}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      <BookedItineraryStyles />
    </main>
  );
}
