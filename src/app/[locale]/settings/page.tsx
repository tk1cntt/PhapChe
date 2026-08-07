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

  // --- Fetch user data (catchable) ---
  let user: Awaited<ReturnType<typeof prisma.user.findUnique<typeof userSelect>>>;
  let accountRequests: number;
  let securityEvents: number;
  let notificationPreferences: number;

  try {
    [user, accountRequests, securityEvents, notificationPreferences] = await Promise.all([
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
  } catch (error) {
    console.error('Failed to load settings page:', error);
    return (
      <UserLayout userName="User" userRole={roles[0] ?? 'customer'} workspaceName="Workspace" workspaceSlug="workspace">
        <SettingsClient
          user={{
            id: '',
            name: '',
            email: '',
            phone: null,
            title: null,
            timezone: DEFAULT_TIMEZONE,
            locale: DEFAULT_LOCALE,
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

  // --- notFound OUTSIDE the catch scope (Next.js requires this) ---
  if (!user) {
    notFound();
  }
    ]);
  } catch (error) {
    console.error('Failed to load settings page:', error);
    return (
      <UserLayout userName="User" userRole={roles[0] ?? 'customer'} workspaceName="Workspace" workspaceSlug="workspace">
        <SettingsClient
          user={{
            id: '',
            name: '',
            email: '',
            phone: null,
            title: null,
            timezone: DEFAULT_TIMEZONE,
            locale: DEFAULT_LOCALE,
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

  // --- notFound OUTSIDE the catch scope (Next.js requires this) ---
  if (!user) {
    notFound();
  }
const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
const DEFAULT_LOCALE = 'vi';

// ... later in success path:
            timezone: user.timezone ?? DEFAULT_TIMEZONE,
            locale: user.locale ?? DEFAULT_LOCALE,

// ... later in error path:
            timezone: DEFAULT_TIMEZONE,
            locale: DEFAULT_LOCALE,

// ... later in success path:
            timezone: user.timezone ?? DEFAULT_TIMEZONE,
            locale: user.locale ?? DEFAULT_LOCALE,

// ... later in error path:
            timezone: DEFAULT_TIMEZONE,
            locale: DEFAULT_LOCALE,
    return (
      <UserLayout userName="User" userRole={roles[0] ?? 'customer'} workspaceName="Workspace" workspaceSlug="workspace">
        <SettingsClient
          user={{
            id: '',
            name: '',
            email: '',
            phone: null,
            title: null,
            timezone: DEFAULT_TIMEZONE,
            locale: DEFAULT_LOCALE,
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
