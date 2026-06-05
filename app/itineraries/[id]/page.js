import TripInquiryDetailClient from './TripInquiryDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;

  return {
    title: `Booked Itinerary ${id}`,
    description: 'Recently booked customized travel itinerary.',
  };
}

export default async function TripInquiryDetailPage({ params }) {
  const { id } = await params;

  return <TripInquiryDetailClient id={id} />;
}
