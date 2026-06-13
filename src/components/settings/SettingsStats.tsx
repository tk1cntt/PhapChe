'use client';

import React from 'react';
import { CheckCircle, Shield, Bell, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface SettingsStatsProps {
  accountStatus: string;
  securityStatus: string;
  notificationCount: number;
  workspaceCount: number;
}

interface StatItem {
  titleKey: string;
  value: string;
  descKey: string;
  icon: React.ReactNode;
  variant: 'green' | 'blue' | 'orange' | 'purple';
}

export function SettingsStats({
  accountStatus,
  securityStatus,
  notificationCount,
  workspaceCount,
}: SettingsStatsProps): React.ReactElement {
  const t = useTranslations('UserSettings');

  const statsData: StatItem[] = [
    { titleKey: 'statAccount', value: accountStatus, descKey: 'statAccountDesc', icon: <CheckCircle />, variant: 'green' },
    { titleKey: 'statSecurity', value: securityStatus, descKey: 'statSecurityDesc', icon: <Shield />, variant: 'blue' },
    { titleKey: 'statNotifications', value: notificationCount.toString(), descKey: 'statNotificationsDesc', icon: <Bell />, variant: 'orange' },
    { titleKey: 'statWorkspace', value: workspaceCount.toString(), descKey: 'statWorkspaceDesc', icon: <Building2 />, variant: 'purple' },
  ];

  return (
    <div className="stats">
      {statsData.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className={`stat-icon ${stat.variant}`}>{stat.icon}</div>
          <div className="stat-content">
            <div className="stat-title">{t(stat.titleKey)}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-desc">{t(stat.descKey)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SettingsStats;
