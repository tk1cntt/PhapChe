'use client';

import React from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  DollarSign,
  Users,
  Folder,
  MessageSquare,
  Shield,
} from 'lucide-react';

export type StatCardVariant = 'blue' | 'green' | 'orange' | 'purple' | 'red';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon?: string;
  variant?: StatCardVariant;
  loading?: boolean;
  onClick?: () => void;
  suffix?: string;
  precision?: number;
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  file: <FileText size={20} />,
  check: <CheckCircle size={20} />,
  clock: <Clock size={20} />,
  warning: <AlertTriangle size={20} />,
  done: <FileCheck size={20} />,
  money: <DollarSign size={20} />,
  users: <Users size={20} />,
  folder: <Folder size={20} />,
  message: <MessageSquare size={20} />,
  shield: <Shield size={20} />,
};

const variantConfig: Record<StatCardVariant, { iconKey: string }> = {
  blue: { iconKey: 'file' },
  green: { iconKey: 'check' },
  orange: { iconKey: 'clock' },
  purple: { iconKey: 'done' },
  red: { iconKey: 'warning' },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  variant = 'blue',
  loading = false,
  onClick,
  suffix,
  precision,
  className,
}) => {
  const config = variantConfig[variant];
  const iconKey = icon || config.iconKey;
  const displayIcon = iconMap[iconKey] || iconMap.file;

  const formattedValue =
    typeof value === 'number' && precision !== undefined
      ? value.toFixed(precision)
      : value;

  return (
    <div
      className={`stat-card ${className || ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className={`stat-icon ${variant}`}>
        {displayIcon}
      </div>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">
          {loading ? '—' : formattedValue}{suffix && !loading ? <span style={{ fontSize: '0.6em' }}>{suffix}</span> : null}
        </div>
        <div className="stat-desc" />
      </div>
    </div>
  );
};

export default StatCard;
