import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays === 1) {
    return 'Hôm qua';
  } else {
    return `${diffDays} ngày trước`;
  }
}

function getStatusVariant(status: string): string {
  switch (status) {
    case 'approved':
    case 'delivered':
    case 'closed':
      return 'green';
    case 'pending_review':
    case 'revision_required':
      return 'orange';
    case 'in_progress':
    case 'submitted_for_review':
      return 'blue';
    case 'cancelled':
    case 'rejected':
      return 'red';
    default:
      return 'blue';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'approved':
      return 'Đã duyệt';
    case 'delivered':
      return 'Đã giao';
    case 'closed':
      return 'Đã đóng';
    case 'pending_review':
      return 'Cần phản hồi';
    case 'revision_required':
      return 'Cần chỉnh sửa';
    case 'in_progress':
      return 'Đang xử lý';
    case 'submitted_for_review':
      return 'Đang review';
    case 'cancelled':
    case 'rejected':
      return 'Từ chối';
    default:
      return status;
  }
}

// GET /api/dashboard - Get dashboard data for current user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;

    if (!activeWorkspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: activeWorkspaceId },
      select: { id: true, name: true, slug: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get user info for greeting
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Execute parallel queries for dashboard data
    const [
      totalRequests,
      inProgressRequests,
      completedRequests,
      vaultDocs,
      recentCases,
      allCases,
      recentDocs,
      activityLog,
    ] = await Promise.all([
      // Total requests count
      prisma.legalRequest.count({
        where: { workspaceId: activeWorkspaceId },
      }),
      // In progress count
      prisma.legalRequest.count({
        where: {
          workspaceId: activeWorkspaceId,
          status: { in: ['in_progress', 'pending_review', 'assigned', 'submitted_for_review'] },
        },
      }),
      // Completed count
      prisma.legalRequest.count({
        where: {
          workspaceId: activeWorkspaceId,
          status: { in: ['approved', 'delivered', 'closed'] },
        },
      }),
      // Vault docs count
      prisma.vaultFile.count({
        where: { workspaceId: activeWorkspaceId },
      }),
      // Recent cases (active requests) - for top panel
      prisma.legalRequest.findMany({
        where: {
          workspaceId: activeWorkspaceId,
          status: { in: ['in_progress', 'pending_review', 'revision_required', 'submitted_for_review'] },
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          assignedSpecialist: { select: { name: true } },
          assignedReviewer: { select: { name: true } },
        },
      }),
      // All cases for table - sorted by updatedAt desc
      prisma.legalRequest.findMany({
        where: { workspaceId: activeWorkspaceId },
        orderBy: { updatedAt: 'desc' },
        include: {
          assignedSpecialist: { select: { name: true } },
          assignedReviewer: { select: { name: true } },
        },
      }),
      // Recent documents
      prisma.vaultFile.findMany({
        where: { workspaceId: activeWorkspaceId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      // Activity log (AuditEvent)
      prisma.auditEvent.findMany({
        where: { workspaceId: activeWorkspaceId },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Transform recent cases
    const transformedCases = recentCases.map((c) => ({
      id: c.id,
      code: c.code || c.id.slice(-10),
      title: c.title,
      matterType: c.matterType || 'Legal Request',
      status: c.status,
      statusVariant: getStatusVariant(c.status),
      statusText: getStatusText(c.status),
      assignee: c.assignedSpecialist?.name || c.assignedReviewer?.name || '—',
      assigneeRole: c.assignedSpecialist ? 'Chuyên viên' : c.assignedReviewer ? 'Reviewer' : '—',
      updatedAt: c.updatedAt.toISOString(),
    }));

    // Transform all cases for table
    const transformedAllCases = allCases.map((c) => ({
      id: c.id,
      code: c.code || c.id.slice(-10),
      title: c.title,
      matterType: c.matterType || 'Legal Request',
      status: c.status,
      statusVariant: getStatusVariant(c.status),
      statusText: getStatusText(c.status),
      assignee: c.assignedSpecialist?.name || c.assignedReviewer?.name || '—',
      assigneeRole: c.assignedSpecialist ? 'Chuyên viên' : c.assignedReviewer ? 'Reviewer' : '—',
      updatedAt: c.updatedAt.toISOString(),
    }));

    // Transform recent documents
    const transformedDocs = recentDocs.map((d) => ({
      id: d.id,
      filename: d.filename || 'Untitled',
      size: d.size || 0,
      mimeType: d.contentType || 'application/octet-stream',
      status: 'ACTIVE',
      uploadedBy: '—',
      updatedAt: d.createdAt.toISOString(),
      relativeTime: getRelativeTime(d.createdAt),
    }));

    // Transform activity log - create meaningful descriptions based on action type
    const transformedActivity = activityLog.map((a) => {
      // Create human-readable descriptions based on action type
      let description = a.action;

      if (a.action.includes('response') || a.action.includes('phản hồi')) {
        description = `${a.actorId || 'Chuyên viên'} đã phản hồi yêu cầu.`;
      } else if (a.action.includes('document') || a.action.includes('tài liệu')) {
        description = `${a.actorId || 'Hệ thống'} đã cập nhật tài liệu trong vault.`;
      } else if (a.action.includes('review') || a.action.includes('duyệt')) {
        description = `${a.actorId || 'Coordinator'} đã xác nhận hoàn tất yêu cầu.`;
      } else if (a.action.includes('create') || a.action.includes('tạo')) {
        description = `${a.actorId || 'Khách hàng'} đã tạo yêu cầu mới.`;
      } else if (a.action.includes('workspace') || a.action.includes('scope')) {
        description = `Hệ thống xác nhận quyền truy cập chỉ trong phạm vi workspace.`;
      }

      // Create readable action title
      let actionTitle = a.action;
      if (a.action.includes('response')) actionTitle = 'Chuyên viên đã phản hồi hồ sơ';
      else if (a.action.includes('document')) actionTitle = 'Tài liệu mới được thêm vào vault';
      else if (a.action.includes('review_')) actionTitle = 'Hồ sơ được duyệt';
      else if (a.action.includes('workspace')) actionTitle = 'Workspace scope được kiểm tra';
      else if (a.action.includes('create')) actionTitle = 'Yêu cầu mới được tạo';

      return {
        id: a.id,
        action: actionTitle,
        description: description,
        actor: a.actorId || 'Hệ thống',
        timestamp: a.createdAt.toISOString(),
        relativeTime: getRelativeTime(a.createdAt),
      };
    });

    // Calculate SLA deadlines
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const deadlines = await prisma.legalRequest.findMany({
      where: {
        workspaceId: activeWorkspaceId,
        slaDeadline: {
          gte: oneDayAgo,
          lte: sevenDaysFromNow,
        },
      },
      take: 5,
      orderBy: { slaDeadline: 'asc' },
      select: {
        id: true,
        title: true,
        code: true,
        slaDeadline: true,
        createdAt: true,
        status: true,
      },
    });

    const transformedDeadlines = deadlines
      .filter((d) => d.slaDeadline) // Filter out null deadlines
      .map((d) => {
        const deadline = d.slaDeadline!;
        const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        const totalHours = (deadline.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
        const elapsedHours = totalHours - hoursRemaining;
        const progressPercent = Math.min(100, Math.max(0, (elapsedHours / totalHours) * 100));

        let status: 'ok' | 'warn' | 'danger' = 'ok';
        if (hoursRemaining < 0) status = 'danger';
        else if (hoursRemaining < 24) status = 'danger';
        else if (hoursRemaining < 72) status = 'warn';

        let timeText = '';
        if (hoursRemaining < 0) {
          const overdueDays = Math.abs(Math.floor(hoursRemaining / 24));
          timeText = `Quá hạn ${overdueDays} ngày`;
        } else if (hoursRemaining < 24) {
          timeText = `Còn ${Math.ceil(hoursRemaining)} giờ`;
        } else {
          timeText = `Còn ${Math.ceil(hoursRemaining / 24)} ngày`;
        }

        return {
          id: d.id,
          title: d.title || d.code || 'Legal Request',
          code: d.code || d.id.slice(-10),
          slaDeadline: deadline.toISOString(),
          progress: Math.round(progressPercent),
          status,
          timeText,
        };
      });

    // Calculate new replies count (messages in last 24h)
    const newReplies = await prisma.message.count({
      where: {
        workspaceId: activeWorkspaceId,
        createdAt: { gte: oneDayAgo },
      },
    });

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      stats: {
        totalRequests,
        inProgress: inProgressRequests,
        completed: completedRequests,
        vaultDocs,
      },
      welcome: {
        activeRequests: inProgressRequests,
        pendingDocs: 0,
        newReplies,
        userName: user?.name || 'User',
      },
      recentCases: transformedCases,
      allCases: transformedAllCases,
      totalCases: totalRequests,
      deadlines: transformedDeadlines,
      recentDocs: transformedDocs,
      activity: transformedActivity,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Return a proper error response instead of throwing
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
