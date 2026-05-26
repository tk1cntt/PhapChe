export type AppRole = 'customer' | 'specialist' | 'reviewer' | 'coordinator_admin' | 'super_admin';

export type AppSession = {
  userId: string;
  activeWorkspaceId?: string | null;
  roles: AppRole[];
};
