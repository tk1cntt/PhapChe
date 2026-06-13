'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Clock, CheckCircle, Folder, AlertCircle } from 'lucide-react';

export interface StatCardProps {
  titleKey: string;
  value: number;
  descriptionKey?: string;
  description?: string;
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
  titleKey,
  value,
  descriptionKey,
  description,
  icon,
  variant,
}: StatCardProps): React.ReactElement {
  const IconComponent = iconMap[icon];
  const t = useTranslations('UserDashboard');

  return (
    <div className="stat-card">
      <div className={`stat-icon ${variant}`}>
        <IconComponent />
      </div>
      <div className="stat-content">
        <div className="stat-title">{t(titleKey)}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-desc">
          {description ?? (descriptionKey ? t(descriptionKey) : '')}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
