'use client';

import { useTranslations } from 'next-intl';
import { StatsCardGrid } from './StatCard';
import WelcomeBanner from './WelcomeBanner';
import RecentCases from './RecentCases';
import DeadlineSLA from './DeadlineSLA';
import RecentDocuments from './RecentDocuments';
import ActivityTimeline from './ActivityTimeline';
import CasesTable from './CasesTable';
import './dashboard.css';

export default function DashboardClient() {
  const t = useTranslations('DashboardClient');

  return (
    <div className="dashboard-page">
      {/* Page Header - Greeting */}
      <div className="page-header">
        <div>
          <h1>{t('greeting', { name: '' })}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>
        <button className="create-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          {t('createRequest')}
        </button>
      </div>

      {/* Welcome Banner - self-fetching */}
      <WelcomeBanner />

      {/* Stats Grid - self-fetching */}
      <StatsCardGrid />

      {/* Grid 2: Recent Cases + Deadline - self-fetching */}
      <div className="grid-2">
        <RecentCases />
        <DeadlineSLA />
      </div>

      {/* Grid: Recent Docs + Activity - self-fetching */}
      <div className="dashboard-grid">
        <RecentDocuments />
        <ActivityTimeline />
      </div>

      {/* Table Card - All Cases with Paging - self-fetching */}
      <CasesTable />

      {/* Floating Chat Button */}
      <a href="/messages" className="floating-chat">
        <span className="chat-icon-wrapper">N</span>
      </a>
    </div>
  );
}
