'use client';

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

const statCards = (stats: OpsStats): StatCardProps[] => [
  {
    title: 'Hồ sơ đang mở',
    value: stats.openRequests,
    description: 'Đang trong quy trình xử lý',
    variant: 'blue',
  },
  {
    title: 'Sắp quá SLA',
    value: stats.nearSla,
    description: 'Cần xử lý trong 24h',
    variant: 'orange',
  },
  {
    title: 'Hoàn tất hôm nay',
    value: stats.completedToday,
    description: 'Workflow đã đóng',
    variant: 'green',
  },
  {
    title: 'Cảnh báo audit',
    value: stats.auditWarnings,
    description: 'Yêu cầu rà soát quyền',
    variant: 'red',
  },
];

export function AdminOperationsStats({ stats }: AdminOperationsStatsProps) {
  return <AdminStatGrid cards={statCards(stats)} />;
}
