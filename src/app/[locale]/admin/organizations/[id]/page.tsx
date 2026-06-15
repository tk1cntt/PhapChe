'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Organization {
  id: string;
  name: string;
  tenantId: string;
  tenant?: { id: string; name: string };
  businessType: string | null;
  registrationNumber: string | null;
  address: string | null;
  contactEmail: string | null;
  status: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  workspaces?: { id: string; name: string; slug: string }[];
  _count?: {
    workspaces: number;
  };
}

interface ApiResponse {
  data: Organization;
}

export default function AdminOrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('AdminOrganizations');
  const tCommon = useTranslations('Common');

  const organizationId = params.id as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    businessType: '',
    contactEmail: '',
    address: '',
    status: 'active',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/sign-in');
          return;
        }
        if (response.status === 404) {
          setError('Organization not found');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch organization');
      }

      const data: ApiResponse = await response.json();
      setOrganization(data.data);
      setFormData({
        name: data.data.name,
        registrationNumber: data.data.registrationNumber || '',
        businessType: data.data.businessType || '',
        contactEmail: data.data.contactEmail || '',
        address: data.data.address || '',
        status: data.data.status,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load organization';
      setError(errorMessage);
      console.error('Error fetching organization:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          registrationNumber: formData.registrationNumber,
          businessType: formData.businessType || undefined,
          contactEmail: formData.contactEmail || undefined,
          address: formData.address || undefined,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update organization');
      }

      setIsEditing(false);
      fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete organization');
      }

      const locale = window.location.pathname.split('/')[1] || 'vi';
      router.push(`/${locale}/admin/organizations`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete organization';
      setError(errorMessage);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#64748b]">{tCommon('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border rounded-[15px] p-8">
        <div className="flex items-center gap-3 text-red-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong className="block">{tCommon('error')}</strong>
            <span className="text-sm text-red-500">{error}</span>
          </div>
        </div>
        <button
          onClick={() => fetchData()}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => {
            const locale = window.location.pathname.split('/')[1] || 'vi';
            router.push(`/${locale}/admin/organizations`);
          }}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('back')}
        </button>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-teal-700 font-bold text-xl">
                {organization.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#020617', marginBottom: 4 }}>
                {organization.name}
              </h1>
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(organization.status)}`}>
                  {organization.status}
                </span>
                {organization.isDefault && (
                  <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">
                    {t('default')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!organization.isDefault && (
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {t('delete')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: organization.name,
                        registrationNumber: organization.registrationNumber || '',
                        businessType: organization.businessType || '',
                        contactEmail: organization.contactEmail || '',
                        address: organization.address || '',
                        status: organization.status,
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? tCommon('saving') : t('save')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-[15px] p-6" style={{ borderColor: '#dfe7f1', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)' }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('organizationInfo')}</h2>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('formName')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('formBusinessType')}</label>
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('formContactEmail')}</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('formAddress')}</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('formStatus')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="active">{t('statusActive')}</option>
                    <option value="inactive">{t('statusInactive')}</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">{t('formName')}</div>
                    <div className="text-sm font-medium text-gray-900">{organization.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{t('formBusinessType')}</div>
                    <div className="text-sm font-medium text-gray-900">{organization.businessType || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{t('formContactEmail')}</div>
                    <div className="text-sm font-medium text-gray-900">{organization.contactEmail || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{t('formAddress')}</div>
                    <div className="text-sm font-medium text-gray-900">{organization.address || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{t('formRegistrationNumber')}</div>
                    <div className="text-sm font-medium text-gray-900">{organization.registrationNumber || '-'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white border rounded-[15px] p-6" style={{ borderColor: '#dfe7f1', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)' }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('statistics')}</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">{t('workspaces')}</div>
                <div className="text-lg font-semibold text-gray-900">{organization._count?.workspaces || 0}</div>
              </div>
            </div>
          </div>

          {/* Workspaces List */}
          {organization.workspaces && organization.workspaces.length > 0 && (
            <div className="bg-white border rounded-[15px] p-6" style={{ borderColor: '#dfe7f1', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)' }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('recentWorkspaces')}</h2>
              <div className="space-y-3">
                {organization.workspaces.slice(0, 5).map((ws) => (
                  <div key={ws.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-700 font-semibold text-xs">
                        {ws.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{ws.name}</div>
                      <div className="text-xs text-gray-500">{ws.slug}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white border rounded-[15px] p-6" style={{ borderColor: '#dfe7f1', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)' }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('metadata')}</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500">{t('createdAt')}</div>
                <div className="text-gray-900">{new Date(organization.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">{t('updatedAt')}</div>
                <div className="text-gray-900">{new Date(organization.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
