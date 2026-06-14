'use client';

import { useEffect, useState } from 'react';
import StatCard from './StatCard';
import WelcomeBanner from './WelcomeBanner';
import RecentCases from './RecentCases';
import DeadlineSLA from './DeadlineSLA';
import RecentDocuments from './RecentDocuments';
import ActivityTimeline from './ActivityTimeline';
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="dashboard-page">
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          variant="blue"
          title="Tổng hồ sơ"
          value={data.stats.totalRequests}
          description="Trong workspace hiện tại"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          }
        />
        <StatCard
          variant="orange"
          title="Đang xử lý"
          value={data.stats.inProgress}
          description="Chờ phản hồi chuyên viên"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <StatCard
          variant="green"
          title="Đã hoàn tất"
          value={data.stats.completed}
          description="Đúng SLA xử lý"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          }
        />
        <StatCard
          variant="purple"
          title="Tài liệu vault"
          value={data.stats.vaultDocs}
          description="Được phân quyền an toàn"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7h18v13H3z" />
              <path d="M3 7l3-4h12l3 4" />
            </svg>
          }
        />
      </div>

      {/* Welcome Banner */}
      <WelcomeBanner
        workspaceName={data.workspace.name}
        activeRequests={data.welcome.activeRequests}
        pendingDocs={data.welcome.pendingDocs}
        newReplies={data.welcome.newReplies}
      />

      {/* Two Column Grid: Recent Cases + Deadline */}
      <div className="dashboard-grid">
        <RecentCases cases={data.recentCases} />
        <DeadlineSLA deadlines={data.deadlines} />
      </div>

      {/* Two Column Grid: Recent Docs + Activity */}
      <div className="dashboard-grid">
        <RecentDocuments documents={data.recentDocs} />
        <ActivityTimeline activities={data.activity} />
      </div>

      {/* Floating Chat Button */}
      <a href="/messages" className="floating-chat">
        <span className="chat-icon-wrapper">N</span>
        {data.welcome.newReplies > 0 && (
          <span>{data.welcome.newReplies} Tin mới</span>
        )}
      </a>
    </div>
  );
}
