'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusUpdateForm } from '@/components/partners/ui/StatusUpdateForm';
import { CommentList } from '@/components/partners/ui/CommentList';
import { CommentForm } from '@/components/partners/ui/CommentForm';
import { DocumentList } from '@/components/partners/ui/DocumentList';
import { DocumentUpload } from '@/components/partners/ui/DocumentUpload';
import { REQUEST_STATUS_LABELS } from '@/lib/constants/partner-statuses';

interface PartnerRequest {
  id: string;
  status: string;
  statusNote?: string | null;
  title: string;
  description?: string;
  assignedPartner?: { id: string; name: string };
  engagement?: {
    partnerId: string;
    partner: { name: string };
  };
  customer?: { id: string; name: string; email: string };
  workspace?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export default function AdminPartnerDetailPage() {
  const t = useTranslations('AdminPartner');
  const tCommon = useTranslations('Common');
  const tStatus = useTranslations('RequestStatus');
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<PartnerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchRequest();
  }, [requestId, refreshKey]);

  const fetchRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/partner/requests/${requestId}`);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/sign-in');
          return;
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || 'Failed to fetch request');
      }

      const data = await res.json();
      setRequest(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch request');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setRefreshKey(k => k + 1);
  };

  const getPartnerName = () => {
    if (!request) return '-';
    if (request.assignedPartner?.name) return request.assignedPartner.name;
    if (request.engagement?.partner?.name) return request.engagement.partner.name;
    return '-';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-[15px] p-8 flex items-center justify-center">
        <div className="text-[#64748b]">{tCommon('loading')}</div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-white border rounded-[15px] p-8">
        <div className="flex items-center gap-3 text-red-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong className="block">{tCommon('error')}</strong>
            <span className="text-sm text-red-500">{error || 'Request not found'}</span>
          </div>
        </div>
        <button
          onClick={() => fetchRequest()}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border rounded-[15px] p-6" style={{ borderColor: '#dfe7f1', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)' }}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {request.title || t('defaultTitle') || 'Partner Request'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ID: {request.id} • Partner: {getPartnerName()}
            </p>
          </div>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
            {REQUEST_STATUS_LABELS[request.status] || request.status}
          </span>
        </div>

        {request.description && (
          <p className="mt-4 text-gray-600">{request.description}</p>
        )}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{t('colCustomer')}:</span>
            <span className="ml-2 text-gray-900">{request.customer?.name || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('colWorkspace') || 'Workspace'}:</span>
            <span className="ml-2 text-gray-900">{request.workspace?.name || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('colCreated') || 'Created'}:</span>
            <span className="ml-2 text-gray-900">{new Date(request.createdAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('colUpdated')}:</span>
            <span className="ml-2 text-gray-900">{new Date(request.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Status Override Section */}
      <div className="bg-white border rounded-[15px] p-6" style={{ borderColor: '#dfe7f1', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)' }}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('statusOverride')}
        </h2>
        <StatusUpdateForm
          requestId={requestId}
          currentStatus={request.status}
          onSuccess={handleSuccess}
          isAdmin={true}
          allowAllStatuses={true}
        />
      </div>

      {/* Comments Section */}
      <div className="bg-white border rounded-[15px] p-6" style={{ borderColor: '#dfe7f1', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)' }}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('comments')}
        </h2>
        <CommentList requestId={requestId} />
        <div className="mt-4 pt-4 border-t">
          <CommentForm
            requestId={requestId}
            onSuccess={handleSuccess}
          />
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white border rounded-[15px] p-6" style={{ borderColor: '#dfe7f1', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)' }}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('documents')}
        </h2>
        <DocumentList requestId={requestId} />
        <div className="mt-4 pt-4 border-t">
          <DocumentUpload
            requestId={requestId}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
