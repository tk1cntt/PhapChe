import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import { isEnabled } from '@/lib/config/feature-flags';
import UserLayout from '@/components/layout/UserLayout';
import StatCard from '@/components/my-cases/StatCard';
import MessagesClient from '@/components/messages/MessagesClient';
import '@/components/messages/messages.css';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) return 'vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}p`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;
  const t = await getTranslations('UserMessages');

  // Fetch user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      memberships: {
        where: { workspaceId: activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true, slug: true } } },
      },
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';

  // Fetch message stats
  const [totalConversations, unreadMessages, recentThreads] = await Promise.all([
    prisma.message.count({
      where: { workspaceId: activeWorkspaceId ?? '' },
    }),
    prisma.message.count({
      where: {
        workspaceId: activeWorkspaceId ?? '',
        recipientId: userId,
        isRead: false,
      },
    }),
    // Fetch requests with recent activity (these are the "threads")
    prisma.legalRequest.findMany({
      where: {
        workspaceId: activeWorkspaceId ?? '',
        status: { in: ['in_progress', 'pending_review', 'revision_required', 'assigned', 'triage'] },
      },
      include: {
        createdBy: { select: { name: true } },
        assignedSpecialist: { select: { name: true } },
        // Include matterTypeRef for new FK-based approach
        ...(isEnabled('DB_MIGRATION_PHASE4') ? {
          matterTypeRef: {
            select: { id: true, key: true, label_vi: true, label_en: true },
          },
        } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
  ]);

  // Fetch messages for all threads from DB
  const threadIds = recentThreads.map((req) => req.id);

  const allMessages = await prisma.message.findMany({
    where: {
      legalRequestId: { in: threadIds },
      workspaceId: activeWorkspaceId ?? '',
    },
    orderBy: { createdAt: 'asc' },
  });

  // Fetch sender names for all unique sender IDs
  const senderIds = [...new Set(allMessages.map((m) => m.senderId))];
  const senders = await prisma.user.findMany({
    where: { id: { in: senderIds } },
    select: { id: true, name: true },
  });
  const senderMap = new Map(senders.map((u) => [u.id, u.name]));

  // Group messages by thread
  const dbMessages: Record<string, any[]> = {};
  threadIds.forEach((id) => {
    dbMessages[id] = [];
  });

  allMessages.forEach((msg) => {
    const messageData = {
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: senderMap.get(msg.senderId) || msg.senderId,
      isOutgoing: msg.senderId === userId,
      createdAt: msg.createdAt.toISOString(),
    };
    if (msg.legalRequestId && dbMessages[msg.legalRequestId]) {
      dbMessages[msg.legalRequestId].push(messageData);
    }
  });

  // Avatar colors
  const colors = ['blue', 'green', 'orange', 'purple', 'red'] as const;

  // Transform threads from DB
  const dbThreads = recentThreads.map((req, idx) => {
    const specialistName = req.assignedSpecialist?.name ?? t('specialist');
    const initials = req.assignedSpecialist?.name
      ? getInitials(req.assignedSpecialist.name)
      : t('specialistInitials', { defaultValue: 'CS' });

    return {
      id: req.id,
      requestId: req.id,
      requestCode: req.code || `REQ-${req.id.substring(0, 8)}`,
      title: req.title,
      specialistName,
      specialistRole: 'Specialist',
      specialistStatus: 'online' as const,
      statusBadge: (req.status === 'pending_review'
        ? 'review'
        : req.status === 'revision_required'
        ? 'pending'
        : 'pending') as 'pending' | 'review',
      preview: t('clickToViewMessages'),
      senderInitials: initials,
      senderColor: colors[idx % colors.length],
      timestamp: formatRelativeTime(req.updatedAt),
      isRead: true,
      isActive: idx === 0,
    };
  });

  // Build case info map
  const dbCaseInfo: Record<string, any> = {};
  recentThreads.forEach((req) => {
    const slaRemaining = req.slaDeadline
      ? `${Math.max(0, Math.floor((req.slaDeadline.getTime() - Date.now()) / 3600000))}h`
      : t('noSla');

    // Matter type display: use FK relation if available, else text field
    const matterTypeDisplay = (req as { matterTypeRef?: { label_vi?: string | null; label_en?: string | null; key?: string | null } | null }).matterTypeRef?.label_vi
      || (req as { matterTypeRef?: { label_vi?: string | null; label_en?: string | null; key?: string | null } | null }).matterTypeRef?.label_en
      || (req as { matterTypeRef?: { label_vi?: string | null; label_en?: string | null; key?: string | null } | null }).matterTypeRef?.key
      || req.matterType
      || 'Legal Request';

    dbCaseInfo[req.id] = {
      caseCode: `${req.code || 'REQ'} · ${matterTypeDisplay}`,
      slaRemaining,
      slaDetail: req.slaDeadline
        ? `${t('slaDeadline')}: ${req.slaDeadline.toLocaleDateString('vi-VN')}`
        : t('noSlaSet'),
      documents: t('noDocuments'),
      participants: req.assignedSpecialist?.name || t('notAssigned'),
      matterType: matterTypeDisplay,
      createdAt: req.createdAt.toLocaleDateString('vi-VN'),
      status: req.status,
      assignedSpecialist: req.assignedSpecialist?.name || t('notAssigned'),
    };
  });

  const openThreads = Math.min(3, Math.max(1, Math.floor(totalConversations / 2)));

  return (
    <UserLayout userName={userName} userRole={roles[0] ?? 'customer'} workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
      <div className="page-wrapper">
        <div className="page-header">
          <div>
            <h1>{t('pageTitle')}</h1>
            <p className="subtitle">{t('pageDesc')}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats">
          <StatCard
            titleKey="statConversations"
            value={Number(totalConversations)}
            description={t('statThreadsOpen', { count: openThreads })}
            icon="file"
            variant="blue"
          />
          <StatCard
            titleKey="statUnread"
            value={Number(unreadMessages)}
            descriptionKey="statUnreadDesc"
            icon="clock"
            variant="orange"
          />
          <StatCard
            titleKey="statReplied"
            value={Number(recentThreads.length)}
            descriptionKey="statRepliedDesc"
            icon="check"
            variant="green"
          />
        </div>

        {/* Messages Container - now with initial messages from server */}
        <MessagesClient
          initialThreads={dbThreads}
          initialMessages={dbMessages}
          initialCaseInfo={dbCaseInfo}
          workspaceSlug={workspaceSlug}
          currentUserId={userId}
          pollInterval={10000}
        />
      </div>
    </UserLayout>
  );
}
