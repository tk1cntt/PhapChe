'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Clock, ExternalLink } from 'lucide-react';
import Paging from '@/components/ui/Paging';

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
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchAuditEvents = useCallback(async (page: number, size: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/settings/audit?page=${page}&pageSize=${size}`);
      if (!response.ok) throw new Error('Failed to fetch audit events');

      const data = await response.json();
      if (data.data) {
        setEvents(data.data);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditEvents(current, pageSize);
  }, [userId, current, pageSize, fetchAuditEvents]);

  const handlePageChange = (page: number, size: number) => {
    setCurrent(page);
    setPageSize(size);
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
        <>
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

          <Paging
            current={current}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            totalLabel={`${total} sự kiện`}
          />
        </>
      )}

      <button className="view-all-btn">
        <span>{t('viewAllAudit')}</span>
        <ExternalLink size={16} />
      </button>
    </div>
  );
}

export default AuditSection;
