'use client';

import { Clock, CheckCircle2, FileText, RotateCcw } from 'lucide-react';
import '@/styles/pages/admin/specialist-dashboard.css';

interface SpecialistStats {
  assigned: number;
  inProgress: number;
  pendingReview: number;
  revisionRequired: number;
  total: number;
}

interface SpecialistDashboardClientProps {
  userName: string;
  stats: SpecialistStats;
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
  };
}

export default function SpecialistDashboardClient({
  userName,
  stats,
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
    </>
  );
}
