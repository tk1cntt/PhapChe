'use client';

import React from 'react';
import { FileText, Clock, CheckCircle, Folder } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: 'file' | 'clock' | 'check' | 'folder';
  variant: 'blue' | 'green' | 'orange' | 'purple';
}

const iconMap = {
  file: FileText,
  clock: Clock,
  check: CheckCircle,
  folder: Folder,
};

export function StatCard({
  title,
  value,
  description,
  icon,
  variant,
}: StatCardProps): JSX.Element {
  const IconComponent = iconMap[icon];

  return (
    <div className="stat-card">
      <div className={`stat-icon ${variant}`}>
        <IconComponent />
      </div>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-desc">{description}</div>
      </div>
    </div>
  );
}
