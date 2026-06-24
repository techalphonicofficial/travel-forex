'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const testimonials = [
  {
    id: 1,
    name: 'Rahul Sharma',
    location: 'Mumbai',
    text: 'Booked a Europe tour for my family. The experience was seamless from visa to hotels. Truly memorable!',
    rating: 5,
    date: 'Oct 2023'
  },
  {
    id: 2,
    name: 'Priya Desai',
    location: 'Delhi',
    text: 'Got the best forex rates without any hassle. The card was delivered the very next day. Excellent service.',
    rating: 5,
    date: 'Nov 2023'
  },
  {
    id: 3,
    name: 'Amit Patel',
    location: 'Ahmedabad',
    text: 'Our Bali honeymoon was perfectly organized. The private pool villa was exactly as shown in pictures. Thanks team!',
    rating: 4.5,
    date: 'Dec 2023'
  },
  {
    id: 4,
    name: 'Neha Singh',
    location: 'Bangalore',
    text: 'Very professional visa assistance. They guided me through every step for my US tourist visa.',
    rating: 5,
    date: 'Jan 2024'
  }
];

export default function TestimonialSlider() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: direction * amount, behavior: 'smooth' });
    }
  };

  return (
    <section style={{ padding: '80px 0', background: 'var(--color-bg-card)', borderTop: '1px solid var(--color-border)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 8 }}>
            Happy Travelers
          </p>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-text-primary)' }}>
            Why Customers Love ITS Tour and Travels
          </h2>
        </div>

        <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto' }}>
          <button
            onClick={() => scroll(-1)}
            style={{
              position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 48, height: 48, borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-primary)" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          <button
            onClick={() => scroll(1)}
            style={{
              position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 48, height: 48, borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-primary)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <div
            ref={scrollRef}
            style={{
              display: 'flex', gap: 24, overflowX: 'auto', scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '10px 0'
            }}
          >
            {testimonials.map((item) => (
              <div
                key={item.id}
                style={{
                  flex: '0 0 100%', minWidth: '100%', scrollSnapAlign: 'start',
                  background: 'white', border: '1px solid #f1f5f9', borderRadius: 20,
                  padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                }}
              >
                <div style={{ color: '#fbbf24', fontSize: 24, marginBottom: 16 }}>
                  {'★'.repeat(Math.floor(item.rating))}
                  {item.rating % 1 !== 0 && '☆'}
                </div>
                <p style={{ fontSize: 18, color: 'var(--color-text-primary)', fontStyle: 'italic', marginBottom: 24, lineHeight: 1.6, maxWidth: 700 }}>
                  "{item.text}"
                </p>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
                  {item.name.charAt(0)}
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>{item.name}</h4>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.location} • {item.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
