import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import SpecialistDashboardClient from '@/components/admin/SpecialistDashboardClient';
import ReviewerDashboardClient from '@/components/admin/ReviewerDashboardClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

function timeAgo(date: Date, locale: string): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
  if (locale === 'en') {
    if (minutes < 60) return `${minutes} minutes ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
    return `${Math.floor(minutes / 1440)} days ago`;
  }
  if (locale === 'zh') {
    if (minutes < 60) return `${minutes} 分钟前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
    return `${Math.floor(minutes / 1440)} 天前`;
  }
  if (locale === 'ja') {
    if (minutes < 60) return `${minutes}分前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}時間前`;
    return `${Math.floor(minutes / 1440)}日前`;
  }
  // vi (default)
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
    const t = await getTranslations({ locale, namespace: 'SpecialistDashboard' });
    const specialistId = session.userId;

    try {
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
      customerName: task.createdBy?.name || 'Unknown',
      workspaceName: task.workspace?.name || 'Unknown',
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    return (
      <SpecialistDashboardClient
        userName={userName}
        stats={specialistStats}
        recentTasks={specialistTasks}
        translations={{
          pageTitle: t('pageTitle'),
          pageDesc: t('pageDesc'),
          statAssigned: t('statAssigned'),
          statInProgress: t('statInProgress'),
          statPendingReview: t('statPendingReview'),
          statRevisionRequired: t('statRevisionRequired'),
          statAssignedDesc: t('statAssignedDesc'),
          statInProgressDesc: t('statInProgressDesc'),
          statPendingReviewDesc: t('statPendingReviewDesc'),
          statRevisionRequiredDesc: t('statRevisionRequiredDesc'),
          myTasks: t('myTasks'),
          viewAll: t('viewAll'),
          noTasks: t('noTasks'),
          noTasksDesc: t('noTasksDesc'),
          colCode: t('colCode'),
          colTitle: t('colTitle'),
          colCustomer: t('colCustomer'),
          colStatus: t('colStatus'),
          colPriority: t('colPriority'),
          colAction: t('colAction'),
          actionStart: t('actionStart'),
          actionContinue: t('actionContinue'),
          actionSubmit: t('actionSubmit'),
          actionRevise: t('actionRevise'),
          quickTips: t('quickTips'),
          tip1: t('tip1'),
          tip2: t('tip2'),
          tip3: t('tip3'),
        }}
      />
    );
    } catch (error) {
      console.error('Specialist dashboard error:', error);
      return (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Error</h1>
          <p style={{ color: '#6b7280' }}>Failed to load dashboard data. Please try again later.</p>
        </div>
      );
    }
  }

  // ── REVIEWER DASHBOARD ──
  if (isReviewer) {
    const t = await getTranslations({ locale, namespace: 'ReviewerDashboard' });
    const reviewerId = session.userId;

    try {
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
          status: 'approved',
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
      customerName: item.createdBy?.name || 'Unknown',
      workspaceName: item.workspace?.name || 'Unknown',
      submittedAt: timeAgo(item.updatedAt, locale),
    }));

    const recentDecisions = recentDecisionsList.map(item => ({
      id: item.id,
      code: item.code || item.id.slice(0, 8),
      title: item.title,
      decision: (item.status === 'approved' ? 'approved' : 'revised') as 'approved' | 'revised',
      decisionAt: timeAgo(item.updatedAt, locale),
    }));

    return (
      <ReviewerDashboardClient
        userName={userName}
        stats={reviewerStats}
        pendingReviews={pendingReviews}
        recentDecisions={recentDecisions}
        translations={{
          pageTitle: t('pageTitle'),
          pageDesc: t('pageDesc'),
          statPending: t('statPending'),
          statApprovedToday: t('statApprovedToday'),
          statRevisionRequired: t('statRevisionRequired'),
          statPendingDesc: t('statPendingDesc'),
          statApprovedTodayDesc: t('statApprovedTodayDesc'),
          statRevisionRequiredDesc: t('statRevisionRequiredDesc'),
          pendingReviews: t('pendingReviews'),
          viewAll: t('viewAll'),
          noPending: t('noPending'),
          noPendingDesc: t('noPendingDesc'),
          recentDecisions: t('recentDecisions'),
          noDecisions: t('noDecisions'),
          colCode: t('colCode'),
          colTitle: t('colTitle'),
          colSpecialist: t('colSpecialist'),
          colCustomer: t('colCustomer'),
          colPriority: t('colPriority'),
          actionReview: t('actionReview'),
          approvedLabel: t('approvedLabel'),
          revisedLabel: t('revisedLabel'),
          reviewGuidelines: t('reviewGuidelines'),
          guideline1: t('guideline1'),
          guideline2: t('guideline2'),
          guideline3: t('guideline3'),
        }}
      />
    );
    } catch (error) {
      console.error('Reviewer dashboard error:', error);
      return (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Error</h1>
          <p style={{ color: '#6b7280' }}>Failed to load dashboard data. Please try again later.</p>
        </div>
      );
    }
  }

  // ── ADMIN DASHBOARD ──
  if (!isAdmin) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Không có quyền truy cập</h1>
        <p style={{ color: '#6b7280' }}>Bạn không có quyền admin để xem trang này.</p>
      </div>
    );
  }
  const t = await getTranslations({ locale, namespace: 'AdminDashboard' });

  // Parallel Prisma queries
  try {
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
      include: { memberships: { where: { role: { in: ['specialist', 'reviewer', 'coordinator_admin'] } } }, _count: { select: { specialistRequests: { where: { status: { notIn: ['closed', 'cancelled', 'delivered'] } } }, reviewerRequests: { where: { status: { notIn: ['closed', 'cancelled', 'delivered'] } } } } } },
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
    const requestCount = (user._count?.specialistRequests || 0) + (user._count?.reviewerRequests || 0);
    const role = user.memberships[0]?.role || 'specialist';
    const progress = Math.min((requestCount / 20) * 100, 100);
    let status: 'ok' | 'warn' | 'danger' = 'ok';
    if (progress > 80) status = 'danger';
    else if (progress > 60) status = 'warn';
    const userName = user.name || 'Unknown';
    return { initials: userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(), name: userName, role: role === 'specialist' ? 'Specialist' : role === 'reviewer' ? 'Reviewer' : 'Coordinator', progress, status, count: `${requestCount} hồ sơ` };
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
    icon: (user.name || '?')[0]?.toUpperCase() || '?', iconColor: 'orange' as const, title: user.name || 'Unknown', description: user.email, badge: 'Pending', badgeColor: 'orange' as const,
  }));

  const timelineData = recentAuditEvents.map((event) => {
    const targetLabel = event.targetId ? (event.workspace?.name || event.targetId.slice(0, 12)) : (event.workspace?.name || '—');
    return { actorName: event.actor?.name || 'Hệ thống', action: event.action, targetType: event.targetType, targetLabel, description: event.metadataSummary || '', time: timeAgo(event.createdAt, locale) };
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
    return { id: req.code || req.id.slice(0, 8), type: req.matterType || 'Legal Request', workspace: req.workspace?.name || 'Unknown', workspaceSlug: req.workspace?.slug || '', customer: req.createdBy?.name || 'Unknown', customerEmail: req.createdBy?.email || '', status: statusColors[req.status] || 'blue', statusText: req.status, assignee: req.assignedSpecialist?.name || 'Chưa gán', assigneeRole: req.assignedSpecialist ? 'Specialist' : 'Unassigned', sla: slaColor, slaText, action: (() => { if (req.status === 'closed' || req.status === 'cancelled') return 'Xem log'; if (req.status === 'approved' || req.status === 'delivered') return 'Audit'; return 'Điều phối'; })() };
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
        pageTitle: t('pageTitle'),
        pageDesc: t('pageDesc'),
        bannerTitle: t('bannerTitle'),
        bannerDesc: t('bannerDesc', {
          openRequests: stats.openRequests,
          nearSla: stats.nearSla,
          auditAlerts: stats.auditAlerts,
          activeWorkspaces: stats.workspaces.active,
        }),
        viewAudit: t('viewAudit'),
        dispatchWorkload: t('dispatchWorkload'),
        exportReport: t('exportReport'),
        createRequest: t('createRequest'),
        statUsers: t('statUsers'),
        statUsersDesc: t('statUsersDesc', { active: stats.users.active, invited: stats.users.invited }),
        statWorkspaces: t('statWorkspaces'),
        statWorkspacesDesc: t('statWorkspacesDesc', { count: stats.workspaces.active }),
        statNearSla: t('statNearSla'),
        statNearSlaDesc: t('statNearSlaDesc'),
        statAuditAlerts: t('statAuditAlerts'),
        statAuditAlertsDesc: t('statAuditAlertsDesc'),
        workloadPanel: t('workloadPanel'),
        alertsPanel: t('alertsPanel'),
        workspacesPanel: t('workspacesPanel'),
        approvalsPanel: t('approvalsPanel'),
        timelinePanel: t('timelinePanel'),
        viewDetail: t('viewDetail'),
        viewAll: t('viewAll'),
        colCode: t('colCode'),
        colWorkspace: t('colWorkspace'),
        colCustomer: t('colCustomer'),
        colStatus: t('colStatus'),
        colAssignee: t('colAssignee'),
        colSla: t('colSla'),
        colAction: t('colAction'),
        searchPlaceholder: t('searchPlaceholder'),
        filter: t('filter'),
        status: t('status'),
        workspace: t('workspace'),
        export: t('export'),
        columns: t('columns'),
      }}
    />
  );
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Lỗi tải dữ liệu</h1>
        <p style={{ color: '#6b7280' }}>Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}
