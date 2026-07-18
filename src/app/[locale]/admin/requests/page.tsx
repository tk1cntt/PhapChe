'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminRequestsClient from '@/components/admin/AdminRequestsClient';
import { TriagePanel } from '@/components/admin/TriagePanel';
import { SpecialistWorkbench } from '@/components/admin/SpecialistWorkbench';
import { ReviewConsole } from '@/components/admin/ReviewConsole';
import { DeliveryConsole } from '@/components/admin/DeliveryConsole';
import { canSeeTab } from '@/lib/security/role-config';
import '@/styles/pages/admin/triage.css';

type TabKey = 'triage' | 'workbench' | 'review' | 'delivery' | 'all';

const ALL_TABS: readonly TabKey[] = ['triage', 'workbench', 'review', 'delivery', 'all'] as const;

const TAB_LABELS: Record<TabKey, string> = {
  triage: '📋 Phân loại & Gán',
  workbench: '🔧 Đang xử lý',
  review: '✅ Kiểm duyệt',
  delivery: '📦 Bàn giao',
  all: '📊 Tất cả hồ sơ',
};

export default function AdminRequestsPage() {
  const { user, isLoading } = useAuth();
  const userRoles: string[] = (user as any)?.roles ?? [];

  const visibleTabs = useMemo(() => {
    if (isLoading) return ALL_TABS;
    return ALL_TABS.filter(tab => canSeeTab(tab, userRoles));
  }, [userRoles, isLoading]);

  const [activeTab, setActiveTab] = useState<TabKey>(() => visibleTabs[0]);

  // If activeTab becomes invisible (role change), switch to first visible
  const effectiveTab = visibleTabs.includes(activeTab) ? activeTab : visibleTabs[0] ?? 'triage';

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  }

  return (
    <>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid var(--color-border)', paddingBottom: 0 }}>
        {visibleTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              borderBottom: effectiveTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: effectiveTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: effectiveTab === tab ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {effectiveTab === 'triage' && <TriagePanel />}
      {effectiveTab === 'workbench' && <SpecialistWorkbench />}
      {effectiveTab === 'review' && <ReviewConsole />}
      {effectiveTab === 'delivery' && <DeliveryConsole />}
      {effectiveTab === 'all' && <AdminRequestsClient />}
    </>
  );
}
