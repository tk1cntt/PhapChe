import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import UserActivityClient from '@/components/admin/UserActivityClient';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await requireAppSession();

  // Fetch user for initial data
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h1>User not found</h1>
      </div>
    );
  }

  return <UserActivityClient userId={id} locale={locale} initialUser={user} />;
}
