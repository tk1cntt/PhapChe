'use client';

import React from 'react';

export interface RoleBadgeProps {
  role: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const getVariant = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'customer':
      case 'specialist':
        return 'blue';
      case 'reviewer':
        return 'orange';
      case 'coordinator_admin':
        return 'green';
      case 'super_admin':
        return 'red';
      case 'audit_admin':
        return 'purple';
      default:
        return 'blue';
    }
  };

  const variant = getVariant(role);

  return (
    <span className={`badge ${variant}`}>
      {role}
    </span>
  );
};

export default RoleBadge;
