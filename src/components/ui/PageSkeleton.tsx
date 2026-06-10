'use client';

import { Card, Skeleton } from 'antd';

/**
 * Skeleton loader for table-based pages.
 * Displays a card with title and paragraph skeleton to match page layout.
 */
interface PageSkeletonProps {
  rows?: number;
}

/**
 * PageSkeleton - Displays skeleton loading UI for table-based admin pages.
 * @param rows - Number of paragraph rows to display (default: 5)
 */
export function PageSkeleton({ rows = 5 }: PageSkeletonProps) {
  return (
    <Card>
      <Skeleton active paragraph={{ rows }} title />
    </Card>
  );
}
