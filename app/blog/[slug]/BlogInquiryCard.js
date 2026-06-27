'use client';

import InquiryForm from '@/components/InquiryForm';

/**
 * Client-side inquiry card for blog detail pages.
 * blogTitle is passed from the server component and auto-filled as the reference.
 */
export default function BlogInquiryCard({ blogTitle = '' }) {
  return (
    <InquiryForm
      title="Plan This Trip"
      subtitle="Inspired by this article? Let our experts craft a personalised itinerary for you."
      serviceName="Blog-Inspired Holiday"
      prefillNote={blogTitle}
      variant="card"
      showMessage
    />
  );
}
