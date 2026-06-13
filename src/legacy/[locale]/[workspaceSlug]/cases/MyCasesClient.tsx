'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(searchParams.get('status'));
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Debounced URL update function
  const updateURL = useCallback((search: string, status: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set('search', search);
    else params.delete('search');
    if (status) params.set('status', status);
    else params.delete('status');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Debounced callback with 300ms delay
  const debouncedUpdateURL = useCallback((search: string, status: string | null) => {
    const timeoutId = setTimeout(() => {
      updateURL(search, status);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [updateURL]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      // Cleanup handled by returning clearTimeout
    };
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedUpdateURL(query, selectedStatus);
  }, [selectedStatus, debouncedUpdateURL]);

  const handleStatusFilter = useCallback((status: string | null) => {
    setSelectedStatus(status);
    debouncedUpdateURL(searchQuery, status);
  }, [searchQuery, debouncedUpdateURL]);

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
