import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import UserLayout from '@/components/layout/UserLayout';
import { SettingsClient } from './SettingsClient';
import '@/styles/pages/settings.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;

  try {
    // Fetch user data and stats in parallel
    const [user, accountRequests, securityEvents, notificationPreferences] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          title: true,
          timezone: true,
          locale: true,
          memberships: {
            where: { workspace: { isActive: true } },
            include: {
              workspace: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      }),
      prisma.legalRequest.count({ where: { createdById: userId } }),
      prisma.auditEvent.count({
        where: { actorId: userId, action: { contains: 'auth' } },
      }),
      prisma.userPreferences.count({ where: { userId } }),
    ]);

    if (!user) {
      notFound();
    }

    const userName = user.name ?? user.email ?? 'User';
    const activeMembership = user.memberships.find((m) => m.workspace.id === activeWorkspaceId);
    const workspace = activeMembership?.workspace ?? user.memberships[0]?.workspace;
    const workspaceName = workspace?.name ?? 'Workspace';
    const workspaceSlug = workspace?.slug ?? 'workspace';

    const workspaceCount = user.memberships.length;

    const stats = {
      accountStatus: accountRequests > 0 ? 'Active' : 'New',
      securityStatus: securityEvents > 0 ? 'Enabled' : 'Basic',
      notificationCount: notificationPreferences,
      workspaceCount,
    };

    const workspaces = user.memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
    }));

    return (
      <UserLayout userName={userName} userRole={roles[0] ?? 'customer'} workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
        <SettingsClient
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone ?? null,
            title: user.title ?? null,
            timezone: user.timezone ?? 'Asia/Ho_Chi_Minh',
            locale: user.locale ?? 'vi',
          }}
          stats={stats}
          workspaces={workspaces}
        />
      </UserLayout>
    );
  } catch (_error) {
    return (
      <UserLayout userName="User" userRole={roles[0] ?? 'customer'} workspaceName="Workspace" workspaceSlug="workspace">
        <SettingsClient
          user={{
            id: '',
            name: '',
            email: '',
            phone: null,
            title: null,
            timezone: 'Asia/Ho_Chi_Minh',
            locale: 'vi',
          }}
          stats={{
            accountStatus: 'Error',
            securityStatus: 'Error',
            notificationCount: 0,
            workspaceCount: 0,
          }}
          workspaces={[]}
        />
      </UserLayout>
    );
  }
}
