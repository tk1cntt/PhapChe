'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, CheckCircle, XCircle } from 'lucide-react';

interface NotificationPreferences {
  emailOnReply: boolean;
  slaReminder: boolean;
  weeklySummary: boolean;
}

export function NotificationSettings(): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailOnReply: true,
    slaReminder: true,
    weeklySummary: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/settings/notifications');
      if (!response.ok) throw new Error('Failed to fetch preferences');

      const data = await response.json();
      if (data.success && data.data) {
        setPreferences(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notification preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    // Optimistic update
    const previousPreferences = { ...preferences };
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);

    setSaving(true);

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update preference');
      }

      setSuccess(t('preferenceSaved'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      // Revert optimistic update
      setPreferences(previousPreferences);
      setError(err instanceof Error ? err.message : 'Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="notification-settings loading">
        <Bell size={20} />
        <span>{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="settings-section">
        <div className="section-header">
          <Bell size={20} />
          <h3>{t('notificationTitle')}</h3>
        </div>

        {error && (
          <div className="alert alert-error">
            <XCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <div className="notification-list">
          <div className="toggle-row">
            <div className="toggle-content">
              <div className="toggle-label">{t('emailOnReply')}</div>
              <div className="toggle-description">{t('emailOnReplyDesc')}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.emailOnReply}
              className={`toggle ${preferences.emailOnReply ? '' : 'off'}`}
              onClick={() => updatePreference('emailOnReply', !preferences.emailOnReply)}
              disabled={saving}
            />
          </div>

          <div className="toggle-row">
            <div className="toggle-content">
              <div className="toggle-label">{t('slaReminder')}</div>
              <div className="toggle-description">{t('slaReminderDesc')}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.slaReminder}
              className={`toggle ${preferences.slaReminder ? '' : 'off'}`}
              onClick={() => updatePreference('slaReminder', !preferences.slaReminder)}
              disabled={saving}
            />
          </div>

          <div className="toggle-row">
            <div className="toggle-content">
              <div className="toggle-label">{t('weeklySummary')}</div>
              <div className="toggle-description">{t('weeklySummaryDesc')}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.weeklySummary}
              className={`toggle ${preferences.weeklySummary ? '' : 'off'}`}
              onClick={() => updatePreference('weeklySummary', !preferences.weeklySummary)}
              disabled={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationSettings;
