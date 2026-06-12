import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import UserLayout from './components/UserLayout';
import StatCard from './components/StatCard';
import WelcomeCard from './components/WelcomeCard';
import CaseListPanel from './components/CaseListPanel';
import DeadlinePanel from './components/DeadlinePanel';
import DocumentPanel from './components/DocumentPanel';
import ActivityTimeline from './components/ActivityTimeline';
import FloatingChatButton from './components/FloatingChatButton';
import Toolbar from './components/Toolbar';
import RequestsTable, { RequestRow } from './components/RequestsTable';
import './components/dashboard.css';

export default async function CustomerDashboardPage() {
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;
  const t = await getTranslations('UserDashboard');
  const tActions = await getTranslations('Actions');

  // Get user and workspace info
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
  const workspaceSlug = workspace?.slug ?? '';

  // Fetch ALL dashboard data from database (workspace-scoped)
  const [
    totalRequests,
    processingRequests,
    completedRequests,
    vaultFiles,
    pendingDocs,
    unreadMessages,
    recentRequests,
    recentVaultFiles,
    auditEvents,
    deadlines,
    requests
  ] = await Promise.all([
    // CUST-DASH-01: Total requests count
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '' } }),
    // Processing requests (in_progress, pending_review, revision_required)
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '', status: { in: ['in_progress', 'pending_review', 'revision_required'] } } }),
    // Completed requests (delivered, closed)
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '', status: { in: ['delivered', 'closed'] } } }),
    // Vault files count
    prisma.vaultFile.count({ where: { workspaceId: activeWorkspaceId ?? '' } }),
    // pendingDocs: Count of pending review documents (pending_review status)
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '', status: 'pending_review' } }),
    // unreadMessages: Count of unread messages for this user
    prisma.message.count({
      where: {
        workspaceId: activeWorkspaceId ?? '',
        recipientId: userId,
        isRead: false,
      },
    }).catch(() => 0), // Fallback if no messages table data
    // Recent requests for case list (CUST-DASH-03)
    prisma.legalRequest.findMany({
      where: { workspaceId: activeWorkspaceId ?? '' },
      include: { assignedSpecialist: { select: { name: true } }, assignedReviewer: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    }),
    // Recent vault files (CUST-DASH-05)
    prisma.vaultFile.findMany({
      where: { workspaceId: activeWorkspaceId ?? '' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    // Audit events for timeline (CUST-DASH-06)
    prisma.auditEvent.findMany({
      where: { workspaceId: activeWorkspaceId ?? '' },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    // Deadlines: Get requests with pending_review or revision_required status (CUST-DASH-04)
    prisma.legalRequest.findMany({
      where: {
        workspaceId: activeWorkspaceId ?? '',
        status: { in: ['pending_review', 'revision_required'] }
      },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    }),
    // Full requests for table (CUST-DASH-07, CUST-DASH-08)
    prisma.legalRequest.findMany({
      where: { workspaceId: activeWorkspaceId ?? '' },
      include: {
        assignedSpecialist: { select: { name: true } },
        assignedReviewer: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    }),
  ]);

  // Map recentRequests to cases for CaseListPanel
  const cases = recentRequests.map(req => ({
    id: req.id,
    code: `REQ-${req.createdAt.getFullYear()}-${String(req.id.slice(-3)).toUpperCase()}`,
    title: req.title,
    specialistName: req.assignedSpecialist?.name ?? req.assignedReviewer?.name ?? 'N/A',
    specialistRole: req.assignedSpecialist ? 'Specialist' : req.assignedReviewer ? 'Reviewer' : 'N/A',
    status: (req.status === 'pending_review' || req.status === 'revision_required' ? 'pending' : req.status === 'delivered' || req.status === 'closed' ? 'approved' : 'review') as 'pending' | 'approved' | 'review',
  }));

  // Map deadlines from database to DeadlinePanel format
  // Calculate progress based on SLA or days since creation
  const now = new Date();
  const deadlinesMapped = deadlines.map((req, index) => {
    const daysSinceUpdate = Math.floor((now.getTime() - req.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    const progress = Math.min(100, daysSinceUpdate * 20); // 20% per day, max 100%
    const status = progress >= 80 ? 'danger' : progress >= 50 ? 'warn' : 'ok';
    const timeRemaining = progress >= 100
      ? `${t('overdueStatus')} ${progress - 100}%`
      : `${t('daysRemaining')} ${Math.ceil((100 - progress) / 20)} ${t('days')}`;

    return {
      id: req.id,
      title: req.title,
      timeRemaining,
      progress,
      status: status as 'ok' | 'warn' | 'danger',
      note: req.status === 'pending_review'
        ? t('pendingDocsNote1')
        : t('pendingDocsNote2'),
    };
  });

  const documents = recentVaultFiles.map(f => ({
    id: f.id,
    filename: f.filename ?? t('documentLabel'),
    size: f.size ? `${(f.size / 1024).toFixed(0)} KB` : 'N/A',
    updatedAt: f.createdAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    status: 'pending' as const,
  }));

  const activities = auditEvents.map(e => ({
    id: e.id,
    title: e.action,
    description: e.metadataSummary ?? t('noDescription'),
    timestamp: getRelativeTime(e.createdAt, t),
  }));

  // Calculate SLA for each request (7-day SLA from creation)
  const calculateSLA = (createdAt: Date) => {
    const now = new Date();
    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + 7); // 7-day SLA

    const totalMs = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const elapsedMs = now.getTime() - createdAt.getTime();
    const progress = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

    const status = progress >= 100 ? 'danger' : progress >= 70 ? 'warn' : 'ok';

    const deadlineText = deadline.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });

    return {
      deadline: deadline.toISOString(),
      deadlineText: `${deadlineText}`,
      progress,
      status: status as 'ok' | 'warn' | 'danger',
    };
  };

  // Map requests for table (CUST-DASH-07, CUST-DASH-08)
  const requestRows: RequestRow[] = requests.map(req => ({
    id: req.id,
    code: `REQ-${req.createdAt.getFullYear()}-${String(req.id.slice(-3)).toUpperCase()}`,
    statusText: req.status === 'in_progress' ? t('inProgressStatus') : req.status === 'pending_review' ? t('needsResponseStatus') : req.status === 'delivered' ? t('completedStatus') : req.status === 'closed' ? t('completedStatus') : t('inProgressStatus'),
    type: req.title.split(' ').slice(0, 3).join(' '),
    typeEn: 'Contract Review',
    specialistName: req.assignedSpecialist?.name ?? req.assignedReviewer?.name ?? t('unassigned'),
    specialistRole: req.assignedSpecialist ? 'Specialist' : req.assignedReviewer ? 'Reviewer' : 'Coordinator',
    updatedDate: req.updatedAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    updatedTime: req.updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ICT',
    status: (req.status === 'pending_review' || req.status === 'revision_required' ? 'pending' : req.status === 'delivered' || req.status === 'closed' ? 'approved' : 'review') as 'pending' | 'approved' | 'review',
    actionText: req.status === 'pending_review' ? t('responseAction') : req.status === 'delivered' || req.status === 'closed' ? t('downloadResultAction') : req.status === 'revision_required' ? t('addDocsAction') : t('viewDetailAction'),
    sla: calculateSLA(req.createdAt),
  }));

  // notificationCount from database (unread messages)
  const notificationCount = unreadMessages;

  return (
    <UserLayout userName={userName} userRole={roles[0] ?? 'customer'} workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
      <div className="page-header">
        <div>
          <h1>{t('welcomeTitle', { name: userName })}</h1>
          <p className="subtitle">{t('welcomeSubtitle')}</p>
        </div>
        <button className="create-btn">
          <span>+</span> {tActions('createRequest')}
        </button>
      </div>

      {/* CUST-DASH-01: Stat cards */}
      <div className="stats">
        <StatCard titleKey="statTotal" value={totalRequests} descriptionKey="statTotalDesc" icon="file" variant="blue" />
        <StatCard titleKey="statProcessing" value={processingRequests} descriptionKey="statProcessingDesc" icon="clock" variant="orange" />
        <StatCard titleKey="statCompleted" value={completedRequests} descriptionKey="statCompletedDesc" icon="check" variant="green" />
        <StatCard titleKey="statVault" value={vaultFiles} descriptionKey="statVaultDesc" icon="folder" variant="purple" />
      </div>

      {/* CUST-DASH-02: Welcome card - all values from database */}
      <WelcomeCard
        userName={userName}
        workspaceName={workspaceName}
        processingCount={processingRequests}
        pendingDocs={pendingDocs}
        newFeedback={unreadMessages}
      />

      {/* CUST-DASH-03 + CUST-DASH-04: Case list and deadline panel */}
      <div className="grid-2">
        <CaseListPanel cases={cases} />
        <DeadlinePanel deadlines={deadlinesMapped} />
      </div>

      {/* CUST-DASH-05 + CUST-DASH-06: Documents and activity timeline */}
      <div className="dashboard-grid">
        <DocumentPanel documents={documents} />
        <ActivityTimeline activities={activities} />
      </div>

      {/* CUST-DASH-07, CUST-DASH-08, CUST-DASH-09: Requests table */}
      <Toolbar />
      <RequestsTable requests={requestRows} />

      {/* CUST-DASH-10: Floating chat button - notificationCount from database */}
      <FloatingChatButton notificationCount={notificationCount} notificationText={t('newMessages')} />
    </UserLayout>
  );
}

function getRelativeTime(date: Date, t: (key: string) => string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} ${t('minutesAgo')}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ${t('hoursAgo')}`;
  return t('yesterday');
}
