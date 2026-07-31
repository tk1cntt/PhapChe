import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/types";

export type { AppRole };

export type AppSession = {
  userId: string;
  name?: string;
  activeWorkspaceId?: string | null;
  roles: AppRole[];
};

/**
 * Role priority (higher = more privileged).
 * When a user has multiple workspace memberships, we pick the most privileged one.
 */
const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 100,
  coordinator_admin: 90,
  audit_admin: 80,
  reviewer: 50,
  specialist: 40,
  customer: 10,
};

const DEFAULT_LOCALE = 'vi';
const VALID_LOCALES = ['vi', 'en', 'zh', 'ja'];

function buildSignInUrl(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const locale = VALID_LOCALES.includes(segments[0] ?? '') ? segments[0] : DEFAULT_LOCALE;
  const returnUrl = encodeURIComponent(pathname);
  return `/${locale}/sign-in?returnUrl=${returnUrl}`;
}

export async function requireAppSession(reqHeaders?: Headers): Promise<AppSession> {
  const h = reqHeaders ?? await headers();
  let session;
  try {
    session = await auth.api.getSession({ headers: h });
  } catch {
    const pathname = h.get('x-invoke-path') ?? h.get('x-pathname') ?? '';
    redirect(buildSignInUrl(pathname));
  }
  if (!session?.user?.id) {
    const pathname = h.get('x-invoke-path') ?? h.get('x-pathname') ?? '';
    redirect(buildSignInUrl(pathname));
  }

  const userId = session.user.id;
  let user;
  try {
    user = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        name: true,
        memberships: {
          where: { isActive: true, workspace: { isActive: true } },
          select: { workspaceId: true, role: true },
        },
      },
    });
  } catch {
    const pathname = h.get('x-invoke-path') ?? h.get('x-pathname') ?? '';
    redirect(buildSignInUrl(pathname));
  }

  if (!user || user.memberships.length === 0) {
    const pathname = h.get('x-pathname') ?? '';
    redirect(buildSignInUrl(pathname));
  }

  // Collect all unique roles from all memberships
  const allRoles = Array.from(new Set(user.memberships.map((m) => m.role as AppRole)));

  // Pick the membership with the highest privilege role for activeWorkspaceId
  // Sort to ensure deterministic tie-breaking when roles have equal priority
  const sorted = [...user.memberships].sort((a, b) => a.workspaceId.localeCompare(b.workspaceId));
  const bestMembership = sorted.reduce((best, m) => {
    const bestPriority = ROLE_PRIORITY[best.role] ?? 0;
    const mPriority = ROLE_PRIORITY[m.role] ?? 0;
    return mPriority > bestPriority ? m : best;
  }, sorted[0]);

  return {
    userId: user.id,
    name: user.name,
    activeWorkspaceId: bestMembership.workspaceId,
    roles: allRoles,
  };
}
