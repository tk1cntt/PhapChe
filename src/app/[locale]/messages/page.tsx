import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import { formatDate } from '@/lib/i18n/date-format';
import { isEnabled } from '@/lib/config/feature-flags';
import UserLayout from '@/components/layout/UserLayout';
import StatCard from '@/components/my-cases/StatCard';
import MessagesClient from '@/components/messages/MessagesClient';
import '@/styles/pages/messages.css';

export const dynamic = 'force-dynamic';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatRelativeTime(date: Date, t: (key: string, params?: Record<string, string | number>) => string): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) return t('justNow');
  if (diff < 3600000) return t('minutesAgo', { count: Math.floor(diff / 60000) });
  if (diff < 86400000) return t('hoursAgo', { count: Math.floor(diff / 3600000) });
  return t('daysAgo', { count: Math.floor(diff / 86400000) });
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
  const tMatter = await getTranslations('MatterTypes');

  try {
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

    // Determine role-based thread filter
    const isSuperAdmin = roles.includes('super_admin');
    const isSpecialist = roles.includes('specialist');
    const isCustomer = roles.includes('customer') || (!isSuperAdmin && !isSpecialist);

    // Build thread filter — customers only see their own requests
    const threadWhere: Record<string, unknown> = {
      workspaceId: activeWorkspaceId ?? '',
      status: { in: ['in_progress', 'pending_review', 'revision_required', 'assigned', 'triage'] },
    };
    if (isCustomer) {
      threadWhere.createdById = userId;
    }

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
        where: threadWhere,
        include: {
          createdBy: { select: { name: true } },
          assignedSpecialist: { select: { name: true } },
          // Include matterTypeRef for new FK-based approach
          ...(isEnabled('DB_MIGRATION_PHASE4') ? {
            matterTypeRef: {
              select: { id: true, key: true },
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

    // Transform threads from DB — preview = the newest message in the thread,
    // unread state = the newest incoming message is unread. This is what makes
    // the seeded conversations visible in the list ("kết quả thực tế").
    const dbThreads = recentThreads.map((req, idx) => {
      const specialistName = req.assignedSpecialist?.name ?? t('specialist');
      const initials = req.assignedSpecialist?.name
        ? getInitials(req.assignedSpecialist.name)
        : t('specialistInitials', { defaultValue: 'CS' });

      const threadMsgs = dbMessages[req.id] ?? [];
      const newest = threadMsgs[threadMsgs.length - 1];
      const newestDb = allMessages
        .filter((m) => m.legalRequestId === req.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .pop();

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
        preview: newest
          ? newest.content
          : t('clickToViewMessages'),
        senderInitials: initials,
        senderColor: colors[idx % colors.length],
        timestamp: newestDb
          ? formatRelativeTime(newestDb.createdAt, t)
          : formatRelativeTime(req.updatedAt, t),
        isRead: newestDb ? newestDb.isRead : true,
        isActive: idx === 0,
      };
    });

    // Build case info map
    const dbCaseInfo: Record<string, any> = {};
    recentThreads.forEach((req) => {
      const slaRemaining = req.slaDeadline
        ? `${Math.max(0, Math.floor((req.slaDeadline.getTime() - Date.now()) / 3600000))}h`
        : t('noSla');

      // Matter type display: use FK key with translation lookup
      const mtKey = (req as { matterTypeRef?: { key?: string | null } | null }).matterTypeRef?.key;
      const matterTypeDisplay = mtKey ? tMatter(mtKey as any) : (req.matterType || 'Legal Request');

      dbCaseInfo[req.id] = {
        caseCode: `${req.code || 'REQ'} · ${matterTypeDisplay}`,
        slaRemaining,
        slaDetail: req.slaDeadline
          ? `${t('slaDeadline')}: ${formatDate(req.slaDeadline, locale)}`
          : t('noSlaSet'),
        documents: t('noDocuments'),
        participants: req.assignedSpecialist?.name || t('notAssigned'),
        matterType: matterTypeDisplay,
        createdAt: formatDate(req.createdAt, locale),
        status: req.status,
        assignedSpecialist: req.assignedSpecialist?.name || t('notAssigned'),
      };
    });

    const openThreads = Math.min(3, Math.max(1, Math.floor(totalConversations / 2)));

    return (
      <UserLayout userName={userName} userRole={roles[0] ?? 'customer'} workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
        <div className="page-wrapper messages-page-wrapper">
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
  } catch (error) {
    console.error('Messages page data fetch failed:', error);
    return (
      <UserLayout userName="User" userRole={roles[0] ?? 'customer'} workspaceName="Workspace" workspaceSlug="workspace">
        <div className="page-wrapper messages-page-wrapper">
          <div className="page-header">
            <div>
              <h1>{t('pageTitle')}</h1>
              <p className="subtitle">{t('pageDesc')}</p>
            </div>
          </div>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <h2>{t('errorLoadingMessages')}</h2>
              <p className="subtitle">{t('tryAgainLater')}</p>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }
}
