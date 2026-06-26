import EventsClient from './EventsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Destination Weddings, Luxury Themes & Event Management | Events',
  description:
    'Plan destination weddings, anniversaries, birthdays, and theme parties. Professional event planners, catering partners, and custom themes with 24/7 service.',
  keywords:
    'Destination weddings, luxury event planners, wedding event organizer, corporate gala dinners, theme party management, wedding catering packages',
};

export default function EventsPage() {
  return <EventsClient />;
}
