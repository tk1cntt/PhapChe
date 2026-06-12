'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import SummaryBanner from '@/app/[locale]/customer/components/SummaryBanner';
import StatCard from '@/app/[locale]/customer/components/StatCard';
import MyCasesToolbar from '@/app/[locale]/customer/components/MyCasesToolbar';
import MyCasesTable from '@/app/[locale]/customer/components/MyCasesTable';
import FloatingChatButton from '@/app/[locale]/customer/components/FloatingChatButton';

interface CaseRow {
  id: string;
  code: string;
  statusText: string;
  type: string;
  typeEn: string;
  statusBadge: 'review' | 'pending' | 'approved' | 'overdue' | 'submitted';
  specialistName: string;
  specialistRole: string;
  updatedDate: string;
  updatedTime: string;
  slaText: string;
  slaVariant: 'green' | 'orange' | 'red' | 'blue';
  actionText: string;
  actionHref: string;
}

interface MyCasesClientProps {
  userName: string;
  workspaceName: string;
  workspaceSlug: string;
  stats: { total: number; processing: number; completed: number; overdue: number };
  requests: CaseRow[];
  notificationCount: number;
}

export function MyCasesClient({ userName, workspaceName, workspaceSlug, stats, requests, notificationCount }: MyCasesClientProps) {
  const t = useTranslations('UserCases');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);
  const handleStatusFilter = useCallback((status: string | null) => setSelectedStatus(status), []);
  const handleTypeFilter = useCallback((type: string | null) => setSelectedType(type), []);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = req.code.toLowerCase().includes(query) || req.type.toLowerCase().includes(query) || req.typeEn.toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (selectedStatus) {
        const statusMap: Record<string, CaseRow['statusBadge']> = {
          under_review: 'review',
          needs_response: 'pending',
          approved: 'approved',
          submitted: 'submitted',
          overdue: 'overdue',
        };
        if (req.statusBadge !== statusMap[selectedStatus]) return false;
      }
      return true;
    });
  }, [requests, searchQuery, selectedStatus, selectedType]);

  return (
    <>
      <SummaryBanner
        title={t('bannerTitle')}
        description={t('bannerDesc')}
        buttonText={t('pageTitle')}
        workspaceSlug={workspaceSlug}
      />

      <div className="stats">
        <StatCard titleKey="statTotal" value={stats.total} descriptionKey="statTotalDesc" icon="file" variant="blue" />
        <StatCard titleKey="statProcessing" value={stats.processing} descriptionKey="statProcessingDesc" icon="clock" variant="orange" />
        <StatCard titleKey="statCompleted" value={stats.completed} descriptionKey="statCompletedDesc" icon="check" variant="green" />
        <StatCard titleKey="statOverdue" value={stats.overdue} descriptionKey="statOverdueDesc" icon="alert" variant="red" />
      </div>

      <MyCasesToolbar
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onTypeFilter={handleTypeFilter}
        selectedStatus={selectedStatus}
        selectedType={selectedType}
      />

      <MyCasesTable requests={filteredRequests} />

      <FloatingChatButton notificationCount={notificationCount} />
    </>
  );
}
