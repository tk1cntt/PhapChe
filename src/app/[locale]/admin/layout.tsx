import { redirect } from 'next/navigation';
import { requireAppSession } from '@/lib/security/session';
import { AdminLayout } from '@/components/layout/AdminLayout';

/** Tất cả role được phép vào khu vực admin */
const ADMIN_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin', 'specialist', 'reviewer'];

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayoutWrapper({ children, params }: LayoutProps) {
  const { locale } = await params;

  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => ADMIN_ROLES.includes(role));

    if (!hasAdminRole) {
      redirect(`/${locale}/dashboard`);
    }

    return (
      <AdminLayout locale={locale} userRoles={session.roles ?? []}>
        {children}
      </AdminLayout>
    );
  } catch {
    redirect(`/${locale}/sign-in`);
  }
}
