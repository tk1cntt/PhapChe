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

function getStatusBadgeClass(variant: string): string {
  const map: Record<string, string> = {
    green: 'badge green',
    blue: 'badge blue',
    orange: 'badge orange',
    red: 'badge red',
    purple: 'badge purple',
  };
  return map[variant] || 'badge blue';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function DashboardClient() {
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

  // Filter and paginate cases
  const filteredCases = data.allCases || data.recentCases;
  const searchedCases = searchTerm
    ? filteredCases.filter(
        (c) =>
          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredCases;

  const totalPages = Math.ceil(searchedCases.length / pageSize);
  const paginatedCases = searchedCases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="dashboard-page">
      {/* Page Header - Greeting */}
      <div className="page-header">
        <div>
          <h1>Xin chào, {data.welcome.userName || 'User'}</h1>
          <p className="subtitle">
            Theo dõi hồ sơ pháp lý, tài liệu, phản hồi từ chuyên viên và các mốc xử lý quan trọng của workspace.
          </p>
        </div>
        <button className="create-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Tạo yêu cầu mới
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
      <div className="toolbar-card">
        <div className="toolbar">
          <div className="left-tools">
            <div className="request-search">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm hồ sơ của bạn..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button className="tool-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
              </svg>
              Bộ lọc
            </button>
            <button className="tool-btn">
              Trạng thái
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
          <div className="right-tools">
            <button className="tool-btn square">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 16v5h5" />
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 8V3h-5" />
              </svg>
            </button>
            <button className="tool-btn">Export</button>
            <button className="tool-btn">Cột hiển thị</button>
          </div>
        </div>
      </div>

      {/* Table Card - All Cases with Paging */}
      <div className="table-card">
        <div className="table-head">
          <div className="th">Mã hồ sơ</div>
          <div className="th">Loại yêu cầu</div>
          <div className="th">Trạng thái</div>
          <div className="th">Người phụ trách</div>
          <div className="th">Cập nhật gần nhất</div>
          <div className="th">Thao tác</div>
        </div>

        {paginatedCases.length === 0 ? (
          <div className="empty-state">Không có hồ sơ nào</div>
        ) : (
          paginatedCases.map((c) => (
            <div key={c.id} className="table-row">
              <div className="td">
                <div className="case-main">
                  <div className="case-icon">📄</div>
                  <div className="case-info">
                    <strong>{c.code}</strong>
                    <span>{c.statusText}</span>
                  </div>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>{c.title}</strong>
                  <span>{c.matterType}</span>
                </div>
              </div>
              <div className="td">
                <span className={getStatusBadgeClass(c.statusVariant)}>{c.statusText}</span>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>{c.assignee}</strong>
                  <span>{c.assigneeRole}</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>{formatDate(c.updatedAt)}</strong>
                </div>
              </div>
              <div className="td">
                <a className="action-link" href="#">
                  Xem chi tiết →
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paging */}
      {totalPages > 1 && (
        <div className="paging-bar">
          <span className="paging-info">
            Hiển thị {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, searchedCases.length)} của{' '}
            {searchedCases.length} hồ sơ
          </span>
          <div className="paging-controls">
            <button
              className="paging-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`paging-btn ${page === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="paging-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <a href="/messages" className="floating-chat">
        <span className="chat-icon-wrapper">N</span>
        {data.welcome.newReplies > 0 && <span>{data.welcome.newReplies} Tin mới</span>}
      </a>
    </div>
  );
}
