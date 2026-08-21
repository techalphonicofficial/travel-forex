'use client';

import Image from 'next/image';
import { getMediaUrl } from '@/utils/api';

export default function OffersCarousel({ offersData = null }) {
  const displayOffers = offersData?.offers?.map((offer, idx) => {
    let cleanCode = offer.code || '';
    if (cleanCode.toUpperCase().startsWith('CODE:')) {
      cleanCode = cleanCode.substring(5).trim();
    }

    return {
      id: idx + 1,
      title: offer.title,
      code: cleanCode,
      validity: offer.validity,
      image: getMediaUrl(offer.image),
      tag: (offer.type || 'Offer').trim(),
    };
  }) || [];

  const displayTitle = offersData?.heading_content || "Exclusive Offers";
  const displayDescription = offersData?.description || "Grab the best deals on flights, hotels, and holiday packages.";

  return (
    <section style={{ padding: '0', background: 'transparent' }}>
      <style>{`
        .offers-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 220px;
          gap: 20px;
        }

        .offer-card {
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 24px;
          text-decoration: none;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .offer-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.2);
        }

        .offer-card-0 { grid-column: span 2; grid-row: span 2; } /* Large square */
        .offer-card-1 { grid-column: span 2; grid-row: span 1; } /* Wide rectangle */
        .offer-card-2 { grid-column: span 1; grid-row: span 1; } /* Small square */
        .offer-card-3 { grid-column: span 1; grid-row: span 1; } /* Small square */

        .offer-card-img-wrap {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .offer-card-img {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .offer-card:hover .offer-card-img {
          transform: scale(1.05);
        }

        .offer-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%);
          z-index: 2;
        }

        .offer-content {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .offer-tag {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: auto;
        }

        .offer-title {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.3;
          margin-bottom: 8px;
        }

        .offer-card-0 .offer-title {
          font-size: 32px;
        }

        .offer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
        }

        .offer-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .offer-validity {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
        }

        .offer-code {
          border: 1px dashed rgba(255, 255, 255, 0.6);
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 13px;
          color: #fef08a; /* Soft yellow for code */
          background: rgba(0, 0, 0, 0.3);
          display: inline-block;
        }

        @media (max-width: 1024px) {
          .offers-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: auto;
          }
          .offer-card-0, .offer-card-1, .offer-card-2, .offer-card-3 {
            grid-column: span 1;
            grid-row: span 1;
            height: 280px;
          }
          .offer-card-0 .offer-title {
            font-size: 22px;
          }
        }

        @media (max-width: 640px) {
          .offers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="container">
        {/* Header container aligned center */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 20, paddingBottom: 20, paddingTop: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
              {displayTitle}
            </h2>
            <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)', fontSize: 16 }}>
              {displayDescription}
            </p>
          </div>
        </div>

        <div className="offers-grid">
          {displayOffers.map((offer, index) => (
            <div key={offer.id} className={`offer-card offer-card-${index}`}>
              <div className="offer-card-img-wrap">
                <Image 
                  src={offer.image} 
                  alt={offer.title} 
                  fill 
                  style={{ objectFit: 'cover' }} 
                  className="offer-card-img"
                />
                <div className="offer-overlay" />
              </div>
              <div className="offer-content">
                <div className="offer-tag">{offer.tag}</div>
                <h3 className="offer-title">{offer.title}</h3>
                <div className="offer-bottom">
                  <div className="offer-details">
                    <div className="offer-validity">{offer.validity}</div>
                    {offer.code && (
                      <div className="offer-code">USE CODE: {offer.code}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
