'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHotels, getMediaUrl } from '@/utils/api';

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const getHotelImage = (hotel) =>
  getMediaUrl(hotel?.image_url) ||
  getMediaUrl(hotel?.gallery?.find((item) => item.is_primary)?.url) ||
  getMediaUrl(hotel?.gallery?.[0]?.url) ||
  '/images/banners/banner1.jpg';

const getDiscountedPrice = (hotel) => {
  const price = Number(hotel?.price_per_night) || 0;
  const discount = Number(hotel?.discount_percent) || 0;
  return discount > 0 ? Math.max(price - (price * discount) / 100, 0) : price;
};

export default function HotDealsMarquee() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotDeals = async () => {
      try {
        const res = await getHotels({ is_hot_deal: true, limit: 10 });
        if (res && res.rows && res.rows.length > 0) {
          // Duplicate items to ensure smooth infinite vertical scrolling
          const items = res.rows;
          setDeals([...items, ...items, ...items, ...items]);
        }
      } catch (error) {
        console.error('Failed to fetch hot deals', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotDeals();
  }, []);

  if (loading || deals.length === 0) return null;

  return (
    <aside className="hot-deals-sidebar">
      <div className="hot-deals-header">
        <h2>🔥 Hot Deals</h2>
        <p>Premium stays</p>
      </div>

      <div className="marquee-container">
        <div className="marquee-track">
          {deals.map((hotel, index) => (
            <a
              href={`/hotels/${hotel.id}`}
              key={`${hotel.id}-${index}`}
              className="hot-deal-card"
            >
              <img
                src={getHotelImage(hotel)}
                alt={hotel.name}
                loading="lazy"
                className="card-bg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/banners/banner1.jpg';
                }}
              />
              <div className="deal-badge">Hot Deal</div>

              <div className="card-overlay">
                <div className="deal-rating">
                  ⭐ {hotel.guest_rating || '4.0'}
                  {hotel.star_rating ? <span className="stars">({hotel.star_rating}★)</span> : ''}
                </div>
                <h3>{hotel.name}</h3>
                <div className="deal-location">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  {hotel.city?.name || 'Popular Destination'}
                </div>
                {/* <div className="price-info">
                  <span className="price-from">From</span>
                  <span className="price-value">{formatMoney(getDiscountedPrice(hotel))}</span>
                  {Number(hotel.discount_percent) > 0 && (
                    <span className="discount-tag">-{hotel.discount_percent}%</span>
                  )}
                </div> */}
              </div>
            </a>
          ))}
        </div>
      </div>

      <style jsx>{`
        .hot-deals-sidebar {
          width: 100%;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e1e7ef;
          box-shadow: 0 8px 24px rgba(15, 23, 42, .05);
          overflow: hidden;
          position: sticky;
          top: 92px;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 120px);
          max-height: 800px;
        }

        .hot-deals-header {
          padding: 16px 18px;
          border-bottom: 1px solid #edf1f5;
          background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
          z-index: 10;
        }

        .hot-deals-header h2 {
          font-size: 18px;
          font-weight: 900;
          color: #111827;
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hot-deals-header p {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          margin: 0;
        }

        .marquee-container {
          flex: 1;
          width: 100%;
          overflow: hidden;
          position: relative;
          padding: 16px;
        }

        /* Gradient mask for smooth vertical fade effect */
        .marquee-container::before,
        .marquee-container::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 40px;
          z-index: 2;
          pointer-events: none;
        }
        .marquee-container::before {
          top: 0;
          background: linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
        }
        .marquee-container::after {
          bottom: 0;
          background: linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
        }

        .marquee-track {
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: scrollMarqueeVertical 40s linear infinite;
          will-change: transform;
        }

        .marquee-container:hover .marquee-track {
          animation-play-state: paused;
        }

        .hot-deal-card {
          position: relative;
          width: 100%;
          height: 340px;
          min-height: 340px !important;
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          color: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: block !important;
          flex: 0 0 340px !important;
        }

        .hot-deal-card:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .card-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          background-color: #1e293b;
        }

        .deal-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #ff4d4f;
          color: white;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          z-index: 3;
          box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
        }

        .card-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 60px 16px 16px;
          background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.7) 40%, rgba(15,23,42,0) 100%);
          z-index: 2;
          display: flex;
          flex-direction: column;
        }

        .deal-rating {
          font-size: 12px;
          font-weight: 700;
          color: #ffd700;
          margin-bottom: 4px;
        }
        
        .deal-rating .stars {
          color: rgba(255,255,255,0.7);
          font-weight: 600;
          margin-left: 4px;
        }

        .card-overlay h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 800;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
          color: #fff !important;
        }

        .deal-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          margin-bottom: 10px;
        }

        .price-info {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }

        .price-from {
          font-size: 11px;
          color: rgba(255,255,255,0.7);
        }

        .price-value {
          font-size: 16px;
          font-weight: 900;
          color: #fff;
        }

        .discount-tag {
          background: #22c55e;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: auto;
        }
        @keyframes scrollMarqueeVerticalLocal {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scrollMarqueeVertical {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}} />
    </aside>
  );
}

