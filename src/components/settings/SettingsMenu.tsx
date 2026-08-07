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

const ICON_SIZE = 18;

const tabs: SettingsTabConfig[] = [
  { id: 'profile', labelKey: 'tabProfile', icon: <User size={ICON_SIZE} /> },
  { id: 'security', labelKey: 'tabSecurity', icon: <Shield size={ICON_SIZE} /> },
  { id: 'notifications', labelKey: 'tabNotifications', icon: <Bell size={ICON_SIZE} /> },
  { id: 'workspace', labelKey: 'tabWorkspace', icon: <Building2 size={ICON_SIZE} /> },
  { id: 'language', labelKey: 'tabLanguage', icon: <Globe size={ICON_SIZE} /> },
  { id: 'audit', labelKey: 'tabAudit', icon: <FileText size={ICON_SIZE} /> },
];
  { id: 'audit', labelKey: 'tabAudit', icon: <FileText size={ICON_SIZE} /> },
];
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
