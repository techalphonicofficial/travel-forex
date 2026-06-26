import ConferencesClient from './ConferencesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Corporate Conferences, Seminars & Business Events | Conferences',
  description:
    'Plan corporate conferences, AGM meetings, executive summits, and business seminars. Complete logistics support, audio-visual equipment, and bulk bookings with 24/7 service.',
  keywords:
    'Corporate conferences, business event management, AGM planners, corporate summit organizers, conference audio visual hire, business seminar venues',
};

export default function ConferencesPage() {
  return <ConferencesClient />;
}
