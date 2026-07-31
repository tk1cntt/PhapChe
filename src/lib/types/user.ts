/**
 * User Type Definitions
 */

import type { Role } from '@/lib/types';

/**
 * Account type enumeration
 * - staff: Platform employees (admin, coordinator, specialist)
 * - customer: External users (corporate or individual)
 */
export type AccountType = 'staff' | 'customer';

/**
 * User entity representing a platform user
 */
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  title?: string;
  accountType: AccountType;
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
  /** Ensure a default (e.g., 'en') is provided when mapping from User (where language is optional) */
  language: string;
  /** Ensure defaults are applied when mapping from User (where notifications is optional) */
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
  // notifications?: NotificationSettings; // If needed: notification management handled separately
}

/**
 * Session information for authenticated user
 */
export interface Session {
  userId: string;
  email: string;
  role: Role;
  workspaceId?: string;
  /** ISO 8601 timestamp string; convert to Date if needed */
  expiresAt: string;
}
