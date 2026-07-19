import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import SpecialistDashboardClient from '@/components/admin/SpecialistDashboardClient';
import ReviewerDashboardClient from '@/components/admin/ReviewerDashboardClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

function timeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
  return `${Math.floor(minutes / 1440)} ngày trước`;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await requireAppSession();
  const isAdmin = session.roles.some(r => ['super_admin', 'coordinator_admin', 'audit_admin'].includes(r));
  const isSpecialist = session.roles.includes('specialist') && !isAdmin;
  const isReviewer = session.roles.includes('reviewer') && !isAdmin;

  const userName = session.name || '';

  // ── SPECIALIST DASHBOARD ──
  if (isSpecialist) {
    const specialistId = session.userId;

    const [
      assignedCount,
      inProgressCount,
      pendingReviewCount,
      revisionRequiredCount,
      recentTasks,
    ] = await Promise.all([
      prisma.legalRequest.count({ where: { assignedSpecialistId: specialistId, status: 'assigned' } }),
      prisma.legalRequest.count({ where: { assignedSpecialistId: specialistId, status: 'in_progress' } }),
      prisma.legalRequest.count({ where: { assignedSpecialistId: specialistId, status: 'pending_review' } }),
      prisma.legalRequest.count({ where: { assignedSpecialistId: specialistId, status: 'revision_required' } }),
      prisma.legalRequest.findMany({
        where: {
          assignedSpecialistId: specialistId,
          status: { in: ['assigned', 'in_progress', 'pending_review', 'revision_required'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          workspace: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      }),
    ]);

    const specialistStats = {
      assigned: assignedCount,
      inProgress: inProgressCount,
      pendingReview: pendingReviewCount,
      revisionRequired: revisionRequiredCount,
      total: assignedCount + inProgressCount + pendingReviewCount + revisionRequiredCount,
    };

    const specialistTasks = recentTasks.map(task => ({
      id: task.id,
      code: task.code || task.id.slice(0, 8),
      title: task.title,
      status: task.status,
      priority: task.priority || 'MEDIUM',
      customerName: task.createdBy.name,
      workspaceName: task.workspace.name,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    return (
      <SpecialistDashboardClient
        userName={userName}
        stats={specialistStats}
        recentTasks={specialistTasks}
        translations={{
          pageTitle: 'Bảng điều khiển chuyên viên',
          pageDesc: 'Tổng quan công việc và hồ sơ đang xử lý',
          statAssigned: 'Được gán',
          statInProgress: 'Đang xử lý',
          statPendingReview: 'Chờ duyệt',
          statRevisionRequired: 'Cần sửa',
          statAssignedDesc: 'Hồ sơ mới được gán',
          statInProgressDesc: 'Đang thực hiện',
          statPendingReviewDesc: 'Đã gửi duyệt',
          statRevisionRequiredDesc: 'Cần chỉnh sửa',
          myTasks: 'Công việc của tôi',
          viewAll: 'Xem tất cả',
          noTasks: 'Không có công việc nào',
          noTasksDesc: 'Hiện tại bạn chưa có hồ sơ nào được gán',
          colCode: 'Mã',
          colTitle: 'Tiêu đề',
          colCustomer: 'Khách hàng',
          colStatus: 'Trạng thái',
          colPriority: 'Ưu tiên',
          colAction: 'Thao tác',
          actionStart: 'Bắt đầu',
          actionContinue: 'Tiếp tục',
          actionSubmit: 'Gửi duyệt',
          actionRevise: 'Sửa lại',
          quickTips: 'Mẹo xử lý nhanh',
          tip1: 'Kiểm tra kỹ thông tin khách hàng và tài liệu đính kèm trước khi bắt đầu xử lý.',
          tip2: 'Sử dụng AI Chat để nhận gợi ý phân tích pháp lý và tăng tốc xử lý.',
          tip3: 'Sau khi hoàn tất, gửi duyệt sớm để reviewer có thời gian kiểm tra chất lượng.',
        }}
      />
    );
  }

  // ── REVIEWER DASHBOARD ──
  if (isReviewer) {
    const reviewerId = session.userId;

    const [
      pendingCount,
      approvedTodayCount,
      revisionRequiredCount,
      pendingList,
      recentDecisionsList,
    ] = await Promise.all([
      prisma.legalRequest.count({ where: { assignedReviewerId: reviewerId, status: 'pending_review' } }),
      prisma.legalRequest.count({
        where: {
          assignedReviewerId: reviewerId,
          status: { in: ['approved', 'revision_required'] },
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.legalRequest.count({ where: { assignedReviewerId: reviewerId, status: 'revision_required' } }),
      prisma.legalRequest.findMany({
        where: {
          assignedReviewerId: reviewerId,
          status: 'pending_review',
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          workspace: { select: { name: true } },
          createdBy: { select: { name: true } },
          assignedSpecialist: { select: { name: true } },
        },
      }),
      prisma.legalRequest.findMany({
        where: {
          assignedReviewerId: reviewerId,
          status: { in: ['approved', 'revision_required'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    const reviewerStats = {
      pending: pendingCount,
      approvedToday: approvedTodayCount,
      revisionRequired: revisionRequiredCount,
      total: pendingCount + approvedTodayCount + revisionRequiredCount,
    };

    const pendingReviews = pendingList.map(item => ({
      id: item.id,
      code: item.code || item.id.slice(0, 8),
      title: item.title,
      priority: item.priority || 'MEDIUM',
      specialistName: item.assignedSpecialist?.name || '—',
      customerName: item.createdBy.name,
      workspaceName: item.workspace.name,
      submittedAt: timeAgo(item.updatedAt),
    }));

    const recentDecisions = recentDecisionsList.map(item => ({
      id: item.id,
      code: item.code || item.id.slice(0, 8),
      title: item.title,
      decision: (item.status === 'approved' ? 'approved' : 'revised') as 'approved' | 'revised',
      decisionAt: timeAgo(item.updatedAt),
    }));

    return (
      <ReviewerDashboardClient
        userName={userName}
        stats={reviewerStats}
        pendingReviews={pendingReviews}
        recentDecisions={recentDecisions}
        translations={{
          pageTitle: 'Bảng điều khiển kiểm duyệt',
          pageDesc: 'Tổng quan hồ sơ cần duyệt và lịch sử quyết định',
          statPending: 'Chờ duyệt',
          statApprovedToday: 'Đã duyệt hôm nay',
          statRevisionRequired: 'Yêu cầu sửa',
          statPendingDesc: 'Cần hành động',
          statApprovedTodayDesc: 'Đã phê duyệt',
          statRevisionRequiredDesc: 'Trả lại sửa',
          pendingReviews: 'Hồ sơ chờ kiểm duyệt',
          viewAll: 'Xem tất cả',
          noPending: 'Không có hồ sơ chờ duyệt',
          noPendingDesc: 'Tất cả hồ sơ đã được xử lý',
          recentDecisions: 'Quyết định gần đây',
          noDecisions: 'Chưa có quyết định nào',
          colCode: 'Mã',
          colTitle: 'Tiêu đề',
          colSpecialist: 'Chuyên viên',
          colCustomer: 'Khách hàng',
          colPriority: 'Ưu tiên',
          actionReview: 'Duyệt',
          approvedLabel: 'Đã duyệt',
          revisedLabel: 'Yêu cầu sửa',
          reviewGuidelines: 'Nguyên tắc kiểm duyệt',
          guideline1: 'Đọc kỹ toàn bộ hồ sơ, đối chiếu với yêu cầu ban đầu của khách hàng trước khi ra quyết định.',
          guideline2: 'Kiểm tra tính pháp lý và tính nhất quán của tài liệu — đây là bước kiểm soát chất lượng cuối cùng.',
          guideline3: 'Nếu yêu cầu chỉnh sửa, ghi rõ lý do và hướng dẫn cụ thể để chuyên viên sửa nhanh chóng.',
        }}
      />
    );
  }

  // ── ADMIN DASHBOARD (existing) ──
  // Parallel Prisma queries for admin
  const [
    totalUsers,
    activeUsers,
    invitedUsers,
    totalWorkspaces,
    activeWorkspaces,
    openRequests,
    nearSlaRequests,
    auditAlertsCount,
    specialistsWithWorkload,
    featuredWorkspaces,
    pendingApprovalsRaw,
    recentAuditEvents,
    recentRequests,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { emailVerified: false, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.workspace.count(),
    prisma.workspace.count({ where: { isActive: true } }),
    prisma.legalRequest.count({ where: { status: { notIn: ['closed', 'cancelled', 'delivered'] } } }),
    prisma.legalRequest.count({
      where: { slaDeadline: { lte: new Date(Date.now() + 4 * 60 * 60 * 1000), not: null }, status: { notIn: ['closed', 'cancelled', 'delivered'] } },
    }),
    prisma.auditEvent.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, action: { in: ['access_denied', 'permission_change', 'unauthorized_access_attempt'] } } }),
    prisma.user.findMany({
      where: { isActive: true, memberships: { some: { role: { in: ['specialist', 'reviewer', 'coordinator_admin'] } } } },
      include: { memberships: { where: { role: { in: ['specialist', 'reviewer', 'coordinator_admin'] } } }, specialistRequests: true, reviewerRequests: true },
      take: 5,
    }),
    prisma.workspace.findMany({ include: { memberships: true, requests: { where: { status: { notIn: ['closed', 'cancelled'] } } } }, orderBy: { createdAt: 'desc' }, take: 3 }),
    prisma.user.findMany({ where: { emailVerified: false }, take: 3 }),
    prisma.auditEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { actor: { select: { name: true, id: true } }, workspace: { select: { name: true } } } }),
    prisma.legalRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { workspace: { select: { name: true, slug: true } }, createdBy: { select: { name: true, email: true } }, assignedSpecialist: { select: { name: true, email: true } } } }),
  ]);

  const stats = {
    users: { total: totalUsers, active: activeUsers, invited: invitedUsers },
    workspaces: { total: totalWorkspaces, active: activeWorkspaces },
    nearSla: nearSlaRequests,
    auditAlerts: auditAlertsCount,
    openRequests: openRequests,
  };

  const workloadData = specialistsWithWorkload.map((user) => {
    const requestCount = user.specialistRequests.length + user.reviewerRequests.length;
    const role = user.memberships[0]?.role || 'specialist';
    const progress = Math.min((requestCount / 20) * 100, 100);
    let status: 'ok' | 'warn' | 'danger' = 'ok';
    if (progress > 80) status = 'danger';
    else if (progress > 60) status = 'warn';
    return { initials: user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(), name: user.name, role: role === 'specialist' ? 'Specialist' : role === 'reviewer' ? 'Reviewer' : 'Coordinator', progress, status, count: `${requestCount} hồ sơ` };
  });

  const workspaceData = featuredWorkspaces.map((ws) => ({
    initials: ws.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
    iconColor: (ws.slug.includes('noi') || ws.slug.includes('internal') ? 'orange' : ws.slug.includes('minh') ? 'blue' : 'green') as 'green' | 'blue' | 'orange',
    name: ws.name,
    description: `${ws.memberships.length} users · ${ws.requests.length} hồ sơ`,
    badge: ws.isActive ? 'Active' : 'Inactive',
    badgeColor: (ws.isActive ? 'green' : 'blue') as 'green' | 'blue',
  }));

  const approvalData = pendingApprovalsRaw.slice(0, 3).map((user) => ({
    icon: user.name[0]?.toUpperCase() || '?', iconColor: 'orange' as const, title: user.name, description: user.email, badge: 'Pending', badgeColor: 'orange' as const,
  }));

  const timelineData = recentAuditEvents.map((event) => {
    const targetLabel = event.targetId ? (event.workspace?.name || event.targetId.slice(0, 12)) : (event.workspace?.name || '—');
    return { actorName: event.actor?.name || 'Hệ thống', action: event.action, targetType: event.targetType, targetLabel, description: event.metadataSummary || '', time: timeAgo(event.createdAt) };
  });

  const requestTableData = recentRequests.map((req) => {
    const statusColors: Record<string, 'orange' | 'blue' | 'green' | 'red' | 'purple'> = { draft_intake: 'orange', triage: 'blue', assigned: 'blue', in_progress: 'orange', pending_review: 'purple', revision_required: 'red', approved: 'green', delivered: 'green', closed: 'blue', cancelled: 'red' };
    const slaColor: 'red' | 'orange' | 'green' | 'blue' = !req.slaDeadline ? 'blue' : req.slaDeadline < new Date() ? 'red' : req.slaDeadline < new Date(Date.now() + 4 * 60 * 60 * 1000) ? 'orange' : 'green';
    let slaText = 'Closed';
    if (req.slaDeadline) {
      const hoursLeft = Math.floor((req.slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60));
      if (hoursLeft < 0) { const daysOverdue = Math.abs(Math.floor(hoursLeft / 24)); slaText = daysOverdue > 0 ? `Quá ${daysOverdue} ngày` : 'Quá hạn'; }
      else if (hoursLeft === 0) slaText = 'Sắp hết hạn';
      else slaText = `Còn ${hoursLeft}h`;
    }
    return { id: req.code || req.id.slice(0, 8), type: req.matterType || 'Legal Request', workspace: req.workspace.name, workspaceSlug: req.workspace.slug, customer: req.createdBy.name, customerEmail: req.createdBy.email, status: statusColors[req.status] || 'blue', statusText: req.status, assignee: req.assignedSpecialist?.name || 'Chưa gán', assigneeRole: req.assignedSpecialist ? 'Specialist' : 'Unassigned', sla: slaColor, slaText, action: req.status === 'closed' || req.status === 'cancelled' ? 'Xem log' : req.status === 'approved' || req.status === 'delivered' ? 'Audit' : 'Điều phối' };
  });

  const alertData: Array<{ type: 'accessDenied' | 'nearSla' | 'roleChange' | 'noAlerts'; icon: string; iconColor: 'red' | 'orange' | 'blue' | 'green'; count: number; badgeKey: string; badgeColor: 'red' | 'orange' | 'blue' | 'green' }> = [
    { type: 'accessDenied', icon: '!', iconColor: 'red', count: auditAlertsCount, badgeKey: 'audit', badgeColor: 'red' },
    { type: 'nearSla', icon: 'S', iconColor: 'orange', count: nearSlaRequests, badgeKey: 'sla', badgeColor: 'orange' },
    { type: 'roleChange', icon: 'R', iconColor: 'blue', count: pendingApprovalsRaw.length, badgeKey: 'role', badgeColor: 'blue' },
    { type: 'noAlerts', icon: 'V', iconColor: 'green', count: 0, badgeKey: 'ok', badgeColor: 'green' },
  ];

  return (
    <AdminDashboardClient
      currentUserName={session.name ?? ''}
      stats={stats}
      workloadData={workloadData}
      alertData={alertData}
      workspaceData={workspaceData}
      approvalData={approvalData}
      timelineData={timelineData}
      requestTableData={requestTableData}
      translations={{
        pageTitle: 'Tổng quan hệ thống', pageDesc: 'Tổng quan hoạt động hệ thống, workspaces và SLA.',
        bannerTitle: 'Hệ thống đang hoạt động ổn định',
        bannerDesc: `${stats.openRequests} hồ sơ đang mở, ${stats.nearSla} hồ sơ sắp quá SLA, ${stats.auditAlerts} cảnh báo audit cần rà soát và ${stats.workspaces.active} workspace đang hoạt động.`,
        viewAudit: 'Xem nhật ký', dispatchWorkload: 'Điều phối workload', exportReport: 'Xuất báo cáo', createRequest: 'Tạo hồ sơ mới',
        statUsers: 'Tổng người dùng', statUsersDesc: `${stats.users.active} active, ${stats.users.invited} invited`,
        statWorkspaces: 'Không gian làm việc', statWorkspacesDesc: `${stats.workspaces.active} đang hoạt động`,
        statNearSla: 'Sắp quá SLA', statNearSlaDesc: 'cần ưu tiên xử lý',
        statAuditAlerts: 'Cảnh báo audit', statAuditAlertsDesc: 'cần rà soát',
        workloadPanel: 'Khối lượng công việc chuyên viên', alertsPanel: 'Cảnh báo cần xử lý',
        workspacesPanel: 'Không gian nổi bật', approvalsPanel: 'Chờ phê duyệt',
        timelinePanel: 'Nhật ký kiểm toán gần đây',
        viewDetail: 'Xem chi tiết', viewAll: 'Xem tất cả',
        colCode: 'Mã hồ sơ', colWorkspace: 'Không gian', colCustomer: 'Khách hàng',
        colStatus: 'Trạng thái', colAssignee: 'Người phụ trách', colSla: 'SLA', colAction: 'Thao tác',
        searchPlaceholder: 'Tìm hồ sơ, workspace, người phụ trách...',
        filter: 'Bộ lọc', status: 'Trạng thái', workspace: 'Không gian', export: 'Xuất', columns: 'Cột hiển thị',
      }}
    />
  );
}
