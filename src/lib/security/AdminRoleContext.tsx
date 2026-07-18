'use client';

import { createContext, useContext } from 'react';

const AdminRoleContext = createContext<string[]>([]);

export function AdminRoleProvider({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  return <AdminRoleContext.Provider value={roles}>{children}</AdminRoleContext.Provider>;
}

export function useAdminRoles(): string[] {
  return useContext(AdminRoleContext);
}
