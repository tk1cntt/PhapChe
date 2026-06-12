'use client';

import AdminStatCard from '@/app/components/admin/AdminStatCard';
import AdminBanner from '@/app/components/admin/AdminBanner';
import WorkloadPanel from '@/app/components/admin/WorkloadPanel';
import AlertPanel from '@/app/components/admin/AlertPanel';
import WorkspacePanel from '@/app/components/admin/WorkspacePanel';
import ApprovalPanel from '@/app/components/admin/ApprovalPanel';
import AuditTimeline from '@/app/components/admin/AuditTimeline';
import AdminToolbar from '@/app/components/admin/AdminToolbar';
import AdminRequestsTable from '@/app/components/admin/AdminRequestsTable';
import { Users, FolderKanban, Clock, AlertTriangle } from 'lucide-react';

interface AdminDashboardClientProps {
  stats: {
    users: { total: number; active: number; invited: number };
    workspaces: { total: number; active: number };
    nearSla: number;
    auditAlerts: number;
    openRequests: number;
  };
  workloadData: Array<{
    initials: string;
    name: string;
    role: string;
    progress: number;
    status: 'ok' | 'warn' | 'danger';
    count: string;
  }>;
  alertData: Array<{
    icon: string;
    iconColor: 'red' | 'orange' | 'blue' | 'green';
    title: string;
    description: string;
    badge: string;
    badgeColor: 'red' | 'orange' | 'blue' | 'green';
  }>;
  workspaceData: Array<{
    initials: string;
    iconColor: 'green' | 'blue' | 'orange';
    name: string;
    description: string;
    badge: string;
    badgeColor: 'green' | 'blue';
  }>;
  approvalData: Array<{
    icon: string;
    iconColor: 'orange' | 'blue' | 'red';
    title: string;
    description: string;
    badge: string;
    badgeColor: 'orange' | 'blue' | 'red';
  }>;
  timelineData: Array<{
    title: string;
    description: string;
    time: string;
  }>;
  requestTableData: Array<{
    id: string;
    type: string;
    workspace: string;
    workspaceSlug: string;
    customer: string;
    customerEmail: string;
    status: 'orange' | 'blue' | 'green' | 'red' | 'purple';
    statusText: string;
    assignee: string;
    assigneeRole: string;
    sla: 'red' | 'orange' | 'green' | 'blue';
    slaText: string;
    action: string;
  }>;
  translations: {
    pageTitle: string;
    pageDesc: string;
    bannerTitle: string;
    bannerDesc: string;
    viewAudit: string;
    dispatchWorkload: string;
    exportReport: string;
    createRequest: string;
    statUsers: string;
    statUsersDesc: string;
    statWorkspaces: string;
    statWorkspacesDesc: string;
    statNearSla: string;
    statNearSlaDesc: string;
    statAuditAlerts: string;
    statAuditAlertsDesc: string;
    workloadPanel: string;
    alertsPanel: string;
    workspacesPanel: string;
    approvalsPanel: string;
    timelinePanel: string;
    viewDetail: string;
    viewAll: string;
    colCode: string;
    colWorkspace: string;
    colCustomer: string;
    colStatus: string;
    colAssignee: string;
    colSla: string;
    colAction: string;
    searchPlaceholder: string;
    filter: string;
    status: string;
    workspace: string;
    export: string;
    columns: string;
  };
}

export default function AdminDashboardClient({
  stats,
  workloadData,
  alertData,
  workspaceData,
  approvalData,
  timelineData,
  requestTableData,
  translations: t,
}: AdminDashboardClientProps) {
  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      {/* Section 1: Page Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
              {t.pageTitle}
            </h1>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>{t.pageDesc}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              style={{
                height: 44,
                padding: '0 20px',
                border: '1px solid var(--border)',
                background: '#fff',
                borderRadius: 8,
                color: '#1e293b',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {t.exportReport}
            </button>
            <button
              style={{
                height: 44,
                padding: '0 20px',
                border: 'none',
                background: 'linear-gradient(180deg, #0b8f86, #087970)',
                borderRadius: 8,
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 8px 18px rgba(8, 127, 120, 0.25)',
              }}
            >
              {t.createRequest}
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Admin Banner */}
      <AdminBanner title={t.bannerTitle} description={t.bannerDesc} />

      {/* Section 3: 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        <AdminStatCard
          variant="blue"
          title={t.statUsers}
          value={String(stats.users.total)}
          description={t.statUsersDesc}
          icon={<Users className="h-10 w-10" />}
        />
        <AdminStatCard
          variant="green"
          title={t.statWorkspaces}
          value={String(stats.workspaces.total)}
          description={t.statWorkspacesDesc}
          icon={<FolderKanban className="h-10 w-10" />}
        />
        <AdminStatCard
          variant="orange"
          title={t.statNearSla}
          value={String(stats.nearSla)}
          description={t.statNearSlaDesc}
          icon={<Clock className="h-10 w-10" />}
        />
        <AdminStatCard
          variant="red"
          title={t.statAuditAlerts}
          value={String(stats.auditAlerts)}
          description={t.statAuditAlertsDesc}
          icon={<AlertTriangle className="h-10 w-10" />}
        />
      </div>

      {/* Section 4: Grid-2 (1.25fr/0.75fr) - Workload + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 20, marginBottom: 32 }}>
        <WorkloadPanel specialists={workloadData} />
        <AlertPanel alerts={alertData} />
      </div>

      {/* Section 5: Grid-3 (0.9fr/0.9fr/1.2fr) - Workspaces + Approvals + Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 0.9fr 1.2fr', gap: 20, marginBottom: 32 }}>
        <WorkspacePanel workspaces={workspaceData} />
        <ApprovalPanel approvals={approvalData} />
        <AuditTimeline entries={timelineData} />
      </div>

      {/* Section 6: Toolbar */}
      <AdminToolbar
        onSearch={(query) => console.log('Search:', query)}
        onFilter={() => console.log('Filter clicked')}
        onExport={() => console.log('Export clicked')}
      />

      {/* Section 7: Request Table */}
      <AdminRequestsTable rows={requestTableData} />
    </div>
  );
}
