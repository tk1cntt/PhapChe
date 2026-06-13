'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Clock, User, Building2 } from 'lucide-react';

interface AuditEvent {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  requestId: string | null;
  correlationId: string | null;
  metadataSummary: string | null;
  workspaceName: string | null;
  requestTitle: string | null;
  createdAt: string;
}

interface AuditSettingsProps {
  userId: string;
}

export function AuditSettings({ userId }: AuditSettingsProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAuditEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/audit');

      if (!response.ok) {
        throw new Error('Failed to fetch audit events');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setEvents(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAction = (action: string) => {
    // Convert action to readable format
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="audit-settings loading">
        <FileText size={20} />
        <span>{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audit-settings error">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-settings">
      <div className="settings-section">
        <div className="section-header">
          <FileText size={20} />
          <h3>{t('auditTitle')}</h3>
        </div>

        <p className="text-muted">{t('auditDesc')}</p>

        {events.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} className="empty-icon" />
            <p>{t('noAuditEvents')}</p>
          </div>
        ) : (
          <div className="audit-list">
            {events.map((event) => (
              <div key={event.id} className="audit-item">
                <div className="audit-icon">
                  <Clock size={16} />
                </div>
                <div className="audit-content">
                  <div className="audit-header">
                    <span className="audit-action">{formatAction(event.action)}</span>
                    <span className="audit-time">{formatDate(event.createdAt)}</span>
                  </div>
                  <div className="audit-meta">
                    {event.workspaceName && (
                      <span className="meta-item">
                        <Building2 size={14} />
                        {event.workspaceName}
                      </span>
                    )}
                    {event.requestTitle && (
                      <span className="meta-item">
                        <FileText size={14} />
                        {event.requestTitle}
                      </span>
                    )}
                  </div>
                  {event.metadataSummary && (
                    <div className="audit-details">
                      {event.metadataSummary}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditSettings;
