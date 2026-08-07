import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import UserActivityClient from '@/components/admin/UserActivityClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await requireAppSession();

  // Verify admin role to prevent unauthorized access to user data
  const ADMIN_ROLES = ['coordinator_admin', 'super_admin'] as const;
  const isAdmin = session.roles.some((role) => ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number]));
  const isAdmin = session.roles.some((role) => ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number]));
    return <StatusMessage title="Unauthorized" />;
  }

  // Fetch user for initial data
  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return (
      <div className="flex items-center justify-center p-12">
        <h1>Something went wrong</h1>
        <p>Unable to load user data. Please try again later.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-12">
        <h1>User not found</h1>
      </div>
    );
  }

  return <UserActivityClient userId={id} locale={locale} initialUser={user} />;
}
