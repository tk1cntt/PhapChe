import { redirect } from 'next/navigation';
import { requireAppSession } from '@/lib/security/session';
import { AdminLayout } from '@/components/layout/AdminLayout';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin'];

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayoutWrapper({ children, params }: LayoutProps) {
  const { locale } = await params;

  try {
    const session = await requireAppSession();

    // Check if user has admin role
    const hasAdminRole = session.roles?.some((role) => ADMIN_ROLES.includes(role));

    if (!hasAdminRole) {
      // Redirect non-admin users to their dashboard
      redirect(`/${locale}/dashboard`);
    }

    return <AdminLayout locale={locale}>{children}</AdminLayout>;
  } catch {
    // If session fails, redirect to sign-in
    redirect(`/${locale}/sign-in`);
  }
}
