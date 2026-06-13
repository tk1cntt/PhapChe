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

function getRoleBadgeVariant(role: string, isActive: boolean): 'green' | 'blue' | 'orange' {
  if (!isActive) return 'orange';
  switch (role.toLowerCase()) {
    case 'owner':
    case 'finance':
      return 'green';
    case 'viewer':
    case 'customer':
      return 'blue';
    default:
      return 'blue';
  }
}

function getRoleBadgeText(role: string, isActive: boolean, t: (key: string) => string): string {
  if (!isActive) return t('roleInvited');
  switch (role.toLowerCase()) {
    case 'owner':
      return t('roleOwner');
    case 'finance':
      return t('roleFinance');
    case 'viewer':
      return t('roleViewer');
    case 'customer':
      return t('roleCustomer');
    default:
      return role;
  }
}

function getRoleDisplay(role: string, t: (key: string) => string): string {
  switch (role.toLowerCase()) {
    case 'owner':
      return t('roleOwner');
    case 'finance':
      return t('roleFinance');
    case 'viewer':
      return t('roleViewer');
    case 'customer':
      return t('roleCustomer');
    default:
      return role;
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
            {t('manage')} →
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
