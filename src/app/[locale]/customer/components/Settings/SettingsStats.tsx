'use client';

import React from 'react';
import { CheckCircle, Shield, Bell, Building2 } from 'lucide-react';

interface StatItem {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  variant: 'green' | 'blue' | 'orange' | 'purple';
}

const statsData: StatItem[] = [
  {
    title: 'Tai khoan',
    value: 'Active',
    description: 'Email da xac thuc',
    icon: <CheckCircle />,
    variant: 'green',
  },
  {
    title: 'Bao mat',
    value: '2FA',
    description: 'Dang bat OTP email',
    icon: <Shield />,
    variant: 'blue',
  },
  {
    title: 'Thong bao',
    value: '6',
    description: 'Kenh dang bat',
    icon: <Bell />,
    variant: 'orange',
  },
  {
    title: 'Workspace',
    value: '1',
    description: 'Cong ty An Phat',
    icon: <Building2 />,
    variant: 'purple',
  },
];

export function SettingsStats(): JSX.Element {
  return (
    <div className="stats">
      {statsData.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className={`stat-icon ${stat.variant}`}>{stat.icon}</div>
          <div className="stat-content">
            <div className="stat-title">{stat.title}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-desc">{stat.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
