'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Shield } from 'lucide-react';
import { Badge } from '../Badge';

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

function getRoleBadgeText(role: string, isActive: boolean): string {
  if (!isActive) return 'Invited';
  switch (role.toLowerCase()) {
    case 'owner':
      return 'Owner';
    case 'finance':
      return 'Finance';
    case 'viewer':
      return 'Viewer';
    case 'customer':
      return 'Customer';
    default:
      return role;
  }
}

function getRoleDisplay(role: string): string {
  switch (role.toLowerCase()) {
    case 'owner':
      return 'Owner';
    case 'finance':
      return 'Finance';
    case 'viewer':
      return 'Legal Contact';
    case 'customer':
      return '';
    default:
      return role;
  }
}

export function MemberGrid({ members }: MemberGridProps): JSX.Element {
  return (
    <div className="member-grid">
      {/* Members Panel */}
      <div className="panel">
        <div className="panel-title">
          <div className="panel-title-left">
            <Users size={20} color="#087f78" />
            <span>Thanh vien workspace</span>
          </div>
          <Link href="#" className="small-link">
            Quan ly →
          </Link>
        </div>
        <div className="item-list">
          {members.map((member) => (
            <div key={member.id} className="member">
              <div className="member-left">
                <div className="member-avatar">{getInitials(member.name)}</div>
                <div className="stack">
                  <strong>{member.name}</strong>
                  <span>
                    {getRoleDisplay(member.role)}
                    {getRoleDisplay(member.role) && member.email ? ' · ' : ''}
                    {member.email}
                  </span>
                </div>
              </div>
              <Badge variant={getRoleBadgeVariant(member.role, member.isActive)}>
                {getRoleBadgeText(member.role, member.isActive)}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Panel */}
      <div className="panel">
        <div className="panel-title">
          <div className="panel-title-left">
            <Shield size={20} color="#087f78" />
            <span>Quyen &amp; bao mat</span>
          </div>
        </div>
        <div className="scope">
          <strong>Tenant isolation</strong>
          <p>
            Du lieu ho so va vault chi hien thi trong workspace Cong ty An Phat, khong lan voi
            tenant khac.
          </p>
        </div>
        <div className="scope">
          <strong>Vai tro hien tai cua ban</strong>
          <p>
            Workspace Owner: tao yeu cau, xem tai lieu, moi thanh vien, phan hoi chuyen vien.
          </p>
        </div>
        <div className="scope">
          <strong>Audit</strong>
          <p>
            Cac thao tac tai tep, xem tai lieu va moi thanh vien duoc ghi lai bang metadata an
            toan.
          </p>
        </div>
      </div>
    </div>
  );
}
