import { useAuth } from './useAuth';

/**
 * usePermissions - Hook để kiểm tra quyền của user hiện tại
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

    // Permission matrix theo role
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
