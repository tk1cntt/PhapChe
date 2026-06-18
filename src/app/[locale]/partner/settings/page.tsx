import { redirect } from 'next/navigation';
import { getServerSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import UserLayout from '@/components/layout/UserLayout';
import { PartnerSettingsClient } from '@/components/partner/PartnerSettingsClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PartnerSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  // Get partner context
  const member = await prisma.partnerMember.findFirst({
    where: {
      userId: session.user.id,
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
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return (
    <UserLayout userName={user?.name ?? 'User'} userRole="partner" workspaceName={member.partner.name} workspaceSlug="partner">
      <PartnerSettingsClient
        currentUserId={session.user.id}
        currentUserRole={member.role}
      />
    </UserLayout>
  );
}
