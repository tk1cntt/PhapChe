import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import UserLayout from '@/components/layout/UserLayout';
import { PartnerSettingsClient } from '@/components/partner/PartnerSettingsClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PartnerSettingsPage({ params }: PageProps) {
  const { locale } = await params;

  try {
    // Get session directly (partner users may not have workspace membership)
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      redirect(`/${locale}/login`);
    }

    const userId = session.user.id;

    // Get partner context
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId: userId,
        isActive: true,
        partner: { status: 'active' },
      },
      include: { partner: true },
    });

    if (!member) {
      redirect(`/${locale}/dashboard`);
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    return (
      <UserLayout userName={user?.name ?? 'User'} userRole="partner" workspaceName={member.partner.name} workspaceSlug={member.partner.slug}>
        <PartnerSettingsClient
          currentUserId={userId}
          currentUserRole={member.role}
        />
      </UserLayout>
    );
  } catch (error) {
    console.error('Partner settings page error:', error);
    redirect(`/${locale}/error`);
  }
}
