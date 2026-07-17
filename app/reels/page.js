import { Suspense } from 'react';
import ReelsViewer from './ReelsViewer';

export const metadata = {
  title: 'Travel Reels — ITS TRAVELS AND TOURS',
  description: 'Watch real travel experiences shared by our happy travelers.',
};

export default function ReelsPage() {
  return (
    <Suspense fallback={null}>
      <ReelsViewer />
    </Suspense>
  );
}
