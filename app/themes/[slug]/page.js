import { getPackageCategories, getPackages } from '@/utils/api';
import ThemeDetailClient from './ThemeDetailClient';

export const dynamic = 'force-dynamic';

export default async function ThemeDetailPage({ params }) {
  const { slug } = await params;

  // Fetch all categories to find the current one for its title and banner image
  const allCategories = await getPackageCategories();
  const currentCategory = allCategories?.find(c => c.slug === slug || String(c.id) === slug) || null;
  
  // Fetch packages for this category
  const packages = await getPackages({ package_category_slug: slug });

  return (
    <ThemeDetailClient 
      slug={slug} 
      category={currentCategory} 
      packages={packages} 
    />
  );
}
