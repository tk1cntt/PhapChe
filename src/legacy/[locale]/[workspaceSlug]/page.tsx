import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import { UserLayout } from '@/components/layout/UserLayout';
import { DashboardClient } from './DashboardClient';
import '@/app/[locale]/customer/components/dashboard.css';

export default async function UserDashboardPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const session = await requireAppSession();
  const { userId, activeWorkspaceId } = session;
  const { workspaceSlug } = params;
  const t = await getTranslations('UserDashboard');
  const tStatus = await getTranslations('RequestStatus');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      memberships: {
        where: { workspaceId: activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true, slug: true, id: true } }, role: true },
      },
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';
  const wsId = workspace?.id ?? activeWorkspaceId ?? '';

  // Fetch all data from DB
  const [
    totalRequests,
    processingRequests,
    completedRequests,
    vaultFileCount,
    recentRequests,
    vaultFiles,
    auditEvents,
    unreadMessages,
  ] = await Promise.all([
    prisma.legalRequest.count({ where: { workspaceId: wsId } }),
    prisma.legalRequest.count({
      where: { workspaceId: wsId, status: { in: ['in_progress', 'pending_review', 'revision_required'] } },
    }),
    prisma.legalRequest.count({
      where: { workspaceId: wsId, status: { in: ['delivered', 'closed'] } },
    }),
    prisma.vaultFile.count({ where: { workspaceId: wsId } }),
    prisma.legalRequest.findMany({
      where: { workspaceId: wsId },
      include: {
        assignedSpecialist: { select: { name: true } },
        assignedReviewer: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.vaultFile.findMany({
      where: { workspaceId: wsId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.auditEvent.findMany({
      where: { workspaceId: wsId },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.message.count({
      where: { workspaceId: wsId, recipientId: userId, isRead: false },
    }),
  ]);

  // Build stats
  const stats = { total: totalRequests, processing: processingRequests, completed: completedRequests, vaultFiles: vaultFileCount };

  // Build case list for "Processing Cases" panel
  const processingCases = recentRequests
    .filter((r) => ['in_progress', 'pending_review', 'revision_required'].includes(r.status))
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      code: r.code ?? `REQ-${r.id.slice(0, 8).toUpperCase()}`,
      title: r.title ?? r.matterType ?? 'Legal Request',
      status: r.status,
      statusLabel: tStatus(r.status),
      assignee: r.assignedSpecialist?.name ?? r.assignedReviewer?.name ?? '—',
      assigneeRole: r.assignedSpecialist ? 'Specialist' : r.assignedReviewer ? 'Reviewer' : '',
    }));

  // Build deadline/SLA items from requests with deadlines
  const deadlineItems = recentRequests
    .filter((r) => r.slaDeadline)
    .slice(0, 3)
    .map((r) => {
      const deadline = new Date(r.slaDeadline!);
      const now = new Date();
      const hoursLeft = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
      const isOverdue = hoursLeft < 0;
      const progress = isOverdue ? 100 : Math.max(0, Math.min(100, 100 - (hoursLeft / 48) * 100));
      const variant = isOverdue ? 'danger' : hoursLeft < 6 ? 'warn' : 'ok';
      return {
        title: r.title ?? r.matterType ?? 'Legal Request',
        timeLeft: isOverdue ? `Quá hạn ${Math.abs(hoursLeft)}h` : `Còn ${hoursLeft}h`,
        progress,
        variant: variant as 'ok' | 'warn' | 'danger',
        note: isOverdue
          ? 'Hồ sơ cần được cập nhật để tiếp tục xử lý.'
          : hoursLeft < 6
            ? 'Cần phản hồi sớm để đảm bảo SLA.'
            : 'Tài liệu đã sẵn sàng để xem.',
      };
    });

  // Build vault file items
  const documentItems = vaultFiles.map((f) => {
    const ext = f.filename?.split('.').pop()?.toUpperCase() ?? 'FILE';
    const size = f.size ? `${(f.size / 1024).toFixed(0)} KB` : '—';
    const dateStr = f.createdAt
      ? f.createdAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '—';
    return {
      name: f.filename ?? 'document',
      ext,
      size,
      date: dateStr,
    };
  });

  // Build timeline from audit events
  const timelineItems = auditEvents.map((e) => ({
    title: e.action,
    description: e.metadataSummary ?? `${e.targetType}`,
    time: e.createdAt
      ? (() => {
          const diff = Date.now() - e.createdAt.getTime();
          const mins = Math.floor(diff / 60000);
          if (mins < 60) return `${mins} phút trước`;
          const hours = Math.floor(mins / 60);
          if (hours < 24) return `${hours} giờ trước`;
          return `${Math.floor(hours / 24)} ngày trước`;
        })()
      : '',
  }));

  // Build table data
  const tableData = recentRequests.map((r) => ({
    code: r.code ?? `REQ-${r.id.slice(0, 8).toUpperCase()}`,
    codeStatus: r.status,
    codeStatusLabel: tStatus(r.status),
    type: r.title ?? r.matterType ?? 'Legal Request',
    typeEn: r.matterType ?? '',
    status: r.status,
    statusLabel: tStatus(r.status),
    assignee: r.assignedSpecialist?.name ?? r.assignedReviewer?.name ?? '—',
    assigneeRole: r.assignedSpecialist ? 'Specialist' : r.assignedReviewer ? 'Reviewer' : '',
    date: r.updatedAt
      ? r.updatedAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '—',
    time: r.updatedAt
      ? r.updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ICT'
      : '',
  }));

  const translations = {
    greeting: t('greeting', { name: userName }),
    greetingDesc: t('greetingDesc'),
    createNewRequest: t('createNewRequest'),
    welcomeTitle: t('welcomeTitle'),
    welcomeDesc: t('welcomeDesc', {
      processing: processingRequests,
      pendingDocs: vaultFileCount,
      newReplies: unreadMessages,
    }),
    viewDocuments: t('viewDocuments'),
    sendReply: t('sendReply'),
    statTotalRequests: t('statTotalRequests'),
    statTotalRequestsDesc: t('statTotalRequestsDesc'),
    statProcessing: t('statProcessing'),
    statProcessingDesc: t('statProcessingDesc'),
    statCompleted: t('statCompleted'),
    statCompletedDesc: t('statCompletedDesc'),
    statVaultFiles: t('statVaultFiles'),
    statVaultFilesDesc: t('statVaultFilesDesc'),
    processingCases: t('processingCases'),
    viewAll: t('viewAll'),
    deadlineSla: t('deadlineSla'),
    recentDocuments: t('recentDocuments'),
    openVault: t('openVault'),
    recentActivity: t('recentActivity'),
    searchPlaceholder: t('searchPlaceholder'),
    filter: t('filter'),
    status: t('status'),
    export: t('export'),
    columns: t('columns'),
    colCode: t('colCode'),
    colType: t('colType'),
    colStatus: t('colStatus'),
    colAssignee: t('colAssignee'),
    colUpdatedAt: t('colUpdatedAt'),
    colAction: t('colAction'),
    viewDetail: t('viewDetail'),
    responseAction: t('responseAction'),
    downloadAction: t('downloadAction'),
    viewDetailAction: t('viewDetailAction'),
    openAction: t('openAction'),
    reply: t('reply'),
    downloadResult: t('downloadResult'),
    addDocs: t('addDocs'),
    specialistInCharge: t('specialistInCharge'),
    noData: t('noData'),
  };

  return (
    <UserLayout
      userName={userName}
      userRole={user?.memberships[0]?.role ?? 'customer'}
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
    >
      <DashboardClient
        stats={stats}
        processingCases={processingCases}
        deadlineItems={deadlineItems}
        documentItems={documentItems}
        timelineItems={timelineItems}
        tableData={tableData}
        translations={translations}
        workspaceSlug={workspaceSlug}
      />
    </UserLayout>
  );
}
