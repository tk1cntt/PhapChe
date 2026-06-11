'use client';

import React from 'react';
import { Building2, Users, FileText, Lock } from 'lucide-react';

export interface StatsData {
  isActive: boolean;
  slug: string;
  memberCount: number;
  activeMemberCount: number;
  invitedMemberCount: number;
  requestCount: number;
  processingRequestCount: number;
  vaultFileCount: number;
}

export interface StatsGridProps {
  stats: StatsData;
}

export function StatsGrid({ stats }: StatsGridProps): JSX.Element {
  const statItems = [
    {
      icon: Building2,
      variant: 'green' as const,
      title: 'Workspace',
      value: stats.isActive ? 'Active' : 'Inactive',
      description: stats.slug,
    },
    {
      icon: Users,
      variant: 'blue' as const,
      title: 'Thanh vien',
      value: stats.memberCount,
      description: `${stats.activeMemberCount} active, ${stats.invitedMemberCount} invited`,
    },
    {
      icon: FileText,
      variant: 'orange' as const,
      title: 'Ho so',
      value: stats.requestCount,
      description: `${stats.processingRequestCount} dang xu ly`,
    },
    {
      icon: Lock,
      variant: 'purple' as const,
      title: 'Vault scope',
      value: stats.vaultFileCount > 0 ? '96%' : '0%',
      description: 'Tai lieu co phan quyen',
    },
  ];

  return (
    <div className="stats">
      {statItems.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div key={index} className="stat-card">
            <div className={`stat-icon ${stat.variant}`}>
              <IconComponent />
            </div>
            <div className="stat-content">
              <div className="stat-title">{stat.title}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-desc">{stat.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
