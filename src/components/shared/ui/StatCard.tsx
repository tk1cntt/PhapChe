'use client';

/**
 * StatCard Component
 * Unified metrics display component with 5 color variants
 */

import React from 'react';
import { Card, Statistic } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileDoneOutlined,
  DollarOutlined,
  TeamOutlined,
  FolderOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

export type StatCardVariant = 'blue' | 'green' | 'orange' | 'purple' | 'red';

export interface StatCardProps {
  /** Primary label displayed above the value */
  title: string;
  /** Numeric or string value to display */
  value: number | string;
  /** Icon identifier from available set */
  icon?: string;
  /** Color variant affecting icon and styling */
  variant?: StatCardVariant;
  /** Shows loading spinner when true */
  loading?: boolean;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Suffix displayed after value (e.g., '%', 'VNĐ') */
  suffix?: string;
  /** Decimal precision for numeric values */
  precision?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * Icon map for available icon types
 */
const iconMap: Record<string, React.ReactNode> = {
  file: <FileTextOutlined />,
  check: <CheckCircleOutlined />,
  clock: <ClockCircleOutlined />,
  warning: <WarningOutlined />,
  done: <FileDoneOutlined />,
  money: <DollarOutlined />,
  users: <TeamOutlined />,
  folder: <FolderOutlined />,
  message: <MessageOutlined />,
  shield: <SafetyCertificateOutlined />,
};

/**
 * Configuration for each variant
 */
const variantConfig: Record<StatCardVariant, { icon: React.ReactNode; color: string }> = {
  blue: { icon: <FileTextOutlined />, color: '#1677ff' },
  green: { icon: <CheckCircleOutlined />, color: '#52c41a' },
  orange: { icon: <ClockCircleOutlined />, color: '#fa8c16' },
  purple: { icon: <FileDoneOutlined />, color: '#722ed1' },
  red: { icon: <WarningOutlined />, color: '#ff4d4f' },
};

/**
 * StatCard displays a metric with an icon and optional interaction
 *
 * @example
 * // Basic usage
 * <StatCard title="Tổng yêu cầu" value={42} variant="blue" />
 *
 * @example
 * // With icon and suffix
 * <StatCard
 *   title="Tỷ lệ hoàn thành"
 *   value={85.5}
 *   suffix="%"
 *   precision={1}
 *   variant="green"
 * />
 *
 * @example
 * // Interactive card
 * <StatCard
 *   title="Đang xử lý"
 *   value={12}
 *   onClick={() => navigate('/requests?status=in_progress')}
 *   variant="orange"
 * />
 */
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
  const displayIcon = icon ? iconMap[icon] || iconMap.file : config.icon;

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={className}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        precision={precision}
        prefix={<span style={{ color: config.color, marginRight: 8 }}>{displayIcon}</span>}
        loading={loading}
        valueStyle={{ color: '#262626', fontSize: '28px', fontWeight: 600 }}
      />
    </Card>
  );
};

export default StatCard;
