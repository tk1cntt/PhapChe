'use client';

import React from 'react';

export interface RolePillProps {
  role: string;
  count: number;
  variant: 'blue' | 'orange' | 'green' | 'red' | 'purple';
}

const RolePill: React.FC<RolePillProps> = ({ role, count, variant }) => {
  return (
    <div className={`role-pill ${variant}`}>
      {role}
      <b>{count}</b>
    </div>
  );
};

export default RolePill;
