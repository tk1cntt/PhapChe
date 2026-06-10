'use client';

import React from 'react';
import { FileText, Clock, CheckCircle, Folder, AlertCircle } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: 'file' | 'clock' | 'check' | 'folder' | 'alert';
  variant: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const iconMap = {
  file: FileText,
  clock: Clock,
  check: CheckCircle,
  folder: Folder,
  alert: AlertCircle,
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
