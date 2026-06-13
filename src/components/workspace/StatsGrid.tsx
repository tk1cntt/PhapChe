'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
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

export function StatsGrid({ stats }: StatsGridProps): React.ReactElement {
  const t = useTranslations('UserWorkspace');

  const statItems = [
    {
      icon: Building2,
      variant: 'green' as const,
      title: t('statWorkspace'),
      value: stats.isActive ? t('active') : t('inactive'),
      description: stats.slug,
    },
    {
      icon: Users,
      variant: 'blue' as const,
      title: t('statMembers'),
      value: stats.memberCount,
      description: t('statMembersDesc', {
        active: stats.activeMemberCount,
        invited: stats.invitedMemberCount,
      }),
    },
    {
      icon: FileText,
      variant: 'orange' as const,
      title: t('statRequests'),
      value: stats.requestCount,
      description: t('statRequestsDesc', { processing: stats.processingRequestCount }),
    },
    {
      icon: Lock,
      variant: 'purple' as const,
      title: t('statVaultScope'),
      value: stats.vaultFileCount > 0 ? t('enabled') : t('disabled'),
      description: t('statVaultScopeDesc'),
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

export default StatsGrid;
