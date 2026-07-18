'use client';

/**
 * Skeleton loader for card-based pages.
 * Uses CSS skeleton classes from tokens system.
 */
interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="panel" style={{ marginBottom: 16 }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: '100%' }} />
          <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        </div>
      ))}
    </>
  );
}
