import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import { UserLayout } from '@/components/layout/UserLayout';
import { SettingsClient, UserData, WorkspaceData } from '@/app/[locale]/settings/SettingsClient';

export default async function SettingsPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;
  const { workspaceSlug } = params;
  const t = await getTranslations('UserSettings');

  const [user, workspaces] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { include: { workspace: true } } }
    }),
    prisma.workspace.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, isActive: true }
    }),
  ]);

  const currentWorkspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? 'User';
  const userEmail = user?.email ?? '';
  const workspaceName = currentWorkspace?.name ?? 'Workspace';

  const userData: UserData = {
    id: userId,
    name: user?.name ?? 'User',
    email: user?.email ?? '',
    phone: user?.phone ?? null,
    title: user?.title ?? null,
    timezone: user?.timezone ?? 'Asia/Ho_Chi_Minh',
    locale: user?.locale ?? 'vi',
  };

  const workspaceData: WorkspaceData[] = workspaces.map(w => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    isActive: w.isActive,
  }));

  const statsData = {
    accountStatus: 'active',
    securityStatus: 'secure',
    notificationCount: 0,
    workspaceCount: workspaces.length,
  };

  return (
    <UserLayout
      userName={userName}
      userRole={roles[0] ?? 'customer'}
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
    >
      <div className="settings-page">
        <div className="page-header">
          <div>
            <h1>{t('pageTitle')}</h1>
            <p className="subtitle">{t('pageDesc')}</p>
          </div>
        </div>

        <SettingsClient
          user={userData}
          stats={statsData}
          workspaces={workspaceData}
        />
      </div>
    </UserLayout>
  );
}
