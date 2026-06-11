'use client';

import React from 'react';

export type SettingsTab = 'profile' | 'security' | 'notifications' | 'workspace' | 'language' | 'audit';

export interface SettingsTabConfig {
  id: SettingsTab;
  label: string;
  icon: string;
}

const tabs: SettingsTabConfig[] = [
  { id: 'profile', label: 'Ho so ca nhan', icon: '👤' },
  { id: 'security', label: 'Bao mat dang nhap', icon: '🔐' },
  { id: 'notifications', label: 'Thong bao', icon: '🔔' },
  { id: 'workspace', label: 'Workspace', icon: '🏢' },
  { id: 'language', label: 'Ngon ngu & giao dien', icon: '🌐' },
  { id: 'audit', label: 'Audit ca nhan', icon: '🧾' },
];

export interface SettingsMenuProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsMenu({ activeTab, onTabChange }: SettingsMenuProps): JSX.Element {
  return (
    <div className="settings-menu">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
