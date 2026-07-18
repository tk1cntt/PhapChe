import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireAppSession } from '@/lib/security/session';
import { canAccessRoute } from '@/lib/security/role-config';
import { AdminRoleProvider } from '@/lib/security/AdminRoleContext';
import { AdminLayout } from '@/components/layout/AdminLayout';

/** Tất cả role được phép vào khu vực admin */
const ADMIN_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin', 'specialist', 'reviewer'];

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/** Trích xuất route key từ pathname: /vi/admin/users → "users" */
function extractRouteKey(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const adminIdx = segments.findIndex(s => s === 'admin');
  if (adminIdx === -1 || adminIdx === segments.length - 1) return null;
  return segments[adminIdx + 1] ?? null;
}

export default async function AdminLayoutWrapper({ children, params }: LayoutProps) {
  const { locale } = await params;

  try {
    const session = await requireAppSession();

    // ── Gate 1: Any admin role? ──
    const hasAdminRole = session.roles?.some((role) => ADMIN_ROLES.includes(role));
    if (!hasAdminRole) {
      redirect(`/${locale}/dashboard`);
    }

    // ── Gate 2: Specific route permission? ──
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';
    const routeKey = extractRouteKey(pathname);

    if (routeKey && !canAccessRoute(routeKey, session.roles ?? [])) {
      redirect(`/${locale}/admin/dashboard?error=forbidden`);
    }

    return (
      <AdminRoleProvider roles={session.roles ?? []}>
        <AdminLayout locale={locale} userRoles={session.roles ?? []}>
          {children}
        </AdminLayout>
      </AdminRoleProvider>
    );
  } catch {
    redirect(`/${locale}/sign-in`);
  }
}
