'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `https://tourtravel.yber.in${path}`;
};

const extractData = (htmlStr) => {
  if (!htmlStr) return { tour: '', text: '', location: '', popupImage: '' };
  
  const strongs = [...htmlStr.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/ig)];
  const tour = strongs.length > 0 ? strongs[0][1].replace(/&nbsp;/g, '').trim() : '';
  const location = strongs.length > 1 ? strongs[strongs.length - 1][1].replace(/&nbsp;/g, '').trim() : '';
  
  const textMatch = htmlStr.match(/<i[^>]*>([\s\S]*?)<\/i>/i);
  let text = textMatch ? textMatch[1].trim() : htmlStr.replace(/<[^>]+>/g, '').trim();
  text = text.replace(/^["“”]|["“”]$/g, '').trim();
  
  const imgMatch = htmlStr.match(/<img[^>]+src="([^">]+)"/i);
  const popupImage = imgMatch ? imgMatch[1] : '';

  return { tour, text, location, popupImage };
};

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

export default function TestimonialsClient({ hero = fallbackHero, pageData }) {
  const [filter, setFilter] = useState('All');
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    if (selectedTestimonial || zoomedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedTestimonial, zoomedImage]);

  const getDynamicTestimonials = () => {
    const cmsBlock = pageData?.details?.find(d => d.key === 'testimonials_comment');
    if (!cmsBlock?.json_data) return MOCK_TESTIMONIALS;
    
    try {
      const parsed = typeof cmsBlock.json_data === 'string' 
        ? JSON.parse(cmsBlock.json_data) 
        : cmsBlock.json_data;
      
      if (parsed?.tabs && Array.isArray(parsed.tabs)) {
        return parsed.tabs.map((tab, idx) => {
          const extracted = extractData(tab.content);
          const rawRating = (tab.badge && typeof tab.badge === 'string') ? (tab.badge.match(/★/g) || []).length : 5;
          return {
            id: idx + 1,
            name: tab.title || 'Traveler',
            location: extracted.location || 'India',
            text: extracted.text || '',
            rating: rawRating > 0 ? rawRating : 5,
            badgeStr: tab.badge || '★ ★ ★ ★ ★',
            tour: extracted.tour || 'General',
            avatar: getMediaUrl(tab.img),
            popupImage: extracted.popupImage
          };
        });
      }
    } catch (e) {
      console.error('Error parsing testimonials JSON:', e);
    }
    return MOCK_TESTIMONIALS;
  };

  const dynamicTestimonials = getDynamicTestimonials();
  const heroStyle = {
    position: 'relative',
    padding: '36px 20px 24px',
    background: hero.image
      ? `url('${hero.image}')`
      : 'transparent',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: 'white',
    textAlign: 'center',
    overflow: 'hidden',
  };

  const categories = ['All', 'Tours', 'Forex Services', 'Visa Assistance'];

  const filteredTestimonials = dynamicTestimonials.filter(t => {
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
            fontSize: '11px', 
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px',
            backdropFilter: 'blur(4px)'
          }}>
            {hero.label}
          </span>
          <h1 style={{ 
            fontSize: 'clamp(28px, 4vw, 42px)', 
            fontWeight: 900, 
            letterSpacing: 0,
            lineHeight: 1.1,
            marginBottom: '8px',
            fontFamily: 'var(--font-poppins), Poppins, sans-serif'
          }}>
            {hero.title}
          </h1>
          <p style={{ 
            fontSize: '15px', 
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
              onClick={() => setSelectedTestimonial(testimonial)}
              style={{
                background: 'white',
                padding: '36px',
                borderRadius: '24px',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.03)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                cursor: 'pointer'
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

      {/* Testimonial Modal */}
      {selectedTestimonial && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedTestimonial(null)}>
          <div style={{
            background: 'white', 
            borderRadius: '24px', 
            padding: '40px', 
            maxWidth: '650px', 
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedTestimonial(null)}
              style={{ 
                position: 'absolute', top: '20px', right: '20px', 
                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            >
              &times;
            </button>
            
            {/* Avatar always at top */}
            {selectedTestimonial.avatar && (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', marginBottom: '24px', border: '4px solid #f8fafc', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                <img src={selectedTestimonial.avatar} alt={selectedTestimonial.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            
            <div style={{ color: '#fbbf24', fontSize: '24px', marginBottom: '16px', letterSpacing: '4px' }}>
              {selectedTestimonial.badgeStr || '★★★★★'}
            </div>
            
            <p style={{ color: '#334155', fontSize: '18px', lineHeight: 1.8, fontStyle: 'italic', marginBottom: '24px', fontWeight: 500 }}>
              "{selectedTestimonial.text}"
            </p>

            {/* Rich text image after text */}
            {selectedTestimonial.popupImage && (
              <div style={{ width: '100%', marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
                <img 
                  src={selectedTestimonial.popupImage} 
                  alt={selectedTestimonial.name} 
                  style={{ width: '100%', height: 'auto', cursor: 'zoom-in', display: 'block' }} 
                  onClick={() => setZoomedImage(selectedTestimonial.popupImage)}
                />
              </div>
            )}
            
            <h4 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              {selectedTestimonial.name}
            </h4>
            <span style={{ color: 'var(--color-primary)', fontSize: '15px', fontWeight: 700 }}>
              {selectedTestimonial.location} {selectedTestimonial.tour ? `• ${selectedTestimonial.tour}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.95)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
        }} onClick={() => setZoomedImage(null)}>
            <button 
              onClick={() => setZoomedImage(null)}
              style={{ 
                position: 'absolute', top: '20px', right: '20px', 
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '30px', cursor: 'pointer', color: '#fff', transition: 'all 0.2s', zIndex: 10001
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            >
              &times;
            </button>
            <img src={zoomedImage} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
}
