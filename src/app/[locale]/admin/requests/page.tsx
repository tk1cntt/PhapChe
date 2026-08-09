'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminRoles } from '@/lib/security/AdminRoleContext';
import { TriagePanel } from '@/components/admin/TriagePanel';
import { SpecialistWorkbench } from '@/components/admin/SpecialistWorkbench';
import { ReviewConsole } from '@/components/admin/ReviewConsole';
import { DeliveryConsole } from '@/components/admin/DeliveryConsole';
import { canSeeTab } from '@/lib/security/role-config';
import '@/styles/pages/admin/requests.css';

type TabKey = 'triage' | 'workbench' | 'review' | 'delivery';

const WORKFLOW_TABS: readonly TabKey[] = ['triage', 'workbench', 'review', 'delivery'] as const;

const TAB_ICONS: Record<TabKey, string> = {
  triage: '📋',
  workbench: '🔧',
  review: '✅',
  delivery: '📦',
};

export default function AdminRequestsPage() {
  const t = useTranslations('AdminRequests');
  const userRoles = useAdminRoles();

  const visibleTabs = useMemo(() => {
    if (userRoles.length === 0) return [];
    return WORKFLOW_TABS.filter(tab => canSeeTab(tab, userRoles));
  }, [userRoles]);

  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const firstTab = visibleTabs[0] ?? null;

  // Reset activeTab when the selected tab is no longer visible
  useEffect(() => {
    if (activeTab && !visibleTabs.includes(activeTab)) {
      setActiveTab(null);
    }
  }, [activeTab, visibleTabs]);

  const effectiveTab = activeTab ?? firstTab;

  if (userRoles.length === 0 || !effectiveTab) {
    return (
      <div className="requests-error-state">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{t('errorForbidden')}</span>
      </div>
    );
  }

  return (
    <div className="requests-page">
      {/* Page Header — matching /admin/partner layout */}
      <div className="requests-page-header">
        <div>
          <h1>{t('pageTitle')}</h1>
          <p className="requests-subtitle">{t('pageDescription')}</p>
        </div>
      </div>

      {/* Tab Bar */}
      <nav className="requests-tabs" role="tablist">
        {visibleTabs.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={effectiveTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`requests-tab ${effectiveTab === tab ? 'active' : ''}`}
          >
            <span className="tab-icon">{TAB_ICONS[tab]}</span>
            {t(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="requests-tab-content">
        {effectiveTab === 'triage' && <TriagePanel />}
        {effectiveTab === 'workbench' && <SpecialistWorkbench />}
        {effectiveTab === 'review' && <ReviewConsole />}
        {effectiveTab === 'delivery' && <DeliveryConsole />}
      </div>
    </div>
  );
}
