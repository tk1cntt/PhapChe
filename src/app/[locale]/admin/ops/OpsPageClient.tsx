'use client';

import { useEffect, useState } from 'react';
import { Flex, Spin } from 'antd';
import AdminOpsTable, { WorkloadPanel, TimelinePanel } from './AdminOpsTables';
import type { OpsRequestRow, OpsWorkloadRow, OpsTimelineEvent } from './AdminOpsTables';
import type { RequestStatus } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { AdminStatGrid } from '../components/AdminStatGrid';

interface DashboardData {
  total: number;
  byStatus: Array<{ status: RequestStatus; count: number }>;
  requests: OpsRequestRow[];
  workload: OpsWorkloadRow[];
  timeline?: OpsTimelineEvent[];
}

export default function OpsPageClient() {
  const t = useTranslations('AdminOps');
  const pathname = usePathname();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const locale = pathname.split('/')[1] || 'vi';
    fetch(`/${locale}/api/ops`)
      .then((r) => r.json())
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  if (loading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    );
  }

  const requestRows: OpsRequestRow[] = (dashboard?.requests ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    workspaceId: r.workspaceId,
    matterTypeKey: r.matterTypeKey,
    matterTypeLabel: r.matterTypeLabel,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    assignedSpecialistName: r.assignedSpecialistName,
    assignedReviewerName: r.assignedReviewerName,
    createdAt: r.createdAt,
    currentStatusAgeDays: r.currentStatusAgeDays,
  }));

  const workloadRows: OpsWorkloadRow[] = (dashboard?.workload ?? []).map((r) => ({
    kind: r.kind,
    userId: r.userId,
    name: r.name,
    email: r.email,
    activeCount: r.activeCount,
    byStatus: r.byStatus,
    oldestActiveAgeDays: r.oldestActiveAgeDays,
  }));

  const timelineEvents: OpsTimelineEvent[] = dashboard?.timeline ?? [];

  const inProgress = dashboard?.byStatus.find(s => s.status === 'in_progress')?.count || 0;
  const pendingReview = dashboard?.byStatus.find(s => s.status === 'pending_review')?.count || 0;
  const delivered = dashboard?.byStatus.find(s => s.status === 'delivered')?.count || 0;
  const total = dashboard?.total || 0;

  const statCards = [
    { title: t('statOpenFiles'), value: total, description: t('statOpenFilesDesc'), variant: 'blue' as const },
    { title: t('statNearSla'), value: pendingReview, description: t('statNearSlaDesc'), variant: 'orange' as const },
    { title: t('statCompletedToday'), value: delivered, description: t('statCompletedTodayDesc'), variant: 'green' as const },
    { title: t('statAuditAlerts'), value: inProgress, description: t('statAuditAlertsDesc'), variant: 'red' as const },
  ];

  return (
    <>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
            {t('pageTitle')}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>
            {t('pageDescription')}
          </p>
        </div>
        <button style={{
          height: 45,
          padding: '0 18px',
          border: 'none',
          borderRadius: 8,
          background: 'linear-gradient(180deg, #0b8f86, #087970)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 700,
          boxShadow: '0 8px 18px rgba(8, 127, 120, 0.25)',
          cursor: 'pointer',
          fontSize: 14,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M3 3v18h18"/>
            <path d="M7 15l4-4 4 4 5-7"/>
          </svg>
          {t('exportReport')}
        </button>
      </div>

      <AdminStatGrid cards={statCards} />

      {/* Grid 2: Workload + Timeline */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.35fr 0.65fr',
        gap: 20,
        marginBottom: 24,
      }}>
        <WorkloadPanel workload={workloadRows} />
        <TimelinePanel events={timelineEvents} />
      </div>

      {/* Toolbar */}
      <div style={{
        background: '#fff',
        border: '1px solid #dfe7f1',
        borderRadius: 15,
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
        padding: 20,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search */}
            <div style={{
              width: 330,
              height: 44,
              border: '1px solid #dfe7f1',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '0 14px',
              color: '#718096',
              background: '#fff',
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder={t('searchPlaceholder')}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }}
              />
            </div>
            {/* Bộ lọc */}
            <button style={{
              height: 44,
              border: '1px solid #dfe7f1',
              background: '#fff',
              borderRadius: 8,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#1e293b',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>
              </svg>
              {t('filterBtn')}
            </button>
            {/* SLA dropdown */}
            <button style={{
              height: 44,
              border: '1px solid #dfe7f1',
              background: '#fff',
              borderRadius: 8,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#1e293b',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              SLA
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {/* Người phụ trách dropdown */}
            <button style={{
              height: 44,
              border: '1px solid #dfe7f1',
              background: '#fff',
              borderRadius: 8,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#1e293b',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              {t('assigneeBtn')}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Refresh */}
            <button style={{
              width: 52,
              height: 44,
              border: '1px solid #dfe7f1',
              background: '#fff',
              borderRadius: 8,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 16v5h5"/>
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 8V3h-5"/>
              </svg>
            </button>
            {/* Export */}
            <button style={{
              height: 44,
              border: '1px solid #dfe7f1',
              background: '#fff',
              borderRadius: 8,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              color: '#1e293b',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              Export
            </button>
            {/* Cột hiển thị */}
            <button style={{
              height: 44,
              border: '1px solid #dfe7f1',
              background: '#fff',
              borderRadius: 8,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              color: '#1e293b',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              {t('columnsBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <AdminOpsTable requests={requestRows} />
    </>
  );
}
