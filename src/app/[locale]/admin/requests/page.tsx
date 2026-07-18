'use client';

import { useState, useMemo } from 'react';
import { useAdminRoles } from '@/lib/security/AdminRoleContext';
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

const PLACEHOLDER: Record<TabKey, string> = {
  triage: 'Đang tải phân loại...',
  workbench: 'Đang tải bàn làm việc...',
  review: 'Đang tải kiểm duyệt...',
  delivery: 'Đang tải bàn giao...',
  all: 'Đang tải tất cả hồ sơ...',
};

export default function AdminRequestsPage() {
  const userRoles = useAdminRoles();

  const visibleTabs = useMemo(() => {
    if (userRoles.length === 0) return [];
    return ALL_TABS.filter(tab => canSeeTab(tab, userRoles));
  }, [userRoles]);

  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const firstTab = visibleTabs[0] ?? null;

  // Set initial tab once auth resolves
  const effectiveTab = activeTab ?? firstTab;

  if (userRoles.length === 0) {
    return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  }

  if (!effectiveTab) {
    return <div className="p-8 text-center text-red-500">Bạn không có quyền truy cập trang này.</div>;
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
