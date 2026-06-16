import { UserLayout } from '@/components/layout/UserLayout';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) return 'vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}p trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h trước`;
  return `${Math.floor(diff / 86400000)}d trước`;
}

export default async function DashboardPage() {
  const session = await requireAppSession();
  const { userId, activeWorkspaceId } = session;

  // Fetch all data needed for dashboard in parallel
  const [
    user,
    activeWorkspace,
    totalRequests,
    processingRequests,
    completedRequests,
    requests,
    recentDocuments,
    recentActivities,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    activeWorkspaceId
      ? prisma.workspace.findUnique({
          where: { id: activeWorkspaceId },
          select: { id: true, name: true, slug: true },
        })
      : null,
    // Total = all workspace requests
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '' } }),
    // Processing = in_progress + pending_review + triage + assigned
    prisma.legalRequest.count({
      where: { workspaceId: activeWorkspaceId ?? '', status: { in: ['in_progress', 'pending_review', 'triage', 'assigned'] } },
    }),
    // Completed = approved + delivered + closed
    prisma.legalRequest.count({
      where: { workspaceId: activeWorkspaceId ?? '', status: { in: ['approved', 'delivered', 'closed'] } },
    }),
    // Requests with relations
    prisma.legalRequest.findMany({
      where: { workspaceId: activeWorkspaceId ?? '' },
      include: {
        assignedSpecialist: { select: { name: true } },
        assignedReviewer: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    // Recent vault documents
    prisma.vaultFile.findMany({
      where: { workspaceId: activeWorkspaceId ?? '' },
      include: {
        actor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Recent audit events
    prisma.auditEvent.findMany({
      where: { workspaceId: activeWorkspaceId ?? '' },
      include: {
        actor: { select: { name: true } },
        request: { select: { code: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const userName = user?.name ?? user?.email ?? 'User';
  const workspaceName = activeWorkspace?.name ?? 'Workspace';

  // Transform requests for CasesTable
  const transformedRequests = requests.map((req) => {
    const statusVariant = getStatusVariant(req.status);
    const statusText = getStatusText(req.status);

    return {
      id: req.id,
      code: req.code || `REQ-${req.createdAt.getFullYear()}-${String(req.id.slice(-3)).toUpperCase()}`,
      title: req.title,
      matterType: req.matterType || 'Legal Request',
      status: req.status,
      statusVariant,
      statusText,
      assignee: req.assignedSpecialist?.name || req.assignedReviewer?.name || '—',
      assigneeRole: req.assignedSpecialist ? 'Chuyên viên' : req.assignedReviewer ? 'Reviewer' : '—',
      updatedAt: req.updatedAt.toISOString(),
    };
  });

  // Transform recent documents
  const transformedDocuments = recentDocuments.map((doc) => ({
    id: doc.id,
    filename: doc.filename || 'Untitled',
    size: doc.size || 0,
    mimeType: doc.contentType || 'application/octet-stream',
    status: doc.fileKind || 'ACTIVE',
    uploadedBy: doc.actor?.name || 'Unknown',
    updatedAt: doc.createdAt.toISOString(),
    relativeTime: formatRelativeTime(doc.createdAt),
  }));

  // Transform recent activities
  const transformedActivities = recentActivities.map((activity) => ({
    id: activity.id,
    action: formatActivityAction(activity.action),
    description: activity.metadataSummary || `${activity.targetType} ${activity.action}`,
    actor: activity.actor?.name || 'System',
    timestamp: activity.createdAt.toISOString(),
    relativeTime: formatRelativeTime(activity.createdAt),
  }));

  // Stats data
  const stats = {
    totalRequests: Number(totalRequests),
    inProgress: Number(processingRequests),
    completed: Number(completedRequests),
    vaultDocs: Number(recentDocuments.length),
  };

  // Welcome banner data
  const welcomeData = {
    workspace: { id: activeWorkspace?.id ?? '', name: workspaceName, slug: activeWorkspace?.slug ?? '' },
    activeRequests: Number(processingRequests),
    pendingDocs: 0,
    newReplies: 0,
    userName,
  };

  return (
    <UserLayout
      userName={userName}
      userRole=""
      workspaceName={workspaceName}
      workspaceSlug={activeWorkspace?.slug || ''}
    >
      <DashboardClient
        welcomeData={welcomeData}
        stats={stats}
        allCases={transformedRequests}
        recentDocuments={transformedDocuments}
        recentActivities={transformedActivities}
      />
    </UserLayout>
  );
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

function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
    'CREATE': 'Tạo mới',
    'UPDATE': 'Cập nhật',
    'DELETE': 'Xóa',
    'VIEW': 'Xem',
    'DOWNLOAD': 'Tải xuống',
    'UPLOAD': 'Tải lên',
    'ASSIGN': 'Phân công',
    'APPROVE': 'Phê duyệt',
    'REJECT': 'Từ chối',
    'SUBMIT': 'Gửi',
    'REPLY': 'Phản hồi',
  };
  return actionMap[action] || action;
}
