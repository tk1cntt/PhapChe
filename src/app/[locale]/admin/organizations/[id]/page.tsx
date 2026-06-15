'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2 } from 'lucide-react';
import './organization-detail.css';

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

const badgeStyles: Record<string, { bg: string; color: string; dot: string }> = {
  active: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981' },
  inactive: { bg: '#f1f5f9', color: '#64748b', dot: '#64748b' },
  pending: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316' },
};

function StatusBadge({ status }: { status: string }) {
  const style = badgeStyles[status] || badgeStyles.inactive;
  const labels: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
  };
  return (
    <span
      className="status-badge"
      style={{ background: style.bg, color: style.color }}
    >
      <span className="status-dot" style={{ background: style.dot }} />
      {labels[status] || status}
    </span>
  );
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

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="loading-text">{tCommon('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-error">
        <div className="error-icon">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="error-title">{tCommon('error')}</div>
        <div className="error-message">{error}</div>
        <button onClick={() => fetchData()} className="btn-retry">
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div>
      {/* Header */}
      <div className="detail-header">
        <button
          onClick={() => {
            const locale = window.location.pathname.split('/')[1] || 'vi';
            router.push(`/${locale}/admin/organizations`);
          }}
          className="back-link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('back')}
        </button>

        <div className="detail-header-content">
          <div className="org-info">
            <div className="org-avatar">
              <Building2 size={28} color="#0f766e" />
            </div>
            <div className="org-details">
              <h1>{organization.name}</h1>
              <div className="org-badges">
                <StatusBadge status={organization.status} />
                {organization.isDefault && (
                  <span
                    className="default-badge"
                    style={{
                      background: '#ccfbf1',
                      color: '#0f766e',
                    }}
                  >
                    {t('default')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!organization.isDefault && (
            <div className="detail-actions">
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="btn-edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t('edit')}
                  </button>
                  <button onClick={handleDelete} className="btn-delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
                    className="btn-edit"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-save"
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
      <div className="detail-content">
        {/* Main Info */}
        <div>
          <div className="detail-card">
            <h2>{t('organizationInfo')}</h2>

            {isEditing ? (
              <div className="edit-form">
                <div className="form-field">
                  <label>{t('formName')} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>{t('formBusinessType')}</label>
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    placeholder={t('formBusinessTypePlaceholder')}
                  />
                </div>
                <div className="form-field">
                  <label>{t('formRegistrationNumber')}</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder={t('formRegistrationNumberPlaceholder')}
                  />
                </div>
                <div className="form-field">
                  <label>{t('formContactEmail')}</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder={t('formContactEmailPlaceholder')}
                  />
                </div>
                <div className="form-field">
                  <label>{t('formAddress')}</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t('formAddressPlaceholder')}
                  />
                </div>
                <div className="form-field">
                  <label>{t('formStatus')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">{t('statusActive')}</option>
                    <option value="inactive">{t('statusInactive')}</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">{t('formName')}</div>
                  <div className="info-value">{organization.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t('formBusinessType')}</div>
                  <div className="info-value">{organization.businessType || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t('formContactEmail')}</div>
                  <div className="info-value">{organization.contactEmail || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t('formAddress')}</div>
                  <div className="info-value">{organization.address || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t('formRegistrationNumber')}</div>
                  <div className="info-value">{organization.registrationNumber || '—'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Stats */}
          <div className="detail-card">
            <h2>{t('statistics')}</h2>
            <div>
              <div className="stat-item">
                <div className="stat-label">{t('workspaces')}</div>
                <div className="stat-value">{organization._count?.workspaces || 0}</div>
              </div>
            </div>
          </div>

          {/* Workspaces List */}
          {organization.workspaces && organization.workspaces.length > 0 && (
            <div className="detail-card">
              <h2>{t('recentWorkspaces')}</h2>
              <div className="workspace-list">
                {organization.workspaces.slice(0, 5).map((ws) => (
                  <div
                    key={ws.id}
                    className="workspace-item"
                    onClick={() => {
                      const locale = window.location.pathname.split('/')[1] || 'vi';
                      router.push(`/${locale}/admin/workspaces/${ws.id}`);
                    }}
                  >
                    <div className="workspace-avatar">
                      <span>{ws.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="workspace-info">
                      <div className="workspace-name">{ws.name}</div>
                      <div className="workspace-slug">{ws.slug}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="detail-card">
            <h2>{t('metadata')}</h2>
            <div className="metadata-list">
              <div className="metadata-item">
                <div className="metadata-label">{t('createdAt')}</div>
                <div className="metadata-value">{new Date(organization.createdAt).toLocaleString()}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">{t('updatedAt')}</div>
                <div className="metadata-value">{new Date(organization.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
