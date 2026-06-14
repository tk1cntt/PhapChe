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

export interface CaseItem {
  id: string;
  code: string;
  title: string;
  matterType: string;
  status: string;
  statusVariant: string;
  statusText: string;
  assignee: string;
  assigneeRole: string;
  updatedAt: string;
}

export interface StatsData {
  totalRequests: number;
  inProgress: number;
  completed: number;
  vaultDocs: number;
}

export interface WelcomeData {
  workspace: { id: string; name: string; slug: string };
  activeRequests: number;
  pendingDocs: number;
  newReplies: number;
  userName: string;
}

interface DashboardClientProps {
  welcomeData: WelcomeData;
  stats: StatsData;
  allCases: CaseItem[];
}

export default function DashboardClient({ welcomeData, stats, allCases }: DashboardClientProps) {
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

      {/* Welcome Banner */}
      <WelcomeBanner data={welcomeData} />

      {/* Stats Grid */}
      <StatsCardGrid data={stats} />

      {/* Grid 2: Recent Cases + Deadline */}
      <div className="grid-2">
        <RecentCases cases={allCases.slice(0, 5)} />
        <DeadlineSLA cases={allCases} />
      </div>

      {/* Grid: Recent Docs + Activity */}
      <div className="dashboard-grid">
        <RecentDocuments />
        <ActivityTimeline />
      </div>

      {/* Table Card - All Cases with Paging */}
      <CasesTable cases={allCases} />

      {/* Floating Chat Button */}
      <a href="/messages" className="floating-chat">
        <span className="chat-icon-wrapper">N</span>
      </a>
    </div>
  );
}
