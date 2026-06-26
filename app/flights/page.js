import FlightsClient from './FlightsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Book International & Domestic Flights | Best Flight Deals & Airline Tickets',
  description:
    'Search and book domestic and international flights at the lowest prices. Enjoy exclusive airline deals, zero convenience fees, and 24/7 travel assistance.',
  keywords:
    'flight booking, buy flight tickets, cheap flights, international flight tickets, domestic flights India, air ticket booking deals',
};

export default function FlightsPage() {
  return <FlightsClient />;
}
