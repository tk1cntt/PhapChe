'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Badge } from './Badge';

interface Document {
  id: string;
  filename: string;
  size: string;
  updatedAt: string;
  status: 'encrypted' | 'pending' | 'approved' | 'nda';
}

export interface DocumentPanelProps {
  documents: Document[];
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
}

function getStatusVariant(status: Document['status']): BadgeProps['variant'] {
  switch (status) {
    case 'encrypted':
      return 'green';
    case 'pending':
      return 'orange';
    case 'approved':
      return 'blue';
    case 'nda':
      return 'blue';
    default:
      return 'blue';
  }
}

function getStatusLabel(status: Document['status']): string {
  switch (status) {
    case 'encrypted':
      return 'encrypted';
    case 'pending':
      return 'pending';
    case 'approved':
      return 'done';
    case 'nda':
      return 'NDA';
    default:
      return status;
  }
}

type BadgeProps = {
  variant: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  children: React.ReactNode;
};

export function DocumentPanel({ documents }: DocumentPanelProps): React.ReactElement {
  const t = useTranslations('UserDashboard');
  const tCommon = useTranslations('Common');

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">{t('recentDocs')}</div>
        <Link href="/customer/vault" className="small-link">
          {t('openVault')} <span>→</span>
        </Link>
      </div>
      <div className="document-list">
        {documents.length === 0 ? (
          <div className="empty-state">{t('noRecentDocuments')}</div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="document-item">
              <div className="document-left">
                <div className="file-icon">
                  {getFileExtension(doc.filename)}
                </div>
                <div className="file-info">
                  <strong>{doc.filename}</strong>
                  <span>{doc.size} · {doc.updatedAt}</span>
                </div>
              </div>
              <Badge variant={getStatusVariant(doc.status)}>
                {getStatusLabel(doc.status) === 'NDA' ? 'NDA' : tCommon(getStatusLabel(doc.status) as 'encrypted' | 'pending' | 'done')}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DocumentPanel;
