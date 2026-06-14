'use client';

import React from 'react';

export interface StatusBadgeProps {
  variant?: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant = 'blue', children, className = '' }: StatusBadgeProps): React.ReactElement {
  return (
    <span className={`status-badge status-badge-${variant} ${className}`}>
      {children}
    </span>
  );
}

export default StatusBadge;
