import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UserLayout from '@/components/layout/UserLayout';
import { PartnerSettingsClient } from '@/components/partner/PartnerSettingsClient';
import { requireAppSession } from '@/lib/security/session';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PartnerSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await requireAppSession();

  // Get partner context
  const member = await prisma.partnerMember.findFirst({
    where: {
      userId: session.userId,
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
    where: { id: session.userId },
    select: { name: true, email: true },
  });

  return (
    <UserLayout userName={user?.name ?? 'User'} userRole="partner" workspaceName={member.partner.name} workspaceSlug="partner">
      <PartnerSettingsClient
        currentUserId={session.userId}
        currentUserRole={member.role}
      />
    </UserLayout>
  );
}
