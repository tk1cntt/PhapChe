import { notFound } from 'next/navigation';
import type { RequestStatus } from '@/lib/types';
import { Tag, Button, Card } from 'antd';
import { getCustomerDeliveryRequest } from '@/lib/delivery/delivery-service';
import { requestVaultFileAccess } from '@/lib/documents/vault-service';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import './request-detail.css';

const statusTones: Record<RequestStatus, 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline'> = {
  draft_intake: 'neutral',
  intake_submitted: 'info',
  triage: 'warning',
  assigned: 'info',
  in_progress: 'info',
  pending_review: 'warning',
  revision_required: 'warning',
  approved: 'accent',
  delivered: 'outline',
  closed: 'neutral',
  cancelled: 'destructive',
};

function toneToTagColor(tone: string): string {
  switch (tone) {
    case 'neutral': return 'default';
    case 'info': return 'blue';
    case 'warning': return 'orange';
    case 'accent': return 'cyan';
    case 'destructive': return 'red';
    case 'outline': return 'default';
    default: return 'default';
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default async function CustomerRequestDeliveryPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const session = await requireAppSession();
  const t = await getTranslations('RequestDetail');
  let request;

  try {
    request = await getCustomerDeliveryRequest(session, requestId);
  } catch (error) {
    if (error instanceof Error && (error.message === 'FORBIDDEN' || error.message === 'REQUEST_NOT_FOUND')) notFound();
    throw error;
  }

  const statusTone = statusTones[request.status];

  const downloadLinks = await Promise.all(
    request.documents.map(async (document) => {
      try {
        if (document.vaultFileId) {
          const access = await requestVaultFileAccess(session, document.vaultFileId);
          return access.accessUrl;
        }
      } catch {
        // Fall through to bare path
      }
      return `/api/vault/${document.vaultFileId}/download`;
    }),
  );

  return (
    <div className="request-detail-page">
      <div className="page-header">
        <h1>{t('pageTitle')}</h1>
        <p className="subtitle">{t('pageDescription')}</p>
      </div>

      <Card className="info-card" styles={{ body: { padding: 16 } }}>
        <div className="request-header">
          <div>
            <p className="request-title-label">{t('requestLabel')}</p>
            <h2 className="request-title">{request.title}</h2>
          </div>
          <Tag color={toneToTagColor(statusTone)}>{t(`status_${request.status}`)}</Tag>
        </div>
        <div className="info-grid">
          <div className="info-box">
            <p className="info-label">{t('matterTypeLabel')}</p>
            <p className="info-value">{request.matterTypeKey ?? t('noMatterType')}</p>
          </div>
          <div className="info-box">
            <p className="info-label">{t('createdAtLabel')}</p>
            <p className="info-value">{formatDate(request.createdAt)}</p>
          </div>
        </div>
      </Card>

      <Card className="documents-card" styles={{ body: { padding: 16 } }}>
        <h3 className="documents-title">{t('finalDocumentsTitle')}</h3>
        {request.documents.length === 0 ? (
          <div className="empty-state">
            <h4 className="empty-state-title">{t('noDocumentsTitle')}</h4>
            <p className="empty-state-desc">{t('noDocumentsDesc')}</p>
          </div>
        ) : (
          <div className="document-list">
            {request.documents.map((document, idx) => (
              <div key={document.documentVersionId} className="document-item">
                <div>
                  <p className="document-name">{document.filename ?? document.documentTitle}</p>
                  <p className="document-version">{t('templateVersion', { version: document.templateVersion })}</p>
                  <p className="document-date">{t('createdAt')}: {formatDate(document.createdAt)}</p>
                </div>
                <a href={downloadLinks[idx]}>
                  <Button type="primary">{t('downloadBtn')}</Button>
                </a>
              </div>
            ))}
          </div>
        )}
        <p className="download-note">{t('downloadNote')}</p>
      </Card>
    </div>
  );
}
