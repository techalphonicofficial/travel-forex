'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getMediaUrl } from '@/utils/api';

export default function ForexSection({ section }) {
  const data = section?.json_data;
  
  const heading = section?.title || "Why buy Forex from us?";
  const blockDesc = data?.block_desc || "TRAVELER'S FIRST CHOICE";

  const tabs = data?.tabs || [];
  
  // The logo seems to be stored in the tab without a title
  const logoTab = tabs.find(t => !t.title && t.img) || tabs[0];
  const logoImg = logoTab?.img ? getMediaUrl(logoTab.img) : "/images/forex-logo.jpg";
  
  // The actual cards are the tabs that have a title
  const cards = tabs.filter(t => t.title);

  // Default fallback data to preserve static behavior if no API data is available
  const defaultCards = [
    {
      title: "Buy Forex Card",
      content: "Get a forex card with the best exchange rates and zero cross-currency charges.",
      img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=80",
      buttonText: "Buy Forex Card"
    },
    {
      title: "Send Money Abroad",
      content: "Transfer money abroad safely and securely for education, medical or leisure.",
      img: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&q=80",
      buttonText: "Send Money"
    }
  ];

  const displayCards = cards.length > 0 ? cards.map(c => {
    let btnText = c.title;
    if (c.title === 'Buy Forex Card') btnText = 'Buy Forex Card';
    if (c.title === 'Send Money Abroad') btnText = 'Send Money';
    return {
      title: c.title,
      content: c.content, // HTML from CMS
      img: c.img ? getMediaUrl(c.img) : "",
      buttonText: btnText
    };
  }) : defaultCards;

  return (
    <section style={{ padding: '68px 0 76px', background: 'var(--color-bg-soft)', color: 'var(--color-text-primary)', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .forex-card-desc p {
          margin: 0;
        }
      `}</style>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 38 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Image 
              src={logoImg} 
              alt="Forex Logo" 
              width={80} 
              height={80} 
              style={{ borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            />
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 10 }}>
            {blockDesc}
          </p>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 32, color: 'var(--color-text-primary)', marginBottom: 12 }}>
            {heading}
          </h2>
        </div>

        <div className="row g-4 align-items-stretch">
          {displayCards.map((card, idx) => (
            <div key={idx} className="col-12 col-md-6">
              <Link href="/forex" style={{ display: 'block', textDecoration: 'none', color: 'inherit', height: '100%' }}>
                <div style={{
                  background: 'var(--color-bg-card)', borderRadius: 16, overflow: 'hidden',
                  position: 'relative', height: '100%', minHeight: 280, border: '1px solid var(--color-border)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 32,
                  boxShadow: 'var(--shadow-md)', transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' }}>
                    <img src={card.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={card.title} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--color-bg-card) 0%, rgba(255,255,255,0) 100%)' }} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 2, maxWidth: '60%' }}>
                    <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, color: 'var(--color-text-primary)' }}>{card.title}</h3>
                    {cards.length > 0 ? (
                      <div 
                        className="forex-card-desc"
                        style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32, lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: card.content }} 
                      />
                    ) : (
                      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
                        {card.content}
                      </p>
                    )}
                    <span style={{ padding: '10px 24px', background: 'var(--color-primary)', color: 'white', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
                      {card.buttonText}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
