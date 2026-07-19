import { UserLayout } from '@/components/layout/UserLayout';
import { requireAppSession } from '@/lib/security/session';
import { getWorkspaceRequestWhere } from '@/lib/security/request-filter';
import { prisma } from '@/lib/prisma';
import { isEnabled } from '@/lib/config/feature-flags';
import { getTranslations } from 'next-intl/server';
import { getLocaleDateCode } from '@/lib/i18n';
import DashboardClient from '@/components/dashboard/DashboardClient';

function formatRelativeTime(date: Date, t: (key: string, values?: Record<string, unknown>) => string): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) return t('justNow');
  if (diff < 3600000) return t('minutesAgo', { n: Math.floor(diff / 60000) });
  if (diff < 86400000) return t('hoursAgo', { n: Math.floor(diff / 3600000) });
  return t('daysAgo', { n: Math.floor(diff / 86400000) });
}

function resolveStatusLabel(key: string, t: (k: string) => string): string {
  const lookup: Record<string, string> = {
    draft_intake: 'draft_intake',
    triage: 'triage',
    assigned: 'assigned',
    in_progress: 'in_progress',
    pending_review: 'pending_review',
    revision_required: 'revision_required',
    approved: 'approved',
    delivered: 'delivered',
    closed: 'closed',
    cancelled: 'cancelled',
  };
  const i18nKey = lookup[key];
  return i18nKey ? t(i18nKey) : key;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId } = session;
  const wsId = activeWorkspaceId ?? '';

  // Build where clauses with role filter
  const processingStatusExtra = { status: { in: ['in_progress', 'pending_review', 'triage', 'assigned'] } };
  const completedStatusExtra = { status: { in: ['approved', 'delivered', 'closed'] } };

  // Fetch all data needed for dashboard in parallel
  const [
    user,
    activeWorkspace,
    baseWhere,
    processingWhere,
    completedWhere,
    requestsWhere,
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
    // Role-filtered where clauses
    getWorkspaceRequestWhere(wsId, userId),
    getWorkspaceRequestWhere(wsId, userId, processingStatusExtra),
    getWorkspaceRequestWhere(wsId, userId, completedStatusExtra),
    getWorkspaceRequestWhere(wsId, userId),
    // Requests with relations - role filtered
    (async () => {
      const w = await getWorkspaceRequestWhere(wsId, userId);
      return prisma.legalRequest.findMany({
        where: w as any,
        include: {
          assignedSpecialist: { select: { id: true, name: true } },
          assignedReviewer: { select: { id: true, name: true } },
          ...(isEnabled('DB_MIGRATION_PHASE4') ? {
            matterTypeRef: {
              select: { id: true, key: true },
            },
          } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });
    })(),
    // Recent vault documents (all workspace files, not just user's own)
    prisma.vaultFile.findMany({
      where: { workspaceId: wsId },
      include: {
        actor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Recent audit events
    prisma.auditEvent.findMany({
      where: { workspaceId: wsId },
      include: {
        actor: { select: { id: true, name: true } },
        request: { select: { code: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  // Run count queries with role filter
  const totalRequests = await prisma.legalRequest.count({ where: baseWhere as any });
  const processingRequests = await prisma.legalRequest.count({ where: processingWhere as any });
  const completedRequests = await prisma.legalRequest.count({ where: completedWhere as any });

  const userName = user?.name ?? user?.email ?? 'User';
  const workspaceName = activeWorkspace?.name ?? 'Workspace';

  const tMatter = await getTranslations('MatterTypes');
  const tDashboard = await getTranslations('Dashboard');
  const tReqStatus = await getTranslations('RequestStatus');
  const tTime = (key: string, values?: Record<string, unknown>) => tDashboard(`activity.time.${key}` as any, values as any);
  const tAction = (key: string) => tDashboard(`activity.actions.${key}` as any);
  const tDesc = (key: string, values?: Record<string, unknown>) => tDashboard(`activity.descriptions.${key}` as any, values as any);

  // Transform requests for CasesTable
  const transformedRequests = requests.map((req) => {
    const statusVariant = getStatusVariant(req.status);
    const statusText = resolveStatusLabel(req.status, tReqStatus);

    // Matter type display: use FK key with translation lookup
    const mtKey = (req as { matterTypeRef?: { key?: string | null } | null }).matterTypeRef?.key;
    const matterTypeDisplay = mtKey ? tMatter(mtKey as any) : (req.matterType || tDashboard('fallbackMatterType'));

    return {
      id: req.id,
      code: req.code || `REQ-${req.createdAt.getFullYear()}-${String(req.id.slice(-3)).toUpperCase()}`,
      title: req.title,
      matterType: matterTypeDisplay,
      status: req.status,
      statusVariant,
      statusText,
      assignee: req.assignedSpecialist?.name || req.assignedReviewer?.name || tDashboard('unassigned'),
      assigneeRole: req.assignedSpecialist ? tDashboard('roleSpecialist') : req.assignedReviewer ? tDashboard('roleReviewer') : '—',
      updatedAt: req.updatedAt.toISOString(),
      formattedDate: req.updatedAt.toLocaleDateString(getLocaleDateCode(locale), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
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
    relativeTime: formatRelativeTime(doc.createdAt, tTime),
  }));

  // Transform recent activities - parse metadata and generate detailed Vietnamese descriptions
  const transformedActivities = recentActivities.map((activity) => {
    const action = activity.action;
    const targetType = activity.targetType;
    const actorName = activity.actor?.name || 'System';
    const actorId = activity.actor?.id || null;
    const actorDisplay = (actorId && actorId === userId) ? tDashboard('actorSelf') : actorName;
    const requestCode = activity.request?.code || activity.request?.title;
    const metadata = parseMetadata(activity.metadataSummary);

    // Determine activity type from action pattern
    let activityType: 'user' | 'workspace' | 'request' | 'document' | 'review' | 'message' | 'vault' | 'partner' | 'system' = 'system';

    // Generate action text and description based on action pattern
    let actionText = '';
    let descriptionText = '';

    const codeOrTitle = requestCode || metadata.requestTitle || '';
    const docName = metadata.documentName || '';
    const partnerName = metadata.partnerName || 'partner';
    const fileName = metadata.fileName || '';
    const folderName = metadata.folderName || '';

    // Parse status change metadata for status_changed action
    const parseStatus = () => {
      const summary = activity.metadataSummary;
      if (!summary) return { from: '?', to: '?' };
      const parts = summary.split('->').map(s => s.trim());
      return {
        from: resolveStatusLabel(parts[0], tReqStatus),
        to: resolveStatusLabel(parts[1], tReqStatus),
      };
    };

    // Handle action patterns like "request.updated", "document.downloaded", "partner.comment_added"
    if (action.startsWith('request.')) {
      activityType = 'request';
      const subAction = action.replace('request.', '');
      const actionKey = `request.${subAction}`;
      switch (subAction) {
        case 'created':
        case 'updated':
        case 'assigned':
        case 'approved':
        case 'rejected':
        case 'submitted':
        case 'replied':
          actionText = tAction(actionKey);
          descriptionText = tDesc(actionKey, { actor: actorDisplay, code: codeOrTitle });
          break;
        case 'status_changed': {
          actionText = tAction(actionKey);
          const sc = parseStatus();
          descriptionText = tDesc(actionKey, { actor: actorDisplay, code: codeOrTitle, from: sc.from, to: sc.to });
          break;
        }
        default:
          actionText = tAction(actionKey);
          descriptionText = metadata.details || tDesc('request.fallback', { actor: actorDisplay, code: codeOrTitle });
      }
    } else if (action.startsWith('document.')) {
      activityType = 'document';
      const subAction = action.replace('document.', '');
      const actionKey = `document.${subAction}`;
      switch (subAction) {
        case 'uploaded':
        case 'downloaded':
          actionText = tAction(actionKey);
          descriptionText = tDesc(actionKey, { actor: actorDisplay, name: docName });
          break;
        case 'deleted':
          actionText = tAction(actionKey);
          descriptionText = tDesc(actionKey, { actor: actorDisplay });
          break;
        default:
          actionText = tAction(actionKey);
          descriptionText = metadata.details || tDesc('document.fallback', { actor: actorDisplay });
      }
    } else if (action.startsWith('partner.')) {
      activityType = 'partner';
      const subAction = action.replace('partner.', '');
      const actionKey = `partner.${subAction}`;
      switch (subAction) {
        case 'comment_added':
        case 'request_sent':
          actionText = tAction(actionKey);
          descriptionText = tDesc(actionKey, { actor: actorDisplay, name: partnerName });
          break;
        default:
          actionText = tAction(actionKey);
          descriptionText = metadata.details || tDesc('partner.fallback', { actor: actorDisplay });
      }
    } else if (action.startsWith('workspace.')) {
      activityType = 'workspace';
      actionText = tAction('workspace.updated');
      descriptionText = metadata.details || tDesc('workspace.updated');
    } else if (action.startsWith('user.')) {
      activityType = 'user';
      actionText = tAction('user.updated');
      descriptionText = metadata.details || tDesc('user.updated', { actor: actorDisplay });
    } else if (action.startsWith('review.')) {
      activityType = 'review';
      const subAction = action.replace('review.', '');
      const actionKey = `review.${subAction}`;
      switch (subAction) {
        case 'started':
        case 'approved':
        case 'rejected':
          actionText = tAction(actionKey);
          descriptionText = tDesc(actionKey, { actor: actorDisplay, code: codeOrTitle });
          break;
        default:
          actionText = tAction(actionKey);
          descriptionText = metadata.details || tDesc('review.fallback', { actor: actorDisplay });
      }
    } else if (action.startsWith('vault.')) {
      activityType = 'vault';
      const subAction = action.replace('vault.', '');
      const actionKey = `vault.${subAction}`;
      switch (subAction) {
        case 'file_added':
          actionText = tAction(actionKey);
          descriptionText = tDesc(actionKey, { actor: actorDisplay, name: fileName });
          break;
        case 'folder_created':
          actionText = tAction(actionKey);
          descriptionText = tDesc(actionKey, { actor: actorDisplay, name: folderName });
          break;
        default:
          actionText = tAction(actionKey);
          descriptionText = metadata.details || tDesc('vault.fallback', { actor: actorDisplay });
      }
    } else if (action.startsWith('message.')) {
      activityType = 'message';
      const subAction = action.replace('message.', '');
      const actionKey = `message.${subAction}`;
      switch (subAction) {
        case 'sent':
        case 'received':
          actionText = tAction(actionKey);
          descriptionText = tDesc(actionKey, { actor: actorDisplay });
          break;
        default:
          actionText = tAction(actionKey);
          descriptionText = metadata.details || tDesc('message.fallback', { actor: actorDisplay });
      }
    } else if (action.startsWith('intake.')) {
      activityType = 'request';
      const subAction = action.replace('intake.', '');
      const actionKey = `intake.${subAction}`;
      switch (subAction) {
        case 'submitted':
          actionText = tAction(actionKey);
          descriptionText = tDesc(actionKey, { actor: actorDisplay, code: codeOrTitle });
          break;
        default:
          actionText = tAction(actionKey);
          descriptionText = metadata.details || tDesc('intake.fallback', { actor: actorDisplay });
      }
    } else if (action === 'STATUS_CHANGED' || action === 'request.status_changed') {
      activityType = 'request';
      const sc = parseStatus();
      actionText = tAction('request.status_changed');
      descriptionText = tDesc('request.status_changed', { actor: actorDisplay, code: codeOrTitle, from: sc.from, to: sc.to });
    } else {
      activityType = 'system';
      actionText = tDashboard('activity.fallbackAction');
      descriptionText = metadata.details || tDesc('generic', { actor: actorDisplay, action });
    }

    return {
      id: activity.id,
      type: activityType,
      action: actionText,
      description: descriptionText,
      actor: actorName,
      timestamp: activity.createdAt.toISOString(),
      relativeTime: formatRelativeTime(activity.createdAt, tTime),
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

