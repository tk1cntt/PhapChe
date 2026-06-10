'use client';

import { Card, Skeleton } from 'antd';

/**
 * Skeleton loader for card-based pages.
 * Displays multiple cards with skeleton content.
 */
interface CardSkeletonProps {
  count?: number;
}

/**
 * CardSkeleton - Displays skeleton loading UI for card-based admin pages.
 * @param count - Number of cards to display (default: 3)
 */
export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} style={{ marginBottom: 16 }}>
          <Skeleton active avatar={false} paragraph={{ rows: 2 }} title />
        </Card>
      ))}
    </>
  );
}
