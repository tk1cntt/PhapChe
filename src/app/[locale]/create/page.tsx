import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import UserLayout from '@/components/layout/UserLayout';
import CreateRequestForm from '@/components/create-request/CreateRequestForm';
import '@/components/create-request/create-request.css';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ draftId?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('UserCreateRequest');
  return {
    title: t('pageTitle'),
    description: t('pageDesc'),
  };
}

export default async function CreateRequestPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { draftId } = await searchParams;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId } = session;
  const t = await getTranslations('UserCreateRequest');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      memberships: {
        where: { workspaceId: activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true, slug: true } } },
      },
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? user?.email ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';

  const workspaces = await prisma.workspace.findMany({
    where: {
      memberships: {
        some: { userId },
      },
    },
    select: { id: true, name: true, slug: true },
  });

  const userContactInfo = {
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    companyName: workspaceName,
    taxCode: '',
  };

  return (
    <UserLayout userName={userName} userRole="customer" workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
      <div className="page-header">
        <div>
          <h1>{t('pageTitle')}</h1>
          <p className="subtitle">{t('pageDesc')}</p>
        </div>
        <div className="header-actions">
          <button className="ghost-btn">{t('saveDraft')}</button>
          <button className="create-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
            </svg>
            {t('viewDraft')}
          </button>
        </div>
      </div>

      <CreateRequestForm
        workspaces={workspaces}
        workspaceName={workspaceName}
        locale={locale}
        userContactInfo={userContactInfo}
      />
    </UserLayout>
  );
}
