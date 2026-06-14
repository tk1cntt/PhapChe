'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { StatsCardGrid } from './StatCard';
import WelcomeBanner from './WelcomeBanner';
import RecentCases from './RecentCases';
import DeadlineSLA from './DeadlineSLA';
import RecentDocuments from './RecentDocuments';
import ActivityTimeline from './ActivityTimeline';
import ToolbarCard from './ToolbarCard';
import CasesTable from './CasesTable';
import './dashboard.css';

interface CaseItem {
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
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch('/api/dashboard/all-cases')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch cases');
        return res.json();
      })
      .then((data) => {
        setCases(data);
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

  // Filter cases by search
  const searchedCases = searchTerm
    ? cases.filter(
        (c) =>
          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : cases;

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
      </a>
    </div>
  );
}
