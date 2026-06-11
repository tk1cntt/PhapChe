'use client';

import React from 'react';
import RoleBadge from './RoleBadge';

export interface UserRowProps {
  user: {
    name: string;
    initials: string;
    email: string;
    description: string;
    role: string;
    roleTitle: string;
    workspace: string;
    workspaceSlug: string;
    status: 'Active' | 'Invited' | 'Inactive';
    lastActive?: string;
    lastActiveTime?: string;
    avatarColor: 'green' | 'blue' | 'orange' | 'purple';
  };
}

const UserRow: React.FC<UserRowProps> = ({ user }) => {
  const getStatusVariant = (status: string): string => {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Invited':
        return 'orange';
      case 'Inactive':
        return 'red';
      default:
        return 'green';
    }
  };

  const getActionText = (status: string): string => {
    switch (status) {
      case 'Invited':
        return 'Resend';
      case 'Inactive':
        return 'Activate';
      default:
        return 'Edit';
    }
  };

  return (
    <div className="table-row">
      <div className="td">
        <span className="checkbox"></span>
      </div>
      <div className="td">
        <div className="user-cell">
          <div className={`mini-avatar ${user.avatarColor}`}>
            {user.initials}
          </div>
          <div className="stack">
            <strong>{user.name}</strong>
            <span>{user.roleTitle}</span>
          </div>
        </div>
      </div>
      <div className="td">
        <div className="stack">
          <strong>{user.email}</strong>
          <span>{user.description}</span>
        </div>
      </div>
      <div className="td">
        <RoleBadge role={user.role} />
      </div>
      <div className="td">
        <div className="stack">
          <strong>{user.workspace}</strong>
          <span>{user.workspaceSlug}</span>
        </div>
      </div>
      <div className="td">
        <span className={`badge ${getStatusVariant(user.status)}`}>
          {user.status}
        </span>
      </div>
      <div className="td">
        <div className="stack">
          <strong>{user.lastActive || 'Pending'}</strong>
          <span>{user.lastActiveTime || 'Email sent 2 days ago'}</span>
        </div>
      </div>
      <div className="td">
        <a className="action-link" href="#">
          {getActionText(user.status)} →
        </a>
      </div>
    </div>
  );
};

export default UserRow;
