'use client';

import { useState, useMemo } from 'react';
import AdminStatCard from '@/components/admin/AdminStatCard';
import AdminBanner from '@/components/admin/AdminBanner';
import WorkloadPanel from '@/components/admin/WorkloadPanel';
import AlertPanel from '@/components/admin/AlertPanel';
import WorkspacePanel from '@/components/admin/WorkspacePanel';
import ApprovalPanel from '@/components/admin/ApprovalPanel';
import AuditTimeline from '@/components/admin/AuditTimeline';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminRequestsTable from '@/components/admin/AdminRequestsTable';
import '@/styles/pages/admin/dashboard.css';
import { Users, FolderKanban, Clock, AlertTriangle } from 'lucide-react';

interface AdminDashboardClientProps {
  currentUserName: string;
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
    type: 'accessDenied' | 'nearSla' | 'roleChange' | 'noAlerts';
    icon: string;
    iconColor: 'red' | 'orange' | 'blue' | 'green';
    count: number;
    badgeKey: string;
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
    actorName: string;
    action: string;
    targetType: string;
    targetLabel: string;
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
  currentUserName,
  stats,
  workloadData,
  alertData,
  workspaceData,
  approvalData,
  timelineData,
  requestTableData,
  translations: t,
}: AdminDashboardClientProps) {
  // Filter state for request table
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique assignees from table data
  const uniqueAssignees = useMemo(() => {
    const assignees = new Map<string, string>();
    requestTableData.forEach((row) => {
      if (row.assignee && row.assignee !== 'Chưa gán') {
        assignees.set(row.assignee, row.assigneeRole);
      }
    });
    return Array.from(assignees.entries()).map(([name, role]) => ({ name, role }));
  }, [requestTableData]);

  // Status options consistent with admin/requests
  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'draft_intake', label: 'Nháp' },
    { value: 'assigned', label: 'Đã phân công' },
    { value: 'in_progress', label: 'Đang xử lý' },
    { value: 'pending_review', label: 'Chờ phê duyệt' },
    { value: 'approved', label: 'Đã phê duyệt' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'closed', label: 'Đã đóng' },
  ];

  // Filter table data
  const filteredRequestData = useMemo(() => {
    return requestTableData.filter((row) => {
      // Filter by assignee
      if (filterAssignee && row.assignee !== filterAssignee) return false;
      // Filter by status (match Vietnamese statusText to API status value)
      if (filterStatus) {
        const vnToStatus: Record<string, string> = {
          'Nháp': 'draft_intake',
          'Đã phân công': 'assigned',
          'Đang xử lý': 'in_progress',
          'Chờ phê duyệt': 'pending_review',
          'Đã phê duyệt': 'approved',
          'Đã giao': 'delivered',
          'Đã đóng': 'closed',
        };
        if (row.statusText !== filterStatus && vnToStatus[row.statusText] !== filterStatus) {
          return false;
        }
      }
      // Filter by search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesCode = row.id.toLowerCase().includes(q);
        const matchesWorkspace = row.workspace.toLowerCase().includes(q);
        const matchesCustomer = row.customer.toLowerCase().includes(q);
        const matchesAssignee = row.assignee.toLowerCase().includes(q);
        if (!matchesCode && !matchesWorkspace && !matchesCustomer && !matchesAssignee) return false;
      }
      return true;
    });
  }, [requestTableData, filterAssignee, filterStatus, searchQuery]);

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
        <AuditTimeline entries={timelineData} currentUserName={currentUserName} />
      </div>

      {/* Section 6: Toolbar */}
      <AdminToolbar
        onSearch={(query) => setSearchQuery(query)}
        onFilter={() => {}}
        onExport={() => console.log('Export clicked')}
        onRefresh={() => {
          setFilterAssignee('');
          setFilterStatus('');
          setSearchQuery('');
        }}
        translations={{
          searchPlaceholder: t.searchPlaceholder,
          filter: t.filter,
          status: t.status,
          workspace: t.workspace,
          export: t.export,
          columns: t.columns,
        }}
      />

      {/* Filter Bar — User + Status filter giống /admin/requests */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          Lọc nhanh:
        </span>

        {/* Assignee / User filter */}
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          style={{
            height: 38,
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '0 12px',
            fontSize: 13,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            minWidth: 170,
          }}
        >
          <option value="">Tất cả chuyên viên</option>
          {uniqueAssignees.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name} ({a.role})
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            height: 38,
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '0 12px',
            fontSize: 13,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            minWidth: 160,
          }}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Active filter count badge */}
        {(filterAssignee || filterStatus || searchQuery) && (
          <>
            <span style={{ color: 'var(--color-border)', fontSize: 13 }}>|</span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-primary)',
              background: '#ccfbf1',
              padding: '3px 10px',
              borderRadius: 20,
            }}>
              {filteredRequestData.length}/{requestTableData.length} hồ sơ
            </span>
            <button
              onClick={() => { setFilterAssignee(''); setFilterStatus(''); setSearchQuery(''); }}
              style={{
                height: 30,
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '0 10px',
                fontSize: 12,
                background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Xóa lọc
            </button>
          </>
        )}
      </div>

      {/* Section 7: Request Table */}
      <AdminRequestsTable
        rows={filteredRequestData}
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
