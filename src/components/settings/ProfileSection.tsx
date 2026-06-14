'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { User } from 'lucide-react';

export interface ProfileSectionProps {
  user: {
    name: string;
    email: string;
    phone: string | null;
    title: string | null;
    timezone: string;
  };
  workspaces: Array<{ id: string; name: string; slug: string }>;
  onSave?: (data: {
    name: string;
    email: string;
    phone: string | null;
    title: string | null;
    timezone: string;
  }) => Promise<void>;
  savedMessage?: string;
}

export function ProfileSection({ user, workspaces, onSave, savedMessage }: ProfileSectionProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [formData, setFormData] = React.useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    title: user.title,
    timezone: user.timezone,
  });
  const [saving, setSaving] = React.useState(false);
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = async (data: typeof formData) => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Debounce save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newData);
    }, 500);
  };

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="form-section">
      <div className="form-section-header">
        <User size={20} />
        <h3>{t('profileTitle')}</h3>
        {(savedMessage || saving) && (
          <span className={`save-indicator ${saving ? 'saving' : 'saved'}`}>
            {saving ? t('saving') : savedMessage}
          </span>
        )}
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="fullName">{t('fieldFullName')}</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('placeholderFullName')}
          />
        </div>

        <div className="field">
          <label htmlFor="email">{t('fieldEmail')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t('placeholderEmail')}
          />
        </div>

        <div className="field">
          <label htmlFor="phone">{t('fieldPhone')}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder={t('placeholderPhone')}
          />
        </div>

        <div className="field">
          <label htmlFor="title">{t('fieldTitle')}</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={t('placeholderTitle')}
          />
        </div>

        <div className="field">
          <label htmlFor="workspace">{t('fieldWorkspace')}</label>
          <select
            id="workspace"
            name="workspace"
            value={workspaces[0]?.id || ''}
            onChange={(e) => {
              // Handle workspace change
            }}
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="timezone">{t('fieldTimezone')}</label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
          >
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (ICT)</option>
            <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default ProfileSection;
