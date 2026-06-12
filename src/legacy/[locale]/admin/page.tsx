import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const t = await getTranslations('AdminDashboard');

  // Fetch all data needed for expanded dashboard
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
    // User counts
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { emailVerified: false } }),

    // Workspace counts
    prisma.workspace.count(),
    prisma.workspace.count({ where: { isActive: true } }),

    // Request counts
    prisma.legalRequest.count({
      where: {
        status: {
          notIn: ['closed', 'cancelled', 'delivered'],
        },
      },
    }),
    prisma.legalRequest.count({
      where: {
        slaDeadline: {
          lte: new Date(Date.now() + 4 * 60 * 60 * 1000), // Within 4 hours
          not: null,
        },
        status: {
          notIn: ['closed', 'cancelled', 'delivered'],
        },
      },
    }),
    prisma.auditEvent.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
        },
        action: {
          in: ['access_denied', 'permission_change', 'unauthorized_access_attempt'],
        },
      },
    }),

    // Specialists with workload (users with specialist/reviewer/coordinator roles)
    prisma.user.findMany({
      where: {
        isActive: true,
        memberships: {
          some: {
            role: {
              in: ['specialist', 'reviewer', 'coordinator_admin'],
            },
          },
        },
      },
      include: {
        memberships: {
          where: {
            role: {
              in: ['specialist', 'reviewer', 'coordinator_admin'],
            },
          },
        },
        specialistRequests: true,
        reviewerRequests: true,
      },
      take: 5,
    }),

    // Top workspaces by activity
    prisma.workspace.findMany({
      include: {
        memberships: true,
        requests: {
          where: {
            status: {
              notIn: ['closed', 'cancelled'],
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
    }),

    // Pending approvals (users not yet verified or with pending status)
    prisma.user.findMany({
      where: {
        emailVerified: false,
      },
      take: 3,
    }),

    // Recent audit events
    prisma.auditEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        actor: {
          select: {
            name: true,
            id: true,
          },
        },
        workspace: {
          select: {
            name: true,
          },
        },
      },
    }),

    // Recent requests for table
    prisma.legalRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        workspace: {
          select: {
            name: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        assignedSpecialist: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  // Transform data for client component
  const stats = {
    users: {
      total: totalUsers,
      active: activeUsers,
      invited: invitedUsers,
    },
    workspaces: {
      total: totalWorkspaces,
      active: activeWorkspaces,
    },
    nearSla: nearSlaRequests,
    auditAlerts: auditAlertsCount,
    openRequests: openRequests,
  };

  // Specialist workload data
  const workloadData = specialistsWithWorkload.map((user) => {
    const requestCount = user.specialistRequests.length + user.reviewerRequests.length;
    const role = user.memberships[0]?.role || 'specialist';
    const progress = Math.min((requestCount / 20) * 100, 100); // Normalize to 20 as max
    let status: 'ok' | 'warn' | 'danger' = 'ok';
    if (progress > 80) status = 'danger';
    else if (progress > 60) status = 'warn';

    return {
      initials: user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      name: user.name,
      role: role === 'specialist' ? 'Specialist' : role === 'reviewer' ? 'Reviewer' : 'Coordinator',
      progress,
      status,
      count: `${requestCount} hồ sơ`,
    };
  });

  // Workspace data
  const workspaceData = featuredWorkspaces.map((ws) => {
    const initials = ws.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const iconColor: 'green' | 'blue' | 'orange' = ws.slug.includes('noi') || ws.slug.includes('internal') ? 'orange' : ws.slug.includes('minh') ? 'blue' : 'green';
    const badge = ws.isActive ? 'Active' : 'Inactive';
    const badgeColor: 'green' | 'blue' = ws.isActive ? 'green' : 'blue';

    return {
      initials,
      iconColor,
      name: ws.name,
      description: `${ws.memberships.length} users · ${ws.requests.length} hồ sơ`,
      badge,
      badgeColor,
    };
  });

  // Approval data (from unverified users pending approval)
  const approvalData = pendingApprovalsRaw.slice(0, 3).map((user) => ({
    icon: user.name[0].toUpperCase(),
    iconColor: 'orange' as const,
    title: user.name,
    description: user.email,
    badge: 'Pending',
    badgeColor: 'orange' as const,
  }));

  // Audit timeline data
  const timelineData = recentAuditEvents.map((event) => {
    const timeAgo = Math.floor((Date.now() - event.createdAt.getTime()) / 1000 / 60);
    let timeStr = '';
    if (timeAgo < 60) timeStr = `${timeAgo} phút trước`;
    else if (timeAgo < 1440) timeStr = `${Math.floor(timeAgo / 60)} giờ trước`;
    else timeStr = `${Math.floor(timeAgo / 1440)} ngày trước`;

    return {
      title: event.actor ? `${event.actor.name} ${event.action}` : event.action,
      description: event.metadataSummary || `${event.targetType} in ${event.workspace.name}`,
      time: timeStr,
    };
  });

  // Request table data
  const requestTableData = recentRequests.map((req) => {
    const statusColors: Record<string, 'orange' | 'blue' | 'green' | 'red' | 'purple'> = {
      draft_intake: 'orange',
      intake_submitted: 'orange',
      triage: 'blue',
      assigned: 'blue',
      in_progress: 'orange',
      pending_review: 'purple',
      revision_required: 'red',
      approved: 'green',
      delivered: 'green',
      closed: 'blue',
      cancelled: 'red',
    };

    const slaColor: 'red' | 'orange' | 'green' | 'blue' = !req.slaDeadline
      ? 'blue'
      : req.slaDeadline < new Date()
      ? 'red'
      : req.slaDeadline < new Date(Date.now() + 4 * 60 * 60 * 1000)
      ? 'orange'
      : 'green';

    let slaText = 'Closed';
    if (req.slaDeadline) {
      const hoursLeft = Math.floor((req.slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60));
      if (hoursLeft < 0) slaText = 'Quá hạn';
      else if (hoursLeft === 0) slaText = 'Sắp hết hạn';
      else slaText = `Còn ${hoursLeft}h`;
    }

    return {
      id: req.code || req.id.slice(0, 8),
      type: req.matterType || 'Legal Request',
      workspace: req.workspace.name,
      workspaceSlug: req.workspace.slug,
      customer: req.createdBy.name,
      customerEmail: req.createdBy.email,
      status: statusColors[req.status] || 'blue',
      statusText: req.status,
      assignee: req.assignedSpecialist?.name || 'Chưa gán',
      assigneeRole: req.assignedSpecialist ? 'Specialist' : 'Unassigned',
      sla: slaColor,
      slaText,
      action: req.status === 'closed' || req.status === 'cancelled' ? 'Xem log' : req.status === 'approved' || req.status === 'delivered' ? 'Audit' : 'Điều phối',
    };
  });

  // Alert data
  const alertData = [
    {
      icon: '!',
      iconColor: 'red' as const,
      title: t('accessDenied'),
      description: 'Reviewer ngoài workspace scope',
      badge: 'Audit',
      badgeColor: 'red' as const,
    },
    {
      icon: 'S',
      iconColor: 'orange' as const,
      title: `${nearSlaRequests} ${t('nearSla')}`,
      description: 'Cần điều phối trước 17:00',
      badge: 'SLA',
      badgeColor: 'orange' as const,
    },
    {
      icon: 'R',
      iconColor: 'blue' as const,
      title: `${pendingApprovalsRaw.length} ${t('roleChange')}`,
      description: 'Đang chờ Super Admin duyệt',
      badge: 'Role',
      badgeColor: 'blue' as const,
    },
    {
      icon: 'V',
      iconColor: 'green' as const,
      title: t('vaultScan'),
      description: '96% tệp có workspace scope',
      badge: 'Vault',
      badgeColor: 'green' as const,
    },
  ];

  return (
    <AdminDashboardClient
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
}
