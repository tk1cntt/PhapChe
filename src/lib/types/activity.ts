/**
 * Activity Types for Dashboard Timeline
 * Hỗ trợ nhiều loại hoạt động với icons và màu sắc riêng
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Loại hoạt động trên dashboard
 */
export type ActivityType =
  | 'user'           // Hoạt động liên quan đến user (login, logout, profile update)
  | 'workspace'      // Hoạt động workspace (create, update, invite member)
  | 'request'        // Hoạt động request (created, assigned, transitioned)
  | 'document'       // Hoạt động document (upload, download, viewed)
  | 'review'         // Hoạt động review (started, approved, rejected)
  | 'message'        // Hoạt động message (sent, received)
  | 'vault'          // Hoạt động vault (file stored, folder created)
  | 'partner'        // Hoạt động partner (invited, status changed)
  | 'system';        // Hoạt động hệ thống (backup, maintenance)

/**
 * Màu sắc cho từng loại activity
 */
export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  user: 'blue',
  workspace: 'purple',
  request: 'green',
  document: 'orange',
  review: 'red',
  message: 'cyan',
  vault: 'yellow',
  partner: 'indigo',
  system: 'gray',
};

/**
 * Icon names cho từng loại activity (sử dụng Lucide icon names)
 */
export const ACTIVITY_ICON_NAMES: Record<ActivityType, string> = {
  user: 'User',
  workspace: 'Building2',
  request: 'FileText',
  document: 'FileUp',
  review: 'CheckCircle',
  message: 'MessageSquare',
  vault: 'Archive',
  partner: 'Handshake',
  system: 'Settings',
};

/**
 * Activity item cho dashboard timeline
 */
export interface ActivityItem {
  id: string;
  type: ActivityType;
  action: string;              // Action key: 'request.created', 'user.login', etc.
  description: string;         // Mô tả chi tiết hoạt động
  actor: string;                // Tên người thực hiện
  actorAvatar?: string;         // Avatar URL (optional)
  targetType?: string;         // Loại đối tượng bị tác động
  targetLabel?: string;        // Tên đối tượng bị tác động
  targetId?: string;           // ID đối tượng bị tác động
  timestamp: string;            // ISO timestamp
  relativeTime: string;        // Thời gian tương đối: "5 phút trước", "2 giờ trước"
  metadata?: Record<string, unknown>; // Thông tin bổ sung
}

/**
 * Filter options cho activity list
 */
export interface ActivityFilters {
  types?: ActivityType[];
  actorId?: string;
  targetId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Activity summary stats
 */
export interface ActivityStats {
  total: number;
  byType: Record<ActivityType, number>;
  recentActors: {
    actorId: string;
    actorName: string;
    count: number;
  }[];
}
