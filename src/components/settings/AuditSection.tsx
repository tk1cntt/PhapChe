'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Clock, ExternalLink } from 'lucide-react';

export interface AuditSectionProps {
  userId: string;
}

interface AuditEvent {
  id: string;
  action: string;
  createdAt: string;
  metadataSummary: string | null;
}

export function AuditSection({ userId }: AuditSectionProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditEvents();
  }, [userId]);

  const fetchAuditEvents = async () => {
    try {
      const response = await fetch('/api/settings/audit');
      if (!response.ok) throw new Error('Failed to fetch audit events');

      const data = await response.json();
      if (data.data) {
        setEvents(data.data.slice(0, 10)); // Limit to 10 recent events
      }
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
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

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      'auth.login': 'Đăng nhập',
      'auth.logout': 'Đăng xuất',
      'profile.updated': 'Cập nhật hồ sơ',
      'settings.changed': 'Thay đổi cài đặt',
    };
    return actionMap[action] || action;
  };

  return (
    <div className="form-section">
      <div className="form-section-header">
        <Shield size={20} />
        <h3>{t('auditTitle')}</h3>
      </div>
      <p className="section-description">{t('auditDesc')}</p>

      {loading ? (
        <div className="audit-loading">
          <Clock size={20} />
          <span>{t('loading')}</span>
        </div>
      ) : events.length === 0 ? (
        <div className="audit-empty">
          <span>{t('noAuditEvents')}</span>
        </div>
      ) : (
        <div className="audit-list">
          {events.map((event) => (
            <div key={event.id} className="audit-item">
              <div className="audit-icon">
                <Shield size={16} />
              </div>
              <div className="audit-content">
                <span className="audit-action">{getActionLabel(event.action)}</span>
                {event.metadataSummary && (
                  <span className="audit-meta">{event.metadataSummary}</span>
                )}
              </div>
              <div className="audit-time">
                <Clock size={14} />
                {formatDate(event.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="view-all-btn">
        <span>{t('viewAllAudit')}</span>
        <ExternalLink size={16} />
      </button>
    </div>
  );
}

export default AuditSection;
