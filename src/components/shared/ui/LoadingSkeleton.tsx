'use client';

import React from 'react';

export interface LoadingSkeletonProps {
  variant: 'card' | 'table-row' | 'list-item' | 'text-line';
  count?: number;
  className?: string;
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`h-[200px] rounded-md bg-gray-200 shadow animate-pulse ${className || ''}`} />
  );
}

function TableRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 py-3 ${className || ''}`}>
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="h-8 w-20 rounded bg-gray-200 animate-pulse" />
    </div>
  );
}

function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 py-2 ${className || ''}`}>
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

function TextLineSkeleton({ className }: { className?: string }) {
  return (
    <div className={`h-4 w-full rounded bg-gray-200 animate-pulse ${className || ''}`} />
  );
}

/**
 * LoadingSkeleton — hiển thị placeholder trong khi dữ liệu đang tải.
 * Hỗ trợ 4 variant: card, table-row, list-item, text-line.
 */
export function LoadingSkeleton({ variant, count = 1, className }: LoadingSkeletonProps) {
  const variants: Record<string, React.FC<{ className?: string }>> = {
    'card': CardSkeleton,
    'table-row': TableRowSkeleton,
    'list-item': ListItemSkeleton,
    'text-line': TextLineSkeleton,
  };

  const SkeletonComponent = variants[variant];

  if (!SkeletonComponent) return null;

  return (
    <div className="flex flex-col gap-4" role="status">
      <span className="sr-only">Đang tải...</span>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonComponent key={`${variant}-${i}`} className={className} />
      ))}
    </div>
  );
}
