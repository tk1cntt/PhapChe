import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UserLayout from '@/components/layout/UserLayout';
import { PartnerDashboardClient } from '@/components/partner/PartnerDashboardClient';
import { requireAppSession } from '@/lib/security/session';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PartnerDashboardPage({ params }: PageProps) {
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

  // Get stats for dashboard
  const [totalMembers] = await Promise.all([
    prisma.partnerMember.count({
      where: { partnerId: member.partnerId, isActive: true },
    }),
  ]);

  return (
    <UserLayout userName={user?.name ?? 'User'} userRole="partner" workspaceName={member.partner.name} workspaceSlug="partner">
      <PartnerDashboardClient
        currentUserId={session.userId}
        currentUserRole={member.role}
        partnerName={member.partner.name}
        memberCount={totalMembers}
      />
    </UserLayout>
  );
}
