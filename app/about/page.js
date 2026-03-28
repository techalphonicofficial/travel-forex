import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal';
import TeamCard from '@/components/TeamCard';

export const metadata = {
  title: 'About Us',
  description: 'Learn about WanderLust Tours — our story, team, and mission to create extraordinary travel experiences.',
};

const team = [
  { name: 'Sarah Mitchell', role: 'CEO & Co-Founder', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=75', bio: 'Former travel writer with 15+ years exploring 80 countries.' },
  { name: 'James Thompson', role: 'Head of Operations', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=75', bio: 'Operations expert ensuring every tour runs seamlessly.' },
  { name: 'Emma Wilson', role: 'Lead Tour Designer', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=75', bio: 'Crafts unique itineraries blending culture, adventure & luxury.' },
  { name: 'David Martinez', role: 'Customer Experience', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=75', bio: 'Dedicated to making every traveler feel truly cared for.' },
];

const milestones = [
  { year: '2015', title: 'Founded', desc: 'WanderLust was born from a shared passion for meaningful travel.' },
  { year: '2017', title: '10K Travelers', desc: 'Reached our first milestone with 10,000 happy adventurers.' },
  { year: '2019', title: 'Global Expansion', desc: 'Expanded to 50+ destinations across 6 continents.' },
  { year: '2022', title: 'Award-Winning', desc: 'Recognized as Best Luxury Tour Operator by Travel Weekly.' },
  { year: '2024', title: '50K+ Travelers', desc: 'Over 50,000 dream vacations crafted and delivered.' },
];

export default function AboutPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '60vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=75"
            alt="Our story"
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            loading="eager"
            preload
          />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,10,40,0.85) 0%, rgba(0,82,204,0.5) 100%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 60 }}>
          <span className="section-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Since 2015</span>
          <h1 className="section-title" style={{ color: 'white', fontSize: 'clamp(36px, 5vw, 60px)', maxWidth: 600 }}>
            We Live &amp; Breathe Travel
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, maxWidth: 520, lineHeight: 1.7 }}>
            WanderLust was born from a simple belief: travel should change you. We craft journeys that get under your skin.
          </p>
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="section">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <ScrollReveal direction="left">
                <span className="section-label">Our Story</span>
                <h2 className="section-title">From a Single Trip to 50,000 Adventures</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
                  It started in 2015 when our founders, both seasoned travelers, noticed a gap in the market: premium, thoughtfully designed tours that felt personal rather than mass-produced.
                </p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>
                  Since then, we've helped over 50,000 travelers discover the world on their own terms. Every itinerary is built with passion, local knowledge, and an obsession for detail.
                </p>
                <div className="d-flex gap-5">
                  {[['50K+', 'Happy Travelers'], ['120+', 'Destinations'], ['98%', 'Satisfaction']].map(([num, label]) => (
                    <div key={label}>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 32, color: 'var(--color-primary)', lineHeight: 1 }}>{num}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
            <div className="col-lg-6">
              <ScrollReveal>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75',
                    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=75',
                    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&q=75',
                    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=75',
                  ].map((src, i) => (
                    <div key={i} style={{ position: 'relative', height: 200, borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                      <Image src={src} alt="Travel moment" fill sizes="300px" style={{ objectFit: 'cover' }} loading="lazy" />
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── MILESTONES ── */}
      <section className="section bg-soft">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-5">
              <span className="section-label">Our Journey</span>
              <h2 className="section-title">Key Milestones</h2>
            </div>
          </ScrollReveal>
          <div className="d-flex flex-column gap-0" style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 63, top: 0, bottom: 0, width: 2, background: 'var(--color-border)' }} />
            {milestones.map(({ year, title, desc }, i) => (
              <ScrollReveal key={year} delay={i * 100}>
                <div className="d-flex gap-4 align-items-start" style={{ position: 'relative', paddingBottom: 32 }}>
                  {/* Year badge */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: 72,
                      height: 36,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'white',
                      position: 'relative',
                      zIndex: 1,
                      marginTop: 4,
                    }}
                  >
                    {year}
                  </div>
                  <div
                    style={{
                      background: 'var(--color-bg-card)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px',
                      flex: 1,
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 4 }}>{title}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="section" id="team">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-5">
              <span className="section-label">The People Behind The Magic</span>
              <h2 className="section-title">Meet Our Team</h2>
              <p className="section-subtitle mx-auto">Passionate travelers who turned their love of adventure into a career.</p>
            </div>
          </ScrollReveal>
          <div className="row g-4">
            {team.map((member, i) => (
              <div key={member.name} className="col-lg-3 col-md-6">
                <ScrollReveal delay={i * 100}>
                  <TeamCard member={member} />
                </ScrollReveal>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
