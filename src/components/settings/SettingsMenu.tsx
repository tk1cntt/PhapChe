'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { User, Shield, Bell, Building2, Globe, FileText } from 'lucide-react';

export type SettingsTab = 'profile' | 'security' | 'notifications' | 'workspace' | 'language' | 'audit';

export interface SettingsTabConfig {
  id: SettingsTab;
  labelKey: string;
  icon: React.ReactNode;
}

const tabs: SettingsTabConfig[] = [
  { id: 'profile', labelKey: 'tabProfile', icon: <User size={18} /> },
  { id: 'security', labelKey: 'tabSecurity', icon: <Shield size={18} /> },
  { id: 'notifications', labelKey: 'tabNotifications', icon: <Bell size={18} /> },
  { id: 'workspace', labelKey: 'tabWorkspace', icon: <Building2 size={18} /> },
  { id: 'language', labelKey: 'tabLanguage', icon: <Globe size={18} /> },
  { id: 'audit', labelKey: 'tabAudit', icon: <FileText size={18} /> },
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
