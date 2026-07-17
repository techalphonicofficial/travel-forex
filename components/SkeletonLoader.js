export function TourCardSkeleton() {
  return (
    <div
      className="card-base overflow-hidden"
      style={{ borderRadius: 'var(--radius-xl)' }}
    >
      <div className="skeleton skeleton-img" style={{ height: 260 }} />
      <div className="p-4">
        <div className="skeleton skeleton-text" style={{ width: '40%', height: 13 }} />
        <div className="skeleton skeleton-title mt-2" />
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div className="d-flex gap-3 mt-3">
          <div className="skeleton skeleton-text" style={{ width: '25%', height: 13 }} />
          <div className="skeleton skeleton-text" style={{ width: '25%', height: 13 }} />
          <div className="skeleton skeleton-text" style={{ width: '35%', height: 13 }} />
        </div>
        <div
          className="d-flex justify-content-between align-items-center mt-4 pt-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div>
            <div className="skeleton skeleton-text" style={{ width: 60, height: 13 }} />
            <div className="skeleton skeleton-text" style={{ width: 40, height: 11 }} />
          </div>
          <div className="skeleton" style={{ width: 90, height: 36, borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    </div>
  );
}

export function DestinationCardSkeleton() {
  return (
    <div
      className="skeleton"
      style={{
        width: 240,
        minWidth: 240,
        aspectRatio: '4/5',
        borderRadius: 'var(--radius-xl)',
        flexShrink: 0,
      }}
    />
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="review-card">
      <div className="skeleton skeleton-text" style={{ width: '100%', height: 13 }} />
      <div className="skeleton skeleton-text" style={{ width: '90%', height: 13 }} />
      <div className="skeleton skeleton-text" style={{ width: '75%', height: 13 }} />
      <div className="d-flex align-items-center gap-3 mt-4">
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
        <div>
          <div className="skeleton skeleton-text" style={{ width: 100, height: 14 }} />
          <div className="skeleton skeleton-text" style={{ width: 70, height: 12 }} />
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div style={{ height: 220, background: 'var(--color-bg-soft)' }} className="skeleton" />
  );
}

export default function SkeletonLoader({ type = 'tour', count = 3 }) {
  const skeletons = Array.from({ length: count }, (_, i) => i);
  if (type === 'tour') {
    return skeletons.map((i) => <TourCardSkeleton key={i} />);
  }
  if (type === 'destination') {
    return skeletons.map((i) => <DestinationCardSkeleton key={i} />);
  }
  if (type === 'review') {
    return skeletons.map((i) => <ReviewCardSkeleton key={i} />);
  }
  return null;
}
