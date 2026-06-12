import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import UserLayout from '../../customer/components/UserLayout';
import { WorkspaceBanner } from '../../customer/components/Workspace/WorkspaceBanner';
import { StatsGrid } from '../../customer/components/Workspace/StatsGrid';
import { MemberGrid } from '../../customer/components/Workspace/MemberGrid';
import { ResourceTable } from '../../customer/components/Workspace/ResourceTable';
import { FloatingChatButton } from '../../customer/components/FloatingChatButton';
import '../../customer/components/dashboard.css';

export default async function WorkspacePage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;
  const { workspaceSlug } = params;
  const t = await getTranslations('UserWorkspace');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      memberships: {
        where: { workspaceId: activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true, slug: true, id: true } } }
      }
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';
  const wsId = workspace?.id ?? activeWorkspaceId ?? '';

  // Fetch DB stats
  const [
    allMembers,
    requestCount,
    processingRequestCount,
    vaultFileCount,
    lastRequestUpdate,
    lastVaultUpdate,
    unreadMessages,
  ] = await Promise.all([
    prisma.workspaceMembership.findMany({
      where: { workspaceId: wsId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.legalRequest.count({ where: { workspaceId: wsId } }),
    prisma.legalRequest.count({ where: { workspaceId: wsId, status: { in: ['in_progress', 'pending_review', 'revision_required'] } } }),
    prisma.vaultFile.count({ where: { workspaceId: wsId } }),
    prisma.legalRequest.findFirst({ where: { workspaceId: wsId }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
    prisma.vaultFile.findFirst({ where: { workspaceId: wsId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.message.count({ where: { workspaceId: wsId, recipientId: userId, isRead: false } }),
  ]);

  const members = allMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name ?? 'User',
    email: m.user.email ?? '',
    role: m.role ?? 'member',
    isActive: m.role !== 'invited',
  }));

  const activeCount = members.filter((m) => m.isActive).length;
  const invitedCount = members.filter((m) => !m.isActive).length;

  const stats = {
    isActive: true,
    slug: workspaceSlug,
    memberCount: members.length,
    activeMemberCount: activeCount,
    invitedMemberCount: invitedCount,
    requestCount,
    processingRequestCount,
    vaultFileCount,
  };

  const resourceData = {
    requestCount,
    vaultFileCount,
    invitedCount,
    lastRequestUpdate: lastRequestUpdate?.updatedAt?.toISOString() ?? null,
    lastVaultUpdate: lastVaultUpdate?.createdAt?.toISOString() ?? null,
    lastInviteUpdate: null as string | null,
  };

  return (
    <UserLayout
      userName={userName}
      userRole={roles[0] ?? 'customer'}
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
    >
      <div className="workspace_page">
        <div className="page-header">
          <div>
            <h1>{t('pageTitle')}</h1>
            <p className="subtitle">{t('pageDesc')}</p>
          </div>
        </div>

        <WorkspaceBanner workspaceName={workspaceName} workspaceSlug={workspaceSlug} />
        <StatsGrid stats={stats} />
        <MemberGrid members={members} />
        <ResourceTable resources={resourceData} />

        <FloatingChatButton notificationCount={unreadMessages} />
      </div>
    </UserLayout>
  );
}
