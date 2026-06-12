'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export type SettingsTab = 'profile' | 'security' | 'notifications' | 'workspace' | 'language' | 'audit';

export interface SettingsTabConfig {
  id: SettingsTab;
  labelKey: string;
  icon: string;
}

const tabs: SettingsTabConfig[] = [
  { id: 'profile', labelKey: 'tabProfile', icon: '👤' },
  { id: 'security', labelKey: 'tabSecurity', icon: '🔐' },
  { id: 'notifications', labelKey: 'tabNotifications', icon: '🔔' },
  { id: 'workspace', labelKey: 'tabWorkspace', icon: '🏢' },
  { id: 'language', labelKey: 'tabLanguage', icon: '🌐' },
  { id: 'audit', labelKey: 'tabAudit', icon: '🧾' },
];

export interface SettingsMenuProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsMenu({ activeTab, onTabChange }: SettingsMenuProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  return (
    <div className="settings-menu">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{t(tab.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}

export default SettingsMenu;
