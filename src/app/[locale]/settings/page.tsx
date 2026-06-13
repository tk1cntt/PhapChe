import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import UserLayout from '@/components/layout/UserLayout';
import { SettingsClient } from './SettingsClient';
import '@/components/settings/settings.css';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;

  // Fetch user data with workspaces
  const user = await prisma.user.findUnique({
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
  });

  const userName = user?.name ?? user?.email ?? 'User';
  const workspace = user?.memberships[0]?.workspace;
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';

  // Fetch settings stats
  const [accountRequests, securityEvents, notificationPreferences, workspaceCount] = await Promise.all([
    // Total requests created by user
    prisma.legalRequest.count({ where: { createdById: userId } }),
    // Security-related audit events (auth events)
    prisma.auditEvent.count({
      where: { actorId: userId, action: { contains: 'auth' } },
    }),
    // Notification preferences count
    prisma.userPreferences.count({ where: { userId } }),
    // Workspace count
    prisma.workspace.count({
      where: { memberships: { some: { userId, isActive: true } } },
    }),
  ]);

  const stats = {
    accountStatus: accountRequests > 0 ? 'Active' : 'New',
    securityStatus: securityEvents > 0 ? 'Enabled' : 'Basic',
    notificationCount: notificationPreferences,
    workspaceCount: workspaceCount,
  };

  const workspaces = user?.memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
  })) ?? [];

  return (
    <UserLayout userName={userName} userRole={roles[0] ?? 'customer'} workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
      <SettingsClient
        user={{
          id: user?.id ?? '',
          name: user?.name ?? '',
          email: user?.email ?? '',
          phone: user?.phone,
          title: user?.title,
          timezone: user?.timezone ?? 'Asia/Ho_Chi_Minh',
          locale: user?.locale ?? 'vi',
        }}
        stats={stats}
        workspaces={workspaces}
      />
    </UserLayout>
  );
}
