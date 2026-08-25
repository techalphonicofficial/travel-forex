import HotelsClient from './HotelsClient';
import { getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

export default async function HotelsPage() {
  let heroData = null;
  try {
    const pageData = await getPageBySlug('home');
    if (pageData?.details) {
      heroData = pageData.details.find(d => d.key === 'explore-hotels') || null;
    }
  } catch (error) {
    console.error("Failed to fetch hotel hero CMS data:", error.message);
  }

  return <HotelsClient initialHeroData={heroData} />;
}
