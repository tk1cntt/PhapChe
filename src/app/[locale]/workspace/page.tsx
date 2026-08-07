import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getWorkspaceRequestWhere } from '@/lib/security/request-filter';
import { getTranslations } from 'next-intl/server';
import { UserLayout } from '@/components/layout/UserLayout';
import { WorkspaceBanner, StatsGrid, MemberGrid, ResourceTable } from '@/components/workspace';
import '@/styles/pages/workspace.css';

export const dynamic = 'force-dynamic';

export default async function WorkspacePage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;
  const t = await getTranslations('UserWorkspace');

  let dashboardData: Awaited<ReturnType<typeof fetchDashboardData>> | null = null;
  let dashboardError: string | null = null;

  try {
    dashboardData = await fetchDashboardData(wsId, userId);
  } catch (error) {
    console.error('Workspace load error:', error);
    dashboardError = t('loadError');
  }
    dashboardData = await fetchDashboardData(wsId, userId);
  } catch (error) {
    console.error('Workspace load error:', error);
    dashboardError = t('loadError');
  }
      }
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? '';
  const wsId = workspace?.id ?? activeWorkspaceId;
  if (!wsId) {
    throw new Error('No active workspace found');
  }

  // Fetch DB stats — build role-filtered where clauses for legal requests
  const processingStatusExtra = { status: { in: ['in_progress', 'pending_review', 'revision_required'] } };

  const [baseWhere, processingWhere, allMembers, vaultFileCount, lastVaultUpdate] = await Promise.all([
    getWorkspaceRequestWhere(wsId, userId),
    getWorkspaceRequestWhere(wsId, userId, processingStatusExtra),
    prisma.workspaceMembership.findMany({
      where: { workspaceId: wsId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.vaultFile.count({ where: { workspaceId: wsId } }),
    prisma.vaultFile.findFirst({ where: { workspaceId: wsId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ]);

  // Run request queries with role filter (can't be in the same Promise.all since baseWhere/processingWhere needed first)
  const [requestCount, processingRequestCount, lastRequestUpdate] = await Promise.all([
    prisma.legalRequest.count({ where: baseWhere as Prisma.LegalRequestWhereInput }),
    prisma.legalRequest.count({ where: processingWhere as Prisma.LegalRequestWhereInput }),
    prisma.legalRequest.findFirst({ where: baseWhere as Prisma.LegalRequestWhereInput, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
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
    // TODO: fetch actual last invitation timestamp when invite tracking is implemented
    lastInviteUpdate: null as string | null,
    lastInviteUpdate: null as string | null,

  return (
    <UserLayout
      userName={userName}
      userRole={roles[0] ?? 'customer'}
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
    >
      <div className="workspace_page">
        <PageHeader title={t('pageTitle')} subtitle={t('pageDesc')} />

        <WorkspaceBanner workspaceName={workspaceName} workspaceSlug={workspaceSlug} />
        <StatsGrid stats={stats} />
        <MemberGrid members={members} />
        <ResourceTable resources={resourceData} />
      </div>
    </UserLayout>
  );
  } catch (error) {
    console.error('Workspace load error:', error);

    // Render fallback with minimal data from session
    const fallbackWorkspaceName = 'Workspace';
    const fallbackWorkspaceSlug = '';
    const fallbackUserName = 'User';

    return (
      <UserLayout
        userName={fallbackUserName}
        userRole={roles[0] ?? 'customer'}
        workspaceName={fallbackWorkspaceName}
        workspaceSlug={fallbackWorkspaceSlug}
      >
        <div className="workspace_page">
          <div className="page-header">
            <div>
              <h1>{t('pageTitle')}</h1>
              <p className="subtitle">{t('pageDesc')}</p>
            </div>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {t('loadError')}
          </div>
        </div>
      </UserLayout>
    );
  }
}
