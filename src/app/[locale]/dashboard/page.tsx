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

  // Transform recent activities - generate detailed Vietnamese descriptions
  const transformedActivities = recentActivities.map((activity) => {
    const action = activity.action;
    const targetType = activity.targetType;
    const actorName = activity.actor?.name || 'System';
    const requestCode = activity.request?.code;

    // Generate detailed description based on action and target
    let actionText = '';
    let descriptionText = '';

    if (targetType === 'Request' || targetType === 'LegalRequest') {
      if (action === 'CREATE') {
        actionText = 'Hồ sơ mới được tạo';
        descriptionText = requestCode
          ? `${actorName} đã tạo hồ sơ ${requestCode}.`
          : `${actorName} đã tạo một hồ sơ pháp lý mới.`;
      } else if (action === 'UPDATE') {
        actionText = 'Hồ sơ được cập nhật';
        descriptionText = requestCode
          ? `${actorName} đã cập nhật thông tin hồ sơ ${requestCode}.`
          : `${actorName} đã cập nhật thông tin hồ sơ.`;
      } else if (action === 'ASSIGN') {
        actionText = 'Hồ sơ được phân công';
        descriptionText = requestCode
          ? `${actorName} đã phân công chuyên viên xử lý hồ sơ ${requestCode}.`
          : `${actorName} đã phân công chuyên viên xử lý.`;
      } else if (action === 'APPROVE') {
        actionText = 'Hồ sơ được duyệt';
        descriptionText = requestCode
          ? `Coordinator đã xác nhận hoàn tất hồ sơ ${requestCode}.`
          : `Coordinator đã duyệt hồ sơ.`;
      } else if (action === 'REJECT') {
        actionText = 'Hồ sơ bị từ chối';
        descriptionText = requestCode
          ? `${actorName} đã từ chối hồ sơ ${requestCode}.`
          : `${actorName} đã từ chối hồ sơ.`;
      } else if (action === 'SUBMIT') {
        actionText = 'Hồ sơ được gửi';
        descriptionText = requestCode
          ? `${actorName} đã gửi hồ sơ ${requestCode} để xem xét.`
          : `${actorName} đã gửi hồ sơ để xem xét.`;
      } else if (action === 'REPLY') {
        actionText = 'Chuyên viên đã phản hồi';
        descriptionText = requestCode
          ? `${actorName} đã phản hồi hồ sơ ${requestCode}.`
          : `${actorName} đã gửi phản hồi.`;
      } else {
        actionText = formatActivityAction(action);
        descriptionText = activity.metadataSummary || `${actorName} đã thao tác trên hồ sơ.`;
      }
    } else if (targetType === 'Document' || targetType === 'VaultFile') {
      if (action === 'UPLOAD') {
        actionText = 'Tài liệu mới được thêm vào vault';
        descriptionText = `${actorName} đã tải lên tài liệu mới.`;
      } else if (action === 'DOWNLOAD') {
        actionText = 'Tài liệu được tải xuống';
        descriptionText = `${actorName} đã tải xuống tài liệu.`;
      } else if (action === 'DELETE') {
        actionText = 'Tài liệu bị xóa';
        descriptionText = `${actorName} đã xóa tài liệu khỏi vault.`;
      } else {
        actionText = formatActivityAction(action);
        descriptionText = activity.metadataSummary || `${actorName} đã thao tác trên tài liệu.`;
      }
    } else if (targetType === 'Workspace') {
      if (action === 'VIEW') {
        actionText = 'Workspace scope được kiểm tra';
        descriptionText = 'Hệ thống xác nhận quyền truy cập workspace.';
      } else {
        actionText = formatActivityAction(action);
        descriptionText = activity.metadataSummary || `${actorName} đã cập nhật workspace.`;
      }
    } else {
      actionText = formatActivityAction(action);
      descriptionText = activity.metadataSummary || `${targetType} đã được ${action.toLowerCase()}.`;
    }

    return {
      id: activity.id,
      action: actionText,
      description: descriptionText,
      actor: actorName,
      timestamp: activity.createdAt.toISOString(),
      relativeTime: formatRelativeTime(activity.createdAt),
    };
  });

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
