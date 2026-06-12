'use client';

import React from 'react';

export interface BadgeProps {
  variant: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps): React.ReactElement {
  return (
    <span className={`badge ${variant}`}>
      {children}
    </span>
  );
}

export default Badge;
