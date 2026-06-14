'use client';

import { useTranslations } from 'next-intl';
import { DocumentItem } from './DashboardClient';

interface RecentDocumentsProps {
  documents: DocumentItem[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  };
  return map[mimeType] || 'FILE';
}

const statusBadgeClass: Record<string, string> = {
  ACTIVE: 'badge green',
  PENDING: 'badge orange',
  ARCHIVED: 'badge blue',
  ENCRYPTED: 'badge green',
};

export default function RecentDocuments({ documents }: RecentDocumentsProps) {
  const t = useTranslations('RecentDocuments');

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7h18v13H3z" />
            <path d="M3 7l3-4h12l3 4" />
          </svg>
          <span>{t('title')}</span>
        </div>
        <a className="small-link" href="#">{t('openVault')}</a>
      </div>

      <div className="document-list">
        {documents.length === 0 ? (
          <div className="empty-state">{t('empty')}</div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="document-item">
              <div className="document-left">
                <div className="file-icon">{getFileExtension(doc.mimeType)}</div>
                <div className="file-info">
                  <strong>{doc.filename}</strong>
                  <span>{formatFileSize(doc.size)} · {t('updatedAt')} {doc.relativeTime}</span>
                </div>
              </div>
              <span className={statusBadgeClass[doc.status] || 'badge blue'}>
                {doc.status === 'ACTIVE' && t('statusActive')}
                {doc.status === 'PENDING' && t('statusPending')}
                {doc.status === 'ARCHIVED' && t('statusArchived')}
                {doc.status === 'ENCRYPTED' && t('statusEncrypted')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
