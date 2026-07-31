/**
 * Request Filter by User Role
 *
 * Shared utility để filter LegalRequest theo user role.
 * Dùng trong các trang user-facing (/vi/cases, /vi/dashboard) và API.
 *
 * Logic:
 * - Admin (super_admin, coordinator_admin, audit_admin): thấy tất cả request trong workspace
 * - Specialist: chỉ thấy request mình được assign (assignedSpecialistId)
 * - Reviewer: chỉ thấy request mình được assign review (assignedReviewerId)
 * - Customer: chỉ thấy request mình tạo (createdById)
 *
 * Quan trọng: Nếu user có nhiều role, role quyền lực nhất sẽ thắng (admin > reviewer > specialist > customer).
 * KHÔNG dùng roles từ requireAppSession (tổng hợp tất cả workspace) — thay vào đó kiểm tra
 * membership trong active workspace để tránh leak role cross-workspace.
 */

import { prisma } from '@/lib/prisma';

/** Admin roles — được thấy tất cả request trong workspace */
const ADMIN_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin'] as const;

/** Role priority cho việc pick role cao nhất */
const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 100,
  coordinator_admin: 90,
  audit_admin: 80,
  reviewer: 50,
  specialist: 40,
  customer: 10,
};

/**
 * Lấy role có quyền cao nhất của user trong active workspace.
 * Dùng membership trong workspace cụ thể, KHÔNG dùng roles từ requireAppSession.
 */
async function getEffectiveRole(
  userId: string,
  activeWorkspaceId: string,
): Promise<string | null> {
  const membership = await prisma.workspaceMembership.findFirst({
    where: {
      userId,
      workspaceId: activeWorkspaceId,
      isActive: true,
    },
    select: { role: true },
  });

  return membership?.role ?? null;
}

/**
 * Prisma where clause fragment để filter LegalRequest theo role của user.
 * Trả về partial where object để merge với điều kiện hiện có (workspaceId, status, etc.)
 *
 * @returns null nếu user là admin (không cần filter thêm)
 */
async function getRoleFilterClause(
  userId: string,
  activeWorkspaceId: string,
): Promise<Record<string, unknown> | null> {
  const role = await getEffectiveRole(userId, activeWorkspaceId);

  if (!role) return { createdById: userId }; // fallback: chỉ thấy request của mình

  // Admin → không filter thêm, thấy tất cả trong workspace
  if (ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number])) {
    return null;
  }

  // Specialist → request mình được assign
  if (role === 'specialist') {
    return { assignedSpecialistId: userId };
  }

  // Reviewer → request mình được assign review
  if (role === 'reviewer') {
    return { assignedReviewerId: userId };
  }

  // Customer / mặc định → request mình tạo
  return { createdById: userId };
}

/**
 * Tạo Prisma `where` clause đầy đủ cho LegalRequest query, kết hợp
 * filter workspace + role + optional extra filters.
 *
 * @param baseWhere - Điều kiện hiện có (vd: { workspaceId, status })
 * @param userId - ID của user
 * @param activeWorkspaceId - Active workspace ID từ session
 */
export async function buildRequestWhere(
  baseWhere: Record<string, unknown>,
  userId: string,
  activeWorkspaceId: string,
): Promise<Record<string, unknown>> {
  const roleFilter = await getRoleFilterClause(userId, activeWorkspaceId);

  if (!roleFilter) {
    return { ...baseWhere };
  }

  return { ...baseWhere, ...roleFilter };
}

/**
 * Simplest interface: lấy Prisma where cho LegalRequest theo workspace + role.
 * Tiện cho các page gọi nhanh.
 *
 * @param activeWorkspaceId
 * @param userId
 * @param extra - Extra filters (status, etc.)
 */
export async function getWorkspaceRequestWhere(
  activeWorkspaceId: string,
  userId: string,
  extra?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return buildRequestWhere(
    { ...(extra ?? {}), workspaceId: activeWorkspaceId },
    userId,
    activeWorkspaceId,
  );
}
