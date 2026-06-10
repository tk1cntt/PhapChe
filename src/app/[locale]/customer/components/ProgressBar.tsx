'use client';

import React from 'react';

export interface ProgressBarProps {
  value: number;
  status: 'ok' | 'warn' | 'danger';
}

export function ProgressBar({ value, status }: ProgressBarProps): JSX.Element {
  return (
    <div className="progress">
      <span
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
        }}
        className={status}
      />
    </div>
  );
}
