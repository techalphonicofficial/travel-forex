import GalleryClient from './GalleryClient';
import { getPageBySlug } from '@/utils/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const page = await getPageBySlug('TravelGallery');
  
  return {
    title: page?.meta_title || page?.title || 'Our Travel Gallery - Tours & Travels',
    description: page?.meta_description || page?.description || 'Explore our masonry gallery of beautiful travel destinations and packages.',
    keywords: page?.keyword ? [page.keyword] : undefined,
  };
}

export default async function GalleryPage() {
  const pageData = await getPageBySlug('TravelGallery');

  return (
    <main>
      <GalleryClient pageData={pageData} />
    </main>
  );
}
