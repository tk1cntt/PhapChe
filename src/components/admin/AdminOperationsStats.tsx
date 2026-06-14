'use client';

import { useTranslations } from 'next-intl';
import { AdminStatGrid, StatCardProps } from '@/components/admin/AdminStatGrid';

interface OpsStats {
  openRequests: number;
  nearSla: number;
  completedToday: number;
  auditWarnings: number;
}

interface AdminOperationsStatsProps {
  stats: OpsStats;
}

export function AdminOperationsStats({ stats }: AdminOperationsStatsProps) {
  const t = useTranslations('AdminOps');

  const statCardsData: StatCardProps[] = [
    {
      title: t('statOpenFiles'),
      value: stats.openRequests,
      description: t('statOpenFilesDesc'),
      variant: 'blue',
    },
    {
      title: t('statNearSla'),
      value: stats.nearSla,
      description: t('statNearSlaDesc'),
      variant: 'orange',
    },
    {
      title: t('statCompletedToday'),
      value: stats.completedToday,
      description: t('statCompletedTodayDesc'),
      variant: 'green',
    },
    {
      title: t('statAuditAlerts'),
      value: stats.auditWarnings,
      description: t('statAuditAlertsDesc'),
      variant: 'red',
    },
  ];

  return <AdminStatGrid cards={statCardsData} />;
}
