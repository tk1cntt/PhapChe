'use client';

import React from 'react';

export interface SlaBadgeProps {
  variant?: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export function SlaBadge({ variant = 'blue', children, className = '' }: SlaBadgeProps): React.ReactElement {
  return (
    <span className={`sla-badge sla-badge-${variant} ${className}`}>
      {children}
    </span>
  );
}

export default SlaBadge;
