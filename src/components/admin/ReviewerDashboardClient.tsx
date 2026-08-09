'use client';

import { useTranslations } from 'next-intl';
import { FileCheck, XCircle, CheckCircle2, Eye } from 'lucide-react';
import '@/styles/pages/admin/reviewer-dashboard.css';

interface ReviewerStats {
  pending: number;
  approvedToday: number;
  revisionRequired: number;
  total: number;
}

interface ReviewItem {
  id: string;
  code: string;
  title: string;
  priority: string;
  specialistName: string;
  customerName: string;
  workspaceName: string;
  submittedAt: string;
}

interface RecentDecision {
  id: string;
  code: string;
  title: string;
  decision: 'approved' | 'revised';
  decisionAt: string;
}

interface ReviewerDashboardClientProps {
  userName: string;
  stats: ReviewerStats;
  pendingReviews: ReviewItem[];
  recentDecisions: RecentDecision[];
  translations: {
    pageTitle: string;
    pageDesc: string;
    statPending: string;
    statApprovedToday: string;
    statRevisionRequired: string;
    statPendingDesc: string;
    statApprovedTodayDesc: string;
    statRevisionRequiredDesc: string;
    pendingReviews: string;
    viewAll: string;
    noPending: string;
    noPendingDesc: string;
    recentDecisions: string;
    noDecisions: string;
    colCode: string;
    colTitle: string;
    colSpecialist: string;
    colCustomer: string;
    colPriority: string;
    actionReview: string;
    approvedLabel: string;
    revisedLabel: string;
    reviewGuidelines: string;
    guideline1: string;
    guideline2: string;
    guideline3: string;
  };
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: '#ffe4e6', color: '#dc2626' },
  MEDIUM: { bg: '#ffedd5', color: '#ea580c' },
  LOW: { bg: '#ccfbf1', color: '#0d9488' },
};

export default function ReviewerDashboardClient({
  userName,
  stats,
  pendingReviews,
  recentDecisions,
  translations: t,
}: ReviewerDashboardClientProps) {

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>{t.pageTitle}</h1>
          <p className="subtitle">{t.pageDesc}</p>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="reviewer-banner">
        <div className="banner-content">
          <div className="banner-avatar">
            {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2>Xin chào, {userName}</h2>
            <p>Bạn có <strong>{stats.pending}</strong> hồ sơ đang chờ kiểm duyệt</p>
          </div>
        </div>
        <div className="banner-stats-mini">
          <div className="mini-stat warn">
            <span className="mini-stat-value">{stats.pending}</span>
            <span className="mini-stat-label">{t.statPending.toLowerCase()}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-value">{stats.approvedToday}</span>
            <span className="mini-stat-label">{t.statApprovedToday.toLowerCase()}</span>
          </div>
          <div className="mini-stat danger">
            <span className="mini-stat-value">{stats.revisionRequired}</span>
            <span className="mini-stat-label">{t.statRevisionRequired.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="stats stats-3">
        <div className="stat-card-reviewer orange">
          <div className="stat-card-icon">
            <Eye size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.pending}</span>
            <span className="stat-card-title">{t.statPending}</span>
            <span className="stat-card-desc">{t.statPendingDesc}</span>
          </div>
        </div>
        <div className="stat-card-reviewer green">
          <div className="stat-card-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.approvedToday}</span>
            <span className="stat-card-title">{t.statApprovedToday}</span>
            <span className="stat-card-desc">{t.statApprovedTodayDesc}</span>
          </div>
        </div>
        <div className="stat-card-reviewer red">
          <div className="stat-card-icon">
            <XCircle size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.revisionRequired}</span>
            <span className="stat-card-title">{t.statRevisionRequired}</span>
            <span className="stat-card-desc">{t.statRevisionRequiredDesc}</span>
          </div>
        </div>
      </div>

      {/* Grid-2: Pending Reviews + Guidelines */}
      <div className="admin-grid-2">
        {/* Pending Reviews */}
        <div className="panel">
          <div className="panel-title">
            <div className="panel-title-left">
              <FileCheck size={20} />
              {t.pendingReviews}
            </div>
          </div>

          {pendingReviews.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={40} style={{ color: 'var(--color-success)', opacity: 0.4 }} />
              <strong>{t.noPending}</strong>
              <span>{t.noPendingDesc}</span>
            </div>
          ) : (
            <div className="reviewer-queue-list">
              {pendingReviews.map((item) => {
                const pr = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.MEDIUM;
                return (
                  <div key={item.id} className="reviewer-queue-item">
                    <div className="queue-main">
                      <div className="queue-code">{item.code || item.id.slice(0, 8)}</div>
                      <div className="queue-info">
                        <strong>{item.title}</strong>
                        <span>{item.specialistName} · {item.customerName}</span>
                      </div>
                    </div>
                    <div className="queue-meta">
                      <span className="task-priority" style={{ background: pr.bg, color: pr.color }}>
                        {item.priority}
                      </span>
                      <span className="task-action-label review-action">
                        {t.actionReview}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Review Guidelines */}
        <div className="panel">
          <div className="panel-title">
            <div className="panel-title-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              {t.reviewGuidelines}
            </div>
          </div>
          <div className="tips-list">
            <div className="tip-item">
              <div className="tip-number">1</div>
              <p>{t.guideline1}</p>
            </div>
            <div className="tip-item">
              <div className="tip-number">2</div>
              <p>{t.guideline2}</p>
            </div>
            <div className="tip-item">
              <div className="tip-number">3</div>
              <p>{t.guideline3}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Decisions */}
      <div className="panel">
        <div className="panel-title">
          <div className="panel-title-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {t.recentDecisions}
          </div>
        </div>

        {recentDecisions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)' }}>
            {t.noDecisions}
          </div>
        ) : (
          <div className="decisions-timeline">
            {recentDecisions.map((d) => (
              <div key={d.id} className="decision-item">
                <div className={`decision-dot ${d.decision}`} />
                <div className="decision-info">
                  <strong>
                    <span className="decision-badge" style={{
                      background: d.decision === 'approved' ? '#dcfce7' : '#fee2e2',
                      color: d.decision === 'approved' ? '#16a34a' : '#dc2626',
                    }}>
                      {d.decision === 'approved' ? t.approvedLabel : t.revisedLabel}
                    </span>{' '}
                    {d.title}
                  </strong>
                  <span>{d.code}</span>
                </div>
                <div className="decision-time">{d.decisionAt}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
