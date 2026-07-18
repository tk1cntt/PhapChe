'use client';

/**
 * Skeleton loader for table-based pages.
 * Uses CSS skeleton classes from tokens system.
 */
interface PageSkeletonProps {
  rows?: number;
}

export function PageSkeleton({ rows = 5 }: PageSkeletonProps) {
  return (
    <div className="table-card">
      <div className="skeleton skeleton-title" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton skeleton-row" />
      ))}
    </div>
  );
}
