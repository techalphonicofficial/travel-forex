import CruiseClient from './CruiseClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Luxury Cruise Packages & Ocean Cruises Booking | Cruise Deals',
  description:
    'Explore premium ocean and river cruises worldwide. Book Singapore, Maldives, Goa, European, and Caribbean cruise packages at best-guaranteed prices.',
  keywords:
    'cruise booking, ocean cruise packages, luxury cruises, Cordelia Cruises, Royal Caribbean India, Singapore cruise booking, cruise holiday packages',
};

export default function CruisePage() {
  return <CruiseClient />;
}
