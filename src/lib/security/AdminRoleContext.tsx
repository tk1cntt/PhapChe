'use client';

import { createContext, useContext, useMemo } from 'react';

const AdminRoleContext = createContext<string[] | undefined>(undefined);

export function AdminRoleProvider({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const value = useMemo(() => roles, [roles]);
  return <AdminRoleContext.Provider value={value}>{children}</AdminRoleContext.Provider>;
}

export function useAdminRoles(): string[] {
  const context = useContext(AdminRoleContext);
  if (context === undefined) {
    throw new Error('useAdminRoles must be used within an AdminRoleProvider');
  }
  return context;
}
