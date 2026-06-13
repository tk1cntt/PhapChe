'use client';

import React from 'react';

export interface BadgeProps {
  variant?: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'blue', children, className = '' }: BadgeProps): React.ReactElement {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
