'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Clock, ExternalLink } from 'lucide-react';
import Paging from '@/components/ui/Paging';
import { FormattedDate } from '@/components/shared/ui/FormattedDate';

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

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      'auth.login': t('auditActionLogin'),
      'auth.logout': t('auditActionLogout'),
      'profile.updated': t('auditActionProfileUpdated'),
      'settings.changed': t('auditActionSettingsChanged'),
      'request.status_changed': t('auditActionRequestStatusChanged'),
      'intake.submitted': t('auditActionIntakeSubmitted'),
      'document.uploaded': t('auditActionDocumentUploaded'),
      'document.viewed': t('auditActionDocumentViewed'),
      'request.created': t('auditActionRequestCreated'),
      'request.updated': t('auditActionRequestUpdated'),
      'request.assigned': t('auditActionRequestAssigned'),
      'workflow.transition': t('auditActionWorkflowTransition'),
      'partner.comment_added': t('auditActionPartnerComment'),
      'login.success': t('auditActionLoginSuccess'),
    };
    if (actionMap[action]) return actionMap[action];
    return action
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatMetadata = (raw: string): string => {
    const labelMap: Record<string, string> = {
      domain: t('metaDomain'),
      service: t('metaService'),
      priority: t('metaPriority'),
      answers: t('metaAnswers'),
      files: t('metaFiles'),
      requestCode: t('metaRequestCode'),
      documentName: t('metaDocumentName'),
      partnerName: t('metaPartnerName'),
    };
    // Parse "key=value; key=value" format
    const pairs = raw.split(';').map((s) => s.trim()).filter(Boolean);
    return pairs
      .map((p) => {
        const eqIdx = p.indexOf('=');
        if (eqIdx === -1) return p;
        const key = p.slice(0, eqIdx).trim();
        const value = p.slice(eqIdx + 1).trim();
        const label = labelMap[key] || key;
        return `${label}: ${value}`;
      })
      .join(' · ');
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
                    <span className="audit-meta">{formatMetadata(event.metadataSummary)}</span>
                  )}
                </div>
                <div className="audit-time">
                  <Clock size={14} />
                  <FormattedDate date={event.createdAt} variant="datetime" />
                </div>
              </div>
            ))}
          </div>

          <Paging
            current={current}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            totalLabel={t('auditEventCount', { count: total })}
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
