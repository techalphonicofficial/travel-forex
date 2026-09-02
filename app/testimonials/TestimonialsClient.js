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
  
  const imgMatch = htmlStr.match(/<img[^>]+src="([^">]+)"/i);
  const popupImage = imgMatch ? imgMatch[1] : '';

  let cleanHtml = htmlStr.replace(/<strong[^>]*>[\s\S]*?<\/strong>/ig, '');
  cleanHtml = cleanHtml.replace(/<figure[^>]*>[\s\S]*?<\/figure>/ig, '');
  cleanHtml = cleanHtml.replace(/<img[^>]*>/ig, '');
  
  let text = cleanHtml.replace(/<\/?(p|div|br)[^>]*>/ig, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/^["“”]|["“”]$/g, '').trim();

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
  const [isPopupTextExpanded, setIsPopupTextExpanded] = useState(false);
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
          {hero.label && (
            <span style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.1)',
              padding: '6px 16px',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: '16px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              {hero.label}
            </span>
          )}
          {hero.title && (
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
          )}
          {hero.description && (
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
          )}
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
          alignItems: 'stretch'
        }}>
          {filteredTestimonials.map(testimonial => (
            <div 
              key={testimonial.id}
              onClick={() => {
                setSelectedTestimonial(testimonial);
                setIsPopupTextExpanded(false);
              }}
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.03)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.03)';
              }}
            >
              {/* Avatar always at top */}
              {testimonial.avatar && (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', marginBottom: '12px', border: '2px solid #f8fafc', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', flexShrink: 0, position: 'relative' }}>
                  <Image src={testimonial.avatar} alt={testimonial.name} fill sizes="60px" style={{ objectFit: 'cover' }} />
                </div>
              )}

              {/* Rating */}
              <div style={{ color: '#fbbf24', fontSize: '16px', marginBottom: '12px', letterSpacing: '2px' }}>
                {testimonial.badgeStr || '★★★★★'}
              </div>

              {/* Review Text */}
              {testimonial.text && (
                <p style={{ 
                  fontSize: '14px', 
                  color: '#334155', 
                  lineHeight: 1.6, 
                  fontWeight: 500,
                  fontStyle: 'italic',
                  margin: '0 0 16px 0'
                }}>
                  "{testimonial.text.length > 120 ? testimonial.text.substring(0, 120).trim() + '... ' : testimonial.text}"
                  {testimonial.text.length > 120 && (
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontStyle: 'normal' }}>
                      Read more
                    </span>
                  )}
                </p>
              )}

              {/* Rich text image after text */}
              {testimonial.popupImage && (
                <div style={{ width: '100%', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative', height: '160px' }}>
                  <Image 
                    src={testimonial.popupImage} 
                    alt={testimonial.name} 
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    style={{ objectFit: 'cover' }} 
                  />
                </div>
              )}

              {/* Name & Location */}
              <div style={{ marginTop: 'auto' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  {testimonial.name}
                </h4>
                <span style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700 }}>
                  {testimonial.location} {testimonial.tour ? `• ${testimonial.tour}` : ''}
                </span>
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
            borderRadius: '20px', 
            padding: '32px', 
            maxWidth: '500px', 
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
                position: 'absolute', top: '16px', right: '16px', 
                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            >
              &times;
            </button>
            
            {/* Avatar always at top */}
            {selectedTestimonial.avatar && (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', marginBottom: '16px', border: '3px solid #f8fafc', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                <img src={selectedTestimonial.avatar} alt={selectedTestimonial.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            
            <div style={{ color: '#fbbf24', fontSize: '18px', marginBottom: '12px', letterSpacing: '2px' }}>
              {selectedTestimonial.badgeStr || '★★★★★'}
            </div>
            
            {selectedTestimonial.text && (
              <p style={{ color: '#334155', fontSize: '15px', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '20px', fontWeight: 500 }}>
                "{!isPopupTextExpanded && selectedTestimonial.text.length > 120 ? selectedTestimonial.text.substring(0, 120).trim() + '... ' : selectedTestimonial.text}"
                {!isPopupTextExpanded && selectedTestimonial.text.length > 120 && (
                  <span onClick={() => setIsPopupTextExpanded(true)} style={{ color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontStyle: 'normal' }}>
                    Read more
                  </span>
                )}
                {isPopupTextExpanded && selectedTestimonial.text.length > 120 && (
                  <span onClick={() => setIsPopupTextExpanded(false)} style={{ color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontStyle: 'normal', marginLeft: '6px' }}>
                    Show less
                  </span>
                )}
              </p>
            )}

            {/* Rich text image after text */}
            {selectedTestimonial.popupImage && (
              <div style={{ width: '100%', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                <img 
                  src={selectedTestimonial.popupImage} 
                  alt={selectedTestimonial.name} 
                  style={{ width: '100%', height: 'auto', cursor: 'zoom-in', display: 'block' }} 
                  onClick={() => setZoomedImage(selectedTestimonial.popupImage)}
                />
              </div>
            )}
            
            <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              {selectedTestimonial.name}
            </h4>
            <span style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 700 }}>
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
