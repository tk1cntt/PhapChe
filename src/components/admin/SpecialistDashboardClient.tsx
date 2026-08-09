'use client';

import { useTranslations } from 'next-intl';
import { Clock, CheckCircle2, FileText, RotateCcw } from 'lucide-react';
import '@/styles/pages/admin/specialist-dashboard.css';

interface SpecialistStats {
  assigned: number;
  inProgress: number;
  pendingReview: number;
  revisionRequired: number;
  total: number;
}

interface SpecialistTask {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  customerName: string;
  workspaceName: string;
  createdAt: string;
  updatedAt: string;
}

interface SpecialistDashboardClientProps {
  userName: string;
  stats: SpecialistStats;
  recentTasks: SpecialistTask[];
  translations: {
    pageTitle: string;
    pageDesc: string;
    statAssigned: string;
    statInProgress: string;
    statPendingReview: string;
    statRevisionRequired: string;
    statAssignedDesc: string;
    statInProgressDesc: string;
    statPendingReviewDesc: string;
    statRevisionRequiredDesc: string;
    myTasks: string;
    viewAll: string;
    noTasks: string;
    noTasksDesc: string;
    colCode: string;
    colTitle: string;
    colCustomer: string;
    colStatus: string;
    colPriority: string;
    colAction: string;
    actionStart: string;
    actionContinue: string;
    actionSubmit: string;
    actionRevise: string;
    quickTips: string;
    tip1: string;
    tip2: string;
    tip3: string;
  };
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  assigned: { bg: '#f1f5f9', color: '#64748b', label: 'Chờ nhận' },
  in_progress: { bg: '#dbeafe', color: '#2563eb', label: 'Đang xử lý' },
  pending_review: { bg: '#fef3c7', color: '#d97706', label: 'Chờ duyệt' },
  revision_required: { bg: '#fee2e2', color: '#dc2626', label: 'Cần sửa' },
};

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: '#ffe4e6', color: '#dc2626' },
  MEDIUM: { bg: '#ffedd5', color: '#ea580c' },
  LOW: { bg: '#ccfbf1', color: '#0d9488' },
};

function getActionLabel(status: string, t: Record<string, string>): string {
  switch (status) {
    case 'assigned': return t.actionStart;
    case 'in_progress': return t.actionContinue;
    case 'pending_review': return t.actionSubmit;
    case 'revision_required': return t.actionRevise;
    default: return t.actionStart;
  }
}

export default function SpecialistDashboardClient({
  userName,
  stats,
  recentTasks,
  translations: t,
}: SpecialistDashboardClientProps) {

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
      <div className="specialist-banner">
        <div className="banner-content">
          <div className="banner-avatar">
            {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2>Xin chào, {userName}</h2>
            <p>Bạn có <strong>{stats.assigned + stats.inProgress + stats.revisionRequired}</strong> hồ sơ đang chờ xử lý</p>
          </div>
        </div>
        <div className="banner-stats-mini">
          <div className="mini-stat">
            <span className="mini-stat-value">{stats.assigned}</span>
            <span className="mini-stat-label">{t.statAssigned.toLowerCase()}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-value">{stats.inProgress}</span>
            <span className="mini-stat-label">{t.statInProgress.toLowerCase()}</span>
          </div>
          <div className="mini-stat warn">
            <span className="mini-stat-value">{stats.revisionRequired}</span>
            <span className="mini-stat-label">{t.statRevisionRequired.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stats stats-4">
        <div className="stat-card-specialist blue">
          <div className="stat-card-icon">
            <FileText size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.assigned}</span>
            <span className="stat-card-title">{t.statAssigned}</span>
            <span className="stat-card-desc">{t.statAssignedDesc}</span>
          </div>
        </div>
        <div className="stat-card-specialist orange">
          <div className="stat-card-icon">
            <Clock size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.inProgress}</span>
            <span className="stat-card-title">{t.statInProgress}</span>
            <span className="stat-card-desc">{t.statInProgressDesc}</span>
          </div>
        </div>
        <div className="stat-card-specialist green">
          <div className="stat-card-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.pendingReview}</span>
            <span className="stat-card-title">{t.statPendingReview}</span>
            <span className="stat-card-desc">{t.statPendingReviewDesc}</span>
          </div>
        </div>
        <div className="stat-card-specialist red">
          <div className="stat-card-icon">
            <RotateCcw size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.revisionRequired}</span>
            <span className="stat-card-title">{t.statRevisionRequired}</span>
            <span className="stat-card-desc">{t.statRevisionRequiredDesc}</span>
          </div>
        </div>
      </div>

      {/* Grid-2: Tasks + Tips */}
      <div className="admin-grid-2">
        {/* My Tasks */}
        <div className="panel">
          <div className="panel-title">
            <div className="panel-title-left">
              <FileText size={20} />
              {t.myTasks}
            </div>

          </div>

          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={40} style={{ color: 'var(--color-primary)', opacity: 0.4 }} />
              <strong>{t.noTasks}</strong>
              <span>{t.noTasksDesc}</span>
            </div>
          ) : (
            <div className="specialist-task-list">
              {recentTasks.map((task) => {
                const st = STATUS_STYLE[task.status] || STATUS_STYLE.assigned;
                const pr = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.MEDIUM;
                return (
                  <div key={task.id} className="specialist-task-item">
                    <div className="task-main">
                      <div className="task-code">{task.code || task.id.slice(0, 8)}</div>
                      <div className="task-info">
                        <strong>{task.title}</strong>
                        <span>{task.customerName} · {task.workspaceName}</span>
                      </div>
                    </div>
                    <div className="task-meta">
                      <span className="task-status" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                      <span className="task-priority" style={{ background: pr.bg, color: pr.color }}>
                        {task.priority}
                      </span>
                      <span className="task-action-label">
                        {getActionLabel(task.status, t)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="panel">
          <div className="panel-title">
            <div className="panel-title-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              {t.quickTips}
            </div>
          </div>
          <div className="tips-list">
            <div className="tip-item">
              <div className="tip-number">1</div>
              <p>{t.tip1}</p>
            </div>
            <div className="tip-item">
              <div className="tip-number">2</div>
              <p>{t.tip2}</p>
            </div>
            <div className="tip-item">
              <div className="tip-number">3</div>
              <p>{t.tip3}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
