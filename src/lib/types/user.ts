/**
 * User Type Definitions
 */

import type { Role } from '@/lib/types';

/**
 * User type enumeration
 */
export type UserType = 'staff' | 'customer';

/**
 * User entity representing a platform user
 */
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  title?: string;
  userType: UserType;
  role: Role;
  workspaceId?: string;
  language?: string;
  avatar?: string;
  notifications?: NotificationSettings;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification preferences for a user
 */
export interface NotificationSettings {
  emailOnReply: boolean;
  emailOnAssignment: boolean;
  slaReminder: boolean;
  weeklySummary: boolean;
  pushNotifications: boolean;
}

/**
 * User profile for settings page
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  title?: string;
  language: string;
  notifications: NotificationSettings;
}

/**
 * Input for updating user profile
 */
export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  title?: string;
  language?: string;
}

/**
 * Input for creating a user (admin)
 */
export interface CreateUserInput {
  email: string;
  name: string;
  phone?: string;
  title?: string;
  role: Role;
  workspaceId?: string;
}

/**
 * Input for updating a user (admin)
 */
export interface UpdateUserInput {
  name?: string;
  phone?: string;
  title?: string;
  role?: Role;
  isActive?: boolean;
}

/**
 * Session information for authenticated user
 */
export interface Session {
  userId: string;
  email: string;
  role: Role;
  workspaceId?: string;
  expiresAt: Date;
}
