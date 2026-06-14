'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import StatCard from './StatCard';
import WelcomeBanner from './WelcomeBanner';
import RecentCases from './RecentCases';
import DeadlineSLA from './DeadlineSLA';
import RecentDocuments from './RecentDocuments';
import ActivityTimeline from './ActivityTimeline';
import ToolbarCard from './ToolbarCard';
import CasesTable from './CasesTable';
import './dashboard.css';

interface DashboardData {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  stats: {
    totalRequests: number;
    inProgress: number;
    completed: number;
    vaultDocs: number;
  };
  welcome: {
    activeRequests: number;
    pendingDocs: number;
    newReplies: number;
    userName: string;
  };
  recentCases: Array<{
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
  }>;
  deadlines: Array<{
    id: string;
    title: string;
    code: string;
    slaDeadline: string;
    progress: number;
    status: 'ok' | 'warn' | 'danger';
    timeText: string;
  }>;
  recentDocs: Array<{
    id: string;
    filename: string;
    size: number;
    mimeType: string;
    status: string;
    uploadedBy: string;
    updatedAt: string;
    relativeTime: string;
  }>;
  activity: Array<{
    id: string;
    action: string;
    description: string;
    actor: string;
    timestamp: string;
    relativeTime: string;
  }>;
  allCases?: Array<{
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
  }>;
  totalCases?: number;
}

function LoadingSkeleton() {
  return (
    <div className="dashboard-loading">
      <div className="loading-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="loading-stat">
            <div className="loading-icon" />
            <div className="loading-text">
              <div className="loading-line short" />
              <div className="loading-line" />
              <div className="loading-line medium" />
            </div>
          </div>
        ))}
      </div>
      <div className="loading-panel">
        <div className="loading-line" />
        <div className="loading-line" />
        <div className="loading-line medium" />
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const t = useTranslations('DashboardClient');
  const tStat = useTranslations('StatCard');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <div className="dashboard-error">{error}</div>;
  if (!data) return null;

  // Use recentCases for table display
  const filteredCases = data.recentCases;
  const searchedCases = searchTerm
    ? filteredCases.filter(
        (c) =>
          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredCases;

  return (
    <div className="dashboard-page">
      {/* Page Header - Greeting */}
      <div className="page-header">
        <div>
          <h1>{t('greeting', { name: data.welcome.userName || 'User' })}</h1>
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
      <WelcomeBanner
        workspaceName={data.workspace.name}
        activeRequests={data.welcome.activeRequests}
        pendingDocs={data.welcome.pendingDocs}
        newReplies={data.welcome.newReplies}
      />

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          variant="blue"
          title={tStat('totalRequests')}
          value={data.stats.totalRequests}
          description={tStat('totalRequestsDesc')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          }
        />
        <StatCard
          variant="orange"
          title={tStat('inProgress')}
          value={data.stats.inProgress}
          description={tStat('inProgressDesc')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <StatCard
          variant="green"
          title={tStat('completed')}
          value={data.stats.completed}
          description={tStat('completedDesc')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          }
        />
        <StatCard
          variant="purple"
          title={tStat('vaultDocs')}
          value={data.stats.vaultDocs}
          description={tStat('vaultDocsDesc')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7h18v13H3z" />
              <path d="M3 7l3-4h12l3 4" />
            </svg>
          }
        />
      </div>

      {/* Grid 2: Recent Cases (2/3) + Deadline (1/3) */}
      <div className="grid-2">
        <RecentCases cases={data.recentCases} />
        <DeadlineSLA deadlines={data.deadlines} />
      </div>

      {/* Grid: Recent Docs (0.9fr) + Activity (1.1fr) */}
      <div className="dashboard-grid">
        <RecentDocuments documents={data.recentDocs} />
        <ActivityTimeline activities={data.activity} />
      </div>

      {/* Toolbar Card - Search and Filter */}
      <ToolbarCard
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          setCurrentPage(1);
        }}
      />

      {/* Table Card - All Cases with Paging */}
      <CasesTable
        cases={searchedCases}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={searchedCases.length}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Floating Chat Button */}
      <a href="/messages" className="floating-chat">
        <span className="chat-icon-wrapper">N</span>
        {data.welcome.newReplies > 0 && <span>{data.welcome.newReplies} {t('newMessages')}</span>}
      </a>
    </div>
  );
}
