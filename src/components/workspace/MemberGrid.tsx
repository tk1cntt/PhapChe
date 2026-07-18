'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Users, Shield } from 'lucide-react';
import { Badge } from '@/components/my-cases/Badge';

export interface MemberData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface MemberGridProps {
  members: MemberData[];
}

function getInitials(name: string): string {
  if (!name || name.length === 0) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getRoleBadgeVariant(role: string | null | undefined, isActive: boolean): 'green' | 'blue' | 'orange' | 'red' | 'purple' {
  if (!isActive) return 'orange';
  const roleKey = (role ?? '').toLowerCase();
  switch (roleKey) {
    case 'owner':
    case 'finance':
    case 'specialist':
      return 'green';
    case 'viewer':
    case 'customer':
    case 'reviewer':
      return 'blue';
    case 'coordinator_admin':
      return 'red';
    case 'super_admin':
      return 'purple';
    case 'audit_admin':
      return 'orange';
    default:
      return 'orange';
  }
}

function getRoleBadgeText(role: string | null | undefined, isActive: boolean, t: (key: string) => string): string {
  if (!isActive) return t('roleInvited');
  const roleKey = (role ?? '').toLowerCase();
  switch (roleKey) {
    case 'owner':
      return t('roleOwner');
    case 'finance':
      return t('roleFinance');
    case 'viewer':
      return t('roleViewer');
    case 'customer':
      return t('roleCustomer');
    case 'coordinator_admin':
      return t('roleCoordinator');
    case 'super_admin':
      return t('roleSuperAdmin');
    case 'specialist':
      return t('roleSpecialist');
    case 'reviewer':
      return t('roleReviewer');
    case 'audit_admin':
      return t('roleAuditAdmin');
    default:
      return role ?? '';
  }
}

function getRoleDisplay(role: string | null | undefined, t: (key: string) => string): string {
  const roleKey = (role ?? '').toLowerCase();
  switch (roleKey) {
    case 'owner':
      return t('roleOwner');
    case 'finance':
      return t('roleFinance');
    case 'viewer':
      return t('roleViewer');
    case 'customer':
      return t('roleCustomer');
    case 'coordinator_admin':
      return t('roleCoordinator');
    case 'super_admin':
      return t('roleSuperAdmin');
    case 'specialist':
      return t('roleSpecialist');
    case 'reviewer':
      return t('roleReviewer');
    case 'audit_admin':
      return t('roleAuditAdmin');
    default:
      return role ?? '';
  }
}

export function MemberGrid({ members }: MemberGridProps): React.ReactElement {
  const t = useTranslations('UserWorkspace');

  return (
    <div className="member-grid">
      {/* Members Panel */}
      <div className="panel">
        <div className="panel-title">
          <div className="panel-title-left">
            <Users size={20} color="#087f78" />
            <span>{t('membersTitle')}</span>
          </div>
          <Link href="#" className="small-link">
            {t('manage')}
          </Link>
        </div>
        <div className="item-list">
          {members.map((member) => {
            const roleDisplay = getRoleDisplay(member.role, t);
            return (
              <div key={member.id} className="member">
                <div className="member-left">
                  <div className="member-avatar">{getInitials(member.name)}</div>
                  <div className="stack">
                    <strong>{member.name}</strong>
                    <span>
                      {roleDisplay}
                      {roleDisplay && member.email ? ' · ' : ''}
                      {member.email}
                    </span>
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(member.role, member.isActive)}>
                  {getRoleBadgeText(member.role, member.isActive, t)}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permission Panel */}
      <div className="panel">
        <div className="panel-title">
          <div className="panel-title-left">
            <Shield size={20} color="#087f78" />
            <span>{t('permissionsTitle')}</span>
          </div>
        </div>
        <div className="scope">
          <strong>{t('tenantIsolation')}</strong>
          <p>{t('dataPrivacyNote')}</p>
        </div>
        <div className="scope">
          <strong>{t('yourRole')}</strong>
          <p>{t('ownerRoleDesc')}</p>
        </div>
        <div className="scope">
          <strong>{t('auditTitle')}</strong>
          <p>{t('fileActionsNote')}</p>
        </div>
      </div>
    </div>
  );
}

export default MemberGrid;
