'use client';

import AdminStatCard from '@/components/admin/AdminStatCard';
import AdminBanner from '@/components/admin/AdminBanner';
import WorkloadPanel from '@/components/admin/WorkloadPanel';
import AlertPanel from '@/components/admin/AlertPanel';
import WorkspacePanel from '@/components/admin/WorkspacePanel';
import ApprovalPanel from '@/components/admin/ApprovalPanel';
import AuditTimeline from '@/components/admin/AuditTimeline';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminRequestsTable from '@/components/admin/AdminRequestsTable';
import '@/components/admin/admin.css';
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
    <>
      {/* Section 1: Page Header */}
      <div className="page-header">
        <div>
          <h1>{t.pageTitle}</h1>
          <p className="subtitle">{t.pageDesc}</p>
        </div>

        <div className="header-actions">
          <button className="ghost-btn">{t.exportReport}</button>
          <button className="create-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            {t.createRequest}
          </button>
        </div>
      </div>

      {/* Section 2: Admin Banner */}
      <AdminBanner title={t.bannerTitle} description={t.bannerDesc} />

      {/* Section 3: 4 Stat Cards */}
      <div className="stats">
        <AdminStatCard
          variant="blue"
          title={t.statUsers}
          value={String(stats.users.total)}
          description={t.statUsersDesc}
          icon={<Users size={30} />}
        />
        <AdminStatCard
          variant="green"
          title={t.statWorkspaces}
          value={String(stats.workspaces.total)}
          description={t.statWorkspacesDesc}
          icon={<FolderKanban size={30} />}
        />
        <AdminStatCard
          variant="orange"
          title={t.statNearSla}
          value={String(stats.nearSla)}
          description={t.statNearSlaDesc}
          icon={<Clock size={30} />}
        />
        <AdminStatCard
          variant="red"
          title={t.statAuditAlerts}
          value={String(stats.auditAlerts)}
          description={t.statAuditAlertsDesc}
          icon={<AlertTriangle size={30} />}
        />
      </div>

      {/* Section 4: Grid-2 - Workload + Alerts */}
      <div className="admin-grid-2">
        <WorkloadPanel specialists={workloadData} />
        <AlertPanel alerts={alertData} />
      </div>

      {/* Section 5: Grid-3 - Workspaces + Approvals + Timeline */}
      <div className="admin-grid-3">
        <WorkspacePanel workspaces={workspaceData} />
        <ApprovalPanel approvals={approvalData} />
        <AuditTimeline entries={timelineData} />
      </div>

      {/* Section 6: Toolbar */}
      <AdminToolbar
        onSearch={(query) => console.log('Search:', query)}
        onFilter={() => console.log('Filter clicked')}
        onExport={() => console.log('Export clicked')}
        onRefresh={() => console.log('Refresh clicked')}
        translations={{
          searchPlaceholder: t.searchPlaceholder,
          filter: t.filter,
          status: t.status,
          workspace: t.workspace,
          export: t.export,
          columns: t.columns,
        }}
      />

      {/* Section 7: Request Table */}
      <AdminRequestsTable
        rows={requestTableData}
        translations={{
          code: t.colCode,
          workspace: t.colWorkspace,
          customer: t.colCustomer,
          status: t.colStatus,
          requestType: 'Loại yêu cầu',
          assignee: t.colAssignee,
          action: t.colAction,
          dispatch: 'Điều phối',
          view: 'Xem',
          audit: 'Audit',
        }}
      />
    </>
  );
}
