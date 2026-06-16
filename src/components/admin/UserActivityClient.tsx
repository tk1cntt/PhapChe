'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

interface PageProps {
  userId: string;
  locale: string;
  initialUser: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    emailVerified: boolean;
  };
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  role: string;
  status: 'active' | 'invited' | 'inactive';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  identifier: string;
  healthScore: number;
  stats: {
    organizations: number;
    workspaces: number;
    activeWorkspacesToday: number;
    openCases: number;
    partners: number;
    documents: number;
    risk: number;
  };
  memberships: Array<{
    id: string;
    role: string;
    isActive: boolean;
    workspace?: { id: string; name: string; slug: string } | null;
  }>;
  requests: Array<{
    id: string;
    code: string;
    title: string;
    status: string;
    workspaceName: string;
    partnerName: string;
    slaDeadline: string | null;
  }>;
  activityFeed: Array<{
    id: string;
    icon: string;
    label: string;
    variant: string;
    description: string;
    metadata: {
      requestCode?: string;
      documentName?: string;
      partnerName?: string;
    };
    createdAt: string;
    timeAgo: string;
  }>;
  partners: Array<{
    id: string;
    name: string;
    type: string;
    status: 'active';
  }>;
  permissions: Array<{
    role: string;
    workspaceName: string;
    isActive: boolean;
  }>;
  slaRisk: {
    pendingActions: number;
    onTimeRate: number;
    documentsNeedReview: number;
    healthScore: number;
  };
  timeline: Array<{
    step: number;
    title: string;
    description: string;
    date: string;
  }>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getStatusClass(status: string): string {
  if (status === 'active') return 'status-active';
  if (status === 'invited') return 'status-warning';
  return 'status-inactive';
}

function getBadgeClass(variant: string): string {
  const classes: Record<string, string> = {
    green: 'mini-badge-green',
    blue: 'mini-badge-blue',
    orange: 'mini-badge-orange',
    purple: 'mini-badge-purple',
    gray: 'mini-badge-gray',
    red: 'mini-badge-red',
  };
  return classes[variant] || 'mini-badge-gray';
}

