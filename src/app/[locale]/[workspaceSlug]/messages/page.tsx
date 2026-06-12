import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import UserLayout from '../../customer/components/UserLayout';
import { StatCard } from '../../customer/components/StatCard';
import { FloatingChatButton } from '../../customer/components/FloatingChatButton';
import MessagesContainer from './components/MessagesContainer';
import './messages.css';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default async function MessagesPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const workspaceSlug = params.workspaceSlug;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId } = session;
  const t = await getTranslations('UserMessages');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      memberships: {
        where: { workspaceId: activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true, slug: true } } }
      }
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';

  // Fetch message stats from database
  const [
    totalConversations,
    unreadMessages,
    repliedMessages,
    attachments,
    recentThreads,
  ] = await Promise.all([
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
    prisma.message.count({
      where: {
        workspaceId: activeWorkspaceId ?? '',
        senderId: userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.vaultFile.count({
      where: { workspaceId: activeWorkspaceId ?? '' },
    }),
    // Fetch recent threads (requests with messages)
    prisma.legalRequest.findMany({
      where: {
        workspaceId: activeWorkspaceId ?? '',
        status: { in: ['in_progress', 'pending_review', 'revision_required'] },
      },
      include: {
        createdBy: { select: { name: true } },
        assignedSpecialist: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ]);

  // Fetch messages for this workspace (Message model doesn't have requestId or sender relation)
  const allMessages = await prisma.message.findMany({
    where: { workspaceId: activeWorkspaceId ?? '' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Transform threads from DB to MessagesContainer format
  const colors = ['blue', 'green', 'orange', 'purple', 'red'] as const;
  const dbThreads = recentThreads.map((req, idx) => {
    const specialistName = req.assignedSpecialist?.name ?? t('specialist');
    const initials = req.assignedSpecialist?.name ? getInitials(req.assignedSpecialist.name) : t('specialistInitials');
    const preview = t('clickToViewMessages');
    const timeDiff = Date.now() - req.updatedAt.getTime();
    const time = timeDiff < 60000 ? t('justNow') : timeDiff < 3600000 ? `${Math.floor(timeDiff/60000)}p` : `${Math.floor(timeDiff/3600000)}h`;
    const unreadCount = allMessages.filter(m => !m.isRead && m.recipientId === userId && m.senderId !== userId).length;

    return {
      id: req.id,
      requestId: req.id,
      requestCode: req.code || `REQ-${req.id.substring(0, 8)}`,
      title: req.title,
      specialistName,
      specialistRole: 'Specialist',
      specialistStatus: 'online' as const,
      statusBadge: (req.status === 'pending_review' ? 'review' : 'pending') as 'pending' | 'review',
      preview,
      senderInitials: initials,
      senderColor: colors[idx % colors.length],
      timestamp: time,
      isRead: unreadCount === 0,
      isActive: idx === 0,
    };
  });

  // Group messages by thread - simplified since Message model doesn't have requestId
  const dbMessages: Record<string, any[]> = {};

  // Build case info from DB
  const dbCaseInfo: Record<string, any> = {};
  recentThreads.forEach(req => {
    const slaRemaining = req.slaDeadline
      ? `${Math.max(0, Math.floor((req.slaDeadline.getTime() - Date.now()) / 3600000))} giờ`
      : 'Không có SLA';
    dbCaseInfo[req.id] = {
      caseCode: `${req.code || 'REQ'} · ${req.matterType}`,
      slaRemaining,
      slaDetail: req.slaDeadline ? `cần phản hồi trước ${req.slaDeadline.toLocaleString('vi-VN')}` : 'Chưa thiết lập',
      documents: '',
      participants: `${userName}`,
    };
  });

  const openThreads = Math.min(3, Math.max(1, Math.floor(totalConversations / 2)));

  return (
    <UserLayout userName={userName} userRole="customer" workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
      <div className="page-header">
        <div>
          <h1>{t('pageTitle')}</h1>
          <p className="subtitle">{t('pageDesc')}</p>
        </div>
      </div>

      <div className="stats">
        <StatCard titleKey="statConversations" value={totalConversations} description={t('statThreadsOpen', { count: openThreads })} icon="file" variant="blue" />
        <StatCard titleKey="statUnread" value={unreadMessages} descriptionKey="statUnreadDesc" icon="clock" variant="orange" />
        <StatCard titleKey="statReplied" value={repliedMessages} descriptionKey="statRepliedDesc" icon="check" variant="green" />
        <StatCard titleKey="statAttachments" value={attachments} descriptionKey="statAttachmentsDesc" icon="folder" variant="purple" />
      </div>

      <MessagesContainer
        initialThreads={dbThreads}
        initialMessages={dbMessages}
        initialCaseInfo={dbCaseInfo}
        workspaceSlug={workspaceSlug}
      />

      <FloatingChatButton notificationCount={unreadMessages} notificationText={t('pageTitle')} />
    </UserLayout>
  );
}
