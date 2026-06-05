import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal';
import TeamCard from '@/components/TeamCard';
import { getMediaUrl, getPageBySlug } from '@/utils/api';

const FALLBACK_HERO_IMAGE = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=75';
export const dynamic = 'force-dynamic';

const FALLBACK_GALLERY = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=75',
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&q=75',
  'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=75',
];

const fallbackTeam = [
  { name: 'Sarah Mitchell', role: 'CEO & Co-Founder', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=75', bio: 'Former travel writer with 15+ years exploring 80 countries.' },
  { name: 'James Thompson', role: 'Head of Operations', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=75', bio: 'Operations expert ensuring every tour runs seamlessly.' },
  { name: 'Emma Wilson', role: 'Lead Tour Designer', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=75', bio: 'Crafts unique itineraries blending culture, adventure & luxury.' },
  { name: 'David Martinez', role: 'Customer Experience', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=75', bio: 'Dedicated to making every traveler feel truly cared for.' },
];

const fallbackMilestones = [
  { value: '2015', title: 'Founded', desc: 'ITS TRAVELS AND TOURS was born from a shared passion for meaningful travel.' },
  { value: '2017', title: '10K Travelers', desc: 'Reached our first milestone with 10,000 happy adventurers.' },
  { value: '2019', title: 'Global Expansion', desc: 'Expanded to 50+ destinations across 6 continents.' },
  { value: '2022', title: 'Award-Winning', desc: 'Recognized as Best Luxury Tour Operator by Travel Weekly.' },
  { value: '2024', title: '50K+ Travelers', desc: 'Over 50,000 dream vacations crafted and delivered.' },
];

const fallbackStats = [
  { value: '50K+', desc: 'Happy Travelers' },
  { value: '120+', desc: 'Destinations' },
  { value: '98%', desc: 'Satisfaction' },
];

const fallbackStoryHtml = `
  <p>It started in 2015 when our founders, both seasoned travelers, noticed a gap in the market: premium, thoughtfully designed tours that felt personal rather than mass-produced.</p>
  <p>Since then, we've helped over 50,000 travelers discover the world on their own terms. Every itinerary is built with passion, local knowledge, and an obsession for detail.</p>
`;

const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, '').trim();

const splitMilestoneLabel = (label = '') => {
  const titleMatch = String(label).match(/<strong>(.*?)<\/strong>/i);
  const paragraphs = [...String(label).matchAll(/<p>(.*?)<\/p>/gi)].map((match) => stripHtml(match[1]));

  return {
    title: titleMatch ? stripHtml(titleMatch[1]) : paragraphs[0] || '',
    desc: paragraphs.length > 1 ? paragraphs.slice(1).join(' ') : stripHtml(label),
  };
};

const findSection = (page, section) => page?.details?.find((item) => item.section === section);

const buildAboutContent = (page) => {
  const imageText = findSection(page, 'image_text');
  const storyGrid = findSection(page, 'story_grid');
  const statsBar = findSection(page, 'stats_bar');
  const teamGrid = findSection(page, 'team_grid');

  const heroImage = getMediaUrl(imageText?.json_data?.media_url || page?.feature_image) || FALLBACK_HERO_IMAGE;
  const storyGallery = storyGrid?.json_data?.gallery?.length
    ? storyGrid.json_data.gallery.map((item) => ({
      src: getMediaUrl(item.img),
      alt: item.alt || storyGrid.title || 'Travel moment',
    })).filter((item) => item.src)
    : FALLBACK_GALLERY.map((src) => ({ src, alt: 'Travel moment' }));

  return {
    hero: {
      label: imageText?.json_data?.heading_content || 'Since 2015',
      title: imageText?.title || 'We Live & Breathe Travel',
      description: imageText?.json_data?.body || page?.description || 'ITS TRAVELS AND TOURS was born from a simple belief: travel should change you. We craft journeys that get under your skin.',
      image: heroImage,
      alt: page?.alt_text || imageText?.title || 'Our story',
    },
    story: {
      label: storyGrid?.json_data?.heading_content || 'Our Story',
      title: storyGrid?.title || 'From a Single Trip to 50,000 Adventures',
      html: storyGrid?.json_data?.story_desc || fallbackStoryHtml,
      stats: storyGrid?.json_data?.stats?.length ? storyGrid.json_data.stats : fallbackStats,
      gallery: storyGallery,
    },
    milestones: {
      label: statsBar?.title || 'Our Journey',
      title: statsBar?.json_data?.heading_content || 'Key Milestones',
      items: statsBar?.json_data?.stats?.length
        ? statsBar.json_data.stats.map((item) => ({
          value: item.value,
          ...splitMilestoneLabel(item.label),
        }))
        : fallbackMilestones,
    },
    team: {
      label: teamGrid?.title || 'The People Behind The Magic',
      title: teamGrid?.json_data?.heading_content || 'Meet Our Team',
      description: teamGrid?.json_data?.block_desc || 'Passionate travelers who turned their love of adventure into a career.',
      members: teamGrid?.json_data?.team?.length
        ? teamGrid.json_data.team.map((member) => ({
          name: member.name,
          role: member.role,
          bio: member.bio,
          image: getMediaUrl(member.img),
        })).filter((member) => member.name && member.image)
        : fallbackTeam,
    },
  };
};

export async function generateMetadata() {
  const page = await getPageBySlug('about');
  const image = getMediaUrl(page?.feature_image);

  return {
    title: page?.meta_title || page?.title || 'About Us',
    description: page?.meta_description || page?.description || 'Learn about ITS TRAVELS AND TOURS, our story, team, and mission to create extraordinary travel experiences.',
    keywords: page?.keyword ? [page.keyword] : undefined,
    openGraph: {
      title: page?.meta_title || page?.title || 'About Us',
      description: page?.meta_description || page?.description || 'Learn about ITS TRAVELS AND TOURS.',
      images: image ? [{ url: image, width: 1200, height: 630, alt: page?.alt_text || page?.title || 'About Us' }] : undefined,
    },
  };
}

export default async function AboutPage() {
  const page = await getPageBySlug('about');
  const content = buildAboutContent(page);

  return (
    <>
      <section style={{ position: 'relative', minHeight: '60vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image
            src={content.hero.image}
            alt={content.hero.alt}
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            loading="eager"
            preload
          />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,10,40,0.85) 0%, rgba(0,82,204,0.5) 100%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 60 }}>
          <span className="section-label" style={{ color: 'rgba(255,255,255,0.7)' }}>{content.hero.label}</span>
          <h1 className="section-title" style={{ color: 'white', fontSize: 'clamp(36px, 5vw, 60px)', maxWidth: 600 }}>
            {content.hero.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, maxWidth: 520, lineHeight: 1.7 }}>
            {content.hero.description}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <ScrollReveal direction="left">
                <span className="section-label">{content.story.label}</span>
                <h2 className="section-title">{content.story.title}</h2>
                <div
                  style={{ color: 'var(--color-text-secondary)', fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}
                  dangerouslySetInnerHTML={{ __html: content.story.html }}
                />
                <div className="d-flex gap-5 flex-wrap">
                  {content.story.stats.map((stat) => (
                    <div key={`${stat.value}-${stat.desc}`}>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 32, color: 'var(--color-primary)', lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{stat.desc}</div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
            <div className="col-lg-6">
              <ScrollReveal>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {content.story.gallery.slice(0, 4).map((item, i) => (
                    <div key={`${item.src}-${i}`} style={{ position: 'relative', height: 200, borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                      <Image src={item.src} alt={item.alt} fill sizes="300px" style={{ objectFit: 'cover' }} loading="lazy" />
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-soft">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-5">
              <span className="section-label">{content.milestones.label}</span>
              <h2 className="section-title">{content.milestones.title}</h2>
            </div>
          </ScrollReveal>
          <div className="d-flex flex-column gap-0" style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 63, top: 0, bottom: 0, width: 2, background: 'var(--color-border)' }} />
            {content.milestones.items.map(({ value, title, desc }, i) => (
              <ScrollReveal key={`${value}-${title}`} delay={i * 100}>
                <div className="d-flex gap-4 align-items-start" style={{ position: 'relative', paddingBottom: 32 }}>
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
                    {value}
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

      <section className="section" id="team">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-5">
              <span className="section-label">{content.team.label}</span>
              <h2 className="section-title">{content.team.title}</h2>
              <p className="section-subtitle mx-auto">{content.team.description}</p>
            </div>
          </ScrollReveal>
          <div className="row g-4">
            {content.team.members.map((member, i) => (
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
