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
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Section 1: Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-[31px] font-extrabold tracking-tight text-[#020617] mb-3">
            {t.pageTitle}
          </h1>
          <p className="text-[15px] font-medium text-[#5f6e83] m-0">{t.pageDesc}</p>
        </div>
        <div className="flex gap-3">
          <button
            className="h-11 px-5 border rounded-lg text-[#1e293b] font-bold flex items-center gap-2 bg-white cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            {t.exportReport}
          </button>
          <button
            className="h-11 px-5 border-0 rounded-lg text-white font-bold flex items-center gap-2 cursor-pointer"
            style={{
              background: 'linear-gradient(180deg, #0b8f86, #087970)',
              boxShadow: '0 8px 18px rgba(8, 127, 120, 0.25)',
            }}
          >
            {t.createRequest}
          </button>
        </div>
      </div>

      {/* Section 2: Admin Banner */}
      <AdminBanner title={t.bannerTitle} description={t.bannerDesc} />

      {/* Section 3: 4 Stat Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
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
      <div className="grid grid-cols-[1.25fr_0.75fr] gap-5 mb-8">
        <WorkloadPanel specialists={workloadData} />
        <AlertPanel alerts={alertData} />
      </div>

      {/* Section 5: Grid-3 (0.9fr/0.9fr/1.2fr) - Workspaces + Approvals + Timeline */}
      <div className="grid grid-cols-[0.9fr_0.9fr_1.2fr] gap-5 mb-8">
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
      <AdminRequestsTable rows={requestTableData} />
    </div>
  );
}
