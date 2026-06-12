import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import '@/app/[locale]/customer/components/dashboard.css';
import UserLayout from '../../customer/components/UserLayout';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;
  const { workspaceSlug } = params;
  const t = await getTranslations('UserSettings');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      memberships: {
        where: { workspaceId: activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true } } }
      }
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';
  const userEmail = user?.email ?? '';

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
          userName={userName}
          userEmail={userEmail}
          workspaceName={workspaceName}
        />
      </div>
    </UserLayout>
  );
}
