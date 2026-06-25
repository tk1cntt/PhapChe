import { UserLayout } from '@/components/layout/UserLayout';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import { isEnabled } from '@/lib/config/feature-flags';
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
    // Requests with relations - filter for processing status
    prisma.legalRequest.findMany({
      where: { workspaceId: activeWorkspaceId ?? '' },
      include: {
        assignedSpecialist: { select: { id: true, name: true } },
        assignedReviewer: { select: { id: true, name: true } },
        // Include matterTypeRef for new FK-based approach
        ...(isEnabled('DB_MIGRATION_PHASE4') ? {
          matterTypeRef: {
            select: { id: true, key: true, label_vi: true, label_en: true },
          },
        } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
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

    // Matter type display: use FK relation if available, else text field
    const matterTypeDisplay = (req as { matterTypeRef?: { label_vi?: string | null; label_en?: string | null; key?: string | null } | null }).matterTypeRef?.label_vi
      || (req as { matterTypeRef?: { label_vi?: string | null; label_en?: string | null; key?: string | null } | null }).matterTypeRef?.label_en
      || (req as { matterTypeRef?: { label_vi?: string | null; label_en?: string | null; key?: string | null } | null }).matterTypeRef?.key
      || req.matterType
      || 'Legal Request';

    return {
      id: req.id,
      code: req.code || `REQ-${req.createdAt.getFullYear()}-${String(req.id.slice(-3)).toUpperCase()}`,
      title: req.title,
      matterType: matterTypeDisplay,
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

  // Transform recent activities - parse metadata and generate detailed Vietnamese descriptions
  const transformedActivities = recentActivities.map((activity) => {
    const action = activity.action;
    const targetType = activity.targetType;
    const actorName = activity.actor?.name || 'System';
    const requestCode = activity.request?.code || activity.request?.title;
    const metadata = parseMetadata(activity.metadataSummary);

    // Determine activity type from action pattern
    let activityType: 'user' | 'workspace' | 'request' | 'document' | 'review' | 'message' | 'vault' | 'partner' | 'system' = 'system';

    // Generate action text and description based on action pattern
    let actionText = '';
    let descriptionText = '';

    // Handle action patterns like "request.updated", "document.downloaded", "partner.comment_added"
    if (action.startsWith('request.')) {
      activityType = 'request';
      const subAction = action.replace('request.', '');
      switch (subAction) {
        case 'created':
          actionText = 'Hồ sơ mới được tạo';
          descriptionText = `${actorName} đã tạo hồ sơ ${requestCode || metadata.requestTitle || ''}`.trim() + '.';
          break;
        case 'updated':
          actionText = 'Hồ sơ được cập nhật';
          descriptionText = `${actorName} đã cập nhật thông tin hồ sơ ${requestCode || metadata.requestTitle || ''}`.trim() + '.';
          break;
        case 'assigned':
          actionText = 'Hồ sơ được phân công';
          descriptionText = `${actorName} đã phân công chuyên viên xử lý hồ sơ ${requestCode || metadata.requestTitle || ''}`.trim() + '.';
          break;
        case 'approved':
          actionText = 'Hồ sơ được duyệt';
          descriptionText = `Coordinator đã xác nhận hoàn tất hồ sơ ${requestCode || metadata.requestTitle || ''}`.trim() + '.';
          break;
        case 'rejected':
          actionText = 'Hồ sơ bị từ chối';
          descriptionText = `${actorName} đã từ chối hồ sơ ${requestCode || metadata.requestTitle || ''}`.trim() + '.';
          break;
        case 'submitted':
          actionText = 'Hồ sơ được gửi';
          descriptionText = `${actorName} đã gửi hồ sơ ${requestCode || metadata.requestTitle || ''} để xem xét.`.trim();
          break;
        case 'replied':
          actionText = 'Chuyên viên đã phản hồi';
          descriptionText = `${actorName} đã phản hồi hồ sơ ${requestCode || metadata.requestTitle || ''}`.trim() + '.';
          break;
        default:
          actionText = formatActivityAction(subAction.toUpperCase());
          descriptionText = metadata.details || `${actorName} đã thao tác trên hồ sơ ${requestCode || ''}.`;
      }
    } else if (action.startsWith('document.')) {
      activityType = 'document';
      const subAction = action.replace('document.', '');
      switch (subAction) {
        case 'uploaded':
          actionText = 'Tài liệu mới được thêm vào vault';
          descriptionText = `${actorName} đã tải lên tài liệu ${metadata.documentName || ''}`.trim() + '.';
          break;
        case 'downloaded':
          actionText = 'Tài liệu được tải xuống';
          descriptionText = `${actorName} đã tải xuống tài liệu ${metadata.documentName || ''}`.trim() + '.';
          break;
        case 'deleted':
          actionText = 'Tài liệu bị xóa';
          descriptionText = `${actorName} đã xóa tài liệu khỏi vault.`;
          break;
        default:
          actionText = formatActivityAction(subAction.toUpperCase());
          descriptionText = metadata.details || `${actorName} đã thao tác trên tài liệu.`;
      }
    } else if (action.startsWith('partner.')) {
      activityType = 'partner';
      const subAction = action.replace('partner.', '');
      switch (subAction) {
        case 'comment_added':
          actionText = 'Partner đã bình luận';
          descriptionText = `${actorName} đã bình luận trên yêu cầu ${metadata.partnerName || ''}`.trim() + '.';
          break;
        case 'request_sent':
          actionText = 'Yêu cầu được gửi đến partner';
          descriptionText = `${actorName} đã gửi yêu cầu đến ${metadata.partnerName || 'partner'}.`;
          break;
        default:
          actionText = formatActivityAction(subAction.toUpperCase());
          descriptionText = metadata.details || `${actorName} đã tương tác với partner.`;
      }
    } else if (action.startsWith('workspace.')) {
      activityType = 'workspace';
      actionText = 'Workspace được cập nhật';
      descriptionText = metadata.details || 'Workspace đã được cập nhật.';
    } else if (action.startsWith('user.')) {
      activityType = 'user';
      actionText = 'Người dùng được cập nhật';
      descriptionText = metadata.details || `${actorName} đã cập nhật thông tin người dùng.`;
    } else if (action.startsWith('review.')) {
      activityType = 'review';
      const subAction = action.replace('review.', '');
      switch (subAction) {
        case 'started':
          actionText = 'Review được bắt đầu';
          descriptionText = `${actorName} đã bắt đầu review hồ sơ ${requestCode || ''}.`;
          break;
        case 'approved':
          actionText = 'Review được duyệt';
          descriptionText = `${actorName} đã duyệt review hồ sơ ${requestCode || ''}.`;
          break;
        case 'rejected':
          actionText = 'Review bị từ chối';
          descriptionText = `${actorName} đã từ chối review hồ sơ ${requestCode || ''}.`;
          break;
        default:
          actionText = formatActivityAction(subAction.toUpperCase());
          descriptionText = metadata.details || `${actorName} đã thao tác trên review.`;
      }
    } else if (action.startsWith('vault.')) {
      activityType = 'vault';
      const subAction = action.replace('vault.', '');
      switch (subAction) {
        case 'file_added':
          actionText = 'File được thêm vào vault';
          descriptionText = `${actorName} đã thêm file ${metadata.fileName || ''} vào vault.`;
          break;
        case 'folder_created':
          actionText = 'Folder được tạo trong vault';
          descriptionText = `${actorName} đã tạo folder ${metadata.folderName || ''}.`;
          break;
        default:
          actionText = formatActivityAction(subAction.toUpperCase());
          descriptionText = metadata.details || `${actorName} đã thao tác trên vault.`;
      }
    } else if (action.startsWith('message.')) {
      activityType = 'message';
      const subAction = action.replace('message.', '');
      switch (subAction) {
        case 'sent':
          actionText = 'Tin nhắn được gửi';
          descriptionText = `${actorName} đã gửi tin nhắn mới.`;
          break;
        case 'received':
          actionText = 'Tin nhắn mới';
          descriptionText = `${actorName} đã nhận được tin nhắn.`;
          break;
        default:
          actionText = formatActivityAction(subAction.toUpperCase());
          descriptionText = metadata.details || `${actorName} đã thao tác trên tin nhắn.`;
      }
    } else if (action.startsWith('draft.')) {
      // Handle draft actions - treat as request type
      activityType = 'request';
      const subAction = action.replace('draft.', '');
      switch (subAction) {
        case 'created':
          actionText = 'Bản nháp được tạo';
          descriptionText = `${actorName} đã tạo bản nháp yêu cầu pháp lý mới.`;
          break;
        case 'updated':
          actionText = 'Bản nháp được cập nhật';
          descriptionText = `${actorName} đã cập nhật bản nháp yêu cầu.`;
          break;
        case 'submitted':
          actionText = 'Bản nháp được gửi';
          descriptionText = `${actorName} đã gửi bản nháp để xem xét.`;
          break;
        case 'save':
          actionText = 'Bản nháp được lưu';
          descriptionText = `${actorName} đã lưu bản nháp yêu cầu pháp lý.`;
          break;
        case 'deleted':
          actionText = 'Bản nháp bị xóa';
          descriptionText = `${actorName} đã xóa bản nháp.`;
          break;
        default:
          actionText = `Bản nháp: ${subAction}`;
          descriptionText = metadata.details || `${actorName} đã thao tác trên bản nháp.`;
      }
    } else {
      // Fallback for simple actions like CREATE, UPDATE, etc.
      activityType = 'system';
      actionText = formatActivityAction(action);
      descriptionText = metadata.details || `${targetType} đã được ${action.toLowerCase()}.`;
    }

    return {
      id: activity.id,
      type: activityType,
      action: actionText,
      description: descriptionText,
      actor: actorName,
      timestamp: activity.createdAt.toISOString(),
      relativeTime: formatRelativeTime(activity.createdAt),
    };
  });

  // Helper function to parse metadata JSON
  function parseMetadata(summary: string | null): Record<string, string | null> {
    if (!summary) return {};
    try {
      // Handle both JSON string and already-parsed object
      if (typeof summary === 'string') {
        // Try to parse if it's a JSON string
        if (summary.startsWith('{')) {
          return JSON.parse(summary);
        }
        // If it's a plain text details field
        return { details: summary };
      }
      return summary;
    } catch {
      // If parsing fails, treat as plain text
      return { details: summary };
    }
  }

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
