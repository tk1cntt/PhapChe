'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusUpdateForm } from '@/components/partners/ui/StatusUpdateForm';
import { CommentList } from '@/components/partners/ui/CommentList';
import { CommentForm } from '@/components/partners/ui/CommentForm';
import { DocumentList } from '@/components/partners/ui/DocumentList';
import { DocumentUpload } from '@/components/partners/ui/DocumentUpload';
import { REQUEST_STATUS_LABELS } from '@/lib/constants';

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
  const t = useTranslations();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<PartnerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchRequest();
  }, [requestId, refreshKey]);

  const fetchRequest = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/partner/requests/${requestId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to fetch request');
      }

      setRequest(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Request not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {request.title || 'Partner Request'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ID: {request.id} • Partner: {getPartnerName()}
            </p>
          </div>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            request.status === 'completed' ? 'bg-green-100 text-green-800' :
            request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {REQUEST_STATUS_LABELS[request.status] || request.status}
          </span>
        </div>

        {request.description && (
          <p className="mt-4 text-gray-600">{request.description}</p>
        )}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Customer:</span>
            <span className="ml-2 text-gray-900">{request.customer?.name || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Workspace:</span>
            <span className="ml-2 text-gray-900">{request.workspace?.name || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="ml-2 text-gray-900">{new Date(request.createdAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Updated:</span>
            <span className="ml-2 text-gray-900">{new Date(request.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Status Override Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('admin.partner.statusOverride') || 'Status Override'}
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('admin.partner.comments') || 'Comments'}
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('admin.partner.documents') || 'Documents'}
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
