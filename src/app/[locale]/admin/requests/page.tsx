'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import AdminRequestsClient from '@/components/admin/AdminRequestsClient';
import { TriagePanel } from '@/components/admin/TriagePanel';
import { SpecialistWorkbench } from '@/components/admin/SpecialistWorkbench';
import { ReviewConsole } from '@/components/admin/ReviewConsole';
import '@/styles/pages/admin/triage.css';

export default function AdminRequestsPage() {
  const t = useTranslations('AdminTriage');
  const [activeTab, setActiveTab] = useState<'triage' | 'workbench' | 'review' | 'all'>('triage');

  return (
    <>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid var(--color-border)', paddingBottom: 0 }}>
        {(['triage', 'workbench', 'review', 'all'] as const).map(tab => {
          const labels: Record<string, string> = {
            triage: '📋 Phân loại & Gán',
            workbench: '🔧 Đang xử lý',
            review: '✅ Kiểm duyệt',
            all: '📊 Tất cả hồ sơ',
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '-2px',
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {activeTab === 'triage' && <TriagePanel />}
      {activeTab === 'workbench' && <SpecialistWorkbench />}
      {activeTab === 'review' && <ReviewConsole />}
      {activeTab === 'all' && <AdminRequestsClient />}
    </>
  );
}
