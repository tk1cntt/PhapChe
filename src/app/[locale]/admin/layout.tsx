import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireAppSession } from '@/lib/security/session';
import { canAccessRoute } from '@/lib/security/role-config';
import { AdminRoleProvider } from '@/lib/security/AdminRoleContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { prisma } from '@/lib/prisma';

/** Tất cả role được phép vào khu vực admin */
const ADMIN_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin', 'specialist', 'reviewer'];

/** Role priority để chọn role hiển thị cao nhất */
const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 100,
  coordinator_admin: 90,
  audit_admin: 80,
  reviewer: 50,
  specialist: 40,
  customer: 10,
};

/** Map role key → display label */
const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  coordinator_admin: 'Coordinator',
  audit_admin: 'Auditor',
  specialist: 'Specialist',
  reviewer: 'Reviewer',
  customer: 'Customer',
};

function getDisplayRole(roles: string[]): string {
  const adminRoles = roles.filter(r => ADMIN_ROLES.includes(r));
  if (adminRoles.length === 0) return ROLE_LABEL[roles[0]] ?? roles[0] ?? '';
  // Pick highest priority role
  const best = adminRoles.reduce((a, b) => (ROLE_PRIORITY[a] ?? 0) > (ROLE_PRIORITY[b] ?? 0) ? a : b);
  return ROLE_LABEL[best] ?? best;
}

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

    // Gate 2: Don't re-check dashboard itself — doing so would cause
    // an RSC fetch loop because _rsc requests don't carry query params.
    if (routeKey && routeKey !== 'dashboard' && !canAccessRoute(routeKey, session.roles ?? [])) {
      redirect(`/${locale}/admin/dashboard`);
    }

    // Fetch user info for sidebar profile display
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true },
    });
    const userName = user?.name ?? '';
    const userInitial = userName ? userName.charAt(0).toUpperCase() : 'A';
    const userRole = getDisplayRole(session.roles ?? []);

    return (
      <AdminRoleProvider roles={session.roles ?? []}>
        <AdminLayout
          locale={locale}
          userRoles={session.roles ?? []}
          userName={userName}
          userRole={userRole}
          userInitial={userInitial}
        >
          {children}
        </AdminLayout>
      </AdminRoleProvider>
    );
  } catch (e) {
    // redirect() throws a NEXT_REDIRECT error — don't swallow it.
    // Re-throwing ensures the login redirect with returnUrl passes through.
    if ((e as any)?.digest?.startsWith('NEXT_REDIRECT')) throw e;
    redirect(`/${locale}/sign-in`);
  }
}
