'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatsCardGrid } from './StatCard';
import WelcomeBanner from './WelcomeBanner';
import DeadlineSLA from './DeadlineSLA';
import RecentDocuments from './RecentDocuments';
import ActivityTimeline from './ActivityTimeline';
import CasesTable from './CasesTable';
import { ErrorBoundaryWrapper } from '@/components/shared/ui/ErrorBoundary';
import '@/styles/pages/dashboard.css';

// Panel skeleton components
function StatCardsSkeleton() {
  return (
    <div className="stats-grid">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="stat-card loading-stat">
          <div className="loading-icon" />
          <div className="loading-text">
            <div className="loading-line short" />
            <div className="loading-line medium" />
            <div className="loading-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentDocumentsSkeleton() {
  return (
    <div className="panel loading-panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7h18v13H3z" />
            <path d="M3 7l3-4h12l3 4" />
          </svg>
          <span>Đang tải...</span>
        </div>
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="document-item" style={{ minHeight: 72 }}>
          <div className="loading-line medium" style={{ height: 20 }} />
        </div>
      ))}
    </div>
  );
}

function ActivityTimelineSkeleton() {
  return (
    <div className="panel loading-panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>Đang tải...</span>
        </div>
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="timeline-item">
          <div className="timeline-dot" style={{ background: 'var(--color-border-strong)', border: '4px solid var(--color-bg)' }} />
          <div className="loading-line medium" style={{ height: 16, marginBottom: 8 }} />
          <div className="loading-line short" style={{ height: 12 }} />
        </div>
      ))}
    </div>
  );
}

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
  formattedDate: string;
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

export interface DocumentItem {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  status: string;
  uploadedBy: string;
  updatedAt: string;
  relativeTime: string;
}

export interface ActivityItem {
  id: string;
  type: 'user' | 'workspace' | 'request' | 'document' | 'review' | 'message' | 'vault' | 'partner' | 'system';
  action: string;
  description: string;
  actor: string;
  actorAvatar?: string;
  targetType?: string;
  targetLabel?: string;
  targetId?: string;
  timestamp: string;
  relativeTime: string;
  metadata?: Record<string, unknown>;
}

interface DashboardClientProps {
  welcomeData: WelcomeData;
  stats: StatsData;
  allCases: CaseItem[];
  recentDocuments?: DocumentItem[];
  recentActivities?: ActivityItem[];
}

export default function DashboardClient({
  welcomeData,
  stats,
  allCases,
  recentDocuments = [],
  recentActivities = [],
}: DashboardClientProps) {
  const t = useTranslations('DashboardClient');
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(!welcomeData || !stats || allCases.length === 0);

  useEffect(() => {
    fetch('/api/messages/unread-count')
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.unreadCount))
      .catch((err) => {
        console.error('Failed to fetch unread message count:', err);
        setUnreadCount(0);
      });
  }, []);

  return (
    <div className="dashboard-page">
      {/* Page Header - Greeting */}
      <div className="page-header">
        <div>
          <h1>{t('greeting', { name: welcomeData.userName })}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>
        <button className="create-btn" onClick={() => router.push('/create')}>
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
      <ErrorBoundaryWrapper
        fallback={
          <div className="stats-grid">
            <div className="panel" style={{ padding: 24, textAlign: 'center', color: 'var(--color-danger)' }}>
              Không thể tải dữ liệu. Vui lòng thử lại.
            </div>
          </div>
        }
      >
        {isLoading ? <StatCardsSkeleton /> : <StatsCardGrid data={stats} />}
      </ErrorBoundaryWrapper>

      {/* All Requests — CasesTable with paging (moved to top, replaces redundant RecentCases panel) */}
      <CasesTable cases={allCases} />

      {/* Grid: Deadline + Recent Docs + Activity */}
      <div className="dashboard-grid">
        <ErrorBoundaryWrapper
          fallback={
            <div className="panel" style={{ padding: 24, textAlign: 'center', color: 'var(--color-danger)' }}>
              Không thể tải dữ liệu. Vui lòng thử lại.
            </div>
          }
        >
          <DeadlineSLA cases={allCases} />
        </ErrorBoundaryWrapper>
        <ErrorBoundaryWrapper
          fallback={
            <div className="panel" style={{ padding: 24, textAlign: 'center', color: 'var(--color-danger)' }}>
              Không thể tải dữ liệu. Vui lòng thử lại.
            </div>
          }
        >
          {isLoading ? (
            <RecentDocumentsSkeleton />
          ) : (
            <RecentDocuments documents={recentDocuments} />
          )}
        </ErrorBoundaryWrapper>
        <ErrorBoundaryWrapper
          fallback={
            <div className="panel" style={{ padding: 24, textAlign: 'center', color: 'var(--color-danger)' }}>
              Không thể tải dữ liệu. Vui lòng thử lại.
            </div>
          }
        >
          {isLoading ? (
            <ActivityTimelineSkeleton />
          ) : (
            <ActivityTimeline activities={recentActivities} />
          )}
        </ErrorBoundaryWrapper>
      </div>

      {/* Floating Chat Button */}
      <Link href="/messages" className="floating-chat">
        {unreadCount > 0 && (
          <span className="chat-icon-wrapper">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </div>
  );
}