function getFileIconClass(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'file-icon-pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return 'file-icon-img';
  return 'file-icon-doc';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function UserActivityClient({ userId, locale, initialUser }: PageProps) {
  const t = useTranslations('AdminUsers');
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading, error } = useQuery<UserDetail>({
    queryKey: ['user-detail', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data;
    },
    initialData: undefined,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <div style={{ color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <div style={{ color: '#ef4444' }}>Error loading user data</div>
      </div>
    );
  }

  const user = data;
  const primaryMembership = user.memberships[0];

  return (
    <>
      <style>{`
        .user-activity-content {
          min-height: calc(100vh - 76px);
          padding: 32px 36px 48px;
          background: radial-gradient(circle at 82% 10%, rgba(15, 118, 110, 0.055), transparent 28%),
            radial-gradient(circle at 35% 75%, rgba(37, 99, 235, 0.045), transparent 34%),
            #f8fafc;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #0f172a;
        }

        .user-activity-container {
          max-width: 1480px;
          margin: 0 auto;
        }

        .ua-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
        }

        .ua-back-link {
          height: 42px;
          padding: 0 14px;
          border: 1px solid #dfe7f1;
          background: #fff;
          color: #475569;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 850;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
          cursor: pointer;
        }

        .ua-back-link:hover {
          background: #f8fafc;
        }

        .ua-back-link svg {
          width: 16px;
          height: 16px;
        }

        .ua-top-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .ua-btn {
          height: 42px;
          padding: 0 15px;
          border: 1px solid #dfe7f1;
          background: #fff;
          color: #334155;
          font-size: 14px;
          font-weight: 850;
          border-radius: 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .ua-btn-primary {
          background: #0f766e;
          color: #fff;
          border-color: #0f766e;
          box-shadow: 0 8px 18px rgba(15, 118, 110, 0.18);
        }

        .ua-btn-danger {
          background: #fff1f2;
          color: #e11d48;
          border-color: #fecdd3;
        }

        .ua-hero {
          position: relative;
          overflow: hidden;
          background: #fff;
          border: 1px solid #dfe7f1;
          border-radius: 24px;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.06);
          margin-bottom: 22px;
        }

        .ua-hero::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 7px;
          background: linear-gradient(90deg, #0f766e, #10b981, #2563eb);
        }

        .ua-hero-main {
          padding: 30px 30px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 28px;
        }

        .ua-user-identity {
          display: flex;
          gap: 18px;
          align-items: flex-start;
          min-width: 0;
          flex: 1;
        }

        .ua-avatar {
          width: 76px;
          height: 76px;
          border-radius: 24px;
          background: linear-gradient(135deg, #ecfdf9, #eff6ff);
          border: 1px solid #dbeafe;
          color: #0f766e;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          font-size: 25px;
          font-weight: 950;
        }

        .ua-kicker {
          color: #64748b;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .ua-hero-title h1 {
          margin: 0;
          color: #0f172a;
          font-size: 34px;
          line-height: 1.12;
          letter-spacing: -0.9px;
        }

        .ua-hero-desc {
          margin: 12px 0 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 500;
          max-width: 820px;
        }

        .ua-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 14px;
        }

        .ua-chip {
          min-height: 30px;
          padding: 7px 11px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 900;
          line-height: 1;
          white-space: nowrap;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
        }

        .ua-status-badge {
          min-height: 30px;
          padding: 7px 11px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 900;
          background: #ccfbf1;
          color: #0f766e;
        }

        .ua-status-badge.warning {
          background: #fff7ed;
          color: #ea580c;
        }

        .ua-status-badge.inactive {
          background: #f1f5f9;
          color: #475569;
        }

        .ua-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.18);
        }

        .ua-status-badge.warning .ua-status-dot {
          background: #f97316;
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.18);
        }

        .ua-hero-right {
          display: grid;
          gap: 12px;
          justify-items: end;
          flex-shrink: 0;
        }

        .ua-health-card {
          width: 142px;
          height: 104px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #edf2f7;
          display: grid;
          place-items: center;
          text-align: center;
        }

        .ua-health-card strong {
          display: block;
          color: #0f766e;
          font-size: 32px;
          line-height: 1;
        }

        .ua-health-card span {
          display: block;
          margin-top: 8px;
          color: #64748b;
          font-size: 12px;
          font-weight: 850;
        }

        .ua-hero-stats {
          padding: 0 30px 30px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
        }

        .ua-stat-card {
          min-height: 94px;
          padding: 15px;
          border-radius: 16px;
          background: #fbfdff;
          border: 1px solid #edf2f7;
        }

        .ua-stat-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 10px;
        }

        .ua-stat-value {
          font-size: 25px;
          color: #0f172a;
          font-weight: 950;
          line-height: 1;
        }

        .ua-stat-sub {
          margin-top: 8px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 750;
        }

        .ua-activity-controls {
          background: #fff;
          border: 1px solid #dfe7f1;
          border-radius: 18px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
          padding: 18px;
          margin-bottom: 22px;
          display: grid;
          gap: 16px;
        }

        .ua-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ua-tab-btn {
          height: 38px;
          padding: 0 14px;
          background: #fff;
          color: #475569;
          border: 1px solid #dfe7f1;
          font-size: 13px;
          font-weight: 850;
          border-radius: 10px;
          cursor: pointer;
        }

        .ua-tab-btn.active {
          background: #0f766e;
          color: #fff;
          border-color: #0f766e;
        }

        .ua-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 386px;
          gap: 24px;
          align-items: start;
        }

        .ua-main, .ua-sidebar {
          display: grid;
          gap: 22px;
        }

        .ua-panel {
          background: #fff;
          border: 1px solid #dfe7f1;
          border-radius: 20px;
          box-shadow: 0 14px 35px rgba(15, 23, 42, 0.055);
          overflow: hidden;
        }

        .ua-panel-head {
          padding: 21px 24px;
          border-bottom: 1px solid #edf2f7;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
        }

        .ua-panel-title {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .ua-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          font-size: 17px;
          font-weight: 950;
        }

        .ua-icon-green { background: #ecfdf9; color: #0f766e; }
        .ua-icon-blue { background: #eff6ff; color: #2563eb; }
        .ua-icon-orange { background: #fff7ed; color: #f97316; }
        .ua-icon-purple { background: #f5f3ff; color: #7c3aed; }

        .ua-panel h2 {
          margin: 0;
          color: #0f172a;
          font-size: 20px;
          letter-spacing: -0.3px;
        }

        .ua-subtitle {
          margin-top: 6px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 500;
        }

        .ua-panel-body {
          padding: 22px 24px 24px;
        }

        .ua-feed {
          display: grid;
          gap: 14px;
        }

        .ua-feed-item {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: flex-start;
          padding: 16px;
          border: 1px solid #edf2f7;
          border-radius: 16px;
          background: #fbfdff;
        }

        .ua-feed-item.warning {
          background: #fffaf5;
          border-color: #fed7aa;
        }

        .ua-feed-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-weight: 950;
          font-size: 13px;
          flex-shrink: 0;
        }

        .ua-feed-icon-req { background: #eff6ff; color: #2563eb; }
        .ua-feed-icon-doc { background: #fff7ed; color: #f97316; }
        .ua-feed-icon-org { background: #ecfdf9; color: #0f766e; }
        .ua-feed-icon-partner { background: #f5f3ff; color: #7c3aed; }
        .ua-feed-icon-risk { background: #fff1f2; color: #e11d48; }

        .ua-feed-content strong {
          display: block;
          color: #0f172a;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .ua-feed-content p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.55;
        }

        .ua-feed-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .ua-mini-badge {
          min-height: 28px;
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 850;
          display: inline-flex;
          align-items: center;
        }

        .ua-mini-badge-green { background: #ccfbf1; color: #0f766e; }
        .ua-mini-badge-blue { background: #dbeafe; color: #2563eb; }
        .ua-mini-badge-orange { background: #ffedd5; color: #ea580c; }
        .ua-mini-badge-purple { background: #ede9fe; color: #7c3aed; }
        .ua-mini-badge-gray { background: #f1f5f9; color: #475569; }
        .ua-mini-badge-red { background: #ffe4e6; color: #e11d48; }

        .ua-feed-time {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
          text-align: right;
          margin-top: 3px;
        }

        .ua-table-wrap {
          overflow-x: auto;
        }

        .ua-activity-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 980px;
        }

        .ua-activity-table th,
        .ua-activity-table td {
          text-align: left;
          padding: 14px 12px;
          border-bottom: 1px solid #edf2f7;
          vertical-align: top;
        }

        .ua-activity-table th {
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 950;
          background: #fbfdff;
        }

        .ua-activity-table td {
          color: #0f172a;
          font-size: 13px;
          line-height: 1.5;
        }

        .ua-stack strong {
          display: block;
          color: #0f172a;
          font-size: 14px;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ua-stack span {
          display: block;
          color: #64748b;
          font-size: 12px;
          font-weight: 650;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ua-org-card {
          border: 1px solid #edf2f7;
          border-radius: 16px;
          background: #fbfdff;
          padding: 16px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
        }

        .ua-org-card strong {
          display: block;
          color: #0f172a;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .ua-org-card span {
          display: block;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .ua-metric-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .ua-metric {
          min-height: 28px;
          padding: 6px 9px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 12px;
          font-weight: 850;
        }

        .ua-doc-card {
          border: 1px solid #edf2f7;
          border-radius: 16px;
          background: #fbfdff;
          padding: 16px;
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr) auto;
          gap: 13px;
          align-items: center;
        }

        .ua-file-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 950;
          background: #eff6ff;
          color: #2563eb;
        }

        .ua-file-icon-pdf { background: #fff1f2; color: #e11d48; }
        .ua-file-icon-img { background: #fff7ed; color: #ea580c; }

        .ua-file-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .ua-small-btn {
          height: 34px;
          padding: 0 11px;
          border: 1px solid #dfe7f1;
          background: #fff;
          color: #334155;
          font-size: 12px;
          font-weight: 850;
          border-radius: 10px;
          cursor: pointer;
        }

        .ua-small-btn-primary {
          background: #0f766e;
          color: #fff;
          border-color: #0f766e;
        }

        .ua-profile-card {
          text-align: center;
          padding: 24px;
        }

        .ua-profile-avatar {
          width: 88px;
          height: 88px;
          margin: 0 auto 14px;
          border-radius: 28px;
          background: linear-gradient(135deg, #ecfdf9, #eff6ff);
          border: 1px solid #dbeafe;
          color: #0f766e;
          display: grid;
          place-items: center;
          font-size: 28px;
          font-weight: 950;
        }

        .ua-profile-card h3 {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 19px;
        }

        .ua-profile-card p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .ua-side-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .ua-side-value {
          color: #0f172a;
          font-size: 14px;
          font-weight: 850;
          line-height: 1.5;
        }

        .ua-side-item {
          border: 1px solid #edf2f7;
          border-radius: 16px;
          background: #fbfdff;
          padding: 16px;
        }

        .ua-side-item + .ua-side-item {
          margin-top: 14px;
        }

        .ua-partner-card {
          border: 1px solid #edf2f7;
          border-radius: 16px;
          background: #fbfdff;
          padding: 16px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
        }

        .ua-partner-card strong {
          display: block;
          color: #0f172a;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .ua-partner-card span {
          display: block;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .ua-capacity {
          display: grid;
          gap: 14px;
        }

        .ua-capacity-row {
          display: grid;
          gap: 8px;
        }

        .ua-capacity-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #334155;
          font-size: 13px;
          font-weight: 850;
        }

        .ua-track {
          height: 9px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .ua-fill {
          height: 100%;
          border-radius: inherit;
        }

        .ua-fill-green { background: #0f766e; }
        .ua-fill-blue { background: #2563eb; }
        .ua-fill-orange { background: #f97316; }
        .ua-fill-red { background: #e11d48; }

        .ua-risk-card {
          background: #fffaf5;
          border: 1px solid #fed7aa;
          border-radius: 16px;
          padding: 16px;
        }

        .ua-risk-card.red {
          background: #fff1f2;
          border-color: #fecdd3;
        }

        .ua-risk-card strong {
          display: block;
          color: #0f172a;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .ua-risk-card span {
          display: block;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .ua-timeline-item {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr);
          gap: 12px;
          align-items: start;
        }

        .ua-timeline-dot {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #ecfdf9;
          color: #0f766e;
          font-size: 12px;
          font-weight: 950;
        }

        .ua-timeline-body strong {
          display: block;
          color: #0f172a;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .ua-timeline-body span {
          display: block;
          color: #64748b;
          font-size: 12px;
          line-height: 1.45;
        }

        @media (max-width: 1260px) {
          .ua-layout { grid-template-columns: 1fr; }
          .ua-hero-stats { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 760px) {
          .user-activity-content { padding: 22px; }
          .ua-topbar, .ua-hero-main { flex-direction: column; align-items: stretch; }
          .ua-hero-right { justify-items: start; }
          .ua-hero-stats { grid-template-columns: 1fr; }
          .ua-feed-item, .ua-doc-card, .ua-org-card { grid-template-columns: 1fr; }
          .ua-feed-time { text-align: left; }
        }
      `}</style>

      <div className="user-activity-content">
        <div className="user-activity-container">

          {/* Top Bar */}
          <div className="ua-topbar">
            <Link href={`/${locale}/admin/users`} className="ua-back-link">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Quay lại danh sách user
            </Link>

            <div className="ua-top-actions">
              <button className="ua-btn">Xuất activity</button>
              <button className="ua-btn">Xem audit</button>
              <button className="ua-btn ua-btn-primary">Cập nhật user</button>
              <button className="ua-btn ua-btn-danger">Khóa quyền</button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="ua-hero">
            <div className="ua-hero-main">
              <div className="ua-user-identity">
                <div className="ua-avatar">{getInitials(user.name)}</div>

                <div className="ua-hero-title">
                  <div className="ua-kicker">User activity dashboard</div>
                  <h1>{user.name}</h1>

                  <p className="ua-hero-desc">
                    Theo dõi toàn bộ hoạt động của user: đang thuộc organization/workspace nào,
                    đang tham gia hồ sơ nào, tương tác với partner nào, tài liệu nào đã upload/review,
                    trạng thái quyền truy cập và rủi ro vận hành liên quan đến user.
                  </p>

                  <div className="ua-chips">
                    <span className="ua-chip">{user.identifier}</span>
                    <span className="ua-chip">{user.email}</span>
                    <span className="ua-chip">{primaryMembership?.role || user.role}</span>
                  </div>
                </div>
              </div>

              <div className="ua-hero-right">
                <span className={`ua-status-badge ${user.status === 'active' ? '' : user.status === 'invited' ? 'warning' : 'inactive'}`}>
                  <span className="ua-status-dot"></span>
                  {user.status === 'active' ? 'Active user' : user.status === 'invited' ? 'Invited' : 'Inactive'}
                </span>

                <div className="ua-health-card">
                  <div>
                    <strong>{user.healthScore}%</strong>
                    <span>User activity health</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ua-hero-stats">
              <div className="ua-stat-card">
                <div className="ua-stat-label">Organizations</div>
                <div className="ua-stat-value">{user.stats.organizations}</div>
                <div className="ua-stat-sub">Primary org</div>
              </div>

              <div className="ua-stat-card">
                <div className="ua-stat-label">Workspaces</div>
                <div className="ua-stat-value">{user.stats.workspaces}</div>
                <div className="ua-stat-sub">{user.stats.activeWorkspacesToday} active hôm nay</div>
              </div>

              <div className="ua-stat-card">
                <div className="ua-stat-label">Open cases</div>
                <div className="ua-stat-value">{user.stats.openCases}</div>
                <div className="ua-stat-sub">{user.slaRisk.pendingActions} cần user phản hồi</div>
              </div>

              <div className="ua-stat-card">
                <div className="ua-stat-label">Partners</div>
                <div className="ua-stat-value">{user.stats.partners}</div>
                <div className="ua-stat-sub">IP, Tax, Internal</div>
              </div>

              <div className="ua-stat-card">
                <div className="ua-stat-label">Documents</div>
                <div className="ua-stat-value">{user.stats.documents}</div>
                <div className="ua-stat-sub">files uploaded</div>
              </div>

              <div className="ua-stat-card">
                <div className="ua-stat-label">Risk</div>
                <div className="ua-stat-value">{user.stats.risk}</div>
                <div className="ua-stat-sub">Quyền & SLA</div>
              </div>
            </div>
          </div>

          {/* Activity Controls */}
          <div className="ua-activity-controls">
            <div className="ua-tabs">
              {['all', 'requests', 'org', 'workspace', 'partner', 'docs', 'permission', 'risk'].map((tab) => (
                <button
                  key={tab}
                  className={`ua-tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'all' && 'Tất cả hoạt động'}
                  {tab === 'requests' && 'Hồ sơ'}
                  {tab === 'org' && 'Organization'}
                  {tab === 'workspace' && 'Workspace'}
                  {tab === 'partner' && 'Partner'}
                  {tab === 'docs' && 'Tài liệu'}
                  {tab === 'permission' && 'Permission'}
                  {tab === 'risk' && 'Risk'}
                </button>
              ))}
            </div>
          </div>

          {/* Main Layout */}
          <div className="ua-layout">
            <main className="ua-main">

              {/* Activity Feed */}
              <section className="ua-panel">
                <div className="ua-panel-head">
                  <div className="ua-panel-title">
                    <div className="ua-icon ua-icon-green">A</div>
                    <div>
                      <h2>Activity feed</h2>
                      <div className="ua-subtitle">Dòng thời gian hoạt động gần nhất của user trên hồ sơ, partner, tài liệu và workspace.</div>
                    </div>
                  </div>
                  <span className="ua-chip">24h gần nhất</span>
                </div>
                <div className="ua-panel-body">
                  {user.activityFeed.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>
                      Chưa có hoạt động nào
                    </div>
                  ) : (
                    <div className="ua-feed">
                      {user.activityFeed.slice(0, 10).map((item) => (
                        <div key={item.id} className={`ua-feed-item ${item.variant === 'risk' ? 'warning' : ''}`}>
                          <div className={`ua-feed-icon ua-feed-icon-${item.icon}`}>
                            {item.icon === 'req' && 'REQ'}
                            {item.icon === 'doc' && 'DOC'}
                            {item.icon === 'org' && 'ORG'}
                            {item.icon === 'partner' && 'PTR'}
                            {item.icon === 'risk' && 'SLA'}
                          </div>
                          <div className="ua-feed-content">
                            <strong>{item.label}</strong>
                            <p>{item.description}</p>
                            <div className="ua-feed-meta">
                              {item.metadata.requestCode && (
                                <span className="ua-mini-badge ua-mini-badge-blue">{item.metadata.requestCode}</span>
                              )}
                              {item.metadata.documentName && (
                                <span className="ua-mini-badge ua-mini-badge-gray">{item.metadata.documentName}</span>
                              )}
                              {item.metadata.partnerName && (
                                <span className="ua-mini-badge ua-mini-badge-purple">Partner: {item.metadata.partnerName}</span>
                              )}
                            </div>
                          </div>
                          <div className="ua-feed-time">{item.timeAgo}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Requests Table */}
              <section className="ua-panel">
                <div className="ua-panel-head">
                  <div className="ua-panel-title">
                    <div className="ua-icon ua-icon-blue">C</div>
                    <div>
                      <h2>Hồ sơ user đang tham gia</h2>
                      <div className="ua-subtitle">Các hồ sơ mà user đang là owner, requester, reviewer hoặc người cần phản hồi.</div>
                    </div>
                  </div>
                  <span className="ua-chip">{user.requests.length} hồ sơ</span>
                </div>
                <div className="ua-table-wrap">
                  {user.requests.length === 0 ? (
                    <div style={{ padding: 24, color: '#64748b', textAlign: 'center' }}>
                      Chưa có hồ sơ nào
                    </div>
                  ) : (
                    <table className="ua-activity-table">
                      <thead>
                        <tr>
                          <th>Mã hồ sơ</th>
                          <th>Workspace</th>
                          <th>Partner</th>
                          <th>Trạng thái</th>
                          <th>SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.requests.map((req) => (
                          <tr key={req.id}>
                            <td>
                              <div className="ua-stack">
                                <strong>{req.code || '—'}</strong>
                                <span>{req.title}</span>
                              </div>
                            </td>
                            <td>{req.workspaceName}</td>
                            <td>{req.partnerName}</td>
                            <td>
                              <span className={`ua-mini-badge ua-mini-badge-${req.status === 'completed' ? 'green' : req.status === 'in_progress' ? 'blue' : 'orange'}`}>
                                {req.status}
                              </span>
                            </td>
                            <td>
                              {req.slaDeadline ? (
                                <span className={`ua-mini-badge ua-mini-badge-${new Date(req.slaDeadline) < new Date() ? 'red' : 'green'}`}>
                                  {formatDate(req.slaDeadline)}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* Organization Access */}
              <section className="ua-panel">
                <div className="ua-panel-head">
                  <div className="ua-panel-title">
                    <div className="ua-icon ua-icon-purple">O</div>
                    <div>
                      <h2>Organization & Workspace access</h2>
                      <div className="ua-subtitle">User đang thuộc org nào, có quyền trong workspace nào và đang active ra sao.</div>
                    </div>
                  </div>
                  <span className="ua-chip">{user.memberships.length} workspaces</span>
                </div>
                <div className="ua-panel-body">
                  <div style={{ display: 'grid', gap: 14 }}>
                    {user.memberships.map((membership) => (
                      <div key={membership.id} className="ua-org-card">
                        <div>
                          <strong>{membership.workspace?.name || 'Unknown Workspace'}</strong>
                          <span>Vai trò: {membership.role}. {membership.isActive ? 'Đang hoạt động' : 'Không hoạt động'}.</span>
                          <div className="ua-metric-row">
                            <span className="ua-metric">{membership.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        <span className={`ua-mini-badge ua-mini-badge-${membership.isActive ? 'green' : 'gray'}`}>
                          {membership.isActive ? 'Primary' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

            </main>

            {/* Sidebar */}
            <aside className="ua-sidebar">

              {/* Profile Card */}
              <section className="ua-panel ua-profile-card">
                <div className="ua-profile-avatar">{getInitials(user.name)}</div>
                <h3>{user.name}</h3>
                <p>{primaryMembership?.role || user.role} · Organization</p>
                <div className="ua-chips" style={{ justifyContent: 'center' }}>
                  <span className={`ua-status-badge ${user.status === 'active' ? '' : user.status === 'invited' ? 'warning' : 'inactive'}`}>
                    <span className="ua-status-dot"></span>
                    {user.status === 'active' ? 'Active' : user.status === 'invited' ? 'Invited' : 'Inactive'}
                  </span>
                </div>
              </section>

              {/* User Status */}
              <section className="ua-panel">
                <div className="ua-panel-head">
                  <div className="ua-panel-title">
                    <div className="ua-icon ua-icon-green">U</div>
                    <div>
                      <h2>User status</h2>
                      <div className="ua-subtitle">Thông tin vận hành hiện tại.</div>
                    </div>
                  </div>
                </div>
                <div className="ua-panel-body" style={{ display: 'grid', gap: 14 }}>
                  <div className="ua-side-item">
                    <div className="ua-side-label">Trạng thái tài khoản</div>
                    <div className="ua-side-value">
                      {user.status === 'active' ? 'Active · có thể truy cập workspace' :
                       user.status === 'invited' ? 'Invited · đang chờ xác nhận email' : 'Inactive · bị khóa'}
                    </div>
                  </div>
                  <div className="ua-side-item">
                    <div className="ua-side-label">Vai trò chính</div>
                    <div className="ua-side-value">{primaryMembership?.role || user.role}</div>
                  </div>
                  <div className="ua-side-item">
                    <div className="ua-side-label">Last active</div>
                    <div className="ua-side-value">
                      {user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Chưa có hoạt động'}
                    </div>
                  </div>
                  <div className="ua-side-item">
                    <div className="ua-side-label">Identifier</div>
                    <div className="ua-side-value">{user.identifier}</div>
                  </div>
                </div>
              </section>

              {/* Related Partners */}
              <section className="ua-panel">
                <div className="ua-panel-head">
                  <div className="ua-panel-title">
                    <div className="ua-icon ua-icon-blue">P</div>
                    <div>
                      <h2>Partners liên quan</h2>
                      <div className="ua-subtitle">Partner mà user đang trao đổi hoặc chia sẻ tài liệu.</div>
                    </div>
                  </div>
                </div>
                <div className="ua-panel-body" style={{ display: 'grid', gap: 14 }}>
                  {user.partners.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center' }}>Chưa có partner liên quan</div>
                  ) : (
                    user.partners.map((partner) => (
                      <div key={partner.id} className="ua-partner-card">
                        <div>
                          <strong>{partner.name}</strong>
                          <span>Partner {partner.type}</span>
                        </div>
                        <span className="ua-mini-badge ua-mini-badge-green">Active</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* SLA & Risk */}
              <section className="ua-panel">
                <div className="ua-panel-head">
                  <div className="ua-panel-title">
                    <div className="ua-icon ua-icon-orange">S</div>
                    <div>
                      <h2>SLA & Risk</h2>
                      <div className="ua-subtitle">Rủi ro vận hành liên quan đến user.</div>
                    </div>
                  </div>
                </div>
                <div className="ua-panel-body">
                  <div className="ua-capacity">
                    <div className="ua-capacity-row">
                      <div className="ua-capacity-top">
                        <span>Action đang chờ user</span>
                        <span>{user.slaRisk.pendingActions}</span>
                      </div>
                      <div className="ua-track">
                        <div className="ua-fill ua-fill-orange" style={{ width: `${Math.min(100, user.slaRisk.pendingActions * 20)}%` }}></div>
                      </div>
                    </div>

                    <div className="ua-capacity-row">
                      <div className="ua-capacity-top">
                        <span>Phản hồi đúng hạn</span>
                        <span>{user.slaRisk.onTimeRate}%</span>
                      </div>
                      <div className="ua-track">
                        <div className="ua-fill ua-fill-green" style={{ width: `${user.slaRisk.onTimeRate}%` }}></div>
                      </div>
                    </div>

                    {user.slaRisk.pendingActions > 0 && (
                      <div className="ua-risk-card">
                        <strong>{user.slaRisk.pendingActions} hồ sơ cần user phản hồi</strong>
                        <span>Các hồ sơ đang chờ {user.name} xác nhận thông tin trước khi tiếp tục workflow.</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Timeline */}
              <section className="ua-panel">
                <div className="ua-panel-head">
                  <div className="ua-panel-title">
                    <div className="ua-icon ua-icon-green">T</div>
                    <div>
                      <h2>Timeline tuần này</h2>
                      <div className="ua-subtitle">Các mốc hoạt động chính của user.</div>
                    </div>
                  </div>
                </div>
                <div className="ua-panel-body" style={{ display: 'grid', gap: 14 }}>
                  {user.timeline.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center' }}>Chưa có timeline</div>
                  ) : (
                    user.timeline.map((item) => (
                      <div key={item.step} className="ua-timeline-item">
                        <div className="ua-timeline-dot">{item.step}</div>
                        <div className="ua-timeline-body">
                          <strong>{item.title}</strong>
                          <span>{item.description || item.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
