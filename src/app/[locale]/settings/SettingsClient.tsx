'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SettingsMenu, SettingsTab } from '@/components/settings/SettingsMenu';
import { SettingsStats } from '@/components/settings/SettingsStats';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { LanguageSection } from '@/components/settings/LanguageSection';
import { AuditSection } from '@/components/settings/AuditSection';
import { WorkspaceSection } from '@/components/settings/WorkspaceSection';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  title: string | null;
  timezone: string;
  locale: string;
}

export interface SettingsStatsData {
  accountStatus: string;
  securityStatus: string;
  notificationCount: number;
  workspaceCount: number;
}

export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
}

export interface SettingsClientProps {
  user: UserData;
  stats: SettingsStatsData;
  workspaces: WorkspaceData[];
}

const SAVED_MESSAGE_DURATION_MS = 3000;

export function SettingsClient({ user, stats, workspaces }: SettingsClientProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profileSaved, setProfileSaved] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(user.locale);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current !== null) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current !== null) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save profile');
      }

      setSaveError(null);
      setProfileSaved(true);
      savedTimerRef.current = setTimeout(() => setProfileSaved(false), SAVED_MESSAGE_DURATION_MS);
    } catch (error) {
      console.error('Save profile failed:', error);
      setSaveError(error instanceof Error ? error.message : 'Save failed');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileSection
            user={{
              name: user.name,
              email: user.email,
              phone: user.phone,
              title: user.title,
              timezone: user.timezone,
            }}
            workspaces={workspaces}
            onSave={handleSaveProfile}
            savedMessage={profileSaved ? t('profileSaved') : undefined}
            saveError={saveError}
          />
        );
      case 'security':
        return <SecuritySettings userId={user.id} />;
      case 'notifications':
        return <NotificationSettings />;
      case 'workspace':
        return <WorkspaceSection workspaces={workspaces} />;
      case 'language':
        return (
          <LanguageSection
            currentLocale={currentLocale}
            onLocaleChange={async (newLocale) => {
              setCurrentLocale(newLocale);
              try {
                await fetch('/api/settings/locale', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ locale: newLocale }),
                });
              } catch (error) {
                console.error('Failed to persist locale:', error);
              }
            }}
          />
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ locale: newLocale }),
                });
              } catch (error) {
                console.error('Failed to persist locale:', error);
              }
            }}
          />
    <div className="settings-page">
      <div className="page-header">
        <h1>{t('pageTitle')}</h1>
        <p className="subtitle">{t('pageDesc')}</p>
      </div>

      <SettingsStats {...stats} />

      <div className="settings-layout">
        <SettingsMenu activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="settings-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default SettingsClient;
