import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Tour Packages - ITS TRAVELS AND TOURS',
  description: 'Browse handpicked holiday packages across the world.',
};

export default function PackagesPage({ searchParams }) {
  const queryString = new URLSearchParams(searchParams).toString();
  redirect(`/tour${queryString ? `?${queryString}` : ''}`);
}
