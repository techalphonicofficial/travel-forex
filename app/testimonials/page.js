import TestimonialsClient from './TestimonialsClient';
import { getMediaUrl, getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

const fallbackHero = {
  label: 'Happy Travelers',
  title: "Don't Just Take Our Word For It",
  description: 'Discover why thousands of travelers choose us for their unforgettable journeys, seamless visa processing, and forex needs.',
  image: '',
};

const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const getFirstTagText = (html = '', tag) => {
  const match = String(html).match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
};

const buildHeroContent = (page) => {
  const heroSection = page?.details?.find((detail) => (
    detail.section === 'story_grid' && detail.key === 'hero_key'
  )) || page?.details?.find((detail) => detail.section === 'story_grid');
  const storyHtml = heroSection?.json_data?.story_desc || '';
  const [descriptionTitle, ...descriptionLines] = String(heroSection?.description || '').split(/\r?\n/).filter(Boolean);

  return {
    label: heroSection?.title || fallbackHero.label,
    title: heroSection?.json_data?.heading_content || getFirstTagText(storyHtml, 'h1') || getFirstTagText(storyHtml, 'h2') || descriptionTitle || page?.title || fallbackHero.title,
    description: getFirstTagText(storyHtml, 'p') || descriptionLines.join(' ') || page?.description || fallbackHero.description,
    image: getMediaUrl(page?.feature_image),
  };
};

export async function generateMetadata() {
  const page = await getPageBySlug('testimonials');
  const hero = buildHeroContent(page);

  return {
    title: page?.meta_title || `${hero.label} | IT'S Travels & Tours`,
    description: page?.meta_description || hero.description,
    keywords: page?.keyword ? [page.keyword] : undefined,
    openGraph: {
      title: page?.meta_title || `${hero.label} | IT'S Travels & Tours`,
      description: page?.meta_description || hero.description,
      images: hero.image ? [{ url: hero.image, width: 1200, height: 630, alt: page?.alt_text || hero.label }] : undefined,
    },
  };
}

export default async function TestimonialsPage() {
  const page = await getPageBySlug('testimonials');
  const hero = buildHeroContent(page);

  return <TestimonialsClient hero={hero} />;
}
