'use client';

import { useState } from 'react';
import Image from 'next/image';

const fallbackHero = {
  label: 'Happy Travelers',
  title: "Don't Just Take Our Word For It",
  description: 'Discover why thousands of travelers choose us for their unforgettable journeys, seamless visa processing, and forex needs.',
  image: '',
};

const MOCK_TESTIMONIALS = [
  {
    id: 1,
    name: 'Rahul Sharma',
    location: 'Mumbai, India',
    text: 'Booked a Europe tour for my family. The experience was seamless from visa to hotels. Truly memorable! Highly recommended for families.',
    rating: 5,
    date: 'Oct 2023',
    tour: 'European Escapade',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop',
  },
  {
    id: 2,
    name: 'Priya Desai',
    location: 'Delhi, India',
    text: 'Got the best forex rates without any hassle. The card was delivered the very next day. Excellent service and very transparent pricing.',
    rating: 5,
    date: 'Nov 2023',
    tour: 'Forex Services',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
  },
  {
    id: 3,
    name: 'Amit Patel',
    location: 'Ahmedabad, India',
    text: 'Our Bali honeymoon was perfectly organized. The private pool villa was exactly as shown in pictures. Thanks team!',
    rating: 5,
    date: 'Dec 2023',
    tour: 'Romantic Bali',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
  },
  {
    id: 4,
    name: 'Neha Singh',
    location: 'Bangalore, India',
    text: 'Very professional visa assistance. They guided me through every step for my US tourist visa. Their checklist was spot on.',
    rating: 4.5,
    date: 'Jan 2024',
    tour: 'Visa Assistance',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop',
  },
  {
    id: 5,
    name: 'Michael & Sarah',
    location: 'London, UK',
    text: 'The customized Golden Triangle tour in India was mind-blowing. Our driver was incredibly knowledgeable and polite. Will definitely book again.',
    rating: 5,
    date: 'Feb 2024',
    tour: 'Golden Triangle',
    avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=150&auto=format&fit=crop',
  },
  {
    id: 6,
    name: 'Rohan Gupta',
    location: 'Pune, India',
    text: 'We booked a 7-day trip to Dubai. Everything from the desert safari to the Burj Khalifa visit was perfectly timed. Excellent coordination by the team.',
    rating: 5,
    date: 'Mar 2024',
    tour: 'Dazzling Dubai',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
  }
];

export default function TestimonialsClient({ hero = fallbackHero }) {
  const [filter, setFilter] = useState('All');
  const heroStyle = {
    position: 'relative',
    padding: '120px 20px 80px',
    background: hero.image
      ? `linear-gradient(135deg, rgba(17, 24, 39, 0.82) 0%, rgba(16, 32, 54, 0.78) 52%, rgba(31, 63, 86, 0.82) 100%), url('${hero.image}')`
      : 'linear-gradient(135deg, #111827 0%, #102036 52%, #1f3f56 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: 'white',
    textAlign: 'center',
    overflow: 'hidden',
  };

  const categories = ['All', 'Tours', 'Forex Services', 'Visa Assistance'];

  const filteredTestimonials = MOCK_TESTIMONIALS.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Tours') return !['Forex Services', 'Visa Assistance'].includes(t.tour);
    return t.tour === filter;
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={heroStyle}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
          <span style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)', 
            borderRadius: '999px', 
            fontSize: '13px', 
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '24px',
            backdropFilter: 'blur(4px)'
          }}>
            {hero.label}
          </span>
          <h1 style={{ 
            fontSize: 'clamp(36px, 5vw, 56px)', 
            fontWeight: 900, 
            letterSpacing: 0,
            lineHeight: 1.1,
            marginBottom: '24px',
            fontFamily: 'var(--font-poppins), Poppins, sans-serif'
          }}>
            {hero.title}
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#cbd5e1', 
            lineHeight: 1.6, 
            maxWidth: 600, 
            margin: '0 auto',
            fontWeight: 500
          }}>
            {hero.description}
          </p>
        </div>
      </section>

      <section style={{ padding: '60px 20px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px', 
          flexWrap: 'wrap',
          marginBottom: '60px'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '12px 24px',
                borderRadius: '999px',
                border: cat === filter ? 'none' : '1px solid #e2e8f0',
                background: cat === filter ? 'var(--color-primary)' : 'white',
                color: cat === filter ? 'white' : '#475569',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: cat === filter ? '0 8px 20px color-mix(in srgb, var(--color-primary) 30%, transparent)' : '0 2px 4px rgba(0,0,0,0.02)',
                transform: cat === filter ? 'translateY(-2px)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry-style Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '32px',
          alignItems: 'start'
        }}>
          {filteredTestimonials.map(testimonial => (
            <div 
              key={testimonial.id}
              style={{
                background: 'white',
                padding: '36px',
                borderRadius: '24px',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.03)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.03)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Rating */}
                <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', fontSize: '18px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < Math.floor(testimonial.rating) ? '★' : '☆'}</span>
                  ))}
                </div>
                {/* Quote Icon */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-primary)" opacity="0.1" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" />
                </svg>
              </div>

              {/* Review Text */}
              <p style={{ 
                fontSize: '16px', 
                color: '#334155', 
                lineHeight: 1.7, 
                fontWeight: 500,
                fontStyle: 'italic',
                margin: 0
              }}>
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Tag */}
              <div style={{ display: 'inline-flex', padding: '6px 12px', background: '#f1f5f9', color: '#64748b', fontSize: '12px', fontWeight: 800, borderRadius: '6px', alignSelf: 'flex-start' }}>
                {testimonial.tour}
              </div>

              {/* User Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '2px solid #e2e8f0' }}>
                  <Image src={testimonial.avatar} alt={testimonial.name} fill sizes="48px" style={{ objectFit: 'cover' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{testimonial.name}</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 600 }}>{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredTestimonials.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No reviews found</h3>
            <p style={{ margin: 0 }}>Try selecting a different category.</p>
          </div>
        )}
      </section>
    </div>
  );
}
