import { useAuth } from './useAuth';

/**
 * WARNING: This hook is for UI visibility only.
 * Backend MUST validate all permissions on API endpoints.
 * Client-side checks can be bypassed by modifying client code or making direct API calls.
 */

/**
 * usePermissions - Hook để kiểm tra quyền của user hiện tại (UI only)
 *
 * IMPORTANT: This is a convenience hook for hiding/showing UI elements.
 * It does NOT enforce security - backend must validate all permissions.
 *
 * @returns {Object} { can, cannot } - Functions để kiểm tra quyền
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Kiểm tra user có quyền thực hiện action trên resource không
   * @param action - Tên action (ví dụ: 'read', 'write', 'delete')
   * @param resource - Tên resource (ví dụ: 'request', 'workspace', 'audit')
   * @returns boolean - true nếu có quyền, false nếu không
   */
  const can = (action: string, resource?: string): boolean => {
    if (!user) return false;

    const role = user.role;
    if (!role) return false;

    // UI-only permission matrix - backend must enforce actual access control
    const permissions: Record<string, string[]> = {
      super_admin: ['*'], // Tất cả quyền
      coordinator_admin: [
        'read:requests',
        'write:requests',
        'read:users',
        'read:workspaces',
        'read:audit',
      ],
      reviewer: [
        'read:requests',
        'review:requests',
        'read:audit',
      ],
      specialist: [
        'read:requests',
        'write:requests',
      ],
      customer: [
        'read:requests',
        'create:requests',
      ],
    };

    const rolePermissions = permissions[role] || [];

    // Super admin có tất cả quyền
    if (rolePermissions.includes('*')) return true;

    // Kiểm tra quyền cụ thể
    if (resource) {
      return rolePermissions.includes(`${action}:${resource}`);
    }

    // Kiểm tra quyền tổng quát (ví dụ: 'admin')
    return rolePermissions.some(p => p.startsWith(`${action}:`));
  };

  /**
   * Ngược lại của can - kiểm tra user KHÔNG có quyền
   */
  const cannot = (action: string, resource?: string): boolean => {
    return !can(action, resource);
  };

  return { can, cannot };
}
